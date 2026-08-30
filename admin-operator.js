/* Menu Studio — operator provisioning + multi-membership selector hardening
   Authorization is server-side only (is_platform_operator / provision_restaurant). */
(function(){
  if(typeof authorizedTenantSlugs==='undefined'){ window.authorizedTenantSlugs=[]; }

  async function refreshOperatorPanel(){
    const card=document.getElementById('operatorProvisionCard');
    if(!card||typeof adminClient==='undefined'||!adminClient||typeof liveUser==='undefined'||!liveUser){
      if(card)card.hidden=true;return;
    }
    try{
      const r=await adminClient.rpc('is_platform_operator');
      card.hidden=!(r.data===true);
    }catch(e){card.hidden=true}
  }

  function wrapLoadLiveTenant(){
    if(typeof loadLiveTenant!=='function'||loadLiveTenant.__operatorWrapped)return;
    const orig=loadLiveTenant;
    loadLiveTenant=async function(){
      await orig.apply(this,arguments);
      try{
        if(adminClient&&liveUser){
          const m=await adminClient.from('tenant_members').select('tenant_id').eq('user_id',liveUser.id).limit(50);
          if(m.data&&m.data.length){
            const t=await adminClient.from('tenants').select('id,slug,name').in('id',m.data.map(x=>x.tenant_id)).limit(50);
            const rows=t.data||[];
            if(typeof authorizedTenantSlugs!=='undefined'){
              authorizedTenantSlugs=rows.map(r=>String(r.slug||'')).filter(Boolean);
            }
            const sel=document.getElementById('tenantSelect');
            if(sel&&rows.length){
              const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
              sel.innerHTML=rows.map(r=>`<option value="${esc(r.slug)}">${esc(r.name||r.slug)} · ${esc(r.slug)}</option>`).join('');
              sel.disabled=rows.length===1;
              if(typeof authorizedTenantSlug!=='undefined'&&authorizedTenantSlug)sel.value=authorizedTenantSlug;
            }
          }
        }
      }catch(e){}
      await refreshOperatorPanel();
    };
    loadLiveTenant.__operatorWrapped=true;
  }

  function bindProvision(){
    const btn=document.getElementById('opProvisionBtn');
    if(!btn||btn.dataset.bound==='1')return;
    btn.dataset.bound='1';
    btn.onclick=async()=>{
      if(typeof adminClient==='undefined'||!adminClient||typeof liveUser==='undefined'||!liveUser)return;
      const msg=document.getElementById('opProvisionMsg');
      const name=(document.getElementById('opName')?.value||'').trim();
      const slug=(document.getElementById('opSlug')?.value||'').trim().toLowerCase();
      const branch=(document.getElementById('opBranch')?.value||'').trim();
      const ownerId=(document.getElementById('opOwnerId')?.value||'').trim();
      if(msg)msg.textContent='جارٍ الإنشاء…';
      const r=await adminClient.rpc('provision_restaurant',{
        p_name:name,
        p_slug:slug,
        p_branch_name:branch||'الفرع الرئيسي',
        p_owner_user_id:ownerId,
        p_branch_slug:'main'
      });
      if(r.error){
        if(msg)msg.textContent='فشل: '+(r.error.message||'غير مصرح أو بيانات غير صالحة');
        return;
      }
      if(msg)msg.textContent='تم إنشاء المطعم: '+(r.data?.slug||slug)+' — المالك يمكنه تسجيل الدخول الآن.';
      const n=document.getElementById('opName'); if(n)n.value='';
      const s=document.getElementById('opSlug'); if(s)s.value='';
      const o=document.getElementById('opOwnerId'); if(o)o.value='';
    };
  }

  function boot(){
    wrapLoadLiveTenant();
    bindProvision();
    if(typeof liveUser!=='undefined'&&liveUser){
      wrapLoadLiveTenant();
      refreshOperatorPanel();
    }
  }

  let tries=0;
  const t=setInterval(()=>{
    tries++;
    boot();
    if((typeof loadLiveTenant==='function'&&loadLiveTenant.__operatorWrapped)||tries>40)clearInterval(t);
  },400);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
