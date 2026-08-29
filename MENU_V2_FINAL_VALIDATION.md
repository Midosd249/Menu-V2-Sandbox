# MENU V2 Final Validation

**Repository:** `Midosd249/Menu`  
**Branch:** `main`  
**Starting commit:** `7b6f3c942c314e8b27974d077e1f4d6062152c37`  
**Validation date:** 2026-08-28

> **Evidence policy:** PASS means actually tested. UNTESTED means the environment did not permit the test. ASSUMED is not used as production evidence.

## Authenticated Owner workflow

| Test | Result | Evidence / limitation |
|---|---|---|
| Real authenticated owner session available | UNTESTED | No owner credentials or authenticated session were available. The connected My Browser session could not establish a receiving connection. No credentials were requested or fabricated. |
| Login, dashboard, tenant/branch visibility | UNTESTED | Requires the unavailable authenticated session. |
| Category create/edit/delete | UNTESTED | Requires the unavailable authenticated session. |
| Product create/edit/delete and fields | UNTESTED | Requires the unavailable authenticated session. |
| Product image upload | UNTESTED | Requires the unavailable authenticated session and a real image fixture. |
| WhatsApp configuration persistence | UNTESTED | Requires the unavailable authenticated session. |
| Analytics and reload persistence | UNTESTED | Requires the unavailable authenticated session. |
| Logout | UNTESTED | Requires the unavailable authenticated session. |
| Anonymous admin state | PASS | Real Chromium DOM showed `authState=غير مسجل`, login visible, and logout hidden. |
| Anonymous private-data access / RLS boundary | PASS | Live anonymous REST reads previously returned empty arrays for private tables, and anonymous `get_owner_analytics` returned `not authenticated`; no client-side RLS bypass was observed. |

## Real browser and UI validation

| Test | Result | Evidence |
|---|---|---|
| 360px rendered UI | PASS | Real Chromium screenshot captured at 360x900. RTL hero, action cards, readable text, and no visible overlap/clipping. |
| 390px rendered UI | PASS | Real Chromium screenshot captured at 390x900. |
| 768px rendered UI | PASS | Real Chromium screenshot captured at 768x900. |
| Desktop rendered UI | PASS | Real Chromium screenshot captured at 1440x900. |
| RTL and language toggle | PASS | Chromium interaction test observed `lang=ar, dir=rtl`, then toggled to `lang=en, dir=ltr`. |
| Live menu loading | PASS | Settled DOM showed `AL MAS Family Restaurant`, `فرع الملز`, `مباشر · Live`, 4 product buttons, 2 category buttons, and product content. |
| Category interaction | PASS | Real DOM click selected a category and reduced the rendered section set to one section. |
| Product interaction and focus | PASS | Real DOM click opened the modal for `Masala Dosa`; modal WhatsApp element received focus. |
| Branch information | PASS | Settled DOM showed `فرع الملز`. |
| Product image rendering | PASS | Settled DOM contained one product image element. |
| Horizontal overflow | PASS | Chromium runtime reported `document.documentElement.scrollWidth > window.innerWidth` as false at 390px. |
| Runtime exception scan | PASS | No application `Uncaught`, `ReferenceError`, `TypeError`, or `SyntaxError` appeared in the Chromium captures. |
| Invalid tenant / branch | PASS | Real Chromium DOM showed zero items and the explicit unavailable state for both invalid URLs. |
| Loading state | PASS | Real Chromium screenshots showed explicit `جارٍ تحميل القائمة المباشرة…`, not Demo content. |
| Supabase failure state | UNTESTED | A reliable offline simulation was not achieved because Chromium retained a live/cached Supabase result; no failure-state PASS is claimed. |
| Keyboard focus | PASS | Real DOM focus test placed focus on `modalWhatsApp`; screenshot-level tab-order audit was not separately performed. |
| WhatsApp button | UNTESTED | The live `almas` payload has no configured WhatsApp URL, so the modal button was correctly hidden. A real outbound WhatsApp click was not performed. |

## Real QR validation

| Test | Result | Evidence |
|---|---|---|
| QR generation | PASS | Real Chromium generated a visible QR canvas and enabled the PNG download control. |
| Exact destination | PASS | Captured QR state matched `http://127.0.0.1:4175/index.html?tenant=almas&branch=malaz`; the PNG was decoded locally to the exact same string. |
| Destination resolution | PASS | Navigating the decoded destination in Chromium produced `AL MAS Family Restaurant`, `فرع الملز`, and the live menu state. |
| Physical camera scan | UNTESTED | No physical camera was available in the environment. |

## Confirmed defects and fixes

| Defect | Fix |
|---|---|
| Live `almas` and `alsakhrah` pages retained the loading placeholder as the brand name after Supabase returned data. | Live tenant name and tagline now hydrate directly from the returned tenant payload. |
| Production QR script referenced `qrcode@1.5.3/build/qrcode.min.js`, which returned HTTP 404. | The existing QR flow now imports the pinned package through `https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm` and exposes the same `QRCode.toCanvas` API. |
| Supabase failure state retained the loading placeholder as the brand name. | The unavailable state now uses an explicit `القائمة غير متاحة` / `Menu unavailable` label. |

No new features, backend, schema, architecture, authentication system, or Supabase replacement was introduced.

## Exact files changed in this pass

| File | Change |
|---|---|
| `app.js` | Hydrate live brand data correctly and use explicit unavailable branding. |
| `admin.html` | Repair the broken pinned QR browser asset import without changing the existing QR API. |
| `MENU_V2_FINAL_VALIDATION.md` | Record the final evidence and limitations. |

## Final decision

**CONDITIONAL GO.** Real Chromium validation now covers the requested viewport rendering, RTL, live loading, navigation/category/product interaction, focus, overflow, invalid routes, runtime exceptions, and generated QR payload. The owner workflow remains **UNTESTED**, not assumed successful, because no authenticated owner session was available. Physical camera scanning, outbound WhatsApp behavior, and a reliable network-failure simulation also remain **UNTESTED**.
