// Admin Login Page JavaScript
class AdminLoginPage {
  constructor() {
    this.form = document.getElementById('admin-login-form');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.submitBtn = document.getElementById('admin-login-btn');
    this.isLoading = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.emailInput.addEventListener('input', () => this.clearError('email'));
    this.passwordInput.addEventListener('input', () => this.clearError('password'));
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isLoading) return;
    this.clearAllErrors();
    const email = this.emailInput.value.trim().toLowerCase();
    const password = this.passwordInput.value;
    if (!email) {
      this.showError('email', 'Email is required');
      return;
    }
    if (!password) {
      this.showError('password', 'Password is required');
      return;
    }
    try {
      this.setLoading(true);
      const response = await api.login({ email, password });
      if (response.status === 'success') {
        const user = response.data.user;
        if (user.role !== 'admin') {
          api.clearAuth();
          this.showError('email', 'Access denied: Not an admin account.');
          return;
        }
        showSuccess('Welcome, Admin! Redirecting...');
        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 1000);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      this.showError('password', 'Invalid credentials or not an admin.');
      this.passwordInput.focus();
    } finally {
      this.setLoading(false);
    }
  }

  showError(field, message) {
    const errorElement = document.getElementById(`${field}-error`);
    const inputElement = document.getElementById(field);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('show');
    }
    if (inputElement) {
      inputElement.classList.add('error');
    }
  }

  clearError(field) {
    const errorElement = document.getElementById(`${field}-error`);
    const inputElement = document.getElementById(field);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('show');
    }
    if (inputElement) {
      inputElement.classList.remove('error');
    }
  }

  clearAllErrors() {
    this.clearError('email');
    this.clearError('password');
  }

  setLoading(loading) {
    this.isLoading = loading;
    if (this.submitBtn) {
      this.submitBtn.disabled = loading;
      if (loading) {
        this.submitBtn.classList.add('loading');
      } else {
        this.submitBtn.classList.remove('loading');
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Redirect if already logged in as admin
  if (api.isAuthenticated() && api.isAdmin()) {
    window.location.href = 'admin-dashboard.html';
    return;
  }
  new AdminLoginPage();
}); 