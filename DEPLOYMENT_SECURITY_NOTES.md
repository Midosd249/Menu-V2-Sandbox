# ملاحظات أمان النشر — Menu V2

## المفاتيح

- الواجهة تستخدم **anon / publishable key** فقط (`supabase-config.js`).
- **ممنوع** وضع `service_role` في أي ملف JavaScript أو HTML أو متغير بيئة عام على Vercel للواجهة.
- أدر أسرار المشغّل (إن لزم) عبر Edge Functions أو لوحة Supabase فقط، وليس عبر المتصفح.

## Headers

- مُعرَّفة في `vercel.json` و`server.js`:
  - Content-Security-Policy (بدون `unsafe-eval`)
  - X-Content-Type-Options: nosniff
  - Referrer-Policy
  - Permissions-Policy
  - X-Frame-Options / frame-ancestors
  - HSTS في الإنتاج

## متغيرات البيئة (أسماء فقط)

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- (اختياري محلي) لا ترفع `.env` أبدًا

## التوجيه

- `/m/:tenant/:branch` → المنيو العام
- `/admin` → لوحة الإدارة
- يُفضَّل لاحقًا حلّ الـ tenant من النطاق الفرعي على مستوى Edge بدل الاعتماد فقط على query string.

## Rate limiting

- يوجد throttle من جهة العميل لأحداث `record_public_menu_event`.
- للحماية الحقيقية ضد الإساءة: فعّل Cloudflare WAF / Rate Limiting أو Edge Function أمام RPC عند نمو الزيارات.

## المراقبة

- راقب أخطاء Auth وStorage من لوحة Supabase.
- فعّل تنبيهات البريد لمشاريع Vercel عند فشل النشر.
