/* admin-runtime/04-crud-storage.js — CRUD, availability, brand assets, branch save */
async function toggleAvailability(id){
  const s=state();
  const item=s.items.find(i=>i.id===id);
  if(!item)return;
  const next=!(item.available!==false);
  item.available=next;
  if(isLive&&adminClient&&liveTenantId&&liveUser){
    const r=await adminClient.from('products').update({is_available:next}).eq('id',id).eq('tenant_id',liveTenantId).select('id,is_available').limit(1).maybeSingle();
    if(r.error||!r.data){
      item.available=!next;
      authUi(liveUser,'تعذر تحديث التوفر: '+(r.error?.message||'لم يتم تحديث الصف'));
      render();
      return;
    }
    authUi(liveUser,next?'تم تفعيل الصنف في المنيو الحي':'تم إخفاء الصنف من المنيو الحي');
  }else{
    localStorage.setItem('menuDemoDb',JSON.stringify(db));
  }
  render();
}

function removeItem(id){
  if(!confirm('حذف هذا الصنف؟'))return;
  const s=state();
  s.items=s.items.filter(i=>i.id!==id);
  if(isLive&&adminClient&&liveTenantId&&liveUser){
    adminClient.from('products').delete().eq('id',id).eq('tenant_id',liveTenantId).then(r=>{
      if(r.error)authUi(liveUser,'فشل الحذف: '+r.error.message);
      else authUi(liveUser,'تم حذف الصنف');
    });
  }
  render();
}

function saveDb(){localStorage.setItem('menuDemoDb',JSON.stringify(db));render()}

async function uploadBrandAsset(file,kind){
  if(!isLive||!adminClient||!liveTenantId||!liveUser||!file)return null;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){
    authUi(liveUser,'الصورة يجب أن تكون JPG أو PNG أو WebP وبحجم أقل من 5MB.');
    return null;
  }
  const path=`${liveTenantId}/${kind}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'')}`;
  const upload=await adminClient.storage.from('menu-assets').upload(path,file,{upsert:true,contentType:file.type});
  if(upload.error){authUi(liveUser,'فشل الرفع: '+upload.error.message);return null}
  return adminClient.storage.from('menu-assets').getPublicUrl(path).data.publicUrl;
}
