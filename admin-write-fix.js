/* Menu Studio — verified live product write path
 * Frontend-only hardening. No schema/RPC/RLS/auth changes.
 */
(function(){
  const $=id=>document.getElementById(id);
  if(!$('saveItem')) return;

  $('saveItem').onclick=async()=>{
    const ar=$('ar').value.trim();
    const en=$('en').value.trim();
    const price=Number($('price').value);
    if(!ar||!en||!Number.isFinite(price)||price<0){
      authUi(liveUser,'تحقق من الاسم والسعر.');
      return;
    }

    if(!(isLive&&adminClient&&liveTenantId&&liveUser)){
      const s=state();
      const item={id:window.editId||`item-${Date.now()}`,ar,en,descAr:$('descAr').value.trim(),descEn:$('descEn').value.trim(),price,cat:$('cat').value,available:$('available').checked,featured:$('featured').checked};
      s.items=window.editId?s.items.map(i=>i.id===window.editId?item:i):[...s.items,item];
      $('editor').hidden=true;
      saveDb();
      return;
    }

    const editing=!!window.editId&&!String(window.editId).startsWith('item-')&&!String(window.editId).startsWith('live-');
    const payload={
      tenant_id:liveTenantId,
      category_id:$('cat').value||null,
      name_ar:ar,
      name_en:en,
      description_ar:$('descAr').value.trim(),
      description_en:$('descEn').value.trim(),
      price,
      is_available:$('available').checked,
      is_featured:$('featured').checked
    };
    if(editing) payload.id=window.editId;

    $('saveItem').disabled=true;
    authUi(liveUser,'جارٍ الحفظ والتحقق من Supabase…');
    try{
      let result;
      if(editing){
        result=await adminClient.from('products')
          .update(payload)
          .eq('id',window.editId)
          .eq('tenant_id',liveTenantId)
          .select('id,tenant_id,category_id,name_ar,name_en,description_ar,description_en,price,is_available,is_featured,image_url')
          .maybeSingle();
      }else{
        result=await adminClient.from('products')
          .insert(payload)
          .select('id,tenant_id,category_id,name_ar,name_en,description_ar,description_en,price,is_available,is_featured,image_url')
          .single();
      }

      if(result.error) throw result.error;
      if(!result.data) throw new Error('لم تُرجع Supabase الصف المعدّل. قد تكون المشكلة في صلاحيات الكتابة أو في RLS.');
      if(result.data.name_ar!==ar||result.data.name_en!==en||Number(result.data.price)!==price||result.data.description_ar!==payload.description_ar||result.data.description_en!==payload.description_en){
        throw new Error('Supabase أعاد بيانات لا تطابق القيم التي تم حفظها.');
      }

      const file=$('imageFile')?.files?.[0];
      if(file){
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){
          throw new Error('الصورة يجب أن تكون JPG أو PNG أو WebP وبحجم أقل من 5MB.');
        }
        const path=`${liveTenantId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'')}`;
        const upload=await adminClient.storage.from('menu-assets').upload(path,file,{upsert:true,contentType:file.type});
        if(upload.error) throw upload.error;
        const publicUrl=adminClient.storage.from('menu-assets').getPublicUrl(path).data.publicUrl;
        const imageResult=await adminClient.from('products').update({image_url:publicUrl}).eq('id',result.data.id).eq('tenant_id',liveTenantId).select('id,image_url').maybeSingle();
        if(imageResult.error) throw imageResult.error;
      }

      await loadLiveTenant();
      $('editor').hidden=true;
      window.editId=null;
      authUi(liveUser,'تم الحفظ والتحقق من البيانات في Supabase بنجاح.');
      render();
    }catch(err){
      console.error('verified product write failed',err);
      authUi(liveUser,'فشل الحفظ: '+(err.message||'خطأ غير معروف'));
    }finally{
      $('saveItem').disabled=false;
    }
  };
})();
