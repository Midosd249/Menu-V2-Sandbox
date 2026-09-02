# MENU V2 Test Report

**Run date:** 2026-08-28  
**Repository:** `Midosd249/Menu`  
**Baseline:** `7a848e8`

## Automated and live checks

| Check | Result | Evidence |
|---|---|---|
| JavaScript parse | PASS | `node --check app.js`; `node --check admin.js` |
| Static entry files | PASS | Local HTTP 200 for `index.html`, `admin.html`, `styles.css`, `app.js`, `admin.js`, and `favicon.svg` |
| Valid public menu RPC | PASS | `get_public_menu` returned the known `almas` / `malaz` tenant and branch payload |
| Invalid tenant | PASS | `get_public_menu` returned JSON `null` |
| Invalid branch | PASS | `get_public_menu` returned JSON `null`; event recorder rejected invalid branch |
| Public visit/product event | PASS | Valid event recorder call returned an empty success response |
| Invalid product event | PASS | Recorder returned `invalid product` |
| Cross-tenant product event | PASS | Recorder returned `invalid product` when an Almas product ID was used for Alsakhrah |
| Anonymous base-table access | PASS | Anonymous REST reads returned empty arrays for tenants, branches, products, and tenant_members |
| Anonymous owner analytics | PASS | `get_owner_analytics` returned `not authenticated` |
| QR implementation | PASS | Production studio loads `qrcode@1.5.3` and calls `QRCode.toCanvas`; prototype pseudo-QR remains excluded |
| Source safety scan | PASS | No service-role key or database credential is present in the client configuration; `git diff --check` reported only a trailing blank-line warning |

## Scope limitations

The browser connector was unavailable for screenshot-level interaction testing in this run. The static server and HTTP smoke checks passed, and JavaScript parsing passed, but a real authenticated owner session was not available in the sandbox for login, CRUD, uploads, or owner analytics with a bearer session. Those workflows remain protected by Supabase Auth and RLS and should be exercised in staging or by the first controlled owner account.

## Interpretation

The live public RPC and event validation enforce the critical anonymous boundary. The test suite did not execute destructive writes. One successful analytics event was recorded as part of validating the intended public event path; it contains no customer content and does not alter menu data.
