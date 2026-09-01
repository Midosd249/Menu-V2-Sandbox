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

## Current visual baseline — 2026-09-01

The Arabic marketing entry point renders with a coherent commercial identity, a clear product proposition, service discovery, live examples, and separate customer and operator entry points. The unauthenticated operator portal presents a dedicated sign-in surface without exposing its control actions. The surrounding dashboard content remains present in the document before authentication, however, so subsequent audit work must verify that visibility is controlled by application state and not only by visual styling.

The first viewport of the operator sign-in page is readable, uses an RTL layout, and provides labelled email and password fields. The browser session displayed autofilled values, but source inspection confirms that the document itself provides only `autocomplete` attributes and placeholders; no default credential values are shipped in the markup.

The client portal uses a dedicated unauthenticated entry surface and offers explicitly labelled sandbox demonstrations. The demonstration reveals that the dashboard shell, tenant selector, branch selector, KPI cards, and QR preview can be mounted without a live mutation. Source review is still required before treating its data presentation as production-safe, because these demo records are intentionally in-memory fixtures rather than live tenant data.

## Current implementation audit — 2026-09-01

| Severity | Finding | Impact | Planned remediation |
|---|---|---|---|
| High | Owner data failures clear local collections, reset every KPI to zero, and render empty tables. | A permission or network error can look like a successful empty platform. | Retain the error state, present a visible recovery panel, and reserve zero values for confirmed successful empty responses. |
| High | Client authentication has no revision guard or session-restore error handling, and logout forces a full page reload. | Auth state changes may overlap; the interface does not meet the no-refresh reliability objective. | Add a guarded client portal state machine, a no-refresh logout path, and controlled loading/error transitions. |
| High | The role-hardening helper reads `tenant_members` as a security invoker while legacy policy definitions can query the same relation. | Depending on the deployed policy sequence, membership reads can recurse or fail. | Add a narrow, idempotent migration using a `SECURITY DEFINER` membership helper and a direct own-membership select policy; do not alter existing tenant data. |
| Medium | The repository contains mobile table-card utilities, but neither portal loads the supporting styles or table labelling helper. | Dense desktop tables remain difficult to scan at narrow widths. | Load the existing utility assets in both portal shells and keep generated table labels in sync. |
| Medium | Client loading and error paths do not consistently clear stale state or describe failures; settings fields are never populated. | Users can receive incomplete or misleading feedback. | Centralize portal status updates and populate profile context after successful authorization. |
| Medium | The current main branch has no continuous-integration workflow despite an available static quality gate. | Regressions can be merged without automated baseline validation. | Add a minimal Node quality-gate workflow compatible with the lockfile-free static repository. |
| Low | The owner analytics screen displays a fixed completion percentage before live data is loaded. | A non-derived KPI lowers trust. | Replace the fixed value with an unavailable state until real analytics are available. |

The review of the current migration files confirms that platform operator access, public intake RPCs, and tenant-scoped product and branch policies are designed to be enforced in Supabase rather than by hidden UI. The actual deployed database policy state cannot be confirmed from the local repository alone, so migration application and live RLS verification remain explicit release prerequisites.

The post-change client route remained reachable in the local development environment. Its first automatic extraction was incomplete and showed only the product-dialog labels, so the following validation phase must use rendered page inspection rather than relying on that extraction alone.
