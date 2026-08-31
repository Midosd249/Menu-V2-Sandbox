-- Production repair: protected public intake RPCs, platform-operator access,
-- tenant-role hardening, and schema compatibility with the deployed UI.
-- This migration does not seed users, credentials, tenants, or demo data.

create table if not exists public.platform_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_operators enable row level security;
revoke all on public.platform_operators from public, anon, authenticated;

create or replace function public.is_platform_operator()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.platform_operators po
    where po.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_platform_operator() from public;
grant execute on function public.is_platform_operator() to authenticated;

-- Add UI-contract fields without replacing legacy columns or existing records.
alter table public.website_projects
  add column if not exists business_type text,
  add column if not exists name_ar text,
  add column if not exists name_en text,
  add column if not exists short_desc text,
  add column if not exists full_desc text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists maps_url text,
  add column if not exists social jsonb not null default '{}'::jsonb,
  add column if not exists hours jsonb not null default '{}'::jsonb,
  add column if not exists services jsonb not null default '[]'::jsonb,
  add column if not exists brand jsonb not null default '{}'::jsonb,
  add column if not exists language text,
  add column if not exists style_key text,
  add column if not exists pages jsonb not null default '[]'::jsonb,
  add column if not exists special_notes text,
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists currency text,
  add column if not exists phone_country_code text,
  add column if not exists published_url text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.website_projects drop constraint if exists website_projects_status_check;
alter table public.website_projects add constraint website_projects_status_check
  check (status = any (array['submitted','info_required','in_progress','in_production','review','revision','ready','published','delivered','closed']));

alter table public.visibility_audits
  add column if not exists business_category text,
  add column if not exists neighborhood text,
  add column if not exists website_url text,
  add column if not exists social jsonb not null default '{}'::jsonb,
  add column if not exists whatsapp text,
  add column if not exists inputs jsonb not null default '{}'::jsonb,
  add column if not exists score_total integer,
  add column if not exists score_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists findings jsonb not null default '[]'::jsonb,
  add column if not exists action_plan jsonb not null default '[]'::jsonb,
  add column if not exists checklist jsonb not null default '{}'::jsonb,
  add column if not exists plan_30d jsonb not null default '{}'::jsonb,
  add column if not exists report_summary text,
  add column if not exists notes text,
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists status text not null default 'submitted',
  add column if not exists updated_at timestamptz not null default now();

alter table public.visibility_audits drop constraint if exists visibility_audits_status_check;
alter table public.visibility_audits add constraint visibility_audits_status_check
  check (status = any (array['submitted','review','in_progress','completed','closed','archived']));

create index if not exists website_projects_created_at_idx on public.website_projects (created_at desc);
create index if not exists visibility_audits_created_at_idx on public.visibility_audits (created_at desc);
create index if not exists service_requests_created_at_idx on public.service_requests (created_at desc);

-- Remove permissive public table writes. Public forms write only through narrowly
-- validated SECURITY DEFINER functions below.
drop policy if exists anon_insert_service_requests on public.service_requests;
drop policy if exists anon_insert_website_projects on public.website_projects;
drop policy if exists anon_insert_visibility_audits on public.visibility_audits;

-- Remove stale broad role policies before creating precise replacements.
drop policy if exists members_delete_branches on public.branches;
drop policy if exists members_insert_branches on public.branches;
drop policy if exists members_update_branches on public.branches;
drop policy if exists "members delete own categories" on public.categories;
drop policy if exists "members insert own categories" on public.categories;
drop policy if exists "members update own categories" on public.categories;
drop policy if exists members_delete_categories on public.categories;
drop policy if exists members_insert_categories on public.categories;
drop policy if exists members_update_categories on public.categories;
drop policy if exists "members delete own products" on public.products;
drop policy if exists "members insert own products" on public.products;
drop policy if exists "members update own products" on public.products;
drop policy if exists members_delete_products on public.products;
drop policy if exists members_insert_products on public.products;
drop policy if exists members_update_products on public.products;
drop policy if exists members_update_tenants on public.tenants;

create policy owner_admin_insert_branches on public.branches
  for insert to authenticated
  with check (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = branches.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin')
  ));
create policy owner_admin_update_branches on public.branches
  for update to authenticated
  using (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = branches.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin')
  ))
  with check (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = branches.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin')
  ));
create policy owner_admin_delete_branches on public.branches
  for delete to authenticated
  using (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = branches.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin')
  ));

create policy owner_admin_insert_categories on public.categories
  for insert to authenticated
  with check (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin')
  ));
create policy owner_admin_update_categories on public.categories
  for update to authenticated
  using (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin')
  ))
  with check (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin')
  ));
