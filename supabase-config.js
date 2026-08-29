// Client-safe configuration only. Publishable/anon keys are designed for browser use with RLS.
// Never replace this with a service-role key.
window.MENU_CONFIG = {
  supabaseUrl: 'https://ebirwuigujqosfarqmqa.supabase.co',
  supabaseAnonKey: 'sb_publishable_opa7NkYDKeKsWlvGf0gSKg_sO2d5zVW'
};

// Admin-only enhancement loaders. They must run after admin.js has initialized
// its state and event handlers; otherwise admin.js can overwrite the write-path
// handler. No Supabase configuration, schema, RPC, RLS, auth, analytics, QR,
// or security behavior is changed here.
if(location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')){
  const loadAdminEnhancements=()=>{
    ['admin-live-tenants.js','admin-live-write-fix.js'].forEach(src=>{
      if(document.querySelector(`script[data-admin-enhancement="${src}"]`))return;
      const s=document.createElement('script');
      s.src=src;
      s.dataset.adminEnhancement=src;
      document.body.appendChild(s);
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadAdminEnhancements,{once:true});
  else loadAdminEnhancements();
}
