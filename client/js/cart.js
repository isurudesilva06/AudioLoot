// Cart Page JavaScript
class CartPage {
  constructor() {
    this.cart = [];
    this.isLoading = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadCart();
  }

  setupEventListeners() {
    // Listen for cart updates
    window.addEventListener('cartUpdated', () => {
      this.loadCart();
    });

    // Quantity changes
    document.addEventListener('change', (e) => {
      if (e.target.matches('.quantity-input')) {
        const productId = e.target.dataset.productId;
        const quantity = parseInt(e.target.value);
        this.updateQuantity(productId, quantity);
      }
    });

    // Remove items
    document.addEventListener('click', (e) => {
      if (e.target.matches('.remove-item-btn') || e.target.closest('.remove-item-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.remove-item-btn');
        const productId = btn.dataset.productId;
        this.removeItem(productId);
      }
    });

    // Clear cart
    document.addEventListener('click', (e) => {
      if (e.target.matches('.clear-cart-btn')) {
        e.preventDefault();
        this.clearCart();
      }
    });

    // Checkout
    document.addEventListener('click', (e) => {
      if (e.target.matches('.checkout-btn')) {
        e.preventDefault();
        this.proceedToCheckout();
      }
    });

    // Continue shopping
    document.addEventListener('click', (e) => {
      if (e.target.matches('.continue-shopping-btn')) {
        e.preventDefault();
        window.location.href = 'products.html';
      }
    });
  }

