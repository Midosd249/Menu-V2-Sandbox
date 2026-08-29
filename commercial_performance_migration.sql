-- Commercial QA performance hardening for Menu tables only.
create index if not exists idx_menu_events_branch_id on public.menu_events(branch_id);
create index if not exists idx_menu_events_product_id on public.menu_events(product_id);
create index if not exists idx_products_category_id on public.products(category_id);

drop policy if exists "members can manage own tenants" on public.tenants;
drop policy if exists "members can manage own branches" on public.branches;
drop policy if exists "members can manage own categories" on public.categories;
drop policy if exists "members can manage own products" on public.products;
drop policy if exists "members can read memberships" on public.tenant_members;
drop policy if exists "members can read branch hours" on public.branch_hours;
drop policy if exists "members can manage branch hours" on public.branch_hours;
drop policy if exists "members can read own analytics" on public.menu_events;

create policy "members can manage own tenants" on public.tenants for all using (exists(select 1 from public.tenant_members tm where tm.tenant_id = id and tm.user_id = (select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = id and tm.user_id = (select auth.uid())));
create policy "members can manage own branches" on public.branches for all using (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id = (select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id = (select auth.uid())));
create policy "members can manage own categories" on public.categories for all using (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id = (select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id = (select auth.uid())));
create policy "members can manage own products" on public.products for all using (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id = (select auth.uid()))) with check (exists(select 1 from public.tenant_members tm where tm.tenant_id = tenant_id and tm.user_id = (select auth.uid())));
create policy "members can read memberships" on public.tenant_members for select using (user_id = (select auth.uid()));
create policy "members can read branch hours" on public.branch_hours for select using (exists(select 1 from public.branches b join public.tenant_members tm on tm.tenant_id=b.tenant_id where b.id=branch_id and tm.user_id=(select auth.uid())));
create policy "members can manage branch hours" on public.branch_hours for all using (exists(select 1 from public.branches b join public.tenant_members tm on tm.tenant_id=b.tenant_id where b.id=branch_id and tm.user_id=(select auth.uid()))) with check (exists(select 1 from public.branches b join public.tenant_members tm on tm.tenant_id=b.tenant_id where b.id=branch_id and tm.user_id=(select auth.uid())));
create policy "members can read own analytics" on public.menu_events for select using (exists(select 1 from public.tenant_members tm where tm.tenant_id=tenant_id and tm.user_id=(select auth.uid())));
