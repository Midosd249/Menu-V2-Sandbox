/* admin-runtime/06-init.js — event wiring + startup (load last) */
/* Navigation */
document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    const panel=$('panel-'+btn.dataset.panel);
    if(panel)panel.classList.add('active');
    if(btn.dataset.panel==='analytics'&&isLive)loadAnalytics();
  };
});

$('tenantSelect').onchange=e=>{
  if(liveUser&&authorizedTenantSlug&&e.target.value!==authorizedTenantSlug){
    e.target.value=authorizedTenantSlug;
    authUi(liveUser,'هذا الحساب غير مخول بإدارة النشاط المختار.');
    return;
  }
  tenant=e.target.value;
  localStorage.setItem('adminTenant',tenant);
  selectedBranchSlug=(tenant==='almas'||tenant==='alsakhrah')?'malaz':'main';
  localStorage.setItem('adminBranch',selectedBranchSlug);
  window.editId=null;
  if(!isLive){
    branchList=[{id:'demo-'+selectedBranchSlug,slug:selectedBranchSlug,name:selectedBranchSlug==='malaz'?'فرع الملز':'الفرع الرئيسي',address:'الرياض',maps:'https://maps.google.com/?q=Riyadh',is_active:true}];
  }
  render();
};

$('saveBrand').onclick=async()=>{
  if(isLive&&memberRole==='editor'){authUi(liveUser,'صلاحية المحرر لا تسمح بتعديل الهوية.');return;}
  const s=state();
  s.brand={
    ...s.brand,
    ar:$('brandAr').value.trim(),
    en:$('brandEn').value.trim(),
    taglineAr:$('taglineAr').value.trim(),
    taglineEn:$('taglineEn').value.trim(),
    maps:$('maps').value.trim(),
    whatsapp:$('whatsapp').value.trim(),
    waTemplate:$('waTemplate').value.trim(),
    instagram:$('instagram').value.trim(),
    primaryColor:$('primaryColor').value,
    secondaryColor:$('secondaryColor').value,
    logoUrl:$('logoUrl').value.trim(),
    coverUrl:$('coverUrl').value.trim()
  };
  if(!s.brand.ar||!s.brand.en){alert('أدخل اسم النشاط بالعربية والإنجليزية');return}
  if(isLive&&adminClient&&liveTenantId&&liveUser){
    const payload={
      name:s.brand.ar,
      tagline:s.brand.taglineAr,
      whatsapp:s.brand.whatsapp,
      instagram_url:s.brand.instagram||null,
      logo_url:s.brand.logoUrl||null,
      cover_url:s.brand.coverUrl||null,
      primary_color:s.brand.primaryColor,
      secondary_color:s.brand.secondaryColor,
      whatsapp_message_template:s.brand.waTemplate||null
    };
    const r=await adminClient.from('tenants').update(payload).eq('id',liveTenantId);
    if(r.error)authUi(liveUser,'فشل حفظ الهوية: '+r.error.message);
    else authUi(liveUser,'تم حفظ الهوية في البيانات الحية');
  }else saveDb();
  render();
};

$('addItem').onclick=()=>{
  window.editId=null;
  $('editorTitle').textContent='إضافة صنف';
  ['ar','en','descAr','descEn','price'].forEach(id=>$(id).value='');
  $('available').checked=true;$('featured').checked=false;
  if($('imageFile'))$('imageFile').value='';
  if($('imageUrlInput'))$('imageUrlInput').value='';
  if($('imagePreviewBox'))$('imagePreviewBox').hidden=true;
  $('editor').hidden=false;$('editor').scrollIntoView({behavior:'smooth'});$('ar').focus();
};

