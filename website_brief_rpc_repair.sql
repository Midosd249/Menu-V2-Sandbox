-- Repair: restore the website brief submission RPC used by website.js.
-- Safe additive/replace-only migration. No existing rows are deleted or reset.
-- Apply this migration to Supabase project ublxptcqefujkbeepylc.

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
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid payload';
  end if;

  v_type := nullif(trim(p_payload->>'business_type'), '');
  v_name_ar := nullif(trim(p_payload->>'name_ar'), '');
  v_lang := coalesce(nullif(trim(p_payload->>'language'), ''), 'ar');
  v_style := coalesce(nullif(trim(p_payload->>'style_key'), ''), 'modern');

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
    contact_name, contact_phone
  ) values (
    auth.uid(),
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
    nullif(trim(p_payload->>'contact_phone'), '')
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'status', 'submitted',
    'name_ar', v_name_ar,
    'business_type', v_type
  );
end;
$$;

revoke all on function public.submit_website_brief(jsonb) from public;
grant execute on function public.submit_website_brief(jsonb) to anon, authenticated;
