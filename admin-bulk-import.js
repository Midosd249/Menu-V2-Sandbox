/* Bulk product import — XLSX only. No AI images. Tenant from live session only. */
(function () {
  var rows = [];
  var REQUIRED_HEADERS = ['category', 'name_ar', 'name_en', 'description_ar', 'description_en', 'price', 'calories', 'image_file', 'image_url', 'available', 'featured'];

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }
  function liveOk() {
    return typeof adminClient !== 'undefined' && adminClient &&
      typeof liveTenantId !== 'undefined' && liveTenantId &&
      typeof isLive !== 'undefined' && isLive &&
      typeof liveUser !== 'undefined' && liveUser;
  }
  function normKey(k) {
    return String(k || '').trim().toLowerCase().replace(/\s+/g, '_');
  }
  function parseBool(v, def) {
    if (v === null || v === undefined || String(v).trim() === '') return def;
    var s = String(v).trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'نعم', 'متوفر', 'مميز'].indexOf(s) >= 0) return true;
    if (['0', 'false', 'no', 'n', 'لا', 'غير متوفر'].indexOf(s) >= 0) return false;
    return def;
  }
  function parsePrice(v) {
    if (v === null || v === undefined || String(v).trim() === '') return { ok: true, value: null, blank: true };
    var n = Number(String(v).replace(/,/g, '').trim());
    if (!isFinite(n) || n < 0) return { ok: false, value: null, blank: false };
    return { ok: true, value: Math.round(n * 100) / 100, blank: false };
  }
  function isHttpUrl(u) {
    try {
      var x = new URL(String(u).trim());
      return x.protocol === 'http:' || x.protocol === 'https:';
    } catch (e) { return false; }
  }
  function rowKey(nameAr, nameEn) {
    return (String(nameAr || '').trim().toLowerCase() + '|' + String(nameEn || '').trim().toLowerCase());
  }

  function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      alert('مكتبة Excel غير محمّلة. حدّث الصفحة.');
      return;
    }
    var headers = REQUIRED_HEADERS;
    var sample = [{
      category: 'مشروبات',
      name_ar: 'مثال منتج',
      name_en: 'Sample Item',
      description_ar: '',
      description_en: '',
      price: '12',
      calories: '',
      image_file: '',
      image_url: '',
      available: 'true',
      featured: 'false'
    }];
    var ws1 = XLSX.utils.json_to_sheet(sample, { header: headers });
    var instr = [
      ['تعليمات استيراد المنتجات — Menu V2'],
      [''],
      ['الحقول المطلوبة: category, name_ar, name_en'],
      ['الحقول الاختيارية: description_ar, description_en, price, calories, image_file, image_url, available, featured'],
      ['السعر: رقم موجب. إذا ترك فارغًا لا يُحوَّل تلقائيًا في منطق الاستيراد (المخطط الحالي للسعر NOT NULL default 0).'],
      ['available / featured: true/false أو نعم/لا'],
      ['image_url: رابط https لصورة حقيقية يزوّدها العميل فقط'],
      ['image_file: اسم ملف مرجعي فقط في هذا الإصدار — لا يُرفع تلقائيًا من ملف Excel'],
      ['لا يتم إنشاء صور تلقائيًا. إذا لم توجد صورة، اترك الحقل فارغًا.'],
      ['لا تستخدم صور AI أو صور عشوائية من الويب'],
      ['التكرار داخل الملف أو مع منتجات النشاط الحالي يُتخطى (لا استبدال صامت)'],
      ['tenant_id في الملف يُتجاهل — الاستيراد للنشاط المصرّح به فقط'],
      ['لا حفظ في قاعدة البيانات قبل تأكيد الاستيراد']
    ];
    var ws2 = XLSX.utils.aoa_to_sheet(instr);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Products');
    XLSX.utils.book_append_sheet(wb, ws2, 'Instructions');
    XLSX.writeFile(wb, 'menu-v2-products-import-template.xlsx');
  }

  function mapRow(raw, idx) {
    var o = {};
    Object.keys(raw || {}).forEach(function (k) { o[normKey(k)] = raw[k]; });
    var nameAr = String(o.name_ar != null ? o.name_ar : '').trim();
    var nameEn = String(o.name_en != null ? o.name_en : '').trim();
    var cat = String(o.category != null ? o.category : '').trim();
    var descAr = String(o.description_ar != null ? o.description_ar : '').trim();
    var descEn = String(o.description_en != null ? o.description_en : '').trim();
    var priceInfo = parsePrice(o.price);
    var calRaw = o.calories;
    var calories = null;
    if (calRaw !== null && calRaw !== undefined && String(calRaw).trim() !== '') {
      var cn = parseInt(String(calRaw).trim(), 10);
      if (!isFinite(cn) || cn < 0) {
        return { idx: idx, status: 'invalid', reason: 'سعرات غير صالحة', name_ar: nameAr, name_en: nameEn, category: cat, imgState: 'بدون صورة' };
      }
      calories = cn;
    }
    var imageUrl = String(o.image_url != null ? o.image_url : '').trim();
    var imageFile = String(o.image_file != null ? o.image_file : '').trim();
    var imgState = 'بدون صورة';
    var finalUrl = null;
    if (imageUrl) {
      if (isHttpUrl(imageUrl)) {
        finalUrl = imageUrl;
        imgState = 'صورة موجودة';
      } else {
        imgState = 'الصورة تحتاج مراجعة';
      }
    } else if (imageFile) {
      imgState = 'بدون صورة';
    }
    var issues = [];
    if (!nameAr && !nameEn) issues.push('اسم المنتج مطلوب');
    if (!cat) issues.push('القسم مطلوب');
    if (!priceInfo.ok) issues.push('سعر غير صالح');
    if (imgState === 'الصورة تحتاج مراجعة') issues.push('رابط صورة غير صالح');
    if (!nameEn && nameAr) nameEn = nameAr;
    if (!nameAr && nameEn) nameAr = nameEn;
    var status = issues.length ? 'invalid' : 'ready';
    return {
      idx: idx,
      status: status,
      reason: issues.join(' · '),
      category: cat,
      name_ar: nameAr,
      name_en: nameEn,
      description_ar: descAr || null,
      description_en: descEn || null,
      price: priceInfo.blank ? null : priceInfo.value,
      priceBlank: priceInfo.blank,
      calories: calories,
      image_url: finalUrl,
      imgState: imgState,
      available: parseBool(o.available, true),
      featured: parseBool(o.featured, false)
    };
  }

  function renderPreview() {
    var panel = $('bulkImportPanel');
    var tbody = $('bulkImportRows');
    var sum = $('bulkImportSummary');
    var conf = $('bulkImportConfirm');
    if (!panel || !tbody || !sum) return;
    panel.hidden = false;
    var total = rows.length;
    var ready = rows.filter(function (r) { return r.status === 'ready'; }).length;
    var review = rows.filter(function (r) { return r.status === 'invalid' || r.status === 'duplicate_file' || r.status === 'duplicate_db'; }).length;
    var noImg = rows.filter(function (r) { return r.imgState === 'بدون صورة'; }).length;
    sum.textContent = 'إجمالي المنتجات: ' + total + ' · جاهزة للاستيراد: ' + ready + ' · تحتاج مراجعة: ' + review + ' · بدون صورة: ' + noImg;
    tbody.innerHTML = rows.map(function (r) {
      var st = r.status === 'ready' ? 'جاهز' :
        r.status === 'duplicate_file' ? 'مكرر في الملف' :
        r.status === 'duplicate_db' ? 'موجود مسبقًا' :
        ('مراجعة: ' + (r.reason || ''));
      var priceTxt = r.priceBlank ? '—' : (r.price != null ? String(r.price) : '—');
      var calTxt = r.calories != null ? String(r.calories) : '—';
      return '<tr><td>' + esc(r.name_ar || r.name_en) + '</td><td>' + esc(r.category) + '</td><td>' + esc(priceTxt) +
        '</td><td>' + esc(calTxt) + '</td><td>' + esc(r.imgState) + '</td><td>' + esc(st) + '</td></tr>';
    }).join('');
    conf.hidden = ready === 0;
    if ($('bulkImportResult')) $('bulkImportResult').textContent = '';
  }

  async function markDbDuplicates() {
    if (!liveOk()) return;
    var existing = await adminClient.from('products')
      .select('id,name_ar,name_en')
      .eq('tenant_id', liveTenantId)
      .limit(2000);
    var set = {};
    (existing.data || []).forEach(function (p) {
      set[rowKey(p.name_ar, p.name_en)] = true;
    });
    rows.forEach(function (r) {
      if (r.status !== 'ready') return;
      if (set[rowKey(r.name_ar, r.name_en)]) {
        r.status = 'duplicate_db';
        r.reason = 'منتج موجود لنفس النشاط';
      }
    });
  }

  function markFileDuplicates() {
    var seen = {};
    rows.forEach(function (r) {
      if (r.status !== 'ready') return;
      var k = rowKey(r.name_ar, r.name_en);
      if (seen[k]) {
        r.status = 'duplicate_file';
        r.reason = 'مكرر داخل الملف';
      } else {
        seen[k] = true;
      }
    });
  }

  async function handleFile(file) {
    if (!file) return;
    if (!liveOk()) {
      alert('سجّل الدخول وحمّل بيانات النشاط الحي أولاً.');
      return;
    }
    if (typeof XLSX === 'undefined') {
      alert('مكتبة Excel غير محمّلة.');
      return;
    }
    var buf = await file.arrayBuffer();
    var wb = XLSX.read(buf, { type: 'array' });
    var sheetName = wb.SheetNames.indexOf('Products') >= 0 ? 'Products' : wb.SheetNames[0];
    var json = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    if (!json.length) {
      alert('الملف فارغ.');
      return;
    }
    var headers = Object.keys(json[0]).map(normKey);
    if (headers.indexOf('name_ar') < 0 && headers.indexOf('name_en') < 0) {
      alert('رؤوس الأعمدة غير صالحة. استخدم القالب.');
      return;
    }
    rows = json.map(function (raw, i) { return mapRow(raw, i + 2); });
    markFileDuplicates();
    await markDbDuplicates();
    renderPreview();
  }

  async function ensureCategory(name) {
    var cats = await adminClient.from('categories')
      .select('id,name_ar,name_en')
      .eq('tenant_id', liveTenantId)
      .limit(200);
    var list = cats.data || [];
    var low = name.toLowerCase();
    var hit = list.find(function (c) {
      return String(c.name_ar || '').toLowerCase() === low || String(c.name_en || '').toLowerCase() === low;
    });
    if (hit) return hit.id;
    var ins = await adminClient.from('categories').insert({
      tenant_id: liveTenantId,
      name_ar: name,
      name_en: name,
      is_active: true,
      sort_order: list.length
    }).select('id').limit(1).maybeSingle();
    if (ins.error || !ins.data || !ins.data.id) throw new Error(ins.error && ins.error.message || 'فشل إنشاء القسم');
    return ins.data.id;
  }

  async function confirmImport() {
    if (!liveOk()) {
      alert('الجلسة غير مصرّح بها.');
      return;
    }
    var ready = rows.filter(function (r) { return r.status === 'ready'; });
    if (!ready.length) return;
    var conf = $('bulkImportConfirm');
    if (conf) { conf.disabled = true; conf.textContent = 'جارٍ الاستيراد…'; }
    var imported = 0, failed = 0, skipped = rows.filter(function (r) {
      return r.status === 'duplicate_file' || r.status === 'duplicate_db' || r.status === 'invalid';
    }).length;
    var failMsgs = [];
    var catCache = {};
    for (var i = 0; i < ready.length; i++) {
      var r = ready[i];
      try {
        if (!catCache[r.category]) catCache[r.category] = await ensureCategory(r.category);
        var payload = {
          tenant_id: liveTenantId,
          category_id: catCache[r.category],
          name_ar: r.name_ar,
          name_en: r.name_en,
          description_ar: r.description_ar,
          description_en: r.description_en,
          is_available: !!r.available,
          is_featured: !!r.featured,
          updated_at: new Date().toISOString()
        };
        if (r.price != null) payload.price = r.price;
        if (r.calories != null) payload.calories = r.calories;
        if (r.image_url) payload.image_url = r.image_url;
        var res = await adminClient.from('products').insert(payload).select('id').limit(1).maybeSingle();
        if (res.error || !res.data || !res.data.id) {
          failed++;
          failMsgs.push((r.name_ar || r.name_en) + ': ' + (res.error && res.error.message || 'فشل'));
        } else {
          imported++;
        }
      } catch (e) {
        failed++;
        failMsgs.push((r.name_ar || r.name_en) + ': ' + (e.message || e));
      }
    }
    if (typeof loadLiveTenant === 'function') await loadLiveTenant();
    var msg = 'تم الاستيراد: ' + imported + ' · تخطي مكرر/مراجعة: ' + skipped + ' · فشل: ' + failed;
    if (failMsgs.length) msg += '\n' + failMsgs.slice(0, 8).join('\n');
    if ($('bulkImportResult')) $('bulkImportResult').textContent = msg;
    if (conf) { conf.disabled = false; conf.textContent = 'تأكيد الاستيراد'; conf.hidden = true; }
    rows = [];
  }

  function bind() {
    var tBtn = $('bulkTemplateBtn');
    var iBtn = $('bulkImportBtn');
    var file = $('bulkImportFile');
    var cancel = $('bulkImportCancel');
    var conf = $('bulkImportConfirm');
    if (tBtn && !tBtn.dataset.bound) {
      tBtn.dataset.bound = '1';
      tBtn.onclick = downloadTemplate;
    }
    if (iBtn && file && !iBtn.dataset.bound) {
      iBtn.dataset.bound = '1';
      iBtn.onclick = function () {
        if (!liveOk()) { alert('سجّل الدخول وحمّل النشاط الحي أولاً.'); return; }
        file.value = '';
        file.click();
      };
      file.onchange = function () {
        var f = file.files && file.files[0];
        if (f) handleFile(f);
      };
    }
    if (cancel && !cancel.dataset.bound) {
      cancel.dataset.bound = '1';
      cancel.onclick = function () {
        rows = [];
        if ($('bulkImportPanel')) $('bulkImportPanel').hidden = true;
      };
    }
    if (conf && !conf.dataset.bound) {
      conf.dataset.bound = '1';
      conf.onclick = confirmImport;
    }
  }

  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    bind();
    if (tries > 40) clearInterval(timer);
  }, 400);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
