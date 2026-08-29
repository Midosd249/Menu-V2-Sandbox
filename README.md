# Menu — Premium Digital Menu SaaS MVP

Menu is a mobile-first Arabic-first digital menu platform for Saudi cafes and restaurants. This iteration continues the existing `Midosd249/Menu` project rather than creating a separate application. The public menu is designed for QR scans, while `admin.html` provides a browser-based demo workspace for managing three independent tenant fixtures.

## Implemented in this repository

The public experience now supports generic tenant routing through `?tenant=oaza`, `?tenant=juniper`, or `?tenant=mirage`, plus branch selection through `&branch=main`. It first renders the premium local fixture for fast perceived load, then fetches the selected tenant, active branch, active categories, and available products from Supabase using the browser-safe publishable key. Arabic/English switching, RTL/LTR layout, branch status, contact/location actions, search across bilingual names and descriptions, sticky horizontal categories, featured items, availability states, VAT messaging, item detail sheets, keyboard escape handling, responsive mobile cards, and a graceful fallback remain available.

The admin experience supports tenant selection, branch selection and editing, tenant-aware public URLs, Supabase email/password login and logout, membership-aware live tenant loading, profile updates, colors and logo URL, local fallback persistence, product creation/editing/deletion, Arabic and English fields, price validation, availability and featured flags, preview links, product image validation/upload to the `menu-assets` bucket, and menu visit event insertion. QR preview, copy, and PNG download are implemented with a browser QR library.

The included `supabase-schema.sql` is the production data model. The repository also includes `almas-seed.sql` and `ALMAS_research.md` for the verified portfolio case study. It contains tenants, branches, categories, products, tenant memberships, branch hours, and menu analytics events. Row-level security is enabled, public menu reads are limited to active/available content, and dashboard writes are membership-scoped. The schema seeds the original three demo tenants; `almas-seed.sql` adds the clearly labeled AL MAS portfolio tenant without representing AL MAS as a client or partner.

## AL MAS portfolio tenant

`AL MAS Family Restaurant` is included as a separate portfolio case study at `index.html?tenant=almas&branch=malaz`. Public sources verify the restaurant identity, Indian/North and South Indian plus Arabic and Chinese positioning, the Al Malaz location, Instagram presence, and selected phone/address references. Because no stable current official menu or opening hours could be verified, the case study uses a small **prototype reference dataset**, displays prices as **السعر حسب التوفر / Price on request**, and shows hours as unpublished. The public-source research and attribution boundaries are recorded in [`ALMAS_research.md`](ALMAS_research.md), and the reproducible database seed is [`almas-seed.sql`](almas-seed.sql).

Sources used for the portfolio case study are [AL MAS Family Restaurant on Facebook][1], [AL MAS Restaurant on Instagram][2], and [AL MAS Restaurant on Tripadvisor][3].

## Local run

The project is intentionally lightweight and can be previewed as static files:

```bash
python3 -m http.server 4173
# open http://localhost:4173/index.html?tenant=oaza
# admin: http://localhost:4173/admin.html
```

The admin page renders a read-only local preview until a Supabase Auth session is established. Management buttons are disabled for unauthenticated visitors; authenticated users must also have a matching `tenant_members` row. Any localStorage fallback is useful only for portfolio demonstrations and is not an authentication boundary.

## Supabase setup

The current repository is configured against the existing Supabase project through `supabase-config.js`, using only the public publishable key. The production schema and seed migrations have been applied to that project. Never replace the client key with a service-role key or commit any secret. Supabase Auth credentials are entered only in the admin form; tenant membership is checked through RLS and `tenant_members`.

Before first production launch, create an authenticated owner account in Supabase Auth, insert its UUID into `tenant_members` for the intended tenant with `owner` or `admin` role, configure storage policies for the `menu-assets` bucket, and verify the public domain. The localStorage path remains only as a fallback when no live session or live tenant data is available; it is not an authorization boundary.

## Tenant and domain model

Public routing is tenant-ready and uses a generic slug. The intended production mapping is:

| Public address | Meaning |
| --- | --- |
| `menu.example.com/index.html?tenant=oaza` | Current demo-compatible route |
| `oaza.example.com/branch/riyadh` | Recommended branded subdomain route |
| `menu.customer.com/branch/main` | Future custom-domain route |

At deployment time, rewrite the branded host or path to the same application and resolve the tenant from the validated hostname/path on the server. Do not rely on a hidden client-side selector for authorization. The current query-string routes are demo-compatible; a commercial deployment should move tenant resolution to the verified host/path layer.

## Design and competitive research

