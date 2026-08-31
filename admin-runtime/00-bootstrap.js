/* admin-runtime/00-bootstrap.js — helpers, state, client */
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
const adminClient=typeof window.getMenuSupabaseClient==='function'?window.getMenuSupabaseClient():null;

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
