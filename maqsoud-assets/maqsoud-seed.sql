begin;

do $$
declare
  v_tenant uuid := '5e8f2b73-1c6b-4d6d-8cb9-2d9e3f4a7b10';
  v_branch uuid := '62bdc196-0e88-4d87-9ea0-b4a6d66e4f21';
  v_new uuid := '7b9b5f7c-4e5b-4a81-a274-0b4b33d60001';
  v_broasted uuid := '7b9b5f7c-4e5b-4a81-a274-0b4b33d60002';
  v_shawarma uuid := '7b9b5f7c-4e5b-4a81-a274-0b4b33d60003';
  v_mshawi uuid := '7b9b5f7c-4e5b-4a81-a274-0b4b33d60004';
  v_juices uuid := '7b9b5f7c-4e5b-4a81-a274-0b4b33d60005';
  v_appetizers uuid := '7b9b5f7c-4e5b-4a81-a274-0b4b33d60006';
  v_sweet uuid := '7b9b5f7c-4e5b-4a81-a274-0b4b33d60007';
begin
  if exists (select 1 from public.tenants where slug = 'maqsoud') then
    raise exception 'maqsoud tenant already exists; aborting to avoid duplicates';
  end if;

  insert into public.tenants (id, slug, name, tagline, logo_url, cover_url, instagram_url, whatsapp, primary_color, secondary_color)
  values (
    v_tenant, 'maqsoud', 'مقصود | MAQSOUD', 'شاورما ومأكولات سريعة في الملز',
    'https://menu-app-production.vercel.app/maqsoud-assets/public/maqsoud-logo.webp',
    'https://menu-app-production.vercel.app/maqsoud-assets/public/maqsoud-hero.webp',
    null, null, '#24110b', '#ef5b22'
  );

  insert into public.branches (id, tenant_id, slug, name, address, maps_url, is_active)
  values (
    v_branch, v_tenant, 'malaz', 'فرع الملز',
    'طريق صلاح الدين الأيوبي، حي الملز، الرياض 11564، السعودية',
    'https://maps.google.com/?q=MP8J%2B8F2%2C+Salah+Ad+Din+Al+Ayyubi+Rd%2C+Al+Malaz%2C+Riyadh+11564', true
  );

  insert into public.categories (id, tenant_id, sort_order, name_ar, name_en, is_active) values
    (v_new, v_tenant, 10, 'جديد', 'New', true),
    (v_broasted, v_tenant, 20, 'بروستد', 'Broasted', true),
    (v_shawarma, v_tenant, 30, 'شاورما', 'Shawarma', true),
    (v_mshawi, v_tenant, 40, 'مشاوي', 'Grills', true),
    (v_juices, v_tenant, 50, 'عصيرات', 'Juices', true),
    (v_appetizers, v_tenant, 60, 'مقبلات', 'Appetizers', true),
    (v_sweet, v_tenant, 70, 'حلويات', 'Sweet', true);

  insert into public.products (tenant_id, category_id, sort_order, name_ar, name_en, description_ar, description_en, price, currency, image_url, is_available, is_featured) values
    (v_tenant, v_new, 10, 'فطيرة عكاوي شاورما', 'Akkawi Shawarma Pie', 'عكاوي شاورما', 'Akkawi shawarma', 18.00, 'SAR', null, true, true),
    (v_tenant, v_shawarma, 20, 'شاورما عربي دجاج', 'Arabic Chicken Shawarma', 'خبز صاج عربي محمص، دجاج، مخلل بالثوم وبطاطس', 'Toasted Arabic saj bread, chicken, garlic pickles and potatoes', 25.00, 'SAR', null, true, true),
    (v_tenant, v_shawarma, 30, 'شاورما دجاج', 'Chicken Shawarma', 'خبز عربي، دجاج، ثوم، مخلل وبطاطس', 'Arabic bread, chicken, garlic, pickles and potatoes', 10.50, 'SAR', null, true, false),
    (v_tenant, v_shawarma, 40, 'شاورما دجاج الملز', 'Malaz Chicken Shawarma', 'خبز عربي، دجاج، سلطة الملز، طحينة، ثوم، مخلل وبطاطس', 'Arabic bread, chicken, Malaz salad, tahini, garlic, pickles and potatoes', 12.00, 'SAR', null, true, false),
    (v_tenant, v_shawarma, 50, 'صاروخ شاورما دجاج', 'Sarookh Chicken Shawarma', 'ساندويش شاورما كبير الحجم', 'Large shawarma sandwich', 20.50, 'SAR', null, true, false),
    (v_tenant, v_mshawi, 60, 'شيش طاووق', 'Shish Tawook', 'شيش طاووق', 'Shish tawook', 8.50, 'SAR', null, true, false),
    (v_tenant, v_mshawi, 70, 'كباب دجاج', 'Chicken Kebab', 'كباب بالدجاج', 'Chicken kebab', 8.50, 'SAR', null, true, false),
    (v_tenant, v_mshawi, 80, 'كباب لحم', 'Beef Kebab', 'كباب باللحم', 'Beef kebab', 9.50, 'SAR', null, true, false),
    (v_tenant, v_juices, 90, 'عصير كوكتيل جالون', 'Cocktail Juice Gallon', 'عصير كوكتيل', 'Cocktail juice', 33.00, 'SAR', null, true, false),
    (v_tenant, v_juices, 100, 'عصير كوكتيل كبير', 'Large Cocktail Juice', 'عصير كوكتيل', 'Cocktail juice', 13.00, 'SAR', null, true, false),
    (v_tenant, v_juices, 110, 'عصير رمان جالون', 'Pomegranate Juice Gallon', 'عصير رمان', 'Pomegranate juice', 33.00, 'SAR', null, true, false),
    (v_tenant, v_juices, 120, 'عصير رمان كبير', 'Large Pomegranate Juice', 'عصير رمان', 'Pomegranate juice', 13.00, 'SAR', null, true, false),
    (v_tenant, v_juices, 130, 'عصير مانجو صغير', 'Small Mango Juice', 'عصير مانجو بحجم صغير', 'Small mango juice', 9.00, 'SAR', null, true, false),
    (v_tenant, v_juices, 140, 'عصير مانجو كبير', 'Large Mango Juice', 'عصير مانجو بحجم كبير', 'Large mango juice', 11.00, 'SAR', null, true, false),
    (v_tenant, v_appetizers, 150, 'كبة بطاطس', 'Potato Kibbeh', 'حبات ميني', 'Mini pieces', 7.50, 'SAR', null, true, false),
    (v_tenant, v_appetizers, 160, 'بطاطس', 'French Fries', 'بطاطس مقلية طازجة ومحلية', 'Fresh local french fries', 11.00, 'SAR', null, true, false),
    (v_tenant, v_appetizers, 170, 'بطاطس الملز', 'Malaz Fries', 'بطاطا مقلية محلية طازجة مع كاتشب الثوم والكمون', 'Fresh local fries with Malaz garlic ketchup and cumin', 14.00, 'SAR', null, true, false),
    (v_tenant, v_appetizers, 180, 'حمص صغير', 'Small Hummus', 'حمص', 'Hummus', 10.00, 'SAR', null, true, false),
    (v_tenant, v_sweet, 190, 'بسبوسة الملز', 'Malaz Basbousa', 'بسبوسة بالقشطة', 'Basbousa with cream', 9.00, 'SAR', null, true, false);
end $$;
commit;
