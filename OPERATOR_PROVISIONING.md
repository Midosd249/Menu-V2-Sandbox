# Platform Operator Provisioning

## One-time operator registration

Provisioning is gated by the private table `platform_operators`.
No client can read or write this table (RLS on, no policies).

As a Supabase project owner (SQL Editor / service role), register yourself once:

```sql
insert into public.platform_operators (user_id)
values ('YOUR-AUTH-USER-UUID')
on conflict do nothing;
```

Find your Auth user UUID in Supabase Dashboard → Authentication → Users.

## New customer flow

1. Create/invite the customer Auth account (Supabase Auth). Do **not** insert into `auth.users` from app code.
2. Copy the customer's Auth user UUID.
3. Sign in to Admin as a registered platform operator.
4. Open **البدء السريع** → **إنشاء مطعم جديد**.
5. Submit: name, slug, default branch name, owner Auth UUID.
6. Customer signs in to Admin and sees only their tenant.

## Security

- `provision_restaurant` is SECURITY DEFINER with `search_path = public, pg_temp`.
- Caller must be in `platform_operators` (checked inside the function).
- Ordinary authenticated users receive `not authorized`.
- Existing RLS on `tenants` / `tenant_members` is unchanged; clients still cannot insert tenants or memberships directly.
- No service-role key is used in the browser.
- Audit log table is deferred.

## Functions

- `is_platform_operator()` → boolean
- `provision_restaurant(p_name, p_slug, p_branch_name, p_owner_user_id, p_branch_slug default 'main')` → jsonb
