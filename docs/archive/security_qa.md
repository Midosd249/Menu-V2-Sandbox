# Critical security QA

Date: 2026-08-28. Project: `ebirwuigujqosfarqmqa`.

| Scenario | Result |
| --- | --- |
| Anonymous `get_public_menu(almas, malaz)` | HTTP 200; AL MAS tenant and Malaz branch returned |
| Anonymous `get_public_menu(alsakhrah, malaz)` | HTTP 200; Alsakhrah tenant and Malaz branch returned |
| Anonymous mismatched `get_public_menu(almas, main)` | HTTP 200 with `null`; no cross-tenant/invalid branch data |
| Anonymous unknown tenant | HTTP 200 with `null` |
| Anonymous direct `tenants` SELECT | HTTP 200 with `[]`; no base-table rows exposed |
| Anonymous direct `branches` SELECT | HTTP 200 with `[]`; no base-table rows exposed |
| Anonymous direct `categories` SELECT | HTTP 200 with `[]`; no base-table rows exposed |
| Anonymous direct `products` SELECT | HTTP 200 with `[]`; no base-table rows exposed |
| Invalid product analytics RPC | HTTP 400 `invalid product` |
| Direct anonymous `menu_events` INSERT | HTTP 401; RLS rejected the row |
| Invalid tenant/branch browser routes | Explicit unavailable/invalid-link state |
| JavaScript syntax and browser DOM regression | Passed for AL MAS, Alsakhrah, and admin |
| Supabase security advisor | `lints: []` |
| Secret scan | No service-role, private-key, or secret-key patterns found |

Two real authenticated cross-tenant mutation tests require non-production Supabase test accounts with separate `tenant_members` rows. The policies are membership-scoped; no credentials were available for an authenticated destructive test in this session, so production credentials were not fabricated or used.
