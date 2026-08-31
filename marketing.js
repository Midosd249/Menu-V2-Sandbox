/* Menu Marketing & Commercial Controller */
(function () {
  'use strict';

  var submitInFlight = false;

  function getClient() {
    return typeof window.getMenuSupabaseClient === 'function' ? window.getMenuSupabaseClient() : null;
  }

  function normalizePhone(value) {
    return String(value || '').trim().replace(/[\s().-]/g, '');
  }

  function validPhone(value) {
    return /^\+?[0-9]{7,15}$/.test(normalizePhone(value));
  }

  function validEmail(value) {
    return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  }

  function setStatus(element, message, variant) {
    if (!element) return;
    element.className = 'm-form-status' + (variant ? ' ' + variant : '');
    element.style.display = message ? '' : 'none';
    element.textContent = message || '';
  }

  function notifyOwner(kind, id) {
    if (!id) return;
    fetch('/api/notify-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: kind, id: String(id) }),
      keepalive: true
    }).catch(function (error) {
      console.warn('Owner notification could not be dispatched:', error);
    });
  }

  async function handleServiceRequest(event) {
    if (event) event.preventDefault();
    if (submitInFlight) return;

    var form = document.getElementById('serviceRequestForm');
    var status = document.getElementById('formStatus');
    var button = document.getElementById('submitRequestBtn');
    if (!form) return;

    var payload = {
      business_name: (document.getElementById('reqBusinessName').value || '').trim(),
      business_type: document.getElementById('reqBusinessType').value || null,
      service_type: document.getElementById('reqServiceType').value || 'menu',
      country: document.getElementById('reqCountry').value || 'SA',
      city: (document.getElementById('reqCity').value || '').trim() || null,
      contact_name: (document.getElementById('reqContactName').value || '').trim(),
      contact_phone: normalizePhone(document.getElementById('reqContactPhone').value),
      contact_email: (document.getElementById('reqContactEmail').value || '').trim() || null,
      details: (document.getElementById('reqDetails').value || '').trim() || null
    };

    if (!payload.business_name || !payload.contact_name || !payload.contact_phone) {
      setStatus(status, 'يرجى إكمال الحقول الإلزامية: اسم النشاط واسم المسؤول ورقم الهاتف.', 'error');
      return;
    }
    if (!validPhone(payload.contact_phone)) {
      setStatus(status, 'أدخل رقم هاتف صالحًا يتكون من 7 إلى 15 رقمًا.', 'error');
      return;
    }
    if (!validEmail(payload.contact_email)) {
      setStatus(status, 'أدخل بريدًا إلكترونيًا صالحًا أو اترك الحقل فارغًا.', 'error');
      return;
    }

    var client = getClient();
    if (!client) {
      setStatus(status, 'تعذر الاتصال بالخدمة حاليًا. لم يتم إرسال الطلب؛ حاول لاحقًا.', 'error');
      return;
    }

    submitInFlight = true;
    if (button) {
      button.disabled = true;
      button.textContent = 'جارٍ إرسال الطلب…';
    }
    setStatus(status, 'جارٍ حفظ الطلب…');

    try {
      var result = await client.rpc('submit_service_request', { p_payload: payload });
      if (result.error) throw result.error;
      if (!result.data || !result.data.ok || !result.data.id) throw new Error('لم تؤكد الخدمة حفظ الطلب.');

      notifyOwner('service', result.data.id);
      setStatus(status, result.data.message || 'تم استلام طلبك بنجاح. سيتواصل معك فريق Menu في أقرب وقت.', 'success');
      form.reset();
    } catch (error) {
      console.error('Service request submission failed:', error);
      setStatus(status, 'تعذر إرسال الطلب ولم يتم تأكيد حفظه: ' + (error.message || 'حاول مرة أخرى.'), 'error');
    } finally {
      submitInFlight = false;
      if (button) {
        button.disabled = false;
        button.textContent = 'إرسال طلب الخدمة';
      }
    }
  }

  function initMobileNav() {
    var toggle = document.getElementById('mNavToggle');
    var drawer = document.getElementById('mMobileDrawer');
    var overlay = document.getElementById('mDrawerOverlay');
    var closeButton = document.getElementById('mDrawerClose');
    if (!toggle || !drawer || !overlay) return;

    function openDrawer() {
      drawer.hidden = false;
      overlay.hidden = false;
      requestAnimationFrame(function () {
        drawer.classList.add('is-open');
        overlay.classList.add('is-open');
      });
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('m-drawer-open');
      if (closeButton) closeButton.focus();
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('m-drawer-open');
      window.setTimeout(function () {
        if (!drawer.classList.contains('is-open')) {
          drawer.hidden = true;
          overlay.hidden = true;
        }
      }, 300);
      toggle.focus();
    }

    toggle.addEventListener('click', function () {
      if (drawer.classList.contains('is-open')) closeDrawer();
      else openDrawer();
    });
    if (closeButton) closeButton.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });
    drawer.querySelectorAll('a').forEach(function (anchor) {
      anchor.addEventListener('click', closeDrawer);
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (event) {
        var href = anchor.getAttribute('href');
        if (!href || href === '#') return;
        var target = document.querySelector(href);
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function initMarketingDrawer() {
    var toggle = document.getElementById('marketingMobileToggle');
    var drawer = document.getElementById('marketingMobileDrawer');
    if (!toggle || !drawer) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', function () {
      var isOpen = drawer.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        drawer.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function boot() {
    initMobileNav();
    initSmoothScroll();
    initMarketingDrawer();
    var form = document.getElementById('serviceRequestForm');
    if (form) form.addEventListener('submit', handleServiceRequest);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
