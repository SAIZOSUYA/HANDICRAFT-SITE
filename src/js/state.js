/* ==========================================================================
   BARAHI HANDICRAFT — Application State & LocalStorage Manager
   ========================================================================== */

const STORAGE_KEY_PRODUCTS = 'barahi_handicraft_products';
const STORAGE_KEY_CART = 'barahi_handicraft_cart';

// Base Categories
const CATEGORIES = [
  { id: 'all', label: 'All Craft Collections' },
  { id: 'wooden', label: 'Wooden Furniture & Carvings' },
  { id: 'brass', label: 'Brass & Metal Decor' },
  { id: 'marble', label: 'Marble Inlay & Sculptures' },
  { id: 'textiles', label: 'Handwoven Rugs & Textiles' },
  { id: 'terracotta', label: 'Terracotta & Ceramics' }
];

// Clean empty products array (NO pre-filled hardcoded product details or origins!)
const DEFAULT_PRODUCTS = [];

class StateManager {
  constructor() {
    this.products = this.loadProducts();
    this.cart = this.loadCart();
    this.currentCategory = 'all';
    this.searchQuery = '';
  }

  loadProducts() {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved products', e);
      }
    }
    return DEFAULT_PRODUCTS;
  }

  saveProducts() {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(this.products));
  }

  loadCart() {
    const saved = localStorage.getItem(STORAGE_KEY_CART);
    return saved ? JSON.parse(saved) : [];
  }

  saveCart() {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(this.cart));
  }

  // Product CRUD
  addProduct(productData) {
    const newProduct = {
      id: 'prod-' + Date.now(),
      code: productData.code || 'BH-C-' + Math.floor(100 + Math.random() * 900),
      title: productData.title,
      category: productData.category,
      material: productData.material || '',
      origin: productData.origin || '',
      fobPrice: parseFloat(productData.fobPrice) || 0,
      leadTime: productData.leadTime || '',
      technique: productData.technique || '',
      description: productData.description || '',
      images: {
        front: productData.images?.front || '',
        detail: productData.images?.detail || '',
        dimension: productData.images?.dimension || ''
      }
    };
    this.products.unshift(newProduct);
    this.saveProducts();
    return newProduct;
  }

  updateProduct(id, updatedData) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.products[idx] = { ...this.products[idx], ...updatedData };
      this.saveProducts();
      return true;
    }
    return false;
  }

  deleteProduct(id) {
    this.products = this.products.filter(p => p.id !== id);
    this.saveProducts();
  }

  // Cart Operations
  addToCart(productId, qty) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const existing = this.cart.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += (qty || 1);
    } else {
      this.cart.push({
        productId,
        quantity: qty || 1
      });
    }
    this.saveCart();
  }

  updateCartQty(productId, qty) {
    const item = this.cart.find(i => i.productId === productId);
    if (item) {
      item.quantity = Math.max(1, qty);
      this.saveCart();
    }
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.productId !== productId);
    this.saveCart();
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  getFilteredProducts() {
    return this.products.filter(p => {
      const matchCategory = this.currentCategory === 'all' || p.category === this.currentCategory;
      const matchSearch = !this.searchQuery || 
        p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.material.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }
}

// Clear any old pre-filled sample products from localStorage to ensure a clean slate
localStorage.removeItem(STORAGE_KEY_PRODUCTS);

window.appState = new StateManager();
