/* admin-runtime/03-rendering-ui.js — render, health, edit form, branches UI */
function computeHealth(){
  const s=state();
  const b=s.brand||{};
  const items=s.items||[];
  const checks=[];
  let score=100;
  const fail=(label,pts)=>{score-=pts;checks.push({ok:false,label,pts})};
  const pass=(label)=>checks.push({ok:true,label,pts:0});
  if(!b.logoUrl&&!b.logo_url)fail('أضف شعار النشاط',12);else pass('الشعار موجود');
  if(!b.coverUrl&&!b.cover_url)fail('أضف صورة غلاف / هيرو',8);else pass('صورة الغلاف موجودة');
  if(!b.whatsapp||b.whatsapp==='#')fail('أضف رقم واتساب للتواصل',12);else pass('واتساب مُعرَّف');
  if(!b.ar&&!b.en)fail('اسم النشاط ناقص',10);else pass('اسم النشاط مكتمل');
  if(!branchList.length||!branchList[0]?.address)fail('عنوان الفرع ناقص',8);else pass('عنوان الفرع موجود');
  if(!branchList.length||!(branchList[0]?.maps_url||branchList[0]?.maps))fail('رابط خريطة الفرع ناقص',6);else pass('خريطة الفرع موجودة');
  if(!items.length)fail('لا توجد أصناف في المنيو',20);else pass(`عدد الأصناف: ${items.length}`);
  const noPrice=items.filter(i=>!(Number(i.price)>0)).length;
  if(items.length&&noPrice===items.length)fail('كل الأصناف بدون سعر محدد',10);
  else if(noPrice)fail(`${noPrice} أصناف بدون سعر`,6);
  else pass('الأسعار مكتملة');
  const noImg=items.filter(i=>!i.image_url&&!i.imageUrl).length;
  if(items.length&&noImg)fail(`${noImg} أصناف بدون صورة`,8);
  else if(items.length)pass('صور الأصناف مكتملة');
  const noDesc=items.filter(i=>!(i.descAr||i.descEn)).length;
  if(items.length&&noDesc)fail(`${noDesc} أصناف بدون وصف`,6);
  else if(items.length)pass('الأوصاف مكتملة');
  const unavailable=items.filter(i=>i.available===false).length;
  if(unavailable&&unavailable===items.length)fail('كل الأصناف غير متاحة',10);
  else if(unavailable)checks.push({ok:true,label:`${unavailable} أصناف معلّمة كغير متاحة`,pts:0});
  score=Math.max(0,Math.min(100,score));
  return {score,checks};
}

function renderHealth(){
  const {score,checks}=computeHealth();
  if($('healthScore'))$('healthScore').textContent=String(score);
  if($('dashHealth'))$('dashHealth').textContent=String(score);
  const list=$('healthList');
  if(!list)return;
  list.innerHTML=checks.map(c=>`<li class="${c.ok?'ok':'bad'}"><span>${esc(c.label)}</span>${c.ok?'':'<em>-'+c.pts+'</em>'}</li>`).join('');
  updateOnboarding(score);
}

function updateOnboarding(score){
  const steps=$('onboardSteps');
  if(!steps)return;
  const s=state();
  const done=[
    !!liveUser,
    !!(s.brand?.ar||s.brand?.en)&&(s.brand?.whatsapp&&s.brand.whatsapp!=='#'),
    !!(branchList[0]?.address),
    (s.items||[]).length>0,
    (s.items||[]).some(i=>i.available!==false),
    true,
    score>=70
  ];
  [...steps.querySelectorAll('li')].forEach((li,i)=>{
    li.classList.toggle('done',!!done[i]);
  });
}

