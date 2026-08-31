-- =============================================================================
-- Menu V2 — Role hardening + public event guard
-- الإصدار: Controlled First Customer Release
--
-- طبّق هذا الملف يدويًا في Supabase SQL Editor قبل أول عميل مدفوع.
-- Apply this file manually in the Supabase SQL Editor before first paid customer.
--
-- Safe additive migration. Does NOT drop tables or destroy data.
-- Does NOT use service_role. Does NOT open base-table SELECT to anon beyond
-- existing public RPC context policies.
--
-- After Run: execute the verification queries at the bottom.
-- =============================================================================


-- 1) Ensure role check constraint exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenant_members_role_check'
  ) THEN
    ALTER TABLE public.tenant_members
      ADD CONSTRAINT tenant_members_role_check
      CHECK (role IN ('owner', 'admin', 'editor'));
  END IF;
END $$;

-- 2) Helper: current membership role for a tenant
CREATE OR REPLACE FUNCTION public.current_member_role(p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT tm.role
  FROM public.tenant_members tm
  WHERE tm.tenant_id = p_tenant_id
    AND tm.user_id = (SELECT auth.uid())
  LIMIT 1;
$$;

-- 3) Helper: is member of tenant (any role)
CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = p_tenant_id
      AND tm.user_id = (SELECT auth.uid())
  );
$$;

-- 4) Restrict tenant_members mutations to owner only
DROP POLICY IF EXISTS "owners manage memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "members can insert memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "members can update memberships" ON public.tenant_members;
DROP POLICY IF EXISTS "members can delete memberships" ON public.tenant_members;

CREATE POLICY "owners manage memberships insert"
  ON public.tenant_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = tenant_members.tenant_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role = 'owner'
    )
  );

CREATE POLICY "owners manage memberships update"
  ON public.tenant_members FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = tenant_members.tenant_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = tenant_members.tenant_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role = 'owner'
    )
  );

CREATE POLICY "owners manage memberships delete"
  ON public.tenant_members FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = tenant_members.tenant_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role = 'owner'
    )
  );

-- Keep select for own memberships
DROP POLICY IF EXISTS "members can read memberships" ON public.tenant_members;
CREATE POLICY "members can read memberships"
  ON public.tenant_members FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = tenant_members.tenant_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.role IN ('owner', 'admin')
  ));

-- 5) Editor cannot update sensitive tenant branding fields via broad update.
-- Prefer application-level restriction + keep membership-scoped update.
-- Tighten: only owner/admin can update tenants table.
DROP POLICY IF EXISTS "members can update own tenants" ON public.tenants;
CREATE POLICY "owner_admin update own tenants"
  ON public.tenants FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = tenants.id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = tenants.id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('owner', 'admin')
    )
  );

-- 6) Products: all members (owner/admin/editor) can manage products of their tenant
DROP POLICY IF EXISTS "members can insert own products" ON public.products;
DROP POLICY IF EXISTS "members can update own products" ON public.products;
DROP POLICY IF EXISTS "members can delete own products" ON public.products;

CREATE POLICY "members insert own products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "members update own products"
  ON public.products FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "members delete own products"
  ON public.products FOR DELETE TO authenticated
  USING (public.is_tenant_member(tenant_id));

-- 7) Categories same membership gate
DROP POLICY IF EXISTS "members can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "members can update own categories" ON public.categories;
DROP POLICY IF EXISTS "members can delete own categories" ON public.categories;

CREATE POLICY "members insert own categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "members update own categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "members delete own categories"
  ON public.categories FOR DELETE TO authenticated
  USING (public.is_tenant_member(tenant_id));

-- 8) Branches: owner/admin only for structural changes; editor can read via membership
DROP POLICY IF EXISTS "members can insert own branches" ON public.branches;
DROP POLICY IF EXISTS "members can update own branches" ON public.branches;
DROP POLICY IF EXISTS "members can delete own branches" ON public.branches;

CREATE POLICY "owner_admin insert branches"
  ON public.branches FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = branches.tenant_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "owner_admin update branches"
  ON public.branches FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = branches.tenant_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = branches.tenant_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "owner_admin delete branches"
  ON public.branches FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = branches.tenant_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('owner', 'admin')
    )
  );

-- 9) Ensure anon cannot insert menu_events except through RPC policy path
-- (public_security_rpc.sql already restricts via context; reinforce)
REVOKE INSERT ON public.menu_events FROM anon;
REVOKE INSERT ON public.menu_events FROM authenticated;
-- RPC runs as invoker but uses set_config; grant execute already present.
-- Re-grant insert only if policy requires (SECURITY INVOKER function inserts as caller).
GRANT INSERT ON public.menu_events TO anon, authenticated;

-- 10) Index for event spam analysis / owner analytics
CREATE INDEX IF NOT EXISTS menu_events_tenant_type_created_idx
  ON public.menu_events (tenant_id, event_type, created_at DESC);

-- Verification (run manually after apply):
-- SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- SELECT public.current_member_role('<tenant_uuid>');


-- =============================================================================
-- VERIFICATION BLOCK (copy after successful Run)
-- =============================================================================
-- 1) Policies present:
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('tenants','branches','categories','products','tenant_members','menu_events')
-- ORDER BY tablename, policyname;

-- 2) Helper functions exist:
-- SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace
--   AND proname IN ('current_member_role','is_tenant_member');

-- 3) Role constraint:
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.tenant_members'::regclass AND contype = 'c';

-- 4) As authenticated owner of tenant T: should return 'owner'
-- SELECT public.current_member_role('<TENANT_UUID>'::uuid);

-- ROLLBACK NOTE:
-- Policies can be recreated from prior migration files if needed.
-- Do not DROP tenant_members or products on production without backup.
