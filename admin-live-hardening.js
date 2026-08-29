/* Menu Studio — live workspace hardening
 * UI/data orchestration only. No schema, RPC, RLS, auth, or security changes.
 */
(function(){
  const $id=id=>document.getElementById(id);
  const client=window.MENU_CONFIG&&window.supabase?.createClient
    ? window.supabase.createClient(window.MENU_CONFIG.supabaseUrl,window.MENU_CONFIG.supabaseAnonKey)
    : null;
  if(!client)return;

  async function syncTenantOptions(){
    if(!liveUser)return;
    try{
      const m=await client.from('tenant_members').select('tenant_id').eq('user_id',liveUser.id).limit(100);
      if(m.error)throw m.error;
      const ids=(m.data||[]).map(x=>x.tenant_id);
      if(!ids.length)return;
      const t=await client.from('tenants').select('id,slug,name').in('id',ids).order('name').limit(100);
      if(t.error)throw t.error;
      const select=$id('tenantSelect');
      if(!select)return;
      select.innerHTML=(t.data||[]).map(x=>`<option value="${esc(x.slug)}">${esc(x.name||x.slug)}</option>`).join('');
      if(tenant)select.value=tenant;
    }catch(err){console.warn('MenuAdminLive tenant options',err)}
  }

  async function loadTenantBySlug(slug){
    if(!liveUser||!slug)return;
    try{
      const memberships=await client.from('tenant_members').select('tenant_id,role').eq('user_id',liveUser.id).limit(100);
      if(memberships.error)throw memberships.error;
      const ids=(memberships.data||[]).map(x=>x.tenant_id);
      if(!ids.length)throw new Error('لا توجد عضوية نشاط مرتبطة بهذا الحساب.');
      const tenants=await client.from('tenants').select('id,slug,name,tagline,logo_url,cover_url,instagram_url,whatsapp,whatsapp_message_template,primary_color,secondary_color').in('id',ids).limit(100);
      if(tenants.error)throw tenants.error;
      const t=(tenants.data||[]).find(x=>String(x.slug).toLowerCase()===String(slug).toLowerCase());
      if(!t)throw new Error('هذا الحساب غير مخول بإدارة النشاط المختار.');

      const [cats,products]=await Promise.all([
        client.from('categories').select('id,sort_order,name_ar,name_en,is_active').eq('tenant_id',t.id).order('sort_order').limit(500),
        client.from('products').select('id,category_id,sort_order,name_ar,name_en,description_ar,description_en,price,currency,image_url,is_available,is_featured').eq('tenant_id',t.id).order('sort_order').limit(1000)
      ]);
      if(cats.error)throw cats.error;
      if(products.error)throw products.error;

      liveTenantId=t.id;
      authorizedTenantSlug=t.slug;
      tenant=t.slug;
      db[tenant]={brand:{
        ar:t.name||'',en:t.name||'',taglineAr:t.tagline||'',taglineEn:t.tagline||'',maps:'',
        whatsapp:t.whatsapp||'',waTemplate:t.whatsapp_message_template||'',instagram:t.instagram_url||'',
        primaryColor:t.primary_color||'#15120f',secondaryColor:t.secondary_color||'#a26a42',
        logoUrl:t.logo_url||'',coverUrl:t.cover_url||''
      },items:(products.data||[]).map(p=>({
        id:p.id,ar:p.name_ar||'',en:p.name_en||'',descAr:p.description_ar||'',descEn:p.description_en||'',
        price:Number(p.price||0),cat:p.category_id,available:p.is_available!==false,featured:!!p.is_featured,
        image_url:p.image_url||'',currency:p.currency||'SAR',sort_order:p.sort_order||0
      }))};
      catalog[tenant]={brand:db[tenant].brand,categories:(cats.data||[]).filter(c=>c.is_active!==false).map(c=>[c.id,c.name_ar||c.name_en||'—'])};
      localStorage.setItem('adminTenant',tenant);
      await syncTenantOptions();
      setLiveMode(true);
      authUi(liveUser,'تم تحميل بيانات النشاط الحية');
      await loadLiveBranches();
      render();
    }catch(err){
      console.warn(err);
      authUi(liveUser,'تعذر تحميل النشاط: '+(err.message||'خطأ غير معروف'));
    }
  }

  const tenantSelect=$id('tenantSelect');
  if(tenantSelect){
    tenantSelect.onchange=async e=>{
      if(!isLive||!liveUser){
        tenant=e.target.value;
        localStorage.setItem('adminTenant',tenant);
        selectedBranchSlug=(tenant==='almas'||tenant==='alsakhrah')?'malaz':'main';
        window.editId=null;
        render();
        return;
      }
      await loadTenantBySlug(e.target.value);
    };
  }

  const branchSelect=$id('branchSelect');
  if(branchSelect){
    branchSelect.onchange=e=>{
      const next=e.target.value;
      const found=branchList.find(b=>b.slug===next&&b.is_active!==false);
      if(!found)return;
      selectedBranchSlug=found.slug;
      localStorage.setItem('adminBranch',selectedBranchSlug);
      syncBranchUi();
      renderHealth();
    };
  }

  window.MenuAdminLive={loadTenantBySlug,syncTenantOptions};

  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(liveUser){syncTenantOptions();clearInterval(timer);}
    else if(attempts>=20)clearInterval(timer);
  },500);

  // Canonical product save lives in admin.js only.
  // Do not inject competing save handlers.
})();
