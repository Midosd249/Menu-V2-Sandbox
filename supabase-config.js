// Client-safe configuration only. Publishable/anon keys are designed for browser use with RLS.
// Never replace this with a service-role key.
// Target: Menu-V2-Sandbox dedicated project (ublxptcqefujkbeepylc)
window.MENU_CONFIG = {
  supabaseUrl: 'https://ublxptcqefujkbeepylc.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVibHhwdGNxZWZ1amtiZWVweWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjM5NTIsImV4cCI6MjEwMzQ5OTk1Mn0.ybbViFuId-D5gQMLjSpGhtU7ENHPu2sS1GN4UeoqgdI'
};

// Admin-only enhancement loaders.
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
