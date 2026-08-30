-- Local Visibility Audit service for Menu
-- Visibility Audit + Action Plan (no direct Google API claims)
-- Does not weaken existing tenant/menu RLS.

create table if not exists public.visibility_audits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'submitted'
    check (status in ('draft','submitted','info_required','in_progress','review','ready','completed')),
  business_name text not null,
  business_category text,
  city text,
  neighborhood text,
  maps_url text,
  website_url text,
  social jsonb not null default '{}'::jsonb,
  phone text,
  whatsapp text,
  inputs jsonb not null default '{}'::jsonb,
  score_total int,
  score_breakdown jsonb not null default '{}'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  action_plan jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '{}'::jsonb,
  plan_30d jsonb not null default '{}'::jsonb,
  report_summary text,
  notes text
);

create index if not exists visibility_audits_user_idx on public.visibility_audits(user_id);
create index if not exists visibility_audits_status_idx on public.visibility_audits(status);
create index if not exists visibility_audits_created_idx on public.visibility_audits(created_at desc);

alter table public.visibility_audits enable row level security;

drop policy if exists "visibility_audits_owner_select" on public.visibility_audits;
create policy "visibility_audits_owner_select" on public.visibility_audits
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_platform_operator());

drop policy if exists "visibility_audits_owner_update" on public.visibility_audits;
create policy "visibility_audits_owner_update" on public.visibility_audits
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_platform_operator())
  with check (user_id = (select auth.uid()) or public.is_platform_operator());

revoke insert on public.visibility_audits from anon, authenticated, public;

create or replace function public.submit_visibility_audit(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_name text;
  v_score int;
  v_breakdown jsonb;
  v_findings jsonb;
  v_actions jsonb;
  v_checklist jsonb;
  v_plan jsonb;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid payload';
  end if;

  v_name := nullif(trim(p_payload->>'business_name'), '');
  if v_name is null or char_length(v_name) > 200 then
    raise exception 'business_name required';
  end if;

  v_score := nullif(p_payload->>'score_total', '')::int;
  if v_score is not null and (v_score < 0 or v_score > 100) then
    raise exception 'invalid score';
  end if;

  v_breakdown := coalesce(p_payload->'score_breakdown', '{}'::jsonb);
  v_findings := coalesce(p_payload->'findings', '[]'::jsonb);
  v_actions := coalesce(p_payload->'action_plan', '[]'::jsonb);
  v_checklist := coalesce(p_payload->'checklist', '{}'::jsonb);
  v_plan := coalesce(p_payload->'plan_30d', '{}'::jsonb);

  insert into public.visibility_audits (
    user_id, status, business_name, business_category, city, neighborhood,
    maps_url, website_url, social, phone, whatsapp, inputs,
    score_total, score_breakdown, findings, action_plan, checklist, plan_30d,
    report_summary, notes
  ) values (
    (select auth.uid()),
    'submitted',
    v_name,
    nullif(trim(p_payload->>'business_category'), ''),
    nullif(trim(p_payload->>'city'), ''),
    nullif(trim(p_payload->>'neighborhood'), ''),
    nullif(trim(p_payload->>'maps_url'), ''),
    nullif(trim(p_payload->>'website_url'), ''),
    coalesce(p_payload->'social', '{}'::jsonb),
    nullif(trim(p_payload->>'phone'), ''),
    nullif(trim(p_payload->>'whatsapp'), ''),
    coalesce(p_payload->'inputs', '{}'::jsonb),
    v_score,
    v_breakdown,
    v_findings,
    v_actions,
    v_checklist,
    v_plan,
    nullif(trim(p_payload->>'report_summary'), ''),
    nullif(trim(p_payload->>'notes'), '')
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'status', 'submitted',
    'business_name', v_name,
    'score_total', v_score
  );
end;
$$;

revoke all on function public.submit_visibility_audit(jsonb) from public;
grant execute on function public.submit_visibility_audit(jsonb) to anon, authenticated;

create or replace function public.list_visibility_audits()
returns setof public.visibility_audits
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_platform_operator() then
    raise exception 'not authorized';
  end if;
  return query
    select * from public.visibility_audits
    order by created_at desc
    limit 100;
end;
$$;

revoke all on function public.list_visibility_audits() from public;
grant execute on function public.list_visibility_audits() to authenticated;