create policy owner_admin_delete_categories on public.categories
  for delete to authenticated
  using (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = categories.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin')
  ));

create policy members_insert_products on public.products
  for insert to authenticated
  with check (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = products.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin','editor')
  ));
create policy members_update_products on public.products
  for update to authenticated
  using (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = products.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin','editor')
  ))
  with check (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = products.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin','editor')
  ));
create policy members_delete_products on public.products
  for delete to authenticated
  using (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = products.tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin','editor')
  ));

create policy owner_admin_update_tenants on public.tenants
  for update to authenticated
  using (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = tenants.id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin')
  ))
  with check (exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = tenants.id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner','admin')
  ));

-- Platform operator is distinct from tenant membership and has access only when
-- explicitly enrolled in platform_operators.
create policy platform_operator_select_tenants on public.tenants
  for select to authenticated using (public.is_platform_operator());
create policy platform_operator_update_tenants on public.tenants
  for update to authenticated using (public.is_platform_operator()) with check (public.is_platform_operator());
create policy platform_operator_select_branches on public.branches
  for select to authenticated using (public.is_platform_operator());
create policy platform_operator_update_branches on public.branches
  for update to authenticated using (public.is_platform_operator()) with check (public.is_platform_operator());
create policy platform_operator_select_categories on public.categories
  for select to authenticated using (public.is_platform_operator());
create policy platform_operator_select_products on public.products
  for select to authenticated using (public.is_platform_operator());
create policy platform_operator_select_events on public.menu_events
  for select to authenticated using (public.is_platform_operator());

