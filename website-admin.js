/* Menu Studio — website project list for platform operators */
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
    in_production: "قيد الإنتاج",
    review: "مراجعة",
    revision: "تعديلات",
    ready: "جاهز",
    published: "منشور"
  };

  function statusClass(st) {
    return "status-pill " + (st || "draft");
  }

  async function loadProjects() {
    var list = document.getElementById("websiteProjectsList");
    var hint = document.getElementById("websiteProjectsHint");
    var countEl = document.getElementById("studioWebCount");
    var c = client();
    if (!list) return;

    if (!c) {
      list.innerHTML =
        '<div class="studio-empty"><div class="empty-art">◌</div><strong>بانتظار الاتصال</strong><span>سجّل الدخول لعرض طلبات المواقع.</span></div>';
      return;
    }

    try {
      var op = await c.rpc("is_platform_operator");
      if (!(op && op.data === true)) {
        if (hint) {
          hint.textContent =
            "هذه القائمة تظهر لمشغّل المنصة فقط. يمكنك فتح صفحة الخدمة لأي عميل.";
        }
        list.innerHTML =
          '<div class="studio-empty"><div class="empty-art">🔒</div><strong>للمشغّل فقط</strong><span>افتح صفحة الخدمة لإنشاء موجز موقع جديد.</span></div>';
        return;
      }
      if (hint) hint.textContent = "طلبات المواقع الواردة (آخر 100):";

      var r = await c.rpc("list_website_projects");
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
          '<div class="studio-empty"><div class="empty-art">🌐</div><strong>لا توجد مشاريع مواقع حاليًا</strong><span>ستظهر الطلبات هنا فور إرسال العملاء لموجز الموقع.</span></div>';
        return;
      }

      list.innerHTML =
        '<div class="studio-list">' +
        rows
          .map(function (row) {
            var st = STATUS_AR[row.status] || row.status;
            var d = row.created_at ? String(row.created_at).slice(0, 10) : "\u2014";
            var contact = row.whatsapp || row.phone || "";
            var mkt = "";
            if (window.MENU_MARKETS && row.country_code) {
              mkt = MENU_MARKETS.label(row.country_code);
            } else if (row.country_code) {
              mkt = row.country_code;
            }
            return (
              '<div class="studio-card">' +
              '<div class="sc-main">' +
              "<strong>" +
              esc(row.name_ar || "\u2014") +
              "</strong>" +
              '<div class="sc-meta">' +
              esc(row.business_type || "\u2014") +
              (mkt ? " \u00b7 " + esc(mkt) : "") +
              (row.city ? " \u00b7 " + esc(row.city) : "") +
              (contact
                ? '<br><span dir="ltr">' + esc(contact) + "</span>"
                : "") +
              "</div></div>" +
              '<div class="sc-side">' +
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
        if (btn.getAttribute("data-panel") === "website") {
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

  window.MenuStudioWebsite = { reload: loadProjects };
})();
