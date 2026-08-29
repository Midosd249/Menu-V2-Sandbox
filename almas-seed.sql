-- AL MAS portfolio tenant seed. Public-source prototype only; prices and hours intentionally require confirmation.
do $$
declare t_id uuid; b_id uuid; c_id uuid;
begin
  insert into public.tenants (slug,name,tagline,instagram_url,whatsapp,primary_color,secondary_color)
  values ('almas','AL MAS Family Restaurant','Portfolio prototype — menu pending restaurant approval.','https://www.instagram.com/almas_family_restaurant/',null,'#15120f','#b88452')
  on conflict (slug) do update set name=excluded.name, tagline=excluded.tagline, instagram_url=excluded.instagram_url, primary_color=excluded.primary_color, secondary_color=excluded.secondary_color
  returning id into t_id;
  insert into public.branches (tenant_id,slug,name,address,maps_url,is_active)
  values (t_id,'malaz','فرع الملز','53، الحواري، الملز، قرب مستشفى الرعاية الوطني، الرياض 12812','https://maps.google.com/?q=53+Al+Hawwari+Al+Malaz+Riyadh',true)
  on conflict (tenant_id,slug) do update set name=excluded.name,address=excluded.address,maps_url=excluded.maps_url,is_active=true
  returning id into b_id;
  insert into public.categories (tenant_id,sort_order,name_ar,name_en,is_active)
  values (t_id,1,'أصناف مرجعية — غير نهائية','Reference items — not final',true) on conflict do nothing;
  select id into c_id from public.categories where tenant_id=t_id and name_en='Reference items — not final' limit 1;
  insert into public.products (tenant_id,category_id,sort_order,name_ar,name_en,description_ar,description_en,price,is_available,is_featured) values
  (t_id,c_id,1,'ماسالا دوسا','Masala Dosa','إشارة مرجعية منشورة — الوصف والسعر يحتاجان تأكيد المطعم','Publicly referenced item — description and price require restaurant confirmation',0,true,true),
  (t_id,c_id,2,'دجاج تيكا ماسالا','Chicken Tikka Masala','إشارة مرجعية منشورة — الوصف والسعر يحتاجان تأكيد المطعم','Publicly referenced item — description and price require restaurant confirmation',0,true,true),
  (t_id,c_id,3,'تشيلي بانير','Chilli Paneer','إشارة مرجعية منشورة — الوصف والسعر يحتاجان تأكيد المطعم','Publicly referenced item — description and price require restaurant confirmation',0,true,false),
  (t_id,c_id,4,'وجبة ساديا','Sadya Meal','عرض موسمي ظهر في منشورات عامة — ليس قائمة حالية مؤكدة','Seasonal offering seen in public posts — not a verified current menu item',0,true,false)
  on conflict do nothing;
end $$;
