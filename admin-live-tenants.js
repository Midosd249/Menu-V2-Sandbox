/* Menu Studio — live tenant selector enhancement
   UI/data-binding only. Reads memberships and tenants; does not change schema, RPC, RLS, auth, or security. */
(function(){
  const select=()=>document.getElementById('tenantSelect');
  const escLocal=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  let liveOptions=[];
  let syncing=false;

  async function loadAuthorizedTenants(){
    if(!window.supabase || typeof adminClient==='undefined' || !adminClient || typeof liveUser==='undefined' || !liveUser)return false;
    const m=await adminClient.from('tenant_members').select('tenant_id,role').eq('user_id',liveUser.id).limit(50);
    if(m.error || !m.data?.length)return false;
    const ids=m.data.map(x=>x.tenant_id).filter(Boolean);
    const t=await adminClient.from('tenants').select('id,slug,name').in('id',ids).limit(50);
    if(t.error || !t.data?.length)return false;
    liveOptions=t.data.map(row=>({id:row.id,slug:String(row.slug||''),name:row.name||row.slug||'—'})).filter(x=>x.slug);
    const el=select();
    if(!el)return false;
    const current=String(typeof tenant!=='undefined'?tenant:'');
    el.innerHTML=liveOptions.map(x=>`<option value="${escLocal(x.slug)}">${escLocal(x.name)} · ${escLocal(x.slug)}</option>`).join('');
    const preferred=(localStorage.getItem('adminTenant')||current).trim().toLowerCase();
    const chosen=liveOptions.find(x=>x.slug.toLowerCase()===preferred)||liveOptions[0];
    if(chosen){
      syncing=true;
      el.value=chosen.slug;
      syncing=false;
      localStorage.setItem('adminTenant',chosen.slug);
    }
    return true;
  }

  function bindSelector(){
    const el=select();
    if(!el || el.dataset.liveTenantBound==='1')return;
    el.dataset.liveTenantBound='1';
    el.onchange=async function(e){
      const value=e.target.value;
      if(syncing)return;
      if(typeof liveUser!=='undefined' && liveUser){
        const allowed=liveOptions.some(x=>x.slug===value);
        if(!allowed){
          e.target.value=typeof tenant!=='undefined'?tenant:value;
          if(typeof authUi==='function')authUi(liveUser,'هذا الحساب غير مخول بإدارة النشاط المختار.');
          return;
        }
        localStorage.setItem('adminTenant',value);
        window.editId=null;
        if(typeof selectedBranchSlug!=='undefined'){
          selectedBranchSlug=(value==='almas'||value==='alsakhrah')?'malaz':'main';
          localStorage.setItem('adminBranch',selectedBranchSlug);
        }
        if(typeof loadLiveTenant==='function')await loadLiveTenant();
        return;
      }
      tenant=value;
      localStorage.setItem('adminTenant',tenant);
      selectedBranchSlug=(tenant==='almas'||tenant==='alsakhrah')?'malaz':'main';
      localStorage.setItem('adminBranch',selectedBranchSlug);
      window.editId=null;
      branchList=[{id:'demo-'+selectedBranchSlug,slug:selectedBranchSlug,name:selectedBranchSlug==='malaz'?'فرع الملز':'الفرع الرئيسي',address:'الرياض',maps:'https://maps.google.com/?q=Riyadh',is_active:true}];
      render();
    };
  }

  async function boot(){
    bindSelector();
    if(typeof liveUser!=='undefined' && liveUser){
      const ok=await loadAuthorizedTenants();
      if(ok && typeof loadLiveTenant==='function')await loadLiveTenant();
    }
  }

  let attempts=0;
  const retry=setInterval(async()=>{
    attempts++;
    bindSelector();
    if(typeof liveUser!=='undefined' && liveUser){
      clearInterval(retry);
      await boot();
    }else if(attempts>=30){
      clearInterval(retry);
    }
  },500);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
