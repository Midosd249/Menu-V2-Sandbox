/**
 * Public menu presentation hardening: accessible modal helpers, safe image defaults,
 * visible live/demo status, and an available-now filter. Analytics protection is
 * enforced by the database RPC, not by monkey-patching browser clients.
 */
(function () {
  'use strict';

  function ensureModeBadge() {
    var label = document.getElementById('dataModeLabel');
    if (!label) return;
    var text = (label.textContent || '').toLowerCase();
    label.classList.remove('demo-mode-badge', 'live-mode-badge');
    if (text.includes('demo') || text.includes('عرض') || text.includes('محلي')) {
      label.classList.add('demo-mode-badge');
      label.setAttribute('title', 'وضع عرض تجريبي — البيانات ليست حساب عميل مدفوع');
      document.body.classList.add('is-demo-public');
    } else if (text.includes('live') || text.includes('مباشر') || text.includes('متصل')) {
      label.classList.add('live-mode-badge');
      document.body.classList.remove('is-demo-public');
    } else {
      document.body.classList.remove('is-demo-public');
    }
  }

  function enhanceImages() {
    document.querySelectorAll('.menu-item img, .featured-card img, .modal-image img, .brand-logo').forEach(function (image) {
      if (!image.getAttribute('loading')) image.setAttribute('loading', 'lazy');
      if (!image.getAttribute('decoding')) image.setAttribute('decoding', 'async');
      image.addEventListener('error', function () {
        image.classList.add('img-broken');
        image.removeAttribute('src');
      }, { once: true });
    });
  }

  function enhanceModal() {
    var modal = document.getElementById('itemModal');
    if (!modal) return;
    if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
    if (!modal.hasAttribute('aria-modal')) modal.setAttribute('aria-modal', 'true');
    modal.querySelectorAll('[data-close], .close-btn').forEach(function (button) {
      if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', 'إغلاق');
    });
  }

  function wireProductWhatsApp() {
    var modalWhatsApp = document.getElementById('modalWhatsApp');
    var modal = document.getElementById('itemModal');
    if (!modalWhatsApp || !modal) return;
    var observer = new MutationObserver(function () {
      var title = (document.getElementById('modalTitle') || {}).textContent || '';
      var price = (document.getElementById('modalPrice') || {}).textContent || '';
      var brand = (document.getElementById('brandName') || {}).textContent || '';
      var branch = (document.getElementById('branchName') || {}).textContent || '';
      var href = modalWhatsApp.getAttribute('href') || '';
      if (!title.trim() || !/https:\/\/wa\.me\/\d+/i.test(href)) return;

      var phone = href.split('?')[0].match(/wa\.me\/(\d+)/i);
      if (!phone) return;
      var message = [
        'مرحباً، أرغب بالاستفسار عن:',
        '• المطعم: ' + brand.trim(),
        '• الفرع: ' + branch.trim(),
        '• الصنف: ' + title.trim(),
        '• السعر: ' + price.trim(),
        'شكراً لكم.'
      ].join('\n');
      modalWhatsApp.setAttribute('href', 'https://wa.me/' + phone[1] + '?text=' + encodeURIComponent(message));
    });
    observer.observe(modal, { childList: true, subtree: true, characterData: true });
  }

  function clearSkeletonWhenReady() {
    var shell = document.querySelector('.site-shell');
    if (!shell) return;
    function check() {
      var label = document.getElementById('dataModeLabel');
      if (label && label.textContent && label.textContent !== 'متصل') {
        shell.classList.remove('is-loading');
        ensureModeBadge();
      }
    }
    check();
    window.setTimeout(check, 400);
    window.setTimeout(check, 1200);
    window.setTimeout(check, 3000);
  }

  function addAvailableFilter() {
    var navigation = document.getElementById('categoryNav');
    if (!navigation || navigation.querySelector('[data-filter-available]')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'cat';
    button.setAttribute('data-filter-available', '1');
    button.textContent = 'المتاح الآن';
    button.addEventListener('click', function () {
      var active = button.classList.toggle('active');
      document.querySelectorAll('.menu-item').forEach(function (element) {
        var unavailable = element.classList.contains('unavailable') || Boolean(element.querySelector('.unavailable'));
        element.style.display = active && unavailable ? 'none' : '';
      });
    });
    navigation.appendChild(button);
  }

  function boot() {
    enhanceImages();
    enhanceModal();
    wireProductWhatsApp();
    clearSkeletonWhenReady();
    ensureModeBadge();
    window.setTimeout(addAvailableFilter, 800);
    var observer = new MutationObserver(function () {
      enhanceImages();
      ensureModeBadge();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
