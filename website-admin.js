/* Menu Studio — website project list for platform operators */
(function () {
  function client() {
    if (typeof adminClient !== 'undefined' && adminClient) return adminClient;
    return null;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var STATUS_AR = {
    draft: 'مسودة',
    submitted: 'مستلم',
    info_required: 'يحتاج معلومات',
    in_production: 'قيد الإنتاج',
    review: 'مراجعة',
    revision: 'تعديلات',
    ready: 'جاهز',
    published: 'منشور'
  };

  async function loadProjects() {
    var list = document.getElementById('websiteProjectsList');
    var hint = document.getElementById('websiteProjectsHint');
    var c = client();
    if (!list || !c) return;
    try {
      var op = await c.rpc('is_platform_operator');
      if (!(op && op.data === true)) {
        if (hint) hint.textContent = 'هذه القائمة تظهر لمشغّل المنصة فقط. يمكنك فتح صفحة الخدمة لأي عميل.';
        return;
      }
      if (hint) hint.textContent = 'طلبات المواقع الواردة (آخر 100):';
      var r = await c.rpc('list_website_projects');
      if (r.error) {
        list.innerHTML = '<p class="muted">تعذر التحميل: ' + esc(r.error.message) + '</p>';
        return;
      }
      var rows = r.data || [];
      if (!rows.length) {
        list.innerHTML = '<p class="muted">لا توجد طلبات بعد.</p>';
        return;
      }
      list.innerHTML =
        '<div style="overflow:auto"><table class="table"><thead><tr>' +
        '<th>النشاط</th><th>النوع</th><th>المدينة</th><th>الحالة</th><th>التاريخ</th>' +
        '</tr></thead><tbody>' +
        rows.map(function (row) {
          var st = STATUS_AR[row.status] || row.status;
          var d = row.created_at ? String(row.created_at).slice(0, 10) : '—';
          return '<tr>' +
            '<td><strong>' + esc(row.name_ar) + '</strong>' +
            (row.phone || row.whatsapp ? '<br><span class="muted" dir="ltr">' + esc(row.whatsapp || row.phone) + '</span>' : '') +
            '</td>' +
            '<td>' + esc(row.business_type) + '</td>' +
            '<td>' + esc(row.city || '—') + '</td>' +
            '<td>' + esc(st) + '</td>' +
            '<td>' + esc(d) + '</td></tr>';
        }).join('') +
        '</tbody></table></div>';
    } catch (e) {
      if (list) list.innerHTML = '<p class="muted">خطأ في التحميل.</p>';
    }
  }

  function watchPanel() {
    document.querySelectorAll('.nav-item[data-panel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.getAttribute('data-panel') === 'website') {
          setTimeout(loadProjects, 80);
        }
      });
    });
  }

  var tries = 0;
  var t = setInterval(function () {
    tries++;
    if (client() || tries > 40) {
      clearInterval(t);
      watchPanel();
      if (client()) loadProjects();
    }
  }, 400);
})();
