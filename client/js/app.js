// Main App JavaScript
class AudioLootApp {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem('audioLootCart')) || [];
    this.user = null;
    this.isAuthenticated = false;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateAuthUI();
    this.updateCartUI();
    this.setupMobileMenu();
  }

  setupEventListeners() {
    // Auth state changes
    window.addEventListener('authStateChange', (e) => {
      this.isAuthenticated = e.detail.isAuthenticated;
      this.user = e.detail.user;
      this.updateAuthUI();
      
      if (this.isAuthenticated) {
        this.syncCartWithServer();
      }
    });

    // Cart updates
    window.addEventListener('cartUpdated', () => {
      this.updateCartUI();
    });

    // Logout button
    document.addEventListener('click', (e) => {
      if (e.target.matches('.logout-btn')) {
        e.preventDefault();
        this.logout();
      }
    });

    // Mobile menu toggle
    document.addEventListener('click', (e) => {
      if (e.target.matches('.mobile-menu-btn') || e.target.closest('.mobile-menu-btn')) {
        this.toggleMobileMenu();
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      const mobileMenu = document.querySelector('.mobile-menu');
      const menuBtn = document.querySelector('.mobile-menu-btn');
      
      if (mobileMenu && mobileMenu.classList.contains('show') && 
          !mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        this.closeMobileMenu();
      }
    });
  }

  setupMobileMenu() {
    // Mobile menu setup is handled in CSS
    // This method can be used for dynamic menu updates
  }

  toggleMobileMenu() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Create mobile menu if it doesn't exist
    let mobileMenu = navbar.querySelector('.mobile-menu');
    if (!mobileMenu) {
      mobileMenu = document.createElement('div');
      mobileMenu.className = 'mobile-menu';
      this.updateMobileMenuContent(mobileMenu);
      navbar.appendChild(mobileMenu);
    }

    mobileMenu.classList.toggle('show');
    
    // Update menu button icon
    const menuBtn = navbar.querySelector('.mobile-menu-btn');
    if (menuBtn) {
      const isOpen = mobileMenu.classList.contains('show');
      menuBtn.innerHTML = isOpen ? `
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      ` : `
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      `;
    }
  }

  closeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
      mobileMenu.classList.remove('show');
      
      // Reset menu button icon
      const menuBtn = document.querySelector('.mobile-menu-btn');
      if (menuBtn) {
        menuBtn.innerHTML = `
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        `;
      }
    }
  }

  updateMobileMenuContent(mobileMenu) {
    mobileMenu.innerHTML = `
      <div class="mobile-nav-links">
        <a href="index.html">Home</a>
        <a href="products.html">Products</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </div>
      <div class="mobile-auth-section">
        ${this.isAuthenticated ? 
          `<div class="mobile-user-info">
            <span class="user-greeting">Welcome, ${this.user?.firstName || 'User'}!</span>
            <div class="mobile-user-actions">
              <a href="profile.html" class="btn btn-outline btn-sm">Profile</a>
              <button class="btn btn-ghost btn-sm logout-btn">Logout</button>
            </div>
          </div>` :
          `<div class="mobile-auth-buttons">
            <a href="login.html" class="btn btn-outline btn-sm">Login</a>
            <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
          </div>`
        }
      </div>
    `;
  }

  updateAuthUI() {
    // Update desktop auth buttons
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
      if (this.isAuthenticated && this.user) {
        authButtons.innerHTML = `
          <div class="user-menu">
            <span class="user-greeting">Hi, ${this.user.firstName}</span>
            <a href="profile.html" class="btn btn-outline btn-sm">Profile</a>
            ${this.user.role === 'admin' ? '<a href="admin.html" class="btn btn-secondary btn-sm">Admin</a>' : ''}
            <button class="btn btn-ghost btn-sm logout-btn">Logout</button>
          </div>
        `;
      } else {
        authButtons.innerHTML = `
          <a href="login.html" class="btn btn-outline">Login</a>
          <a href="register.html" class="btn btn-primary">Sign Up</a>
        `;
      }
    }

    // Update mobile menu
    this.updateMobileAuthUI();

    // Update admin links visibility
    const adminLinks = document.querySelectorAll('.admin-only');
    adminLinks.forEach(link => {
      if (this.isAuthenticated && this.user?.role === 'admin') {
        link.style.display = 'block';
      } else {
        link.style.display = 'none';
      }
    });
  }

  updateMobileAuthUI() {
    const mobileAuthButtons = document.querySelector('.mobile-auth-buttons');
    if (mobileAuthButtons) {
      if (this.isAuthenticated && this.user) {
        mobileAuthButtons.innerHTML = `
          <div class="user-info">
            <span>Welcome, ${this.user.firstName}</span>
            <a href="profile.html" class="btn btn-outline btn-sm">Profile</a>
            ${this.user.role === 'admin' ? '<a href="admin.html" class="btn btn-secondary btn-sm">Admin</a>' : ''}
            <button class="btn btn-ghost btn-sm logout-btn">Logout</button>
          </div>
        `;
      } else {
        mobileAuthButtons.innerHTML = `
          <a href="login.html" class="btn btn-outline btn-sm">Login</a>
          <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
        `;
      }
    }
  }

  updateCartUI() {
    const cartCounts = document.querySelectorAll('.cart-count');
    const itemCount = this.cart.reduce((total, item) => total + item.quantity, 0);
    
    cartCounts.forEach(count => {
      count.textContent = itemCount;
      if (itemCount > 0) {
        count.classList.add('show');
      } else {
        count.classList.remove('show');
      }
    });
  }

  async logout() {
    try {
      await api.logout();
      showSuccess('Logged out successfully');
      
      // Redirect to home page after logout
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } catch (error) {
      console.error('Logout error:', error);
      showError('Logout failed');
    }
  }

  async syncCartWithServer() {
    if (!this.isAuthenticated) return;

    try {
      // Get server cart
      const response = await api.getCart();
      const serverCart = response.data?.cart || [];

      // If local cart has items, sync them to server
      if (this.cart.length > 0) {
        for (const item of this.cart) {
          await api.addToCart(item.id || item.product, item.quantity);
        }
        
        // Clear local cart
        this.cart = [];
        localStorage.removeItem('audioLootCart');
        
        showSuccess('Cart synced successfully');
      }

      // Load updated cart from server
      const updatedResponse = await api.getCart();
      this.cart = updatedResponse.data?.cart || [];
      this.updateCartUI();

    } catch (error) {
      console.error('Cart sync error:', error);
      showWarning('Failed to sync cart data');
    }
  }

  async addToCart(productId, quantity = 1) {
    try {
      if (this.isAuthenticated) {
        // Add to server cart
        const response = await api.addToCart(productId, quantity);
        this.cart = response.data?.cart || [];
        showSuccess('Item added to cart');
      } else {
        // Add to local cart
        const existingItem = this.cart.find(item => 
          (item.id || item.product) === productId
        );
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          // We need product details for local cart
          const productResponse = await api.getProduct(productId);
          const product = productResponse.data?.product;
          
          if (product) {
            this.cart.push({
              id: product._id,
              name: product.name,
              price: product.price,
              image: product.images?.[0]?.url || product.image,
              quantity: quantity
            });
          }
        }
        
        localStorage.setItem('audioLootCart', JSON.stringify(this.cart));
        showSuccess('Item added to cart');
      }
      
      this.updateCartUI();
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
    } catch (error) {
      console.error('Add to cart error:', error);
      showError('Failed to add item to cart');
    }
  }

  async removeFromCart(productId) {
    try {
      if (this.isAuthenticated) {
        const response = await api.removeFromCart(productId);
        this.cart = response.data?.cart || [];
      } else {
        this.cart = this.cart.filter(item => 
          (item.id || item.product) !== productId
        );
        localStorage.setItem('audioLootCart', JSON.stringify(this.cart));
      }
      
      this.updateCartUI();
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      showSuccess('Item removed from cart');
      
    } catch (error) {
      console.error('Remove from cart error:', error);
      showError('Failed to remove item from cart');
    }
  }

  async updateCartQuantity(productId, quantity) {
    try {
      if (quantity <= 0) {
        return this.removeFromCart(productId);
      }

      if (this.isAuthenticated) {
        const response = await api.updateCartItem(productId, quantity);
        this.cart = response.data?.cart || [];
      } else {
        const item = this.cart.find(item => 
          (item.id || item.product) === productId
        );
        if (item) {
          item.quantity = quantity;
          localStorage.setItem('audioLootCart', JSON.stringify(this.cart));
        }
      }
      
      this.updateCartUI();
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
    } catch (error) {
      console.error('Update cart quantity error:', error);
      showError('Failed to update cart');
    }
  }

  getCartTotal() {
    return this.cart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  getCartItemsCount() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  // Navigation helpers
  navigateTo(url) {
    window.location.href = url;
  }

  redirectToLogin(returnUrl = null) {
    const loginUrl = returnUrl ? 
      `login.html?redirect=${encodeURIComponent(returnUrl)}` : 
      'login.html';
    this.navigateTo(loginUrl);
  }

  requireAuth(callback) {
    if (this.isAuthenticated) {
      callback();
    } else {
      showWarning('Please log in to continue');
      this.redirectToLogin(window.location.pathname);
    }
  }

  requireAdmin(callback) {
    if (this.isAuthenticated && this.user?.role === 'admin') {
      callback();
    } else if (this.isAuthenticated) {
      showError('Admin access required');
      this.navigateTo('index.html');
    } else {
      showWarning('Please log in as an administrator');
      this.redirectToLogin('admin.html');
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.app = new AudioLootApp();
});

// Global cart functions for backward compatibility
window.addToCart = function(productId, quantity = 1) {
  if (window.app) {
    window.app.addToCart(productId, quantity);
  }
};

window.removeFromCart = function(productId) {
  if (window.app) {
    window.app.removeFromCart(productId);
  }
};

window.updateCartQuantity = function(productId, quantity) {
  if (window.app) {
    window.app.updateCartQuantity(productId, quantity);
  }
};