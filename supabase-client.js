// Shared browser client for Menu-V2-Sandbox. Load after supabase-config.js and vendor/supabase-js-2.57.4.js.
(function installMenuSupabaseClient(global) {
  'use strict';

  var client = null;
  var STORAGE_KEY = 'menu-v2-sandbox-auth-token';

  function getMenuSupabaseClient() {
    if (client) return client;

    var config = global.MENU_CONFIG;
    if (!config || !config.supabaseUrl || !config.supabaseAnonKey || !global.supabase || typeof global.supabase.createClient !== 'function') {
      return null;
    }

    client = global.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        storageKey: STORAGE_KEY,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    return client;
  }

  global.getMenuSupabaseClient = getMenuSupabaseClient;
})(window);
