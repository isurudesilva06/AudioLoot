// API Service for AudioLoot
class APIService {
  constructor() {
    this.baseURL = 'http://localhost:5001/api';
    this.token = localStorage.getItem('audioLootToken');
  }

  // Token management
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('audioLootToken', token);
    } else {
      localStorage.removeItem('audioLootToken');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('audioLootToken');
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem('audioLootToken');
    localStorage.removeItem('audioLootUser');
    // Dispatch auth state change event
    window.dispatchEvent(new CustomEvent('authStateChange', { 
      detail: { isAuthenticated: false, user: null } 
    }));
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('audioLootUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  // HTTP request wrapper
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle authentication errors
      if (response.status === 401) {
        this.clearAuth();
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // HTTP methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Authentication methods
  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.status === 'success') {
      this.setToken(response.data.token);
      localStorage.setItem('audioLootUser', JSON.stringify(response.data.user));
      window.dispatchEvent(new CustomEvent('authStateChange', { 
        detail: { isAuthenticated: true, user: response.data.user } 
      }));
    }
    return response;
  }

  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    if (response.status === 'success') {
      this.setToken(response.data.token);
      localStorage.setItem('audioLootUser', JSON.stringify(response.data.user));
      window.dispatchEvent(new CustomEvent('authStateChange', { 
        detail: { isAuthenticated: true, user: response.data.user } 
      }));
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  async getMe() {
    const response = await this.get('/auth/me');
    if (response.status === 'success') {
      localStorage.setItem('audioLootUser', JSON.stringify(response.data.user));
      return response.data.user;
    }
    throw new Error('Failed to get user data');
  }

  // Product methods
  async getProducts(params = {}) {
    return this.get('/products', params);
  }

  async getProduct(id) {
    return this.get(`/products/${id}`);
  }

  async getFeaturedProducts(limit = 6) {
    return this.get('/products/featured', { limit });
  }

  async getProductCategories() {
    return this.get('/products/categories');
  }

  async addProductReview(productId, reviewData) {
    return this.post(`/products/${productId}/reviews`, reviewData);
  }

  async getProductReviews(productId, params = {}) {
    return this.get(`/products/${productId}/reviews`, params);
  }

  // Cart methods
  async getCart() {
    return this.get('/users/cart');
  }

  async addToCart(productId, quantity = 1) {
    return this.post('/users/cart', { productId, quantity });
  }

  async updateCartItem(productId, quantity) {
    return this.put(`/users/cart/${productId}`, { quantity });
  }

  async removeFromCart(productId) {
    return this.delete(`/users/cart/${productId}`);
  }

  async clearCart() {
    return this.delete('/users/cart');
  }

  // User methods
  async getUserProfile() {
    return this.get('/users/profile');
  }

  async updateProfile(profileData) {
    return this.put('/users/profile', profileData);
  }

  async getAddresses() {
    return this.get('/users/addresses');
  }

  async addAddress(addressData) {
    return this.post('/users/addresses', addressData);
  }

  async updateAddress(addressId, addressData) {
    return this.put(`/users/addresses/${addressId}`, addressData);
  }

  async deleteAddress(addressId) {
    return this.delete(`/users/addresses/${addressId}`);
  }

  // Wishlist methods
  async getWishlist() {
    return this.get('/users/wishlist');
  }

  async addToWishlist(productId) {
    return this.post(`/users/wishlist/${productId}`);
  }

  async removeFromWishlist(productId) {
    return this.delete(`/users/wishlist/${productId}`);
  }

  // Order methods
  async getOrders(params = {}) {
    return this.get('/orders', params);
  }

  async getOrder(orderId) {
    return this.get(`/orders/${orderId}`);
  }

  async createOrder(orderData) {
    return this.post('/orders', orderData);
  }

  async cancelOrder(orderId, reason = '') {
    return this.put(`/orders/${orderId}/cancel`, { reason });
  }

  // Admin methods
  async createProduct(productData) {
    return this.post('/products', productData);
  }

  async updateProduct(productId, productData) {
    return this.put(`/products/${productId}`, productData);
  }

  async deleteProduct(productId) {
    return this.delete(`/products/${productId}`);
  }

  async getAllUsers(params = {}) {
    return this.get('/users', params);
  }

  async updateUserRole(userId, role) {
    return this.put(`/users/${userId}/role`, { role });
  }

  async updateUserStatus(userId, isActive) {
    return this.put(`/users/${userId}/status`, { isActive });
  }

  async getOrderStats() {
    return this.get('/orders/stats/summary');
  }
}

// Create global API instance
window.api = new APIService();

// Utility functions
window.showNotification = function(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Hide and remove notification
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
};

window.showError = function(message, duration = 5000) {
  window.showNotification(message, 'error', duration);
};

window.showSuccess = function(message, duration = 3000) {
  window.showNotification(message, 'success', duration);
};

window.showWarning = function(message, duration = 4000) {
  window.showNotification(message, 'warning', duration);
};

// Format price utility
window.formatPrice = function(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

// Format date utility
window.formatDate = function(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

// Generate star rating HTML
window.generateStars = function(rating, totalStars = 5) {
  let stars = '';
  for (let i = 1; i <= totalStars; i++) {
    if (i <= Math.floor(rating)) {
      stars += '<span class="star filled">★</span>';
    } else if (i - 0.5 <= rating) {
      stars += '<span class="star half">★</span>';
    } else {
      stars += '<span class="star empty">☆</span>';
    }
  }
  return stars;
};

// Loading state management
window.setLoading = function(element, loading = true) {
  if (loading) {
    element.classList.add('loading');
    element.disabled = true;
  } else {
    element.classList.remove('loading');
    element.disabled = false;
  }
};

// Debounce utility
window.debounce = function(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', async function() {
  // Check if user has a token
  const token = api.getToken();
  if (token) {
    try {
      // Validate token with server
      const response = await api.getMe();
      
      // Token is valid, update auth state
      window.dispatchEvent(new CustomEvent('authStateChange', { 
        detail: { isAuthenticated: true, user: response } 
      }));
    } catch (error) {
      console.log('Token validation failed:', error);
      
      // Token is invalid, clear auth data
      api.clearAuth();
      
      // Update UI to show login/signup buttons
      window.dispatchEvent(new CustomEvent('authStateChange', { 
        detail: { isAuthenticated: false, user: null } 
      }));
    }
  } else {
    // No token, ensure UI shows login/signup buttons
    window.dispatchEvent(new CustomEvent('authStateChange', { 
      detail: { isAuthenticated: false, user: null } 
    }));
  }
});