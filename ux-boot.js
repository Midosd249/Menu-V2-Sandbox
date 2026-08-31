(function(){
  function css(h){if(document.querySelector('link[href="'+h+'"]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.appendChild(l);}
  function js(s){if(document.querySelector('script[src="'+s+'"]'))return;var x=document.createElement('script');x.src=s;document.body.appendChild(x);}
  css('ux-client-owner.css');
  css('ux-menu-polish.css');
  if(!window.MenuI18n){js('i18n.js');}
  js('ux-drawers.js');
})();
