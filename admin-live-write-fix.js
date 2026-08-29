/* Menu Studio — verified live write path
 * Frontend-only guard for authenticated product writes.
 * Does not change schema, RPC, RLS, auth, analytics, QR, or security.
 */
(function(){
  const $id=id=>document.getElementById(id);
  const originalLabel='حفظ الصنف';
  let saving=false;

  function setStatus(message,kind='info'){
    const editor=$id('editor');
    if(!editor)return;
    let box=$id('editorSaveStatus');
    if(!box){
      box=document.createElement('div');
      box.id='editorSaveStatus';
      box.setAttribute('role','status');
      box.style.cssText='margin:12px 0;padding:10px 12px;border-radius:10px;font-size:14px;line-height:1.6;border:1px solid currentColor;';
      const button=$id('saveItem');
      if(button?.parentNode)button.parentNode.insertBefore(box,button);
      else editor.appendChild(box);
    }
    box.textContent=message;
    box.hidden=!message;
    box.dataset.kind=kind;
  }

  function setButtonBusy(on){
    const button=$id('saveItem');
    if(!button)return;
    button.disabled=!!on;
    button.textContent=on?'جارٍ الحفظ والتحقق…':originalLabel;
  }

  function readForm(){
    const ar=$id('ar')?.value.trim()||'';
    const en=$id('en')?.value.trim()||'';
    const price=Number($id('price')?.value);
    if(!ar||!en||!Number.isFinite(price)||price<0){
      setStatus('تحقق من الاسم والسعر قبل الحفظ.','error');
      return null;
    }
    return {ar,en,price,descAr:$id('descAr')?.value.trim()||'',descEn:$id('descEn')?.value.trim()||'',cat:$id('cat')?.value||null,available:!!$id('available')?.checked,featured:!!$id('featured')?.checked};
  }

  async function saveLiveProduct(){
    if(typeof isLive==='undefined' || !isLive || !adminClient || !liveTenantId || !liveUser)return false;
    if(saving)return true;
    saving=true;
    setButtonBusy(true);
    setStatus('جارٍ حفظ التعديل في Supabase والتحقق منه…','info');
    try{
      const form=readForm();
      if(!form)return true;
      const editingId=window.editId;
      const isExisting=!!editingId && !String(editingId).startsWith('item-') && !String(editingId).startsWith('live-');
      const payload={tenant_id:liveTenantId,category_id:form.cat,name_ar:form.ar,name_en:form.en,description_ar:form.descAr,description_en:form.descEn,price:form.price,is_available:form.available,is_featured:form.featured};
      let result;
      if(isExisting){
        result=await adminClient.from('products').update(payload).eq('id',editingId).eq('tenant_id',liveTenantId).select('id,tenant_id,category_id,name_ar,name_en,description_ar,description_en,price,is_available,is_featured,image_url').single();
      }else{
        result=await adminClient.from('products').insert(payload).select('id,tenant_id,category_id,name_ar,name_en,description_ar,description_en,price,is_available,is_featured,image_url').single();
      }
      if(result.error)throw new Error(result.error.message||'تعذر تنفيذ عملية الحفظ.');
      if(!result.data?.id)throw new Error('لم تُرجع قاعدة البيانات صفًا محفوظًا؛ لم يتم اعتماد العملية.');
      const savedId=result.data.id;
      const verify=await adminClient.from('products').select('id,tenant_id,name_ar,name_en,description_ar,description_en,price,is_available,is_featured,image_url,updated_at').eq('id',savedId).eq('tenant_id',liveTenantId).single();
      if(verify.error)throw new Error('تمت الكتابة لكن تعذر التحقق منها: '+verify.error.message);
      const row=verify.data;
      const matches=row.name_ar===form.ar && row.name_en===form.en && String(row.description_ar||'')===String(form.descAr||'') && String(row.description_en||'')===String(form.descEn||'') && Number(row.price)===form.price && Boolean(row.is_available)===form.available && Boolean(row.is_featured)===form.featured;
      if(!matches)throw new Error('البيانات التي أعادتها قاعدة البيانات لا تطابق التعديل المرسل؛ لم يتم اعتماد العملية.');
      const file=$id('imageFile')?.files?.[0];
      if(file){
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('الصورة يجب أن تكون JPG أو PNG أو WebP وبحجم أقل من 5MB.');
        const path=`${liveTenantId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'')}`;
        const upload=await adminClient.storage.from('menu-assets').upload(path,file,{upsert:true,contentType:file.type});
        if(upload.error)throw new Error('تم حفظ الصنف لكن فشل رفع الصورة: '+upload.error.message);
        const imageUrl=adminClient.storage.from('menu-assets').getPublicUrl(path).data.publicUrl;
        const imageUpdate=await adminClient.from('products').update({image_url:imageUrl}).eq('id',savedId).eq('tenant_id',liveTenantId).select('id,image_url').single();
        if(imageUpdate.error)throw new Error('تم حفظ الصنف لكن فشل ربط الصورة: '+imageUpdate.error.message);
      }
      if(typeof loadLiveTenant==='function')await loadLiveTenant();
      setStatus('تم حفظ الصنف والتحقق منه في Supabase بنجاح.','success');
      window.editId=null;
      if($id('editor'))$id('editor').hidden=true;
      if(typeof render==='function')render();
      return true;
    }catch(error){
      console.error('[Menu Admin] verified product save failed',error);
      setStatus('فشل حفظ الصنف في Supabase: '+(error?.message||'خطأ غير معروف'),'error');
      return true;
    }finally{
      saving=false;
      setButtonBusy(false);
    }
  }

  function install(){
    const button=$id('saveItem');
    if(!button || typeof adminClient==='undefined'){setTimeout(install,250);return;}
    button.onclick=async()=>{
      const handled=await saveLiveProduct();
      if(handled)return;
      const s=typeof state==='function'?state():null;
      const form=readForm();
      if(!form)return;
      if(s){
        const item={id:window.editId||`item-${Date.now()}`,...form};
        s.items=window.editId?s.items.map(i=>i.id===window.editId?item:i):[...s.items,item];
        if(typeof saveDb==='function')saveDb();
        if($id('editor'))$id('editor').hidden=true;
        if(typeof render==='function')render();
      }
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
