/* Menu V2 \u2014 mobile drawer hardening (client + owner) */
(function () {
  function harden(opts) {
    var sidebar = document.querySelector(opts.sidebar);
    var overlay = document.querySelector(opts.overlay);
    var toggle = document.getElementById(opts.toggleId) || document.querySelector(opts.toggleSel);
    if (!sidebar) return;
    function openDrawer() {
      sidebar.classList.add('open');
      overlay && overlay.classList.add('active');
      document.body.classList.add(opts.bodyClass);
      toggle && toggle.setAttribute('aria-expanded', 'true');
    }
    function closeDrawer() {
      sidebar.classList.remove('open');
      overlay && overlay.classList.remove('active');
      document.body.classList.remove(opts.bodyClass);
      toggle && toggle.setAttribute('aria-expanded', 'false');
    }
    function toggleDrawer() {
      sidebar.classList.contains('open') ? closeDrawer() : openDrawer();
    }
    if (toggle && !toggle.__drawerBound) {
      toggle.__drawerBound = true;
      toggle.addEventListener('click', function (e) { e.stopPropagation(); toggleDrawer(); });
    }
    if (overlay && !overlay.__drawerBound) {
      overlay.__drawerBound = true;
      overlay.addEventListener('click', closeDrawer);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) closeDrawer();
    });
    sidebar.querySelectorAll(opts.navItem).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.matchMedia(opts.mq).matches) closeDrawer();
      });
    });
  }
  function boot() {
    harden({
      sidebar: '.client-sidebar', overlay: '.client-sidebar-overlay',
      toggleId: 'mobileMenuToggle', bodyClass: 'client-drawer-open',
      navItem: '.client-nav-item', mq: '(max-width: 900px)'
    });
    harden({
      sidebar: '.owner-sidebar', overlay: '.owner-sidebar-overlay',
      toggleId: 'ownerMobileMenuBtn', toggleSel: '.owner-mobile-header .btn-owner-icon',
      bodyClass: 'owner-drawer-open', navItem: '.owner-nav-item', mq: '(max-width: 960px)'
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
