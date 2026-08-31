-- Client Team Management foundation
-- Safe, scoped Tenant Owner + Platform Owner member administration.

create or replace function public.is_platform_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.platform_operators where user_id = auth.uid());
$$;

create or replace function public.is_tenant_owner(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = p_tenant_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

revoke all on function public.is_platform_operator() from public;
grant execute on function public.is_platform_operator() to authenticated;
revoke all on function public.is_tenant_owner(uuid) from public;
grant execute on function public.is_tenant_owner(uuid) to authenticated;

drop policy if exists "Platform operators can manage tenant members" on public.tenant_members;
create policy "Platform operators can manage tenant members"
on public.tenant_members for all to authenticated
using (public.is_platform_operator())
with check (public.is_platform_operator());

drop policy if exists "Tenant owners can manage their tenant members" on public.tenant_members;
create policy "Tenant owners can manage their tenant members"
on public.tenant_members for all to authenticated
using (public.is_tenant_owner(tenant_id))
with check (public.is_tenant_owner(tenant_id));

create or replace function public.manage_tenant_member(
  p_tenant_id uuid,
  p_user_id uuid,
  p_role text,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.tenant_members%rowtype;
  v_is_platform boolean := public.is_platform_operator();
  v_is_owner boolean := public.is_tenant_owner(p_tenant_id);
begin
  if p_role not in ('admin','editor','owner') then raise exception 'invalid_role'; end if;
  if p_action not in ('upsert','remove') then raise exception 'invalid_action'; end if;
  if not v_is_platform and not v_is_owner then raise exception 'not_authorized'; end if;

  select * into v_existing from public.tenant_members
  where tenant_id = p_tenant_id and user_id = p_user_id;

  if p_action = 'remove' then
    if v_existing.role = 'owner' then raise exception 'cannot_remove_owner'; end if;
    delete from public.tenant_members where tenant_id = p_tenant_id and user_id = p_user_id;
    return jsonb_build_object('ok', true, 'action', 'removed');
  end if;

  if not v_is_platform and p_role = 'owner' and p_user_id <> auth.uid() then
    raise exception 'owner_transfer_not_allowed';
  end if;
  if not v_is_platform and v_existing.role = 'owner' and p_role <> 'owner' then
    raise exception 'cannot_demote_owner';
  end if;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (p_tenant_id, p_user_id, p_role)
  on conflict (tenant_id, user_id) do update set role = excluded.role;

  return jsonb_build_object('ok', true, 'action', 'upserted', 'role', p_role);
end;
$$;

revoke all on function public.manage_tenant_member(uuid,uuid,text,text) from public;
grant execute on function public.manage_tenant_member(uuid,uuid,text,text) to authenticated;
