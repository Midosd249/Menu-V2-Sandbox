# MENU V2 Production Readiness

**Decision: READY for a controlled first paying restaurant onboarding; NOT READY for self-serve onboarding or unverified role-based sales claims.**

## What changed

Repository A was preserved as the production source. The public client now accepts both the established query URL and `/m/<tenant>/<branch>` path segments, passes real tenant slugs to `get_public_menu`, preserves the RPC-resolved branch slug for event recording, respects the returned currency, validates external links and image URLs, and renders a clear unavailable state when a configured live RPC fails instead of silently presenting demo content. Product image markup now carries meaningful alt text. The shared stylesheet received a restrained premium layer inspired by Repository B, including stronger hero composition, glass treatment, focus states, touch sizing, reduced-motion behavior, and mobile layout refinements.

The studio continues to use Supabase Auth, `tenant_members`, RLS-protected table operations, storage uploads, server-side owner analytics, and `qrcode@1.5.3`. No Better Auth, Neon, PGLite, fake QR, service-role key, new backend, database replacement, destructive SQL, or Vercel migration was added.

## Reuse and exclusions

| Area | Reused from A | Reused from B | Intentionally not used |
|---|---|---|---|
| Security | Supabase Auth, tenant membership, RLS, public RPCs, storage policy model | None | Better Auth, client-only authorization |
| Public menu | Live tenant/branch/category/product data and analytics events | Cinematic hero, featured discovery, calm premium composition | Demo data on configured live failure |
| Studio | Existing real CRUD, health, onboarding, analytics, branding, QR | Visual restraint and information hierarchy | Prototype studio data model |
| QR | `QRCode.toCanvas`, exact URL, PNG download | None | Pseudo-random canvas QR |
| Database | Existing schema and V1.1 additive migrations | None | Parallel schema or destructive migration |

## Database and deployment

No database migration was required in this continuation because the live V1.1 columns and RPC contracts were already present and validated through the public endpoint. The production deployment remains the existing static Menu deployment. The canonical existing URL shape is `https://<production-host>/index.html?tenant=<tenant-slug>&branch=<branch-slug>`. Where the host is configured to rewrite `/m/*` to `index.html`, the preferred customer-facing format is `https://<production-host>/m/<tenant-slug>/<branch-slug>`.

Before onboarding a paying restaurant, set the production host, ensure `supabase-config.js` contains only the publishable/anon key, create the tenant and owner membership through the existing controlled operator process, configure at least one active branch, verify the menu-assets storage policy, and run the owner-session smoke test.

## Remaining limitations

Distinct owner/admin/editor permissions are not advertised as implemented. Self-serve restaurant creation is not enabled because there is no dedicated safe tenant-creation RPC in this change. Screenshot-level browser QA and authenticated owner CRUD QA could not be completed in this sandbox because the browser connection was unavailable and no owner session was provided. These are operational validation steps, not reasons to replace the production architecture.

## Go/no-go

**GO** for a controlled first customer with a single trusted owner account and operator-assisted tenant setup. **NO-GO** for a blind migration to Repository B, self-serve signup, or claims that granular RBAC is complete.

## References

[1]: https://github.com/Midosd249/Menu "Menu production repository"
[2]: https://github.com/Midosd249/urban-palm-clear-flora "Premium UI reference repository"
