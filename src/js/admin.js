/* ==========================================================================
   BARAHI HANDICRAFT — Google Entrance Gate & Strict Admin Authentication
   Client ID: 831474336400-de4pm9gpvfhokqa76mkj0kiodm49kjsl.apps.googleusercontent.com
   ========================================================================== */

const GOOGLE_CLIENT_ID = '831474336400-de4pm9gpvfhokqa76mkj0kiodm49kjsl.apps.googleusercontent.com';
const STORAGE_KEY_ADMIN_USER = 'barahi_admin_user';
const STORAGE_KEY_ADMIN_PASS = 'barahi_admin_pass';
const STORAGE_KEY_ADMIN_AUTH = 'barahi_admin_auth';
const STORAGE_KEY_GOOGLE_PROFILE = 'barahi_google_profile';
const STORAGE_KEY_USER_LOGGED_IN = 'barahi_user_logged_in';

function getAdminUsername() {
  return localStorage.getItem(STORAGE_KEY_ADMIN_USER) || 'admin';
}

function getAdminPassword() {
  return localStorage.getItem(STORAGE_KEY_ADMIN_PASS) || 'password123';
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initGoogleEntranceGate();
  initAdminAuth();
  initAdminModal();
  initFormUploadHandlers();
  initChangePasswordHandler();
  initGoogleAuth();
});

function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (btn && navLinks) {
    btn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }
}

// Entrance Gate popup check on initial site load for general site visitors
function initGoogleEntranceGate() {
  const gateModal = document.getElementById('google-user-gate-modal');
  const isUserLoggedIn = sessionStorage.getItem(STORAGE_KEY_USER_LOGGED_IN);
  const userProfile = JSON.parse(sessionStorage.getItem(STORAGE_KEY_GOOGLE_PROFILE) || '{}');

  if (!isUserLoggedIn && gateModal) {
    setTimeout(() => {
      gateModal.classList.add('active');
    }, 400);
  } else if (userProfile.name) {
    updateTopBarUserBadge(userProfile);
  }
}

function updateTopBarUserBadge(profile) {
  const container = document.getElementById('top-bar-user-info');
  if (!container) return;

  if (profile && profile.name) {
    const avatarHtml = profile.picture
      ? `<img src="${profile.picture}" style="width: 20px; height: 20px; border-radius: 50%; vertical-align: middle; margin-right: 6px;" />`
      : '👤 ';
    container.innerHTML = `
      <span style="font-size: 0.8rem; color: var(--text-gold);">
        ${avatarHtml}Welcome, <strong>${profile.name}</strong>
      </span>
    `;
  }
}

function initGoogleAuth() {
  // Callback for Google Sign-In on the Entrance Gate (General Visitors ONLY)
  window.handleGoogleSignInCallback = function(response) {
    if (!response || !response.credential) {
      alert('Google Sign-In failed. Please try again.');
      return;
    }

    try {
      const payload = parseJwt(response.credential);
      const userProfile = {
        name: payload.name || 'Google User',
        email: payload.email || '',
        picture: payload.picture || '',
        sub: payload.sub
      };

      // Set General Visitor session
      sessionStorage.setItem(STORAGE_KEY_USER_LOGGED_IN, 'true');
      sessionStorage.setItem(STORAGE_KEY_GOOGLE_PROFILE, JSON.stringify(userProfile));
      
      // STRICT SECURITY: Remove any Admin Auth token so Google user CANNOT access Admin Panel!
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);

      // Close Entrance Gate and Admin Modals
      const gateModal = document.getElementById('google-user-gate-modal');
      const adminModal = document.getElementById('admin-modal-overlay');
      const loginModal = document.getElementById('admin-login-modal');

      if (gateModal) gateModal.classList.remove('active');
      if (adminModal) adminModal.classList.remove('active');
      if (loginModal) loginModal.classList.remove('active');

      updateTopBarUserBadge(userProfile);
      showToast(`Welcome to Barahi Handicraft, ${userProfile.name}!`);
    } catch (e) {
      console.error('Failed to parse Google JWT Token', e);
      alert('Failed to process Google authentication.');
    }
  };

  const checkGoogleSdk = setInterval(() => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      clearInterval(checkGoogleSdk);
      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: window.handleGoogleSignInCallback,
          auto_select: false,
          cancel_on_tap_outside: false
        });

        const gateBtnContainer = document.getElementById('g_gate_signin_btn');
        if (gateBtnContainer) {
          google.accounts.id.renderButton(gateBtnContainer, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 280
          });
        }

        google.accounts.id.prompt();
      } catch (err) {
        console.warn('GSI Init Warning', err);
      }
    }
  }, 300);
}

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

// STRICT ADMIN AUTHENTICATION CHECK
function isAdminAuthenticated() {
  const isGoogleUser = !!sessionStorage.getItem(STORAGE_KEY_GOOGLE_PROFILE);
  const isAdminSession = sessionStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === 'true';

  // Google Users are NEVER authenticated as Admin!
  if (isGoogleUser) {
    return false;
  }
  return isAdminSession;
}

