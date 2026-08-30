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

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);

  function getClient() {
    if (!supabaseClient && window.MENU_CONFIG && window.supabase) {
      supabaseClient = window.supabase.createClient(window.MENU_CONFIG.supabaseUrl, window.MENU_CONFIG.supabaseAnonKey);
    }
    return supabaseClient;
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
      analytics: 'تحليلات المنيو',
      services: 'الموقع والظهور والخدمات',
      settings: 'إعدادات الحساب'
    };
    if ($('pageTitle')) $('pageTitle').textContent = titleMap[panelId] || 'لوحة تحكم النشاط';

    if (panelId === 'analytics') loadAnalytics(7);
  }

  // Authentication Flow
  async function initAuth() {
    const client = getClient();
    if (!client) {
      showError('تعذر تهيئة الاتصال بقاعدة البيانات');
      return;
    }

    // Check existing session
    const { data: { session } } = await client.auth.getSession();
    if (session && session.user) {
      onUserAuthenticated(session.user);
    } else {
      showAuthCard(true);
    }

    client.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        onUserAuthenticated(session.user);
      } else {
        currentUser = null;
        showAuthCard(true);
      }
    });
  }

  function showAuthCard(show) {
    $('authSection').hidden = !show;
    $('dashboardContent').hidden = show;
  }

  async function handleLogin() {
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value.trim();
    const status = $('authStatus');
    status.textContent = 'جارٍ التحقق…';

    const client = getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      status.textContent = 'خطأ في الدخول: ' + (error.message || 'بيانات غير صحيحة');
      return;
    }
    status.textContent = '';
  }

  async function handleLogout() {
    const client = getClient();
    if (client) await client.auth.signOut();
    location.reload();
  }

  async function onUserAuthenticated(user) {
    currentUser = user;
    $('userEmailDisplay').textContent = user.email;
    showAuthCard(false);

    await loadAuthorizedTenants();
  }

  // Tenant Isolation and Loading
  async function loadAuthorizedTenants() {
    const client = getClient();
    if (!client || !currentUser) return;

    try {
      const { data: memberships, error: memError } = await client
        .from('tenant_members')
        .select('tenant_id, role')
        .eq('user_id', currentUser.id);

      if (memError) throw memError;

      if (!memberships || !memberships.length) {
        $('noTenantNotice').hidden = false;
        $('tenantControls').hidden = true;
        return;
      }

      $('noTenantNotice').hidden = true;
      $('tenantControls').hidden = false;

      const tenantIds = memberships.map(m => m.tenant_id);
      const { data: tenants, error: tError } = await client
        .from('tenants')
        .select('*')
        .in('id', tenantIds)
        .order('name');

      if (tError) throw tError;

      authorizedTenants = tenants || [];
      const select = $('clientTenantSelect');
      select.innerHTML = authorizedTenants.map(t => `<option value="${t.id}">${esc(t.name)} (${esc(t.slug)})</option>`).join('');

      if (authorizedTenants.length > 0) {
        await selectTenant(authorizedTenants[0].id);
      }
    } catch (err) {
      console.error('Error loading tenants:', err);
      showError('تعذر تحميل بيانات النشاط: ' + (err.message || ''));
    }
  }

  async function selectTenant(tenantId) {
    currentTenant = authorizedTenants.find(t => t.id === tenantId);
    if (!currentTenant) return;

    $('currentTenantName').textContent = currentTenant.name;
    $('currentTenantSlug').textContent = currentTenant.slug;
    $('sidebarBrandMark').textContent = currentTenant.name ? currentTenant.name[0] : 'M';

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

    await Promise.all([
      loadBranches(),
      loadCategories(),
      loadProducts()
    ]);

    updateOverviewStats();
  }

  async function loadBranches() {
    const client = getClient();
    if (!client || !currentTenant) return;

    const { data, error } = await client
      .from('branches')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .order('created_at');

    if (error) {
      console.error('Error loading branches:', error);
      return;
    }

    currentBranches = data || [];
    const select = $('clientBranchSelect');
    select.innerHTML = currentBranches.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('');

    if (currentBranches.length > 0) {
      currentBranch = currentBranches[0];
      populateBranchForm();
    }
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
    const url = `${origin}/?tenant=${encodeURIComponent(currentTenant.slug)}&branch=${encodeURIComponent(currentBranch.slug)}`;
    
    $('qrLinkText').value = url;
    $('menuLivePreviewLink').href = url;

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
  }

  // Categories & Products
  async function loadCategories() {
    const client = getClient();
    if (!client || !currentTenant) return;

    const { data, error } = await client
      .from('categories')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .order('sort_order');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    categories = data || [];
    const select = $('itemCategorySelect');
    select.innerHTML = categories.map(c => `<option value="${c.id}">${esc(c.name_ar)} / ${esc(c.name_en || '')}</option>`).join('');
  }

  async function loadProducts() {
    const client = getClient();
    if (!client || !currentTenant) return;

    $('productsLoading').hidden = false;
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('tenant_id', currentTenant.id)
      .order('sort_order');

    $('productsLoading').hidden = true;
    if (error) {
      console.error('Error loading products:', error);
      return;
    }

    products = data || [];
    renderProductTable();
    updateOverviewStats();
  }

  function renderProductTable() {
    const tbody = $('productsTableBody');
    if (!tbody) return;

    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--c-muted)">لا توجد أصناف مضافة بعد. انقر على "+ إضافة صنف" للبدء.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => {
      const cat = categories.find(c => c.id === p.category_id);
      const catName = cat ? cat.name_ar : '—';
      const img = p.image_url ? `<img src="${esc(p.image_url)}" class="item-thumb" alt="${esc(p.name_ar)}">` : `<div class="item-thumb" style="display:grid;place-items:center;font-size:18px">🍽️</div>`;
      
      return `
        <tr>
          <td style="width:60px">${img}</td>
          <td>
            <strong>${esc(p.name_ar)}</strong>
            <small style="display:block;color:var(--c-muted)">${esc(p.name_en || '')}</small>
          </td>
          <td>${esc(catName)}</td>
          <td><strong>${Number(p.price || 0).toFixed(2)} ${esc(p.currency || 'SAR')}</strong></td>
          <td>
            <input type="checkbox" class="toggle-switch" data-id="${p.id}" ${p.is_available ? 'checked' : ''} aria-label="تبديل التوفر">
          </td>
          <td>
            <button class="m-btn m-btn-secondary m-btn-sm" onclick="window.clientEditProduct('${p.id}')">تعديل</button>
            <button class="m-btn m-btn-ghost m-btn-sm" style="color:var(--c-red)" onclick="window.clientDeleteProduct('${p.id}')">حذف</button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach toggle handlers
    tbody.querySelectorAll('.toggle-switch').forEach(sw => {
      sw.onchange = async e => {
        const id = e.target.dataset.id;
        const isAvailable = e.target.checked;
        await toggleProductAvailability(id, isAvailable);
      };
    });
  }

  async function toggleProductAvailability(productId, isAvailable) {
    const client = getClient();
    if (!client || !currentTenant) return;

    const { error } = await client
      .from('products')
      .update({ is_available: isAvailable })
      .eq('id', productId)
      .eq('tenant_id', currentTenant.id);

    if (error) {
      showError('تعذر تحديث التوفر: ' + error.message);
      await loadProducts();
    } else {
      const prod = products.find(p => p.id === productId);
      if (prod) prod.is_available = isAvailable;
      updateOverviewStats();
    }
  }

  function updateOverviewStats() {
    $('statTotalProducts').textContent = products.length;
    $('statAvailableProducts').textContent = products.filter(p => p.is_available).length;
    $('statUnavailableProducts').textContent = products.filter(p => !p.is_available).length;
    $('statFeaturedProducts').textContent = products.filter(p => p.is_featured).length;
  }

  // Add / Edit Product Modal
  function openProductModal(product = null) {
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

    $('productModal').classList.remove('hidden');
  }

  function closeProductModal() {
    $('productModal').classList.add('hidden');
    currentEditItem = null;
  }

  async function saveProduct() {
    const client = getClient();
    if (!client || !currentTenant) return;

    const nameAr = $('itemNameAr').value.trim();
    if (!nameAr) {
      alert('الاسم بالعربية مطلوب');
      return;
    }

    const payload = {
      tenant_id: currentTenant.id,
      name_ar: nameAr,
      name_en: $('itemNameEn').value.trim() || null,
      description_ar: $('itemDescAr').value.trim() || null,
      description_en: $('itemDescEn').value.trim() || null,
      price: parseFloat($('itemPrice').value) || 0,
      calories: parseInt($('itemCalories').value) || null,
      category_id: $('itemCategorySelect').value || null,
      is_available: $('itemAvailable').checked,
      is_featured: $('itemFeatured').checked,
      image_url: $('itemImageUrl').value.trim() || null,
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

      closeProductModal();
      await loadProducts();
    } catch (err) {
      alert('فشل الحفظ: ' + (err.message || 'خطأ غير معروف'));
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
      alert('فشل الحذف: ' + error.message);
    } else {
      await loadProducts();
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

    const { error } = await client
      .from('tenants')
      .update(payload)
      .eq('id', currentTenant.id);

    btn.disabled = false;
    btn.textContent = 'حفظ التعديلات';

    if (error) {
      alert('فشل حفظ الهوية: ' + error.message);
    } else {
      alert('تم حفظ هوية النشاط بنجاح!');
      Object.assign(currentTenant, payload);
      $('currentTenantName').textContent = currentTenant.name;
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

    const { error } = await client
      .from('branches')
      .update(payload)
      .eq('id', currentBranch.id)
      .eq('tenant_id', currentTenant.id);

    btn.disabled = false;
    btn.textContent = 'حفظ بيانات الفرع';

    if (error) {
      alert('فشل حفظ بيانات الفرع: ' + error.message);
    } else {
      alert('تم حفظ الفرع بنجاح!');
      Object.assign(currentBranch, payload);
      updateQrCode();
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
    } catch (err) {
      console.error('Analytics error:', err);
      $('analyticsLoading').hidden = true;
    }
  }

  // Global Helper functions
  function showError(msg) {
    console.error(msg);
  }

  // Window Exports for DOM Handlers
  window.clientEditProduct = id => {
    const prod = products.find(p => p.id === id);
    if (prod) openProductModal(prod);
  };
  window.clientDeleteProduct = id => deleteProduct(id);

  // Initialization & Event Binding
  document.addEventListener('DOMContentLoaded', () => {
    initAuth();

    // Login & Logout
    $('loginBtn')?.addEventListener('click', handleLogin);
    $('logoutBtn')?.addEventListener('click', handleLogout);

    // Navigation Items
    document.querySelectorAll('.client-nav-item[data-panel]').forEach(btn => {
      btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
    });

    // Mobile Sidebar Toggle
    $('mobileMenuToggle')?.addEventListener('click', () => {
      $('clientSidebar').classList.toggle('open');
    });

    // Tenant Selection Change
    $('clientTenantSelect')?.addEventListener('change', e => {
      selectTenant(e.target.value);
    });

    // Branch Selection Change
    $('clientBranchSelect')?.addEventListener('change', e => {
      currentBranch = currentBranches.find(b => b.id === e.target.value);
      populateBranchForm();
    });

    // Product Modal Handlers
    $('addProductBtn')?.addEventListener('click', () => openProductModal());
    $('closeModalBtn')?.addEventListener('click', closeProductModal);
    $('cancelProductBtn')?.addEventListener('click', closeProductModal);
    $('saveProductBtn')?.addEventListener('click', saveProduct);

    // Save Brand & Branch
    $('saveBrandBtn')?.addEventListener('click', saveBrandDetails);
    $('saveBranchBtn')?.addEventListener('click', saveBranchDetails);

    // Copy QR Link
    $('copyQrLinkBtn')?.addEventListener('click', () => {
      const input = $('qrLinkText');
      input.select();
      navigator.clipboard.writeText(input.value);
      alert('تم نسخ الرابط!');
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
        loadAnalytics(parseInt(pill.dataset.days));
      });
    });
  });
})();
