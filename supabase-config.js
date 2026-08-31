// Client-safe configuration only. Publishable/anon keys are designed for browser use with RLS.
// Never replace this with a service-role key.
// Target: Menu-V2-Sandbox dedicated project (ublxptcqefujkbeepylc)
window.MENU_CONFIG = {
  supabaseUrl: 'https://ublxptcqefujkbeepylc.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ1Ymx4cHRjcWVmdWprYmVlcHlsYyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg3OTIzOTUyLCJleHAiOjIxMDM0OTk5NTJ9.ybbViFuId-D5gQMLjSpGhtU7ENHPu2sS1GN4UeoqgdI'
};

// Non-blocking owner notification hook. It never contains a secret and never affects
// the success/failure of customer submissions. The server endpoint reads the saved
// request by ID and sends the private notification to the owner.
(function installOwnerNotificationHook(){
  if (!window.supabase || window.__MENU_OWNER_NOTIFY_PATCHED__) return;
  window.__MENU_OWNER_NOTIFY_PATCHED__ = true;
  var originalCreateClient = window.supabase.createClient;
  window.supabase.createClient = function(){
    var client = originalCreateClient.apply(this, arguments);
    if (!client || !client.rpc || client.__menuOwnerRpcPatched) return client;
    client.__menuOwnerRpcPatched = true;
    var originalRpc = client.rpc.bind(client);
    client.rpc = function(fn, args){
      var promise = originalRpc(fn, args);
      if (fn !== 'submit_service_request' && fn !== 'submit_website_brief') return promise;
      promise.then(function(result){
        try{
          if(result && !result.error && result.data && result.data.id){
            fetch('/api/notify-owner', {
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body:JSON.stringify({kind:fn === 'submit_website_brief' ? 'website' : 'service', id:String(result.data.id)})
            }).catch(function(){ /* notification is intentionally non-blocking */ });
          }
        }catch(e){ /* never break the customer flow */ }
      }).catch(function(){});
      return promise;
    };
    return client;
  };
})();

(function loadMenuUxAssets() {
  function css(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }
  function js(src, onload) {
    if (document.querySelector('script[src="' + src + '"]')) {
      if (onload) onload();
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    if (onload) s.onload = onload;
    document.head.appendChild(s);
  }
  css('ux-client-owner.css');
  css('ux-menu-polish.css');
  css('ux-table-cards.css');
  js('i18n-phrases-1.js', function () {
    js('i18n-phrases-2.js', function () {
      js('i18n-phrases-3.js', function () {
        js('i18n-phrases-4.js', function () {
          js('i18n-phrases-5.js', function () {
            js('i18n.js', function () {
              js('ux-drawers.js');
              js('ux-table-cards.js');
            });
          });
        });
      });
    });
  });
})();

if (location.pathname.endsWith('/admin.html') || location.pathname.endsWith('admin.html')) {
  const loadAdminEnhancements = () => {
    ['admin-live-tenants.js', 'admin-live-write-test.js'].forEach((src) => {
      if (document.querySelector('script[data-admin-enhancement="' + src + '"]')) return;
      const s = document.createElement('script');
      s.src = src;
      s.dataset.adminEnhancement = src;
      document.body.appendChild(s);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadAdminEnhancements, { once: true });
  else loadAdminEnhancements();
}
