-- Applied via Supabase migration: provision_restaurant_operator
-- Platform operator allowlist + atomic restaurant provisioning
-- Does NOT weaken existing RLS on tenants/tenant_members for ordinary users.

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
    select 1 from public.platform_operators po
    where po.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_platform_operator() from public;
grant execute on function public.is_platform_operator() to authenticated;

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
begin
  if not exists (
    select 1 from public.platform_operators po
    where po.user_id = (select auth.uid())
  ) then
    raise exception 'not authorized: platform operator only';
  end if;

  v_name := nullif(trim(p_name), '');
  v_slug := lower(nullif(trim(p_slug), ''));
  v_branch_name := nullif(trim(p_branch_name), '');
  v_branch_slug := lower(nullif(trim(coalesce(p_branch_slug, 'main')), ''));

  if v_name is null or char_length(v_name) > 120 then
    raise exception 'invalid restaurant name';
  end if;
  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_slug) > 64 then
    raise exception 'invalid slug: use lowercase letters, numbers, hyphens only';
  end if;
  if v_branch_name is null or char_length(v_branch_name) > 120 then
    raise exception 'invalid branch name';
  end if;
  if v_branch_slug is null or v_branch_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_branch_slug) > 64 then
    raise exception 'invalid branch slug';
  end if;
  if p_owner_user_id is null then
    raise exception 'owner user id required';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_owner_user_id) then
    raise exception 'owner user does not exist in auth';
  end if;
  if exists (select 1 from public.tenants t where t.slug = v_slug) then
    raise exception 'slug already exists';
  end if;

  insert into public.tenants (slug, name)
  values (v_slug, v_name)
  returning id into v_tenant_id;

  insert into public.branches (tenant_id, slug, name, is_active)
  values (v_tenant_id, v_branch_slug, v_branch_name, true)
  returning id into v_branch_id;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (v_tenant_id, p_owner_user_id, 'owner');

  return jsonb_build_object(
    'tenant_id', v_tenant_id,
    'slug', v_slug,
    'name', v_name,
    'branch_id', v_branch_id,
    'branch_slug', v_branch_slug,
    'owner_user_id', p_owner_user_id
  );
end;
$$;

revoke all on function public.provision_restaurant(text, text, text, uuid, text) from public;
grant execute on function public.provision_restaurant(text, text, text, uuid, text) to authenticated;
