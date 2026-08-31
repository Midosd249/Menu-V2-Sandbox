/**
 * Menu V2 — UI language (ar primary, en alternate).
 * localStorage: menuLang
 * Loads phrase map from i18n-phrases.json for complete static UI EN coverage.
 */
(function (global) {
  var STORAGE_KEY = 'menuLang';
  var dict = {
    'nav.home': { ar: '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629', en: 'Home' },
    'nav.client': { ar: '\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0639\u0645\u064a\u0644', en: 'Client portal' },
    'nav.owner': { ar: '\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0645\u0634\u063a\u0651\u0644', en: 'Owner portal' },
    'action.login': { ar: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644', en: 'Sign in' },
    'action.logout': { ar: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c', en: 'Sign out' },
    'action.save': { ar: '\u062d\u0641\u0638', en: 'Save' },
    'action.cancel': { ar: '\u0625\u0644\u063a\u0627\u0621', en: 'Cancel' },
    'action.menu': { ar: '\u0627\u0644\u0642\u0627\u0626\u0645\u0629', en: 'Menu' },
    'status.loading': { ar: '\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644\u2026', en: 'Loading\u2026' }
  };
  var PHRASES = window.__MENU_I18N_PHRASES || {};
  var phraseKeys = Object.keys(PHRASES);

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar';
  }
  function setLang(lang) {
    lang = lang === 'en' ? 'en' : 'ar';
    localStorage.setItem(STORAGE_KEY, lang);
    apply(lang);
    try { global.dispatchEvent(new CustomEvent('menu:lang', { detail: { lang: lang } })); } catch (e) {}
    return lang;
  }
  function t(key, lang) {
    lang = lang || getLang();
    var entry = dict[key];
    if (!entry) return key;
    return entry[lang] || entry.ar || key;
  }
  function translatePhrase(text, lang) {
    if (!text) return text;
    var trimmed = text.trim();
    if (lang === 'en') {
      if (PHRASES[trimmed]) return text.replace(trimmed, PHRASES[trimmed]);
      return text;
    }
    for (var i = 0; i < phraseKeys.length; i++) {
      var ar = phraseKeys[i];
      if (trimmed === PHRASES[ar]) return text.replace(trimmed, ar);
    }
    return text;
  }
  function walkTranslate(root, lang) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!node.parentElement) return;
      var tag = node.parentElement.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return;
      if (node.parentElement.closest && node.parentElement.closest('[data-no-i18n],#menuList,#featured,#productsTableBody,#tenantsTableBody,#tenantsTableBodyFull,#brandName,#modalTitle,#modalDescription,#itemCount,#branchName,#brandTagline')) return;
      var raw = node.nodeValue;
      if (!raw || !raw.trim()) return;
      if (/^[\d\s.,$\u20ac\u00a3\u0631\.\u0633SAR]*$/.test(raw.trim())) return;
      var next = translatePhrase(raw, lang);
      if (next !== raw) node.nodeValue = next;
    });
    root.querySelectorAll && root.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(function (el) {
      if (el.closest('[data-no-i18n]')) return;
      var p = el.getAttribute('placeholder');
      if (!p) return;
      var np = translatePhrase(p, lang);
      if (np !== p) el.setAttribute('placeholder', np);
    });
  }
  function apply(lang) {
    lang = lang || getLang();
    var ar = lang === 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    if (document.body) document.body.setAttribute('data-lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n'), lang);
      if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'), lang));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'), lang));
    });
    walkTranslate(document.body, lang);
    document.querySelectorAll('[data-lang-toggle], #langBtn').forEach(function (btn) {
      btn.textContent = ar ? 'EN' : '\u0627\u0644\u0639\u0631\u0628\u064a\u0629';
      btn.setAttribute('aria-label', ar ? 'Switch to English' : '\u0627\u0644\u062a\u0628\u062f\u064a\u0644 \u0625\u0644\u0649 \u0627\u0644\u0639\u0631\u0628\u064a\u0629');
    });
  }
  function toggle() { return setLang(getLang() === 'ar' ? 'en' : 'ar'); }
  function bindToggles(root) {
    root = root || document;
    root.querySelectorAll('[data-lang-toggle], #langBtn').forEach(function (btn) {
      if (btn.__i18nBound) return;
      btn.__i18nBound = true;
      btn.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    });
  }
  function extend(extra) {
    if (!extra) return;
    Object.keys(extra).forEach(function (k) { dict[k] = extra[k]; });
  }
  function extendPhrases(extra) {
    if (!extra) return;
    Object.keys(extra).forEach(function (k) { PHRASES[k] = extra[k]; });
    phraseKeys = Object.keys(PHRASES);
  }
  function loadPhrases(cb) {
    if (Object.keys(PHRASES).length) { cb && cb(); return; }
    fetch('i18n-phrases.json').then(function (r) { return r.json(); }).then(function (p) {
      Object.keys(p).forEach(function (k) { PHRASES[k] = p[k]; });
      phraseKeys = Object.keys(PHRASES);
      cb && cb();
    }).catch(function () { cb && cb(); });
  }
  global.MenuI18n = { getLang: getLang, setLang: setLang, toggle: toggle, t: t, apply: apply, bindToggles: bindToggles, extend: extend, extendPhrases: extendPhrases, dict: dict };
  function boot() {
    loadPhrases(function () { apply(getLang()); bindToggles(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
