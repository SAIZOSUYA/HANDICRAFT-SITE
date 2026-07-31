/* ==========================================================================
   BARAHI HANDICRAFT — Storefront App & Catalog Renderer
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initStorefrontCatalog();
  initCategoryFilters();
  initSearch();
  initDetailModal();
});

function initCategoryFilters() {
  const container = document.getElementById('category-pills-container');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => `
    <button 
      class="pill-btn ${cat.id === 'all' ? 'active' : ''}" 
      data-category="${cat.id}"
      onclick="setCategoryFilter('${cat.id}')">
      ${cat.label}
    </button>
  `).join('');
}

window.setCategoryFilter = function(catId) {
  window.appState.currentCategory = catId;

  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-category') === catId);
  });

  renderStorefrontCatalog();
};

function initSearch() {
  const input = document.getElementById('catalog-search-input');
  if (input) {
    input.addEventListener('input', (e) => {
      window.appState.searchQuery = e.target.value.trim();
      renderStorefrontCatalog();
    });
  }
}

window.renderStorefrontCatalog = function() {
  const container = document.getElementById('products-grid-container');
  if (!container) return;

  const products = window.appState.getFilteredProducts();

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-catalog">
        <h3>No Handicraft Products Found</h3>
        <p>No products match your current filter or search criteria. Use the <strong>Admin Control Panel</strong> above to add new handicraft items with labeled image slots!</p>
        <button class="btn-primary" onclick="document.getElementById('btn-open-admin').click()">
          + Add Product via Admin Panel
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => renderProductCard(product)).join('');
};

function renderProductCard(p) {
  const hasFrontImage = !!p.images?.front;

  const mediaSlotHtml = hasFrontImage 
    ? `<img src="${p.images.front}" alt="${p.title}" class="card-media-img" />`
    : `
      <div class="placeholder-frame">
        <div class="side-label-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
          [ SLOT 1: FRONT VIEW ]
        </div>
        <div class="placeholder-text">${p.title}</div>
        <div class="placeholder-hint">Picture not added yet (Add via Admin Panel)</div>
      </div>
    `;

  return `
    <div class="product-card" id="card-${p.id}">
      <div class="card-media-zone" onclick="openProductDetailModal('${p.id}')">
        <div class="card-badge-group">
          <span class="badge-category">${p.category.toUpperCase()}</span>
        </div>
        ${mediaSlotHtml}
      </div>

      <div class="card-body">
        <div class="product-code">${p.code} • ${p.origin}</div>
        <h3 class="product-title" onclick="openProductDetailModal('${p.id}')" style="cursor: pointer;">
          ${p.title}
        </h3>

        <div class="product-specs">
          <div class="spec-item">
            <span class="spec-label">Material</span>
            <span class="spec-val">${p.material}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Lead Time</span>
            <span class="spec-val">${p.leadTime}</span>
          </div>
        </div>

        <div class="card-pricing-row">
          <div class="fob-price">
            <span class="fob-label">Price</span>
            <span class="fob-value">NRs ${Number(p.fobPrice).toLocaleString()}</span>
          </div>
          <button class="btn-card-rfq" onclick="quickAddProductToRFQ('${p.id}')">
            + Add to Basket
          </button>
        </div>
      </div>
    </div>
  `;
}

function initStorefrontCatalog() {
  renderStorefrontCatalog();
}

// Detail View Modal with Multi-side Tabs
function initDetailModal() {
  const overlay = document.getElementById('detail-modal-overlay');
  const closeBtn = document.getElementById('btn-close-detail');

  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  }
}

window.openProductDetailModal = function(productId) {
  const p = window.appState.products.find(item => item.id === productId);
  if (!p) return;

  const overlay = document.getElementById('detail-modal-overlay');
  const body = document.getElementById('detail-modal-body');

  if (!overlay || !body) return;

  body.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; width: 100%;">
      <div>
        <div id="detail-active-view-box" style="width: 100%; height: 340px; background: var(--bg-surface-elevated); border: 1px solid var(--border-gold); border-radius: var(--radius-md); overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
          ${renderSideViewBox(p, 'front')}
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <button class="btn-outline" style="padding: 8px; font-size: 0.75rem;" onclick="switchDetailSideView('${p.id}', 'front')">
            [ Slot 1: Front ]
          </button>
          <button class="btn-outline" style="padding: 8px; font-size: 0.75rem;" onclick="switchDetailSideView('${p.id}', 'detail')">
            [ Slot 2: Detail ]
          </button>
          <button class="btn-outline" style="padding: 8px; font-size: 0.75rem;" onclick="switchDetailSideView('${p.id}', 'dimension')">
            [ Slot 3: Spec ]
          </button>
        </div>
      </div>

      <div>
        <span class="badge-category">${p.category.toUpperCase()}</span>
        <h2 style="font-family: var(--font-serif); margin: 8px 0;">${p.title}</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Item Code: ${p.code} | Origin: ${p.origin}</p>

        <div style="font-size: 1.8rem; font-weight: 700; color: var(--accent-teak); margin-bottom: 1.5rem;">
          NRs ${Number(p.fobPrice).toLocaleString()}
        </div>

        <div style="background: var(--bg-surface-elevated); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
          <h4 style="margin-bottom: 8px;">Artisanal Technique & Description</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">${p.description || 'Custom crafted handicraft product.'}</p>
          <div style="font-size: 0.8rem; font-weight: 600;">Technique: ${p.technique}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem; margin-bottom: 2rem;">
          <div><strong>Material:</strong> ${p.material}</div>
          <div><strong>Lead Time:</strong> ${p.leadTime}</div>
        </div>

        <button class="btn-primary" style="width: 100%;" onclick="quickAddProductToRFQ('${p.id}'); document.getElementById('detail-modal-overlay').classList.remove('active');">
          + Add to Inquiry Basket
        </button>
      </div>
    </div>
  `;

  overlay.classList.add('active');
};

function renderSideViewBox(product, sideKey) {
  const sideLabels = {
    front: 'SLOT 1: PRIMARY CATALOG FRONT VIEW',
    detail: 'SLOT 2: CRAFT DETAIL & TEXTURE CLOSE-UP',
    dimension: 'SLOT 3: DIMENSIONS & SPEC DIAGRAM'
  };

  const img = product.images?.[sideKey];

  if (img) {
    return `<img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" alt="${sideLabels[sideKey]}" />`;
  } else {
    return `
      <div class="placeholder-frame" style="width: 100%; height: 100%;">
        <div class="side-label-badge">[ ${sideLabels[sideKey]} ]</div>
        <div class="placeholder-text">${product.title}</div>
        <div class="placeholder-hint">No picture attached to this side slot yet (Upload in Admin Panel)</div>
      </div>
    `;
  }
}

window.switchDetailSideView = function(productId, sideKey) {
  const p = window.appState.products.find(item => item.id === productId);
  if (!p) return;

  const box = document.getElementById('detail-active-view-box');
  if (box) {
    box.innerHTML = renderSideViewBox(p, sideKey);
  }
};

window.quickAddProductToRFQ = function(productId) {
  window.appState.addToCart(productId);
  if (window.renderRFQDrawer) {
    window.renderRFQDrawer();
  }
  showToast('Added to Inquiry Basket!');
};