create or replace function public.submit_service_request(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_business_name text := nullif(trim(coalesce(p_payload->>'business_name', '')), '');
  v_business_type text := nullif(trim(coalesce(p_payload->>'business_type', '')), '');
  v_service_type text := lower(nullif(trim(coalesce(p_payload->>'service_type', '')), ''));
  v_country text := upper(nullif(trim(coalesce(p_payload->>'country', '')), ''));
  v_city text := nullif(trim(coalesce(p_payload->>'city', '')), '');
  v_contact_name text := nullif(trim(coalesce(p_payload->>'contact_name', '')), '');
  v_contact_phone text := regexp_replace(coalesce(p_payload->>'contact_phone', ''), '[[:space:]().-]', '', 'g');
  v_contact_email text := lower(nullif(trim(coalesce(p_payload->>'contact_email', '')), ''));
  v_details text := nullif(trim(coalesce(p_payload->>'details', '')), '');
begin
  if jsonb_typeof(p_payload) <> 'object' then raise exception 'payload must be an object'; end if;
  if v_business_name is null or char_length(v_business_name) > 200 then raise exception 'invalid business name'; end if;
  if v_contact_name is null or char_length(v_contact_name) > 120 then raise exception 'invalid contact name'; end if;
  if v_contact_phone !~ '^\\+?[0-9]{7,15}$' then raise exception 'invalid contact phone'; end if;
  if v_contact_email is not null and (char_length(v_contact_email) > 120 or v_contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$') then raise exception 'invalid contact email'; end if;
  if v_service_type is null then v_service_type := 'menu'; end if;
  if v_service_type not in ('menu','website','visibility','ai_solutions','automation','analytics','custom') then raise exception 'invalid service type'; end if;
  if v_country is null then v_country := 'SA'; end if;
  if v_country !~ '^[A-Z]{2}$' then raise exception 'invalid country'; end if;
  if coalesce(char_length(v_business_type), 0) > 120 or coalesce(char_length(v_city), 0) > 120 or coalesce(char_length(v_details), 0) > 5000 then raise exception 'field exceeds allowed length'; end if;

  insert into public.service_requests (business_name,business_type,service_type,country,city,contact_name,contact_phone,contact_email,details,status)
  values (v_business_name,v_business_type,v_service_type,v_country,v_city,v_contact_name,v_contact_phone,v_contact_email,v_details,'new')
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'message', 'تم استلام طلبك بنجاح.');
end;
$$;
revoke all on function public.submit_service_request(jsonb) from public;
grant execute on function public.submit_service_request(jsonb) to anon, authenticated;

create or replace function public.submit_website_brief(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_name text := nullif(trim(coalesce(p_payload->>'name_ar', '')), '');
  v_phone text := regexp_replace(coalesce(nullif(trim(p_payload->>'whatsapp'), ''), nullif(trim(p_payload->>'phone'), ''), ''), '[[:space:]().-]', '', 'g');
  v_email text := lower(nullif(trim(coalesce(p_payload->>'email', '')), ''));
  v_country text := upper(coalesce(nullif(trim(p_payload->>'country_code'), ''), 'SA'));
begin
  if jsonb_typeof(p_payload) <> 'object' then raise exception 'payload must be an object'; end if;
  if v_name is null or char_length(v_name) > 160 then raise exception 'invalid business name'; end if;
  if v_phone !~ '^\\+?[0-9]{7,15}$' then raise exception 'invalid contact phone'; end if;
  if v_email is not null and (char_length(v_email) > 120 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$') then raise exception 'invalid email'; end if;
  if v_country !~ '^[A-Z]{2}$' then raise exception 'invalid country'; end if;
  if coalesce(char_length(p_payload->>'business_type'),0) > 80 or coalesce(char_length(p_payload->>'short_desc'),0) > 200 or coalesce(char_length(p_payload->>'full_desc'),0) > 2000 or coalesce(char_length(p_payload->>'special_notes'),0) > 1200 then raise exception 'field exceeds allowed length'; end if;

  insert into public.website_projects (
    payload,status,contact_name,contact_phone,contact_email,business_type,name_ar,name_en,short_desc,full_desc,phone,whatsapp,email,address,city,maps_url,social,hours,services,brand,language,style_key,pages,special_notes,country_code,region,currency,phone_country_code
  ) values (
    p_payload,'submitted',nullif(trim(p_payload->>'contact_name'),''),v_phone,v_email,nullif(trim(p_payload->>'business_type'),''),v_name,nullif(trim(p_payload->>'name_en'),''),nullif(trim(p_payload->>'short_desc'),''),nullif(trim(p_payload->>'full_desc'),''),nullif(trim(p_payload->>'phone'),''),nullif(trim(p_payload->>'whatsapp'),''),v_email,nullif(trim(p_payload->>'address'),''),nullif(trim(p_payload->>'city'),''),nullif(trim(p_payload->>'maps_url'),''),coalesce(p_payload->'social','{}'::jsonb),coalesce(p_payload->'hours','{}'::jsonb),coalesce(p_payload->'services','[]'::jsonb),coalesce(p_payload->'brand','{}'::jsonb),nullif(trim(p_payload->>'language'),''),nullif(trim(p_payload->>'style_key'),''),coalesce(p_payload->'pages','[]'::jsonb),nullif(trim(p_payload->>'special_notes'),''),v_country,nullif(trim(p_payload->>'region'),''),nullif(trim(p_payload->>'currency'),''),nullif(trim(p_payload->>'phone_country_code'),'')
  ) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;
revoke all on function public.submit_website_brief(jsonb) from public;
grant execute on function public.submit_website_brief(jsonb) to anon, authenticated;

create or replace function public.submit_visibility_audit(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_name text := nullif(trim(coalesce(p_payload->>'business_name', '')), '');
  v_score integer := nullif(trim(coalesce(p_payload->>'score_total', '')), '')::integer;
  v_country text := upper(coalesce(nullif(trim(p_payload->>'country_code'), ''), 'SA'));
  v_phone text := nullif(trim(coalesce(p_payload->>'phone', '')), '');
  v_whatsapp text := nullif(trim(coalesce(p_payload->>'whatsapp', '')), '');
begin
  if jsonb_typeof(p_payload) <> 'object' then raise exception 'payload must be an object'; end if;
  if v_name is null or char_length(v_name) > 200 then raise exception 'invalid business name'; end if;
  if v_score is null or v_score < 0 or v_score > 100 then raise exception 'invalid score'; end if;
  if v_country !~ '^[A-Z]{2}$' then raise exception 'invalid country'; end if;
  if coalesce(char_length(v_phone),0) > 40 or coalesce(char_length(v_whatsapp),0) > 40 or coalesce(char_length(p_payload->>'notes'),0) > 1000 then raise exception 'field exceeds allowed length'; end if;

  insert into public.visibility_audits (
    business_name,city,country,maps_url,phone,score,recommendations,payload,contact_name,contact_phone,business_category,neighborhood,website_url,social,whatsapp,inputs,score_total,score_breakdown,findings,action_plan,checklist,plan_30d,report_summary,notes,country_code,region,status
  ) values (
    v_name,nullif(trim(p_payload->>'city'),''),v_country,nullif(trim(p_payload->>'maps_url'),''),v_phone,v_score,coalesce(p_payload->'action_plan','[]'::jsonb),p_payload,nullif(trim(p_payload->>'contact_name'),''),coalesce(nullif(trim(p_payload->>'contact_phone'),''),v_whatsapp,v_phone),nullif(trim(p_payload->>'business_category'),''),nullif(trim(p_payload->>'neighborhood'),''),nullif(trim(p_payload->>'website_url'),''),coalesce(p_payload->'social','{}'::jsonb),v_whatsapp,coalesce(p_payload->'inputs','{}'::jsonb),v_score,coalesce(p_payload->'score_breakdown','{}'::jsonb),coalesce(p_payload->'findings','[]'::jsonb),coalesce(p_payload->'action_plan','[]'::jsonb),coalesce(p_payload->'checklist','{}'::jsonb),coalesce(p_payload->'plan_30d','{}'::jsonb),nullif(trim(p_payload->>'report_summary'),''),nullif(trim(p_payload->>'notes'),''),v_country,nullif(trim(p_payload->>'region'),''),'submitted'
  ) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;
revoke all on function public.submit_visibility_audit(jsonb) from public;
grant execute on function public.submit_visibility_audit(jsonb) to anon, authenticated;

create or replace function public.list_website_projects()
returns table (
  id uuid, name_ar text, business_type text, contact_name text, contact_phone text,
  phone text, whatsapp text, city text, status text, published_url text,
  short_desc text, services jsonb, created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_platform_operator() then raise exception 'not authorized: platform operator only'; end if;
  return query
  select wp.id, wp.name_ar, wp.business_type, wp.contact_name, wp.contact_phone,
         wp.phone, wp.whatsapp, wp.city, wp.status, wp.published_url,
         wp.short_desc, wp.services, wp.created_at
  from public.website_projects wp
  order by wp.created_at desc;
end;
$$;
revoke all on function public.list_website_projects() from public;
grant execute on function public.list_website_projects() to authenticated;

create or replace function public.list_visibility_audits()
returns table (
  id uuid, business_name text, business_category text, city text, phone text,
  whatsapp text, score_total integer, status text, inputs jsonb, created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_platform_operator() then raise exception 'not authorized: platform operator only'; end if;
  return query
  select va.id, va.business_name, va.business_category, va.city, va.phone,
         va.whatsapp, va.score_total, va.status, va.inputs, va.created_at
  from public.visibility_audits va
  order by va.created_at desc;
end;
$$;
revoke all on function public.list_visibility_audits() from public;
grant execute on function public.list_visibility_audits() to authenticated;

create or replace function public.provision_restaurant(
  p_name text,
  p_slug text,
  p_branch_name text,
  p_owner_user_id uuid,
  p_branch_slug text default 'main'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text;
  v_slug text;
  v_branch_name text;
  v_branch_slug text;
  v_tenant_id uuid;
  v_branch_id uuid;
  v_operator_id uuid;
begin
  if not public.is_platform_operator() then raise exception 'not authorized: platform operator only'; end if;
  v_operator_id := (select auth.uid());
  v_name := nullif(trim(p_name), '');
  v_slug := lower(nullif(trim(p_slug), ''));
  v_branch_name := nullif(trim(p_branch_name), '');
  v_branch_slug := lower(nullif(trim(coalesce(p_branch_slug, 'main')), ''));
  if v_name is null or char_length(v_name) > 120 then raise exception 'invalid restaurant name'; end if;
  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_slug) > 64 then raise exception 'invalid slug'; end if;
  if v_branch_name is null or char_length(v_branch_name) > 120 then raise exception 'invalid branch name'; end if;
  if v_branch_slug is null or v_branch_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_branch_slug) > 64 then raise exception 'invalid branch slug'; end if;
  if p_owner_user_id is null or not exists (select 1 from auth.users where id = p_owner_user_id) then raise exception 'owner user does not exist in auth'; end if;
  if exists (select 1 from public.tenants where slug = v_slug) then raise exception 'slug already exists'; end if;

  insert into public.tenants (slug,name) values (v_slug,v_name) returning id into v_tenant_id;
  insert into public.branches (tenant_id,slug,name,is_active) values (v_tenant_id,v_branch_slug,v_branch_name,true) returning id into v_branch_id;
  insert into public.tenant_members (tenant_id,user_id,role) values (v_tenant_id,p_owner_user_id,'owner') on conflict (tenant_id,user_id) do nothing;
  insert into public.tenant_members (tenant_id,user_id,role) values (v_tenant_id,v_operator_id,'admin') on conflict (tenant_id,user_id) do nothing;
  return jsonb_build_object('tenant_id',v_tenant_id,'slug',v_slug,'name',v_name,'branch_id',v_branch_id,'branch_slug',v_branch_slug,'owner_user_id',p_owner_user_id,'operator_user_id',v_operator_id);
end;
$$;
revoke all on function public.provision_restaurant(text,text,text,uuid,text) from public;
grant execute on function public.provision_restaurant(text,text,text,uuid,text) to authenticated;
