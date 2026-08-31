/* Owner Portal Controller — platform-operator workspace. */
(function () {
  'use strict';

  var currentOperator = null;
  var allTenants = [];
  var allBranches = [];
  var allProducts = [];
  var allWebsiteProjects = [];
  var allVisibilityAudits = [];
  var allServiceRequests = [];
  var authRevision = 0;
  var authSubscription = null;

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char];
    });
  };

  function getClient() {
    return typeof window.getMenuSupabaseClient === 'function' ? window.getMenuSupabaseClient() : null;
  }

  function setText(id, value) {
    var element = $(id);
    if (element) element.textContent = value;
  }

  function setAuthStatus(message, isError) {
    var status = $('opAuthStatus');
    if (!status) return;
    status.style.color = isError ? 'var(--o-red)' : 'var(--o-green)';
    status.textContent = message || '';
  }

  function setProvisionStatus(message, isError) {
    var status = $('provisionStatus');
    if (!status) return;
    status.style.color = isError ? 'var(--o-red)' : 'var(--o-green)';
    status.textContent = message || '';
  }

  function showLogin(message) {
    currentOperator = null;
    clearPlatformData();
    updateKPIs(0, 0);
    renderTenantsTable();
    renderWebsiteProjectsTable();
    renderVisibilityAuditsTable();
    renderServiceRequestsTable();
    if ($('ownerAuthSection')) $('ownerAuthSection').hidden = false;
    if ($('ownerDashboardContent')) $('ownerDashboardContent').hidden = true;
    if (message) setAuthStatus(message, true);
  }

  function showDashboard(user) {
    if ($('ownerAuthSection')) $('ownerAuthSection').hidden = true;
    if ($('ownerDashboardContent')) $('ownerDashboardContent').hidden = false;
    if ($('operatorWarning')) $('operatorWarning').hidden = true;
    setText('opUserEmail', user.email || '—');
    setAuthStatus('', false);
  }

  function clearPlatformData() {
    allTenants = [];
    allBranches = [];
    allProducts = [];
    allWebsiteProjects = [];
    allVisibilityAudits = [];
    allServiceRequests = [];
  }

  function formatDate(value) {
    var date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ar-SA');
  }

  function safeExternalUrl(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    try {
      var parsed = new URL(raw, window.location.origin);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
    } catch (_error) {
      return '';
    }
  }

  function safeWhatsAppUrl(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\/wa\.me\//i.test(raw)) return safeExternalUrl(raw);
    var digits = raw.replace(/\D/g, '');
    return digits ? 'https://wa.me/' + digits : '';
  }

  function statusLabel(status) {
    var labels = {
      draft: 'مسودة',
      pending: 'جديد',
      new: 'جديد',
      submitted: 'تم الاستلام',
      info_required: 'مطلوب معلومات',
      contacted: 'تم التواصل',
      in_progress: 'قيد التنفيذ',
      in_production: 'قيد الإنتاج',
      review: 'قيد المراجعة',
      revision: 'مطلوب تعديل',
      ready: 'جاهز',
      published: 'منشور',
      delivered: 'تم التسليم',
      completed: 'مكتمل',
      closed: 'مغلق',
      archived: 'مؤرشف'
    };
    return labels[status] || 'غير محدد';
  }

  function serviceTypeLabel(type) {
    var labels = {
      menu: 'منيو رقمي',
      website: 'موقع إلكتروني',
      visibility: 'ظهور محلي',
      ai_solutions: 'حلول ذكاء اصطناعي',
      automation: 'أتمتة عمليات',
      analytics: 'تحليلات',
      custom: 'خدمة مخصصة'
    };
    return labels[type] || 'خدمة مخصصة';
  }

  function isValidUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
  }

  function menuUrlForTenant(tenant) {
    var branch = allBranches.find(function (item) { return item.tenant_id === tenant.id && item.is_active; });
    var path = '/m/' + encodeURIComponent(tenant.slug);
    return branch ? path + '/' + encodeURIComponent(branch.slug) : path;
  }

  function switchPanel(panelId) {
    document.querySelectorAll('.owner-panel').forEach(function (panel) { panel.classList.remove('active'); });
    document.querySelectorAll('.owner-nav-item').forEach(function (button) { button.classList.remove('active'); });

    var panel = $('panel-' + panelId);
    if (panel) panel.classList.add('active');
    var navButton = document.querySelector('.owner-nav-item[data-panel="' + panelId + '"]');
    if (navButton) navButton.classList.add('active');

    var titles = {
      dashboard: 'نظرة عامة على المنصة',
      tenants: 'العملاء والأنشطة التجارية',
      websites: 'مشاريع المواقع الإلكترونية',
      visibility: 'تقييمات الظهور المحلي',
      requests: 'طلبات الخدمات واستفسارات العملاء',
      analytics: 'التحليلات الشاملة',
      markets: 'الأسواق الإقليمية والعملات',
      system: 'صحة النظام والأمان'
    };
    setText('ownerPageTitle', titles[panelId] || 'لوحة تحكم المشغّل');
    setOwnerDrawer(false);
  }

  async function verifyOperator(user, revision) {
    var client = getClient();
    if (!client || !user) return false;
    var result = await client.rpc('is_platform_operator');
    if (revision !== authRevision) return false;
    if (result.error || result.data !== true) return false;
    return true;
  }

  async function onOperatorAuthenticated(user) {
    var revision = ++authRevision;
    if (!user) {
      showLogin();
      return;
    }

    setAuthStatus('جارٍ التحقق من صلاحية المشغّل…', false);
    try {
      var allowed = await verifyOperator(user, revision);
      if (revision !== authRevision) return;
      if (!allowed) {
        showLogin('هذا الحساب غير مصرح له بإدارة المنصة.');
        return;
      }

      currentOperator = user;
      showDashboard(user);
      await loadAllPlatformData();
    } catch (error) {
      if (revision !== authRevision) return;
      console.error('Operator authorization failed:', error);
      showLogin('تعذر التحقق من صلاحيات الحساب. حاول مرة أخرى.');
    }
  }

  async function initAuth() {
    var client = getClient();
    if (!client) {
      showLogin('تعذر تحميل إعدادات الاتصال الآمنة. حاول تحديث الصفحة.');
      return;
    }

    try {
      var sessionResult = await client.auth.getSession();
      if (sessionResult.error) throw sessionResult.error;
      if (sessionResult.data && sessionResult.data.session && sessionResult.data.session.user) {
        await onOperatorAuthenticated(sessionResult.data.session.user);
      } else {
        showLogin();
      }
    } catch (error) {
      console.error('Owner session restore failed:', error);
      showLogin('تعذر استعادة جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.');
    }

    if (!authSubscription) {
      authSubscription = client.auth.onAuthStateChange(function (_event, session) {
        window.setTimeout(function () {
          if (session && session.user) {
            onOperatorAuthenticated(session.user);
          } else {
            authRevision += 1;
            showLogin();
          }
        }, 0);
      });
    }
  }

  function friendlyAuthError(error) {
    var message = String(error && error.message ? error.message : 'تعذر تسجيل الدخول.');
    if (/invalid login credentials/i.test(message)) return 'بيانات الدخول غير صحيحة.';
    if (/invalid api key/i.test(message)) return 'إعداد الاتصال غير صالح. يرجى تحديث الصفحة والمحاولة مجددًا.';
    return message;
  }

  async function handleLogin() {
    var emailInput = $('opAuthEmail');
    var passwordInput = $('opAuthPassword');
    var button = $('opLoginBtn');
    var client = getClient();
    if (!emailInput || !passwordInput || !client) {
      setAuthStatus('تعذر تحميل إعدادات الاتصال الآمنة. حاول تحديث الصفحة.', true);
      return;
    }
    if (!emailInput.reportValidity() || !passwordInput.reportValidity()) return;

    var email = emailInput.value.trim();
    var password = passwordInput.value;
    if (!email || !password) {
      setAuthStatus('أدخل البريد الإلكتروني وكلمة المرور.', true);
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'جارٍ تسجيل الدخول…';
    }
    setAuthStatus('جارٍ التحقق من بيانات الدخول…', false);

    try {
      var result = await client.auth.signInWithPassword({ email: email, password: password });
      if (result.error) throw result.error;
      // The auth-state listener runs the authorization gate. No private data is loaded here.
    } catch (error) {
      setAuthStatus('تعذر تسجيل الدخول: ' + friendlyAuthError(error), true);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'تسجيل الدخول كمالك';
      }
    }
  }

  async function handleLogout() {
    var client = getClient();
    authRevision += 1;
    try {
      if (client) {
        var result = await client.auth.signOut();
        if (result.error) throw result.error;
      }
      showLogin('تم تسجيل الخروج بنجاح.');
    } catch (error) {
      setAuthStatus('تعذر تسجيل الخروج بالكامل: ' + (error.message || 'حاول تحديث الصفحة.'), true);
    }
  }

  function requireSuccessfulResult(result, label) {
    if (result && result.error) throw new Error(label + ': ' + result.error.message);
    return result && result.data ? result.data : [];
  }

  async function loadAllPlatformData() {
    var client = getClient();
    if (!client || !currentOperator) return false;

    setText('platformSyncStatus', 'جارٍ مزامنة بيانات المنصة…');
    try {
      var responses = await Promise.all([
        client.from('tenants').select('id,slug,name,tagline,whatsapp,is_active,created_at').order('created_at', { ascending: false }).limit(500),
        client.from('branches').select('id,tenant_id,slug,name,address,phone,maps_url,is_active,created_at').order('created_at', { ascending: false }).limit(1000),
        client.from('products').select('id,tenant_id,category_id,name_ar,name_en,price,currency,is_available,is_featured,sort_order').order('sort_order').limit(5000),
        client.rpc('list_website_projects'),
        client.rpc('list_visibility_audits'),
        client.from('service_requests').select('id,business_name,business_type,service_type,country,city,contact_name,contact_phone,contact_email,details,status,created_at').order('created_at', { ascending: false }).limit(1000),
        client.from('menu_events').select('*', { count: 'exact', head: true }).eq('event_type', 'visit'),
        client.from('menu_events').select('*', { count: 'exact', head: true }).eq('event_type', 'product_view')
      ]);

      allTenants = requireSuccessfulResult(responses[0], 'تعذر تحميل الأنشطة');
      allBranches = requireSuccessfulResult(responses[1], 'تعذر تحميل الفروع');
      allProducts = requireSuccessfulResult(responses[2], 'تعذر تحميل الأصناف');
      allWebsiteProjects = requireSuccessfulResult(responses[3], 'تعذر تحميل مشاريع المواقع');
      allVisibilityAudits = requireSuccessfulResult(responses[4], 'تعذر تحميل تقييمات الظهور');
      allServiceRequests = requireSuccessfulResult(responses[5], 'تعذر تحميل طلبات الخدمات');
      if (responses[6].error || responses[7].error) throw new Error('تعذر تحميل مؤشرات الزيارات');

      updateKPIs(responses[6].count || 0, responses[7].count || 0);
      renderTenantsTable();
      renderWebsiteProjectsTable();
      renderVisibilityAuditsTable();
      renderServiceRequestsTable();
      setText('platformSyncStatus', 'متصل وحي');
      return true;
    } catch (error) {
      console.error('Platform data load error:', error);
      clearPlatformData();
      updateKPIs(0, 0);
      renderTenantsTable();
      renderWebsiteProjectsTable();
      renderVisibilityAuditsTable();
      renderServiceRequestsTable();
      setText('platformSyncStatus', 'تعذر الاتصال');
      setAuthStatus('تعذر تحميل بيانات المنصة المصرح بها: ' + (error.message || 'حاول مرة أخرى.'), true);
      return false;
    }
  }

  function updateKPIs(visits, views) {
    setText('kpiTotalTenants', String(allTenants.length));
    setText('kpiTotalBranches', String(allBranches.filter(function (branch) { return branch.is_active; }).length));
    setText('kpiTotalProducts', String(allProducts.length));
    setText('kpiTotalWebsites', String(allWebsiteProjects.length));
    setText('kpiTotalRequests', String(allServiceRequests.length));
    setText('badgeTenantsCount', String(allTenants.length));
    setText('badgeWebsitesCount', String(allWebsiteProjects.length));
    setText('badgeAuditsCount', String(allVisibilityAudits.length));
    setText('badgeRequestsCount', String(allServiceRequests.length));
    setText('globalVisitsTotal', String(visits));
    setText('globalViewsTotal', String(views));
    setText('globalActiveTenants', String(allTenants.filter(function (tenant) { return tenant.is_active; }).length));
  }

  function actionButton(action, id, label, variant) {
    return '<button type="button" class="btn-owner ' + (variant || 'btn-owner-secondary') + '" data-owner-action="' + esc(action) + '" data-record-id="' + esc(id) + '">' + esc(label) + '</button>';
  }

  function emptyTable(columnCount, message) {
    return '<tr><td colspan="' + columnCount + '" style="text-align:center;padding:28px;color:var(--o-muted)">' + esc(message) + '</td></tr>';
  }

  function bindActions(container) {
    if (!container) return;
    container.querySelectorAll('[data-owner-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        var action = button.dataset.ownerAction;
        var id = button.dataset.recordId;
        if (action === 'tenant') openTenantDrawer(id);
        if (action === 'website') openWebsiteDrawer(id);
        if (action === 'visibility') openVisibilityDrawer(id);
        if (action === 'request') openRequestDrawer(id);
      });
    });
  }

  function tenantRows(filter) {
    var normalized = String(filter || '').trim().toLowerCase();
    var entries = allTenants.filter(function (tenant) {
      return !normalized || String(tenant.name || '').toLowerCase().includes(normalized) || String(tenant.slug || '').toLowerCase().includes(normalized);
    });
    if (!entries.length) return emptyTable(6, normalized ? 'لا توجد أنشطة تجارية مطابقة.' : 'لا توجد أنشطة تجارية مسجلة بعد.');

    return entries.map(function (tenant) {
      var branchCount = allBranches.filter(function (branch) { return branch.tenant_id === tenant.id; }).length;
      var productCount = allProducts.filter(function (product) { return product.tenant_id === tenant.id; }).length;
      var whatsappUrl = safeWhatsAppUrl(tenant.whatsapp);
      var menuUrl = menuUrlForTenant(tenant);
      return '<tr>' +
        '<td><strong>' + esc(tenant.name) + '</strong><small style="display:block;color:var(--o-muted);font-family:var(--o-font-mono)">' + esc(tenant.slug) + '</small></td>' +
        '<td>' + branchCount + ' فرع</td>' +
        '<td>' + productCount + ' صنف</td>' +
        '<td>' + (whatsappUrl ? '<a href="' + esc(whatsappUrl) + '" target="_blank" rel="noopener" dir="ltr" style="color:var(--o-accent)">' + esc(tenant.whatsapp) + '</a>' : '—') + '</td>' +
        '<td><a class="btn-owner btn-owner-secondary" href="' + esc(menuUrl) + '" target="_blank" rel="noopener">فتح المنيو ↗</a></td>' +
        '<td>' + actionButton('tenant', tenant.id, 'إدارة', 'btn-owner-accent') + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderTenantsTable(filter) {
    var rows = tenantRows(filter);
    var dashboardTable = $('tenantsTableBody');
    var fullTable = $('tenantsTableBodyFull');
    if (dashboardTable) {
      dashboardTable.innerHTML = rows;
      bindActions(dashboardTable);
    }
    if (fullTable) {
      fullTable.innerHTML = rows;
      bindActions(fullTable);
    }
  }

  function renderWebsiteProjectsTable() {
    var tbody = $('websiteProjectsTableBody');
    if (!tbody) return;
    if (!allWebsiteProjects.length) {
      tbody.innerHTML = emptyTable(6, 'لا توجد طلبات مواقع بعد.');
      return;
    }
    tbody.innerHTML = allWebsiteProjects.map(function (project) {
      var url = safeExternalUrl(project.published_url);
      return '<tr>' +
        '<td><strong>' + esc(project.name_ar || 'بدون اسم') + '</strong><small style="display:block;color:var(--o-muted)">' + esc(project.city || '') + ' · ' + esc(project.business_type || '') + '</small></td>' +
        '<td>' + esc(project.contact_name || '—') + '<small style="display:block;color:var(--o-muted)" dir="ltr">' + esc(project.contact_phone || project.phone || project.whatsapp || '') + '</small></td>' +
        '<td>' + formatDate(project.created_at) + '</td>' +
        '<td><span class="badge-status ' + esc(project.status || 'submitted') + '">' + esc(statusLabel(project.status)) + '</span></td>' +
        '<td>' + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener" style="color:var(--o-accent)">رابط الموقع ↗</a>' : 'قيد العمل') + '</td>' +
        '<td>' + actionButton('website', project.id, 'تفاصيل الموجز') + '</td>' +
      '</tr>';
    }).join('');
    bindActions(tbody);
  }

  function renderVisibilityAuditsTable() {
    var tbody = $('visibilityAuditsTableBody');
    if (!tbody) return;
    if (!allVisibilityAudits.length) {
      tbody.innerHTML = emptyTable(6, 'لا توجد طلبات تقييم ظهور بعد.');
      return;
    }
    tbody.innerHTML = allVisibilityAudits.map(function (audit) {
      return '<tr>' +
        '<td><strong>' + esc(audit.business_name) + '</strong><small style="display:block;color:var(--o-muted)">' + esc(audit.city || '') + ' · ' + esc(audit.business_category || '') + '</small></td>' +
        '<td dir="ltr">' + esc(audit.phone || audit.whatsapp || '—') + '</td>' +
        '<td><strong>' + (Number.isFinite(Number(audit.score_total)) ? esc(audit.score_total) + '/100' : '—') + '</strong></td>' +
        '<td><span class="badge-status ' + esc(audit.status || 'submitted') + '">' + esc(statusLabel(audit.status)) + '</span></td>' +
        '<td>' + formatDate(audit.created_at) + '</td>' +
        '<td>' + actionButton('visibility', audit.id, 'فحص التقييم') + '</td>' +
      '</tr>';
    }).join('');
    bindActions(tbody);
  }

  function renderServiceRequestsTable() {
    var tbody = $('serviceRequestsTableBody');
    if (!tbody) return;
    if (!allServiceRequests.length) {
      tbody.innerHTML = emptyTable(6, 'لا توجد طلبات خدمات بعد.');
      return;
    }
    tbody.innerHTML = allServiceRequests.map(function (request) {
      return '<tr>' +
        '<td><strong>' + esc(request.business_name) + '</strong><small style="display:block;color:var(--o-muted)">' + esc(request.country || 'SA') + ' · ' + esc(request.city || '') + '</small></td>' +
        '<td><span class="badge-status in_progress">' + esc(serviceTypeLabel(request.service_type)) + '</span></td>' +
        '<td><div>' + esc(request.contact_name) + '</div><small style="color:var(--o-muted)" dir="ltr">' + esc(request.contact_phone) + '</small></td>' +
        '<td><span class="badge-status ' + esc(request.status || 'pending') + '">' + esc(statusLabel(request.status)) + '</span></td>' +
        '<td>' + formatDate(request.created_at) + '</td>' +
        '<td>' + actionButton('request', request.id, 'معاينة') + '</td>' +
      '</tr>';
    }).join('');
    bindActions(tbody);
  }

  function openDrawer(title, content) {
    setText('drawerContentTitle', title);
    var body = $('drawerBody');
    if (body) body.innerHTML = content;
    var drawer = $('inspectionDrawer');
    if (drawer) drawer.classList.remove('hidden');
  }

  function closeInspectionDrawer() {
    var drawer = $('inspectionDrawer');
    if (drawer) drawer.classList.add('hidden');
  }

  function openTenantDrawer(id) {
    var tenant = allTenants.find(function (item) { return item.id === id; });
    if (!tenant) return;
    var branches = allBranches.filter(function (item) { return item.tenant_id === id; });
    var products = allProducts.filter(function (item) { return item.tenant_id === id; });
    openDrawer('إدارة النشاط: ' + String(tenant.name || ''),
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div><strong>المعرّف:</strong> <span dir="ltr">' + esc(tenant.slug) + '</span></div>' +
      '<div><strong>حالة النشاط:</strong> ' + (tenant.is_active ? 'نشط' : 'غير نشط') + '</div>' +
      '<div><strong>عدد الفروع:</strong> ' + branches.length + '</div>' +
      '<div><strong>عدد الأصناف:</strong> ' + products.length + '</div>' +
      '<div><strong>الفروع:</strong><ul>' + (branches.map(function (branch) { return '<li>' + esc(branch.name) + ' <span dir="ltr">(' + esc(branch.slug) + ')</span></li>'; }).join('') || '<li>لا توجد فروع مسجلة.</li>') + '</ul></div>' +
      '<a class="btn-owner btn-owner-primary" href="' + esc(menuUrlForTenant(tenant)) + '" target="_blank" rel="noopener">فتح المنيو العام ↗</a>' +
      '</div>');
  }

  function option(value, label, selected) {
    return '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(label) + '</option>';
  }

  function openWebsiteDrawer(id) {
    var project = allWebsiteProjects.find(function (item) { return item.id === id; });
    if (!project) return;
    var websiteOptions = [
      ['draft', 'مسودة'], ['submitted', 'تم الاستلام'], ['info_required', 'مطلوب معلومات'], ['in_production', 'قيد الإنتاج'],
      ['review', 'قيد المراجعة'], ['revision', 'مطلوب تعديل'], ['ready', 'جاهز'], ['published', 'منشور']
    ].map(function (entry) { return option(entry[0], entry[1], project.status === entry[0]); }).join('');
    openDrawer('موجز موقع: ' + String(project.name_ar || 'بدون اسم'),
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div><strong>نوع النشاط:</strong> ' + esc(project.business_type || '—') + '</div>' +
      '<div><strong>مسؤول التواصل:</strong> ' + esc(project.contact_name || '—') + ' <span dir="ltr">' + esc(project.contact_phone || project.phone || project.whatsapp || '') + '</span></div>' +
      '<div><strong>المدينة:</strong> ' + esc(project.city || '—') + '</div>' +
      '<div><strong>الوصف المختصر:</strong> ' + esc(project.short_desc || '—') + '</div>' +
      '<div><strong>الخدمات المطلوبة:</strong><pre style="background:var(--o-subtle);padding:10px;border-radius:6px;white-space:pre-wrap;overflow:auto;">' + esc(JSON.stringify(project.services || [], null, 2)) + '</pre></div>' +
      '<div><label for="updateWebStatusSelect" style="display:block;font-weight:700;margin-bottom:6px;">تحديث الحالة:</label><select id="updateWebStatusSelect" class="btn-owner btn-owner-secondary" style="width:100%;">' + websiteOptions + '</select></div>' +
      '<div><label for="updateWebUrlInput" style="display:block;font-weight:700;margin-bottom:6px;">رابط الموقع المنشور:</label><input type="url" id="updateWebUrlInput" value="' + esc(project.published_url || '') + '" placeholder="https://..." style="width:100%;padding:10px;border:1px solid var(--o-line);border-radius:8px;" dir="ltr"></div>' +
      '<button type="button" class="btn-owner btn-owner-primary" id="saveWebsiteProjectBtn">حفظ التغييرات</button>' +
      '<p id="drawerActionStatus" role="status" style="margin:0"></p>' +
      '</div>');
    $('saveWebsiteProjectBtn').addEventListener('click', function () { saveWebsiteStatus(id); });
  }

  async function saveWebsiteStatus(id) {
    var client = getClient();
    var status = $('updateWebStatusSelect').value;
    var rawUrl = $('updateWebUrlInput').value.trim();
    var actionStatus = $('drawerActionStatus');
    if (!client) return;
    if (rawUrl && !safeExternalUrl(rawUrl)) {
      if (actionStatus) actionStatus.textContent = 'رابط النشر يجب أن يبدأ بـ http:// أو https://.';
      return;
    }
    if (actionStatus) actionStatus.textContent = 'جارٍ حفظ التغييرات…';
    var result = await client.from('website_projects').update({ status: status, published_url: rawUrl || null }).eq('id', id).select('id,status,published_url').limit(1).maybeSingle();
    if (result.error || !result.data) {
      if (actionStatus) actionStatus.textContent = 'فشل التحديث: ' + (result.error ? result.error.message : 'لم يتم تحديث أي سجل.');
      return;
    }
    closeInspectionDrawer();
    await loadAllPlatformData();
  }

  function openVisibilityDrawer(id) {
    var audit = allVisibilityAudits.find(function (item) { return item.id === id; });
    if (!audit) return;
    openDrawer('تقييم الظهور: ' + String(audit.business_name || ''),
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div><strong>النشاط:</strong> ' + esc(audit.business_name) + ' · ' + esc(audit.city || '') + '</div>' +
      '<div><strong>الدرجة الكلية:</strong> ' + (Number.isFinite(Number(audit.score_total)) ? esc(audit.score_total) + '/100' : 'غير متاحة') + '</div>' +
      '<div><strong>التواصل:</strong> <span dir="ltr">' + esc(audit.phone || audit.whatsapp || '—') + '</span></div>' +
      '<div><strong>تفاصيل المدخلات:</strong><pre style="background:var(--o-subtle);padding:10px;border-radius:6px;max-height:260px;white-space:pre-wrap;overflow:auto;">' + esc(JSON.stringify(audit.inputs || {}, null, 2)) + '</pre></div>' +
      '</div>');
  }

  function openRequestDrawer(id) {
    var request = allServiceRequests.find(function (item) { return item.id === id; });
    if (!request) return;
    var options = [
      ['new', 'جديد'], ['contacted', 'تم التواصل'], ['in_progress', 'قيد التنفيذ'], ['closed', 'مغلق']
    ].map(function (entry) { return option(entry[0], entry[1], request.status === entry[0]); }).join('');
    openDrawer('طلب خدمة: ' + String(request.business_name || ''),
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div><strong>النشاط:</strong> ' + esc(request.business_name) + '</div>' +
      '<div><strong>النوع:</strong> ' + esc(serviceTypeLabel(request.service_type)) + '</div>' +
      '<div><strong>الدولة / المدينة:</strong> ' + esc(request.country || 'SA') + ' · ' + esc(request.city || '—') + '</div>' +
      '<div><strong>مسؤول التواصل:</strong> ' + esc(request.contact_name) + ' <span dir="ltr">' + esc(request.contact_phone) + '</span></div>' +
      '<div><strong>البريد:</strong> <span dir="ltr">' + esc(request.contact_email || '—') + '</span></div>' +
      '<div><strong>تفاصيل الطلب:</strong><p style="background:var(--o-subtle);padding:12px;border-radius:8px;white-space:pre-wrap;">' + esc(request.details || 'لا توجد تفاصيل إضافية') + '</p></div>' +
      '<div><label for="updateReqStatusSelect" style="display:block;font-weight:700;margin-bottom:6px;">تحديث الحالة:</label><select id="updateReqStatusSelect" class="btn-owner btn-owner-secondary" style="width:100%;">' + options + '</select></div>' +
      '<button type="button" class="btn-owner btn-owner-primary" id="saveServiceRequestBtn">حفظ التغييرات</button>' +
      '<p id="drawerActionStatus" role="status" style="margin:0"></p>' +
      '</div>');
    $('saveServiceRequestBtn').addEventListener('click', function () { saveRequestStatus(id); });
  }

  async function saveRequestStatus(id) {
    var client = getClient();
    var actionStatus = $('drawerActionStatus');
    if (!client) return;
    if (actionStatus) actionStatus.textContent = 'جارٍ حفظ الحالة…';
    var result = await client.from('service_requests').update({ status: $('updateReqStatusSelect').value }).eq('id', id).select('id,status').limit(1).maybeSingle();
    if (result.error || !result.data) {
      if (actionStatus) actionStatus.textContent = 'فشل التحديث: ' + (result.error ? result.error.message : 'لم يتم تحديث أي سجل.');
      return;
    }
    closeInspectionDrawer();
    await loadAllPlatformData();
  }

  function openProvisionModal() {
    if (!currentOperator) return;
    $('provisionModal').classList.remove('hidden');
    $('opNameInput').value = '';
    $('opSlugInput').value = '';
    $('opBranchInput').value = 'الفرع الرئيسي';
    $('opOwnerIdInput').value = '';
    setProvisionStatus('', false);
  }

  function closeProvisionModal() {
    $('provisionModal').classList.add('hidden');
  }

  async function handleProvisionSubmit() {
    var client = getClient();
    if (!client || !currentOperator) return;
    var name = $('opNameInput').value.trim();
    var slug = $('opSlugInput').value.trim().toLowerCase();
    var branch = $('opBranchInput').value.trim() || 'الفرع الرئيسي';
    var ownerId = $('opOwnerIdInput').value.trim();
    var button = $('submitProvisionBtn');
    if (!name || !slug || !ownerId) {
      setProvisionStatus('اسم النشاط والمعرّف ومعرّف مستخدم المالك حقول مطلوبة.', true);
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setProvisionStatus('المعرّف يجب أن يتضمن حروفًا إنجليزية صغيرة أو أرقامًا وشرطات فقط.', true);
      return;
    }
    if (!isValidUuid(ownerId)) {
      setProvisionStatus('أدخل معرّف مستخدم المالك بصيغة UUID صحيحة.', true);
      return;
    }
    button.disabled = true;
    button.textContent = 'جارٍ الإنشاء…';
    setProvisionStatus('جارٍ إنشاء النشاط والفرع…', false);
    try {
      var result = await client.rpc('provision_restaurant', {
        p_name: name,
        p_slug: slug,
        p_branch_name: branch,
        p_owner_user_id: ownerId,
        p_branch_slug: 'main'
      });
      if (result.error || !result.data || !result.data.tenant_id) throw result.error || new Error('لم تُرجع عملية التهيئة معرّف النشاط.');
      setProvisionStatus('تم إنشاء النشاط والفرع وربط حساب المالك بنجاح.', false);
      window.setTimeout(async function () {
        closeProvisionModal();
        await loadAllPlatformData();
      }, 800);
    } catch (error) {
      setProvisionStatus('فشل الإنشاء: ' + (error.message || 'تحقق من صلاحيات المشغّل وفرادة المعرّف.'), true);
    } finally {
      button.disabled = false;
      button.textContent = 'إنشاء النشاط التجاري';
    }
  }

  function setOwnerDrawer(open) {
    var sidebar = $('ownerSidebar');
    var overlay = $('ownerSidebarOverlay');
    var toggle = $('ownerMobileMenuBtn');
    if (!sidebar) return;
    var isOpen = Boolean(open);
    sidebar.classList.toggle('open', isOpen);
    sidebar.setAttribute('aria-hidden', String(!isOpen && window.matchMedia('(max-width: 900px)').matches));
    if (overlay) {
      overlay.classList.toggle('active', isOpen);
      overlay.setAttribute('aria-hidden', String(!isOpen));
    }
    document.body.classList.toggle('owner-drawer-open', isOpen);
    if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) sidebar.querySelector('.owner-nav-item.active').focus({ preventScroll: true });
  }

  function bindEvents() {
    $('opLoginBtn').addEventListener('click', handleLogin);
    $('opLogoutBtn').addEventListener('click', handleLogout);
    document.querySelectorAll('.owner-nav-item[data-panel]').forEach(function (button) {
      button.addEventListener('click', function () { switchPanel(button.dataset.panel); });
    });
    $('ownerMobileMenuBtn').addEventListener('click', function () {
      setOwnerDrawer(!$('ownerSidebar').classList.contains('open'));
    });
    $('ownerSidebarOverlay').addEventListener('click', function () { setOwnerDrawer(false); });
    $('openProvisionBtn').addEventListener('click', openProvisionModal);
    $('closeProvisionModalBtn').addEventListener('click', closeProvisionModal);
    $('closeProvisionBackdrop').addEventListener('click', closeProvisionModal);
    $('cancelProvisionBtn').addEventListener('click', closeProvisionModal);
    $('submitProvisionBtn').addEventListener('click', handleProvisionSubmit);
    $('closeDrawerBtn').addEventListener('click', closeInspectionDrawer);
    $('drawerBackdrop').addEventListener('click', closeInspectionDrawer);
    $('tenantSearchInput').addEventListener('input', function (event) { renderTenantsTable(event.target.value); });
    $('refreshPlatformDataBtn').addEventListener('click', async function () {
      var success = await loadAllPlatformData();
      if (!success) return;
      setText('platformSyncStatus', 'تم تحديث البيانات');
      window.setTimeout(function () { setText('platformSyncStatus', 'متصل وحي'); }, 1200);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      closeInspectionDrawer();
      closeProvisionModal();
      setOwnerDrawer(false);
    });
  }

  function boot() {
    bindEvents();
    setOwnerDrawer(false);
    initAuth();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
