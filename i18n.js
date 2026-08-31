/**
 * Menu V2 — shared UI language (ar primary, en alternate).
 * Persists in localStorage key: menuLang
 * Applies [data-i18n], [data-i18n-placeholder], [data-i18n-aria], dir/lang on <html>.
 */
(function (global) {
  var STORAGE_KEY = 'menuLang';
  var dict = {
    'nav.home': { ar: 'الرئيسية', en: 'Home' },
    'nav.services': { ar: 'الخدمات والحلول', en: 'Services' },
    'nav.portfolio': { ar: 'نماذج حية', en: 'Live demos' },
    'nav.website': { ar: 'إنشاء موقع', en: 'Website' },
    'nav.visibility': { ar: 'الظهور المحلي', en: 'Local visibility' },
    'nav.portals': { ar: 'البوابات', en: 'Portals' },
    'nav.client': { ar: 'بوابة العميل', en: 'Client portal' },
    'nav.owner': { ar: 'بوابة المشغّل', en: 'Owner portal' },
    'nav.menu.maqsoud': { ar: 'منيو مقصود (حي)', en: 'Maqsoud live menu' },
    'nav.request': { ar: 'طلب اشتراك', en: 'Request service' },
    'action.close': { ar: 'إغلاق', en: 'Close' },
    'action.save': { ar: 'حفظ', en: 'Save' },
    'action.cancel': { ar: 'إلغاء', en: 'Cancel' },
    'action.login': { ar: 'تسجيل الدخول', en: 'Sign in' },
    'action.logout': { ar: 'تسجيل الخروج', en: 'Sign out' },
    'action.refresh': { ar: 'تحديث البيانات', en: 'Refresh data' },
    'action.menu': { ar: 'القائمة', en: 'Menu' },
    'status.loading': { ar: 'جارٍ التحميل…', en: 'Loading…' },
    'status.connected': { ar: 'متصل وحي', en: 'Live connected' },
    'status.error': { ar: 'حدث خطأ', en: 'Something went wrong' },
    'empty.generic': { ar: 'لا توجد بيانات لعرضها', en: 'Nothing to show yet' },
    'client.login.title': { ar: 'دخول بوابة العميل', en: 'Client portal sign-in' },
    'client.login.sub': { ar: 'سجّل الدخول بحسابك لإدارة منيو نشاطك', en: 'Sign in to manage your menu and branding' },
    'client.email': { ar: 'البريد الإلكتروني', en: 'Email' },
    'client.password': { ar: 'كلمة المرور', en: 'Password' },
    'client.nav.overview': { ar: 'نظرة عامة', en: 'Overview' },
    'client.nav.menu': { ar: 'الأصناف والتوفر', en: 'Items & availability' },
    'client.nav.branding': { ar: 'هوية النشاط', en: 'Branding' },
    'client.nav.branches': { ar: 'الفروع ورمز QR', en: 'Branches & QR' },
    'client.nav.analytics': { ar: 'التحليلات', en: 'Analytics' },
    'client.nav.services': { ar: 'الخدمات الإضافية', en: 'Extra services' },
    'client.nav.settings': { ar: 'الحساب والإعدادات', en: 'Account & settings' },
    'client.preview': { ar: 'معاينة المنيو الحي', en: 'Live menu preview' },
    'client.active': { ar: 'الحساب النشط', en: 'Active account' },
    'owner.login.title': { ar: 'دخول بوابة المشغّل والمالك', en: 'Owner / operator sign-in' },
    'owner.login.sub': { ar: 'الدخول مخصص لإدارة المنصة وتهيئة المطاعم', en: 'Platform operations, provisioning, and projects' },
    'owner.nav.dashboard': { ar: 'الرئيسية والمؤشرات', en: 'Dashboard' },
    'owner.nav.tenants': { ar: 'الأنشطة والعملاء', en: 'Tenants & clients' },
    'owner.nav.websites': { ar: 'مشاريع المواقع', en: 'Website projects' },
    'owner.nav.visibility': { ar: 'تقييمات الظهور', en: 'Visibility audits' },
    'owner.nav.requests': { ar: 'طلبات الخدمات', en: 'Service requests' },
    'owner.nav.analytics': { ar: 'التحليلات الشاملة', en: 'Platform analytics' },
    'owner.nav.markets': { ar: 'الأسواق والعملات', en: 'Markets & currency' },
    'owner.nav.system': { ar: 'صحة النظام والأمان', en: 'System & security' },
    'owner.provision': { ar: 'إنشاء نشاط جديد', en: 'Provision tenant' },
    'm.hero.cta': { ar: 'ابدأ الآن مع Menu', en: 'Start with Menu' },
    'm.hero.demos': { ar: 'استعرض النماذج الحية ↗', en: 'View live demos ↗' },
    'menu.search': { ar: 'ابحث في القائمة...', en: 'Search the menu…' },
    'menu.all': { ar: 'الكل', en: 'All' },
    'menu.empty': { ar: 'لم نجد ما تبحث عنه', en: 'No matches found' },
    'menu.empty.hint': { ar: 'جرّب كلمة أخرى أو اختر تصنيفًا مختلفًا.', en: 'Try another term or category.' },
    'menu.wa': { ar: 'استفسر عبر واتساب', en: 'Ask on WhatsApp' },
    'menu.call': { ar: 'اتصال مباشر', en: 'Call now' },
    'menu.maps': { ar: 'فتح الموقع ↗', en: 'Open map ↗' }
  };

  function getLang() {
    var v = localStorage.getItem(STORAGE_KEY);
    return v === 'en' ? 'en' : 'ar';
  }

  function setLang(lang) {
    lang = lang === 'en' ? 'en' : 'ar';
    localStorage.setItem(STORAGE_KEY, lang);
    apply(lang);
    try {
      global.dispatchEvent(new CustomEvent('menu:lang', { detail: { lang: lang } }));
    } catch (e) {}
    return lang;
  }

  function t(key, lang) {
    lang = lang || getLang();
    var entry = dict[key];
    if (!entry) return key;
    return entry[lang] || entry.ar || key;
  }

  function apply(lang) {
    lang = lang || getLang();
    var ar = lang === 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    document.body && document.body.setAttribute('data-lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = t(key, lang);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      } else {
        el.textContent = val;
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'), lang));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'), lang));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'), lang);
    });
    document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      btn.textContent = ar ? 'EN' : 'العربية';
      btn.setAttribute('aria-label', ar ? 'Switch to English' : 'التبديل إلى العربية');
    });
  }

  function toggle() {
    return setLang(getLang() === 'ar' ? 'en' : 'ar');
  }

  function bindToggles(root) {
    root = root || document;
    root.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      if (btn.__i18nBound) return;
      btn.__i18nBound = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        toggle();
      });
    });
  }

  function extend(extra) {
    if (!extra) return;
    Object.keys(extra).forEach(function (k) {
      dict[k] = extra[k];
    });
  }

  global.MenuI18n = {
    getLang: getLang,
    setLang: setLang,
    toggle: toggle,
    t: t,
    apply: apply,
    bindToggles: bindToggles,
    extend: extend,
    dict: dict
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      apply(getLang());
      bindToggles();
    });
  } else {
    apply(getLang());
    bindToggles();
  }
})(window);
