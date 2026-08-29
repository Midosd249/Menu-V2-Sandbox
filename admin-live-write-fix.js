/* Menu Studio — live write-path hardening
 * Frontend-only guard for authenticated product writes.
 * Does not change schema, RPC, RLS, auth, analytics, QR, or security.
 */
(function(){
  const $id=id=>document.getElementById(id);
  const notify=(message)=>{
    if(typeof authUi==='function' && typeof liveUser!=='undefined') authUi(liveUser,message);
    else console.warn(message);
  };

  async function saveLiveProduct(){
    if(typeof isLive==='undefined' || !isLive || !adminClient || !liveTenantId || !liveUser){
      return false;
    }

    const ar=$id('ar')?.value.trim()||'';
    const en=$id('en')?.value.trim()||'';
    const price=Number($id('price')?.value);
    if(!ar||!en||!Number.isFinite(price)||price<0){
      alert('تحقق من الاسم والسعر');
      return true;
    }

    const editingId=window.editId;
    const payload={
      tenant_id:liveTenantId,
      category_id:$id('cat')?.value||null,
      name_ar:ar,
      name_en:en,
      description_ar:$id('descAr')?.value.trim()||'',
      description_en:$id('descEn')?.value.trim()||'',
      price,
      is_available:!!$id('available')?.checked,
      is_featured:!!$id('featured')?.checked
    };

    let result;
    if(editingId && !String(editingId).startsWith('item-') && !String(editingId).startsWith('live-')){
      // Explicit UPDATE for existing rows. This avoids upsert ambiguity and lets us
      // verify that the authenticated tenant member actually changed the intended row.
      result=await adminClient.from('products')
        .update(payload)
        .eq('id',editingId)
        .eq('tenant_id',liveTenantId)
        .select('id,tenant_id,category_id,name_ar,name_en,description_ar,description_en,price,is_available,is_featured,image_url')
        .single();
    }else{
      result=await adminClient.from('products')
        .insert(payload)
        .select('id,tenant_id,category_id,name_ar,name_en,description_ar,description_en,price,is_available,is_featured,image_url')
        .single();
    }

    if(result.error){
      notify('فشل حفظ الصنف في Supabase: '+result.error.message);
      return true;
    }
    if(!result.data?.id){
      notify('تعذر التحقق من حفظ الصنف في Supabase.');
      return true;
    }

    const savedId=result.data.id;

    // Verify the persisted row before telling the owner that the write succeeded.
    const verify=await adminClient.from('products')
      .select('id,name_ar,name_en,description_ar,description_en,price,is_available,is_featured,image_url,updated_at')
      .eq('id',savedId)
      .eq('tenant_id',liveTenantId)
      .single();
    if(verify.error){
      notify('تمت الكتابة لكن تعذر التحقق منها: '+verify.error.message);
      return true;
    }
    if(verify.data.name_ar!==ar || verify.data.name_en!==en ||
       String(verify.data.description_ar||'')!==String(payload.description_ar||'') ||
       String(verify.data.description_en||'')!==String(payload.description_en||'') ||
       Number(verify.data.price)!==price ||
       Boolean(verify.data.is_available)!==Boolean(payload.is_available) ||
       Boolean(verify.data.is_featured)!==Boolean(payload.is_featured)){
      notify('لم يتطابق الحفظ مع البيانات المرسلة؛ لم يتم اعتبار العملية ناجحة.');
      return true;
    }

    const file=$id('imageFile')?.files?.[0];
    if(file){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){
        notify('الصورة يجب أن تكون JPG أو PNG أو WebP وبحجم أقل من 5MB.');
        return true;
      }
      const path=`${liveTenantId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'')}`;
      const upload=await adminClient.storage.from('menu-assets').upload(path,file,{upsert:true,contentType:file.type});
      if(upload.error){
        notify('تم حفظ الصنف لكن فشل رفع الصورة: '+upload.error.message);
        return true;
      }
      const imageUrl=adminClient.storage.from('menu-assets').getPublicUrl(path).data.publicUrl;
      const imageUpdate=await adminClient.from('products')
        .update({image_url:imageUrl})
        .eq('id',savedId)
        .eq('tenant_id',liveTenantId)
        .select('id,image_url')
        .single();
      if(imageUpdate.error){
        notify('تم حفظ الصنف لكن فشل ربط الصورة: '+imageUpdate.error.message);
        return true;
      }
    }

    if(typeof loadLiveTenant==='function') await loadLiveTenant();
    if($id('editor'))$id('editor').hidden=true;
    notify('تم حفظ الصنف والتحقق منه في Supabase بنجاح.');
    if(typeof render==='function')render();
    return true;
  }

  function install(){
    const button=$id('saveItem');
    if(!button || typeof adminClient==='undefined'){
      setTimeout(install,250);
      return;
    }
    button.onclick=async()=>{
      const handled=await saveLiveProduct();
      if(handled)return;
      // Preserve the original demo-mode handler when not in live mode.
      const s=typeof state==='function'?state():null;
      const ar=$id('ar')?.value.trim()||'',en=$id('en')?.value.trim()||'',price=Number($id('price')?.value);
      if(!ar||!en||!Number.isFinite(price)||price<0){alert('تحقق من الاسم والسعر');return}
      if(s){
        const item={id:window.editId||`item-${Date.now()}`,ar,en,descAr:$id('descAr')?.value.trim()||'',descEn:$id('descEn')?.value.trim()||'',price,cat:$id('cat')?.value,available:!!$id('available')?.checked,featured:!!$id('featured')?.checked};
        s.items=window.editId?s.items.map(i=>i.id===window.editId?item:i):[...s.items,item];
        if(typeof saveDb==='function')saveDb();
        if($id('editor'))$id('editor').hidden=true;
      }
    };
  }

  install();
})();
