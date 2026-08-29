-- Menu SaaS production schema
create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  logo_url text,
  instagram_url text,
  whatsapp text,
  primary_color text not null default '#15120f',
  secondary_color text not null default '#a26a42',
  created_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null,
  name text not null,
  address text,
  maps_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(tenant_id, slug)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sort_order int not null default 0,
  name_ar text not null,
  name_en text not null,
  is_active boolean not null default true
);

create table if not exists public.tenant_members (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner','admin','editor')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create table if not exists public.branch_hours (
  branch_id uuid not null references public.branches(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  primary key (branch_id, weekday)
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0,
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  price numeric(10,2) not null default 0,
  currency text not null default 'SAR',
  image_url text,
  calories int,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  allergens text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.menu_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  event_type text not null check (event_type in ('visit','product_view')),
  created_at timestamptz not null default now()
);

create index if not exists products_tenant_idx on public.products(tenant_id);
create index if not exists categories_tenant_idx on public.categories(tenant_id);
create index if not exists branches_tenant_idx on public.branches(tenant_id);
create index if not exists tenant_members_user_idx on public.tenant_members(user_id);
create index if not exists menu_events_tenant_idx on public.menu_events(tenant_id, created_at desc);
create index if not exists idx_menu_events_branch_id on public.menu_events(branch_id);
create index if not exists idx_menu_events_product_id on public.menu_events(product_id);
create index if not exists idx_products_category_id on public.products(category_id);

alter table public.tenants enable row level security;
alter table public.branches enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.tenant_members enable row level security;
alter table public.branch_hours enable row level security;
alter table public.menu_events enable row level security;

-- Public menu reads are scoped to active/published content. Dashboard writes are membership-scoped.
drop policy if exists "public can read active tenants" on public.tenants;
drop policy if exists "public can read active branches" on public.branches;
drop policy if exists "public can read active categories" on public.categories;
drop policy if exists "public can read available products" on public.products;
drop policy if exists "members can manage own tenants" on public.tenants;
drop policy if exists "members can manage own branches" on public.branches;
drop policy if exists "members can manage own categories" on public.categories;
drop policy if exists "members can manage own products" on public.products;
drop policy if exists "members can insert own tenants" on public.tenants;
drop policy if exists "members can update own tenants" on public.tenants;
drop policy if exists "members can delete own tenants" on public.tenants;
drop policy if exists "members can insert own branches" on public.branches;
drop policy if exists "members can update own branches" on public.branches;
drop policy if exists "members can delete own branches" on public.branches;
drop policy if exists "members can insert own categories" on public.categories;
drop policy if exists "members can update own categories" on public.categories;
drop policy if exists "members can delete own categories" on public.categories;
drop policy if exists "members can insert own products" on public.products;
drop policy if exists "members can update own products" on public.products;
drop policy if exists "members can delete own products" on public.products;
drop policy if exists "members can read memberships" on public.tenant_members;
drop policy if exists "members can read branch hours" on public.branch_hours;
drop policy if exists "members can manage branch hours" on public.branch_hours;
drop policy if exists "members can insert branch hours" on public.branch_hours;
drop policy if exists "members can update branch hours" on public.branch_hours;
drop policy if exists "members can delete branch hours" on public.branch_hours;
drop policy if exists "public can record menu events" on public.menu_events;
drop policy if exists "members can read own analytics" on public.menu_events;
create policy "public can read active tenants" on public.tenants for select using (true);
create policy "public can read active branches" on public.branches for select using (is_active = true);
create policy "public can read active categories" on public.categories for select using (is_active = true);
create policy "public can read available products" on public.products for select using (is_available = true);
create policy "members can insert own tenants" on public.tenants for insert to authenticated with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = id and tm.user_id=(select auth.uid())));
create policy "members can update own tenants" on public.tenants for update to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id = id and tm.user_id=(select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = id and tm.user_id=(select auth.uid())));
create policy "members can delete own tenants" on public.tenants for delete to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id = id and tm.user_id=(select auth.uid())));
create policy "members can insert own branches" on public.branches for insert to authenticated with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid())));
create policy "members can update own branches" on public.branches for update to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid())));
create policy "members can delete own branches" on public.branches for delete to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid())));
create policy "members can insert own categories" on public.categories for insert to authenticated with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid())));
create policy "members can update own categories" on public.categories for update to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid())));
create policy "members can delete own categories" on public.categories for delete to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid())));
create policy "members can insert own products" on public.products for insert to authenticated with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid())));
create policy "members can update own products" on public.products for update to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid())));
create policy "members can delete own products" on public.products for delete to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id=(select auth.uid())));
create policy "members can read memberships" on public.tenant_members for select using (user_id = (select auth.uid()));
create policy "members can read branch hours" on public.branch_hours for select using (exists(select 1 from public.branches b join public.tenant_members tm on tm.tenant_id=b.tenant_id where b.id=branch_id and tm.user_id=(select auth.uid())));
create policy "members can insert branch hours" on public.branch_hours for insert to authenticated with check (exists(select 1 from public.branches b join public.tenant_members tm on tm.tenant_id=b.tenant_id where b.id=branch_id and tm.user_id=(select auth.uid())));
create policy "members can update branch hours" on public.branch_hours for update to authenticated using (exists(select 1 from public.branches b join public.tenant_members tm on tm.tenant_id=b.tenant_id where b.id=branch_id and tm.user_id=(select auth.uid()))) with check (exists(select 1 from public.branches b join public.tenant_members tm on tm.tenant_id=b.tenant_id where b.id=branch_id and tm.user_id=(select auth.uid())));
create policy "members can delete branch hours" on public.branch_hours for delete to authenticated using (exists(select 1 from public.branches b join public.tenant_members tm on tm.tenant_id=b.tenant_id where b.id=branch_id and tm.user_id=(select auth.uid())));
create policy "public can record menu events" on public.menu_events for insert with check (event_type in ('visit','product_view'));
create policy "members can read own analytics" on public.menu_events for select using (exists(select 1 from public.tenant_members tm where tm.tenant_id=tenant_id and tm.user_id=(select auth.uid())));
insert into storage.buckets (id, name, public) values ('menu-assets','menu-assets',true) on conflict (id) do nothing;
insert into public.tenants (slug, name, tagline, instagram_url, whatsapp) values
('oaza', 'Oaza Coffee', 'Demo portfolio tenant — قهوة مختصة • الرياض', 'https://instagram.com/oaza.ksa', '+966566332329'),
('juniper', 'Juniper Roasters', 'Demo portfolio tenant — تحميص محلي', null, null),
('mirage', 'Mirage Kitchen', 'Demo portfolio tenant — نكهات سعودية', null, null)
on conflict (slug) do nothing;

