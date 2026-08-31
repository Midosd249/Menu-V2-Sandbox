# RELEASE STATUS — Menu V2 Controlled First Customer

- **اسم الإصدار:** Controlled First Customer Release  
- **التاريخ:** 2026-08-31  
- **الفرع:** `release/controlled-first-customer`  
- **قرار الإصدار:** **CONDITIONAL GO**  
  مناسب لبيع أول عميل عبر onboarding يدوي **بعد** تطبيق migration الأدوار في Supabase وإنشاء عضوية المالك واختبار عزل بسيط.

## ما أُغلق في الكود

| المجال | الحالة |
|--------|--------|
| كود admin محلي (لا CDN لتطبيق الإدارة) | مغلق — static split `admin-runtime/00..06` |
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

## Admin runtime architecture (2026-08-31)

Admin UI logic is split into static sequential local files under `admin-runtime/`:

- `00-bootstrap.js` … `06-init.js` (7 files, ~39 024 bytes total)
- Loaded by `admin.html` in order via normal `<script src>` tags
- No CDN app loader, no assembler, no `admin.src.*`, no dynamic source execution
- `admin.js` is a documentation shim only (not loaded by admin.html)

Reason: GitHub connector Contents API payload limits; static split preserves full CRUD/Auth/tenant features.

## Quality gate

- `npm run check` → PASS
- All 7 runtime files present, syntax-clean, order verified in admin.html
- READY FOR REVIEW — DO NOT MERGE until manual Supabase steps complete.
