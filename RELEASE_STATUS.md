# RELEASE_STATUS — Menu V2 Controlled First Customer

## Admin runtime architecture (2026-08-31)

Admin UI logic is split into static sequential local files under `admin-runtime/`:

- `00-bootstrap.js` … `06-init.js` (7 files, ~39KB total)
- Loaded by `admin.html` in order via normal `<script src>` tags
- No CDN app loader, no assembler, no `admin.src.*`, no dynamic source execution
- `admin.js` is a documentation shim only (not loaded by admin.html)

Reason: GitHub connector Contents API payload limits; static split preserves full CRUD/Auth/tenant features.

## Gate

- `npm run check` must PASS
- All 7 runtime files present on branch
- `admin.html` loads 00→06 in order
- No `cdn.jsdelivr.net/gh` for admin app code