function previewProductImage(url,label){
  const box=$('imagePreviewBox'),img=$('imagePreview'),caption=$('imagePreviewLabel');
  if(!box||!img)return;
  if(!url){box.hidden=true;img.removeAttribute('src');return;}
  img.onerror=()=>{box.hidden=true};
  img.onload=()=>{box.hidden=false};
  img.src=url;
  if(caption)caption.textContent=label||'معاينة الصورة';
}
$('imageUrlInput')?.addEventListener('input',e=>{
  const url=e.target.value.trim();
  if(!url){previewProductImage('');return;}
  try{const parsed=new URL(url);if(parsed.protocol!=='http:'&&parsed.protocol!=='https:')throw new Error();previewProductImage(url,'معاينة الرابط');}
  catch(err){previewProductImage('');}
});
$('imageFile')?.addEventListener('change',e=>{
  const file=e.target.files?.[0];
  if(file&&!$('imageUrlInput')?.value.trim())previewProductImage(URL.createObjectURL(file),file.name);
});

/* Canonical product save — single handler. Live mode never falls back to localStorage. */
$('saveItem').onclick=async function saveItemCanonical(){
const btn=$('saveItem');
  const ar=$('ar').value.trim(),en=$('en').value.trim(),price=Number($('price').value);
  if(!ar||!en||!Number.isFinite(price)||price<0){alert('تحقق من الاسم والسعر');return}
  const item={
    id:window.editId||null,
    ar,en,
    descAr:$('descAr').value.trim(),
    descEn:$('descEn').value.trim(),
    price,cat:$('cat').value,
    available:$('available').checked,
    featured:$('featured').checked,
    image_url:$('imageUrlInput')?.value.trim()||null
  };
  if(item.image_url){try{const parsed=new URL(item.image_url);if(parsed.protocol!=='http:'&&parsed.protocol!=='https:')throw new Error();}catch(err){alert('رابط الصورة يجب أن يبدأ بـ http أو https.');return}}

  // Demo / offline path only when not in live mode
  if(!(isLive&&adminClient&&liveTenantId&&liveUser)){
    const s=state();
    const localId=window.editId||`item-${Date.now()}`;
    item.id=localId;
    s.items=window.editId?s.items.map(i=>i.id===window.editId?item:i):[...s.items,item];
    $('editor').hidden=true;
    saveDb();
    render();
    return;
  }

  // Live path — must succeed against Supabase before mutating UI
  const prevLabel=btn.textContent;
  btn.disabled=true;
  btn.textContent='جارٍ الحفظ...';
  const payload={
    category_id:item.cat||null,
    name_ar:item.ar,
    name_en:item.en,
    description_ar:item.descAr||null,
    description_en:item.descEn||null,
    price:item.price,
    is_available:!!item.available,
    is_featured:!!item.featured,
    image_url:item.image_url,
    updated_at:new Date().toISOString()
  };

  const isExisting=window.editId&&!String(window.editId).startsWith('item-')&&!String(window.editId).startsWith('live-');

  try{
    let savedId=null;

    if(isExisting){
      // Explicit UPDATE of the existing row — never upsert
      const r=await adminClient.from('products')
        .update(payload)
        .eq('id',window.editId)
        .eq('tenant_id',liveTenantId)
        .select('id,name_ar,name_en,description_ar,description_en,price,is_available,is_featured,category_id,updated_at')
        .limit(1)
        .maybeSingle();

      if(r.error){
        authUi(liveUser,'فشل حفظ الصنف: '+r.error.message);
        btn.disabled=false;btn.textContent=prevLabel;
        return; // keep editor open
      }
      if(!r.data||!r.data.id){
        authUi(liveUser,'فشل الحفظ: لم يتم تحديث أي صف (تحقق من الصلاحيات أو المعرّف).');
        btn.disabled=false;btn.textContent=prevLabel;
        return;
      }

      // Re-fetch and field-verify
      const verify=await adminClient.from('products')
        .select('id,name_ar,description_ar,price,updated_at')
        .eq('id',window.editId)
        .eq('tenant_id',liveTenantId)
        .limit(1)
        .maybeSingle();

      if(verify.error||!verify.data){
        authUi(liveUser,'تم الإرسال لكن تعذر التحقق من الصف: '+(verify.error?.message||'لا بيانات'));
        btn.disabled=false;btn.textContent=prevLabel;
        return;
      }
      if(String(verify.data.name_ar||'')!==item.ar||Number(verify.data.price)!==Number(item.price)||String(verify.data.description_ar||'')!==String(item.descAr||'')){
        authUi(liveUser,'فشل التحقق: القيم في قاعدة البيانات لا تطابق التعديل.');
        btn.disabled=false;btn.textContent=prevLabel;
        return;
      }
      savedId=verify.data.id;
    }else{
      // INSERT new product
      const insertPayload={...payload,tenant_id:liveTenantId};
      const r=await adminClient.from('products')
        .insert(insertPayload)
        .select('id,name_ar,price,description_ar')
        .limit(1)
        .maybeSingle();

      if(r.error){
        authUi(liveUser,'فشل إضافة الصنف: '+r.error.message);
        btn.disabled=false;btn.textContent=prevLabel;
        return;
      }
      if(!r.data?.id){
        authUi(liveUser,'فشل الإضافة: لم يُرجع معرّف الصنف.');
        btn.disabled=false;btn.textContent=prevLabel;
        return;
      }
      savedId=r.data.id;
    }

    item.id=savedId;

    // Optional image upload after successful row write
    const file=$('imageFile')?.files?.[0];
    if(file&&!item.image_url){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){
        authUi(liveUser,'الصورة يجب أن تكون JPG أو PNG أو WebP وبحجم أقل من 5MB.');
      }else{
        const optimizedFile=typeof window.optimizeProductImage==='function'?await window.optimizeProductImage(file):file;
        const path=`${liveTenantId}/products/${crypto.randomUUID()}-${optimizedFile.name}`;
        const upload=await adminClient.storage.from('menu-assets').upload(path,optimizedFile,{upsert:true,contentType:optimizedFile.type});
        if(upload.error){
          authUi(liveUser,'تم حفظ الصنف لكن فشل رفع الصورة: '+upload.error.message);
        }else{
          const publicUrl=adminClient.storage.from('menu-assets').getPublicUrl(path).data.publicUrl;
          const imgUp=await adminClient.from('products').update({image_url:publicUrl,updated_at:new Date().toISOString()}).eq('id',savedId).eq('tenant_id',liveTenantId);
          if(!imgUp.error)item.image_url=publicUrl;
        }
      }
    }

    // Only after DB confirmation: reload live state and close editor
    await loadLiveTenant();
    authUi(liveUser,'تم حفظ الصنف في البيانات الحية');
    $('editor').hidden=true;
    if($('imageFile'))$('imageFile').value='';
    if($('imageUrlInput'))$('imageUrlInput').value='';
    if($('imagePreviewBox'))$('imagePreviewBox').hidden=true;
    window.editId=null;
    render();
  }catch(err){
    console.error('saveItemCanonical',err);
    authUi(liveUser,'خطأ غير متوقع أثناء الحفظ: '+(err.message||String(err)));
    // keep editor open
  }finally{
    btn.disabled=false;
    btn.textContent=prevLabel||'حفظ الصنف';
  }
};


