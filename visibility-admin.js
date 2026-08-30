/* Menu Studio — visibility audits list for platform operators */
(function () {
  function client() {
    if (typeof adminClient !== "undefined" && adminClient) return adminClient;
    return null;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var STATUS_AR = {
    draft: "مسودة",
    submitted: "مستلم",
    info_required: "يحتاج معلومات",
    in_progress: "قيد المعالجة",
    review: "مراجعة",
    ready: "جاهز",
    completed: "مكتمل"
  };

  async function loadAudits() {
    var list = document.getElementById("visibilityAuditsList");
    var hint = document.getElementById("visibilityAuditsHint");
    var c = client();
    if (!list || !c) return;
    try {
      var op = await c.rpc("is_platform_operator");
      if (!(op && op.data === true)) {
        if (hint) hint.textContent = "هذه القائمة تظهر لمشغّل المنصة فقط.";
        return;
      }
      if (hint) hint.textContent = "تقييمات الظهور المحلي (آخر 100):";
      var r = await c.rpc("list_visibility_audits");
      if (r.error) {
        list.innerHTML = '<p class="muted">تعذر التحميل: ' + esc(r.error.message) + "</p>";
        return;
      }
      var rows = r.data || [];
      if (!rows.length) {
        list.innerHTML = '<p class="muted">لا توجد تقييمات بعد.</p>';
        return;
      }
      list.innerHTML =
        '<div style="overflow:auto"><table class="table"><thead><tr>' +
        "<th>النشاط</th><th>المدينة</th><th>الدرجة</th><th>الحالة</th><th>التاريخ</th>" +
        "</tr></thead><tbody>" +
        rows
          .map(function (row) {
            var st = STATUS_AR[row.status] || row.status;
            var d = row.created_at ? String(row.created_at).slice(0, 10) : "\u2014";
            var score = row.score_total != null ? row.score_total + "/100" : "\u2014";
            return (
              "<tr>" +
              "<td><strong>" +
              esc(row.business_name) +
              "</strong>" +
              (row.business_category
                ? '<br><span class="muted">' + esc(row.business_category) + "</span>"
                : "") +
              "</td>" +
              "<td>" +
              esc(row.city || "\u2014") +
              "</td>" +
              "<td>" +
              esc(score) +
              "</td>" +
              "<td>" +
              esc(st) +
              "</td>" +
              "<td>" +
              esc(d) +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>";
    } catch (e) {
      if (list) list.innerHTML = '<p class="muted">خطأ في التحميل.</p>';
    }
  }

  function watchPanel() {
    document.querySelectorAll(".nav-item[data-panel]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.getAttribute("data-panel") === "visibility") {
          setTimeout(loadAudits, 80);
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
      if (client()) loadAudits();
    }
  }, 400);
})();
