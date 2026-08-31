-- Owner email notification metadata only.
-- Additive migration: no existing rows are deleted or modified.

alter table if exists public.website_projects
  add column if not exists owner_notified_at timestamptz,
  add column if not exists owner_notification_error text;

alter table if exists public.service_requests
  add column if not exists owner_notified_at timestamptz,
  add column if not exists owner_notification_error text;

create index if not exists website_projects_owner_notified_idx
  on public.website_projects(owner_notified_at)
  where owner_notified_at is null;

create index if not exists service_requests_owner_notified_idx
  on public.service_requests(owner_notified_at)
  where owner_notified_at is null;
