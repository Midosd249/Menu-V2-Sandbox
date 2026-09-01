/* Client Portal Controller — Tenant Isolated Business Control */
(function() {
  'use strict';

  let supabaseClient = null;
  let currentUser = null;
  let authorizedTenants = [];
  let currentTenant = null;
  let currentBranches = [];
  let currentBranch = null;
  let categories = [];
  let products = [];
  let currentEditItem = null;
  let currentMemberRole = null;
  let authRevision = 0;
  let tenantRevision = 0;
  let productDataState = 'idle';
  let portalMode = 'idle';
  let lastModalTrigger = null;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);

  function getClient() {
    if (!supabaseClient && typeof window.getMenuSupabaseClient === 'function') {
      supabaseClient = window.getMenuSupabaseClient();
    }
    return supabaseClient;
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function publishPortalState(state, detail = {}) {
    window.clientPortalState = { state, mode: portalMode, tenantId: currentTenant?.id || null, role: currentMemberRole, ...detail };
    window.dispatchEvent(new CustomEvent('menu:client-portal-state', { detail: window.clientPortalState }));
  }

  function setPortalStatus(message = '', tone = 'info') {
    const status = $('clientPortalStatus');
    if (!status) return;
    status.hidden = !message;
    status.textContent = message;
    status.className = message ? `client-state is-${tone}` : 'client-state';
  }

  function setAuthStatus(message = '', isError = false) {
    const status = $('authStatus');
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? 'var(--c-red)' : 'var(--c-green)';
  }

  function resetTenantContext() {
    authorizedTenants = [];
    currentTenant = null;
    currentMemberRole = null;
    currentBranches = [];
    currentBranch = null;
    categories = [];
    products = [];
    productDataState = 'idle';
    ['statTotalProducts', 'statAvailableProducts', 'statUnavailableProducts', 'statFeaturedProducts'].forEach(id => setText(id, '—'));
    ['anTotalVisits', 'anTotalViews', 'anArVisitors', 'anEnVisitors'].forEach(id => setText(id, '—'));
    if ($('topProductsList')) $('topProductsList').innerHTML = '';
  }

  function applyMemberPermissions() {
    const canManageBusiness = currentMemberRole === 'owner' || currentMemberRole === 'admin';
    ['saveBrandBtn', 'saveBranchBtn'].forEach(id => {
      const button = $(id);
      if (!button) return;
      button.disabled = !canManageBusiness;
      button.title = canManageBusiness ? '' : 'إدارة الهوية والفروع متاحة للمالك أو المدير فقط.';
    });
    ['brandNameAr', 'brandTaglineAr', 'brandWhatsapp', 'brandWaTemplate', 'brandInstagram', 'brandPrimaryColor', 'brandSecondaryColor', 'brandLogoUrl', 'brandCoverUrl', 'branchNameInput', 'branchAddressInput', 'branchMapsInput'].forEach(id => {
      const field = $(id);
      if (field) field.disabled = !canManageBusiness;
    });
  }

  // Navigation Panel Switching
  function switchPanel(panelId) {
    document.querySelectorAll('.client-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.client-nav-item').forEach(b => b.classList.remove('active'));
    
    const panel = $('panel-' + panelId);
    if (panel) panel.classList.add('active');
    
    const navBtn = document.querySelector(`.client-nav-item[data-panel="${panelId}"]`);
    if (navBtn) navBtn.classList.add('active');

    // Close mobile sidebar if open
    const sidebar = $('clientSidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Title updates
    const titleMap = {
      overview: 'نظرة عامة',
      menu: 'إدارة المنيو والأصناف',
      branding: 'هوية النشاط',
      branches: 'الفروع ورمز QR',
      team: 'فريق العمل',
      analytics: 'تحليلات المنيو',
      services: 'الموقع والظهور والخدمات',
      settings: 'إعدادات الحساب'
    };
    if ($('pageTitle')) $('pageTitle').textContent = titleMap[panelId] || 'لوحة تحكم النشاط';

    if (panelId === 'analytics') void loadAnalytics(7);
  }

  // Authentication Flow
  async function initAuth() {
    const client = getClient();
    if (!client) {
      showAuthCard(true);
      setAuthStatus('تعذر تهيئة الاتصال الآمن. حدّث الصفحة ثم حاول مجددًا.', true);
      return;
    }

    setAuthStatus('جارٍ استعادة جلسة الدخول…');
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data?.session?.user) {
        await onUserAuthenticated(data.session.user);
      } else {
        showAuthCard(true);
        setAuthStatus('');
      }
    } catch (error) {
      console.error('Client session restore failed:', error);
      showAuthCard(true);
      setAuthStatus('تعذر استعادة جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.', true);
    }

    client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (session?.user) {
          void onUserAuthenticated(session.user);
        } else {
          authRevision += 1;
          tenantRevision += 1;
          currentUser = null;
          portalMode = 'idle';
          resetTenantContext();
          showAuthCard(true);
          setPortalStatus('');
          publishPortalState('signed-out');
        }
      }, 0);
    });
  }

  function showAuthCard(show) {
    $('authSection').hidden = !show;
    $('dashboardContent').hidden = show;
  }

  async function handleLogin() {
    const emailInput = $('authEmail');
    const passwordInput = $('authPassword');
    const button = $('loginBtn');
    if (!emailInput?.reportValidity() || !passwordInput?.reportValidity()) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    setAuthStatus('جارٍ التحقق من بيانات الدخول…');
    if (button) {
      button.disabled = true;
      button.textContent = 'جارٍ تسجيل الدخول…';
    }

    const client = getClient();
    try {
      if (!client) throw new Error('تعذر تهيئة الاتصال الآمن.');
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      const message = /invalid login credentials/i.test(String(error?.message || ''))
        ? 'بيانات الدخول غير صحيحة.'
        : 'تعذر تسجيل الدخول: ' + (error?.message || 'حاول مرة أخرى.');
      setAuthStatus(message, true);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'تسجيل الدخول';
      }
    }
  }

  async function handleLogout() {
    const client = getClient();
    authRevision += 1;
    tenantRevision += 1;
    try {
      if (client) {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      }
      currentUser = null;
      portalMode = 'idle';
      resetTenantContext();
      showAuthCard(true);
      setAuthStatus('تم تسجيل الخروج بنجاح.');
      setPortalStatus('');
      publishPortalState('signed-out');
    } catch (error) {
      setPortalStatus('تعذر إكمال تسجيل الخروج: ' + (error?.message || 'حاول مجددًا.'), 'error');
    }
  }

  async function onUserAuthenticated(user) {
    const revision = ++authRevision;
    tenantRevision += 1;
    currentUser = user;
    portalMode = 'live';
    resetTenantContext();
    setText('userEmailDisplay', user.email || '—');
    if ($('settingsUserEmail')) $('settingsUserEmail').value = user.email || '';
    showAuthCard(false);
    setPortalStatus('جارٍ تحميل الأنشطة المصرح بها…');
    publishPortalState('loading');
    await loadAuthorizedTenants(revision);
  }

  // Tenant Isolation and Loading
  async function loadAuthorizedTenants(revision = authRevision) {
    const client = getClient();
    if (!client || !currentUser) return;

    try {
      const { data: memberships, error: memError } = await client
        .from('tenant_members')
        .select('tenant_id, role')
        .eq('user_id', currentUser.id)
        .limit(100);

      if (memError) throw memError;
      if (revision !== authRevision) return;

      if (!memberships || !memberships.length) {
        $('noTenantNotice').hidden = false;
        $('tenantControls').hidden = true;
        setPortalStatus('لا توجد عضوية نشاط مرتبطة بهذا الحساب. تواصل مع مالك النشاط أو فريق المنصة لطلب الوصول.', 'error');
        publishPortalState('no-tenant');
        return;
      }

      $('noTenantNotice').hidden = true;
      $('tenantControls').hidden = false;

      const tenantIds = memberships.map(m => m.tenant_id);
      const { data: tenants, error: tError } = await client
        .from('tenants')
        .select('id,slug,name,tagline,whatsapp,whatsapp_message_template,instagram_url,primary_color,secondary_color,logo_url,cover_url')
        .in('id', tenantIds)
        .order('name')
        .limit(100);

      if (tError) throw tError;
      if (revision !== authRevision) return;

      const rolesByTenant = new Map(memberships.map(membership => [membership.tenant_id, membership.role]));
      authorizedTenants = (tenants || []).map(tenant => ({ ...tenant, membershipRole: rolesByTenant.get(tenant.id) || 'editor' }));
      if (!authorizedTenants.length) {
        $('noTenantNotice').hidden = false;
        $('tenantControls').hidden = true;
        setPortalStatus('لا يمكن تحميل بيانات النشاط المصرح به. تحقق من الصلاحيات ثم حاول مجددًا.', 'error');
        publishPortalState('error');
        return;
      }
      const select = $('clientTenantSelect');
      select.innerHTML = authorizedTenants.map(t => `<option value="${t.id}">${esc(t.name)} (${esc(t.slug)})</option>`).join('');

      if (authorizedTenants.length > 0) {
        await selectTenant(authorizedTenants[0].id, revision);
      }
    } catch (err) {
      if (revision !== authRevision) return;
      console.error('Error loading tenants:', err);
      $('noTenantNotice').hidden = false;
      $('tenantControls').hidden = true;
      showError('تعذر تحميل بيانات النشاط: ' + (err.message || 'تحقق من الاتصال ثم أعد المحاولة.'));
      publishPortalState('error');
    }
  }

  async function selectTenant(tenantId, authCheckRevision = authRevision) {
    const selectionRevision = ++tenantRevision;
    currentTenant = authorizedTenants.find(t => t.id === tenantId);
    if (!currentTenant) return;
    currentMemberRole = currentTenant.membershipRole || 'editor';
    currentBranches = [];
    currentBranch = null;
    categories = [];
    products = [];
    productDataState = 'loading';
    renderProductTable();

    setText('currentTenantName', currentTenant.name);
    setText('currentTenantSlug', currentTenant.slug);
    setText('sidebarBrandMark', currentTenant.name ? currentTenant.name[0] : 'M');

    // Populate Brand Form
    $('brandNameAr').value = currentTenant.name || '';
    $('brandTaglineAr').value = currentTenant.tagline || '';
    $('brandWhatsapp').value = currentTenant.whatsapp || '';
    $('brandWaTemplate').value = currentTenant.whatsapp_message_template || '';
    $('brandInstagram').value = currentTenant.instagram_url || '';
    $('brandPrimaryColor').value = currentTenant.primary_color || '#14110f';
    $('brandSecondaryColor').value = currentTenant.secondary_color || '#9e6438';
    $('brandLogoUrl').value = currentTenant.logo_url || '';
    $('brandCoverUrl').value = currentTenant.cover_url || '';
    if ($('settingsTenantSlug')) $('settingsTenantSlug').value = currentTenant.slug || '';
    applyMemberPermissions();
    setPortalStatus('جارٍ تحميل بيانات النشاط…');
    publishPortalState('loading');

    try {
      await Promise.all([loadBranches(selectionRevision), loadCategories(selectionRevision), loadProducts(selectionRevision)]);
      if (selectionRevision !== tenantRevision || authCheckRevision !== authRevision) return;
      updateOverviewStats();
      setPortalStatus('');
      publishPortalState('ready');
    } catch (error) {
      if (selectionRevision !== tenantRevision || authCheckRevision !== authRevision) return;
      productDataState = 'error';
      renderProductTable();
      updateOverviewStats();
      showError('تعذر تحميل تفاصيل النشاط: ' + (error?.message || 'حاول مرة أخرى.'));
      publishPortalState('error');
    }
  }

  async function loadBranches(selectionRevision) {
    const client = getClient();
    if (!client || !currentTenant) return;

    const { data, error } = await client
      .from('branches')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .order('created_at');

    if (error) throw error;
    if (selectionRevision !== tenantRevision) return;

    currentBranches = data || [];
    populateBranchSelect();

    if (currentBranches.length > 0) {
      currentBranch = currentBranches[0];
      populateBranchForm();
    }
  }

  function populateBranchSelect() {
    const select = $('clientBranchSelect');
    if (!select) return;
    select.innerHTML = currentBranches.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
  }

  function populateBranchForm() {
    if (!currentBranch) return;
    $('branchNameInput').value = currentBranch.name || '';
    $('branchAddressInput').value = currentBranch.address || '';
    $('branchMapsInput').value = currentBranch.maps_url || '';

    updateQrCode();
  }

  function updateQrCode() {
    if (!currentTenant || !currentBranch) return;
    const origin = window.location.origin;
    const url = `${origin}/m/${encodeURIComponent(currentTenant.slug)}/${encodeURIComponent(currentBranch.slug)}`;
    
    if ($('qrLinkText')) $('qrLinkText').value = url;
    if ($('menuLivePreviewLink')) $('menuLivePreviewLink').href = url;

    const canvas = $('qrCanvas');
    if (canvas && window.QRCode && window.QRCode.toCanvas) {
      window.QRCode.toCanvas(canvas, url, {
        width: 180,
        margin: 2,
        color: {
          dark: currentTenant.primary_color || '#14110f',
          light: '#ffffff'
        }
      });
    }

    const quickCanvas = $('qrCanvasQuick');
    if (quickCanvas && window.QRCode && window.QRCode.toCanvas) {
      window.QRCode.toCanvas(quickCanvas, url, {
        width: 140,
        margin: 2,
        color: {
          dark: currentTenant.primary_color || '#14110f',
          light: '#ffffff'
        }
      });
    }
  }

  const generateQrCode = updateQrCode;

  // Categories & Products
  async function loadCategories(selectionRevision) {
    const client = getClient();
    if (!client || !currentTenant) return;

    const { data, error } = await client
      .from('categories')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .order('sort_order');

    if (error) throw error;
    if (selectionRevision !== tenantRevision) return;

    categories = data || [];
    populateCategorySelect();
  }

  function populateCategorySelect() {
    const select = $('itemCategorySelect');
    if (!select) return;
    select.innerHTML = categories.map(c => `<option value="${c.id}">${esc(c.name_ar)} / ${esc(c.name_en || '')}</option>`).join('');
  }

  async function loadProducts(selectionRevision) {
    const client = getClient();
    if (!client || !currentTenant) return;

    productDataState = 'loading';
    products = [];
    $('productsLoading').hidden = false;
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .order('sort_order');

    $('productsLoading').hidden = true;
    if (error) throw error;
    if (selectionRevision !== tenantRevision) return;

    products = data || [];
    productDataState = 'ready';
    renderProductTable();
    updateOverviewStats();
  }

  function renderProductTable(filterQuery = '') {
    const tbody = $('productsTableBody');
    if (!tbody) return;
    if (productDataState === 'loading') {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--c-muted)">جارٍ تحميل الأصناف…</td></tr>';
      return;
    }
    if (productDataState === 'error') {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--c-red)">تعذر تحميل الأصناف. حدّث الصفحة أو أعد اختيار النشاط وحاول مجددًا.</td></tr>';
      return;
    }

    let displayProducts = products;
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      displayProducts = products.filter(p => 
        (p.name_ar && p.name_ar.toLowerCase().includes(q)) || 
        (p.name_en && p.name_en.toLowerCase().includes(q))
      );
    }

    if (!displayProducts.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--c-muted)">لا توجد أصناف مطابقة. انقر على "+ إضافة صنف" للبدء.</td></tr>`;
      return;
    }

    tbody.innerHTML = displayProducts.map(p => {
      const cat = categories.find(c => c.id === p.category_id);
      const catName = cat ? cat.name_ar : '—';
      const img = p.image_url ? `<img src="${esc(p.image_url)}" class="item-thumb" alt="${esc(p.name_ar)}">` : `<div class="item-thumb" style="display:grid;place-items:center;font-size:18px">🍽️</div>`;
      
      return `
        <tr>
          <td data-label="الصورة" style="width:60px">${img}</td>
          <td data-label="الصنف">
            <strong>${esc(p.name_ar)}</strong>
            <small style="display:block;color:var(--c-muted)">${esc(p.name_en || '')}</small>
          </td>
          <td data-label="القسم">${esc(catName)}</td>
          <td data-label="السعر"><strong>${Number(p.price || 0).toFixed(2)} ${esc(p.currency || 'SAR')}</strong></td>
          <td data-label="التوفر">
            <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" class="toggle-switch" data-id="${p.id}" ${p.is_available ? 'checked' : ''} aria-label="تبديل التوفر">
              <span style="font-size:12px;color:${p.is_available ? 'var(--c-green)' : 'var(--c-muted)'}">${p.is_available ? 'متاح' : 'غير متوفر'}</span>
            </label>
          </td>
          <td data-label="إجراءات">
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="m-btn m-btn-secondary m-btn-sm" onclick="window.clientEditProduct('${p.id}')">تعديل</button>
              <button class="m-btn m-btn-ghost m-btn-sm" style="color:var(--c-red)" onclick="window.clientDeleteProduct('${p.id}')">حذف</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach toggle handlers
    tbody.querySelectorAll('.toggle-switch').forEach(sw => {
      sw.onchange = async e => {
        const id = e.target.dataset.id;
        const isAvailable = e.target.checked;
        await toggleProductAvailability(id, isAvailable, e.target);
      };
    });
  }

  const renderProductsTable = renderProductTable;

  async function toggleProductAvailability(productId, isAvailable, control) {
    const client = getClient();
    if (!client || !currentTenant) return;

    if (control) control.disabled = true;
    try {
      const { error } = await client
        .from('products')
        .update({ is_available: isAvailable })
        .eq('id', productId)
        .eq('tenant_id', currentTenant.id);
      if (error) throw error;
      const prod = products.find(p => p.id === productId);
      if (prod) prod.is_available = isAvailable;
      updateOverviewStats();
      setPortalStatus('تم تحديث توفر الصنف.');
    } catch (error) {
      showError('تعذر تحديث التوفر: ' + (error?.message || 'حاول مجددًا.'));
      await loadProducts(tenantRevision);
    } finally {
      if (control) control.disabled = false;
    }
  }

  function updateOverviewStats() {
    const hasConfirmedData = productDataState === 'ready';
    setText('statTotalProducts', hasConfirmedData ? String(products.length) : '—');
    setText('statAvailableProducts', hasConfirmedData ? String(products.filter(p => p.is_available).length) : '—');
    setText('statUnavailableProducts', hasConfirmedData ? String(products.filter(p => !p.is_available).length) : '—');
    setText('statFeaturedProducts', hasConfirmedData ? String(products.filter(p => p.is_featured).length) : '—');
  }

  // Add / Edit Product Modal
  function openProductModal(product = null) {
    if (!currentTenant) return;
    lastModalTrigger = document.activeElement;
    currentEditItem = product;
    $('productModalTitle').textContent = product ? 'تعديل صنف' : 'إضافة صنف جديد';
    
    $('itemNameAr').value = product ? product.name_ar : '';
    $('itemNameEn').value = product ? product.name_en || '' : '';
    $('itemDescAr').value = product ? product.description_ar || '' : '';
    $('itemDescEn').value = product ? product.description_en || '' : '';
    $('itemPrice').value = product ? product.price : '';
    $('itemCalories').value = product ? product.calories || '' : '';
    $('itemCategorySelect').value = product ? product.category_id : (categories[0]?.id || '');
    $('itemAvailable').checked = product ? product.is_available : true;
    $('itemFeatured').checked = product ? product.is_featured : false;
    $('itemImageUrl').value = product ? product.image_url || '' : '';
    $('itemImageFile').value = '';
    previewClientImage(product?.image_url || '', product ? 'الصورة الحالية' : '');

    $('productModal').classList.remove('hidden');
    document.body.classList.add('client-drawer-open');
    window.setTimeout(() => $('itemNameAr')?.focus({ preventScroll: true }), 0);
  }

  function previewClientImage(url, label) {
    const box = $('itemImagePreviewBox'), image = $('itemImagePreview'), caption = $('itemImagePreviewLabel');
    if (!box || !image) return;
    if (!url) { box.hidden = true; image.removeAttribute('src'); return; }
    image.onerror = () => { box.hidden = true; };
    image.onload = () => { box.hidden = false; };
    image.src = url;
    if (caption) caption.textContent = label || 'معاينة الصورة';
  }
  $('itemImageUrl')?.addEventListener('input', e => {
    const value = e.target.value.trim();
    if (!value) return previewClientImage('');
    try { const u = new URL(value); if (!['http:', 'https:'].includes(u.protocol)) throw new Error(); previewClientImage(value, 'معاينة الرابط'); } catch (_) { previewClientImage(''); }
  });
  $('itemImageFile')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file && !$('itemImageUrl')?.value.trim()) previewClientImage(URL.createObjectURL(file), file.name);
  });

  function closeProductModal() {
    $('productModal').classList.add('hidden');
    document.body.classList.remove('client-drawer-open');
    currentEditItem = null;
    if (lastModalTrigger?.focus) lastModalTrigger.focus({ preventScroll: true });
    lastModalTrigger = null;
  }

  async function saveProduct() {
    const client = getClient();
    if (!client || !currentTenant) return;

    const nameAr = $('itemNameAr').value.trim();
    if (!nameAr) {
      setPortalStatus('اسم الصنف بالعربية مطلوب.', 'error');
      $('itemNameAr').focus();
      return;
    }
    const rawPrice = $('itemPrice').value.trim();
    const price = Number(rawPrice);
    if (!rawPrice || !Number.isFinite(price) || price < 0) {
      setPortalStatus('أدخل سعرًا صالحًا يساوي صفرًا أو أكبر.', 'error');
      $('itemPrice').focus();
      return;
    }

    const imageUrl = $('itemImageUrl').value.trim();
    if (imageUrl) {
      try { const u = new URL(imageUrl); if (!['http:', 'https:'].includes(u.protocol)) throw new Error(); }
      catch (_) { setPortalStatus('رابط الصورة يجب أن يبدأ بـ http أو https.', 'error'); $('itemImageUrl').focus(); return; }
    }

    const payload = {
      tenant_id: currentTenant.id,
      name_ar: nameAr,
      name_en: $('itemNameEn').value.trim() || null,
      description_ar: $('itemDescAr').value.trim() || null,
      description_en: $('itemDescEn').value.trim() || null,
      price,
      calories: parseInt($('itemCalories').value) || null,
      category_id: $('itemCategorySelect').value || null,
      is_available: $('itemAvailable').checked,
      is_featured: $('itemFeatured').checked,
      image_url: imageUrl || null,
      currency: 'SAR'
    };

    $('saveProductBtn').disabled = true;
    $('saveProductBtn').textContent = 'جارٍ الحفظ…';

    try {
      if (currentEditItem) {
        const { error } = await client
          .from('products')
          .update(payload)
          .eq('id', currentEditItem.id)
          .eq('tenant_id', currentTenant.id);
        if (error) throw error;
      } else {
        const { error } = await client
          .from('products')
          .insert(payload);
        if (error) throw error;
      }

      const imageFile = $('itemImageFile')?.files?.[0];
      if (imageFile && !imageUrl) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024) throw new Error('الصورة يجب أن تكون JPG أو PNG أو WebP وبحجم أقل من 5MB.');
        const path = `${currentTenant.id}/products/${crypto.randomUUID()}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '') || 'product-image'}`;
        const upload = await client.storage.from('menu-assets').upload(path, imageFile, { upsert: false, contentType: imageFile.type });
        if (upload.error) throw upload.error;
        const uploadedUrl = client.storage.from('menu-assets').getPublicUrl(path).data.publicUrl;
        const target = currentEditItem?.id || (await client.from('products').select('id').eq('tenant_id', currentTenant.id).eq('name_ar', nameAr).order('updated_at', { ascending: false }).limit(1).maybeSingle()).data?.id;
        if (!target) throw new Error('تعذر تحديد المنتج بعد الحفظ.');
        const imageUpdate = await client.from('products').update({ image_url: uploadedUrl }).eq('id', target).eq('tenant_id', currentTenant.id);
        if (imageUpdate.error) throw imageUpdate.error;
      }

      closeProductModal();
      await loadProducts(tenantRevision);
      setPortalStatus('تم حفظ الصنف بنجاح.');
    } catch (err) {
      setPortalStatus('فشل حفظ الصنف: ' + (err.message || 'خطأ غير معروف'), 'error');
    } finally {
      $('saveProductBtn').disabled = false;
      $('saveProductBtn').textContent = 'حفظ الصنف';
    }
  }

  async function deleteProduct(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف نهائيًا؟')) return;
    const client = getClient();
    if (!client || !currentTenant) return;

    const { error } = await client
      .from('products')
      .delete()
      .eq('id', id)
      .eq('tenant_id', currentTenant.id);

    if (error) {
      setPortalStatus('فشل حذف الصنف: ' + error.message, 'error');
    } else {
      await loadProducts(tenantRevision);
      setPortalStatus('تم حذف الصنف.');
    }
  }

  // Save Brand Details
  async function saveBrandDetails() {
    const client = getClient();
    if (!client || !currentTenant) return;

    const payload = {
      name: $('brandNameAr').value.trim(),
      tagline: $('brandTaglineAr').value.trim() || null,
      whatsapp: $('brandWhatsapp').value.trim() || null,
      whatsapp_message_template: $('brandWaTemplate').value.trim() || null,
      instagram_url: $('brandInstagram').value.trim() || null,
      primary_color: $('brandPrimaryColor').value,
      secondary_color: $('brandSecondaryColor').value,
      logo_url: $('brandLogoUrl').value.trim() || null,
      cover_url: $('brandCoverUrl').value.trim() || null
    };

    const btn = $('saveBrandBtn');
    btn.disabled = true;
    btn.textContent = 'جارٍ الحفظ…';

    try {
      const { error } = await client
        .from('tenants')
        .update(payload)
        .eq('id', currentTenant.id);
      if (error) throw error;
      Object.assign(currentTenant, payload);
      setText('currentTenantName', currentTenant.name);
      setPortalStatus('تم حفظ هوية النشاط بنجاح.');
    } catch (error) {
      setPortalStatus('فشل حفظ الهوية: ' + (error?.message || 'حاول مجددًا.'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'حفظ التعديلات';
    }
  }

  // Save Branch Details
  async function saveBranchDetails() {
    const client = getClient();
    if (!client || !currentBranch) return;

    const payload = {
      name: $('branchNameInput').value.trim(),
      address: $('branchAddressInput').value.trim() || null,
      maps_url: $('branchMapsInput').value.trim() || null
    };

    const btn = $('saveBranchBtn');
    btn.disabled = true;
    btn.textContent = 'جارٍ الحفظ…';

    try {
      const { error } = await client
        .from('branches')
        .update(payload)
        .eq('id', currentBranch.id)
        .eq('tenant_id', currentTenant.id);
      if (error) throw error;
      Object.assign(currentBranch, payload);
      updateQrCode();
      setPortalStatus('تم حفظ بيانات الفرع بنجاح.');
    } catch (error) {
      setPortalStatus('فشل حفظ الفرع: ' + (error?.message || 'حاول مجددًا.'), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'حفظ بيانات الفرع';
    }
  }

  // Analytics Loader
  async function loadAnalytics(days = 7) {
    const client = getClient();
    if (!client || !currentTenant) return;

    $('analyticsLoading').hidden = false;
    $('analyticsContent').hidden = true;

    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data: events, error } = await client
        .from('menu_events')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .gte('created_at', since);

      $('analyticsLoading').hidden = true;
      $('analyticsContent').hidden = false;

      if (error) throw error;

      const visits = (events || []).filter(e => e.event_type === 'visit');
      const views = (events || []).filter(e => e.event_type === 'product_view');

      $('anTotalVisits').textContent = visits.length;
      $('anTotalViews').textContent = views.length;

      const arCount = (events || []).filter(e => e.lang === 'ar').length;
      const enCount = (events || []).filter(e => e.lang === 'en').length;
      $('anArVisitors').textContent = arCount;
      $('anEnVisitors').textContent = enCount;

      // Top Products Count
      const prodCounts = {};
      views.forEach(v => {
        if (v.product_id) prodCounts[v.product_id] = (prodCounts[v.product_id] || 0) + 1;
      });

      const sortedProds = Object.entries(prodCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const topList = $('topProductsList');
      if (sortedProds.length === 0) {
        topList.innerHTML = '<p class="muted">لا توجد عروض للأصناف خلال هذه الفترة بعد.</p>';
      } else {
        topList.innerHTML = sortedProds.map(([id, count]) => {
          const p = products.find(prod => prod.id === id);
          return `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--c-line)">
              <span>${esc(p ? p.name_ar : 'صنف غير معروف')}</span>
              <strong>${count} مشاهدة</strong>
            </div>
          `;
        }).join('');
      }
      $('analyticsContent').hidden = false;
    } catch (err) {
      console.error('Analytics error:', err);
      ['anTotalVisits', 'anTotalViews', 'anArVisitors', 'anEnVisitors'].forEach(id => setText(id, '—'));
      if ($('topProductsList')) $('topProductsList').innerHTML = '<p class="muted">تعذر تحميل التحليلات. تحقق من الاتصال أو الصلاحيات ثم حاول مجددًا.</p>';
      $('analyticsContent').hidden = false;
    } finally {
      $('analyticsLoading').hidden = true;
    }
  }

  // Global Helper functions
  function showError(msg) {
    console.error(msg);
    setPortalStatus(msg, 'error');
  }

  // Window Exports for DOM Handlers
  window.clientEditProduct = id => {
    const prod = products.find(p => p.id === id);
    if (prod) openProductModal(prod);
  };
  window.clientDeleteProduct = id => deleteProduct(id);

  const DEMO_CLIENT_DATA = {
    maqsoud: {
      tenant: {
        id: 'demo-tenant-maqsoud',
        name: 'مقصود — MAQSOUD',
        slug: 'maqsoud',
        tagline: 'شاورما، بروستد ومأكولات سريعة · الملز، الرياض',
        whatsapp: '+966500000000',
        whatsapp_message_template: 'السلام عليكم، أريد الاستفسار/طلب {product} من مقصود.',
        instagram_url: 'https://instagram.com',
        primary_color: '#1c1714',
        secondary_color: '#c85a17',
        logo_url: '',
        cover_url: ''
      },
      branches: [
        { id: 'branch-malaz', tenant_id: 'demo-tenant-maqsoud', name: 'فرع الملز', slug: 'malaz', address: 'طريق صلاح الدين الأيوبي، حي الملز، الرياض 11564', phone: '+966500000000', maps_url: 'https://maps.google.com/?q=MP8J%2B8F2%2C+Salah+Ad+Din+Al+Ayyubi+Rd%2C+Al+Malaz%2C+Riyadh+11564', is_active: true }
      ],
      categories: [
        { id: 'cat-new', name_ar: 'جديد', name_en: 'New', sort_order: 1 },
        { id: 'cat-shawarma', name_ar: 'شاورما', name_en: 'Shawarma', sort_order: 2 },
        { id: 'cat-mshawi', name_ar: 'مشاوي', name_en: 'Grills', sort_order: 3 },
        { id: 'cat-appetizers', name_ar: 'مقبلات وبطاطس', name_en: 'Appetizers & Fries', sort_order: 4 },
        { id: 'cat-juices', name_ar: 'عصيرات طازجة', name_en: 'Fresh Juices', sort_order: 5 },
        { id: 'cat-sweet', name_ar: 'حلويات', name_en: 'Sweets', sort_order: 6 }
      ],
      products: [
        { id: 'item-1', category_id: 'cat-new', name_ar: 'فطيرة عكاوي شاورما', name_en: 'Akkawi Shawarma Pie', description_ar: 'عكاوي شاورما طازجة بالفرن', description_en: 'Freshly baked Akkawi cheese & shawarma pie', price: 18.0, is_available: true, is_featured: true, currency: 'SAR' },
        { id: 'item-2', category_id: 'cat-shawarma', name_ar: 'شاورما دجاج الملز', name_en: 'Malaz Chicken Shawarma', description_ar: 'خبز عربي، دجاج، سلطة الملز، طحينة، ثوم، مخلل وبطاطس', description_en: 'Arabic bread, chicken, Malaz salad, tahini, garlic, pickles and potatoes', price: 12.0, is_available: true, is_featured: true, currency: 'SAR' },
        { id: 'item-3', category_id: 'cat-shawarma', name_ar: 'شاورما عربي دجاج', name_en: 'Arabic Chicken Shawarma', description_ar: 'خبز صاج عربي محمص، دجاج، مخلل بالثوم وبطاطس', description_en: 'Toasted Arabic saj bread, chicken, garlic pickles and potatoes', price: 25.0, is_available: true, is_featured: true, currency: 'SAR' },
        { id: 'item-4', category_id: 'cat-shawarma', name_ar: 'شاورما دجاج كلاسيك', name_en: 'Classic Chicken Shawarma', description_ar: 'خبز عربي، دجاج، ثوم، مخلل وبطاطس', description_en: 'Arabic bread, chicken, garlic, pickles and potatoes', price: 10.5, is_available: true, is_featured: false, currency: 'SAR' },
        { id: 'item-5', category_id: 'cat-mshawi', name_ar: 'كباب لحم بلدي', name_en: 'Beef Kebab', description_ar: 'كباب لحم بلدي طازج مشوي على الفحم', description_en: 'Fresh grilled beef kebab skewer', price: 9.5, is_available: true, is_featured: true, currency: 'SAR' },
        { id: 'item-6', category_id: 'cat-appetizers', name_ar: 'بطاطس الملز الخاصة', name_en: 'Malaz Special Fries', description_ar: 'بطاطا مقلية محلية طازجة مع كاتشب الثوم والكمون', description_en: 'Fresh local fries with Malaz garlic ketchup and cumin', price: 14.0, is_available: true, is_featured: true, currency: 'SAR' },
        { id: 'item-7', category_id: 'cat-juices', name_ar: 'عصير كوكتيل كبير', name_en: 'Large Cocktail Juice', description_ar: 'عصير كوكتيل فواكه طبيعي وطازج', description_en: 'Fresh large mixed fruit cocktail juice', price: 13.0, is_available: true, is_featured: true, currency: 'SAR' },
        { id: 'item-8', category_id: 'cat-sweet', name_ar: 'بسبوسة الملز بالقشطة', name_en: 'Malaz Basbousa with Cream', description_ar: 'بسبوسة طازجة محشوة بالقشطة البلدية', description_en: 'Fresh baked basbousa filled with clotted cream', price: 9.0, is_available: true, is_featured: true, currency: 'SAR' }
      ]
    },
    oaza: {
      tenant: {
        id: 'demo-tenant-oaza',
        name: 'أوزا كافيه — Oaza Coffee',
        slug: 'oaza',
        tagline: 'قهوة مختصة، تفاصيل تستحق التوقف.',
        whatsapp: '+966566332329',
        whatsapp_message_template: 'السلام عليكم، أريد طلب {product} من أوزا كافيه.',
        instagram_url: 'https://instagram.com/oaza.ksa',
        primary_color: '#15120f',
        secondary_color: '#a26a42',
        logo_url: '',
        cover_url: ''
      },
      branches: [
        { id: 'branch-olaya', tenant_id: 'demo-tenant-oaza', name: 'فرع العليا الرئيسي', slug: 'olaya', address: 'طريق الأمير محمد بن عبدالعزيز · الرياض', phone: '+966566332329', maps_url: 'https://maps.google.com/?q=Oaza+Coffee+Riyadh', is_active: true }
      ],
      categories: [
        { id: 'cat-hot', name_ar: 'القهوة الساخنة', name_en: 'Hot Coffee', sort_order: 1 },
        { id: 'cat-cold', name_ar: 'القهوة الباردة', name_en: 'Cold Coffee', sort_order: 2 },
        { id: 'cat-dessert', name_ar: 'الحلويات', name_en: 'Desserts', sort_order: 3 }
      ],
      products: [
        { id: 'item-v60', category_id: 'cat-hot', name_ar: 'V60 كولومبيا سوبريمو', name_en: 'V60 Colombia', description_ar: 'قهوة مقطرة بنكهة فاكهية واضحة', description_en: 'A bright, fruity Colombian pour over', price: 22.0, is_available: true, is_featured: true, currency: 'SAR' },
        { id: 'item-flatwhite', category_id: 'cat-hot', name_ar: 'فلات وايت كلاسيك', name_en: 'Flat White', description_ar: 'إسبريسو مزدوج مع حليب مبخر ناعم', description_en: 'Double espresso with velvety steamed milk', price: 16.0, is_available: true, is_featured: true, currency: 'SAR' },
        { id: 'item-spanish', category_id: 'cat-cold', name_ar: 'آيس سبانيش لاتيه', name_en: 'Iced Spanish Latte', description_ar: 'إسبريسو، حليب وحليب مكثف بنكهة غنية', description_en: 'Espresso, milk and condensed milk over ice', price: 18.0, is_available: true, is_featured: true, currency: 'SAR' },
        { id: 'item-frenchtoast', category_id: 'cat-dessert', name_ar: 'فرنش توست كلاسيك', name_en: 'Classic French Toast', description_ar: 'بريوش محمص مع خيارات من الشراب والفواكه', description_en: 'Toasted brioche with syrup and fruit options', price: 19.0, is_available: true, is_featured: true, currency: 'SAR' }
      ]
    }
  };

  function simulateClientDemo(tenantSlug = 'maqsoud') {
    authRevision += 1;
    tenantRevision += 1;
    const demo = DEMO_CLIENT_DATA[tenantSlug] || DEMO_CLIENT_DATA.maqsoud;
    currentUser = { email: `demo@${demo.tenant.slug}.menu.sa`, id: 'demo-user-' + demo.tenant.slug };
    portalMode = 'demo';
    currentMemberRole = 'owner';
    setText('userEmailDisplay', `${currentUser.email} (Sandbox Demo)`);
    if ($('settingsUserEmail')) $('settingsUserEmail').value = currentUser.email;
    showAuthCard(false);

    authorizedTenants = [DEMO_CLIENT_DATA.maqsoud.tenant, DEMO_CLIENT_DATA.oaza.tenant];
    const select = $('clientTenantSelect');
    select.innerHTML = authorizedTenants.map(t => `<option value="${t.id}" ${t.id === demo.tenant.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('');

    currentTenant = { ...demo.tenant, membershipRole: 'owner' };
    currentBranches = demo.branches;
    currentBranch = demo.branches[0];
    categories = demo.categories;
    products = demo.products;
    productDataState = 'ready';

    setText('currentTenantName', currentTenant.name);
    setText('currentTenantSlug', currentTenant.slug);
    setText('sidebarBrandMark', currentTenant.name ? currentTenant.name[0] : 'M');
    if ($('settingsTenantSlug')) $('settingsTenantSlug').value = currentTenant.slug;

    // Populate forms and tables
    $('brandNameAr').value = currentTenant.name || '';
    $('brandTaglineAr').value = currentTenant.tagline || '';
    $('brandWhatsapp').value = currentTenant.whatsapp || '';
    $('brandWaTemplate').value = currentTenant.whatsapp_message_template || '';
    $('brandInstagram').value = currentTenant.instagram_url || '';
    $('brandPrimaryColor').value = currentTenant.primary_color || '#14110f';
    $('brandSecondaryColor').value = currentTenant.secondary_color || '#9e6438';

    populateBranchSelect();
    populateBranchForm();
    populateCategorySelect();
    renderProductsTable();
    updateOverviewStats();
    generateQrCode();
    applyMemberPermissions();
    setPortalStatus('أنت الآن في عرض توضيحي محلي فقط. لا تُرسل التعديلات إلى بيانات الإنتاج.', 'info');
    publishPortalState('ready', { mode: 'demo' });
  }

  // Initialization & Event Binding
  document.addEventListener('DOMContentLoaded', () => {
    initAuth();

    // Login & Logout & Demo Simulation
    $('loginBtn')?.addEventListener('click', handleLogin);
    $('demoMaqsoudBtn')?.addEventListener('click', () => simulateClientDemo('maqsoud'));
    $('demoOazaBtn')?.addEventListener('click', () => simulateClientDemo('oaza'));
    $('logoutBtn')?.addEventListener('click', handleLogout);

    // Navigation Items
    document.querySelectorAll('.client-nav-item[data-panel]').forEach(btn => {
      btn.addEventListener('click', () => {
        switchPanel(btn.dataset.panel);
        $('clientSidebar')?.classList.remove('open');
        $('clientSidebarOverlay')?.classList.remove('active');
        document.body.classList.remove('client-drawer-open');
        $('mobileMenuToggle')?.setAttribute('aria-expanded', 'false');
      });
    });

    // Mobile Sidebar Toggle
    $('mobileMenuToggle')?.addEventListener('click', () => {
      const isOpen = $('clientSidebar')?.classList.toggle('open');
      $('clientSidebarOverlay')?.classList.toggle('active');
      document.body.classList.toggle('client-drawer-open', Boolean(isOpen));
      $('mobileMenuToggle')?.setAttribute('aria-expanded', String(Boolean(isOpen)));
    });

    $('clientSidebarOverlay')?.addEventListener('click', () => {
      $('clientSidebar')?.classList.remove('open');
      $('clientSidebarOverlay')?.classList.remove('active');
      document.body.classList.remove('client-drawer-open');
      $('mobileMenuToggle')?.setAttribute('aria-expanded', 'false');
    });

    // Tenant Selection Change
    $('clientTenantSelect')?.addEventListener('change', e => {
      void selectTenant(e.target.value);
    });

    // Branch Selection Change
    $('clientBranchSelect')?.addEventListener('change', e => {
      currentBranch = currentBranches.find(b => b.id === e.target.value);
      populateBranchForm();
    });

    // Product Modal Handlers
    $('clientProductSearch')?.addEventListener('input', e => {
      renderProductTable(e.target.value);
    });

    $('addProductBtn')?.addEventListener('click', () => openProductModal());
    $('closeModalBtn')?.addEventListener('click', closeProductModal);
    $('closeModalBackdrop')?.addEventListener('click', closeProductModal);
    $('cancelProductBtn')?.addEventListener('click', closeProductModal);
    $('saveProductBtn')?.addEventListener('click', saveProduct);

    // Save Brand & Branch
    $('saveBrandBtn')?.addEventListener('click', saveBrandDetails);
    $('saveBranchBtn')?.addEventListener('click', saveBranchDetails);

    // Copy QR Link
    $('copyQrLinkBtn')?.addEventListener('click', async () => {
      const input = $('qrLinkText');
      if (!input?.value) return;
      try {
        await navigator.clipboard.writeText(input.value);
      } catch (_error) {
        input.select();
        document.execCommand('copy');
      }
      setPortalStatus('تم نسخ رابط المنيو.');
    });

    // Download QR PNG
    $('downloadQrBtn')?.addEventListener('click', () => {
      const canvas = $('qrCanvas');
      if (!canvas) return;
      const a = document.createElement('a');
      a.download = `${currentTenant ? currentTenant.slug : 'menu'}-qr.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    });

    // Analytics Range Pills
    document.querySelectorAll('.range-pill[data-days]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.range-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        void loadAnalytics(parseInt(pill.dataset.days));
      });
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (!$('productModal')?.classList.contains('hidden')) closeProductModal();
      $('clientSidebar')?.classList.remove('open');
      $('clientSidebarOverlay')?.classList.remove('active');
      document.body.classList.remove('client-drawer-open');
      $('mobileMenuToggle')?.setAttribute('aria-expanded', 'false');
    });
  });
})();
