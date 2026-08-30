-- Multi-market foundation for Menu V2
-- SA remains default. Existing rows stay valid (nullable + defaults).
-- Does not alter RLS policies or weaken tenant isolation.

alter table public.tenants
  add column if not exists country_code text not null default 'SA';

alter table public.website_projects
  add column if not exists country_code text not null default 'SA',
  add column if not exists region text,
  add column if not exists currency text not null default 'SAR',
  add column if not exists phone_country_code text;

create index if not exists website_projects_country_idx
  on public.website_projects(country_code);

alter table public.visibility_audits
  add column if not exists country_code text not null default 'SA',
  add column if not exists region text;

create index if not exists visibility_audits_country_idx
  on public.visibility_audits(country_code);

create or replace function public.submit_website_brief(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_type text;
  v_name_ar text;
  v_lang text;
  v_style text;
  v_country text;
  v_currency text;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid payload';
  end if;

  v_type := nullif(trim(p_payload->>'business_type'), '');
  v_name_ar := nullif(trim(p_payload->>'name_ar'), '');
  v_lang := coalesce(nullif(trim(p_payload->>'language'), ''), 'ar');
  v_style := coalesce(nullif(trim(p_payload->>'style_key'), ''), 'modern');
  v_country := upper(coalesce(nullif(trim(p_payload->>'country_code'), ''), 'SA'));
  if char_length(v_country) > 2 then v_country := 'SA'; end if;
  v_currency := coalesce(nullif(trim(p_payload->>'currency'), ''), 'SAR');
  if char_length(v_currency) > 8 then v_currency := 'SAR'; end if;

  if v_type is null or char_length(v_type) > 64 then
    raise exception 'business_type required';
  end if;
  if v_name_ar is null or char_length(v_name_ar) > 160 then
    raise exception 'name_ar required';
  end if;
  if v_lang not in ('ar','en','both') then
    raise exception 'invalid language';
  end if;

  insert into public.website_projects (
    user_id, status, business_type, name_ar, name_en,
    short_desc, full_desc, phone, whatsapp, email,
    address, city, maps_url, social, hours, services,
    brand, language, style_key, pages, special_notes,
    contact_name, contact_phone,
    country_code, region, currency, phone_country_code
  ) values (
    (select auth.uid()),
    'submitted',
    v_type,
    v_name_ar,
    nullif(trim(p_payload->>'name_en'), ''),
    nullif(trim(p_payload->>'short_desc'), ''),
    nullif(trim(p_payload->>'full_desc'), ''),
    nullif(trim(p_payload->>'phone'), ''),
    nullif(trim(p_payload->>'whatsapp'), ''),
    nullif(trim(p_payload->>'email'), ''),
    nullif(trim(p_payload->>'address'), ''),
    nullif(trim(p_payload->>'city'), ''),
    nullif(trim(p_payload->>'maps_url'), ''),
    coalesce(p_payload->'social', '{}'::jsonb),
    coalesce(p_payload->'hours', '{}'::jsonb),
    coalesce(p_payload->'services', '[]'::jsonb),
    coalesce(p_payload->'brand', '{}'::jsonb),
    v_lang,
    v_style,
    coalesce(p_payload->'pages', '[]'::jsonb),
    nullif(trim(p_payload->>'special_notes'), ''),
    nullif(trim(p_payload->>'contact_name'), ''),
    nullif(trim(p_payload->>'contact_phone'), ''),
    v_country,
    nullif(trim(p_payload->>'region'), ''),
    v_currency,
    nullif(trim(p_payload->>'phone_country_code'), '')
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'status', 'submitted',
    'name_ar', v_name_ar,
    'business_type', v_type,
    'country_code', v_country
  );
end;
$$;

revoke all on function public.submit_website_brief(jsonb) from public;
grant execute on function public.submit_website_brief(jsonb) to anon, authenticated;

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
  v_country text;
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

  v_country := upper(coalesce(nullif(trim(p_payload->>'country_code'), ''), 'SA'));
  if char_length(v_country) > 2 then v_country := 'SA'; end if;

  v_breakdown := coalesce(p_payload->'score_breakdown', '{}'::jsonb);
  v_findings := coalesce(p_payload->'findings', '[]'::jsonb);
  v_actions := coalesce(p_payload->'action_plan', '[]'::jsonb);
  v_checklist := coalesce(p_payload->'checklist', '{}'::jsonb);
  v_plan := coalesce(p_payload->'plan_30d', '{}'::jsonb);

  insert into public.visibility_audits (
    user_id, status, business_name, business_category, city, neighborhood,
    maps_url, website_url, social, phone, whatsapp, inputs,
    score_total, score_breakdown, findings, action_plan, checklist, plan_30d,
    report_summary, notes, country_code, region
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
    nullif(trim(p_payload->>'notes'), ''),
    v_country,
    nullif(trim(p_payload->>'region'), '')
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'status', 'submitted',
    'business_name', v_name,
    'score_total', v_score,
    'country_code', v_country
  );
end;
$$;

revoke all on function public.submit_visibility_audit(jsonb) from public;
grant execute on function public.submit_visibility_audit(jsonb) to anon, authenticated;