-- Storage policies: public image reads; authenticated members can only manage paths prefixed by their tenant UUID.
drop policy if exists "public read menu assets" on storage.objects;
drop policy if exists "members upload menu assets" on storage.objects;
drop policy if exists "members update menu assets" on storage.objects;
drop policy if exists "members delete menu assets" on storage.objects;
create policy "public read menu assets" on storage.objects for select using (bucket_id = 'menu-assets');
create policy "members upload menu assets" on storage.objects for insert to authenticated with check (bucket_id = 'menu-assets' and exists (select 1 from public.tenant_members tm where tm.user_id = (select auth.uid()) and tm.tenant_id::text = split_part(name,'/',1)));
create policy "members update menu assets" on storage.objects for update to authenticated using (bucket_id = 'menu-assets' and exists (select 1 from public.tenant_members tm where tm.user_id = (select auth.uid()) and tm.tenant_id::text = split_part(name,'/',1))) with check (bucket_id = 'menu-assets' and exists (select 1 from public.tenant_members tm where tm.user_id = (select auth.uid()) and tm.tenant_id::text = split_part(name,'/',1)));
create policy "members delete menu assets" on storage.objects for delete to authenticated using (bucket_id = 'menu-assets' and exists (select 1 from public.tenant_members tm where tm.user_id = (select auth.uid()) and tm.tenant_id::text = split_part(name,'/',1)));

