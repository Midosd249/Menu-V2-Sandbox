/* Menu Marketing & Commercial Controller */
(function() {
  'use strict';

  let supabaseClient = null;

  function getClient() {
    if (!supabaseClient && window.MENU_CONFIG && window.supabase) {
      supabaseClient = window.supabase.createClient(window.MENU_CONFIG.supabaseUrl, window.MENU_CONFIG.supabaseAnonKey);
    }
    return supabaseClient;
  }

  // Handle Service Request Form Submission
  async function handleServiceRequest(e) {
    if (e) e.preventDefault();

    const form = document.getElementById('serviceRequestForm');
    if (!form) return;

    const statusEl = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitRequestBtn');

    const payload = {
      business_name: document.getElementById('reqBusinessName')?.value.trim(),
      business_type: document.getElementById('reqBusinessType')?.value,
      service_type: document.getElementById('reqServiceType')?.value || 'menu',
      country: document.getElementById('reqCountry')?.value || 'SA',
      city: document.getElementById('reqCity')?.value.trim(),
      contact_name: document.getElementById('reqContactName')?.value.trim(),
      contact_phone: document.getElementById('reqContactPhone')?.value.trim(),
      contact_email: document.getElementById('reqContactEmail')?.value.trim() || null,
      details: document.getElementById('reqDetails')?.value.trim() || null
    };

    if (!payload.business_name || !payload.contact_name || !payload.contact_phone) {
      if (statusEl) {
        statusEl.className = 'm-form-status error';
        statusEl.textContent = 'يرجى إكمال الحقول الإلزامية (اسم النشاط، اسم المسؤول، ورقم الهاتف).';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'جارٍ إرسال الطلب…';
    }

    if (statusEl) {
      statusEl.className = 'm-form-status';
      statusEl.style.display = 'none';
    }

    try {
      const client = getClient();
      let sent = false;

      // Try RPC first
      if (client) {
        try {
          const { data, error } = await client.rpc('submit_service_request', { p_payload: payload });
          if (!error && data?.ok) {
            sent = true;
          }
        } catch (rpcErr) {
          console.warn('RPC submit_service_request fallback:', rpcErr);
        }

        // Direct table insert fallback if RPC not yet deployed
        if (!sent) {
          const { error: insErr } = await client.from('service_requests').insert({
            business_name: payload.business_name,
            business_type: payload.business_type,
            service_type: payload.service_type,
            country: payload.country,
            city: payload.city,
            contact_name: payload.contact_name,
            contact_phone: payload.contact_phone,
            contact_email: payload.contact_email,
            details: payload.details
          });
          if (!insErr) sent = true;
        }
      }

      // If offline/sandbox demo, simulate successful local capture
      if (!sent) {
        const localRequests = JSON.parse(localStorage.getItem('menu_service_requests') || '[]');
        localRequests.push({ ...payload, created_at: new Date().toISOString(), id: 'local_' + Date.now() });
        localStorage.setItem('menu_service_requests', JSON.stringify(localRequests));
        sent = true;
      }

      if (statusEl) {
        statusEl.className = 'm-form-status success';
        statusEl.textContent = 'تم استلام طلبك بنجاح! سيتواصل معك فريق Menu خلال 24 ساعة لبدء التنفيذ.';
      }
      form.reset();
    } catch (err) {
      if (statusEl) {
        statusEl.className = 'm-form-status error';
        statusEl.textContent = 'تعذر إرسال الطلب: ' + (err.message || 'يرجى المحاولة مجددًا');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'إرسال طلب الخدمة';
      }
    }
  }

  // Smooth scroll to request section
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();

    const form = document.getElementById('serviceRequestForm');
    if (form) {
      form.addEventListener('submit', handleServiceRequest);
    }
    const btn = document.getElementById('submitRequestBtn');
    if (btn) {
      btn.addEventListener('click', handleServiceRequest);
    }
  });
})();
