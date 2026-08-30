/* Owner Portal Controller — Master SaaS & Platform Operations */
(function() {
  'use strict';

  let supabaseClient = null;
  let currentOperator = null;
  let allTenants = [];
  let allBranches = [];
  let allProducts = [];
  let allWebsiteProjects = [];
  let allVisibilityAudits = [];
  let allServiceRequests = [];
  let selectedTenant = null;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);

  function getClient() {
    if (!supabaseClient && window.MENU_CONFIG && window.supabase) {
      supabaseClient = window.supabase.createClient(window.MENU_CONFIG.supabaseUrl, window.MENU_CONFIG.supabaseAnonKey);
    }
    return supabaseClient;
  }

  // Panel Switcher
  function switchPanel(panelId) {
    document.querySelectorAll('.owner-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.owner-nav-item').forEach(b => b.classList.remove('active'));

    const panel = $('panel-' + panelId);
    if (panel) panel.classList.add('active');

    const navBtn = document.querySelector(`.owner-nav-item[data-panel="${panelId}"]`);
    if (navBtn) navBtn.classList.add('active');

    const titles = {
      dashboard: 'نظرة عامة على المنصة',
      tenants: 'العملاء والأنشطة التجارية',
      websites: 'مشاريع المواقع الإلكترونية',
      visibility: 'تقييمات الظهور المحلي',
      requests: 'طلبات الخدمات واستفسارات العملاء',
      analytics: 'التحليلات الشاملة',
      markets: 'الأسواق الإقليمية والعملات',
      system: 'صحة النظام والأمان'
    };
    if ($('ownerPageTitle')) $('ownerPageTitle').textContent = titles[panelId] || 'لوحة تحكم المشغل';
  }

  // Auth Initialization
  async function initAuth() {
    const client = getClient();
    if (!client) return;

    const { data: { session } } = await client.auth.getSession();
    if (session && session.user) {
      await onOperatorAuthenticated(session.user);
    } else {
      $('ownerAuthSection').hidden = false;
      $('ownerDashboardContent').hidden = true;
    }

    client.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        await onOperatorAuthenticated(session.user);
      } else {
        currentOperator = null;
        $('ownerAuthSection').hidden = false;
        $('ownerDashboardContent').hidden = true;
      }
    });
  }

  async function handleLogin() {
    const email = $('opAuthEmail').value.trim();
    const password = $('opAuthPassword').value.trim();
    const status = $('opAuthStatus');
    status.textContent = 'جارٍ التحقق…';

    const client = getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      status.textContent = 'تعذر تسجيل الدخول: ' + error.message;
      return;
    }
    status.textContent = '';
  }

  async function handleLogout() {
    const client = getClient();
    if (client) await client.auth.signOut();
    location.reload();
  }

  async function onOperatorAuthenticated(user) {
    currentOperator = user;
    $('opUserEmail').textContent = user.email;

    // Check operator status
    const client = getClient();
    let isOp = false;
    try {
      const { data: opCheck, error: opErr } = await client.rpc('is_platform_operator');
      if (!opErr && opCheck === true) isOp = true;
    } catch (e) {
      console.warn('Operator RPC check fallback:', e);
    }

    $('ownerAuthSection').hidden = true;
    $('ownerDashboardContent').hidden = false;

    if (!isOp) {
      $('operatorWarning').hidden = false;
    } else {
      $('operatorWarning').hidden = true;
    }

    await loadAllPlatformData();
  }

  // Load All Platform Data
  async function loadAllPlatformData() {
    const client = getClient();
    if (!client) return;

    $('platformSyncStatus').textContent = 'جارٍ مزامنة بيانات المنصة…';

    try {
      const [tenantsRes, branchesRes, productsRes, webRes, visRes, reqRes] = await Promise.allSettled([
        client.from('tenants').select('*').order('created_at', { ascending: false }),
        client.from('branches').select('*').order('created_at', { ascending: false }),
        client.from('products').select('*').order('sort_order'),
        client.from('website_projects').select('*').order('created_at', { ascending: false }),
        client.from('visibility_audits').select('*').order('created_at', { ascending: false }),
        client.from('service_requests').select('*').order('created_at', { ascending: false })
      ]);

      allTenants = tenantsRes.status === 'fulfilled' && tenantsRes.value.data ? tenantsRes.value.data : [];
      allBranches = branchesRes.status === 'fulfilled' && branchesRes.value.data ? branchesRes.value.data : [];
      allProducts = productsRes.status === 'fulfilled' && productsRes.value.data ? productsRes.value.data : [];
      allWebsiteProjects = webRes.status === 'fulfilled' && webRes.value.data ? webRes.value.data : [];
      allVisibilityAudits = visRes.status === 'fulfilled' && visRes.value.data ? visRes.value.data : [];
      allServiceRequests = reqRes.status === 'fulfilled' && reqRes.value.data ? reqRes.value.data : [];

      updateKPIs();
      renderTenantsTable();
      renderWebsiteProjectsTable();
      renderVisibilityAuditsTable();
      renderServiceRequestsTable();

      $('platformSyncStatus').textContent = 'متصل وحي';
    } catch (err) {
      console.error('Data load error:', err);
      $('platformSyncStatus').textContent = 'خطأ في الاتصال';
    }
  }

  function updateKPIs() {
    $('kpiTotalTenants').textContent = allTenants.length;
    $('kpiTotalBranches').textContent = allBranches.length;
    $('kpiTotalProducts').textContent = allProducts.length;
    $('kpiTotalWebsites').textContent = allWebsiteProjects.length;
    $('kpiTotalAudits').textContent = allVisibilityAudits.length;
    $('kpiTotalRequests').textContent = allServiceRequests.length;

    // Badges in sidebar
    $('badgeTenantsCount').textContent = allTenants.length;
    $('badgeWebsitesCount').textContent = allWebsiteProjects.length;
    $('badgeAuditsCount').textContent = allVisibilityAudits.length;
    $('badgeRequestsCount').textContent = allServiceRequests.length;
  }

  // Render Tenants Table
  function renderTenantsTable(filter = '') {
    const tbody = $('tenantsTableBody');
    if (!tbody) return;

    const filtered = allTenants.filter(t => 
      !filter || 
      t.name?.toLowerCase().includes(filter.toLowerCase()) || 
      t.slug?.toLowerCase().includes(filter.toLowerCase())
    );

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--o-muted)">لا توجد أنشطة تجارية مسجلة مطابقة.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(t => {
      const branchesCount = allBranches.filter(b => b.tenant_id === t.id).length;
      const productsCount = allProducts.filter(p => p.tenant_id === t.id).length;
      const origin = window.location.origin;
      const menuUrl = `${origin}/?tenant=${encodeURIComponent(t.slug)}`;

      return `
        <tr>
          <td>
            <strong>${esc(t.name)}</strong>
            <small style="display:block;color:var(--o-muted);font-family:var(--o-font-mono)">${esc(t.slug)}</small>
          </td>
          <td>${branchesCount} فرع</td>
          <td>${productsCount} صنف</td>
          <td>${t.whatsapp ? `<a href="https://wa.me/${esc(t.whatsapp)}" target="_blank" dir="ltr" style="color:var(--o-accent)">${esc(t.whatsapp)}</a>` : '—'}</td>
          <td>
            <a class="btn-owner btn-owner-secondary" href="${menuUrl}" target="_blank" rel="noopener">فتح المنيو ↗</a>
          </td>
          <td>
            <button class="btn-owner btn-owner-accent" onclick="window.ownerInspectTenant('${t.id}')">إدارة</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Website Projects Table
  function renderWebsiteProjectsTable() {
    const tbody = $('websiteProjectsTableBody');
    if (!tbody) return;

    if (!allWebsiteProjects.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--o-muted)">لا توجد طلبات مواقع بعد.</td></tr>`;
      return;
    }

    tbody.innerHTML = allWebsiteProjects.map(w => {
      return `
        <tr>
          <td>
            <strong>${esc(w.name_ar || w.business_name || 'بدون اسم')}</strong>
            <small style="display:block;color:var(--o-muted)">${esc(w.city || '')} · ${esc(w.business_type || '')}</small>
          </td>
          <td>${esc(w.contact_name || '')} (${esc(w.phone || w.whatsapp || '')})</td>
          <td>${new Date(w.created_at).toLocaleDateString('ar-SA')}</td>
          <td>
            <span class="badge-status ${esc(w.status || 'pending')}">${translateStatus(w.status)}</span>
          </td>
          <td>
            ${w.published_url ? `<a href="${esc(w.published_url)}" target="_blank" style="color:var(--o-accent)">رابط الموقع ↗</a>` : 'قيد العمل'}
          </td>
          <td>
            <button class="btn-owner btn-owner-secondary" onclick="window.ownerInspectWebsite('${w.id}')">تفاصيل الموجز</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Visibility Audits Table
  function renderVisibilityAuditsTable() {
    const tbody = $('visibilityAuditsTableBody');
    if (!tbody) return;

    if (!allVisibilityAudits.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--o-muted)">لا توجد طلبات تقييم ظهور بعد.</td></tr>`;
      return;
    }

    tbody.innerHTML = allVisibilityAudits.map(v => {
      return `
        <tr>
          <td>
            <strong>${esc(v.business_name)}</strong>
            <small style="display:block;color:var(--o-muted)">${esc(v.city || '')} - ${esc(v.business_category || '')}</small>
          </td>
          <td>${esc(v.phone || v.whatsapp || '—')}</td>
          <td><strong>${v.score_total ? v.score_total + '/100' : '—'}</strong></td>
          <td>
            <span class="badge-status ${esc(v.status || 'pending')}">${translateStatus(v.status)}</span>
          </td>
          <td>${new Date(v.created_at).toLocaleDateString('ar-SA')}</td>
          <td>
            <button class="btn-owner btn-owner-secondary" onclick="window.ownerInspectAudit('${v.id}')">فحص التقييم</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Service Requests Table
  function renderServiceRequestsTable() {
    const tbody = $('serviceRequestsTableBody');
    if (!tbody) return;

    if (!allServiceRequests.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--o-muted)">لا توجد طلبات خدمات معلقة.</td></tr>`;
      return;
    }

    tbody.innerHTML = allServiceRequests.map(r => {
      return `
        <tr>
          <td>
            <strong>${esc(r.business_name)}</strong>
            <small style="display:block;color:var(--o-muted)">${esc(r.country || 'SA')} · ${esc(r.city || '')}</small>
          </td>
          <td><span class="badge-status in_progress">${translateServiceType(r.service_type)}</span></td>
          <td>
            <div>${esc(r.contact_name)}</div>
            <small style="color:var(--o-muted)" dir="ltr">${esc(r.contact_phone)}</small>
          </td>
          <td>
            <span class="badge-status ${esc(r.status || 'pending')}">${translateStatus(r.status)}</span>
          </td>
          <td>${new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
          <td>
            <button class="btn-owner btn-owner-secondary" onclick="window.ownerInspectRequest('${r.id}')">معاينة</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Status Translation Helper
  function translateStatus(st) {
    const map = {
      pending: 'معلق / جديد',
      contacted: 'تم التواصل',
      in_progress: 'قيد التنفيذ',
      in_production: 'قيد الإنتاج',
      review: 'المراجعة',
      ready: 'جاهز',
      published: 'منشور',
      completed: 'مكتمل',
      archived: 'مؤرشف'
    };
    return map[st] || st || 'جديد';
  }

  function translateServiceType(type) {
    const map = {
      menu: 'منيو رقمي',
      website: 'موقع إلكتروني',
      visibility: 'ظهور محلي',
      ai_solutions: 'أتمتة ذكاء اصطناعي',
      automation: 'أتمتة عمليات',
      analytics: 'تحليلات',
      custom: 'خدمة مخصصة'
    };
    return map[type] || type || 'خدمة';
  }

  // Provision Restaurant Modal & Logic
  function openProvisionModal() {
    $('provisionModal').classList.remove('hidden');
    $('opNameInput').value = '';
    $('opSlugInput').value = '';
    $('opBranchInput').value = 'الفرع الرئيسي';
    $('opOwnerIdInput').value = '';
    $('provisionStatus').textContent = '';
  }

  function closeProvisionModal() {
    $('provisionModal').classList.add('hidden');
  }

  async function handleProvisionSubmit() {
    const client = getClient();
    if (!client) return;

    const name = $('opNameInput').value.trim();
    const slug = $('opSlugInput').value.trim().toLowerCase();
    const branch = $('opBranchInput').value.trim() || 'الفرع الرئيسي';
    const ownerId = $('opOwnerIdInput').value.trim();

    if (!name || !slug) {
      alert('اسم النشاط والمعرّف (slug) مطلوبان');
      return;
    }

    $('submitProvisionBtn').disabled = true;
    $('submitProvisionBtn').textContent = 'جارٍ الإنشاء…';
    $('provisionStatus').textContent = '';

    try {
      const { data, error } = await client.rpc('provision_restaurant', {
        p_name: name,
        p_slug: slug,
        p_default_branch_name: branch,
        p_owner_user_id: ownerId ? ownerId : null
      });

      if (error) throw error;

      $('provisionStatus').style.color = 'var(--o-green)';
      $('provisionStatus').textContent = 'تم إنشاء النشاط والفرع بنجاح!';
      
      setTimeout(async () => {
        closeProvisionModal();
        await loadAllPlatformData();
      }, 1200);
    } catch (err) {
      $('provisionStatus').style.color = 'var(--o-red)';
      $('provisionStatus').textContent = 'فشل الإنشاء: ' + (err.message || 'تأكد من صلاحيات المشغل أو فرادة الـ slug');
    } finally {
      $('submitProvisionBtn').disabled = false;
      $('submitProvisionBtn').textContent = 'إنشاء النشاط التجاري';
    }
  }

  // Drawer Inspection Functions
  window.ownerInspectTenant = (id) => {
    const t = allTenants.find(x => x.id === id);
    if (!t) return;
    alert(`النشاط: ${t.name}\nالمعرف: ${t.slug}\nالواتساب: ${t.whatsapp || 'غير محدد'}\nرابط المنيو: /?tenant=${t.slug}`);
  };

  window.ownerInspectWebsite = (id) => {
    const w = allWebsiteProjects.find(x => x.id === id);
    if (!w) return;
    $('drawerContentTitle').textContent = `موجز موقع: ${w.name_ar || 'بدون اسم'}`;
    $('drawerBody').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div><strong>نوع النشاط:</strong> ${esc(w.business_type || '—')}</div>
        <div><strong>مسؤول التواصل:</strong> ${esc(w.contact_name || '—')} (${esc(w.phone || w.whatsapp || '—')})</div>
        <div><strong>المدينة:</strong> ${esc(w.city || '—')}</div>
        <div><strong>الوصف المختصر:</strong> ${esc(w.short_desc || '—')}</div>
        <div><strong>الخدمات المطلوبة:</strong> <pre style="background:var(--o-subtle);padding:10px;border-radius:6px;">${esc(JSON.stringify(w.services || {}, null, 2))}</pre></div>
        <div><strong>الحالة الحالية:</strong> <span class="badge-status in_progress">${translateStatus(w.status)}</span></div>
        <div style="margin-top:16px;">
          <label style="display:block;font-weight:700;margin-bottom:6px;">تحديث الحالة:</label>
          <select id="updateWebStatusSelect" class="btn-owner btn-owner-secondary" style="width:100%;">
            <option value="submitted" ${w.status==='submitted'?'selected':''}>تم الاستلام (Submitted)</option>
            <option value="in_production" ${w.status==='in_production'?'selected':''}>قيد الإنتاج (In Production)</option>
            <option value="review" ${w.status==='review'?'selected':''}>قيد المراجعة (Review)</option>
            <option value="published" ${w.status==='published'?'selected':''}>منشور (Published)</option>
          </select>
        </div>
        <div style="margin-top:8px;">
          <label style="display:block;font-weight:700;margin-bottom:6px;">رابط الموقع المنشور:</label>
          <input type="url" id="updateWebUrlInput" value="${esc(w.published_url || '')}" placeholder="https://..." style="width:100%;padding:10px;border:1px solid var(--o-line);border-radius:8px;" dir="ltr">
        </div>
        <button class="btn-owner btn-owner-primary" style="margin-top:16px;" onclick="window.ownerSaveWebsiteStatus('${w.id}')">حفظ التغييرات</button>
      </div>
    `;
    $('inspectionDrawer').classList.remove('hidden');
  };

  window.ownerSaveWebsiteStatus = async (id) => {
    const client = getClient();
    const status = $('updateWebStatusSelect').value;
    const url = $('updateWebUrlInput').value.trim();

    const { error } = await client.from('website_projects').update({ status, published_url: url || null }).eq('id', id);
    if (error) {
      alert('فشل التحديث: ' + error.message);
    } else {
      alert('تم تحديث حالة المشروع بنجاح!');
      $('inspectionDrawer').classList.add('hidden');
      await loadAllPlatformData();
    }
  };

  window.ownerInspectAudit = (id) => {
    const v = allVisibilityAudits.find(x => x.id === id);
    if (!v) return;
    $('drawerContentTitle').textContent = `تقييم الظهور: ${v.business_name}`;
    $('drawerBody').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div><strong>النشاط:</strong> ${esc(v.business_name)} (${esc(v.city || '')})</div>
        <div><strong>التقييم الكلي:</strong> <strong>${v.score_total || '—'}/100</strong></div>
        <div><strong>التواصل:</strong> ${esc(v.phone || v.whatsapp || '—')}</div>
        <div><strong>تفاصيل المدخلات:</strong> <pre style="background:var(--o-subtle);padding:10px;border-radius:6px;max-height:200px;overflow:auto;">${esc(JSON.stringify(v.inputs || {}, null, 2))}</pre></div>
      </div>
    `;
    $('inspectionDrawer').classList.remove('hidden');
  };

  window.ownerInspectRequest = (id) => {
    const r = allServiceRequests.find(x => x.id === id);
    if (!r) return;
    $('drawerContentTitle').textContent = `طلب خدمة: ${r.business_name}`;
    $('drawerBody').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div><strong>النشاط:</strong> ${esc(r.business_name)}</div>
        <div><strong>النوع:</strong> ${translateServiceType(r.service_type)}</div>
        <div><strong>الدولة / المدينة:</strong> ${esc(r.country || 'SA')} - ${esc(r.city || '—')}</div>
        <div><strong>مسؤول التواصل:</strong> ${esc(r.contact_name)} (${esc(r.contact_phone)})</div>
        <div><strong>البريد:</strong> ${esc(r.contact_email || '—')}</div>
        <div><strong>تفاصيل الطلب:</strong> <p style="background:var(--o-subtle);padding:12px;border-radius:8px;">${esc(r.details || 'لا توجد تفاصيل إضافية')}</p></div>
        <div style="margin-top:12px;">
          <label style="display:block;font-weight:700;margin-bottom:6px;">تحديث حالة الطلب:</label>
          <select id="updateReqStatusSelect" class="btn-owner btn-owner-secondary" style="width:100%;">
            <option value="pending" ${r.status==='pending'?'selected':''}>معلق / جديد</option>
            <option value="contacted" ${r.status==='contacted'?'selected':''}>تم التواصل مع العميل</option>
            <option value="in_progress" ${r.status==='in_progress'?'selected':''}>قيد التنفيذ</option>
            <option value="completed" ${r.status==='completed'?'selected':''}>مكتمل</option>
            <option value="archived" ${r.status==='archived'?'selected':''}>مؤرشف</option>
          </select>
        </div>
        <button class="btn-owner btn-owner-primary" style="margin-top:16px;" onclick="window.ownerSaveRequestStatus('${r.id}')">حفظ التغييرات</button>
      </div>
    `;
    $('inspectionDrawer').classList.remove('hidden');
  };

  window.ownerSaveRequestStatus = async (id) => {
    const client = getClient();
    const status = $('updateReqStatusSelect').value;

    const { error } = await client.from('service_requests').update({ status }).eq('id', id);
    if (error) {
      alert('فشل التحديث: ' + error.message);
    } else {
      alert('تم تحديث حالة الطلب!');
      $('inspectionDrawer').classList.add('hidden');
      await loadAllPlatformData();
    }
  };

  // Event Listeners
  document.addEventListener('DOMContentLoaded', () => {
    initAuth();

    $('opLoginBtn')?.addEventListener('click', handleLogin);
    $('opLogoutBtn')?.addEventListener('click', handleLogout);

    document.querySelectorAll('.owner-nav-item[data-panel]').forEach(btn => {
      btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
    });

    $('openProvisionBtn')?.addEventListener('click', openProvisionModal);
    $('closeProvisionModalBtn')?.addEventListener('click', closeProvisionModal);
    $('cancelProvisionBtn')?.addEventListener('click', closeProvisionModal);
    $('submitProvisionBtn')?.addEventListener('click', handleProvisionSubmit);

    $('closeDrawerBtn')?.addEventListener('click', () => {
      $('inspectionDrawer').classList.add('hidden');
    });
    $('drawerBackdrop')?.addEventListener('click', () => {
      $('inspectionDrawer').classList.add('hidden');
    });

    $('tenantSearchInput')?.addEventListener('input', e => {
      renderTenantsTable(e.target.value);
    });

    $('refreshPlatformDataBtn')?.addEventListener('click', async () => {
      await loadAllPlatformData();
      alert('تم تحديث جميع بيانات المنصة الحية.');
    });
  });
})();
