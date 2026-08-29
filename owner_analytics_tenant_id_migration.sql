-- MENU: owner analytics tenant scoping
-- Safe additive change. Does not weaken RLS.
-- Requires authenticated caller and an explicit membership-validated tenant.

create or replace function public.get_owner_analytics(
  p_days int default 7,
  p_tenant_id uuid default null
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

  if p_tenant_id is not null then
    select tm.tenant_id into v_tenant_id
    from public.tenant_members tm
    where tm.user_id = v_uid and tm.tenant_id = p_tenant_id
    limit 1;
    if v_tenant_id is null then
      raise exception 'tenant membership required';
    end if;
  else
    -- Backward-compatible fallback for single-tenant owners only.
    select tm.tenant_id into v_tenant_id
    from public.tenant_members tm
    where tm.user_id = v_uid
    order by tm.created_at
    limit 1;
    if v_tenant_id is null then
      raise exception 'no tenant membership';
    end if;
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

revoke all on function public.get_owner_analytics(int, uuid) from public;
grant execute on function public.get_owner_analytics(int, uuid) to authenticated;

-- Keep single-arg overload for older clients (maps to null tenant → first membership)
create or replace function public.get_owner_analytics(p_days int default 7)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  return public.get_owner_analytics(p_days, null);
end;
$$;

revoke all on function public.get_owner_analytics(int) from public;
grant execute on function public.get_owner_analytics(int) to authenticated;
