/* Menu Studio full local source — assembled from admin.src.*.js (no CDN) */
(function(){
  function run(){
    var parts = window.__MENU_ADMIN_SRC || [];
    if (!parts.length) { console.error('[Menu] admin source missing'); return; }
    var code = parts.join('');
    var s = document.createElement('script');
    s.text = code;
    document.head.appendChild(s);
  }
  setTimeout(run, 0);
})();