The visual direction is intentionally original: warm editorial neutrals, dark coffee tones, restrained serif display type, Arabic-first hierarchy, and large touch-friendly controls. The public Oaza Coffee menu at [Yalla QR Codes](https://oaza-coffee.yallaqrcodes.com/branch/1/) was reviewed only as competitive research. Its observed conventions included a branch header, contact/location links, horizontal category navigation, bilingual item naming, prices, calories, and explicit unavailable states. No Oaza logo, proprietary asset, or endorsement claim is used here. Any Oaza-like content is demo/portfolio content only.

## Deployment

The repository can be deployed as a static site to Vercel, Netlify, GitHub Pages, or any CDN that serves HTML/CSS/JavaScript. For Vercel, import the repository, keep the static root, and deploy; `404.html`, `favicon.svg`, and `robots.txt` are included. Configure a custom domain or rewrite branded hosts to the same app, then resolve tenant and branch from validated host/path parameters. Add production response headers, cache policy, stricter Storage policies, and image transformation/CDN handling before broad commercial rollout.

## QA performed and remaining limitations

Static JavaScript syntax was checked with Node. Public and admin HTML were served successfully by a local HTTP server, and Chromium headless DOM checks passed for live tenant routing plus admin rendering. The Supabase schema, seed data, branding/storage migration, and public project configuration were applied through the connected project.

Remaining owner actions are limited to creating/authorizing real admin users, adding `tenant_members` rows, confirming Storage RLS policies, testing the live admin session in the owner’s browser, and configuring the final domain/DNS. Branch-hour rendering, branch create/delete flows, category drag ordering, logo file upload, and full analytics reporting are schema-ready but still require the next product iteration. AL MAS prices, current menu, official opening hours, canonical phone, and final branding still require restaurant confirmation before client-facing publication.

[1]: https://www.facebook.com/almasfamilyrestaurantksa/ "AL MAS Family Restaurant — Facebook"
[2]: https://www.instagram.com/almas_family_restaurant/?hl=en "AL MAS Restaurant — Instagram"
[3]: https://www.tripadvisor.com/Restaurant_Review-g293995-d9883951-Reviews-Al_Mas_Restaurant-Riyadh_Riyadh_Province.html "Al Mas Restaurant — Tripadvisor"

## Alsakhrah Restaurants portfolio tenant

The second restaurant case study is available at `index.html?tenant=alsakhrah&branch=malaz`. It is implemented as an independent tenant and does not alter or replace the existing AL MAS Family Restaurant tenant, which remains available at `index.html?tenant=almas&branch=malaz`.

Public-source research confirmed a public Alsakhrah/مطاعم الصخره identity and Al Malaz presence through the [Facebook page][4] and [Instagram profile][5]. The public KSA Restaurant listing also exposes a Riyadh/Al Dubbat listing with a Turkish category, a 90 SAR price-range label, a landline lead, family/single sections, and Sat–Fri 12 PM–12 AM hours.[6] Because these listing details may be stale or conflict with the social profile, the implementation deliberately does not present them as canonical final restaurant data.

The public Facebook page names **عش البلبل الحموي** and **برك اللحمه** in a 2018 post; these are the only menu item names transcribed into the prototype.[4] Their descriptions, prices, images, exact category, and current availability remain unverified and therefore render as **السعر حسب الطلب / Price on request**. No unverified logo, rating, opening hours, or phone number is presented as final. The supplied address lead and `011 476 6609` contact are included in the prototype route as research leads and require owner confirmation; public social/listing sources expose conflicting contact numbers.

The reproducible database fixture is [`alsakhrah-seed.sql`](alsakhrah-seed.sql), and the complete provenance log is [`ALSAKHRAH_research.md`](ALSAKHRAH_research.md). The seed uses the existing Supabase tables, RLS, Auth, and Storage model and creates the independent `alsakhrah` tenant with the `malaz` branch. The admin selector includes Alsakhrah separately from AL MAS.

[4]: https://www.facebook.com/alsakhrahrestaurant/?locale=en_US "مطاعم الصخره — Facebook"
[5]: https://www.instagram.com/al_sakhrah_rest/ "مطاعم الصخره — Instagram"
[6]: https://ksarestaurant.com/en/listing/riyadh/al-sakhrah "Al Sakhrah — KSARestaurant"

## Final commercial QA pass

The current sales-demo scope contains exactly two independent restaurant case studies:

| Tenant | Public demo URL | Branch |
|---|---|---|
| AL MAS Family Restaurant | `index.html?tenant=almas&branch=malaz` | `malaz` |
| Alsakhrah Restaurants | `index.html?tenant=alsakhrah&branch=malaz` | `malaz` |

The public first render is intentionally local-first and non-blocking: the premium Arabic/RTL fixture renders immediately, then Supabase hydrates the selected tenant, branch, active categories, and available products. If Supabase is unavailable, the customer continues to receive the local case-study experience rather than a blank page. Search, category filtering, item detail, unavailable states, price-on-request states, branch actions, phone/location actions, language switching, empty states, modal escape behavior, responsive cards, and QR-friendly deep links were regression-tested for both case studies.

The admin entry point is `admin.html`. It supports Supabase email/password Auth, tenant membership loading, tenant-scoped data, branch selection, brand colors, logo URL, restaurant links, product CRUD, availability, featured flags, image upload to `menu-assets`, and QR canvas rendering plus PNG download. Once authenticated, the selector is restricted to the tenant identified by the user’s `tenant_members` row; unauthenticated visitors can inspect the demo but cannot perform management mutations.

The final Supabase security advisor returned `lints: []`. The Menu-specific database performance changes add covering indexes for foreign keys and replace row-by-row `auth.uid()` evaluation with `(select auth.uid())`; broad split write policies prevent overlapping permissive SELECT policies while preserving tenant isolation. Remaining performance-advisor findings are limited to unrelated pre-existing `resume_workspaces` objects and low-usage informational indexes in the shared Supabase project, not the Menu authorization model.

### Commercial deployment checklist

Before selling this as a live restaurant service, create one Supabase Auth user per owner, insert only the matching `tenant_members` row for that owner, confirm the owner’s official brand/contact/menu content, replace research leads with approved values, upload approved logo and food photography, verify Storage bucket and CDN behavior, connect the production domain, add permanent redirect/rewrites for `/branch/{slug}`, replace demo hostname/query routing with server- or edge-level tenant resolution, configure monitoring and backups, and test login and updates with a real owner account. The current static deployment is a polished, connected MVP and sales case study; it is not a substitute for the owner-confirmation and domain/onboarding steps above.

## Critical security remediation

The public client no longer reads `tenants`, `branches`, `categories`, or `products` directly. Anonymous access to those base tables is revoked. Public menu data is returned only by the validated `get_public_menu(p_tenant_slug, p_branch_slug)` SECURITY INVOKER RPC, which sets a transaction-local tenant/branch context, resolves the requested active tenant and active branch together, and returns only active categories and available products belonging to that exact tenant. The RPC uses a fixed `search_path`, no dynamic SQL, and grants execute only to the client roles required by the public menu.

Analytics are no longer written through direct anonymous inserts. The client calls `record_public_menu_event(...)`, which validates the event type, tenant slug, active branch ownership, and—for product views—the product tenant, category tenant, active category, product tenant, and availability. Direct `menu_events` insertion is revoked from `anon` and `authenticated`.

Direct anonymous PostgREST verification returned HTTP 401 for base-table reads on `tenants`, `branches`, `categories`, and `products`. Valid public RPC calls returned HTTP 200 for both `almas/malaz` and `alsakhrah/malaz`; invalid `almas/main` and unknown-tenant requests returned a JSON `null` payload. Invalid product analytics returned HTTP 400 with `invalid product`, and a direct anonymous `menu_events` insert returned HTTP 401. This demonstrates database/API enforcement rather than frontend-only filtering.

The committed `supabase-config.js` contains a Supabase publishable/anon key intended for browser use. Repository scanning found no service-role key, private key, or secret-key pattern; no rotation is required for the committed client key. A service-role key must never be placed in this file.

Demo/local mode remains explicitly labeled in the admin page. LocalStorage changes are preview-only; authenticated users with a `tenant_members` row use the live Supabase path, and mutation controls are disabled until authentication. Production onboarding still requires creating the owner account and membership row before any live write can occur.

The direct authenticated cross-tenant mutation scenarios require two real test accounts with memberships. The RLS policies are membership-scoped and were reviewed structurally, but those two scenarios should be rerun in a staging project with non-production credentials during owner onboarding; no test password or account was available to this session.

## Final Auth tenant-isolation staging test

A final live policy review corrected the authenticated branch, category, product, and analytics predicates so each compares `tenant_members.tenant_id` with the target row's qualified tenant ID. The Supabase security advisor returned `lints: []`. Anonymous base-table reads remain empty, public menu RPCs remain tenant/branch validated, direct analytics inserts remain denied, and invalid product analytics requests are rejected.

A complete authenticated two-user staging test was not run because the available Supabase connector exposes database/project operations but no Auth-admin user creation operation, and no temporary credentials were supplied. No fake or production credentials were used. The full matrix and evidence are in [`final_auth_tenant_isolation_report.md`](final_auth_tenant_isolation_report.md).

The `owner`, `admin`, and `editor` values currently exist as membership roles but are not differentiated by the RLS policies or admin UI; all authenticated members of a tenant receive the same tenant-scoped CRUD capability. Treat this as a launch decision: either implement least-privilege role checks before selling role-sensitive access, or explicitly operate the first onboarding with membership-only permissions.

## MENU V1.1 — Commercial product layer

Implemented on top of the verified security foundation (commit `0402375`):

- **Owner analytics dashboard** (7/30 day ranges): visits, product views, top products, category and branch performance, language split via `get_owner_analytics` RPC (membership-scoped).
- **One-click product availability** toggle that updates live `products.is_available` under existing RLS.
- **WhatsApp product deep links** with configurable Arabic message template on the public item modal.
- **Branch-specific QR** generation and PNG download with clear branch labeling.
- **Premium branding controls**: logo, cover/hero image, primary/secondary colors, WhatsApp, Instagram.
- **Menu Health score** with actionable checklist.
- **Onboarding checklist** for non-technical restaurant owners.
- **Strict live / demo separation**: authenticated owners operate only against live Supabase data; public fallback is clearly labeled.

Apply database changes with:

```bash
# In Supabase SQL editor
\i v1_1_commercial_migration.sql
```

Security invariants preserved: public menu remains RPC-only, tenant isolation via RLS + membership, Storage path isolation, validated analytics events.