function render(){
  const s=state();
  const meta=catalog[tenant]||{categories:[],brand:{}};
  if($('tenantSelect'))$('tenantSelect').value=tenant;
  if($('publicUrl'))$('publicUrl').value=publicUrl();
  if($('qrText'))$('qrText').value=publicUrl();
  if($('previewLink'))$('previewLink').href=publicUrl();
  if($('brandAr'))$('brandAr').value=s.brand.ar||'';
  if($('brandEn'))$('brandEn').value=s.brand.en||'';
  if($('taglineAr'))$('taglineAr').value=s.brand.taglineAr||'';
  if($('taglineEn'))$('taglineEn').value=s.brand.taglineEn||'';
  if($('maps'))$('maps').value=s.brand.maps||'';
  if($('whatsapp'))$('whatsapp').value=s.brand.whatsapp||'';
  if($('waTemplate'))$('waTemplate').value=s.brand.waTemplate||s.brand.whatsapp_message_template||'';
  if($('instagram'))$('instagram').value=s.brand.instagram||s.brand.instagram_url||'';
  if($('primaryColor'))$('primaryColor').value=s.brand.primaryColor||'#15120f';
  if($('secondaryColor'))$('secondaryColor').value=s.brand.secondaryColor||'#a26a42';
  if($('logoUrl'))$('logoUrl').value=s.brand.logoUrl||s.brand.logo_url||'';
  if($('coverUrl'))$('coverUrl').value=s.brand.coverUrl||s.brand.cover_url||'';
  if($('previewName'))$('previewName').textContent=s.brand.ar||s.brand.en||'—';
  if($('previewTagline'))$('previewTagline').textContent=s.brand.taglineAr||s.brand.taglineEn||'—';
  if($('previewSwatch')){
    $('previewSwatch').style.background=`linear-gradient(135deg,${s.brand.primaryColor||'#15120f'},${s.brand.secondaryColor||'#a26a42'})`;
  }
  if($('dashItems'))$('dashItems').textContent=String(s.items.length);
  if($('dashFeatured'))$('dashFeatured').textContent=String(s.items.filter(i=>i.featured).length);
  if($('dashUnavailable'))$('dashUnavailable').textContent=String(s.items.filter(i=>i.available===false).length);
  if($('cat'))$('cat').innerHTML=(meta.categories||[]).map(c=>`<option value="${esc(c[0])}">${esc(c[1])}</option>`).join('');
  if($('items')){
    $('items').innerHTML=s.items.length?s.items.map(i=>{
      const catLabel=(meta.categories||[]).find(c=>c[0]===i.cat)?.[1]||i.cat||'—';
      const price=Number(i.price||0)>0?`${Number(i.price).toFixed(2)} SAR`:'حسب التوفر';
      const avail=i.available!==false;
      return `<tr>
        <td><strong>${esc(i.ar)}</strong><br><small>${esc(i.en)}</small></td>
        <td>${esc(catLabel)}</td>
        <td>${esc(price)}</td>
        <td><button type="button" class="toggle-avail ${avail?'on':'off'}" data-toggle="${esc(i.id)}" title="تبديل التوفر">${avail?'متاح':'غير متاح'}</button></td>
        <td>
          <button class="btn secondary" data-edit="${esc(i.id)}" type="button">تعديل</button>
          <button class="btn danger" data-remove="${esc(i.id)}" type="button">حذف</button>
        </td>
      </tr>`;
    }).join(''):'<tr><td colspan="5">لا توجد أصناف بعد. أضف أول صنف لتبدأ.</td></tr>';
    document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));
    document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeItem(b.dataset.remove));
    document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>toggleAvailability(b.dataset.toggle));
  }
  if(!isLive)localStorage.setItem('menuDemoDb',JSON.stringify(db));
  renderHealth();
  syncBranchUi();
}

function edit(id){
  const x=state().items.find(i=>i.id===id);
  if(!x)return;
  window.editId=id;
  $('editorTitle').textContent='تعديل صنف';
  $('ar').value=x.ar;$('en').value=x.en;
  $('descAr').value=x.descAr||'';$('descEn').value=x.descEn||'';
  $('price').value=x.price;$('cat').value=x.cat;
  $('available').checked=x.available!==false;$('featured').checked=!!x.featured;
  if($('imageUrlInput')){$('imageUrlInput').value=x.image_url||'';if(typeof previewProductImage==='function')previewProductImage(x.image_url||'','الصورة الحالية');}
  $('editor').hidden=false;$('editor').scrollIntoView({behavior:'smooth'});
}

function syncBranchUi(){
  const select=$('branchSelect');
  if(!select)return;
  if(!branchList.length){
    branchList=[{id:'demo-'+selectedBranchSlug,slug:selectedBranchSlug,name:selectedBranchSlug==='malaz'?'فرع الملز':'الفرع الرئيسي',address:'الرياض',maps:'https://maps.google.com/?q=Riyadh',is_active:true}];
  }
  select.innerHTML=branchList.filter(b=>b.is_active!==false).map(b=>`<option value="${esc(b.slug)}">${esc(b.name)}</option>`).join('');
  if(!branchList.some(b=>b.slug===selectedBranchSlug))selectedBranchSlug=branchList[0]?.slug||'main';
  select.value=selectedBranchSlug;
  const b=branchList.find(x=>x.slug===selectedBranchSlug)||branchList[0];
  if(b){
    if($('branchNameInput'))$('branchNameInput').value=b.name||'';
    if($('branchAddress'))$('branchAddress').value=b.address||'';
    if($('branchMaps'))$('branchMaps').value=b.maps_url||b.maps||'';
  }
  if($('publicUrl'))$('publicUrl').value=publicUrl();
  if($('qrText'))$('qrText').value=publicUrl();
  if($('previewLink'))$('previewLink').href=publicUrl();
}
