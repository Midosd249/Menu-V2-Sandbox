# MENU V2 Gap Analysis

| Gap | Existing condition | V2 disposition |
|---|---|---|
| Real tenant routing | The initial client accepted only demo keys. | Fixed: arbitrary tenant slugs now reach the production RPC; demo data remains only for known local fixtures.
| Branch URLs | Query parameters were supported; premium route used path segments. | Fixed: `/m/<tenant>/<branch>` is parsed in addition to the existing query format.
| Live failure safety | RPC failure could leave a demo-looking menu on a configured production host. | Fixed: configured Supabase failures now render an unavailable state rather than silently claiming live data.
| QR | Repository A uses `qrcode@1.5.3`; prototype QR is pseudo-random. | Keep and verify Repository A implementation.
| RBAC | Roles exist historically but distinct permissions are not fully enforced in UI. | Do not advertise RBAC; controlled owner onboarding only.
| Default branch | The RPC contains first-active-branch fallback; client accepts the returned branch slug. | Preserve server-side resolution; explicitly include branch slug in event calls after resolution.
| Analytics | Server aggregation exists with bounded 1–90 day range. | Keep RPC; never ship raw event table to browser.
| Demo/customer separation | Local fixtures exist for portfolio previews. | Live Supabase data is never replaced by demo fixtures after a configured RPC failure.
