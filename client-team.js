/* Client Portal Team Management — owner-only UI; Supabase RLS/RPC is authoritative. */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  let client = null;
  let teamLoadRevision = 0;

  function getClient() {
    if (!client && typeof window.getMenuSupabaseClient === 'function') client = window.getMenuSupabaseClient();
    return client;
  }

  function portalState() {
    return window.clientPortalState || { state: 'idle', mode: 'idle', tenantId: null, role: null };
  }

  function canManageTeam() {
    const state = portalState();
    return state.state === 'ready' && state.mode === 'live' && state.role === 'owner' && Boolean(state.tenantId);
  }

  function renderAccess() {
    const state = portalState();
    const nav = $('teamNavBtn');
    const panel = $('panel-team');
    const add = $('teamAddBtn');
    const isOwner = state.role === 'owner';
    if (nav) nav.hidden = !isOwner;
    if (panel && !isOwner) panel.hidden = true;
    if (add) add.hidden = !isOwner || state.mode === 'demo';
    if (state.mode === 'demo' && $('teamStatus')) {
      $('teamStatus').textContent = 'إدارة الفريق غير متاحة في العرض التوضيحي المحلي.';
      $('teamMembersList').innerHTML = '<div class="team-empty">سجّل الدخول بحساب مالك نشاط لعرض أعضاء الفريق الفعليين.</div>';
    }
  }

  function roleLabel(role) {
    return role === 'owner' ? 'مالك النشاط' : role === 'admin' ? 'مدير' : 'محرر';
  }

  async function loadTeam() {
    const state = portalState();
    const revision = ++teamLoadRevision;
    renderAccess();
    if (state.mode === 'demo') return;
    if (!canManageTeam()) {
      if ($('teamStatus')) $('teamStatus').textContent = 'إدارة الفريق متاحة لمالك النشاط فقط.';
      if ($('teamMembersList')) $('teamMembersList').innerHTML = '';
      return;
    }
    const supabase = getClient();
    if (!supabase) {
      $('teamStatus').textContent = 'تعذر تهيئة الاتصال الآمن لإدارة الفريق.';
      return;
    }
    $('teamStatus').textContent = 'جارٍ تحميل أعضاء الفريق…';
    $('teamMembersList').innerHTML = '';
    const { data, error } = await supabase
      .from('tenant_members')
      .select('user_id,role')
      .eq('tenant_id', state.tenantId)
      .order('role')
      .limit(100);
    if (revision !== teamLoadRevision || portalState().tenantId !== state.tenantId) return;
    if (error) {
      $('teamStatus').textContent = 'تعذر تحميل الفريق: ' + error.message;
      return;
    }
    const members = data || [];
    $('teamMembersList').innerHTML = members.length
      ? members.map(member => `<article class="team-member-card"><div class="team-member-main"><strong dir="ltr">${esc(member.user_id)}</strong><span class="team-role ${member.role === 'owner' ? 'team-role-owner' : ''}">${roleLabel(member.role)}</span></div>${member.role === 'owner' ? '<span class="team-protected">محمي</span>' : `<button type="button" class="m-btn m-btn-ghost m-btn-sm" data-remove-member="${esc(member.user_id)}">إزالة</button>`}</article>`).join('')
      : '<div class="team-empty">لا يوجد أعضاء فريق إضافيون لهذا النشاط.</div>';
    $('teamStatus').textContent = `${members.length} عضو/أعضاء لديهم وصول إلى هذا النشاط.`;
    $('teamMembersList').querySelectorAll('[data-remove-member]').forEach(button => {
      button.addEventListener('click', () => removeMember(button.dataset.removeMember));
    });
  }

  function closeDialog() {
    const dialog = $('teamDialog');
    const previousFocus = dialog?.previousFocus;
    dialog?.remove();
    if (previousFocus?.focus) previousFocus.focus({ preventScroll: true });
  }

  function openAddDialog() {
    if (!canManageTeam()) return;
    closeDialog();
    const dialog = document.createElement('div');
    dialog.id = 'teamDialog';
    dialog.className = 'team-dialog';
    dialog.previousFocus = document.activeElement;
    dialog.innerHTML = `<div class="team-dialog-backdrop" data-close-team-dialog></div><section class="team-dialog-box" role="dialog" aria-modal="true" aria-labelledby="teamDialogTitle" tabindex="-1"><div class="team-dialog-head"><h3 id="teamDialogTitle">إضافة عضو إلى الفريق</h3><button type="button" class="close-modal-btn" data-close-team-dialog aria-label="إغلاق">×</button></div><div class="client-field"><label for="teamEmail">البريد الإلكتروني</label><input id="teamEmail" type="email" dir="ltr" autocomplete="email" placeholder="employee@example.com" required></div><div class="client-field"><label for="teamRole">الدور</label><select id="teamRole"><option value="admin">مدير</option><option value="editor">محرر</option></select></div><p class="team-note">يلزم أن يكون البريد مرتبطًا بحساب قائم على المنصة. لا يمكن تغيير أو إزالة المالك من هذا المسار.</p><div class="team-dialog-actions"><button type="button" class="m-btn m-btn-primary" id="teamSaveBtn">حفظ العضو</button><button type="button" class="m-btn m-btn-secondary" data-close-team-dialog>إلغاء</button></div></section>`;
    document.body.appendChild(dialog);
    document.body.classList.add('client-drawer-open');
    const box = dialog.querySelector('.team-dialog-box');
    const close = () => {
      document.body.classList.remove('client-drawer-open');
      closeDialog();
    };
    dialog.querySelectorAll('[data-close-team-dialog]').forEach(element => element.addEventListener('click', close));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !box) return;
      const focusable = [...box.querySelectorAll('button,input,select,[href],[tabindex]:not([tabindex="-1"])')].filter(element => !element.disabled && element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    });
    $('teamSaveBtn').addEventListener('click', saveMember);
    window.setTimeout(() => $('teamEmail')?.focus({ preventScroll: true }), 0);
  }

  async function saveMember() {
    if (!canManageTeam()) return;
    const email = ($('teamEmail')?.value || '').trim().toLowerCase();
    const role = $('teamRole')?.value;
    const save = $('teamSaveBtn');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      $('teamEmail')?.focus();
      return;
    }
    if (!['admin', 'editor'].includes(role)) return;
    save.disabled = true;
    save.textContent = 'جارٍ الحفظ…';
    try {
      const { error } = await getClient().rpc('manage_tenant_member_by_email', {
        p_tenant_id: portalState().tenantId,
        p_email: email,
        p_role: role,
        p_action: 'upsert'
      });
      if (error) throw error;
      document.body.classList.remove('client-drawer-open');
      closeDialog();
      await loadTeam();
    } catch (error) {
      const code = String(error?.message || '').split(':')[0];
      $('teamStatus').textContent = code === 'user_not_found'
        ? 'لا يوجد حساب مرتبط بهذا البريد. أنشئ الحساب أولًا ثم أعد المحاولة.'
        : code === 'not_authorized'
          ? 'ليس لديك صلاحية إدارة فريق هذا النشاط.'
          : 'تعذر حفظ العضو: ' + (error?.message || 'حاول مجددًا.');
    } finally {
      if (save && document.body.contains(save)) {
        save.disabled = false;
        save.textContent = 'حفظ العضو';
      }
    }
  }

  async function removeMember(userId) {
    if (!canManageTeam() || !userId || !confirm('هل تريد إزالة هذا العضو من النشاط؟')) return;
    try {
      const { error } = await getClient()
        .from('tenant_members')
        .delete()
        .eq('tenant_id', portalState().tenantId)
        .eq('user_id', userId);
      if (error) throw error;
      await loadTeam();
    } catch (error) {
      $('teamStatus').textContent = 'تعذر إزالة العضو: ' + (error?.message || 'حاول مجددًا.');
    }
  }

  function init() {
    $('teamAddBtn')?.addEventListener('click', openAddDialog);
    document.querySelector('[data-panel="team"]')?.addEventListener('click', () => void loadTeam());
    window.addEventListener('menu:client-portal-state', () => {
      renderAccess();
      if ($('panel-team')?.classList.contains('active')) void loadTeam();
    });
    renderAccess();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
