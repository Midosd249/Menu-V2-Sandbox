(function(){function css(h){if(document.querySelector('link[href="'+h+'"]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.appendChild(l);}css('ux-menu-polish.css');css('ux-client-owner.css');})();
/* Post-load live UX fixes for public menu (hours \u2192 open status, mark letter). */
(async function () {
  try {
    if (!window.MENU_CONFIG || !window.supabase?.createClient) return;
    const params = new URLSearchParams(location.search);
    const pathParts = location.pathname.split('/').filter(Boolean);
    const ri = pathParts.indexOf('m');
    const tenant = (ri >= 0 ? pathParts[ri + 1] : params.get('tenant') || '').trim().toLowerCase();
    const branch = (ri >= 0 ? pathParts[ri + 2] : params.get('branch') || '').trim().toLowerCase();
    if (!tenant) return;
    const client = window.supabase.createClient(window.MENU_CONFIG.supabaseUrl, window.MENU_CONFIG.supabaseAnonKey);
    const { data, error } = await client.rpc('get_public_menu', {
      p_tenant_slug: tenant,
      p_branch_slug: branch || null
    });
    if (error || !data?.tenant || !data?.branch) return;
    const badge = document.getElementById('branchStatus');
    const mark = document.getElementById('brandMark');
    const name = data.tenant.name || '';
    if (mark && name) mark.textContent = name.charAt(0);
    const hrs = data.branch.hours || [];
    if (!badge || !hrs.length) return;
    const now = new Date();
    const wd = now.getDay();
    const row = hrs.find((h) => Number(h.weekday) === wd);
    let open = null;
    if (!row) open = null;
    else if (row.is_closed) open = false;
    else {
      const pad = (n) => String(n).padStart(2, '0');
      const cur = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':00';
      const op = String(row.opens_at || '');
      const cl = String(row.closes_at || '');
      if (!op || !cl) open = null;
      else if (cl > op) open = cur >= op && cur <= cl;
      else open = cur >= op || cur <= cl;
    }
    const ar = (document.documentElement.lang || 'ar') === 'ar';
    if (open === null) {
      badge.textContent = ar ? '\u25cf \u0633\u0627\u0639\u0627\u062a \u0627\u0644\u0639\u0645\u0644 \u063a\u064a\u0631 \u0645\u0646\u0634\u0648\u0631\u0629' : '\u25cf Hours not published';
      badge.classList.remove('closed');
    } else if (open) {
      badge.textContent = ar ? '\u25cf \u0645\u0641\u062a\u0648\u062d \u0627\u0644\u0622\u0646' : '\u25cf Open now';
      badge.classList.remove('closed');
    } else {
      badge.textContent = ar ? '\u25cf \u0645\u063a\u0644\u0642 \u0627\u0644\u0622\u0646' : '\u25cf Closed now';
      badge.classList.add('closed');
    }
  } catch (_) {}
})();
