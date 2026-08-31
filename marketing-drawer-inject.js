/* Injects mobile drawer markup if missing (keeps index.html recoverable without large HTML rewrites). */
(function () {
  if (document.getElementById('mNavToggle')) return;
  var inner = document.querySelector('.m-nav-inner');
  if (!inner) return;
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'm-nav-toggle';
  toggle.id = 'mNavToggle';
  toggle.setAttribute('aria-label', 'القائمة');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'mMobileDrawer');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  var actions = inner.querySelector('.m-nav-actions');
  if (actions) inner.insertBefore(toggle, actions);
  else inner.appendChild(toggle);

  if (document.getElementById('mMobileDrawer')) return;
  var overlay = document.createElement('div');
  overlay.className = 'm-drawer-overlay';
  overlay.id = 'mDrawerOverlay';
  overlay.hidden = true;
  var aside = document.createElement('aside');
  aside.className = 'm-mobile-drawer';
  aside.id = 'mMobileDrawer';
  aside.setAttribute('aria-hidden', 'true');
  aside.innerHTML =
    '<div class="m-drawer-head"><strong>MENU</strong>' +
    '<button type="button" class="m-drawer-close" id="mDrawerClose" aria-label="إغلاق">×</button></div>' +
    '<nav class="m-drawer-nav" aria-label="تنقل الجوال">' +
    '<a href="index.html">الرئيسية</a>' +
    '<a href="#services">الخدمات والحلول</a>' +
    '<a href="#portfolio">نماذج حية</a>' +
    '<a href="website.html">إنشاء موقع</a>' +
    '<a href="visibility.html">الظهور المحلي</a>' +
    '<a href="#portals">البوابات</a>' +
    '<a href="menu.html?tenant=maqsoud&branch=malaz">منيو مقصود (حي)</a>' +
    '<a href="client.html">بوابة العميل</a>' +
    '</nav>';
  document.body.appendChild(overlay);
  document.body.appendChild(aside);
})();
