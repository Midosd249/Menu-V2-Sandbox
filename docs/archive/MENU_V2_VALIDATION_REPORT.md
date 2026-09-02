# MENU V2 Production Validation Report

**Repository:** `Midosd249/Menu`  
**Branch:** `main`  
**Validated baseline:** `cd1b286290b01be5bf370e4814e4fecf2d508499`  
**Validation date:** 2026-08-28

## Confirmed bugs and fixes

| Bug found during validation | Fix applied |
|---|---|
| A configured production page initialized with known local fixture data while Supabase was loading and labeled the page as Demo. This violated the no-silent-fallback requirement and could expose stale fixture content during a slow request. | `app.js` now initializes configured pages with an explicit loading placeholder and `جاري التحميل` / `Loading live menu…` status. Demo fixtures are used only when no Supabase configuration exists. |
| An attempted empty-data refactor referenced an undefined `emptyData` identifier, which would have caused a startup `ReferenceError`. | Removed the undefined reference and replaced it with an explicit loading data object; `node --check app.js` passes. |
| An invalid image URL could still produce an `<img src="">` branch, and an untrusted phone value was assigned directly to an anchor href. | Image rendering now requires `safeImage(...)`; phone href assignment uses `safeLink(...)`. |

No architecture, backend, database, authentication, RLS, or major feature changes were made.

## Tests performed

| Test | Result |
|---|---|
| `get_public_menu` for live `almas/malaz` | PASS; tenant, branch, categories, and products returned. |
| Invalid tenant and invalid branch public RPC | PASS; both returned `null`. |
| Valid public product event | PASS; RPC returned success. |
| Invalid product event | PASS; rejected as `invalid product`. |
| Cross-tenant product event | PASS; rejected as `invalid product`. |
| Anonymous reads of tenants, branches, products, and tenant_members | PASS; empty result sets. |
| Anonymous `get_owner_analytics` | PASS; rejected as `not authenticated`. |
| Static HTTP entries | PASS; `index.html`, invalid public URLs, `admin.html`, `app.js`, `admin.js`, and `styles.css` returned HTTP 200 from the local static server. |
| JavaScript syntax | PASS; `node --check app.js` and `node --check admin.js`. |
| QR implementation source | PASS; production path contains `qrcode@1.5.3` and `QRCode.toCanvas`; no fake-QR markers exist in production files. |
| Responsive source coverage | PASS at the rule level; existing mobile breakpoints cover 360/390 widths, the 700px mobile layout, and the two-column desktop/tablet layout. |

## Tests not performed

Browser-level rendering, console capture, screenshot comparison, physical QR scanning, and authenticated owner operations could not be performed because the available browser connection failed with `Could not establish connection. Receiving end does not exist`, and no authenticated owner test session was available. Consequently, no visual or owner-flow result is claimed here. The 360px, 390px, 768px, and desktop responsive checks were verified against source breakpoints only, not through rendered screenshots.

## Decision

**CONDITIONAL GO.** The public data path, invalid-input behavior, anonymous security boundary, JavaScript startup checks, and static delivery checks passed after the fixes. A controlled first customer remains possible, but final GO requires one real browser session for rendered mobile/desktop QA, QR decoding, and authenticated owner CRUD/upload/analytics smoke testing.
