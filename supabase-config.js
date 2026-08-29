// Client-safe configuration only. Publishable/anon keys are designed for browser use with RLS.
// Never replace this with a service-role key.
window.MENU_CONFIG = {
  supabaseUrl: 'https://ebirwuigujqosfarqmqa.supabase.co',
  supabaseAnonKey: 'sb_publishable_opa7NkYDKeKsWlvGf0gSKg_sO2d5zVW'
};

// Admin-only UI enhancement loaders. They run only on admin.html and do not
// alter Supabase configuration, schema, RPC, RLS, auth, analytics, QR, or security.
if(location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')){
  ['admin-live-tenants.js','admin-live-write-fix.js'].forEach(src=>{
    const s=document.createElement('script');
    s.src=src;
    s.defer=true;
    document.head.appendChild(s);
  });
}
