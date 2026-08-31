/**
 * Menu V2 — UI language (ar primary, en alternate).
 * localStorage: menuLang
 * Supports data-i18n* attributes AND phrase-map translation of static Arabic UI copy.
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
    'empty.generic': { ar: 'لا توجد بيانات لعرضها', en: 'Nothing to show yet' }
  };

  /* Exact Arabic UI phrases → English (static chrome only, not restaurant product data) */
  var PHRASES = {
    'دخول بوابة العميل': 'Client portal sign-in',
    'سجّل الدخول بحسابك لإدارة منيو نشاطك التجاري والبيانات الحية': 'Sign in to manage your menu and live business data',
    'البريد الإلكتروني': 'Email',
    'كلمة المرور': 'Password',
    'تسجيل الدخول': 'Sign in',
    'استعراض فوري في بيئة Sandbox Demo': 'Instant Sandbox demo',
    'تجربة كـ مطعم مقصود 🌯': 'Try as Maqsoud 🌯',
    'تجربة كـ أوزا كافيه ☕': 'Try as Oaza Coffee ☕',
    'ليس لديك حساب بعد؟': "Don't have an account?",
    'اطلب اشتراك جديد ↗': 'Request a new subscription ↗',
    'نظرة عامة': 'Overview',
    'الأصناف والتوفر': 'Items & availability',
    'هوية النشاط': 'Branding',
    'الفروع ورمز QR': 'Branches & QR',
    'التحليلات': 'Analytics',
    'الخدمات الإضافية': 'Extra services',
    'الحساب والإعدادات': 'Account & settings',
    'الحساب النشط': 'Active account',
    'معاينة المنيو الحي ↗': 'Live menu preview ↗',
    'تسجيل الخروج': 'Sign out',
    'لوحة تحكم النشاط التجاري': 'Business control panel',
    'إجمالي الأصناف': 'Total items',
    'الأصناف المتاحة': 'Available items',
    'غير المتاحة (نفذت)': 'Unavailable (sold out)',
    'مختارة اليوم': "Today's picks",
    'إجراءات سريعة': 'Quick actions',
    'الوصول المباشر إلى العمليات اليومية الأكثر أهمية': 'Shortcuts to the most important daily operations',
    '🍽️ تعديل المنيو والأسعار': '🍽️ Edit menu & prices',
    'تعديل الأسعار والتوفر فوريًا': 'Update prices and availability instantly',
    '📲 رمز الـ QR والرابط': '📲 QR code & link',
    'تحميل ملصقات الطاولات': 'Download table stickers',
    '🎨 هوية النشاط والواتساب': '🎨 Branding & WhatsApp',
    'الشعار والألوان ورسائل الطلب': 'Logo, colors, and order messages',
    '📊 تقارير الزيارات': '📊 Visit reports',
    'معرفة الأصناف الأكثر طلبًا': 'See the most viewed items',
    'رمز QR السريع': 'Quick QR',
    'امسح بالهاتف لتجربة منيو الطاولة': 'Scan with your phone to open the table menu',
    'إدارة الـ QR والتحميل': 'Manage QR & download',
    'بدّل التوفر بنقرة واحدة أثناء ساعات العمل. التعديل يظهر في منيو العملاء فورًا.': 'Toggle availability in one tap during service. Changes appear on the customer menu immediately.',
    '+ إضافة صنف': '+ Add item',
    'جارٍ تحميل الأصناف…': 'Loading items…',
    'الصورة': 'Image',
    'الصنف': 'Item',
    'القسم': 'Category',
    'السعر': 'Price',
    'التوفر': 'Availability',
    'إجراءات': 'Actions',
    'هوية النشاط والتواصل': 'Brand & contact',
    'تخصيص اسم النشاط، الشعار، الألوان، وروابط التواصل المباشر مع العملاء.': 'Customize name, logo, colors, and customer contact links.',
    'حفظ التعديلات': 'Save changes',
    'اسم النشاط بالعربية': 'Business name (Arabic)',
    'الوصف / السلوجان بالعربية': 'Tagline (Arabic)',
    'رقم الواتساب (للطلبات والاستفسار)': 'WhatsApp number (orders & inquiries)',
    'رسالة الواتساب التلقائية (اختياري)': 'WhatsApp message template (optional)',
    'رابط أو حساب إنستغرام': 'Instagram link or handle',
    'اللون الأساسي للعلامة': 'Primary brand color',
    'لون التمييز (الأزرار واللمسات)': 'Accent color (buttons & highlights)',
    'رابط الشعار (Logo URL)': 'Logo URL',
    'رابط صورة الغلاف العريضة (Hero Image URL)': 'Cover / hero image URL',
    'بيانات الفرع والـ QR Code': 'Branch details & QR code',
    'إدارة موقع الفرع وروابط خرائط جوجل وتحميل رمز الـ QR للطاولات والمطبوعات.': 'Manage branch location, Google Maps links, and QR downloads for tables and print.',
    'حفظ بيانات الفرع': 'Save branch',
    'اسم الفرع': 'Branch name',
    'العنوان التفصيلي': 'Full address',
    'رابط خرائط جوجل (Google Maps URL)': 'Google Maps URL',
    'رابط المنيو الرقمي المباشر': 'Direct digital menu link',
    'هذا الرابط مخصص لهذا الفرع ويمكن استخدامه في السوشيال ميديا وعبر الـ QR.': 'This link is unique to this branch — use it on social media and QR codes.',
    'نسخ': 'Copy',
    'تحميل رمز QR كصورة PNG': 'Download QR as PNG',
    'جاهز للطباعة والمسح المباشر': 'Ready to print and scan',
    'أداء المنيو وإحصاءات الزوار': 'Menu performance & visitor stats',
    'بيانات حقيقية معزولة تمامًا لنشاطك، لتتبع اهتمام العملاء والأصناف الأكثر طلبًا.': 'Isolated live data for your business — track interest and top items.',
    '7 أيام': '7 days',
    '30 يوم': '30 days',
    'جارٍ تجميع بيانات التحليلات…': 'Gathering analytics…',
    'زيارات المنيو': 'Menu visits',
    'مشاهدات الأصناف': 'Item views',
    'زوار باللغة العربية': 'Arabic visitors',
    'أكثر الأصناف مشاهدة واهتمامًا': 'Most viewed items',
    'الخدمات الإضافية والتوسّع': 'Extra services & growth',
    'خدمات متكاملة من Menu لمضاعفة نمو نشاطك التجاري وزيادة مبيعاتك.': 'Integrated Menu services to grow sales and reach.',
    'موقع إلكتروني احترافي': 'Professional website',
    'موقع متكامل لنشاطك، يدعم الطلبات وساعات العمل وخرائط الفروع.': 'A full site for your business — orders, hours, and branch maps.',
    'تقديم موجز الموقع ↗': 'Submit website brief ↗',
    'تقييم الظهور على خرائط جوجل': 'Google Maps visibility audit',
    'فحص دقيق لموقعك في البحث المحلي وخطة لتحسين تصدّرك للنتائج.': 'Local search review with a plan to improve ranking.',
    'طلب فحص الظهور ↗': 'Request visibility audit ↗',
    'حلول وأتمتة الذكاء الاصطناعي': 'AI solutions & automation',
    'مساعد ذكي للرد على استفسارات العملاء على الواتساب وربط الطلبات.': 'Smart assistant for WhatsApp inquiries and order routing.',
    'طلب الخدمة ↗': 'Request service ↗',
    'إعدادات الحساب والأمان': 'Account & security',
    'إدارة معلومات تسجيل الدخول وصلاحيات النشاط.': 'Manage sign-in details and business permissions.',
    'البريد الإلكتروني الحالي': 'Current email',
    'المعرف الفريد للمطعم (Tenant Slug)': 'Tenant slug',
    'طلب تعديل بيانات الدخول': 'Request login change',
    'إضافة صنف جديد': 'Add new item',
    'الاسم بالعربية *': 'Name in Arabic *',
    'الوصف بالعربية': 'Description (Arabic)',
    'السعر بالريال *': 'Price (SAR) *',
    'السعرات الحرارية (اختياري)': 'Calories (optional)',
    'القسم / التصنيف': 'Category',
    'رابط صورة الصنف (URL)': 'Item image URL',
    'متاح للطلب الآن': 'Available now',
    'تمييز كصنف مختار اليوم ⭐': "Feature as today's pick ⭐",
    'إلغاء': 'Cancel',
    'حفظ الصنف': 'Save item',
    'تنبيه: لا يوجد نشاط تجاري مرتبط': 'Notice: no business linked',
    'هذا الحساب غير مدرج في عضوية أي نشاط مصرح به. يرجى مراجعة إدارة المنصة لربط نشاطك.': 'This account is not a member of any authorized business. Contact platform admin to link yours.',
    'جاري التحميل…': 'Loading…',
    'فتح القائمة': 'Open menu',
    '☰ القائمة': '☰ Menu',

    /* Owner */
    'دخول بوابة المشغّل والمالك': 'Owner / operator sign-in',
    'الدخول مخصص لإدارة المنصة، تهيئة المطاعم، ومتابعة المشاريع': 'For platform ops, restaurant provisioning, and project tracking',
    'البريد الإلكتروني للمشغل': 'Operator email',
    'تسجيل الدخول كمالك': 'Sign in as owner',
    'استعراض لوحة تحكم المنصة فورًا ⚡': 'Open platform dashboard now ⚡',
    'العمليات والتشغيل': 'Operations',
    'الرئيسية والمؤشرات': 'Dashboard',
    'الأنشطة والعملاء': 'Tenants & clients',
    'مشاريع المواقع': 'Website projects',
    'تقييمات الظهور': 'Visibility audits',
    'طلبات الخدمات': 'Service requests',
    'المنصة والأنظمة': 'Platform & systems',
    'التحليلات الشاملة': 'Platform analytics',
    'الأسواق والعملات': 'Markets & currency',
    'صحة النظام والأمان': 'System & security',
    'المشغل الحالي:': 'Current operator:',
    'بوابة العميل ↗': 'Client portal ↗',
    'خروج': 'Sign out',
    'نظرة عامة على المنصة': 'Platform overview',
    'مزامنة حية مع Supabase Database & Auth': 'Live sync with Supabase Database & Auth',
    'متصل وحي': 'Live connected',
    'تحديث البيانات ⟳': 'Refresh ⟳',
    '+ إنشاء نشاط جديد': '+ Provision tenant',
    'ملاحظة الصلاحيات': 'Permissions note',
    'الحساب الحالي غير مدرج في جدول المشغلين المعتمدين.': 'This account is not listed in approved operators.',
    'الفروع النشطة': 'Active branches',
    'أصناف القوائم': 'Menu items',
    'أحدث الأنشطة': 'Latest tenants',
    'النشاط': 'Business',
    'الفروع': 'Branches',
    'الأصناف': 'Items',
    'المنيو': 'Menu',
    'إدارة العملاء': 'Client management',
    'الرابط': 'Link',
    'التواصل': 'Contact',
    'الحالة': 'Status',
    'التقييم': 'Score',
    'الخدمة': 'Service',
    'الزيارات': 'Visits',
    'المشاهدات': 'Views',
    'الأسواق': 'Markets',
    'السعودية SAR · الإمارات AED · مصر EGP · السودان SDG': 'Saudi SAR · UAE AED · Egypt EGP · Sudan SDG',
    'فحص الاتصال وعزل RLS': 'Connection check & RLS isolation',
    'عزل البيانات (RLS):': 'Data isolation (RLS):',
    'مفعّل وصارم': 'Enabled & strict',
    'القوائم العامة:': 'Public menus:',
    'إنشاء نشاط جديد': 'Provision new tenant',
    'اسم النشاط *': 'Business name *',
    'الفرع الافتراضي': 'Default branch',
    'إنشاء': 'Create',
    'تفاصيل السجل': 'Record details',
    'حي': 'Live',

    /* Marketing / index */
    'منظومة نمو متكاملة للمطاعم والأنشطة التجارية': 'An integrated growth platform for restaurants & businesses',
    'حوّل نشاطك التجاري إلى': 'Turn your business into a',
    'تجربة رقمية متكاملة': 'complete digital experience',
    'تزيد مبيعاتك.': 'that grows sales.',
    'ابدأ الآن مع Menu': 'Start with Menu',
    'استعرض النماذج الحية ↗': 'View live demos ↗',
    'عزل وأمان للبيانات': 'Data isolation & security',
    'سرعة فتح المنيو الرقمي': 'Digital menu load speed',
    'السعودية، الخليج، مصر، السودان': 'Saudi, Gulf, Egypt, Sudan',
    'الأسواق والعملات المعتمدة:': 'Supported markets & currencies:',
    'حلول متكاملة مصممة لنمو نشاطك التجاري': 'Integrated solutions built for business growth',
    'لا نقدم أدوات معزولة؛ بل منظومة رقمية كاملة تربط العميل بنشاطك من اللحظة الأولى.': 'Not isolated tools — a full digital system that connects customers from the first moment.',
    'المنيو الرقمي التفاعلي': 'Interactive digital menu',
    'قائمة طعام رقمية سريعة للغاية، تدعم الصور والسعرات، مسببات الحساسية، والطلب المباشر عبر الواتساب.': 'A fast digital menu with photos, calories, allergens, and WhatsApp ordering.',
    'تبديل توفر الأصناف بنقرة واحدة': 'Toggle item availability in one tap',
    'رموز QR مستقلة لكل فرع وطاولة': 'Independent QR codes per branch and table',
    'ثنائي اللغة عربي وإنجليزي أصيل': 'Native Arabic & English',
    'تحليلات مشاهدات الأصناف الأكثر طلبًا': 'Analytics for most-viewed items',
    'تجربة المنيو الحي ↗': 'Try live menu ↗',
    'مواقع إلكترونية مخصصة': 'Custom websites',
    'موقع احترافي كامل لنشاطك، يعكس علامتك التجارية ويبرز خدماتك وفروعك وساعات عملك للعملاء.': 'A professional site for your brand, services, branches, and hours.',
    'تصميم مخصص مهيأ للتحويل': 'Conversion-focused custom design',
    'ربط مباشر مع الواتساب والاتصال': 'Direct WhatsApp & call links',
    'لوحة لإدارة محتوى الموقع': 'Content management panel',
    'متوافق 100% مع الهواتف الذكية': '100% mobile-friendly',
    'تحسين الظهور المحلي (Local SEO)': 'Local SEO / visibility',
    'تقييم دقيق لحضور نشاطك على خرائط جوجل ومحركات البحث، مع خطة عمل تنفيذية لرفع التقييمات وجذب الزوار.': 'A clear audit of your Maps & search presence with a 30-day action plan.',
    'فحص بيانات الموقع والاتصال والخرائط': 'Check listing, contact, and maps data',
    'خطة عمل وتوصيات لمدة 30 يومًا': '30-day action plan & recommendations',
    'استراتيجية زيادة تقييمات العملاء الحقيقية': 'Strategy for genuine customer reviews',
    'نماذج حية تعمل على المنصة الآن': 'Live demos running on the platform',
    'استكشف كيف تبدو قوائم الطعام وتجارب العملاء الفعلية لمختلف أنواع الأنشطة.': 'See real customer menu experiences across business types.',
    'تجربتان مخصصتان لإدارة سلسة وقوية': 'Two dedicated experiences for smooth, powerful management',
    'فصل كامل بين إدارة العميل لنشاطه، والتحكم الشامل لمالك المنصة.': 'Full separation between restaurant ops and platform control.',
    'بوابة أصحاب المطاعم والأنشطة': 'Restaurant & business portal',
    'واجهة مخصصة وسهلة الاستخدام لمدير المطعم لإدارة الأصناف اليومية، تعديل الأسعار، تتبع الزيارات، وتنزيل ملصقات الـ QR.': 'A simple portal for daily items, prices, visits, and QR stickers.',
    'دخول بوابة العميل ↗': 'Enter client portal ↗',
    'مركز العمليات وإدارة المنصة': 'Operations & platform control center',
    'مركز تحكم شامل لمالك المنصة لتهيئة المطاعم الجديدة، مراجعة مشاريع المواقع، فحص تقييمات الظهور، ومتابعة الطلبات التجارية.': 'Full control for provisioning, websites, visibility audits, and commercial requests.',
    'دخول بوابة المشغل ↗': 'Enter owner portal ↗',
    'طلب اشتراك أو استشارة مجانية': 'Request subscription or free consultation',
    'أدخل بيانات نشاطك وسيتواصل معك فريق Menu لتجهيز حسابك خلال 24 ساعة.': 'Enter your business details — Menu will contact you within 24 hours.',
    'اسم النشاط التجاري / المطعم *': 'Business / restaurant name *',
    'نوع النشاط': 'Business type',
    'الخدمة المطلوبة الأساسية': 'Primary service needed',
    'الدولة': 'Country',
    'المدينة': 'City',
    'اسم مسؤول التواصل *': 'Contact name *',
    'رقم الهاتف / الواتساب *': 'Phone / WhatsApp *',
    'البريد الإلكتروني (اختياري)': 'Email (optional)',
    'تفاصيل إضافية أو ملاحظات خاصة': 'Additional details or notes',
    'إرسال طلب الخدمة': 'Submit service request',
    'الخدمات': 'Services',
    'البوابات': 'Portals',
    'جميع الحقوق محفوظة © 2026 منصة Menu': 'All rights reserved © 2026 Menu',

    /* Public menu chrome */
    'استكشف المنيو': 'Explore menu',
    'الموقع ↗': 'Location ↗',
    'القائمة': 'Menu',
    'استعراض الأصناف': 'Browse items',
    'الواتساب': 'WhatsApp',
    'طلب واستفسار': 'Order & inquire',
    'الموقع': 'Location',
    'خرائط جوجل': 'Google Maps',
    'إنستغرام': 'Instagram',
    'حساب النشاط': 'Business profile',
    'اختر وجبتك': 'Choose your meal',
    'قائمة مختارة بعناية، محدثة لحظيًا.': 'A curated list, updated live.',
    'صنف متاح': 'items available',
    'ابحث في القائمة...': 'Search the menu…',
    'لم نجد ما تبحث عنه': 'No matches found',
    'جرّب كلمة أخرى أو اختر تصنيفًا مختلفًا.': 'Try another term or a different category.',
    'ضريبة القيمة المضافة مشمولة': 'VAT included',
    'تجربة ثنائية اللغة': 'Bilingual experience',
    'التوفر محدث مباشرة': 'Availability updated live',
    'الفرع ومعلومات الزيارة': 'Branch & visit info',
    'يسعدنا استقبالكم خلال أوقات العمل الرسمية.': 'We look forward to welcoming you during business hours.',
    'اتصال مباشر': 'Call now',
    'فتح الموقع ↗': 'Open map ↗',
    'منيو رقمي أنيق': 'Elegant digital menu',
    'بوابة العميل': 'Client portal',
    'استفسر عبر واتساب': 'Ask on WhatsApp',
    'الكل': 'All',
    'مفتوح الآن': 'Open now',
    'مغلق الآن': 'Closed now',
    'ساعات العمل غير منشورة': 'Hours not published'
  };

  var phraseKeys = Object.keys(PHRASES);

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

  function translatePhrase(text, lang) {
    if (!text) return text;
    var trimmed = text.trim();
    if (lang === 'en') {
      if (PHRASES[trimmed]) return text.replace(trimmed, PHRASES[trimmed]);
      // partial startsWith for buttons with icons+text already exact
      return text;
    }
    // reverse map for en→ar when switching back
    for (var i = 0; i < phraseKeys.length; i++) {
      var ar = phraseKeys[i];
      var en = PHRASES[ar];
      if (trimmed === en) return text.replace(trimmed, ar);
    }
    return text;
  }

  function walkTranslate(root, lang) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!node.parentElement) return;
      var tag = node.parentElement.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return;
      // Skip product/data containers that may hold live restaurant names
      if (node.parentElement.closest && node.parentElement.closest('[data-no-i18n],#menuList,#featured,#productsTableBody,#tenantsTableBody,#tenantsTableBodyFull,#brandName,#modalTitle,#modalDescription')) return;
      var raw = node.nodeValue;
      if (!raw || !raw.trim()) return;
      // Skip pure numbers / prices
      if (/^[\d\s.,$€£ر\.سSAR]*$/.test(raw.trim())) return;
      var next = translatePhrase(raw, lang);
      if (next !== raw) node.nodeValue = next;
    });
    // placeholders
    root.querySelectorAll && root.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(function (el) {
      if (el.closest('[data-no-i18n]')) return;
      var p = el.getAttribute('placeholder');
      if (!p) return;
      var np = translatePhrase(p, lang);
      if (np !== p) el.setAttribute('placeholder', np);
    });
  }

  function apply(lang) {
    lang = lang || getLang();
    var ar = lang === 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    if (document.body) document.body.setAttribute('data-lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = t(key, lang);
      if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'), lang));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'), lang));
    });

    walkTranslate(document.body, lang);

    document.querySelectorAll('[data-lang-toggle], #langBtn').forEach(function (btn) {
      btn.textContent = ar ? 'EN' : 'العربية';
      btn.setAttribute('aria-label', ar ? 'Switch to English' : 'التبديل إلى العربية');
    });
  }

  function toggle() {
    return setLang(getLang() === 'ar' ? 'en' : 'ar');
  }

  function bindToggles(root) {
    root = root || document;
    root.querySelectorAll('[data-lang-toggle], #langBtn').forEach(function (btn) {
      if (btn.__i18nBound) return;
      btn.__i18nBound = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        // Public menu has its own handler — still set storage; app.js also listens
        toggle();
      });
    });
  }

  function extend(extra) {
    if (!extra) return;
    Object.keys(extra).forEach(function (k) { dict[k] = extra[k]; });
  }

  function extendPhrases(extra) {
    if (!extra) return;
    Object.keys(extra).forEach(function (k) {
      PHRASES[k] = extra[k];
      phraseKeys = Object.keys(PHRASES);
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
    extendPhrases: extendPhrases,
    dict: dict
  };

  function boot() {
    apply(getLang());
    bindToggles();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
