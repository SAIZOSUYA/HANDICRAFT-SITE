/* ==========================================================================
   BARAHI HANDICRAFT — Inquiry & Order Basket
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initRFQDrawer();
  initBuyerFormSubmit();
});

function initRFQDrawer() {
  const btnOpenRFQ = document.getElementById('btn-open-rfq');
  const btnCloseRFQ = document.getElementById('btn-close-rfq');
  const drawer = document.getElementById('rfq-drawer');

  if (btnOpenRFQ && drawer) {
    btnOpenRFQ.addEventListener('click', () => {
      drawer.classList.add('active');
      renderRFQDrawer();
    });
  }

  if (btnCloseRFQ && drawer) {
    btnCloseRFQ.addEventListener('click', () => {
      drawer.classList.remove('active');
    });
  }
}

window.renderRFQDrawer = function() {
  const cart = window.appState.cart;
  const container = document.getElementById('rfq-cart-items-container');
  const badge = document.getElementById('rfq-cart-count');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) badge.textContent = totalItems;

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
        </svg>
        <div style="font-size: 1.1rem; font-family: var(--font-serif); color: var(--text-primary);">Inquiry Basket is Empty</div>
        <p style="font-size: 0.82rem; margin-top: 4px;">Browse the catalog and add products to request product information or order details.</p>
      </div>
    `;
    return;
  }

  let totalValue = 0;

  container.innerHTML = cart.map(item => {
    const product = window.appState.products.find(p => p.id === item.productId);
    if (!product) return '';

    const itemValue = (product.fobPrice || 0) * item.quantity;
    totalValue += itemValue;

    const hasFrontImg = !!product.images?.front;
    const thumbHtml = hasFrontImg 
      ? `<img src="${product.images.front}" class="cart-item-thumb" alt="${product.title}" />`
      : `<div class="cart-item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:var(--text-muted);font-weight:700;">[ FRONT<br>SLOT ]</div>`;

    return `
      <div class="cart-item">
        ${thumbHtml}
        <div class="cart-item-info">
          <div class="cart-item-title">${product.title}</div>
          <div style="font-size: 0.78rem; color: var(--accent-teak); font-weight: 700;">
            NRs ${Number(product.fobPrice).toLocaleString()} x ${item.quantity} = NRs ${itemValue.toLocaleString()}
          </div>
          <div class="qty-control">
            <button class="qty-btn" onclick="updateCartItemQty('${product.id}', ${item.quantity - 1})">-</button>
            <input type="number" class="qty-input" value="${item.quantity}" onchange="updateCartItemQty('${product.id}', parseInt(this.value))" />
            <button class="qty-btn" onclick="updateCartItemQty('${product.id}', ${item.quantity + 1})">+</button>
            <button style="margin-left: auto; color: #C53030; font-size: 0.75rem;" onclick="removeCartItem('${product.id}')">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.updateCartItemQty = function(productId, qty) {
  if (qty <= 0) {
    window.appState.removeFromCart(productId);
  } else {
    window.appState.updateCartQty(productId, qty);
  }
  renderRFQDrawer();
};

window.removeCartItem = function(productId) {
  window.appState.removeFromCart(productId);
  renderRFQDrawer();
  showToast('Item removed from basket.');
};

function initBuyerFormSubmit() {
  const form = document.getElementById('buyer-rfq-inquiry-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const companyName = document.getElementById('buyer-company').value.trim();
    const contactEmail = document.getElementById('buyer-email').value.trim();
    const destPort = document.getElementById('buyer-port').value.trim();

    if (window.appState.cart.length === 0) {
      alert('Please add at least one handicraft product to your basket before submitting.');
      return;
    }

    if (!companyName || !contactEmail || !destPort) {
      alert('Please enter your Name, Email, and Delivery Address.');
      return;
    }

    alert(`Thank you, ${companyName}! Your product inquiry has been submitted to Barahi Handicraft. We will send full details to ${contactEmail} shortly.`);

    window.appState.clearCart();
    form.reset();
    renderRFQDrawer();
    document.getElementById('rfq-drawer').classList.remove('active');
  });
}
