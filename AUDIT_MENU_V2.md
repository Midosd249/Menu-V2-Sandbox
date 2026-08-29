# MENU V2 Technical Audit

**Author:** Manus AI  
**Production source of truth:** `Midosd249/Menu` at `7a848e8`  
**Visual reference:** `Midosd249/urban-palm-clear-flora` at `07b6271`

## Evidence-based comparison

| Area | Repository A: Menu | Repository B: urban-palm-clear-flora | Winner | Reason | Action |
|---|---|---|---|---|---|
| Architecture | Static production app with Supabase Auth, Postgres, RLS, storage and RPCs in `app.js`, `admin.js`, and SQL migrations. | React/TanStack prototype with Better Auth, Neon/PGLite-oriented code and generated route tree. | A | A is the deployed production foundation. | Keep A; borrow visual composition only. |
| Database | `supabase-schema.sql` and additive V1.1 migrations define tenants, members, branches, hours, categories, products, and events. | `migrations/0001_auth.sql` and `0002_dim.sql` describe a separate prototype model. | A | Only A matches the production Supabase data plane. | Do not merge B schema. |
| Authentication | Supabase Auth in `admin.js`, gated by `tenant_members`. | Better Auth/provider stack in `src/lib/auth`. | A | Mixing auth systems would break the security boundary. | Keep Supabase Auth. |
| Authorization and RLS | Membership-scoped RLS and secure public RPCs in `public_security_rpc.sql`, `menu_write_policy_cleanup.sql`, and `commercial_performance_migration.sql`. | Prototype gates are application-level and use a different database. | A | Server-side tenant isolation is already established in A. | Preserve and test RLS/RPCs. |
| Public menu | Real RPC-backed data path in `app.js`, with demo fixtures for portfolio previews. | Strong cinematic route in `src/routes/m.$slug.tsx`. | Tie | A has the trusted data path; B has stronger presentation. | Keep A data flow and upgrade A presentation. |
| Owner dashboard | Real CRUD, branding, availability, analytics, uploads and QR hooks in `admin.js`/`admin.html`. | Studio is visually polished but uses prototype data/auth and fake QR. | A | A is operationally real. | Restyle A without importing B backend. |
| Analytics | `get_owner_analytics` aggregates server-side and bounds date range. | Prototype event calls are not production-scoped for A. | A | A avoids shipping raw event rows to the browser. | Keep RPC and add QA coverage. |
| QR | `qrcode@1.5.3` and `QRCode.toCanvas` in `admin.html`/`admin.js`. | `studio.tsx` paints pseudo-random squares. | A | A uses a standards-compliant QR library. | Keep real QR and add URL/path tests. |
| Arabic / RTL | Arabic-first static shell with language toggle and RTL/LTR switching. | Arabic helper in `src/lib/lang.tsx` is clean and reusable as an idea. | Tie | Both support the requirement; A is already integrated with production. | Improve accessibility and copy in A. |
| Commercial readiness | V1.1 commits `08ca789`, `bbdfbe0`, and `7a848e8` provide a controlled production baseline. | Exported prototype and demo/public data are not a customer SaaS. | A | A has the safer go-to-market path. | Controlled owner onboarding only until tenant-creation RPC exists. |
| Maintainability | Four large static files, but simple deployment and direct Supabase integration. | Typed React routes and component boundaries. | B for code organization; A for deployment safety | B is easier to extend, but incompatible backend/auth prevents direct merge. | Apply focused refactors only; no rewrite. |
| Deployment | `vercel.json` and static files; existing production configuration. | Vite/Nitro prototype with separate deployment assumptions. | A | User explicitly requires no Vercel replacement and no backend replacement. | Keep current deployment path and document URL format. |

## Verified decisions

Repository A remains authoritative. Repository B contributes only visual ideas: full-bleed cover composition, calm dark studio chrome, featured discovery, product sheet/modal, and Arabic-first language affordances. B's Better Auth, Neon/PGLite model, demo-write path, and pseudo-QR are excluded.

RBAC roles exist in the schema history but are not sufficiently enforced as distinct permissions in the current UI. V2 therefore treats a controlled first customer as a single trusted owner account and does not advertise editor/admin permission separation.

## Scope of this continuation

The implementation keeps Supabase Auth, RLS, storage, public RPCs, analytics RPC, tenant membership, and existing production files. Changes are additive and focused on public-menu routing/data integrity, premium interaction polish, studio safety, documentation, and verification. No destructive SQL or production data mutation is included.

## References

[1]: https://github.com/Midosd249/Menu "Menu production repository"
[2]: https://github.com/Midosd249/urban-palm-clear-flora "Premium UI reference repository"
