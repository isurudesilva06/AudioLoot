// Profile Page JavaScript
class ProfilePage {
  constructor() {
    this.user = null;
    this.currentTab = 'general';
    
    this.init();
  }

  init() {
    // Check authentication
    if (!api.isAuthenticated()) {
      window.location.href = 'login.html?redirect=profile.html';
      return;
    }

    this.setupEventListeners();
    this.loadUserData();
    this.setupTabs();
  }

  setupEventListeners() {
    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', this.handleProfileUpdate.bind(this));
    }

    // Password form submission
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
      passwordForm.addEventListener('submit', this.handlePasswordChange.bind(this));
    }

    // Tab navigation
    document.addEventListener('click', (e) => {
      if (e.target.matches('.nav-item')) {
        e.preventDefault();
        const tab = e.target.dataset.tab;
        this.switchTab(tab);
      }
    });

    // Auth state changes
    window.addEventListener('authStateChange', (e) => {
      if (!e.detail.isAuthenticated) {
        window.location.href = 'login.html';
      } else {
        this.user = e.detail.user;
        this.updateUserDisplay();
      }
    });
  }

  setupTabs() {
    // Set up initial tab state
    this.switchTab('general');
  }

  switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    this.currentTab = tabName;

    // Load tab-specific data
    switch (tabName) {
      case 'orders':
        this.loadOrders();
        break;
      case 'addresses':
        this.loadAddresses();
        break;
    }
  }

  async loadUserData() {
    try {
      const response = await api.getUserProfile();
      
      if (response.status === 'success') {
        this.user = response.data.user;
        this.updateUserDisplay();
        this.populateProfileForm();
      } else {
        // Fall back to stored user data
        this.user = api.getCurrentUser();
        if (this.user) {
          this.updateUserDisplay();
          this.populateProfileForm();
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      
      // Fall back to stored user data
      this.user = api.getCurrentUser();
      if (this.user) {
        this.updateUserDisplay();
        this.populateProfileForm();
      } else {
        showError('Failed to load profile data');
      }
    }
  }

  updateUserDisplay() {
    if (!this.user) return;

    // Update sidebar user info
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');

    if (userName) {
      userName.textContent = `${this.user.firstName} ${this.user.lastName}`;
    }
    if (userEmail) {
      userEmail.textContent = this.user.email;
    }
  }

  populateProfileForm() {
    if (!this.user) return;

    const form = document.getElementById('profile-form');
    if (!form) return;

    // Populate form fields
    const fields = ['firstName', 'lastName', 'email', 'phone'];
    fields.forEach(field => {
      const input = form.querySelector(`#${field}`);
      if (input && this.user[field]) {
        input.value = this.user[field];
      }
    });
  }

  async handleProfileUpdate(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const updateData = {
      firstName: formData.get('firstName').trim(),
      lastName: formData.get('lastName').trim(),
      phone: formData.get('phone').trim()
    };

    // Validate required fields
    if (!updateData.firstName || !updateData.lastName) {
      showError('First name and last name are required');
      return;
    }

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      setLoading(submitBtn, true);

      const response = await api.updateProfile(updateData);
      
      if (response.status === 'success') {
        this.user = { ...this.user, ...updateData };
        localStorage.setItem('audioLootUser', JSON.stringify(this.user));
        
        this.updateUserDisplay();
        showSuccess('Profile updated successfully');
        
        // Dispatch auth state change to update header
        window.dispatchEvent(new CustomEvent('authStateChange', { 
          detail: { isAuthenticated: true, user: this.user } 
        }));
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showError(error.message || 'Failed to update profile');
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      setLoading(submitBtn, false);
    }
  }

  async handlePasswordChange(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const passwords = {
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword')
    };

    // Validate passwords
    if (passwords.newPassword !== passwords.confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      showError('New password must be at least 6 characters long');
      return;
    }

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      setLoading(submitBtn, true);

      const response = await api.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      if (response.status === 'success') {
        showSuccess('Password changed successfully');
        form.reset();
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      
      let errorMessage = 'Failed to change password';
      if (error.message.includes('current password')) {
        errorMessage = 'Current password is incorrect';
      }
      
      showError(errorMessage);
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      setLoading(submitBtn, false);
    }
  }

  async loadOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    try {
      ordersList.innerHTML = '<p>Loading orders...</p>';
      
      const response = await api.getOrders();
      
      if (response.status === 'success' && response.data.orders.length > 0) {
        ordersList.innerHTML = response.data.orders.map(order => `
          <div class="order-item">
            <div class="order-header">
              <h4>Order #${order.orderNumber}</h4>
              <span class="order-status status-${order.status}">${order.status}</span>
            </div>
            <div class="order-details">
              <p>Date: ${formatDate(order.createdAt)}</p>
              <p>Total: ${formatPrice(order.total)}</p>
              <p>Items: ${order.items.length}</p>
            </div>
          </div>
        `).join('');
      } else {
        ordersList.innerHTML = '<p>No orders found</p>';
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      ordersList.innerHTML = '<p>Failed to load orders</p>';
    }
  }

  async loadAddresses() {
    const addressesList = document.getElementById('addresses-list');
    if (!addressesList) return;

    try {
      addressesList.innerHTML = '<p>Loading addresses...</p>';
      
      const response = await api.getAddresses();
      
      if (response.status === 'success' && response.data.addresses.length > 0) {
        addressesList.innerHTML = response.data.addresses.map(address => `
          <div class="address-item">
            <div class="address-header">
              <h4>${address.name}</h4>
              ${address.isDefault ? '<span class="badge">Default</span>' : ''}
            </div>
            <div class="address-details">
              <p>${address.street}</p>
              <p>${address.city}, ${address.state} ${address.zipCode}</p>
              <p>${address.country}</p>
            </div>
          </div>
        `).join('');
      } else {
        addressesList.innerHTML = '<p>No addresses found</p>';
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
      addressesList.innerHTML = '<p>Failed to load addresses</p>';
    }
  }
}

// Initialize profile page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.profilePage = new ProfilePage();
});