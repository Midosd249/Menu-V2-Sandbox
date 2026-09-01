/* Menu V2 — restored catalog import + product media UX
 * Keeps tenant scoping, preview-before-write, duplicate skipping and no automatic images.
 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function injectImportUI() {
    var productsCard = document.querySelector('#panel-products > .admin-card');
    if (!productsCard || $('bulkImportTools')) return;
    var titleBlock = productsCard.querySelector('h2');
    if (!titleBlock) return;

    var tools = document.createElement('div');
    tools.id = 'bulkImportTools';
    tools.className = 'admin-card';
    tools.style.cssText = 'margin-top:14px;padding:14px;border:1px solid rgba(21,18,15,.10);background:rgba(255,255,255,.55)';
    tools.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">' +
        '<div><p class="eyebrow" style="margin-bottom:4px">BULK IMPORT</p>' +
        '<h3 style="margin:0">استيراد الأصناف من Excel</h3>' +
        '<p class="muted" style="margin:6px 0 0">ارفع ملف XLSX، راجع الأصناف أولاً، ثم أكّد الاستيراد. لا يتم إنشاء أو اختيار صور تلقائياً.</p></div>' +
        '<div class="row-actions" style="margin:0">' +
          '<button class="btn secondary" id="bulkTemplateBtn" type="button">تحميل قالب Excel</button>' +
          '<button class="btn" id="bulkImportBtn" type="button">استيراد ملف</button>' +
          '<input id="bulkImportFile" type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" hidden>' +
        '</div>' +
      '</div>' +
      '<div id="bulkImportPanel" hidden style="margin-top:14px">' +
        '<div id="bulkImportSummary" class="muted" role="status"></div>' +
        '<div style="overflow:auto;margin-top:10px"><table class="table"><thead><tr><th>الصنف</th><th>القسم</th><th>السعر</th><th>السعرات</th><th>الصورة</th><th>الحالة</th></tr></thead><tbody id="bulkImportRows"></tbody></table></div>' +
        '<div class="row-actions" style="margin-top:12px">' +
          '<button class="btn" id="bulkImportConfirm" type="button" hidden>تأكيد الاستيراد</button>' +
          '<button class="btn secondary" id="bulkImportCancel" type="button">إلغاء</button>' +
          '<span id="bulkImportResult" class="muted" role="status"></span>' +
        '</div>' +
      '</div>';

    var table = productsCard.querySelector('.table');
    if (table && table.parentElement && table.parentElement.parentElement) {
      table.parentElement.parentElement.insertAdjacentElement('afterend', tools);
    } else productsCard.appendChild(tools);
  }

  function showPreview(src, note) {
    var box = $('imagePreviewBox'), img = $('imagePreview'), text = $('imagePreviewNote');
    if (!box || !img) return;
    img.onerror = function () { box.style.display = 'none'; };
    img.onload = function () { box.style.display = ''; };
    img.src = src;
    if (text) text.textContent = note || '';
  }

  function hidePreview() {
    var box = $('imagePreviewBox'), img = $('imagePreview');
    if (box) box.style.display = 'none';
    if (img) img.removeAttribute('src');
  }

  function ensureMediaFields() {
    var grid = document.querySelector('#editor .form-grid');
    if (!grid) return;
    if (!$('imageUrl')) {
      var urlField = document.createElement('div');
      urlField.className = 'field';
      urlField.id = 'imageUrlField';
      urlField.innerHTML = '<label for="imageUrl">رابط صورة المنتج</label><input id="imageUrl" type="url" inputmode="url" autocomplete="off" placeholder="https://…"><small class="muted">رابط HTTPS مباشر لصورة يوفّرها العميل.</small>';
      var file = $('imageFile');
      if (file && file.parentElement) file.parentElement.insertAdjacentElement('afterend', urlField);
      else grid.appendChild(urlField);
    }
    if (!$('imagePreviewBox')) {
      var preview = document.createElement('div');
      preview.className = 'field';
      preview.id = 'imagePreviewBox';
      preview.style.display = 'none';
      preview.innerHTML = '<label>معاينة الصورة</label><img id="imagePreview" alt="معاينة صورة المنتج" loading="lazy" style="display:block;width:96px;height:96px;object-fit:cover;border-radius:12px;border:1px solid rgba(21,18,15,.12)"><small id="imagePreviewNote" class="muted">—</small>';
      grid.appendChild(preview);
    }
    var file = $('imageFile');
    if (file && !file.dataset.mediaBound) {
      file.dataset.mediaBound = '1';
      file.addEventListener('change', function () {
        var f = file.files && file.files[0];
        if (!f) return;
        if ($('imageUrl')) $('imageUrl').value = '';
        showPreview(URL.createObjectURL(f), 'صورة من الجهاز');
      });
    }
    var url = $('imageUrl');
    if (url && !url.dataset.mediaBound) {
      url.dataset.mediaBound = '1';
      url.addEventListener('input', function () {
        if (file && file.files && file.files.length) return;
        var value = url.value.trim();
        if (!value) hidePreview(); else showPreview(value, 'صورة من الرابط');
      });
    }
  }

  function patchAddReset() {
    var add = $('addItem');
    if (add && !add.dataset.mediaResetBound) {
      add.dataset.mediaResetBound = '1';
      add.addEventListener('click', function () {
        setTimeout(function () { ensureMediaFields(); if ($('imageUrl')) $('imageUrl').value = ''; hidePreview(); }, 0);
      });
    }
  }

  function patchSaveForUrl() {
    var btn = $('saveItem');
    if (!btn || btn.dataset.mediaSaveBound) return;
    var original = btn.onclick;
    if (typeof original !== 'function') return;
    btn.dataset.mediaSaveBound = '1';
    btn.onclick = async function (event) {
      ensureMediaFields();
      var imageUrl = $('imageUrl') ? $('imageUrl').value.trim() : '';
      var fileSelected = $('imageFile') && $('imageFile').files && $('imageFile').files.length;
      if (imageUrl && fileSelected) { $('imageFile').value = ''; fileSelected = false; }
      if (imageUrl) {
        try { var u = new URL(imageUrl); if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('رابط الصورة يجب أن يبدأ بـ http أو https.'); }
        catch (e) { alert(e.message || 'رابط الصورة غير صالح.'); return; }
      }
      var nameAr = $('ar') ? $('ar').value.trim() : '';
      var nameEn = $('en') ? $('en').value.trim() : '';
      var tenantBefore = (typeof liveTenantId !== 'undefined') ? liveTenantId : null;
      var liveBefore = (typeof isLive !== 'undefined') ? isLive : false;
      await original.call(this, event);
      if (imageUrl && liveBefore && tenantBefore && adminClient) {
        try {
          var found = await adminClient.from('products').select('id,name_ar,name_en').eq('tenant_id', tenantBefore).eq('name_ar', nameAr).eq('name_en', nameEn).order('updated_at', { ascending: false }).limit(1).maybeSingle();
          if (found.error || !found.data || !found.data.id) { if (typeof liveUser !== 'undefined' && liveUser) authUi(liveUser, 'تم حفظ الصنف لكن تعذر ربط رابط الصورة به.'); return; }
          var updated = await adminClient.from('products').update({ image_url: imageUrl, updated_at: new Date().toISOString() }).eq('id', found.data.id).eq('tenant_id', tenantBefore);
          if (updated.error) { if (typeof liveUser !== 'undefined' && liveUser) authUi(liveUser, 'تم حفظ الصنف لكن تعذر حفظ رابط الصورة: ' + updated.error.message); return; }
          if (typeof loadLiveTenant === 'function') await loadLiveTenant();
          if (typeof liveUser !== 'undefined' && liveUser) authUi(liveUser, 'تم حفظ الصنف والصورة بنجاح.');
        } catch (err) { console.error('product image URL patch', err); }
      }
    };
  }

  function loadScript(src, id) {
    return new Promise(function (resolve, reject) {
      if (id && $(id)) return resolve();
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) { existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', reject, { once: true }); return; }
      var s = document.createElement('script'); s.src = src; s.async = false; if (id) s.id = id; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
  }

  async function boot() {
    injectImportUI(); ensureMediaFields(); patchAddReset(); patchSaveForUrl();
    try {
      if (typeof XLSX === 'undefined') await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'menuXlsx');
      await loadScript('admin-bulk-import.js', 'menuBulkImport');
    } catch (err) {
      console.error('Menu V2 feature restoration failed', err);
      var result = $('bulkImportResult'); if (result) result.textContent = 'تعذر تحميل مكوّن الاستيراد. حدّث الصفحة وحاول مرة أخرى.';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
