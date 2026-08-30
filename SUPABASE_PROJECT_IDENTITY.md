# Supabase Project Identity — Menu-V2-Sandbox

**Status:** Identity resolved from repository source of truth. No destructive database work was performed on any project during this productization pass.

## Intended project (source of truth)

| Signal | Value |
|--------|--------|
| `supabase-config.js` | `https://ebirwuigujqosfarqmqa.supabase.co` |
| `owner.html` display | `https://ebirwuigujqosfarqmqa.supabase.co` |
| `security_qa.md` | Project: `ebirwuigujqosfarqmqa` |
| `final_auth_tenant_isolation_report.md` | Supabase project: `ebirwuigujqosfarqmqa` |
| README | Configured against the existing project via `supabase-config.js` |

**Conclusion:** The production/sandbox data plane for this repository is **`ebirwuigujqosfarqmqa`**.

## Connected automation project (this session)

The connected Supabase Menu V2 connector currently exposes only:

- Project ID / ref: `ublxptcqefujkbeepylc`
- Name: midosd2.mm@gmail.com's Project
- Tables in `public`: **empty**

This is **not** the intended Menu-V2-Sandbox database. No migrations, RLS changes, data writes, or destructive operations were applied to `ublxptcqefujkbeepylc`.

## Owner action required

1. Ensure the GitHub/Supabase connector used for this product points at **`ebirwuigujqosfarqmqa`** (or grant the automation access to that project).
2. After the correct project is connected, re-run live RLS advisors, table listing, and authenticated membership smoke tests.
3. Do not copy schema from one project to the other without an explicit migration plan and backup.

## Structural verification performed (from repository SQL only)

From `supabase-schema.sql` and additive migrations present in this repo:

- Core tables: `tenants`, `branches`, `categories`, `products`, `tenant_members`, `branch_hours`, `menu_events`
- Public access model: RPC-first (`get_public_menu`, `record_public_menu_event`) with transaction-local context settings
- Authenticated access: membership-scoped RLS on tenant-owned rows
- Storage: `menu-assets` bucket with path-prefix isolation by tenant UUID
- No service-role key is present in client config (publishable key only)

Frontend (`app.js`, admin/client/owner scripts) calls match these table/RPC names and the published shapes documented in the schema file.

Live mutation and cross-tenant isolation tests still require authenticated accounts against **`ebirwuigujqosfarqmqa`**.
