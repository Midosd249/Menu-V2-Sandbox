-- MENU V1.1 commercial product migration
-- Safe additive changes. Does not weaken existing RLS or public RPC isolation.

-- Branding: cover/hero image
alter table public.tenants
  add column if not exists cover_url text;

-- Optional WhatsApp message template (Arabic default handled in app)
alter table public.tenants
  add column if not exists whatsapp_message_template text;

-- Language tracking on analytics events
alter table public.menu_events
  add column if not exists lang text check (lang is null or lang in ('ar','en'));

create index if not exists menu_events_tenant_day_idx
  on public.menu_events (tenant_id, created_at desc, event_type);

create index if not exists menu_events_product_views_idx
  on public.menu_events (tenant_id, product_id, event_type)
  where event_type = 'product_view';

-- Extend public event recorder to accept optional language (backward compatible)
create or replace function public.record_public_menu_event(
  p_tenant_slug text,
  p_branch_slug text,
  p_event_type text,
  p_product_id uuid default null,
  p_lang text default null
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_tenant_id uuid;
  v_branch_id uuid;
  v_product_tenant uuid;
  v_lang text := nullif(lower(trim(coalesce(p_lang,''))),'');
begin
  perform set_config('app.public_tenant_slug', lower(trim(p_tenant_slug)), true);
  perform set_config('app.public_branch_slug', lower(trim(p_branch_slug)), true);
  if p_event_type not in ('visit','product_view') then
    raise exception 'invalid event type';
  end if;
  if v_lang is not null and v_lang not in ('ar','en') then
    v_lang := null;
  end if;
  select t.id into v_tenant_id from public.tenants t where t.slug = lower(trim(p_tenant_slug)) limit 1;
  if v_tenant_id is null then raise exception 'invalid tenant'; end if;
  select b.id into v_branch_id
  from public.branches b
  where b.tenant_id = v_tenant_id and b.slug = lower(trim(p_branch_slug)) and b.is_active = true
  limit 1;
  if v_branch_id is null then raise exception 'invalid branch'; end if;
  if p_event_type = 'product_view' then
    select p.tenant_id into v_product_tenant
    from public.products p
    join public.categories c on c.id = p.category_id and c.tenant_id = v_tenant_id and c.is_active = true
    where p.id = p_product_id and p.tenant_id = v_tenant_id and p.is_available = true
    limit 1;
    if v_product_tenant is null then raise exception 'invalid product'; end if;
  end if;
  insert into public.menu_events(tenant_id, branch_id, product_id, event_type, lang)
  values (v_tenant_id, v_branch_id, p_product_id, p_event_type, v_lang);
end;
$$;

revoke all on function public.record_public_menu_event(text, text, text, uuid, text) from public;
grant execute on function public.record_public_menu_event(text, text, text, uuid, text) to anon, authenticated;

-- Keep 4-arg overload for older clients
create or replace function public.record_public_menu_event(
  p_tenant_slug text,
  p_branch_slug text,
  p_event_type text,
  p_product_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  perform public.record_public_menu_event(p_tenant_slug, p_branch_slug, p_event_type, p_product_id, null);
end;
$$;

revoke all on function public.record_public_menu_event(text, text, text, uuid) from public;
grant execute on function public.record_public_menu_event(text, text, text, uuid) to anon, authenticated;

-- Owner analytics RPC: membership-scoped, bounded date range, no cross-tenant leakage
create or replace function public.get_owner_analytics(
  p_days int default 7
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_tenant_id uuid;
  v_days int := greatest(1, least(coalesce(p_days, 7), 90));
  v_from timestamptz := date_trunc('day', now() at time zone 'Asia/Riyadh') - ((v_days - 1) || ' days')::interval;
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  select tm.tenant_id into v_tenant_id
  from public.tenant_members tm
  where tm.user_id = v_uid
  order by tm.created_at
  limit 1;
  if v_tenant_id is null then
    raise exception 'no tenant membership';
  end if;

  select jsonb_build_object(
    'tenant_id', v_tenant_id,
    'range_days', v_days,
    'from', v_from,
    'to', now(),
    'total_visits', (
      select count(*)::int from public.menu_events e
      where e.tenant_id = v_tenant_id and e.event_type = 'visit' and e.created_at >= v_from
    ),
    'total_product_views', (
      select count(*)::int from public.menu_events e
      where e.tenant_id = v_tenant_id and e.event_type = 'product_view' and e.created_at >= v_from
    ),
    'visits_by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'visits', d.visits) order by d.day)
      from (
        select to_char(date_trunc('day', e.created_at at time zone 'Asia/Riyadh'), 'YYYY-MM-DD') as day,
               count(*)::int as visits
        from public.menu_events e
        where e.tenant_id = v_tenant_id and e.event_type = 'visit' and e.created_at >= v_from
        group by 1
      ) d
    ), '[]'::jsonb),
    'lang_split', coalesce((
      select jsonb_object_agg(coalesce(e.lang, 'unknown'), e.cnt)
      from (
        select lang, count(*)::int as cnt
        from public.menu_events
        where tenant_id = v_tenant_id and created_at >= v_from
        group by lang
      ) e
    ), '{}'::jsonb),
    'top_products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', t.product_id,
        'name_ar', t.name_ar,
        'name_en', t.name_en,
        'views', t.views
      ) order by t.views desc)
      from (
        select e.product_id, p.name_ar, p.name_en, count(*)::int as views
        from public.menu_events e
        join public.products p on p.id = e.product_id and p.tenant_id = v_tenant_id
        where e.tenant_id = v_tenant_id and e.event_type = 'product_view'
          and e.product_id is not null and e.created_at >= v_from
        group by e.product_id, p.name_ar, p.name_en
        order by count(*) desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'category_performance', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category_id', c.category_id,
        'name_ar', c.name_ar,
        'name_en', c.name_en,
        'views', c.views
      ) order by c.views desc)
      from (
        select p.category_id, cat.name_ar, cat.name_en, count(*)::int as views
        from public.menu_events e
        join public.products p on p.id = e.product_id and p.tenant_id = v_tenant_id
        join public.categories cat on cat.id = p.category_id and cat.tenant_id = v_tenant_id
        where e.tenant_id = v_tenant_id and e.event_type = 'product_view'
          and e.product_id is not null and e.created_at >= v_from
        group by p.category_id, cat.name_ar, cat.name_en
        order by count(*) desc
        limit 10
      ) c
    ), '[]'::jsonb),
    'branch_performance', coalesce((
      select jsonb_agg(jsonb_build_object(
        'branch_id', b.branch_id,
        'name', b.name,
        'slug', b.slug,
        'visits', b.visits
      ) order by b.visits desc)
      from (
        select e.branch_id, br.name, br.slug, count(*)::int as visits
        from public.menu_events e
        join public.branches br on br.id = e.branch_id and br.tenant_id = v_tenant_id
        where e.tenant_id = v_tenant_id and e.event_type = 'visit'
          and e.branch_id is not null and e.created_at >= v_from
        group by e.branch_id, br.name, br.slug
        order by count(*) desc
      ) b
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_owner_analytics(int) from public;
grant execute on function public.get_owner_analytics(int) to authenticated;

-- Ensure get_public_menu also returns cover_url when present
create or replace function public.get_public_menu(p_tenant_slug text, p_branch_slug text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_tenant public.tenants%rowtype;
  v_branch public.branches%rowtype;
  v_result jsonb;
  v_branch_slug text := lower(trim(coalesce(p_branch_slug,'')));
begin
  perform set_config('app.public_tenant_slug', lower(trim(p_tenant_slug)), true);
  perform set_config('app.public_branch_slug', v_branch_slug, true);
  select * into v_tenant from public.tenants where slug = lower(trim(p_tenant_slug)) limit 1;
  if not found then return null; end if;
  if v_branch_slug = '' then
    select * into v_branch from public.branches where tenant_id = v_tenant.id and is_active = true order by created_at limit 1;
  else
    select * into v_branch from public.branches where tenant_id = v_tenant.id and slug = v_branch_slug and is_active = true limit 1;
  end if;
  if not found then return null; end if;
  perform set_config('app.public_branch_slug', v_branch.slug, true);
  select jsonb_build_object(
    'tenant', jsonb_build_object(
      'id', v_tenant.id,
      'slug', v_tenant.slug,
      'name', v_tenant.name,
      'tagline', v_tenant.tagline,
      'logo_url', v_tenant.logo_url,
      'cover_url', v_tenant.cover_url,
      'instagram_url', v_tenant.instagram_url,
      'whatsapp', v_tenant.whatsapp,
      'whatsapp_message_template', v_tenant.whatsapp_message_template,
      'primary_color', v_tenant.primary_color,
      'secondary_color', v_tenant.secondary_color
    ),
    'branch', jsonb_build_object(
      'id', v_branch.id,
      'slug', v_branch.slug,
      'name', v_branch.name,
      'address', v_branch.address,
      'maps_url', v_branch.maps_url
    ),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'sort_order', c.sort_order, 'name_ar', c.name_ar, 'name_en', c.name_en, 'is_active', c.is_active
      ) order by c.sort_order, c.name_ar)
      from public.categories c
      where c.tenant_id = v_tenant.id and c.is_active = true
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'category_id', p.category_id, 'sort_order', p.sort_order,
        'name_ar', p.name_ar, 'name_en', p.name_en,
        'description_ar', p.description_ar, 'description_en', p.description_en,
        'price', p.price, 'currency', p.currency, 'image_url', p.image_url,
        'calories', p.calories, 'is_available', p.is_available, 'is_featured', p.is_featured,
        'allergens', p.allergens
      ) order by p.sort_order, p.name_ar)
      from public.products p
      join public.categories c on c.id = p.category_id and c.tenant_id = v_tenant.id and c.is_active = true
      where p.tenant_id = v_tenant.id and p.is_available = true
    ), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.get_public_menu(text, text) from public;
grant execute on function public.get_public_menu(text, text) to anon, authenticated;
