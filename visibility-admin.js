/* Menu Studio — visibility audits list for platform operators */
(function () {
  function client() {
    if (typeof adminClient !== "undefined" && adminClient) return adminClient;
    return null;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """);
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

  function statusClass(st) {
    return "status-pill " + (st || "draft");
  }

  async function loadAudits() {
    var list = document.getElementById("visibilityAuditsList");
    var hint = document.getElementById("visibilityAuditsHint");
    var countEl = document.getElementById("studioVisCount");
    var c = client();
    if (!list) return;

    if (!c) {
      list.innerHTML =
        '<div class="studio-empty"><div class="empty-art">◌</div><strong>بانتظار الاتصال</strong><span>سجّل الدخول لعرض تقييمات الظهور.</span></div>';
      return;
    }

    try {
      var op = await c.rpc("is_platform_operator");
      if (!(op && op.data === true)) {
        if (hint) hint.textContent = "هذه القائمة تظهر لمشغّل المنصة فقط.";
        list.innerHTML =
          '<div class="studio-empty"><div class="empty-art">🔒</div><strong>للمشغّل فقط</strong><span>افتح صفحة الخدمة لبدء تقييم ظهور محلي.</span></div>';
        return;
      }
      if (hint) hint.textContent = "تقييمات الظهور المحلي (آخر 100):";

      var r = await c.rpc("list_visibility_audits");
      if (r.error) {
        list.innerHTML =
          '<div class="studio-empty"><strong>تعذر التحميل</strong><span>' +
          esc(r.error.message) +
          "</span></div>";
        return;
      }

      var rows = r.data || [];
      if (countEl) countEl.textContent = String(rows.length);

      if (!rows.length) {
        list.innerHTML =
          '<div class="studio-empty"><div class="empty-art">📍</div><strong>لا توجد تقييمات ظهور حاليًا</strong><span>ستظهر التقييمات هنا فور إكمال العملاء لنموذج الظهور المحلي.</span></div>';
        return;
      }

      list.innerHTML =
        '<div class="studio-list">' +
        rows
          .map(function (row) {
            var st = STATUS_AR[row.status] || row.status;
            var d = row.created_at ? String(row.created_at).slice(0, 10) : "—";
            var score =
              row.score_total != null ? row.score_total + "/100" : "—";
            return (
              '<div class="studio-card">' +
              '<div class="sc-main">' +
              "<strong>" +
              esc(row.business_name || "—") +
              "</strong>" +
              '<div class="sc-meta">' +
              (row.business_category
                ? esc(row.business_category) + " · "
                : "") +
              esc(row.city || "—") +
              "</div></div>" +
              '<div class="sc-side">' +
              '<span class="sc-score">' +
              esc(score) +
              "</span>" +
              '<span class="' +
              statusClass(row.status) +
              '">' +
              esc(st) +
              "</span>" +
              '<span class="sc-meta">' +
              esc(d) +
              "</span>" +
              "</div></div>"
            );
          })
          .join("") +
        "</div>";
    } catch (e) {
      list.innerHTML =
        '<div class="studio-empty"><strong>خطأ في التحميل</strong><span>أعد المحاولة بعد لحظات.</span></div>';
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

  window.MenuStudioVisibility = { reload: loadAudits };
})();
