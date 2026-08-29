/* Menu Studio — verified live product write path
 * Frontend-only hardening. No schema/RPC/RLS/auth/security changes.
 */
(function(){
  const $=id=>document.getElementById(id);
  function install(){
    const button=$('saveItem');
    if(!button)return;
    button.onclick=async()=>{
      const ar=$('ar').value.trim(), en=$('en').value.trim(), price=Number($('price').value);
      if(!ar||!en||!Number.isFinite(price)||price<0){ authUi(liveUser,'تحقق من الاسم والسعر.'); return; }
      if(!(isLive&&adminClient&&liveTenantId&&liveUser)){
        const s=state(); const item={id:window.editId||`item-${Date.now()}`,ar,en,descAr:$('descAr').value.trim(),descEn:$('descEn').value.trim(),price,cat:$('cat').value,available:$('available').checked,featured:$('featured').checked};
        s.items=window.editId?s.items.map(i=>i.id===window.editId?item:i):[...s.items,item]; $('editor').hidden=true; saveDb(); return;
      }
      const editing=!!window.editId&&!String(window.editId).startsWith('item-')&&!String(window.editId).startsWith('live-');
      const payload={tenant_id:liveTenantId,category_id:$('cat').value||null,name_ar:ar,name_en:en,description_ar:$('descAr').value.trim(),description_en:$('descEn').value.trim(),price,is_available:$('available').checked,is_featured:$('featured').checked};
      if(editing)payload.id=window.editId;
      button.disabled=true; const old=button.textContent; button.textContent='جارٍ الحفظ…'; authUi(liveUser,'جارٍ الحفظ والتحقق من Supabase…');
      try{
        const result=editing
          ? await adminClient.from('products').update(payload).eq('id',window.editId).eq('tenant_id',liveTenantId).select('id,tenant_id,category_id,name_ar,name_en,description_ar,description_en,price,is_available,is_featured,image_url').maybeSingle()
          : await adminClient.from('products').insert(payload).select('id,tenant_id,category_id,name_ar,name_en,description_ar,description_en,price,is_available,is_featured,image_url').single();
        if(result.error)throw result.error;
        if(!result.data)throw new Error('لم تُرجع Supabase الصف المعدّل.');
        const d=result.data;
        if(d.tenant_id!==liveTenantId||d.name_ar!==ar||d.name_en!==en||Number(d.price)!==price||d.description_ar!==payload.description_ar||d.description_en!==payload.description_en||d.is_available!==payload.is_available||d.is_featured!==payload.is_featured)throw new Error('Supabase أعاد بيانات لا تطابق القيم التي تم حفظها.');
        await loadLiveTenant(); $('editor').hidden=true; window.editId=null; authUi(liveUser,'تم الحفظ والتحقق من البيانات في Supabase بنجاح.'); render();
      }catch(err){ console.error('verified product write failed',err); authUi(liveUser,'فشل الحفظ: '+(err.message||'خطأ غير معروف')); }
      finally{button.disabled=false; button.textContent=old;}
    };
  }
  window.MenuAdminWriteFix={install};
  if(document.readyState==='complete')install(); else window.addEventListener('load',install,{once:true});
})();