/* Menu Studio V1.1 — owner admin */
const catalog={
  oaza:{brand:{ar:'أوزا كافيه',en:'Oaza Coffee',taglineAr:'قهوة مختصة، تفاصيل تستحق التوقف.',taglineEn:'Specialty coffee, worth slowing down for.',maps:'https://maps.google.com/?q=Oaza+Coffee+Riyadh',whatsapp:'https://wa.me/966566332329'},categories:[['hot','القهوة الساخنة'],['cold','القهوة الباردة'],['drip','القهوة المقطرة'],['tea','الشاي والماتشا'],['drinks','موهيتو ومشروبات'],['dessert','الحلويات'],['bakery','المخبوزات'],['retail','حبوب القهوة']]},
  juniper:{brand:{ar:'جونيبر روسترز',en:'Juniper Roasters',taglineAr:'تحميص محلي، لحظات هادئة.',taglineEn:'Local roasting, slower moments.',maps:'https://maps.google.com/?q=Riyadh',whatsapp:'#'},categories:[['hot','القهوة الساخنة'],['cold','القهوة الباردة'],['dessert','الحلويات']]},
  mirage:{brand:{ar:'ميراج كيتشن',en:'Mirage Kitchen',taglineAr:'نكهات سعودية بلمسة معاصرة.',taglineEn:'Saudi flavours, contemporary spirit.',maps:'https://maps.google.com/?q=Riyadh',whatsapp:'#'},categories:[['breakfast','الفطور'],['mains','الأطباق الرئيسية'],['dessert','الحلويات']]}
};
catalog.almas={brand:{ar:'مطعم الماس العائلي',en:'AL MAS Family Restaurant',taglineAr:'نموذج أولي — القائمة بانتظار اعتماد المطعم.',taglineEn:'Portfolio prototype — menu pending restaurant approval.',maps:'https://maps.google.com/?q=53+Al+Hawwari+Al+Malaz+Riyadh',whatsapp:'#',primaryColor:'#15120f',secondaryColor:'#a26a42'},categories:[['prototype','أصناف مرجعية — غير نهائية']]};
catalog.alsakhrah={brand:{ar:'مطاعم الصخرة',en:'Alsakhrah Restaurants',taglineAr:'نموذج عرض — البيانات النهائية بانتظار اعتماد المطعم.',taglineEn:'Portfolio prototype — final menu data pending owner approval.',maps:'https://maps.google.com/?q=MPHH%2BHCH%2C+Umar+Ibn+Abdul+Aziz+Rd%2C+Al+Malaz%2C+Riyadh+12831',whatsapp:'#',primaryColor:'#191510',secondaryColor:'#b66a3d'},categories:[['reference','أطباق مرجعية — غير نهائية']]};

