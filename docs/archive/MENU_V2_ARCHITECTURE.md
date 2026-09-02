# MENU V2 Architecture

MENU V2 keeps Repository A as the only production system. Supabase Auth authenticates owners, `tenant_members` identifies the tenant, Postgres RLS enforces tenant boundaries, and the public experience reads only through `get_public_menu`. Public writes are limited to validated analytics events through `record_public_menu_event`; owner analytics are aggregated by `get_owner_analytics`.

The application remains a static, mobile-first frontend. Public URLs support the existing `index.html?tenant=<slug>&branch=<slug>` deployment shape and `/m/<tenant>/<branch>` path parsing where the host provides a rewrite. The branch slug is always passed to the public RPC once resolved. The studio continues to use Supabase Auth and direct table operations protected by RLS; browser-provided tenant, branch, and product identifiers are selectors, never authorization.

The visual system adopts the prototype's cinematic cover, featured discovery, restrained dark palette, Arabic-first language behavior, product sheet, and calmer studio composition without importing Better Auth, Neon, PGLite, prototype tables, or fake QR rendering.

## Data flow

| Surface | Read path | Write path | Security boundary |
|---|---|---|---|
| Public menu | `get_public_menu(tenant_slug, branch_slug)` | `record_public_menu_event(...)` | Validated slugs, active branch, available product, RPC/RLS |
| Studio | Authenticated Supabase table reads | Authenticated table CRUD and storage upload | `tenant_members` plus table/storage RLS |
| Analytics | `get_owner_analytics(days)` | None from browser | Authenticated membership and server-side aggregation |
| QR | Local QR library encodes exact public URL | PNG download only | No data mutation |

## Deliberate non-goals

Self-serve tenant creation, distinct admin/editor permissions, payments, POS, ordering orchestration, and a second backend are intentionally outside this continuation.
