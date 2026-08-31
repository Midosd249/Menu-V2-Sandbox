/* Defense-in-depth UI gate for the legacy operator workspace.
   Database authorization remains authoritative through Supabase RLS/RPCs. */
(function () {
  'use strict';
  const lock = () => document.documentElement.classList.add('admin-locked');
  const unlock = () => document.documentElement.classList.remove('admin-locked');
  lock();

  async function verify() {
    if (!window.MENU_CONFIG || !window.supabase?.createClient) return;
    const client = window.supabase.createClient(window.MENU_CONFIG.supabaseUrl, window.MENU_CONFIG.supabaseAnonKey);
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData?.session?.user) return;
    const { data: isOperator, error } = await client.rpc('is_platform_operator');
    if (!error && isOperator === true) unlock();
  }

  function boot() {
    verify().catch(() => lock());
    if (window.supabase?.createClient && window.MENU_CONFIG) {
      const client = window.supabase.createClient(window.MENU_CONFIG.supabaseUrl, window.MENU_CONFIG.supabaseAnonKey);
      client.auth.onAuthStateChange(() => { verify().catch(() => lock()); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
