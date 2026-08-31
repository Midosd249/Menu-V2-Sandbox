# RELEASE STATUS — Menu V2 Controlled First Customer

- **اسم الإصدار:** Controlled First Customer Release  
- **التاريخ:** 2026-08-31  
- **الفرع المحلي عند الإصدار:** `main`  
- **Commits الأساسية:**  
  - `ba0bfcf` — P0: local admin.js, gitignore, security headers  
  - `0724193` — P1–P3: role migration, menu hardening, CI, launch docs  
- **قرار الإصدار:** **CONDITIONAL GO**  
  مناسب لبيع أول عميل عبر onboarding يدوي **بعد** تطبيق migration الأدوار في Supabase وإنشاء عضوية المالك واختبار عزل بسيط.

## ما أُغلق في الكود

| المجال | الحالة |
|--------|--------|
| كود admin محلي (لا CDN لتطبيق الإدارة) | مغلق |
| Security headers في vercel.json + server.js | مغلق (إعداد) |
| .gitignore للأسرار | مغلق |
| فصل Demo / Live في لوحة الإدارة | مغلق في الكود |
| طبقة UX للمنيو العام + throttle أحداث | مغلق |
| CI: `npm run check` + workflow | مغلق |
| Migration أدوار RLS جاهزة للملف | جاهزة — **لم تُطبَّق على السحابة من هنا** |

## ما تبقى يدويًا (خارج المستودع)

1. تطبيق `supabase/migrations/20260831_role_hardening_and_event_guard.sql` في SQL Editor.  
2. إنشاء مستخدم Auth + صف `tenant_members` بدور `owner`.  
3. اختبار عزل Tenant وفق `SECURITY_TEST_MATRIX.md`.  
4. نشر Vercel والتحقق من Headers في الإنتاج.  
5. تجربة QR من هاتف حقيقي.

## روابط الملفات المهمة

- `FIRST_CUSTOMER_LAUNCH_CHECKLIST.md`  
- `MOBILE_OWNER_ACTIONS.md`  
- `ROLLBACK_GUIDE.md`  
- `DEPLOYMENT_SECURITY_NOTES.md`  
- `SECURITY_TEST_MATRIX.md`  
- `supabase/migrations/20260831_role_hardening_and_event_guard.sql`  
- `scripts/check.mjs`  
- `.github/workflows/ci.yml`
