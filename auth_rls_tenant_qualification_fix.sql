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