function initAdminAuth() {
  const btnOpenAdmin = document.getElementById('btn-open-admin');
  const btnCloseLogin = document.getElementById('btn-close-login');
  const loginOverlay = document.getElementById('admin-login-modal');
  const loginForm = document.getElementById('admin-login-form');
  const adminOverlay = document.getElementById('admin-modal-overlay');
  const btnLogoutAdmin = document.getElementById('btn-logout-admin');

  if (btnOpenAdmin) {
    btnOpenAdmin.addEventListener('click', () => {
      if (isAdminAuthenticated()) {
        adminOverlay.classList.add('active');
        renderAdminInventoryTable();
      } else {
        // Show Admin Username/Password Login Modal
        loginOverlay.classList.add('active');
      }
    });
  }

  if (btnCloseLogin && loginOverlay) {
    btnCloseLogin.addEventListener('click', () => {
      loginOverlay.classList.remove('active');
    });
  }

  if (loginOverlay) {
    loginOverlay.addEventListener('click', (e) => {
      if (e.target === loginOverlay) {
        loginOverlay.classList.remove('active');
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('admin-login-user').value.trim();
      const pass = document.getElementById('admin-login-pass').value.trim();

      const activeUser = getAdminUsername();
      const activePass = getAdminPassword();

      if (user === activeUser && pass === activePass) {
        // Authenticated strictly as Admin!
        sessionStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
        sessionStorage.removeItem(STORAGE_KEY_GOOGLE_PROFILE); // Clear visitor session

        loginOverlay.classList.remove('active');
        adminOverlay.classList.add('active');
        renderAdminInventoryTable();
        showToast('Successfully authenticated as Admin!');
        loginForm.reset();
      } else {
        alert('Access Denied: Invalid Admin Username or Password.');
      }
    });
  }

  if (btnLogoutAdmin) {
    btnLogoutAdmin.addEventListener('click', () => {
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
      adminOverlay.classList.remove('active');
      showToast('Logged out of Admin Control Panel.');
    });
  }
}

function initChangePasswordHandler() {
  const btnOpenChangePass = document.getElementById('btn-open-change-pass');
  const btnLoginChangePass = document.getElementById('btn-login-change-pass');
  const changePassOverlay = document.getElementById('admin-change-pass-modal');
  const btnCloseChangePass = document.getElementById('btn-close-change-pass');
  const changePassForm = document.getElementById('admin-change-pass-form');
  const loginOverlay = document.getElementById('admin-login-modal');

  if (btnOpenChangePass && changePassOverlay) {
    btnOpenChangePass.addEventListener('click', () => {
      changePassOverlay.classList.add('active');
    });
  }

  if (btnLoginChangePass && changePassOverlay && loginOverlay) {
    btnLoginChangePass.addEventListener('click', () => {
      loginOverlay.classList.remove('active');
      changePassOverlay.classList.add('active');
    });
  }

  if (btnCloseChangePass && changePassOverlay) {
    btnCloseChangePass.addEventListener('click', () => {
      changePassOverlay.classList.remove('active');
    });
  }

  if (changePassOverlay) {
    changePassOverlay.addEventListener('click', (e) => {
      if (e.target === changePassOverlay) {
        changePassOverlay.classList.remove('active');
      }
    });
  }

  if (changePassForm) {
    changePassForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputUser = document.getElementById('change-admin-user').value.trim();
      const currentPass = document.getElementById('change-curr-pass').value.trim();
      const newPass = document.getElementById('change-new-pass').value.trim();
      const confirmPass = document.getElementById('change-confirm-pass').value.trim();

      const activeUser = getAdminUsername();
      const activePass = getAdminPassword();

      if (inputUser !== activeUser) {
        alert('Invalid Admin Username.');
        return;
      }

      if (currentPass !== activePass) {
        alert('Incorrect Current Password. Please enter your valid current password.');
        return;
      }

      if (newPass.length < 4) {
        alert('New Password must be at least 4 characters long.');
        return;
      }

      if (newPass !== confirmPass) {
        alert('New Password and Confirm Password do not match.');
        return;
      }

      localStorage.setItem(STORAGE_KEY_ADMIN_PASS, newPass);
      changePassForm.reset();
      changePassOverlay.classList.remove('active');
      showToast('Admin Password updated! You can now log in with your new password.');
    });
  }
}

function initAdminModal() {
  const btnCloseAdmin = document.getElementById('btn-close-admin');
  const adminOverlay = document.getElementById('admin-modal-overlay');
  const adminForm = document.getElementById('admin-add-product-form');

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

  form.reset();
  currentFormImages.front = '';
  currentFormImages.detail = '';
  currentFormImages.dimension = '';
  
  resetSlotPreview(document.getElementById('preview-slot-front'), 'front');
  resetSlotPreview(document.getElementById('preview-slot-detail'), 'detail');
  resetSlotPreview(document.getElementById('preview-slot-dimension'), 'dimension');

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
