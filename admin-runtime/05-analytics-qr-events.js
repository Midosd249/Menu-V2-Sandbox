/* admin-runtime/05-analytics-qr-events.js — analytics + QR helpers */
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
