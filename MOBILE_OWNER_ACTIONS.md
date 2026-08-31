# إجراءات المالك من الجوال (30–60 دقيقة)

نفّذ بالترتيب. لا تحتاج Terminal.

## 1) تطبيق Migration الأدوار

1. افتح **Supabase Dashboard** → مشروع Menu.  
2. من القائمة: **SQL** → **SQL Editor** → **New query**.  
3. من GitHub افتح الملف:  
   `supabase/migrations/20260831_role_hardening_and_event_guard.sql`  
4. انسخ المحتوى كاملًا → الصقه في SQL Editor → **Run**.  
5. **نجاح:** رسالة نجاح بدون أخطاء حمراء.  
6. (اختياري) انسخ استعلامات **VERIFICATION BLOCK** أسفل الملف ونفّذها.

## 2) إنشاء حساب المالك

1. في Supabase: **Authentication** → **Users** → **Add user**.  
2. أدخل بريد المالك وكلمة مرور قوية → أنشئ المستخدم.  
3. افتح المستخدم وانسخ **User UID** (سيُستخدم كـ `<OWNER_AUTH_UUID>`).

## 3) ربط المالك بالنشاط

1. SQL Editor → New query.  
2. الصق وعدّل القيم فقط:

```sql
INSERT INTO public.tenant_members (tenant_id, user_id, role)
VALUES (
  '<TENANT_UUID>'::uuid,
  '<OWNER_AUTH_UUID>'::uuid,
  'owner'
)
ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'owner';
```

3. للحصول على `tenant_id`:

```sql
SELECT id, slug, name FROM public.tenants ORDER BY created_at;
```

4. **نجاح:** صف واحد role = owner لهذا المستخدم.

## 4) التحقق من لوحة الإدارة

1. افتح رابط النشر: `…/admin.html`  
2. سجّل الدخول ببريد المالك.  
3. **نجاح:** تظهر شارة **بيانات حية** (وليست «وضع العرض التجريبي»).  
4. عدّل توفر صنف واحد واحفظ.

## 5) التحقق من المنيو العام

1. افتح `…/menu.html?tenant=SLUG` أو `/m/SLUG/BRANCH`.  
2. من الهاتف: امسح QR أو افتح الرابط.  
3. **نجاح:** الأصناف والأسعار تظهر؛ واتساب يعمل.

## 6) Vercel (إن كان مربوطًا)

1. افتح Vercel → المشروع → **Deployments**.  
2. تأكد أن آخر deployment من commit الإصدار ناجح (Ready).  
3. افتح الموقع وتأكد من HTTPS.

## 7) تأكيد سريع للأمان

1. سجّل الخروج من admin.  
2. **نجاح:** أزرار الحفظ/الإضافة غير متاحة أو تطلب تسجيل الدخول.  
3. لا تشارك كلمة مرور المالك إلا عبر قناة آمنة.
