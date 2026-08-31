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
let memberRole=null; // 'owner' | 'admin' | 'editor' | null
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
    badge.textContent=on?('بيانات حية'+(memberRole?' · '+memberRole:'')):'وضع العرض التجريبي';
    badge.className='live-badge '+(on?'live':'demo');
    badge.setAttribute('aria-label', on ? 'وضع البيانات الحية' : 'وضع العرض التجريبي — لا تعديلات حقيقية');
  }
  if($('workspaceHint'))$('workspaceHint').textContent=on
    ?('تعمل على بيانات Supabase الحية لنشاطك فقط'+(memberRole?' · صلاحيتك: '+memberRole:''))
    :'معاينة محلية للعرض فقط. لا تُحفظ التعديلات على بيانات العملاء. سجّل الدخول لإدارة البيانات الحية.';
  if($('authCard'))$('authCard').hidden=!!on;
  document.body.classList.toggle('is-demo-mode', !on);
  document.body.classList.toggle('is-live-mode', !!on);
  applyRoleUi();
}

function applyRoleUi(){
  const canBrand = isLive && liveUser && memberRole && memberRole !== 'editor';
  const canMutate = isLive && liveUser && !!memberRole;
  const canBranch = isLive && liveUser && memberRole && (memberRole === 'owner' || memberRole === 'admin');
  document.querySelectorAll('#saveBrand').forEach(btn=>{
    btn.disabled = !canBrand;
    btn.title = canBrand ? '' : (isLive ? 'صلاحية المحرر لا تسمح بتعديل الهوية' : 'سجّل الدخول أولًا');
  });
  document.querySelectorAll('#addItem,#saveItem').forEach(btn=>{
    btn.disabled = !canMutate;
    btn.title = canMutate ? '' : 'سجّل الدخول بعضوية صالحة أولًا';
  });
  document.querySelectorAll('#saveBranch').forEach(btn=>{
    btn.disabled = !canBranch;
    btn.title = canBranch ? '' : (isLive ? 'يتطلب صلاحية مالك أو مدير' : 'سجّل الدخول أولًا');
  });
  document.querySelectorAll('[data-owner-only]').forEach(el=>{
    el.hidden = !(isLive && memberRole === 'owner');
  });
  document.querySelectorAll('[data-editor-hide]').forEach(el=>{
    el.hidden = isLive && memberRole === 'editor';
  });
}

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