const demoItems={
  oaza:[{id:'espresso',ar:'إسبريسو',en:'Espresso',descAr:'جرعة مركزة بطابع غني ومتوازن',descEn:'A concentrated shot with a rich finish',price:12,cat:'hot',available:true,featured:true},{id:'spanish',ar:'سبانيش لاتيه',en:'Spanish Latte',descAr:'إسبريسو، حليب وحليب مكثف',descEn:'Espresso, milk and condensed milk',price:18,cat:'hot',available:true,featured:true},{id:'icedlatte',ar:'آيس لاتيه',en:'Iced Latte',descAr:'إسبريسو وحليب بارد فوق الثلج',descEn:'Espresso and cold milk over ice',price:18,cat:'cold',available:true,featured:false},{id:'brownie',ar:'براونيز',en:'Brownies',descAr:'براونيز شوكولاتة بلمسة مالحة',descEn:'Chocolate brownie with sea salt',price:10,cat:'dessert',available:true,featured:false}],
  juniper:[{id:'coffee',ar:'قهوة اليوم',en:'Coffee of the Day',descAr:'محصول اليوم محضر بعناية',descEn:"Today's batch brewed with care",price:15,cat:'hot',available:true,featured:true},{id:'coldbrew',ar:'كولد برو',en:'Cold Brew',descAr:'قهوة باردة مستخلصة ببطء',descEn:'Slow-steeped cold coffee',price:20,cat:'cold',available:true,featured:true}],
  mirage:[{id:'shakshuka',ar:'شكشوكة نجدية',en:'Najdi Shakshuka',descAr:'بيض، طماطم وتوابل نجدية',descEn:'Eggs, tomato and Najdi spices',price:28,cat:'breakfast',available:true,featured:true},{id:'kabsa',ar:'كبسة الدجاج',en:'Chicken Kabsa',descAr:'أرز بسمتي ودجاج متبل',descEn:'Basmati rice and spiced chicken',price:42,cat:'mains',available:true,featured:true}]
};
demoItems.alsakhrah=[{id:'esh-albulbul',ar:'عش البلبل الحموي',en:'Hama-style Esh Al Bulbul',descAr:'اسم طبق ظهر في منشور عام',descEn:'Dish name seen in a public post',price:0,cat:'reference',available:true,featured:true},{id:'meat-borek',ar:'برك اللحمة',en:'Meat Borek',descAr:'اسم طبق ظهر في منشور عام',descEn:'Dish name seen in a public post',price:0,cat:'reference',available:true,featured:true}];
demoItems.almas=[{id:'masala-dosa',ar:'ماسالا دوسا',en:'Masala Dosa',descAr:'إشارة مرجعية منشورة',descEn:'Publicly referenced item',price:0,cat:'prototype',available:true,featured:true},{id:'chicken-tikka-masala',ar:'دجاج تيكا ماسالا',en:'Chicken Tikka Masala',descAr:'إشارة مرجعية منشورة',descEn:'Publicly referenced item',price:0,cat:'prototype',available:true,featured:true},{id:'chilli-paneer',ar:'تشيلي بانير',en:'Chilli Paneer',descAr:'إشارة مرجعية منشورة',descEn:'Publicly referenced item',price:0,cat:'prototype',available:true,featured:false},{id:'sadya',ar:'وجبة ساديا',en:'Sadya Meal',descAr:'عرض موسمي',descEn:'Seasonal offering',price:0,cat:'prototype',available:true,featured:false}];

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

let tenant=localStorage.getItem('adminTenant')||'oaza';
let db=JSON.parse(localStorage.getItem('menuDemoDb')||'{}');
function defaults(k){return {brand:{...catalog[k].brand},items:demoItems[k]?demoItems[k].map(i=>({...i})):[]}}
function state(){return db[tenant]||(db[tenant]=defaults(tenant))}
let selectedBranchSlug=localStorage.getItem('adminBranch')||'main';
let authorizedTenantSlug=null;
let liveUser=null;
let liveTenantId=null;
let isLive=false;
let analyticsDays=7;
let branchList=[];
const adminClient=window.MENU_CONFIG&&window.supabase?.createClient?window.supabase.createClient(window.MENU_CONFIG.supabaseUrl,window.MENU_CONFIG.supabaseAnonKey):null;

function publicUrl(){
  const base=location.origin+location.pathname.replace(/admin\.html.*/,'');
  return `${base}index.html?tenant=${encodeURIComponent(tenant)}&branch=${encodeURIComponent(selectedBranchSlug)}`;
}

function setLiveMode(on){
  isLive=!!on;
  const badge=$('liveBadge');
  if(badge){
    badge.textContent=on?'بيانات حية':'وضع العرض';
    badge.className='live-badge '+(on?'live':'demo');
  }
  if($('workspaceHint'))$('workspaceHint').textContent=on?'تعمل على بيانات Supabase الحية لنشاطك فقط.':'معاينة محلية للعرض. سجّل الدخول لإدارة البيانات الحية.';
  if($('authCard'))$('authCard').hidden=!!on;
}

