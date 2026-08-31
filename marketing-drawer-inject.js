(function(){function css(h){if(document.querySelector('link[href="'+h+'"]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.appendChild(l);}function js(s){if(document.querySelector('script[src="'+s+'"]'))return;var x=document.createElement('script');x.src=s;document.head.appendChild(x);}css('ux-menu-polish.css');css('ux-client-owner.css');if(!window.MenuI18n)js('i18n.js');})();
/* Injects mobile drawer markup if missing */
(function () {
  if (document.getElementById('mNavToggle')) return;
  var inner = document.querySelector('.m-nav-inner');
  if (!inner) return;
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'm-nav-toggle';
  toggle.id = 'mNavToggle';
  toggle.setAttribute('aria-label', '\u0627\u0644\u0642\u0627\u0626\u0645\u0629');
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
    '<button type="button" class="m-drawer-close" id="mDrawerClose" aria-label="Close">\u00d7</button></div>' +
    '<nav class="m-drawer-nav" aria-label="Mobile nav">' +
    '<a href="index.html">\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629</a>' +
    '<a href="#services">\u0627\u0644\u062e\u062f\u0645\u0627\u062a</a>' +
    '<a href="#portfolio">\u0646\u0645\u0627\u0630\u062c</a>' +
    '<a href="website.html">\u0645\u0648\u0642\u0639</a>' +
    '<a href="visibility.html">\u0638\u0647\u0648\u0631</a>' +
    '<a href="#portals">\u0628\u0648\u0627\u0628\u0627\u062a</a>' +
    '<a href="menu.html?tenant=maqsoud&branch=malaz">\u0645\u0642\u0635\u0648\u062f</a>' +
    '<a href="client.html">\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0639\u0645\u064a\u0644</a>' +
    '</nav>';
  document.body.appendChild(overlay);
  document.body.appendChild(aside);
  // Lang toggle in nav actions if missing
  if (actions && !document.querySelector('[data-lang-toggle]')) {
    var langBtn = document.createElement('button');
    langBtn.type = 'button';
    langBtn.className = 'lang-switch-btn m-btn m-btn-secondary m-btn-sm';
    langBtn.setAttribute('data-lang-toggle', '');
    langBtn.textContent = 'EN';
    actions.insertBefore(langBtn, actions.firstChild);
  }
})();
