-- Website Creation service: production briefs for Menu operator workflow
-- Applied on Supabase as migration website_projects_service
-- Does not weaken existing tenant/menu RLS.

create table if not exists public.website_projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft','submitted','info_required','in_production','review','revision','ready','published')),
  business_type text not null,
  name_ar text not null,
  name_en text,
  short_desc text,
  full_desc text,
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  maps_url text,
  social jsonb not null default '{}'::jsonb,
  hours jsonb not null default '{}'::jsonb,
  services jsonb not null default '[]'::jsonb,
  brand jsonb not null default '{}'::jsonb,
  language text not null default 'ar'
    check (language in ('ar','en','both')),
  style_key text not null default 'modern',
  pages jsonb not null default '[]'::jsonb,
  special_notes text,
  published_url text,
  contact_name text,
  contact_phone text
);

create index if not exists website_projects_user_idx on public.website_projects(user_id);
create index if not exists website_projects_status_idx on public.website_projects(status);
create index if not exists website_projects_created_idx on public.website_projects(created_at desc);

alter table public.website_projects enable row level security;

drop policy if exists "website_projects_owner_select" on public.website_projects;
create policy "website_projects_owner_select" on public.website_projects
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_platform_operator());

drop policy if exists "website_projects_owner_update" on public.website_projects;
create policy "website_projects_owner_update" on public.website_projects
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_platform_operator())
  with check (user_id = (select auth.uid()) or public.is_platform_operator());

revoke insert on public.website_projects from anon, authenticated, public;

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

create or replace function public.list_website_projects()
returns setof public.website_projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_platform_operator() then
    raise exception 'not authorized';
  end if;
  return query
    select * from public.website_projects
    order by created_at desc
    limit 100;
end;
$$;

revoke all on function public.list_website_projects() from public;
grant execute on function public.list_website_projects() to authenticated;
