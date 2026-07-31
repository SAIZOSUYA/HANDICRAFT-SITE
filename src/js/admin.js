/* ==========================================================================
   BARAHI HANDICRAFT — Admin Management Panel & Image Slot Manager
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAdminModal();
  initFormUploadHandlers();
});

function initAdminModal() {
  const btnOpenAdmin = document.getElementById('btn-open-admin');
  const btnCloseAdmin = document.getElementById('btn-close-admin');
  const adminOverlay = document.getElementById('admin-modal-overlay');
  const adminForm = document.getElementById('admin-add-product-form');

  if (btnOpenAdmin && adminOverlay) {
    btnOpenAdmin.addEventListener('click', () => {
      adminOverlay.classList.add('active');
      renderAdminInventoryTable();
    });
  }

  if (btnCloseAdmin && adminOverlay) {
    btnCloseAdmin.addEventListener('click', () => {
      adminOverlay.classList.remove('active');
    });
  }

  if (adminOverlay) {
    adminOverlay.addEventListener('click', (e) => {
      if (e.target === adminOverlay) {
        adminOverlay.classList.remove('active');
      }
    });
  }

  if (adminForm) {
    adminForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleAdminFormSubmit();
    });
  }
}

// Temporary storage for image slots in the active form
const currentFormImages = {
  front: '',
  detail: '',
  dimension: ''
};

function initFormUploadHandlers() {
  setupSlotUploader('front', 'file-slot-front', 'url-slot-front', 'preview-slot-front');
  setupSlotUploader('detail', 'file-slot-detail', 'url-slot-detail', 'preview-slot-detail');
  setupSlotUploader('dimension', 'file-slot-dimension', 'url-slot-dimension', 'preview-slot-dimension');
}

function setupSlotUploader(slotKey, fileInputId, urlInputId, previewBoxId) {
  const fileInput = document.getElementById(fileInputId);
  const urlInput = document.getElementById(urlInputId);
  const previewBox = document.getElementById(previewBoxId);

  if (!previewBox) return;

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Img = event.target.result;
          currentFormImages[slotKey] = base64Img;
          updateSlotPreview(previewBox, base64Img, slotKey);
          if (urlInput) urlInput.value = '';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (urlInput) {
    urlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url) {
        currentFormImages[slotKey] = url;
        updateSlotPreview(previewBox, url, slotKey);
      } else {
        currentFormImages[slotKey] = '';
        resetSlotPreview(previewBox, slotKey);
      }
    });
  }
}

function updateSlotPreview(previewBox, imgSrc, slotKey) {
  const sideLabels = {
    front: 'SLOT 1: FRONT CATALOG VIEW',
    detail: 'SLOT 2: CRAFT DETAIL & TEXTURE',
    dimension: 'SLOT 3: DIMENSION & SPEC'
  };

  previewBox.innerHTML = `
    <img src="${imgSrc}" alt="${sideLabels[slotKey]}" />
    <span class="side-label-badge" style="position: absolute; bottom: 8px; right: 8px; font-size: 0.65rem;">
      ✓ Image Attached
    </span>
  `;
}

function resetSlotPreview(previewBox, slotKey) {
  const sideLabels = {
    front: 'Slot 1: Front Catalog View',
    detail: 'Slot 2: Craft Detail & Texture',
    dimension: 'Slot 3: Dimensions & Spec'
  };

  previewBox.innerHTML = `
    <div class="slot-empty-notice">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <div>[ ${sideLabels[slotKey]} ]</div>
      <small style="opacity: 0.6;">No Picture Uploaded Yet</small>
    </div>
  `;
}

function handleAdminFormSubmit() {
  const form = document.getElementById('admin-add-product-form');
  const title = document.getElementById('admin-prod-title').value.trim();
  const category = document.getElementById('admin-prod-category').value;
  const fobPrice = document.getElementById('admin-prod-price').value;
  const code = document.getElementById('admin-prod-code').value.trim();
  const material = document.getElementById('admin-prod-material').value.trim();
  const origin = document.getElementById('admin-prod-origin').value.trim();
  const leadTime = document.getElementById('admin-prod-leadtime').value.trim();
  const technique = document.getElementById('admin-prod-technique').value.trim();
  const description = document.getElementById('admin-prod-desc').value.trim();
  const editId = form.getAttribute('data-edit-id');

  if (!title || !category || !fobPrice) {
    showToast('Please fill in required fields (Title, Category, Price)');
    return;
  }

  const productData = {
    code: code || undefined,
    title,
    category,
    fobPrice,
    material,
    origin,
    leadTime,
    technique,
    description,
    images: { ...currentFormImages }
  };

  if (editId) {
    window.appState.updateProduct(editId, productData);
    form.removeAttribute('data-edit-id');
    showToast('Product successfully updated!');
  } else {
    window.appState.addProduct(productData);
    showToast('New product added to Barahi Catalog!');
  }

  // Reset form
  form.reset();
  currentFormImages.front = '';
  currentFormImages.detail = '';
  currentFormImages.dimension = '';
  
  resetSlotPreview(document.getElementById('preview-slot-front'), 'front');
  resetSlotPreview(document.getElementById('preview-slot-detail'), 'detail');
  resetSlotPreview(document.getElementById('preview-slot-dimension'), 'dimension');

  // Re-render UI
  renderAdminInventoryTable();
  if (window.renderStorefrontCatalog) {
    window.renderStorefrontCatalog();
  }
}

function renderAdminInventoryTable() {
  const container = document.getElementById('admin-inventory-table-body');
  if (!container) return;

  const products = window.appState.products;

  if (products.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No products in catalog. Fill the form above to add your first handicraft product!
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    const hasFrontImg = !!p.images?.front;
    const thumbHtml = hasFrontImg
      ? `<img src="${p.images.front}" class="table-img-thumb" alt="${p.title}" />`
      : `<div class="table-placeholder-thumb">[ FRONT<br>SLOT ]</div>`;

    return `
      <tr>
        <td>${thumbHtml}</td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${p.title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${p.code} | ${p.origin}</div>
        </td>
        <td><span class="badge-category">${p.category.toUpperCase()}</span></td>
        <td><strong>NRs ${Number(p.fobPrice).toLocaleString()}</strong></td>
        <td>
          <div style="font-size: 0.75rem;">
            Slot 1: ${p.images?.front ? '✓ Uploaded' : 'Empty'}<br>
            Slot 2: ${p.images?.detail ? '✓ Uploaded' : 'Empty'}<br>
            Slot 3: ${p.images?.dimension ? '✓ Uploaded' : 'Empty'}
          </div>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-icon edit" onclick="editProductInAdmin('${p.id}')" title="Edit Product">
              ✎
            </button>
            <button class="btn-icon delete" onclick="deleteProductFromAdmin('${p.id}')" title="Delete Product">
              ✕
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.editProductInAdmin = function(productId) {
  const p = window.appState.products.find(item => item.id === productId);
  if (!p) return;

  const form = document.getElementById('admin-add-product-form');
  form.setAttribute('data-edit-id', p.id);

  document.getElementById('admin-prod-title').value = p.title || '';
  document.getElementById('admin-prod-category').value = p.category || 'wooden';
  document.getElementById('admin-prod-price').value = p.fobPrice || '';
  document.getElementById('admin-prod-code').value = p.code || '';
  document.getElementById('admin-prod-material').value = p.material || '';
  document.getElementById('admin-prod-origin').value = p.origin || '';
  document.getElementById('admin-prod-leadtime').value = p.leadTime || '';
  document.getElementById('admin-prod-technique').value = p.technique || '';
  document.getElementById('admin-prod-desc').value = p.description || '';

  currentFormImages.front = p.images?.front || '';
  currentFormImages.detail = p.images?.detail || '';
  currentFormImages.dimension = p.images?.dimension || '';

  if (currentFormImages.front) {
    updateSlotPreview(document.getElementById('preview-slot-front'), currentFormImages.front, 'front');
  } else {
    resetSlotPreview(document.getElementById('preview-slot-front'), 'front');
  }

  if (currentFormImages.detail) {
    updateSlotPreview(document.getElementById('preview-slot-detail'), currentFormImages.detail, 'detail');
  } else {
    resetSlotPreview(document.getElementById('preview-slot-detail'), 'detail');
  }

  if (currentFormImages.dimension) {
    updateSlotPreview(document.getElementById('preview-slot-dimension'), currentFormImages.dimension, 'dimension');
  } else {
    resetSlotPreview(document.getElementById('preview-slot-dimension'), 'dimension');
  }

  document.querySelector('.admin-body').scrollTop = 0;
  showToast(`Editing: ${p.title}`);
};

window.deleteProductFromAdmin = function(productId) {
  if (confirm('Are you sure you want to delete this handicraft product?')) {
    window.appState.deleteProduct(productId);
    renderAdminInventoryTable();
    if (window.renderStorefrontCatalog) {
      window.renderStorefrontCatalog();
    }
    showToast('Product removed from catalog.');
  }
};

function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>⚡ ${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}
