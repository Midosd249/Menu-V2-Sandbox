-- Remove the legacy tenant_members SELECT policy that queried tenant_members
-- from inside its own policy. The security-definer helper and members_read_own
-- policy provide the intended isolated access without recursive evaluation.

drop policy if exists "members can read memberships" on public.tenant_members;

drop policy if exists "members_read_own" on public.tenant_members;
create policy "members_read_own"
on public.tenant_members for select to authenticated
using (user_id = (select auth.uid()));
