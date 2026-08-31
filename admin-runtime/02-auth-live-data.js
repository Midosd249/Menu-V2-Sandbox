/* admin-runtime/02-auth-live-data.js — auth + live tenant/branch load */
function authUi(user,message=''){
  liveUser=user||null;
  if(!user){ memberRole=null; }
  if($('authState')){
    $('authState').textContent=user?'مسجل دخول':'غير مسجل';
    $('authState').classList.toggle('closed',!user);
  }
  if($('loginBtn'))$('loginBtn').hidden=!!user;
  if($('logoutBtn'))$('logoutBtn').hidden=!user;
  if($('authMessage'))$('authMessage').textContent=message||(user?`مرحبًا ${user.email}`:'');
  applyRoleUi();
}

async function loadLiveBranches(){
  if(!adminClient||!liveTenantId||!liveUser)return;
  const r=await adminClient.from('branches').select('id,slug,name,address,maps_url,is_active').eq('tenant_id',liveTenantId).order('created_at').limit(100);
  if(!r.error&&r.data?.length){
    branchList=r.data;
    selectedBranchSlug=localStorage.getItem('adminBranch')||r.data[0].slug;
    if(!branchList.some(b=>b.slug===selectedBranchSlug))selectedBranchSlug=r.data[0].slug;
    syncBranchUi();
  }
}

async function loadLiveTenant(){
  if(!adminClient||!liveUser)return;
  const m=await adminClient.from('tenant_members').select('tenant_id,role').eq('user_id',liveUser.id).limit(20);
  if(!m.data?.length){
    authUi(liveUser,'لا توجد عضوية مستأجر مرتبطة بهذا الحساب.');
    setLiveMode(false);
    return;
  }
  // Prefer previously selected tenant slug when the user has membership for it; otherwise first membership.
  // Roles are loaded and enforced in UI (editor limited). RLS remains the real boundary after migration.
  const preferredSlug=(localStorage.getItem('adminTenant')||'').trim().toLowerCase();
  let membership=m.data[0];
  if(preferredSlug){
    const preferredRows=await adminClient.from('tenants').select('id,slug').in('id',m.data.map(x=>x.tenant_id)).limit(20);
    const match=(preferredRows.data||[]).find(t=>String(t.slug||'').toLowerCase()===preferredSlug);
    if(match){
      const hit=m.data.find(x=>x.tenant_id===match.id);
      if(hit)membership=hit;
    }
  }
  liveTenantId=membership.tenant_id;
  memberRole=(membership.role||'editor').toLowerCase();
  if(!['owner','admin','editor'].includes(memberRole)) memberRole='editor';
  const t=await adminClient.from('tenants').select('id,slug,name,tagline,logo_url,cover_url,instagram_url,whatsapp,whatsapp_message_template,primary_color,secondary_color').eq('id',liveTenantId).limit(1).maybeSingle();
  const cats=await adminClient.from('categories').select('id,sort_order,name_ar,name_en,is_active').eq('tenant_id',liveTenantId).order('sort_order').limit(100);
  const products=await adminClient.from('products').select('id,category_id,name_ar,name_en,description_ar,description_en,price,image_url,is_available,is_featured').eq('tenant_id',liveTenantId).order('sort_order').limit(500);
  if(t.error||cats.error||products.error){
    authUi(liveUser,'تعذر تحميل بيانات النشاط الحية.');
    return;
  }
  const slug=t.data.slug;
  authorizedTenantSlug=slug;
  tenant=slug;
  db[tenant]={
    brand:{
      ar:t.data.name,
      en:t.data.name,
      taglineAr:t.data.tagline||'',
      taglineEn:t.data.tagline||'',
      maps:'',
      whatsapp:t.data.whatsapp||'',
      waTemplate:t.data.whatsapp_message_template||'',
      instagram:t.data.instagram_url||'',
      primaryColor:t.data.primary_color||'#15120f',
      secondaryColor:t.data.secondary_color||'#a26a42',
      logoUrl:t.data.logo_url||'',
      coverUrl:t.data.cover_url||''
    },
    items:(products.data||[]).map(p=>({
      id:p.id,
      ar:p.name_ar,
      en:p.name_en,
      descAr:p.description_ar||'',
      descEn:p.description_en||'',
      price:Number(p.price),
      cat:p.category_id,
      available:p.is_available,
      featured:p.is_featured,
      image_url:p.image_url||''
    }))
  };
  catalog[tenant]={
    brand:db[tenant].brand,
    categories:(cats.data||[]).map(c=>[c.id,c.name_ar])
  };
  localStorage.setItem('adminTenant',tenant);
  setLiveMode(true);
  authUi(liveUser,'تم تحميل البيانات الحية');
  await loadLiveBranches();
  render();
}
