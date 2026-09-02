# MENU V2 Security Audit

The production security baseline remains the Supabase model from Repository A. The public RPC validates tenant slug, active branch slug, event type, and product ownership/availability before insertion. The owner analytics RPC rejects anonymous callers, selects a tenant from `tenant_members`, bounds the date range, and returns aggregates rather than raw events.

The studio's `.eq('tenant_id', ...)` selectors improve query locality but are not treated as authorization. RLS policies in the production migration history remain the enforcement layer. No client code receives a service-role key, database credential, or private table bypass. Storage uploads use a tenant-prefixed path and rely on storage policies for isolation.

A fresh staging security run must still be executed with two authenticated users before self-serve onboarding or role-based commercial claims. The current product decision is controlled single-owner onboarding.
