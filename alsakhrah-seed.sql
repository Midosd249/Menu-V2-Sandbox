-- Alsakhrah Restaurants portfolio seed. Public-source reference data only; prices/hours require owner confirmation.
do $$
declare t_id uuid; b_id uuid; c_id uuid;
begin
  insert into public.tenants (slug,name,tagline,instagram_url,whatsapp,primary_color,secondary_color)
  values ('alsakhrah','Alsakhrah Restaurants','Portfolio prototype — final menu data pending owner approval.','https://www.instagram.com/al_sakhrah_rest/',null,'#191510','#b66a3d')
  on conflict (slug) do update set name=excluded.name, tagline=excluded.tagline, instagram_url=excluded.instagram_url, primary_color=excluded.primary_color, secondary_color=excluded.secondary_color
  returning id into t_id;
  insert into public.branches (tenant_id,slug,name,address,maps_url,is_active)
  values (t_id,'malaz','فرع الملز','MPHH+HCH، طريق عمر بن عبدالعزيز، الملز، الرياض 12831','https://maps.google.com/?q=MPHH%2BHCH%2C+Umar+Ibn+Abdul+Aziz+Rd%2C+Al+Malaz%2C+Riyadh+12831',true)
  on conflict (tenant_id,slug) do update set name=excluded.name,address=excluded.address,maps_url=excluded.maps_url,is_active=true
  returning id into b_id;
  insert into public.categories (tenant_id,sort_order,name_ar,name_en,is_active)
  values (t_id,1,'أطباق مرجعية — غير نهائية','Reference dishes — not final',true) on conflict do nothing;
  select id into c_id from public.categories where tenant_id=t_id and name_en='Reference dishes — not final' limit 1;
  insert into public.products (tenant_id,category_id,sort_order,name_ar,name_en,description_ar,description_en,price,is_available,is_featured)
  values
  (t_id,c_id,1,'عش البلبل الحموي','Hama-style Esh Al Bulbul','اسم طبق ظهر في منشور عام؛ الوصف والسعر يحتاجان تأكيد المطعم','Dish name seen in a public post; description and price require restaurant confirmation',0,true,true),
  (t_id,c_id,2,'برك اللحمة','Meat Borek','اسم طبق ظهر في منشور عام؛ الوصف والسعر يحتاجان تأكيد المطعم','Dish name seen in a public post; description and price require restaurant confirmation',0,true,true)
  on conflict do nothing;
end $$;
