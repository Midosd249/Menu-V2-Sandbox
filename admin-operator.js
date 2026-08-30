/* Menu Studio — operator panel visibility + provision button
   Security boundary remains server-side (is_platform_operator / provision_restaurant).
   Does not depend on global liveUser; uses adminClient.auth session. */
(function () {
  var watching = false;

  function card() {
    return document.getElementById('operatorProvisionCard');
  }

  function client() {
    if (typeof adminClient !== 'undefined' && adminClient) return adminClient;
    return null;
  }

  async function refreshOperatorPanel() {
    var el = card();
    if (!el) return;
    var c = client();
    if (!c) {
      el.hidden = true;
      return;
    }
    try {
      var sessionRes = await c.auth.getSession();
      var session = sessionRes && sessionRes.data && sessionRes.data.session;
      if (!session) {
        el.hidden = true;
        return;
      }
      var r = await c.rpc('is_platform_operator');
      el.hidden = !(r && r.data === true);
      if (!el.hidden) bindProvision();
    } catch (e) {
      el.hidden = true;
    }
  }

  function bindProvision() {
    var btn = document.getElementById('opProvisionBtn');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.onclick = async function () {
      var c = client();
      if (!c) return;
      var msg = document.getElementById('opProvisionMsg');
      var name = (document.getElementById('opName') && document.getElementById('opName').value || '').trim();
      var slug = (document.getElementById('opSlug') && document.getElementById('opSlug').value || '').trim().toLowerCase();
      var branch = (document.getElementById('opBranch') && document.getElementById('opBranch').value || '').trim();
      var ownerId = (document.getElementById('opOwnerId') && document.getElementById('opOwnerId').value || '').trim();
      if (msg) msg.textContent = 'جارٍ الإنشاء…';
      var r = await c.rpc('provision_restaurant', {
        p_name: name,
        p_slug: slug,
        p_branch_name: branch || 'الفرع الرئيسي',
        p_owner_user_id: ownerId,
        p_branch_slug: 'main'
      });
      if (r.error) {
        if (msg) msg.textContent = 'فشل: ' + (r.error.message || 'غير مصرح أو بيانات غير صالحة');
        return;
      }
      if (msg) msg.textContent = 'تم إنشاء المطعم: ' + ((r.data && r.data.slug) || slug) + ' — المالك يمكنه تسجيل الدخول الآن.';
      var n = document.getElementById('opName'); if (n) n.value = '';
      var s = document.getElementById('opSlug'); if (s) s.value = '';
      var o = document.getElementById('opOwnerId'); if (o) o.value = '';
    };
  }

  function watchAuth() {
    var c = client();
    if (!c || watching) return;
    watching = true;
    try {
      c.auth.onAuthStateChange(function () {
        refreshOperatorPanel();
      });
    } catch (e) {}
  }

  function boot() {
    if (!client()) return false;
    watchAuth();
    refreshOperatorPanel();
    return true;
  }

  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    if (boot() || tries >= 60) clearInterval(timer);
  }, 500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { boot(); }, { once: true });
  } else {
    boot();
  }

  window.addEventListener('load', function () {
    setTimeout(refreshOperatorPanel, 300);
    setTimeout(refreshOperatorPanel, 1500);
  });
})();