$('cancel').onclick=()=>{$('editor').hidden=true};

$('logoFile')?.addEventListener('change',async e=>{
  const url=await uploadBrandAsset(e.target.files?.[0],'logo');
  if(url){$('logoUrl').value=url;state().brand.logoUrl=url;authUi(liveUser,'تم رفع الشعار');render()}
});
$('coverFile')?.addEventListener('change',async e=>{
  const url=await uploadBrandAsset(e.target.files?.[0],'cover');
  if(url){$('coverUrl').value=url;state().brand.coverUrl=url;authUi(liveUser,'تم رفع الغلاف');render()}
});

/* QR */
$('qrBtn').onclick=async()=>{
  try{
    if(!window.QRCode?.toCanvas)throw new Error('QR library unavailable');
    $('qrBox').hidden=false;
    await window.QRCode.toCanvas($('qrCanvas'),publicUrl(),{width:240,margin:2,color:{dark:'#15120f',light:'#ffffff'}});
    $('downloadQrBtn').hidden=false;
    if($('qrCaption'))$('qrCaption').textContent=`QR · ${tenant} · ${selectedBranchSlug}`;
  }catch(err){
    $('qrBox').hidden=true;
    alert('تعذر إنشاء QR الآن');
  }
};
$('downloadQrBtn').onclick=()=>{
  const a=document.createElement('a');
  a.download=`menu-${tenant}-${selectedBranchSlug}.png`;
  a.href=$('qrCanvas').toDataURL('image/png');
  a.click();
};
$('copyBtn').onclick=async()=>{
  try{await navigator.clipboard.writeText(publicUrl());alert('تم نسخ الرابط')}catch{alert(publicUrl())}
};