  async loadCart() {
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      this.showLoading();

      // Get cart from app instance
      if (window.app) {
        this.cart = window.app.cart || [];
      }

      // If user is authenticated, sync with server
      if (api.isAuthenticated()) {
        try {
          const response = await api.getCart();
          this.cart = response.data?.cart || [];
        } catch (error) {
          console.error('Failed to load cart from server:', error);
          // Fall back to local cart
        }
      }

      this.renderCart();

    } catch (error) {
      console.error('Failed to load cart:', error);
      showError('Failed to load cart');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  renderCart() {
    const cartLayout = document.getElementById('cart-layout');
    const emptyCart = document.getElementById('empty-cart');

    if (this.cart.length === 0) {
      cartLayout.style.display = 'none';
      emptyCart.style.display = 'block';
      return;
    }

    cartLayout.style.display = 'grid';
    emptyCart.style.display = 'none';

    cartLayout.innerHTML = `
      <div class="cart-items">
        <div class="cart-header">
          <h2>Your Items (${this.getItemCount()} items)</h2>
          <button class="btn btn-ghost btn-sm clear-cart-btn">Clear Cart</button>
        </div>
        
        <div class="cart-items-list">
          ${this.cart.map(item => this.createCartItem(item)).join('')}
        </div>
        
        <div class="cart-actions">
          <button class="btn btn-outline continue-shopping-btn">Continue Shopping</button>
        </div>
      </div>
      
      <div class="cart-sidebar">
        <div class="cart-summary card">
          <h3>Order Summary</h3>
          
          <div class="summary-line">
            <span>Subtotal (${this.getItemCount()} items)</span>
            <span>${formatPrice(this.getSubtotal())}</span>
          </div>
          
          <div class="summary-line">
            <span>Shipping</span>
            <span>${this.getShippingCost() === 0 ? 'FREE' : formatPrice(this.getShippingCost())}</span>
          </div>
          
          <div class="summary-line">
            <span>Tax</span>
            <span>${formatPrice(this.getTax())}</span>
          </div>
          
          <hr>
          
          <div class="summary-line total">
            <span>Total</span>
            <span>${formatPrice(this.getTotal())}</span>
          </div>
          
          <button class="btn btn-primary btn-lg checkout-btn">
            Proceed to Checkout
          </button>
          
          <div class="shipping-info">
            <p class="text-sm text-secondary">
              ${this.getSubtotal() >= 100 ? 
                '🎉 You qualify for FREE shipping!' : 
                `Add ${formatPrice(100 - this.getSubtotal())} more for FREE shipping`
              }
            </p>
          </div>
        </div>
        
        <div class="security-badges">
          <div class="security-badge">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Secure Checkout</span>
          </div>
          <div class="security-badge">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <span>30-Day Returns</span>
          </div>
        </div>
      </div>
    `;
  }

  createCartItem(item) {
    const image = item.image || 'https://via.placeholder.com/120x120?text=No+Image';
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    const total = price * quantity;

    return `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="${image}" alt="${item.name}">
        </div>
        
        <div class="cart-item-details">
          <h4 class="cart-item-name">
            <a href="product.html?id=${item.id || item.product}">${item.name}</a>
          </h4>
          <p class="cart-item-category">${item.category || 'Audio Equipment'}</p>
          <p class="cart-item-price">${formatPrice(price)} each</p>
        </div>
        
        <div class="cart-item-quantity">
          <label for="quantity-${item.id || item.product}" class="sr-only">Quantity</label>
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="cartPage.updateQuantity('${item.id || item.product}', ${quantity - 1})">-</button>
            <input type="number" 
                   id="quantity-${item.id || item.product}"
                   class="quantity-input" 
                   value="${quantity}" 
                   min="1" 
                   max="99"
                   data-product-id="${item.id || item.product}">
            <button class="quantity-btn" onclick="cartPage.updateQuantity('${item.id || item.product}', ${quantity + 1})">+</button>
          </div>
        </div>
        
        <div class="cart-item-total">
          <span class="item-total">${formatPrice(total)}</span>
        </div>
        
        <div class="cart-item-actions">
          <button class="remove-item-btn" data-product-id="${item.id || item.product}" aria-label="Remove item">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  async updateQuantity(productId, quantity) {
    if (quantity < 1) {
      return this.removeItem(productId);
    }

    try {
      if (window.app) {
        await window.app.updateCartQuantity(productId, quantity);
      }
      showSuccess('Cart updated');
    } catch (error) {
      console.error('Failed to update quantity:', error);
      showError('Failed to update cart');
    }
  }

  async removeItem(productId) {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
      return;
    }

    try {
      if (window.app) {
        await window.app.removeFromCart(productId);
      }
      showSuccess('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove item:', error);
      showError('Failed to remove item');
    }
  }

  async clearCart() {
    if (!confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }

    try {
      if (api.isAuthenticated()) {
        await api.clearCart();
      } else {
        localStorage.removeItem('audioLootCart');
      }

      if (window.app) {
        window.app.cart = [];
        window.app.updateCartUI();
      }

      this.cart = [];
      this.renderCart();
      showSuccess('Cart cleared');

    } catch (error) {
      console.error('Failed to clear cart:', error);
      showError('Failed to clear cart');
    }
  }

  proceedToCheckout() {
    if (!api.isAuthenticated()) {
      showWarning('Please log in to proceed to checkout');
      window.location.href = 'login.html?redirect=' + encodeURIComponent('cart.html');
      return;
    }

    if (this.cart.length === 0) {
      showWarning('Your cart is empty');
      return;
    }

    // Navigate to checkout page
    window.location.href = 'checkout.html';
  }

  // Calculation methods
  getItemCount() {
    return this.cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }

  getSubtotal() {
    return this.cart.reduce((total, item) => {
      return total + ((item.price || 0) * (item.quantity || 1));
    }, 0);
  }

  getShippingCost() {
    const subtotal = this.getSubtotal();
    return subtotal >= 100 ? 0 : 9.99; // Free shipping over $100
  }

  getTax() {
    const subtotal = this.getSubtotal();
    return subtotal * 0.08; // 8% tax
  }

  getTotal() {
    return this.getSubtotal() + this.getShippingCost() + this.getTax();
  }

  showLoading() {
    const loading = document.getElementById('cart-loading');
    const cartLayout = document.getElementById('cart-layout');
    const emptyCart = document.getElementById('empty-cart');

    loading.style.display = 'block';
    cartLayout.style.display = 'none';
    emptyCart.style.display = 'none';
  }

  hideLoading() {
    const loading = document.getElementById('cart-loading');
    loading.style.display = 'none';
  }
}

// Initialize cart page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.cartPage = new CartPage();
});