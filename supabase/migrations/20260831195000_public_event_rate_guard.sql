-- Server-side rate guard for public menu analytics. The client token is per browser session
-- and only reduces accidental/repeated event flooding; it never grants access to tenant data.

alter table public.menu_events
  add column if not exists client_token text;

create index if not exists menu_events_rate_guard_idx
  on public.menu_events (branch_id, client_token, event_type, created_at desc);

-- Replace the legacy five-argument RPC with a backwards-compatible six-argument
-- definition (the last argument has a default). All deployed clients continue to resolve,
-- while current clients provide a per-session token for rate limiting.
drop function if exists public.record_public_menu_event(text, text, text, uuid, text);

create function public.record_public_menu_event(
  p_tenant_slug text,
  p_branch_slug text,
  p_event_type text,
  p_product_id uuid default null,
  p_lang text default null,
  p_client_token text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant_id uuid;
  v_branch_id uuid;
  v_client_token text := nullif(trim(coalesce(p_client_token, '')), '');
  v_recent_events integer;
begin
  if p_event_type not in ('visit', 'product_view') then
    raise exception 'invalid event type';
  end if;
  if v_client_token is null or char_length(v_client_token) < 16 or char_length(v_client_token) > 120 or v_client_token !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'invalid client token';
  end if;

  select t.id into v_tenant_id
  from public.tenants t
  where t.slug = lower(trim(p_tenant_slug)) and t.is_active = true
  limit 1;
  if v_tenant_id is null then
    raise exception 'invalid tenant';
  end if;

  select b.id into v_branch_id
  from public.branches b
  where b.tenant_id = v_tenant_id
    and b.slug = lower(trim(p_branch_slug))
    and b.is_active = true
  limit 1;
  if v_branch_id is null then
    raise exception 'invalid branch';
  end if;

  if p_event_type = 'product_view' then
    if p_product_id is null or not exists (
      select 1 from public.products p
      where p.id = p_product_id
        and p.tenant_id = v_tenant_id
        and p.is_available = true
    ) then
      raise exception 'invalid product';
    end if;
  end if;

  select count(*) into v_recent_events
  from public.menu_events event
  where event.branch_id = v_branch_id
    and event.event_type = p_event_type
    and event.client_token = v_client_token
    and event.created_at >= now() - interval '1 minute';
  if v_recent_events >= 8 then
    return;
  end if;

  insert into public.menu_events (tenant_id, branch_id, product_id, event_type, lang, client_token)
  values (v_tenant_id, v_branch_id, p_product_id, p_event_type, nullif(trim(p_lang), ''), v_client_token);
end;
$$;

revoke all on function public.record_public_menu_event(text, text, text, uuid, text, text) from public;
grant execute on function public.record_public_menu_event(text, text, text, uuid, text, text) to anon, authenticated;
