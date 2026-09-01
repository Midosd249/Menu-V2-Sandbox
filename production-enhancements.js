/* Menu V2 production polish — additive runtime layer. */
(function () {
  'use strict';
  const origin = window.location.origin;
  const clean = (value) => String(value || '').trim().replace(/^\/+|\/+$/g, '');
  const escPath = (value) => encodeURIComponent(clean(value));

  function ensureMeta(name, content, property) {
    if (!content) return;
    let el = property ? document.querySelector('meta[property="' + property + '"]') : document.querySelector('meta[name="' + name + '"]');
    if (!el) { el = document.createElement('meta'); el.setAttribute(property ? 'property' : 'name', property || name); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }

  function publicRoute() {
    const path = window.location.pathname.replace(/\/+$/, '');
    const m = path.match(/^\/m\/([^/]+)(?:\/([^/]+))?$/);
    if (m) return { tenant: decodeURIComponent(m[1]), branch: m[2] ? decodeURIComponent(m[2]) : '' };
    const q = new URLSearchParams(window.location.search);
    return { tenant: q.get('tenant') || '', branch: q.get('branch') || '' };
  }

  function setPublicCanonical() {
    if (!document.querySelector('.site-shell')) return;
    const route = publicRoute();
    if (!route.tenant) return;
    const canonical = origin + '/m/' + escPath(route.tenant) + (route.branch ? '/' + escPath(route.branch) : '');
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = canonical;
    ensureMeta('', canonical, 'og:url');
  }

  function updatePublicMeta() {
    if (!document.querySelector('.site-shell')) return;
    const brand = document.getElementById('brandName');
    const branch = document.getElementById('branchName');
    const title = brand && brand.textContent.trim() ? brand.textContent.trim() + ' — المنيو الرقمي' : 'Menu — منيو رقمي';
    document.title = title;
    ensureMeta('description', 'منيو رقمي تفاعلي محدث لحظيًا مع معلومات الفرع والتواصل والطلب.');
    ensureMeta('', title, 'og:title');
    if (branch && branch.textContent.trim() && branch.textContent.trim() !== '...') ensureMeta('', branch.textContent.trim() + ' — ' + title, 'og:description');
  }

  async function resolveBranch() {
    const select = document.getElementById('clientBranchSelect');
    const tenantEl = document.getElementById('currentTenantSlug');
    const link = document.getElementById('qrLinkText');
    if (!select || !select.value || !tenantEl || !link) return null;
    const tenantSlug = clean(tenantEl.textContent);
    const client = typeof window.getMenuSupabaseClient === 'function' ? window.getMenuSupabaseClient() : null;
    if (!tenantSlug || tenantSlug === '...' || !client) return null;
    const result = await client.from('branches').select('id,slug').eq('id', select.value).maybeSingle();
    if (result.error || !result.data?.slug) return null;
    return { tenantSlug, branchSlug: result.data.slug };
  }

  function drawQr(canvas, url) {
    if (!canvas || !url || typeof window.QRCode !== 'function') return;
    try {
      canvas.innerHTML = '';
      new window.QRCode(canvas, { text: url, width: 260, height: 260, colorDark: '#111111', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M });
    } catch (e) { console.warn('QR render failed', e); }
  }

  async function syncQr() {
    const select = document.getElementById('clientBranchSelect');
    const input = document.getElementById('qrLinkText');
    if (!select || !input || !select.value) return;
    const resolved = await resolveBranch();
    if (!resolved) return;
    const url = origin + '/m/' + escPath(resolved.tenantSlug) + '/' + escPath(resolved.branchSlug);
    input.value = url;
    input.title = 'الرابط القياسي للمنيو لهذا الفرع';
    drawQr(document.getElementById('qrCanvas'), url);
    drawQr(document.getElementById('qrCanvasQuick'), url);
    const download = document.getElementById('downloadQrBtn');
    if (download && !download.dataset.productionQrBound) {
      download.dataset.productionQrBound = '1';
      download.addEventListener('click', () => {
        const canvas = document.getElementById('qrCanvas');
        if (!canvas) return;
        const source = canvas.querySelector('canvas') || canvas;
        const a = document.createElement('a');
        a.href = source.toDataURL('image/png');
        a.download = resolved.tenantSlug + '-' + resolved.branchSlug + '-qr.png';
        a.click();
      });
    }
  }

  function init() {
    setPublicCanonical();
    updatePublicMeta();
    if (document.querySelector('.site-shell')) {
      const brand = document.getElementById('brandName');
      if (brand) new MutationObserver(() => { updatePublicMeta(); setPublicCanonical(); }).observe(brand, { childList: true, characterData: true, subtree: true });
    }
    const select = document.getElementById('clientBranchSelect');
    if (select) {
      select.addEventListener('change', () => void syncQr());
      let tries = 0;
      const timer = setInterval(() => { tries += 1; void syncQr(); if (tries >= 24) clearInterval(timer); }, 700);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
