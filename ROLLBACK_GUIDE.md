# دليل التراجع السريع — Menu V2

## أ) تراجع الواجهة (GitHub / Vercel)

### من Vercel (الأسرع للإنتاج)
1. Vercel → المشروع → **Deployments**.  
2. اختر deployment سابق ناجح.  
3. **⋯** → **Promote to Production** (أو Rollback حسب واجهة Vercel).  
4. **نجاح:** الموقع يعمل بنفس سلوك ما قبل الإصدار الجديد.

### من GitHub
1. GitHub → المستودع → **Commits**.  
2. حدد commit السابق للإصدار (قبل `ba0bfcf` إن لزم: `7b66fb6`).  
3. لفرع جديد آمن: أنشئ branch من ذلك commit ثم انشره على Vercel.  
4. **لا تستخدم force push على main** إلا بوعي كامل وبعد نسخة احتياطية.

## ب) تراجع قاعدة البيانات (حذر)

- Migration الأدوار **إضافة سياسات** وليست حذف جداول.  
- التراجع الكامل يتطلب إعادة سياسات سابقة يدويًا من ملفات SQL التاريخية في المستودع (`public_security_rpc.sql`, `supabase-schema.sql`, …).  
- **تحذير:** لا تشغّل `DROP TABLE` أو حذف `tenant_members` على إنتاج حي دون backup.  
- قبل أي SQL تراجعي: Dashboard → **Database** → backup / export إن أمكن.

## ج) التحقق بعد التراجع

1. افتح `menu.html?tenant=…` — يجب أن يحمّل المنيو.  
2. افتح `admin.html` — تسجيل الدخول أو وضع العرض يعمل بدون أخطاء JS في المتصفح.  
3. راجع Vercel deployment = Ready.

## د) إذا فشل الإصدار جزئيًا

| العرض | الإجراء |
|------|---------|
| لوحة admin بيضاء | تأكد أن `admin.js` المحلي منشور وليس loader قديم |
| رفض RLS بعد migration | راجع عضوية `tenant_members` والدور |
| المنيو فارغ | تحقق من RPC `get_public_menu` وslug |
