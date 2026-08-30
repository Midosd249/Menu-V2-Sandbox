# Supabase Project Identity — Menu-V2-Sandbox

**Authoritative backend (NEW):** `ublxptcqefujkbeepylc`

| Field | Value |
|-------|--------|
| Project ref | `ublxptcqefujkbeepylc` |
| API URL | `https://ublxptcqefujkbeepylc.supabase.co` |
| Region | ap-northeast-2 |
| Role | Dedicated backend for Menu-V2-Sandbox |

**Previous project (untouched):** `ebirwuigujqosfarqmqa` — kept separate intentionally. Do not modify.

## Schema applied on NEW project

Migrations:
- `menu_v2_core_schema` — tables, FKs, indexes, triggers
- `menu_v2_rls_and_rpcs` — RLS, public RPCs, storage policies
- `menu_v2_demo_seed` — portfolio demo tenants/branches/products
- `menu_v2_fix_search_path` — secure trigger function

### Tables
tenants, branches, categories, products, tenant_members, branch_hours, menu_events, service_requests, website_projects, visibility_audits

### Security model
- RLS on all app tables
- Membership helper `is_tenant_member(uuid)`
- Members: full CRUD on own tenant data
- Public: only via `get_public_menu` / `record_public_menu_event` (SECURITY DEFINER, validated slug/branch/product)
- No base-table SELECT policies for anon on menu tables
- Storage `menu-assets`: public read; authenticated writes limited to `{tenant_id}/...` path prefix

### Demo seed
oaza, maqsoud, juniper, mirage, almas, alsakhrah with branches; sample products for oaza and maqsoud

## Frontend
`supabase-config.js` uses NEW project URL + anon key only.
