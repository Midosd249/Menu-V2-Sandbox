/* Menu Studio — LOCAL ONLY. External CDN app loaders are forbidden.
 * Full admin runtime is in the release commits on the release machine.
 * If you still see this stub, upload the full admin.js from the release branch artifacts.
 */
(function () {
  'use strict';
  var el = document.getElementById('authMessage');
  if (el) {
    el.textContent = 'جارٍ تجهيز لوحة الإدارة المحلية. إذا استمرت هذه الرسالة، ارفع ملف admin.js الكامل من إصدار Controlled First Customer.';
  }
  console.error('[Menu] admin.js full runtime missing on this deployment. Do not load application code from jsDelivr/GitHub CDN.');
})();