-- AL MAS portfolio data is reproducible via almas-seed.sql; it intentionally uses price 0 to render "price on request" until confirmed.

-- Security remediation: anonymous public menu access is RPC-only; admin table reads are membership-scoped.
create or replace function public.get_public_menu(p_tenant_slug text, p_branch_slug text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_tenant public.tenants%rowtype; v_branch public.branches%rowtype; v_result jsonb;
begin
  select * into v_tenant from public.tenants where slug=lower(trim(p_tenant_slug)) limit 1;
  if not found then return null; end if;
  if nullif(trim(p_branch_slug),'') is null then
    select * into v_branch from public.branches where tenant_id=v_tenant.id and is_active=true order by created_at limit 1;
  else
    select * into v_branch from public.branches where tenant_id=v_tenant.id and slug=lower(trim(p_branch_slug)) and is_active=true limit 1;
  end if;
  if not found then return null; end if;
  select jsonb_build_object(
    'tenant',jsonb_build_object('id',v_tenant.id,'slug',v_tenant.slug,'name',v_tenant.name,'tagline',v_tenant.tagline,'logo_url',v_tenant.logo_url,'instagram_url',v_tenant.instagram_url,'whatsapp',v_tenant.whatsapp,'primary_color',v_tenant.primary_color,'secondary_color',v_tenant.secondary_color),
    'branch',jsonb_build_object('id',v_branch.id,'slug',v_branch.slug,'name',v_branch.name,'address',v_branch.address,'maps_url',v_branch.maps_url),
    'categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'sort_order',c.sort_order,'name_ar',c.name_ar,'name_en',c.name_en,'is_active',c.is_active) order by c.sort_order,c.name_ar) from public.categories c where c.tenant_id=v_tenant.id and c.is_active=true),'[]'::jsonb),
    'products',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'category_id',p.category_id,'sort_order',p.sort_order,'name_ar',p.name_ar,'name_en',p.name_en,'description_ar',p.description_ar,'description_en',p.description_en,'price',p.price,'currency',p.currency,'image_url',p.image_url,'calories',p.calories,'is_available',p.is_available,'is_featured',p.is_featured,'allergens',p.allergens) order by p.sort_order,p.name_ar) from public.products p join public.categories c on c.id=p.category_id and c.tenant_id=v_tenant.id and c.is_active=true where p.tenant_id=v_tenant.id and p.is_available=true),'[]'::jsonb)
  ) into v_result;
  return v_result;
