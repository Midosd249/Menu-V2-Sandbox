/* Menu Studio — mobile nav + panel titles + light dashboard wiring */
(function () {
  var PANEL_TITLES = {
    dashboard: ["MENU STUDIO", "نظرة عامة"],
    analytics: ["ANALYTICS", "أداء المنيو"],
    products: ["MENU ITEMS", "الأصناف والتوفر"],
    branding: ["BRAND", "هوية النشاط"],
    branches: ["BRANCH & QR", "الفروع ورموز QR"],
    health: ["MENU HEALTH", "صحة المنيو"],
    website: ["WEBSITES", "مشاريع المواقع"],
    visibility: ["LOCAL VISIBILITY", "الظهور المحلي"],
    onboarding: ["ONBOARDING", "البدء السريع"]
  };

  function $(id) {
    return document.getElementById(id);
  }

  function closeNav() {
    var shell = document.querySelector(".admin-shell");
    if (shell) shell.classList.remove("nav-open");
    document.body.classList.remove("admin-drawer-open");
  }

  function openNav() {
    var shell = document.querySelector(".admin-shell");
    if (shell) shell.classList.add("nav-open");
    document.body.classList.add("admin-drawer-open");
  }

  function setTitle(panel) {
    var t = PANEL_TITLES[panel] || PANEL_TITLES.dashboard;
    var eye = $("topEyebrow");
    var title = $("topTitle");
    if (eye) eye.textContent = t[0];
    if (title) title.textContent = t[1];
  }

  function bindNav() {
    var btn = $("studioMenuBtn");
    var backdrop = $("studioBackdrop");
    if (btn) {
      btn.addEventListener("click", function () {
        var shell = document.querySelector(".admin-shell");
        if (shell && shell.classList.contains("nav-open")) closeNav();
        else openNav();
      });
    }
    if (backdrop) backdrop.addEventListener("click", closeNav);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });

    document.querySelectorAll(".nav-item[data-panel]").forEach(function (item) {
      item.addEventListener("click", function () {
        setTitle(item.getAttribute("data-panel") || "dashboard");
        closeNav();
      });
    });

    document.querySelectorAll("[data-jump]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var panel = el.getAttribute("data-jump");
        var nav = document.querySelector(
          '.nav-item[data-panel="' + panel + '"]'
        );
        if (nav) nav.click();
      });
    });
  }

  function boot() {
    bindNav();
    setTitle("dashboard");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
