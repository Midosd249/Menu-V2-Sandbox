-- Menu V2: fix tenant membership RLS recursion.
-- is_tenant_member() is used by SELECT policies on tenant-scoped tables.
-- It must bypass tenant_members RLS; otherwise the policy can recurse and
-- return no rows to authenticated tenant members.

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

grant execute on function public.is_tenant_member(uuid) to authenticated;
