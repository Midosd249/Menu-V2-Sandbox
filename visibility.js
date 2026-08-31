(function () {
  "use strict";

  var K = "menu_visibility_audit_v1";
  var client = null;
  var STEPS = ["بيانات النشاط", "الروابط", "ملف جوجل", "الموقع والسمعة", "المراجعة"];

  var GBP_CHECKS = [
    ["has_primary_category", "تصنيف رئيسي محدد"],
    ["has_description", "وصف النشاط مكتوب"],
    ["has_services", "خدمات أو منتجات مضافة"],
    ["has_hours", "ساعات العمل مكتملة"],
    ["has_phone", "رقم هاتف ظاهر"],
    ["has_photos", "صور حديثة (5+ تقريباً)"],
    ["has_logo", "شعار مرفوع"],
    ["has_cover", "صورة غلاف"],
    ["has_attributes", "سمات النشاط (واي فاي، موقف…)"],
    ["has_booking_or_order", "رابط حجز أو طلب"],
    ["responds_reviews", "الرد على التقييمات بشكل منتظم"]
  ];

  var WEB_CHECKS = [
    ["web_mobile", "الموقع يعمل جيدًا على الجوال"],
    ["web_address", "العنوان ظاهر بوضوح"],
    ["web_phone_wa", "اتصال أو واتساب سهل الوصول"],
    ["web_maps_embed", "خريطة أو رابط خرائط"],
    ["web_hours", "ساعات العمل على الموقع"],
    ["name_consistent", "الاسم متسق بين الموقع والخريطة"],
    ["phone_consistent", "الهاتف متسق بين القنوات"],
    ["has_recent_reviews", "تقييمات حديثة خلال آخر 3 أشهر"]
  ];

  var S = {
    step: 0,
    business_name: "",
    business_category: "",
    city: "",
    neighborhood: "",
    phone: "",
    whatsapp: "",
    maps_url: "",
    website_url: "",
    social: { instagram: "", tiktok: "", snapchat: "", x: "" },
    gbp: {},
    web: {},
    notes: "",
    country_code: "SA",
    region: ""
  };

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m];
    });
  }

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(K) || "null");
      if (d) Object.assign(S, d);
    } catch (e) {}
  }

  function save() {
    try { localStorage.setItem(K, JSON.stringify(S)); } catch (e) {}
  }

  function initClient() {
    return typeof window.getMenuSupabaseClient === 'function' ? window.getMenuSupabaseClient() : null;
  }

  function notifyOwner(kind, id) {
    if (!id) return;
    fetch('/api/notify-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: kind, id: String(id) }),
      keepalive: true
    }).catch(function (error) {
      console.warn('Owner notification could not be dispatched:', error);
    });
  }

  function val(id) {
    var el = $(id);
    return el ? String(el.value || "").trim() : "";
  }

  function set(id, v) {
    var el = $(id);
    if (el) el.value = v || "";
  }

  function readAll() {
    S.business_name = val("vsName");
    S.business_category = val("vsCategory");
    S.city = val("vsCity");
    S.neighborhood = val("vsNeighborhood");
    S.phone = val("vsPhone");
    S.whatsapp = val("vsWhatsapp");
    S.maps_url = val("vsMaps");
    S.website_url = val("vsWebsite");
    S.social.instagram = val("vsIg");
    S.social.tiktok = val("vsTt");
    S.social.snapchat = val("vsSnap");
    S.social.x = val("vsX");
    S.notes = val("vsNotes");
    S.country_code = val("vsCountry") || S.country_code || "SA";
    S.region = val("vsRegion");
    document.querySelectorAll("#vsGbpChecks input[data-k]").forEach(function (inp) {
      S.gbp[inp.getAttribute("data-k")] = !!inp.checked;
    });
    document.querySelectorAll("#vsWebChecks input[data-k]").forEach(function (inp) {
      S.web[inp.getAttribute("data-k")] = !!inp.checked;
    });
  }

  function fill() {
    set("vsName", S.business_name);
    set("vsCategory", S.business_category);
    set("vsCity", S.city);
    set("vsNeighborhood", S.neighborhood);
    set("vsPhone", S.phone);
    set("vsWhatsapp", S.whatsapp);
    set("vsMaps", S.maps_url);
    set("vsWebsite", S.website_url);
    set("vsIg", S.social.instagram);
    set("vsTt", S.social.tiktok);
    set("vsSnap", S.social.snapchat);
    set("vsX", S.social.x);
    set("vsNotes", S.notes);
    set("vsRegion", S.region);
    if (window.MENU_MARKETS) {
      MENU_MARKETS.fillSelect($("vsCountry"), S.country_code || "SA");
      applyMarketLabels();
    }
  }

  function renderSteps() {
    var el = $("vsSteps");
    if (!el) return;
    el.innerHTML = STEPS.map(function (t, i) {
      return '<span class="vs-step-pill' + (i === S.step ? " active" : i < S.step ? " done" : "") + '">' + (i + 1) + ". " + t + "</span>";
    }).join("");
  }

  function renderChecks(containerId, list, store) {
    var el = $(containerId);
    if (!el) return;
    el.innerHTML = list.map(function (item) {
      var k = item[0];
      var on = !!store[k];
      return '<label class="vs-check"><input type="checkbox" data-k="' + k + '"' + (on ? " checked" : "") + ">" + esc(item[1]) + "</label>";
    }).join("");
  }

  function renderReview() {
    var el = $("vsReview");
    if (!el) return;
    var gbpCount = Object.keys(S.gbp).filter(function (k) { return S.gbp[k]; }).length;
    var webCount = Object.keys(S.web).filter(function (k) { return S.web[k]; }).length;
    var mkt = window.MENU_MARKETS ? MENU_MARKETS.label(S.country_code || "SA") : (S.country_code || "SA");
    el.innerHTML =
      "<strong>" + esc(S.business_name || "—") + "</strong><br>" +
      esc(S.business_category || "بدون تصنيف") +
      " · " + esc(mkt) +
      (S.region ? " · " + esc(S.region) : "") +
      (S.city ? " · " + esc(S.city) : "") +
      (S.neighborhood ? " · " + esc(S.neighborhood) : "") +
      "<br>هاتف/واتساب: " + esc(S.phone || S.whatsapp || "غير مدخل") +
      "<br>خرائط: " + (S.maps_url ? "رابط مُدخل" : "غير متوفر") +
      " · موقع: " + (S.website_url ? "رابط مُدخل" : "غير متوفر") +
      "<br>عناصر ملف جوجل المحددة: " + gbpCount + " / " + GBP_CHECKS.length +
      "<br>عناصر الموقع/الاتساق: " + webCount + " / " + WEB_CHECKS.length;
  }

  function computeAudit() {
    var findings = [];
    var actions = [];
    var breakdown = {
      completeness: 0, info: 0, local_seo: 0, website: 0,
      reviews: 0, content: 0, conversion: 0, consistency: 0
    };
    var max = {
      completeness: 20, info: 12, local_seo: 12, website: 14,
      reviews: 10, content: 12, conversion: 12, consistency: 8
    };

    function addFinding(problem, why, action, priority, effort) {
      findings.push({ problem: problem, why: why, action: action, priority: priority, effort: effort });
      actions.push({ problem: problem, action: action, priority: priority, effort: effort });
    }

    var gbpKeys = GBP_CHECKS.map(function (x) { return x[0]; });
    var gbpOn = gbpKeys.filter(function (k) { return S.gbp[k]; }).length;
    breakdown.completeness = Math.round((gbpOn / gbpKeys.length) * max.completeness);

    if (!S.gbp.has_primary_category) {
      addFinding("التصنيف الرئيسي غير محدد أو غير مؤكد", "التصنيف يساعد العملاء ومحركات البحث على فهم نوع النشاط.", "حدد التصنيف الأقرب لنشاطك في ملف خرائط جوجل، وأضف تصنيفات ثانوية إن لزم.", "critical", "easy");
    }
    if (!S.gbp.has_hours) {
      addFinding("ساعات العمل غير مكتملة", "العملاء يحتاجون معرفة متى تكون مفتوحًا قبل الزيارة أو الاتصال.", "أدخل ساعات العمل اليومية وحدث الساعات الخاصة عند الحاجة.", "critical", "easy");
    }
    if (!S.gbp.has_phone && !S.phone && !S.whatsapp) {
      addFinding("لا يوجد رقم تواصل واضح", "بدون هاتف أو واتساب يصعب تحويل الاكتشاف إلى عميل.", "أضف رقم جوال وواتساب في ملف الخرائط وعلى الموقع.", "critical", "easy");
    }
    if (!S.gbp.has_description) {
      addFinding("وصف النشاط ناقص", "الوصف يعطي سياقًا محليًا عما تقدمه ولمن.", "اكتب وصفًا طبيعيًا بالعربية يذكر المدينة/الحي ونوع الخدمات دون حشو.", "high", "moderate");
    }
    if (!S.gbp.has_services) {
      addFinding("الخدمات أو المنتجات غير مضافة", "قائمة الخدمات تزيد وضوح العرض وتساعد في البحث المحلي.", "أضف أهم الخدمات أو المنتجات مع وصف مختصر.", "high", "moderate");
    }
    if (!S.gbp.has_photos) {
      addFinding("الصور قليلة أو غير مؤكدة", "الصور تبني الثقة وتشجع الزيارة.", "ارفع صورًا حديثة للواجهة والمنتجات/الخدمات.", "high", "moderate");
    }
    if (!S.gbp.has_logo || !S.gbp.has_cover) {
      addFinding("الشعار أو صورة الغلاف ناقصة", "الهوية البصرية تساعد على التعرف السريع على النشاط.", "ارفع شعارًا واضحًا وصورة غلاف تمثل النشاط.", "medium", "easy");
    }
    if (!S.gbp.has_attributes) {
      addFinding("سمات النشاط غير مكتملة", "السمات تساعد التصفية في البحث المحلي.", "راجع قائمة السمات وفعّل ما ينطبق فعليًا.", "medium", "easy");
    }
    if (!S.gbp.has_booking_or_order) {
      addFinding("لا يوجد رابط حجز أو طلب", "رابط مباشر يقلل الاحتكاك بعد الاكتشاف.", "أضف رابط واتساب أو حجز أو منيو رقمي إن كان مناسبًا.", "medium", "moderate");
    }

    var infoPts = 0;
    if (S.business_name) infoPts += 4;
    if (S.business_category) infoPts += 3;
    if (S.city) infoPts += 3;
    if (S.phone || S.whatsapp) infoPts += 2;
    breakdown.info = Math.min(max.info, infoPts);

    var seoPts = 0;
    if (S.maps_url) seoPts += 6;
    else {
      addFinding("رابط خرائط جوجل غير مُدخل", "بدون رابط ملف واضح يصعب تتبع وتحسين الظهور.", "انسخ رابط ملف نشاطك من خرائط جوجل وأضفه هنا وفي موقعك.", "high", "easy");
    }
    if (S.city && S.neighborhood) seoPts += 3;
    if (S.business_category) seoPts += 3;
    breakdown.local_seo = Math.min(max.local_seo, seoPts);

    if (!S.website_url) {
      breakdown.website = 2;
      addFinding("لا يوجد موقع إلكتروني مُدخل", "الموقع يدعم الثقة والاتساق المحلي ومسارات التحويل.", "إن لم يكن لديك موقع، فكّر في خدمة إنشاء موقع من Menu.", "high", "advanced");
    } else {
      var w = 4;
      if (S.web.web_mobile) w += 3;
      else addFinding("أداء الجوال غير مؤكد", "معظم الزيارات من الجوال.", "تأكد أن الموقع سريع وواضح على الشاشات الصغيرة.", "high", "moderate");
      if (S.web.web_address) w += 2;
      if (S.web.web_phone_wa) w += 2;
      if (S.web.web_maps_embed) w += 2;
      if (S.web.web_hours) w += 1;
      breakdown.website = Math.min(max.website, w);
    }

    if (S.gbp.responds_reviews) breakdown.reviews += 6;
    else {
      addFinding("الرد على التقييمات غير منتظم أو غير مؤكد", "الرد يبني الثقة ويظهر تفاعل النشاط.", "ضع روتينًا أسبوعيًا للرد على التقييمات. لا تطلب تقييمات وهمية.", "high", "easy");
    }
    if (S.web.has_recent_reviews) breakdown.reviews += 4;
    else {
      addFinding("لا توجد إشارة لتقييمات حديثة", "التقييمات الحديثة أقوى من القديمة فقط.", "شجّع العملاء الراضين على التقييم عبر رابط رسمي — دون تحفيز مخالف لسياسات جوجل.", "medium", "moderate");
    }
    breakdown.reviews = Math.min(max.reviews, breakdown.reviews);

    var cPts = 0;
    if (S.gbp.has_photos) cPts += 5;
    if (S.gbp.has_services) cPts += 4;
    if (S.gbp.has_description) cPts += 3;
    breakdown.content = Math.min(max.content, cPts);

    var conv = 0;
    if (S.phone || S.whatsapp || S.gbp.has_phone) conv += 5;
    if (S.gbp.has_booking_or_order || S.web.web_phone_wa) conv += 4;
    if (S.maps_url || S.web.web_maps_embed) conv += 3;
    breakdown.conversion = Math.min(max.conversion, conv);
    if (conv < 6) {
      addFinding("مسارات التحويل ضعيفة", "الاكتشاف بلا اتصال أو واتساب أو خريطة يقلل الزيارات الفعلية.", "اجعل زر واتساب/اتصال ظاهرًا في الملف والموقع.", "critical", "easy");
    }

    var cons = 0;
    if (S.web.name_consistent) cons += 4;
    else if (S.website_url) {
      addFinding("اتساق الاسم غير مؤكد", "اختلاف الاسم بين الموقع والخريطة يضعف الثقة.", "وحّد كتابة اسم النشاط في كل القنوات.", "high", "easy");
    }
    if (S.web.phone_consistent) cons += 4;
    else if (S.phone || S.whatsapp) {
      addFinding("اتساق الهاتف غير مؤكد", "أرقام مختلفة تربك العملاء.", "استخدم نفس الرقم الأساسي في الخريطة والموقع والسوشيال.", "high", "easy");
    }
    breakdown.consistency = Math.min(max.consistency, cons);

    var total = 0;
    Object.keys(breakdown).forEach(function (k) { total += breakdown[k]; });
    total = Math.max(0, Math.min(100, total));

    var critical = findings.filter(function (f) { return f.priority === "critical"; });
    var high = findings.filter(function (f) { return f.priority === "high"; });

    var plan = {
      week1: critical.length ? critical.map(function (f) { return f.action; }).slice(0, 4) : ["راجع اكتمال الاسم والهاتف والساعات على ملف الخرائط."],
      week2: high.filter(function (f) { return /وصف|خدمات|موقع|اتساق|جوال/i.test(f.problem + f.action); }).map(function (f) { return f.action; }).slice(0, 4),
      week3: findings.filter(function (f) { return /صور|تقييم|سمات|غلاف|شعار/i.test(f.problem + f.action); }).map(function (f) { return f.action; }).slice(0, 4),
      week4: ["راجع ما تم إنجازه من القائمة.", "حدّث أي معلومات تغيّرت (ساعات، عروض، صور).", "أعد تقييم الفجوات المتبقية دون افتراض تحسن الترتيب تلقائيًا."]
    };
    if (!plan.week2.length) plan.week2 = ["حسّن وصف النشاط وقائمة الخدمات إن كانت ناقصة.", "اربط الموقع بملف الخرائط إن وُجد."];
    if (!plan.week3.length) plan.week3 = ["أضف صورًا حديثة إن لزم.", "ضع روتين رد على التقييمات."];

    var checklist = {
      gbp: GBP_CHECKS.map(function (x) { return { key: x[0], label: x[1], done: !!S.gbp[x[0]] }; }),
      website: WEB_CHECKS.map(function (x) { return { key: x[0], label: x[1], done: !!S.web[x[0]] }; })
    };

    var summary = "تقييم ظهور محلي لـ «" + S.business_name + "»" + (S.city ? " في " + S.city : "") + ". الدرجة " + total + "/100 مبنية على البيانات المدخلة فقط. عدد الفرص المحددة: " + findings.length + ".";

    return {
      score_total: total,
      score_breakdown: breakdown,
      findings: findings,
      action_plan: actions,
      checklist: checklist,
      plan_30d: plan,
      report_summary: summary
    };
  }

  function scoreLabel(n) {
    if (n >= 80) return "أساس قوي — ركّز على التفاصيل والتحويل";
    if (n >= 60) return "جيد مع فجوات واضحة يمكن سدّها";
    if (n >= 40) return "يحتاج عملًا على الأساسيات";
    return "فجوات كبيرة في الاكتمال أو التحويل";
  }

  function renderReport(audit) {
    var el = $("vsReport");
    if (!el) return;
    var b = audit.score_breakdown;
    var cats = [
      ["اكتمال الملف", b.completeness, 20],
      ["معلومات النشاط", b.info, 12],
      ["إشارات محلية", b.local_seo, 12],
      ["الموقع", b.website, 14],
      ["السمعة", b.reviews, 10],
      ["المحتوى", b.content, 12],
      ["التحويل", b.conversion, 12],
      ["الاتساق", b.consistency, 8]
    ];

    var findingsHtml = (audit.findings || []).map(function (f) {
      return (
        '<div class="vs-finding">' +
        '<span class="pri ' + esc(f.priority) + '">' +
        ({ critical: "حرج", high: "مرتفع", medium: "متوسط", low: "منخفض" }[f.priority] || f.priority) +
        " · " + ({ easy: "سهل", moderate: "متوسط", advanced: "متقدم" }[f.effort] || f.effort) +
        "</span>" +
        "<h4>" + esc(f.problem) + "</h4>" +
        "<p><strong>لماذا يهم:</strong> " + esc(f.why) + "</p>" +
        '<p class="action">الإجراء: ' + esc(f.action) + "</p>" +
        "</div>"
      );
    }).join("") || '<p class="muted">لم تُحدد فجوات كبيرة من الإجابات الحالية.</p>';

    var plan = audit.plan_30d || {};
    function weekList(arr) {
      return "<ul>" + (arr || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    }

    var needWebsite = !S.website_url || (b.website || 0) < 8;
    var upsell = needWebsite
      ? '<div class="vs-upsell"><strong>فرصة مرتبطة: موقع احترافي</strong><p>من إجاباتك يبدو أن الموقع ناقص أو غير مُدخل. موقع واضح بالعربية مع واتساب وخريطة وساعات يدعم الظهور المحلي والتحويل.</p><a class="vs-btn vs-btn-accent" href="website.html">استكشف خدمة إنشاء الموقع</a></div>'
      : '<div class="vs-upsell"><strong>بعد تنفيذ الأساسيات</strong><p>عند اكتمال ملف الخرائط، تأكد أن الموقع يعكس نفس الاسم والهاتف والعنوان.</p><a class="vs-btn vs-btn-accent" href="website.html" style="background:transparent;color:var(--ink);border:1px solid var(--line)">خدمة المواقع</a></div>';

    el.classList.add("show");
    el.innerHTML =
      '<div class="vs-score-card">' +
      '<div class="vs-score-num">' + audit.score_total + '<span>/100</span></div>' +
      '<div class="vs-score-meta"><h3>درجة الظهور المحلي</h3><p>' + esc(scoreLabel(audit.score_total)) +
      '</p><p style="margin-top:8px;opacity:.75;font-size:12px">مبنية على إجاباتك فقط — ليست ترتيبًا على جوجل.</p></div></div>' +
      '<div class="vs-cats">' +
      cats.map(function (c) {
        return '<div class="vs-cat"><strong>' + c[1] + '</strong><span>' + c[0] + " / " + c[2] + "</span></div>";
      }).join("") +
      "</div>" +
      '<div class="vs-section-head"><p class="eyebrow">FINDINGS</p><h2>المشاكل والإجراءات</h2></div>' +
      '<div class="vs-findings">' + findingsHtml + "</div>" +
      '<div class="vs-plan"><h3>خطة 30 يومًا</h3>' +
      '<div class="vs-plan-week"><strong>الأسبوع 1 — الأساسيات الحرجة</strong>' + weekList(plan.week1) + "</div>" +
      '<div class="vs-plan-week"><strong>الأسبوع 2 — المحتوى والإشارات المحلية</strong>' + weekList(plan.week2) + "</div>" +
      '<div class="vs-plan-week"><strong>الأسبوع 3 — الصور والسمعة</strong>' + weekList(plan.week3) + "</div>" +
      '<div class="vs-plan-week"><strong>الأسبوع 4 — القياس والمتابعة</strong>' + weekList(plan.week4) + "</div>" +
      "</div>" +
      upsell;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validate() {
    if (S.step === 0) {
      readAll();
      if (!S.business_name) return "أدخل اسم النشاط.";
    }
    return null;
  }

  function show() {
    document.querySelectorAll(".vs-panel").forEach(function (p, i) {
      p.classList.toggle("active", i === S.step);
    });
    renderSteps();
    if (S.step <= 1) fill();
    if (S.step === 2) renderChecks("vsGbpChecks", GBP_CHECKS, S.gbp);
    if (S.step === 3) {
      fill();
      renderChecks("vsWebChecks", WEB_CHECKS, S.web);
    }
    if (S.step === 4) {
      readAll();
      renderReview();
    }
    var prev = $("vsPrev");
    var next = $("vsNext");
    var sub = $("vsSubmit");
    if (prev) prev.hidden = S.step === 0;
    if (next) next.hidden = S.step === STEPS.length - 1;
    if (sub) sub.hidden = S.step !== STEPS.length - 1;
    var msg = $("vsMsg");
    if (msg) {
      msg.textContent = "";
      msg.className = "vs-msg";
    }
  }

  async function submit() {
    var msg = $("vsMsg");
    var btn = $("vsSubmit");
    var err = validate();
    if (err) {
      if (msg) { msg.textContent = err; msg.className = "vs-msg err"; }
      return;
    }
    readAll();
    var audit = computeAudit();
    renderReport(audit);

    if (btn) { btn.disabled = true; btn.textContent = "جارٍ الحفظ…"; }

    if (client) {
      try {
        var payload = {
          business_name: S.business_name,
          business_category: S.business_category || null,
          city: S.city || null,
          neighborhood: S.neighborhood || null,
          maps_url: S.maps_url || null,
          website_url: S.website_url || null,
          social: S.social,
          phone: S.phone || null,
          whatsapp: S.whatsapp || null,
          inputs: { gbp: S.gbp, web: S.web },
          score_total: audit.score_total,
          score_breakdown: audit.score_breakdown,
          findings: audit.findings,
          action_plan: audit.action_plan,
          checklist: audit.checklist,
          plan_30d: audit.plan_30d,
          report_summary: audit.report_summary,
          notes: S.notes || null,
          country_code: S.country_code || "SA",
          region: S.region || null
        };
        var r = await client.rpc("submit_visibility_audit", { p_payload: payload });
        if (r.error) throw r.error;
        if (!r.data || !r.data.id) throw new Error('لم تؤكد الخدمة حفظ التقييم.');
        notifyOwner('visibility', r.data.id);
        try { localStorage.removeItem(K); } catch (e) {}
        if (msg) { msg.textContent = "تم حفظ التقييم. يمكنك مراجعة التقرير أدناه."; msg.className = "vs-msg ok"; }
      } catch (e) {
        if (msg) { msg.textContent = "عُرض التقرير محليًا. تعذر الحفظ على الخادم: " + (e.message || ""); msg.className = "vs-msg err"; }
      }
    } else {
      if (msg) { msg.textContent = "التقرير جاهز (وضع محلي بدون حفظ سحابي)."; msg.className = "vs-msg ok"; }
    }

    if (btn) { btn.disabled = false; btn.textContent = "إنشاء التقرير"; }
  }

  function bind() {
    var start = $("vsStart");
    if (start) {
      start.onclick = function (e) {
        e.preventDefault();
        var w = $("vsWizard");
        if (w) w.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
    var prev = $("vsPrev");
    var next = $("vsNext");
    var sub = $("vsSubmit");
    if (prev) {
      prev.onclick = function () {
        if (S.step > 0) { S.step--; save(); show(); }
      };
    }
    if (next) {
      next.onclick = function () {
        var err = validate();
        var msg = $("vsMsg");
        if (err) {
          if (msg) { msg.textContent = err; msg.className = "vs-msg err"; }
          return;
        }
        readAll();
        if (S.step < STEPS.length - 1) { S.step++; save(); show(); }
      };
    }
    if (sub) sub.onclick = submit;
  }

  function applyMarketLabels() {
    if (!window.MENU_MARKETS) return;
    var m = MENU_MARKETS.get(S.country_code || "SA");
    var rl = $("vsRegionLabel");
    if (rl) rl.textContent = m.region_label;
    var ri = $("vsRegion");
    if (ri) ri.placeholder = m.region_placeholder;
    var ci = $("vsCity");
    if (ci) ci.placeholder = m.city_placeholder;
    var al = $("vsAreaLabel");
    if (al) al.textContent = m.area_label;
    var ai = $("vsNeighborhood");
    if (ai) ai.placeholder = m.area_placeholder;
    var dh = $("vsDialHint");
    if (dh) dh.textContent = m.dial;
  }

  function initMarketVs() {
    if (!window.MENU_MARKETS) return;
    MENU_MARKETS.fillSelect($("vsCountry"), S.country_code || "SA");
    applyMarketLabels();
    var sel = $("vsCountry");
    if (sel) {
      sel.onchange = function () {
        S.country_code = sel.value || "SA";
        applyMarketLabels();
        save();
      };
    }
  }

  function boot() {
    client = initClient();
    load();
    bind();
    initMarketVs();
    show();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