$('branchSelect').onchange=e=>{
  selectedBranchSlug=e.target.value;
  localStorage.setItem('adminBranch',selectedBranchSlug);
  syncBranchUi();
};
$('saveBranch').onclick=async()=>{
  const b=branchList.find(x=>x.slug===selectedBranchSlug)||branchList[0];
  if(!b)return;
  b.name=$('branchNameInput').value.trim();
  b.address=$('branchAddress').value.trim();
  b.maps=$('branchMaps').value.trim();
  b.maps_url=b.maps;
  if(isLive&&adminClient&&liveTenantId&&liveUser){
    const payload={
      tenant_id:liveTenantId,
      slug:b.slug,
      name:b.name,
      address:b.address,
      maps_url:b.maps,
      is_active:true
    };
    if(b.id&&!String(b.id).startsWith('demo-'))payload.id=b.id;
    const r=await adminClient.from('branches').upsert(payload).select('id,slug,name,address,maps_url,is_active').limit(1).maybeSingle();
    if(r.error){authUi(liveUser,'تعذر حفظ الفرع: '+r.error.message);return}
    if(r.data)Object.assign(b,r.data);
    authUi(liveUser,'تم حفظ بيانات الفرع');
  }else{
    saveDb();
    alert('تم حفظ بيانات الفرع محليًا');
  }
  syncBranchUi();
  renderHealth();
};

/* Analytics period pills */
document.querySelectorAll('.pill[data-days]').forEach(p=>{
  p.onclick=()=>{
    document.querySelectorAll('.pill[data-days]').forEach(x=>x.classList.remove('active'));
    p.classList.add('active');
    analyticsDays=Number(p.dataset.days)||7;
    if(isLive)loadAnalytics();
  };
});

$('loginBtn').onclick=async()=>{
  if(!adminClient){authUi(null,'إعداد Supabase غير متوفر.');return}
  const email=$('authEmail').value.trim(),password=$('authPassword').value;
  if(!email||!password){authUi(null,'أدخل البريد الإلكتروني وكلمة المرور.');return}
  $('authMessage').textContent='جارٍ تسجيل الدخول…';
  const r=await adminClient.auth.signInWithPassword({email,password});
  if(r.error){authUi(null,r.error.message);return}
  authUi(r.data.user);
  await loadLiveTenant();
};
$('logoutBtn').onclick=async()=>{
  if(adminClient)await adminClient.auth.signOut();
  liveTenantId=null;authorizedTenantSlug=null;memberRole=null;
  setLiveMode(false);
  authUi(null,'تم تسجيل الخروج.');
  render();
};

if(adminClient){
  adminClient.auth.getSession().then(async r=>{
    if(r.data.session){authUi(r.data.session.user);await loadLiveTenant()}
  });
  adminClient.auth.onAuthStateChange((_e,session)=>{if(!session){setLiveMode(false);authUi(null)}});
}

branchList=[{id:'demo-'+((tenant==='almas'||tenant==='alsakhrah')?'malaz':'main'),slug:(tenant==='almas'||tenant==='alsakhrah')?'malaz':'main',name:(tenant==='almas'||tenant==='alsakhrah')?'فرع الملز':'الفرع الرئيسي',address:'الرياض',maps:'https://maps.google.com/?q=Riyadh',is_active:true}];
selectedBranchSlug=branchList[0].slug;
setLiveMode(false);
render();
