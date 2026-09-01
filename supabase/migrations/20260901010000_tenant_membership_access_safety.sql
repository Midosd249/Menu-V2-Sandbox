-- Menu V2 — tenant membership access safety
-- Additive migration: fixes recursive membership-policy evaluation and provides
-- owner-only staff management without exposing auth.users to the browser.

create or replace function public.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_tenant_owner(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role = 'owner'
  );
$$;

revoke all on function public.is_tenant_member(uuid) from public;
revoke all on function public.is_tenant_owner(uuid) from public;
grant execute on function public.is_tenant_member(uuid) to authenticated;
grant execute on function public.is_tenant_owner(uuid) to authenticated;

-- Do not evaluate tenant_members policies by querying tenant_members under RLS.
drop policy if exists "members can read memberships" on public.tenant_members;
drop policy if exists "members_read_own" on public.tenant_members;
drop policy if exists "owner_read_tenant_members" on public.tenant_members;
create policy "members_read_own"
  on public.tenant_members for select to authenticated
  using (user_id = (select auth.uid()));
create policy "owner_read_tenant_members"
  on public.tenant_members for select to authenticated
  using (public.is_tenant_owner(tenant_id));

-- Tenant owners may manage staff, but never create, change, or remove owners.
drop policy if exists "owners manage memberships" on public.tenant_members;
drop policy if exists "owners manage memberships insert" on public.tenant_members;
drop policy if exists "owners manage memberships update" on public.tenant_members;
drop policy if exists "owners manage memberships delete" on public.tenant_members;
drop policy if exists "owner_insert_staff_members" on public.tenant_members;
drop policy if exists "owner_update_staff_members" on public.tenant_members;
drop policy if exists "owner_delete_staff_members" on public.tenant_members;
create policy "owner_insert_staff_members"
  on public.tenant_members for insert to authenticated
  with check (public.is_tenant_owner(tenant_id) and role in ('admin', 'editor'));
create policy "owner_update_staff_members"
  on public.tenant_members for update to authenticated
  using (public.is_tenant_owner(tenant_id) and role in ('admin', 'editor'))
  with check (public.is_tenant_owner(tenant_id) and role in ('admin', 'editor'));
create policy "owner_delete_staff_members"
  on public.tenant_members for delete to authenticated
  using (public.is_tenant_owner(tenant_id) and role in ('admin', 'editor'));

-- Look up an existing Auth user only inside a server-side SECURITY DEFINER RPC.
create or replace function public.manage_tenant_member_by_email(
  p_tenant_id uuid,
  p_email text,
  p_role text default null,
  p_action text default 'upsert'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_role text := lower(trim(coalesce(p_role, '')));
  v_action text := lower(trim(coalesce(p_action, 'upsert')));
  v_user_id uuid;
  v_existing_role text;
begin
  if p_tenant_id is null or not public.is_tenant_owner(p_tenant_id) then
    raise exception 'not_authorized';
  end if;
  if v_email = '' or char_length(v_email) > 320 or position('@' in v_email) < 2 then
    raise exception 'invalid_email';
  end if;
  if v_action not in ('upsert', 'remove') then
    raise exception 'invalid_action';
  end if;

  select id into v_user_id from auth.users where lower(email) = v_email limit 1;
  if v_user_id is null then
    raise exception 'user_not_found';
  end if;
  select role into v_existing_role from public.tenant_members
    where tenant_id = p_tenant_id and user_id = v_user_id;

  if v_action = 'remove' then
    if v_existing_role is null then
      return jsonb_build_object('ok', true, 'action', 'noop');
    end if;
    if v_existing_role = 'owner' then
      raise exception 'owner_protected';
    end if;
    delete from public.tenant_members where tenant_id = p_tenant_id and user_id = v_user_id;
    return jsonb_build_object('ok', true, 'action', 'removed');
  end if;

  if v_role not in ('admin', 'editor') then
    raise exception 'invalid_role';
  end if;
  if v_existing_role = 'owner' then
    raise exception 'owner_protected';
  end if;
  insert into public.tenant_members (tenant_id, user_id, role)
    values (p_tenant_id, v_user_id, v_role)
  on conflict (tenant_id, user_id) do update set role = excluded.role;
  return jsonb_build_object('ok', true, 'action', case when v_existing_role is null then 'created' else 'updated' end, 'role', v_role);
end;
$$;

revoke all on function public.manage_tenant_member_by_email(uuid, text, text, text) from public;
grant execute on function public.manage_tenant_member_by_email(uuid, text, text, text) to authenticated;

