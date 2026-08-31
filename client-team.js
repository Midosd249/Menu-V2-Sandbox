/* Menu V2 — Client Portal additive enhancements: auth visibility + Team Management */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function getClient() {
    return typeof window.getMenuSupabaseClient === 'function' ? window.getMenuSupabaseClient() : null;
  }

  function currentTenantId() {
    return $('clientTenantSelect')?.value || '';
  }

  function forceAuthVisibility() {
    const client = getClient();
    if (!client) return;
    client.auth.getSession().then(({ data }) => {
      const authenticated = !!data?.session?.user;
      const auth = $('authSection');
      const dash = $('dashboardContent');
      if (auth) { auth.hidden = authenticated; auth.style.display = authenticated ? 'none' : ''; }
      if (dash) dash.hidden = !authenticated;
    });
  }

  function ensureTeamUi() {
    const nav = document.querySelector('.client-nav');
    const main = document.querySelector('.client-main');
    if (!nav || !main) return;

    if (!nav.querySelector('[data-panel="team"]')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'client-nav-item';
      btn.dataset.panel = 'team';
      btn.innerHTML = '<span class="icon">♙</span> فريق العمل';
      btn.addEventListener('click', openTeamPanel);
      nav.appendChild(btn);
    }

    if (!$('panel-team')) {
      const panel = document.createElement('section');
      panel.className = 'client-panel';
      panel.id = 'panel-team';
      panel.innerHTML = `
        <div class="client-card client-team-panel">
          <div class="client-card-head">
            <div><h2>فريق العمل</h2><p>إدارة الأشخاص الذين لديهم صلاحية الوصول إلى النشاط الحالي.</p></div>
            <button type="button" class="m-btn m-btn-primary" id="teamAddBtn">+ إضافة عضو</button>
          </div>
          <div id="teamStatus" class="client-team-status" role="status" aria-live="polite"></div>
          <div id="teamMembersList" class="client-team-list"></div>
        </div>`;
      main.appendChild(panel);
      $('teamAddBtn').addEventListener('click', openMemberDialog);
    }
  }

  function openTeamPanel() {
    document.querySelectorAll('.client-panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-team'));
    document.querySelectorAll('.client-nav-item').forEach((b) => b.classList.toggle('active', b.dataset.panel === 'team'));
    const title = $('pageTitle');
    if (title) title.textContent = 'فريق العمل';
    loadTeam();
  }

  async function loadTeam() {
    const client = getClient();
    const tenantId = currentTenantId();
    if (!client || !tenantId) return;
    const status = $('teamStatus');
    const list = $('teamMembersList');
    if (status) status.textContent = 'جارٍ تحميل أعضاء الفريق…';

    const { data, error } = await client.from('tenant_members').select('user_id, role').eq('tenant_id', tenantId).order('role');
    if (error) {
      if (status) status.textContent = 'تعذر تحميل فريق العمل: ' + error.message;
      return;
    }
    const rows = data || [];
    list.innerHTML = rows.length ? rows.map((m) => `
      <article class="client-team-member">
        <div class="client-team-member-main"><strong>${esc(m.user_id)}</strong><span class="status-chip ${m.role === 'owner' ? 'active' : ''}">${m.role === 'owner' ? 'Owner — مالك' : m.role === 'admin' ? 'Admin — مدير' : 'Editor — محرر'}</span></div>
        ${m.role === 'owner' ? '<span class="client-team-protected">المالك محمي</span>' : `<button type="button" class="m-btn m-btn-ghost m-btn-sm" data-remove-member="${esc(m.user_id)}">إزالة</button>`}
      </article>`).join('') : '<div class="client-team-empty">لا يوجد أعضاء مرتبطون بهذا النشاط.</div>';
    if (status) status.textContent = `${rows.length} عضو/أعضاء مرتبطون بالنشاط.`;
    list.querySelectorAll('[data-remove-member]').forEach((b) => b.addEventListener('click', () => removeMember(b.dataset.removeMember)));
  }

  function openMemberDialog() {
    $('teamMemberDialog')?.remove();
    const dialog = document.createElement('div');
    dialog.className = 'client-modal';
    dialog.id = 'teamMemberDialog';
    dialog.innerHTML = `
      <div class="client-modal-backdrop" data-close-team></div>
      <div class="client-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="teamDialogTitle">
        <div class="client-modal-head"><h3 id="teamDialogTitle">إضافة عضو إلى الفريق</h3><button class="close-modal-btn" type="button" data-close-team aria-label="إغلاق">×</button></div>
        <div class="client-field"><label for="teamMemberUuid">UUID المستخدم في Supabase</label><input id="teamMemberUuid" dir="ltr" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autocomplete="off"></div>
        <div class="client-field" style="margin-top:14px"><label for="teamMemberRole">الدور</label><select id="teamMemberRole"><option value="admin">Admin — مدير</option><option value="editor">Editor — محرر</option></select></div>
        <p class="client-team-note">هذه المرحلة تربط مستخدمًا موجودًا في Supabase Auth بأمان. لا يتم وضع Service Role Key داخل المتصفح.</p>
        <div style="display:flex;gap:10px;justify-content:flex-start;margin-top:20px"><button type="button" class="m-btn m-btn-primary" id="teamSaveMember">حفظ العضو</button><button type="button" class="m-btn m-btn-secondary" data-close-team>إلغاء</button></div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelectorAll('[data-close-team]').forEach((el) => el.addEventListener('click', () => dialog.remove()));
    $('teamSaveMember').addEventListener('click', saveMember);
  }

  async function saveMember() {
    const client = getClient();
    const tenantId = currentTenantId();
    const userId = ($('teamMemberUuid')?.value || '').trim();
    const role = $('teamMemberRole')?.value;
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!client || !tenantId || !uuid.test(userId)) return alert('أدخل UUID صحيحًا لمستخدم موجود في Supabase Auth.');
    const { error } = await client.rpc('manage_tenant_member', { p_tenant_id: tenantId, p_user_id: userId, p_role: role, p_action: 'upsert' });
    if (error) return alert('تعذر حفظ العضو: ' + error.message);
    $('teamMemberDialog')?.remove();
    await loadTeam();
  }

  async function removeMember(userId) {
    const client = getClient();
    const tenantId = currentTenantId();
    if (!client || !tenantId || !confirm('هل تريد إزالة هذا العضو من النشاط؟')) return;
    const { error } = await client.rpc('manage_tenant_member', { p_tenant_id: tenantId, p_user_id: userId, p_role: 'editor', p_action: 'remove' });
    if (error) return alert('تعذر إزالة العضو: ' + error.message);
    await loadTeam();
  }

  function init() {
    forceAuthVisibility();
    ensureTeamUi();
    $('clientTenantSelect')?.addEventListener('change', () => setTimeout(loadTeam, 0));
  }

  document.addEventListener('DOMContentLoaded', init, { once: true });
  window.addEventListener('load', init, { once: true });
})();
