/**
 * Public menu hardening layer — analytics throttle, demo badge, WhatsApp product deep-link,
 * image lazy defaults, modal a11y helpers. Safe additive; does not replace app.js.
 */
(function () {
  'use strict';

  // --- Analytics throttle (client-side only; RPC remains the real guard) ---
  const recentEvents = new Map();
  const THROTTLE_MS = 8000;

  function shouldSendEvent(key) {
    const now = Date.now();
    const last = recentEvents.get(key) || 0;
    if (now - last < THROTTLE_MS) return false;
    recentEvents.set(key, now);
    // prune
    if (recentEvents.size > 80) {
      for (const [k, t] of recentEvents) {
        if (now - t > THROTTLE_MS * 3) recentEvents.delete(k);
      }
    }
    return true;
  }

  // Patch trackEvent if defined later, or wrap rpc calls via proxy on publicClient when available
  const origTrackDescriptor = Object.getOwnPropertyDescriptor(window, 'trackEvent');
  Object.defineProperty(window, 'trackEvent', {
    configurable: true,
    enumerable: true,
    get() {
      return this.__menuTrackEvent;
    },
    set(fn) {
      if (typeof fn !== 'function') {
        this.__menuTrackEvent = fn;
        return;
      }
      this.__menuTrackEvent = async function throttledTrack(type, productId) {
        const key = String(type) + ':' + String(productId || 'none');
        if (!shouldSendEvent(key)) return;
        return fn.apply(this, arguments);
      };
    }
  });

  // If trackEvent already assigned before this script, re-wrap after short delay
  setTimeout(function () {
    if (typeof window.__menuTrackEvent === 'function') return;
    // app.js may define trackEvent as const in module-like scope; try global
    // Fallback: intercept supabase rpc for record_public_menu_event
    try {
      if (window.supabase && window.supabase.createClient) {
        const orig = window.supabase.createClient;
        window.supabase.createClient = function () {
          const client = orig.apply(this, arguments);
          if (client && client.rpc && !client.__menuEventThrottle) {
            client.__menuEventThrottle = true;
            const origRpc = client.rpc.bind(client);
            client.rpc = function (fn, args) {
              if (fn === 'record_public_menu_event') {
                const key =
                  String((args && args.p_event_type) || '') +
                  ':' +
                  String((args && args.p_product_id) || 'none') +
                  ':' +
                  String((args && args.p_tenant_slug) || '');
                if (!shouldSendEvent(key)) {
                  return Promise.resolve({ data: null, error: null });
                }
              }
              return origRpc(fn, args);
            };
          }
          return client;
        };
      }
    } catch (_) {}
  }, 0);

  // --- Demo / Live visual badge ---
  function ensureModeBadge() {
    const label = document.getElementById('dataModeLabel');
    if (!label) return;
    const text = (label.textContent || '').toLowerCase();
    if (text.includes('demo') || text.includes('عرض') || text.includes('محلي')) {
      label.classList.add('demo-mode-badge');
      label.setAttribute('title', 'وضع عرض تجريبي — البيانات ليست حساب عميل مدفوع');
      document.body.classList.add('is-demo-public');
    } else if (text.includes('live') || text.includes('مباشر') || text.includes('متصل')) {
      label.classList.add('live-mode-badge');
      document.body.classList.remove('is-demo-public');
    }
  }

  // --- Image lazy + dimensions hint ---
  function enhanceImages() {
    document.querySelectorAll('.menu-item img, .featured-card img, .modal-image img, .brand-logo').forEach(function (img) {
      if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
      img.addEventListener(
        'error',
        function () {
          img.classList.add('img-broken');
          img.removeAttribute('src');
        },
        { once: true }
      );
    });
  }

  // --- Modal a11y: focus trap light + Escape already likely present ---
  function enhanceModal() {
    const modal = document.getElementById('itemModal');
    if (!modal) return;
    if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
    if (!modal.hasAttribute('aria-modal')) modal.setAttribute('aria-modal', 'true');
    const closeBtns = modal.querySelectorAll('[data-close], .close-btn');
    closeBtns.forEach(function (btn) {
      if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'إغلاق');
    });
  }

  // --- Product WhatsApp deep message ---
  function wireProductWhatsApp() {
    const modalWa = document.getElementById('modalWhatsApp');
    if (!modalWa) return;
    const observer = new MutationObserver(function () {
      try {
        const title = (document.getElementById('modalTitle') || {}).textContent || '';
        const price = (document.getElementById('modalPrice') || {}).textContent || '';
        const brand = (document.getElementById('brandName') || {}).textContent || '';
        const branch = (document.getElementById('branchName') || {}).textContent || '';
        if (!title.trim()) return;
        const href = modalWa.getAttribute('href') || '';
        if (!href.includes('wa.me') && !href.includes('whatsapp')) return;
        const msg =
          'مرحباً، أرغب بالاستفسار عن:\n' +
          '• المطعم: ' +
          brand.trim() +
          '\n' +
          '• الفرع: ' +
          branch.trim() +
          '\n' +
          '• الصنف: ' +
          title.trim() +
          '\n' +
          '• السعر: ' +
          price.trim() +
          '\n' +
          'شكراً لكم.';
        const base = href.split('?')[0];
        const phoneMatch = base.match(/wa\.me\/(\d+)/);
        if (!phoneMatch) return;
        modalWa.setAttribute(
          'href',
          'https://wa.me/' + phoneMatch[1] + '?text=' + encodeURIComponent(msg)
        );
        modalWa.hidden = false;
      } catch (_) {}
    });
    observer.observe(document.getElementById('itemModal') || document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // --- Skeleton: mark loading class until dataModeLabel stabilizes ---
  function clearSkeletonWhenReady() {
    const shell = document.querySelector('.site-shell');
    if (!shell) return;
    const check = function () {
      const label = document.getElementById('dataModeLabel');
      if (label && label.textContent && label.textContent !== 'متصل') {
        shell.classList.remove('is-loading');
        ensureModeBadge();
      }
    };
    check();
    setTimeout(check, 400);
    setTimeout(check, 1200);
    setTimeout(check, 3000);
  }

  // --- Available-only quick filter chip ---
  function addAvailableFilter() {
    const nav = document.getElementById('categoryNav');
    if (!nav || nav.querySelector('[data-filter-available]')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat';
    btn.setAttribute('data-filter-available', '1');
    btn.textContent = 'المتاح الآن';
    btn.addEventListener('click', function () {
      const active = btn.classList.toggle('active');
      document.querySelectorAll('.menu-item').forEach(function (el) {
        const unavailable = el.classList.contains('unavailable') || el.querySelector('.unavailable');
        if (active && unavailable) el.style.display = 'none';
        else el.style.display = '';
      });
    });
    nav.appendChild(btn);
  }

  function boot() {
    enhanceImages();
    enhanceModal();
    wireProductWhatsApp();
    clearSkeletonWhenReady();
    ensureModeBadge();
    setTimeout(addAvailableFilter, 800);
    const mo = new MutationObserver(function () {
      enhanceImages();
      ensureModeBadge();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
