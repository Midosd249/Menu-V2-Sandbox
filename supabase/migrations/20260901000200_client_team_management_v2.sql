-- Menu V2 — Client Team Management v2
-- Authoritative backend: ublxptcqefujkbeepylc
-- Existing Auth users only. Invitation delivery belongs in a trusted server/Edge Function.

create or replace function public.is_platform_operator()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.platform_operators po
    where po.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_tenant_owner(p_tenant_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role = 'owner'
  );
$$;

revoke all on function public.is_platform_operator() from public;
grant execute on function public.is_platform_operator() to authenticated;
revoke all on function public.is_tenant_owner(uuid) from public;
grant execute on function public.is_tenant_owner(uuid) to authenticated;

-- Platform Owner: complete membership administration.
drop policy if exists "platform_operator_manage_tenant_members" on public.tenant_members;
create policy "platform_operator_manage_tenant_members"
on public.tenant_members for all to authenticated
using (public.is_platform_operator())
with check (public.is_platform_operator());

-- Tenant Owner: safe staff administration. Owner memberships are protected.
drop policy if exists "owners manage memberships delete" on public.tenant_members;
drop policy if exists "owners manage memberships insert" on public.tenant_members;
drop policy if exists "owners manage memberships update" on public.tenant_members;

drop policy if exists "owner_read_tenant_members" on public.tenant_members;
create policy "owner_read_tenant_members"
on public.tenant_members for select to authenticated
using (public.is_tenant_owner(tenant_id));

drop policy if exists "owner_insert_staff_members" on public.tenant_members;
create policy "owner_insert_staff_members"
on public.tenant_members for insert to authenticated
with check (public.is_tenant_owner(tenant_id) and role in ('admin','editor'));

drop policy if exists "owner_update_staff_members" on public.tenant_members;
create policy "owner_update_staff_members"
on public.tenant_members for update to authenticated
using (public.is_tenant_owner(tenant_id) and role in ('admin','editor'))
with check (public.is_tenant_owner(tenant_id) and role in ('admin','editor'));

drop policy if exists "owner_delete_staff_members" on public.tenant_members;
create policy "owner_delete_staff_members"
on public.tenant_members for delete to authenticated
using (public.is_tenant_owner(tenant_id) and role in ('admin','editor'));

-- Owner-facing operation. Uses Auth email to locate an existing account without
-- exposing auth.users to the browser. It never accepts arbitrary tenant access.
create or replace function public.manage_tenant_member_by_email(
  p_tenant_id uuid,
  p_email text,
  p_role text default null,
  p_action text default 'upsert'
)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(trim(coalesce(p_email,'')));
  v_user_id uuid;
  v_existing public.tenant_members%rowtype;
  v_role text := lower(trim(coalesce(p_role,'')));
  v_action text := lower(trim(coalesce(p_action,'upsert')));
  v_platform boolean := public.is_platform_operator();
  v_owner boolean := public.is_tenant_owner(p_tenant_id);
begin
  if not v_platform and not v_owner then raise exception 'not_authorized'; end if;
  if p_tenant_id is null then raise exception 'invalid_tenant'; end if;
  if v_email = '' or position('@' in v_email) < 2 then raise exception 'invalid_email'; end if;
  if v_action not in ('upsert','remove') then raise exception 'invalid_action'; end if;

  select id into v_user_id
  from auth.users
  where lower(email) = v_email
  limit 1;
  if v_user_id is null then raise exception 'user_not_found'; end if;

  select * into v_existing
  from public.tenant_members
  where tenant_id = p_tenant_id and user_id = v_user_id;

  if v_action = 'remove' then
    if v_existing.role is null then
      return jsonb_build_object('ok', true, 'action', 'noop');
    end if;
    if v_existing.role = 'owner' and not v_platform then raise exception 'owner_protected'; end if;
    delete from public.tenant_members where tenant_id = p_tenant_id and user_id = v_user_id;
    return jsonb_build_object('ok', true, 'action', 'removed');
  end if;

  if v_role not in ('admin','editor') then raise exception 'invalid_role'; end if;
  if v_existing.role = 'owner' and v_role <> 'owner' and not v_platform then raise exception 'owner_protected'; end if;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (p_tenant_id, v_user_id, v_role)
  on conflict (tenant_id, user_id) do update set role = excluded.role;

  return jsonb_build_object('ok', true,
    'action', case when v_existing.role is null then 'created' else 'updated' end,
    'role', v_role);
end;
$$;

revoke all on function public.manage_tenant_member_by_email(uuid,text,text,text) from public;
grant execute on function public.manage_tenant_member_by_email(uuid,text,text,text) to authenticated;
