/* Post-load live UX fixes for public menu (hours → open status, mark letter). */
(async function () {
  'use strict';
  try {
    if (typeof window.getMenuSupabaseClient !== 'function') return;
    var params = new URLSearchParams(location.search);
    var pathParts = location.pathname.split('/').filter(Boolean);
    var routeIndex = pathParts.indexOf('m');
    var tenant = (routeIndex >= 0 ? pathParts[routeIndex + 1] : params.get('tenant') || '').trim().toLowerCase();
    var branch = (routeIndex >= 0 ? pathParts[routeIndex + 2] : params.get('branch') || '').trim().toLowerCase();
    if (!tenant) return;

    var client = window.getMenuSupabaseClient();
    if (!client) return;
    var result = await client.rpc('get_public_menu', {
      p_tenant_slug: tenant,
      p_branch_slug: branch || null
    });
    var data = result.data;
    if (result.error || !data || !data.tenant || !data.branch) return;

    var badge = document.getElementById('branchStatus');
    var mark = document.getElementById('brandMark');
    var name = data.tenant.name || '';
    if (mark && name) mark.textContent = name.charAt(0);

    var hours = data.branch.hours || [];
    if (!badge || !hours.length) return;
    var now = new Date();
    var weekday = now.getDay();
    var day = hours.find(function (entry) { return Number(entry.weekday) === weekday; });
    var open = null;
    if (day && day.is_closed) open = false;
    else if (day) {
      var currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':00';
      var opensAt = String(day.opens_at || '');
      var closesAt = String(day.closes_at || '');
      if (opensAt && closesAt) open = closesAt > opensAt ? currentTime >= opensAt && currentTime <= closesAt : currentTime >= opensAt || currentTime <= closesAt;
    }

    var arabic = (document.documentElement.lang || 'ar') === 'ar';
    if (open === null) {
      badge.textContent = arabic ? '● ساعات العمل غير منشورة' : '● Hours not published';
      badge.classList.remove('closed');
    } else if (open) {
      badge.textContent = arabic ? '● مفتوح الآن' : '● Open now';
      badge.classList.remove('closed');
    } else {
      badge.textContent = arabic ? '● مغلق الآن' : '● Closed now';
      badge.classList.add('closed');
    }
  } catch (error) {
    // The primary renderer already displays a truthful unavailable state on failure.
    console.warn('Public menu status update skipped:', error);
  }
})();
