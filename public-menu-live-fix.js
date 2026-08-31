/* Post-load live UX fixes for public menu (hours → open status, mark letter). Safe no-op offline. */
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
      badge.textContent = ar ? '● ساعات العمل غير منشورة' : '● Hours not published';
      badge.classList.remove('closed');
    } else if (open) {
      badge.textContent = ar ? '● مفتوح الآن' : '● Open now';
      badge.classList.remove('closed');
    } else {
      badge.textContent = ar ? '● مغلق الآن' : '● Closed now';
      badge.classList.add('closed');
    }
  } catch (_) { /* silent */ }
})();
