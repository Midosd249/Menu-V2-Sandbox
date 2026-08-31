# Supabase — Menu-V2-Sandbox

**Authoritative project:** `ublxptcqefujkbeepylc`  
**API:** https://ublxptcqefujkbeepylc.supabase.co

Previous project `ebirwuigujqosfarqmqa` is intentionally separate and must not be modified.

## Applied migrations (on NEW project)

1. `menu_v2_core_schema` — tables, FKs, indexes, triggers
2. `menu_v2_rls_and_rpcs` — RLS, public RPCs, storage policies
3. `menu_v2_demo_seed` — demo tenants including maqsoud skeleton
4. `menu_v2_fix_search_path` — set_updated_at search_path
5. `maqsoud_full_menu_seed_v2` — full Maqsood Al Malaz menu (17 products, 6 categories, hours)
6. `get_public_menu_include_hours` — public RPC returns branch.hours

Frontend config: `supabase-config.js` points at this project only.
