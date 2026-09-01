/* Menu V2 — Client Portal Team Management v2 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[m]));
  let client = null;
  let teamLoadId = 0;

  function getClient() {
    if (!client && typeof window.getMenuSupabaseClient === 'function') client = window.getMenuSupabaseClient();
    return client;
  }
  function tenantId() { return $('clientTenantSelect')?.value || ''; }

  function ensureTeamPanel() {
    const nav = document.querySelector('.client-nav');
    const main = document.querySelector('.client-main');
    if (!nav || !main || $('panel-team')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'client-nav-item';
    btn.dataset.panel = 'team';
    btn.innerHTML = '<span class="icon">♙</span> فريق العمل';
    btn.addEventListener('click', openTeam);
    nav.appendChild(btn);

    const panel = document.createElement('section');
    panel.className = 'client-panel';
    panel.id = 'panel-team';
    panel.innerHTML = `
      <div class="client-card team-panel-card">
        <div class="client-card-head">
          <div><h2>فريق العمل</h2><p>إدارة الأشخاص الذين لديهم وصول إلى النشاط الحالي.</p></div>
          <button type="button" class="m-btn m-btn-primary" id="teamAddBtn">+ إضافة عضو</button>
        </div>
        <div id="teamStatus" class="team-status" role="status" aria-live="polite"></div>
        <div id="teamMembersList" class="team-members-list"></div>
        <p class="team-note">يمكنك ربط مستخدم موجود في حسابات المنصة كـAdmin أو Editor. لا يتم كشف Service Role Key في المتصفح.</p>
      </div>`;
    main.appendChild(panel);
    $('teamAddBtn').addEventListener('click', openAddDialog);
  }

  function openTeam() {
    document.querySelectorAll('.client-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-team'));
    document.querySelectorAll('.client-nav-item').forEach(b => b.classList.toggle('active', b.dataset.panel === 'team'));
    if ($('pageTitle')) $('pageTitle').textContent = 'فريق العمل';
    $('clientSidebar')?.classList.remove('open');
    loadTeam();
  }

  async function loadTeam() {
    const c = getClient();
    const tid = tenantId();
    const loadId = ++teamLoadId;
    if (!c || !tid || !$('teamMembersList')) return;
    const portalState = window.clientPortalState;
    if (portalState?.mode === 'demo') {
      $('teamStatus').textContent = 'إدارة الفريق متاحة بعد تسجيل الدخول إلى حساب حقيقي.';
      $('teamMembersList').innerHTML = '<div class="team-empty">وضع Demo مخصص للمعاينة فقط ولا يقرأ عضويات الإنتاج.</div>';
      return;
    }
    if (portalState?.state !== 'ready') {
      $('teamStatus').textContent = 'جارٍ تجهيز بيانات النشاط…';
      return;
    }
    $('teamStatus').textContent = 'جارٍ تحميل أعضاء الفريق…';
    const { data, error } = await c
      .from('tenant_members')
      .select('user_id, role')
      .eq('tenant_id', tid)
      .order('role')
      .limit(100);
    if (loadId !== teamLoadId || tenantId() !== tid) return;
    if (error) {
      $('teamStatus').textContent = 'تعذر تحميل فريق العمل: ' + error.message;
      $('teamMembersList').innerHTML = '';
      return;
    }
    const rows = data || [];
    $('teamMembersList').innerHTML = rows.map((m) => `
      <article class="team-member-card">
        <div class="team-member-main"><strong dir="ltr">${esc(m.user_id)}</strong><span class="team-role ${m.role === 'owner' ? 'team-role-owner' : ''}">${m.role === 'owner' ? 'Owner — مالك النشاط' : m.role === 'admin' ? 'Admin — مدير' : 'Editor — محرر'}</span></div>
        ${m.role === 'owner' ? '<span class="team-protected">محمي</span>' : `<button type="button" class="m-btn m-btn-ghost m-btn-sm" data-remove="${esc(m.user_id)}">إزالة</button>`}
      </article>`).join('') || '<div class="team-empty">لا يوجد أعضاء في هذا النشاط.</div>';
    $('teamStatus').textContent = `${rows.length} عضو/أعضاء مرتبطون بالنشاط.`;
    $('teamMembersList').querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => removeMember(b.dataset.remove)));
  }

  function openAddDialog() {
    $('teamDialog')?.remove();
    const previouslyFocused = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'team-dialog';
    wrap.id = 'teamDialog';
    wrap.dir = 'rtl';
    wrap.innerHTML = `
      <div class="team-dialog-backdrop" data-close></div>
      <div class="team-dialog-box" role="dialog" aria-modal="true" aria-labelledby="teamDialogTitle" tabindex="-1">
        <div class="team-dialog-head"><h3 id="teamDialogTitle">إضافة عضو إلى الفريق</h3><button type="button" class="close-modal-btn" data-close aria-label="إغلاق">×</button></div>
        <div class="client-field"><label for="teamEmail">البريد الإلكتروني</label><input id="teamEmail" type="email" dir="ltr" autocomplete="email" placeholder="employee@example.com"></div>
        <div class="client-field"><label for="teamRole">الدور</label><select id="teamRole"><option value="admin">Admin — مدير</option><option value="editor">Editor — محرر</option></select></div>
        <p class="team-note">يجب أن يكون البريد مرتبطًا بحساب Auth موجود. هذا المسار لا يكشف مفاتيح الإدارة في المتصفح.</p>
        <div class="team-dialog-actions"><button type="button" class="m-btn m-btn-primary" id="teamSave">حفظ</button><button type="button" class="m-btn m-btn-secondary" data-close>إلغاء</button></div>
      </div>`;
    document.body.appendChild(wrap);
    const box = wrap.querySelector('.team-dialog-box');
    const close = () => {
      wrap.remove();
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus({ preventScroll: true });
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !box) return;
      const focusable = [...box.querySelectorAll('button, input, select, [href], [tabindex]:not([tabindex="-1"])')]
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    wrap.addEventListener('keydown', onKeyDown);
    wrap.querySelectorAll('[data-close]').forEach((element) => element.addEventListener('click', close));
    $('teamSave').addEventListener('click', saveMember);
    requestAnimationFrame(() => {
      wrap.classList.add('is-open');
      $('teamEmail')?.focus({ preventScroll: true });
    });
  }

  async function saveMember() {
    const c = getClient();
    const tid = tenantId();
    const email = ($('teamEmail')?.value || '').trim().toLowerCase();
    const role = $('teamRole')?.value;
    if (!c || !tid || !email || !/^\S+@\S+\.\S+$/.test(email)) return alert('أدخل بريدًا إلكترونيًا صحيحًا.');
    if (!['admin', 'editor'].includes(role)) return alert('اختر دورًا صحيحًا.');
    const btn = $('teamSave');
    if (btn) { btn.disabled = true; btn.textContent = 'جارٍ الحفظ…'; }
    try {
      const { error } = await c.rpc('manage_tenant_member_by_email', { p_tenant_id: tid, p_email: email, p_role: role, p_action: 'upsert' });
      if (error) {
        const code = String(error.message || '').split(':')[0];
        const msg = code === 'user_not_found'
          ? 'لا يوجد حساب Auth بهذا البريد. أنشئ الحساب أولًا ثم أعد المحاولة.'
          : code === 'not_authorized'
            ? 'ليس لديك صلاحية إدارة أعضاء هذا النشاط.'
            : 'تعذر حفظ العضو: ' + error.message;
        alert(msg);
        return;
      }
      $('teamDialog')?.remove();
      await loadTeam();
    } catch (error) {
      alert('تعذر حفظ العضو: ' + (error?.message || 'حدث خطأ غير متوقع'));
    } finally {
      if (btn && document.body.contains(btn)) { btn.disabled = false; btn.textContent = 'حفظ'; }
    }
  }

  async function removeMember(userId) {
    if (!confirm('إزالة هذا العضو من النشاط؟')) return;
    const c = getClient();
    const tid = tenantId();
    if (!c || !tid) return;
    const { error } = await c.from('tenant_members').delete().eq('tenant_id', tid).eq('user_id', userId);
    if (error) return alert('تعذر إزالة العضو: ' + error.message);
    await loadTeam();
  }

  function init() {
    ensureTeamPanel();
    window.addEventListener('menu:client-portal-state', (event) => {
      const state = event.detail?.state;
      if (state === 'ready' && $('panel-team')?.classList.contains('active')) void loadTeam();
      if (state !== 'ready' && $('teamMembersList')) $('teamMembersList').innerHTML = '';
    });
    $('clientTenantSelect')?.addEventListener('change', () => {
      window.setTimeout(() => { void loadTeam(); }, 0);
    });
    if (window.clientPortalState?.state === 'ready') void loadTeam();
  }
  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
