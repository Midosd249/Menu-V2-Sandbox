# مصفوفة اختبار عزل الـ Tenant (Staging)

لا يمكن اعتبار العزل «مُتحققًا» دون تنفيذ هذه الاختبارات بحسابين حقيقيين على مشروع Staging.

## المتطلبات

- مشروع Supabase Staging (يفضّل غير الإنتاج).
- مستخدمان Auth: UserA و UserB.
- TenantA مرتبط بـ UserA (owner).
- TenantB مرتبط بـ UserB (owner).
- تطبيق migration الدور.

## الاختبارات

| # | السيناريو | النتيجة المتوقعة |
|---|-----------|------------------|
| 1 | UserA يفتح admin ويحمّل بياناته | يرى TenantA فقط |
| 2 | UserA يحاول `select` على products لـ TenantB عبر API | 0 صفوف / رفض RLS |
| 3 | UserA يحاول `update` منتج TenantB | فشل / 0 صفوف محدّثة |
| 4 | UserB لا يرى عضوية UserA | لا تظهر في tenant_members |
| 5 | Editor في TenantA يحدّث منتجًا | نجاح |
| 6 | Editor يحاول تحديث tenants (هوية) | فشل RLS بعد migration |
| 7 | Editor يحاول إدراج tenant_members | فشل |
| 8 | Anon يستدعي `get_public_menu` لـ slug صحيح | نجاح JSON |
| 9 | Anon يقرأ `from('products')` مباشرة | لا بيانات حساسة / مرفوض حسب السياسات |
| 10 | Anon يدرج في menu_events مباشرة بقيم عشوائية | مرفوض أو محكوم بسياسة السياق |
| 11 | رفع صورة إلى مسار tenant آخر | مرفوض Storage policy |
| 12 | رفع ملف `.exe` من الواجهة | يُرفض في JavaScript قبل الرفع |

## طريقة التنفيذ المقترحة

1. استخدم Supabase SQL Editor + جدول policies.
2. أو سكربت Node صغير بمفتاح anon + جلسات المستخدمين (بدون service_role في الواجهة).
3. سجّل النتائج بتاريخ التنفيذ في هذا الملف أو تذكرة داخلية.
