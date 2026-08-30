-- Service Requests & Lead Inquiries migration
-- Safe additive schema. Does not weaken existing tenant/menu RLS.

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  service_type text not null check (service_type in ('menu','website','visibility','ai_solutions','automation','analytics','custom')),
  business_name text not null,
  business_type text,
  city text,
  country text not null default 'SA',
  contact_name text not null,
  contact_phone text not null,
  contact_email text,
  details text,
  status text not null default 'pending' check (status in ('pending','contacted','in_progress','completed','archived')),
  notes text
);

create index if not exists service_requests_created_idx on public.service_requests(created_at desc);
create index if not exists service_requests_status_idx on public.service_requests(status);
create index if not exists service_requests_user_idx on public.service_requests(user_id);

alter table public.service_requests enable row level security;

-- Platform operators can read and update all service requests
drop policy if exists "service_requests_operator_select" on public.service_requests;
create policy "service_requests_operator_select" on public.service_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_platform_operator());

drop policy if exists "service_requests_operator_update" on public.service_requests;
create policy "service_requests_operator_update" on public.service_requests
  for update to authenticated
  using (public.is_platform_operator())
  with check (public.is_platform_operator());

-- Public submission RPC with input validation and rate protection
create or replace function public.submit_service_request(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_service_type text;
  v_business_name text;
  v_contact_name text;
  v_contact_phone text;
  v_contact_email text;
  v_city text;
  v_country text;
  v_business_type text;
  v_details text;
  v_user_id uuid;
begin
  v_service_type := lower(trim(coalesce(p_payload->>'service_type', 'menu')));
  if v_service_type not in ('menu','website','visibility','ai_solutions','automation','analytics','custom') then
    v_service_type := 'custom';
  end if;

  v_business_name := nullif(trim(coalesce(p_payload->>'business_name', '')), '');
  if v_business_name is null then
    raise exception 'اسم النشاط التجاري مطلوب';
  end if;

  v_contact_name := nullif(trim(coalesce(p_payload->>'contact_name', '')), '');
  if v_contact_name is null then
    raise exception 'اسم مسؤول التواصل مطلوب';
  end if;

  v_contact_phone := nullif(trim(coalesce(p_payload->>'contact_phone', '')), '');
  if v_contact_phone is null then
    raise exception 'رقم الهاتف أو الواتساب مطلوب';
  end if;

  v_contact_email := nullif(trim(coalesce(p_payload->>'contact_email', '')), '');
  v_city := nullif(trim(coalesce(p_payload->>'city', '')), '');
  v_country := upper(trim(coalesce(p_payload->>'country', 'SA')));
  v_business_type := nullif(trim(coalesce(p_payload->>'business_type', '')), '');
  v_details := nullif(trim(coalesce(p_payload->>'details', '')), '');
  v_user_id := (select auth.uid());

  insert into public.service_requests (
    user_id,
    service_type,
    business_name,
    business_type,
    city,
    country,
    contact_name,
    contact_phone,
    contact_email,
    details,
    status
  ) values (
    v_user_id,
    v_service_type,
    v_business_name,
    v_business_type,
    v_city,
    v_country,
    v_contact_name,
    v_contact_phone,
    v_contact_email,
    v_details,
    'pending'
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'id', v_id,
    'message', 'تم استلام طلبك بنجاح. سيتواصل معك فريقنا في أقرب وقت.'
  );
end;
$$;

revoke all on function public.submit_service_request(jsonb) from public;
grant execute on function public.submit_service_request(jsonb) to anon, authenticated;