function authUi(user,message=''){
  liveUser=user||null;
  $('authState').textContent=user?'مسجل دخول':'غير مسجل';
  $('authState').classList.toggle('closed',!user);
  $('loginBtn').hidden=!!user;
  $('logoutBtn').hidden=!user;
  $('authMessage').textContent=message||(user?`مرحبًا ${user.email}`:'');
  document.querySelectorAll('#saveBrand,#addItem,#saveItem,#saveBranch').forEach(btn=>{
    btn.disabled=!user;
    btn.title=user?'':'سجّل الدخول أولًا';
  });
}

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
  $('editor').hidden=false;$('editor').scrollIntoView({behavior:'smooth'});
}

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
  $('editor').hidden=false;$('editor').scrollIntoView({behavior:'smooth'});$('ar').focus();
};

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
    featured:$('featured').checked
  };

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
    if(file){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){
        authUi(liveUser,'الصورة يجب أن تكون JPG أو PNG أو WebP وبحجم أقل من 5MB.');
      }else{
        const path=`${liveTenantId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'')}`;
        const upload=await adminClient.storage.from('menu-assets').upload(path,file,{upsert:true,contentType:file.type});
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

/* Brand asset upload */
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

/* Branches */
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

/* Analytics */
document.querySelectorAll('.pill[data-days]').forEach(p=>{
  p.onclick=()=>{
    document.querySelectorAll('.pill[data-days]').forEach(x=>x.classList.remove('active'));
    p.classList.add('active');
    analyticsDays=Number(p.dataset.days)||7;
    if(isLive)loadAnalytics();
  };
});

async function loadAnalytics(){
  if(!adminClient||!liveUser||!isLive||!liveTenantId){
    $('analyticsEmpty').classList.remove('hidden');
    $('analyticsBody').classList.add('hidden');
    $('analyticsLoading').classList.add('hidden');
    return;
  }
  $('analyticsLoading').classList.remove('hidden');
  $('analyticsEmpty').classList.add('hidden');
  $('analyticsBody').classList.add('hidden');
  try{
    // Prefer explicit tenant-scoped RPC. Fall back to days-only overload if migration not yet applied.
    let r=await adminClient.rpc('get_owner_analytics',{p_days:analyticsDays,p_tenant_id:liveTenantId});
    if(r.error&&/could not find|function|signature|PGRST202/i.test(String(r.error.message||r.error.code||''))){
      r=await adminClient.rpc('get_owner_analytics',{p_days:analyticsDays});
    }
    if(r.error)throw r.error;
    const a=r.data||{};
    $('anVisits').textContent=String(a.total_visits||0);
    $('anViews').textContent=String(a.total_product_views||0);
    const lang=a.lang_split||{};
    const totalLang=(lang.ar||0)+(lang.en||0)+(lang.unknown||0)||1;
    $('anAr').textContent=lang.ar?`${Math.round((lang.ar/totalLang)*100)}%`:'—';
    $('anEn').textContent=lang.en?`${Math.round((lang.en/totalLang)*100)}%`:'—';
    $('visitsByDay').innerHTML=(a.visits_by_day||[]).length
      ?(a.visits_by_day||[]).map(d=>`<div class="list-row"><span>${esc(d.day)}</span><strong>${d.visits}</strong></div>`).join('')
      :'<div class="muted">لا زيارات في هذه الفترة</div>';
    $('topProducts').innerHTML=(a.top_products||[]).length
      ?(a.top_products||[]).map(p=>`<div class="list-row"><span>${esc(p.name_ar||p.name_en)}</span><strong>${p.views}</strong></div>`).join('')
      :'<div class="muted">لا مشاهدات أصناف بعد</div>';
    $('catPerf').innerHTML=(a.category_performance||[]).length
      ?(a.category_performance||[]).map(c=>`<div class="list-row"><span>${esc(c.name_ar||c.name_en)}</span><strong>${c.views}</strong></div>`).join('')
      :'<div class="muted">—</div>';
    $('branchPerf').innerHTML=(a.branch_performance||[]).length
      ?(a.branch_performance||[]).map(b=>`<div class="list-row"><span>${esc(b.name||b.slug)}</span><strong>${b.visits}</strong></div>`).join('')
      :'<div class="muted">—</div>';
    const hasData=(a.total_visits||0)+(a.total_product_views||0)>0;
    $('analyticsBody').classList.toggle('hidden',!hasData);
    $('analyticsEmpty').classList.toggle('hidden',hasData);
  }catch(err){
    console.warn(err);
    $('analyticsEmpty').classList.remove('hidden');
    $('analyticsEmpty').querySelector('strong').textContent='تعذر تحميل التحليلات';
    $('analyticsEmpty').querySelector('span').textContent=err.message||'تحقق من تسجيل الدخول وعضوية النشاط';
  }finally{
    $('analyticsLoading').classList.add('hidden');
  }
}

/* Live data load */
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
  // Single trusted-owner model for first commercial release — roles are stored but not enforced as RBAC.
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
  liveTenantId=null;authorizedTenantSlug=null;
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
