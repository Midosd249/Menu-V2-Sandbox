-- Public API security remediation: SECURITY INVOKER RPCs set a transaction-local context.
-- Anonymous base-table requests have no context and therefore return no rows / fail writes.
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
  select * into v_tenant from public.tenants where slug=lower(trim(p_tenant_slug)) limit 1;
  if not found then return null; end if;
  if v_branch_slug='' then
    select * into v_branch from public.branches where tenant_id=v_tenant.id and is_active=true order by created_at limit 1;
  else
    select * into v_branch from public.branches where tenant_id=v_tenant.id and slug=v_branch_slug and is_active=true limit 1;
  end if;
  if not found then return null; end if;
  perform set_config('app.public_branch_slug', v_branch.slug, true);
  select jsonb_build_object(
    'tenant',jsonb_build_object('id',v_tenant.id,'slug',v_tenant.slug,'name',v_tenant.name,'tagline',v_tenant.tagline,'logo_url',v_tenant.logo_url,'instagram_url',v_tenant.instagram_url,'whatsapp',v_tenant.whatsapp,'primary_color',v_tenant.primary_color,'secondary_color',v_tenant.secondary_color),
    'branch',jsonb_build_object('id',v_branch.id,'slug',v_branch.slug,'name',v_branch.name,'address',v_branch.address,'maps_url',v_branch.maps_url),
    'categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'sort_order',c.sort_order,'name_ar',c.name_ar,'name_en',c.name_en,'is_active',c.is_active) order by c.sort_order,c.name_ar) from public.categories c where c.tenant_id=v_tenant.id and c.is_active=true),'[]'::jsonb),
    'products',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'category_id',p.category_id,'sort_order',p.sort_order,'name_ar',p.name_ar,'name_en',p.name_en,'description_ar',p.description_ar,'description_en',p.description_en,'price',p.price,'currency',p.currency,'image_url',p.image_url,'calories',p.calories,'is_available',p.is_available,'is_featured',p.is_featured,'allergens',p.allergens) order by p.sort_order,p.name_ar) from public.products p join public.categories c on c.id=p.category_id and c.tenant_id=v_tenant.id and c.is_active=true where p.tenant_id=v_tenant.id and p.is_available=true),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.record_public_menu_event(p_tenant_slug text,p_branch_slug text,p_event_type text,p_product_id uuid default null)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_tenant_id uuid;
  v_branch_id uuid;
  v_product_tenant uuid;
begin
  perform set_config('app.public_tenant_slug', lower(trim(p_tenant_slug)), true);
  perform set_config('app.public_branch_slug', lower(trim(p_branch_slug)), true);
  if p_event_type not in ('visit','product_view') then raise exception 'invalid event type'; end if;
  select t.id into v_tenant_id from public.tenants t where t.slug=lower(trim(p_tenant_slug)) limit 1;
  if v_tenant_id is null then raise exception 'invalid tenant'; end if;
  select b.id into v_branch_id from public.branches b where b.tenant_id=v_tenant_id and b.slug=lower(trim(p_branch_slug)) and b.is_active=true limit 1;
  if v_branch_id is null then raise exception 'invalid branch'; end if;
  if p_event_type='product_view' then
    select p.tenant_id into v_product_tenant from public.products p join public.categories c on c.id=p.category_id and c.tenant_id=v_tenant_id and c.is_active=true where p.id=p_product_id and p.tenant_id=v_tenant_id and p.is_available=true limit 1;
    if v_product_tenant is null then raise exception 'invalid product'; end if;
  end if;
  insert into public.menu_events(tenant_id,branch_id,product_id,event_type) values(v_tenant_id,v_branch_id,p_product_id,p_event_type);
end;
$$;

revoke all on function public.get_public_menu(text,text) from public;
revoke all on function public.record_public_menu_event(text,text,text,uuid) from public;
grant execute on function public.get_public_menu(text,text) to anon,authenticated;
grant execute on function public.record_public_menu_event(text,text,text,uuid) to anon,authenticated;

drop policy if exists "public can read active tenants" on public.tenants;
drop policy if exists "public can read active branches" on public.branches;
drop policy if exists "public can read active categories" on public.categories;
drop policy if exists "public can read available products" on public.products;
drop policy if exists "public rpc can read tenants" on public.tenants;
drop policy if exists "public rpc can read branches" on public.branches;
drop policy if exists "public rpc can read categories" on public.categories;
drop policy if exists "public rpc can read products" on public.products;
create policy "public rpc can read tenants" on public.tenants for select to anon using (slug=current_setting('app.public_tenant_slug',true));
create policy "public rpc can read branches" on public.branches for select to anon using (tenant_id in (select t.id from public.tenants t where t.slug=current_setting('app.public_tenant_slug',true)) and slug=current_setting('app.public_branch_slug',true) and is_active=true);
create policy "public rpc can read categories" on public.categories for select to anon using (tenant_id in (select t.id from public.tenants t where t.slug=current_setting('app.public_tenant_slug',true)) and is_active=true);
create policy "public rpc can read products" on public.products for select to anon using (tenant_id in (select t.id from public.tenants t where t.slug=current_setting('app.public_tenant_slug',true)) and is_available=true);

drop policy if exists "public can record menu events" on public.menu_events;
create policy "public can record menu events" on public.menu_events for insert to anon with check (
  tenant_id in (select t.id from public.tenants t where t.slug=current_setting('app.public_tenant_slug',true))
  and branch_id in (select b.id from public.branches b where b.tenant_id=public.menu_events.tenant_id and b.slug=current_setting('app.public_branch_slug',true) and b.is_active=true)
  and (product_id is null or product_id in (select p.id from public.products p join public.categories c on c.id=p.category_id and c.tenant_id=public.menu_events.tenant_id and c.is_active=true where p.tenant_id=public.menu_events.tenant_id and p.is_available=true))
  and event_type in ('visit','product_view')
);
grant select on public.tenants,public.branches,public.categories,public.products to anon;
grant insert on public.menu_events to anon;
