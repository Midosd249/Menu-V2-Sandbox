-- Security hardening: authenticated ownership + platform operator allowlist.
-- Safe/idempotent: does not delete business data or reset any table.

create table if not exists public.platform_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_operators enable row level security;
revoke all on public.platform_operators from public, anon, authenticated;

create or replace function public.is_platform_operator()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (select 1 from public.platform_operators po where po.user_id = (select auth.uid()));
$$;
revoke all on function public.is_platform_operator() from public;
grant execute on function public.is_platform_operator() to authenticated;

-- Link the supplied primary operator account by Auth identity, not a frontend email check.
insert into public.platform_operators (user_id)
select id from auth.users where lower(email) = lower('ahmed16060080@gmail.com')
on conflict (user_id) do nothing;

-- Direct intake-table reads are private. Public submission remains through submit RPCs only.
revoke select, update, delete on public.service_requests from anon;
revoke select, update, delete on public.visibility_audits from anon;
revoke select, update, delete on public.website_projects from anon;

alter table public.service_requests enable row level security;
drop policy if exists "auth_select_service_requests" on public.service_requests;
drop policy if exists "service_requests_operator_select" on public.service_requests;
create policy "service_requests_operator_select" on public.service_requests
  for select to authenticated using (public.is_platform_operator());
drop policy if exists "service_requests_operator_update" on public.service_requests;
create policy "service_requests_operator_update" on public.service_requests
  for update to authenticated
  using (public.is_platform_operator()) with check (public.is_platform_operator());

alter table public.visibility_audits enable row level security;
drop policy if exists "auth_select_visibility_audits" on public.visibility_audits;
drop policy if exists "visibility_audits_owner_select" on public.visibility_audits;
create policy "visibility_audits_owner_select" on public.visibility_audits
  for select to authenticated
  using (public.is_tenant_member(tenant_id) or public.is_platform_operator());
drop policy if exists "visibility_audits_owner_update" on public.visibility_audits;
create policy "visibility_audits_owner_update" on public.visibility_audits
  for update to authenticated
  using (public.is_tenant_member(tenant_id) or public.is_platform_operator())
  with check (public.is_tenant_member(tenant_id) or public.is_platform_operator());

alter table public.website_projects enable row level security;
drop policy if exists "auth_select_website_projects" on public.website_projects;
drop policy if exists "website_projects_owner_select" on public.website_projects;
create policy "website_projects_owner_select" on public.website_projects
  for select to authenticated
  using (public.is_tenant_member(tenant_id) or public.is_platform_operator());
drop policy if exists "auth_update_website_projects" on public.website_projects;
drop policy if exists "website_projects_owner_update" on public.website_projects;
create policy "website_projects_owner_update" on public.website_projects
  for update to authenticated
  using (public.is_tenant_member(tenant_id) or public.is_platform_operator())
  with check (public.is_tenant_member(tenant_id) or public.is_platform_operator());
