drop policy if exists "members can manage own tenants" on public.tenants;
drop policy if exists "members can manage own branches" on public.branches;
drop policy if exists "members can manage own categories" on public.categories;
drop policy if exists "members can manage own products" on public.products;

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