end; $$;
create or replace function public.record_public_menu_event(p_tenant_slug text,p_branch_slug text,p_event_type text,p_product_id uuid default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_tenant_id uuid; v_branch_id uuid; v_product_tenant uuid;
begin
  if p_event_type not in ('visit','product_view') then raise exception 'invalid event type'; end if;
  select id into v_tenant_id from public.tenants where slug=lower(trim(p_tenant_slug)) limit 1;
  if v_tenant_id is null then raise exception 'invalid tenant'; end if;
  select b.id into v_branch_id from public.branches b where b.tenant_id=v_tenant_id and b.slug=lower(trim(p_branch_slug)) and b.is_active=true limit 1;
  if v_branch_id is null then raise exception 'invalid branch'; end if;
  if p_event_type='product_view' then
    select p.tenant_id into v_product_tenant from public.products p join public.categories c on c.id=p.category_id and c.tenant_id=v_tenant_id and c.is_active=true where p.id=p_product_id and p.tenant_id=v_tenant_id and p.is_available=true limit 1;
    if v_product_tenant is null then raise exception 'invalid product'; end if;
  end if;
  insert into public.menu_events(tenant_id,branch_id,product_id,event_type) values(v_tenant_id,v_branch_id,p_product_id,p_event_type);
end; $$;
revoke all on function public.get_public_menu(text,text) from public;
revoke all on function public.record_public_menu_event(text,text,text,uuid) from public;
grant execute on function public.get_public_menu(text,text) to anon,authenticated;
grant execute on function public.record_public_menu_event(text,text,text,uuid) to anon,authenticated;
drop policy if exists "public can read active tenants" on public.tenants;
drop policy if exists "public can read active branches" on public.branches;
drop policy if exists "public can read active categories" on public.categories;
drop policy if exists "public can read available products" on public.products;
drop policy if exists "members can read own tenants" on public.tenants;
drop policy if exists "members can read own branches" on public.branches;
drop policy if exists "members can read own categories" on public.categories;
drop policy if exists "members can read own products" on public.products;
create policy "members can read own tenants" on public.tenants for select to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id=id and tm.user_id=(select auth.uid())));
create policy "members can read own branches" on public.branches for select to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id=tenant_id and tm.user_id=(select auth.uid())));
create policy "members can read own categories" on public.categories for select to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id=tenant_id and tm.user_id=(select auth.uid())));
create policy "members can read own products" on public.products for select to authenticated using (exists(select 1 from public.tenant_members tm where tm.tenant_id=tenant_id and tm.user_id=(select auth.uid())));
revoke select on public.tenants,public.branches,public.categories,public.products from anon;
revoke insert on public.menu_events from anon,authenticated;
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
-- Fix authenticated RLS predicates that must compare against the outer row's tenant_id.
drop policy if exists "members can read own branches" on public.branches;
drop policy if exists "members can insert own branches" on public.branches;
drop policy if exists "members can update own branches" on public.branches;
drop policy if exists "members can delete own branches" on public.branches;
create policy "members can read own branches" on public.branches for select to authenticated using (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.branches.tenant_id and tm.user_id=(select auth.uid())));
create policy "members can insert own branches" on public.branches for insert to authenticated with check (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.branches.tenant_id and tm.user_id=(select auth.uid())));
create policy "members can update own branches" on public.branches for update to authenticated using (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.branches.tenant_id and tm.user_id=(select auth.uid()))) with check (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.branches.tenant_id and tm.user_id=(select auth.uid())));
create policy "members can delete own branches" on public.branches for delete to authenticated using (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.branches.tenant_id and tm.user_id=(select auth.uid())));

drop policy if exists "members can read own categories" on public.categories;
drop policy if exists "members can insert own categories" on public.categories;
drop policy if exists "members can update own categories" on public.categories;
drop policy if exists "members can delete own categories" on public.categories;
create policy "members can read own categories" on public.categories for select to authenticated using (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.categories.tenant_id and tm.user_id=(select auth.uid())));
create policy "members can insert own categories" on public.categories for insert to authenticated with check (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.categories.tenant_id and tm.user_id=(select auth.uid())));
create policy "members can update own categories" on public.categories for update to authenticated using (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.categories.tenant_id and tm.user_id=(select auth.uid()))) with check (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.categories.tenant_id and tm.user_id=(select auth.uid())));
create policy "members can delete own categories" on public.categories for delete to authenticated using (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.categories.tenant_id and tm.user_id=(select auth.uid())));

drop policy if exists "members can read own products" on public.products;
drop policy if exists "members can insert own products" on public.products;
drop policy if exists "members can update own products" on public.products;
drop policy if exists "members can delete own products" on public.products;
create policy "members can read own products" on public.products for select to authenticated using (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.products.tenant_id and tm.user_id=(select auth.uid())));
create policy "members can insert own products" on public.products for insert to authenticated with check (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.products.tenant_id and tm.user_id=(select auth.uid())));
create policy "members can update own products" on public.products for update to authenticated using (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.products.tenant_id and tm.user_id=(select auth.uid()))) with check (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.products.tenant_id and tm.user_id=(select auth.uid())));
create policy "members can delete own products" on public.products for delete to authenticated using (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.products.tenant_id and tm.user_id=(select auth.uid())));

drop policy if exists "members can read own analytics" on public.menu_events;
create policy "members can read own analytics" on public.menu_events for select to authenticated using (exists (select 1 from public.tenant_members tm where tm.tenant_id=public.menu_events.tenant_id and tm.user_id=(select auth.uid())));
