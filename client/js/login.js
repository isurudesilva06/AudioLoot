// Login Page JavaScript
class LoginPage {
  constructor() {
    this.form = document.getElementById('login-form');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.rememberCheckbox = document.getElementById('remember');
    this.submitBtn = document.getElementById('login-btn');
    this.passwordToggle = document.getElementById('password-toggle');
    
    this.isLoading = false;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupFormValidation();
    this.handleRedirect();
    
    // Check if already logged in
    if (api.isAuthenticated()) {
      this.redirectAfterLogin();
    }
  }

  setupEventListeners() {
    // Form submission
    this.form.addEventListener('submit', this.handleSubmit.bind(this));

    // Password toggle
    if (this.passwordToggle) {
      this.passwordToggle.addEventListener('click', this.togglePassword.bind(this));
    }

    // Real-time validation
    this.emailInput.addEventListener('blur', () => this.validateEmail());
    this.passwordInput.addEventListener('blur', () => this.validatePassword());
    
    // Clear errors on input
    this.emailInput.addEventListener('input', () => this.clearError('email'));
    this.passwordInput.addEventListener('input', () => this.clearError('password'));

    // Social login buttons
    const googleBtn = document.getElementById('google-login');
    if (googleBtn) {
      googleBtn.addEventListener('click', this.handleGoogleLogin.bind(this));
    }

    // Forgot password link
    const forgotLink = document.querySelector('a[href="#forgot-password"]');
    if (forgotLink) {
      forgotLink.addEventListener('click', this.handleForgotPassword.bind(this));
    }

    // Auth state changes
    window.addEventListener('authStateChange', (e) => {
      if (e.detail.isAuthenticated) {
        this.redirectAfterLogin();
      }
    });
  }

  setupFormValidation() {
    // Add required attributes and patterns
    this.emailInput.setAttribute('pattern', '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$');
    this.passwordInput.setAttribute('minlength', '6');
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (this.isLoading) return;

    // Validate form
    if (!this.validateForm()) {
      return;
    }

    try {
      this.setLoading(true);

      const formData = new FormData(this.form);
      const credentials = {
        email: formData.get('email').trim().toLowerCase(),
        password: formData.get('password'),
        remember: formData.get('remember') === 'on'
      };

      const response = await api.login(credentials);

      if (response.status === 'success') {
        showSuccess('Welcome back! You have been successfully logged in.');
        
        // Handle remember me
        if (credentials.remember) {
          localStorage.setItem('audioLootRememberMe', 'true');
        }

        // Small delay for better UX
        setTimeout(() => {
          this.redirectAfterLogin();
        }, 1000);
      } else {
        throw new Error(response.message || 'Login failed');
      }

    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message.includes('Invalid credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('Account not verified')) {
        errorMessage = 'Please verify your email address before logging in.';
      } else if (error.message.includes('Account suspended')) {
        errorMessage = 'Your account has been suspended. Please contact support.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showError(errorMessage);
      
      // Focus on email field for retry
      this.emailInput.focus();
      
    } finally {
      this.setLoading(false);
    }
  }

  validateForm() {
    let isValid = true;

    // Clear previous errors
    this.clearAllErrors();

    // Validate email
    if (!this.validateEmail()) {
      isValid = false;
    }

    // Validate password
    if (!this.validatePassword()) {
      isValid = false;
    }

    return isValid;
  }

  validateEmail() {
    const email = this.emailInput.value.trim();
    
    if (!email) {
      this.showError('email', 'Email is required');
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      this.showError('email', 'Please enter a valid email address');
      return false;
    }

    return true;
  }

  validatePassword() {
    const password = this.passwordInput.value;
    
    if (!password) {
      this.showError('password', 'Password is required');
      return false;
    }

    if (password.length < 6) {
      this.showError('password', 'Password must be at least 6 characters long');
      return false;
    }

    return true;
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
    const errorElements = this.form.querySelectorAll('.form-error');
    const inputElements = this.form.querySelectorAll('.form-input');
    
    errorElements.forEach(el => {
      el.textContent = '';
      el.classList.remove('show');
    });
    
    inputElements.forEach(el => {
      el.classList.remove('error');
    });
  }

  togglePassword() {
    const isPassword = this.passwordInput.type === 'password';
    this.passwordInput.type = isPassword ? 'text' : 'password';
    
    // Update icon
    const icon = this.passwordToggle.querySelector('svg');
    if (isPassword) {
      // Show "eye-off" icon
      icon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
      `;
    } else {
      // Show "eye" icon
      icon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      `;
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    
    const btnText = this.submitBtn.querySelector('.btn-text');
    const btnLoading = this.submitBtn.querySelector('.btn-loading');
    
    if (loading) {
      this.submitBtn.disabled = true;
      this.submitBtn.classList.add('loading');
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.classList.remove('loading');
      btnText.style.display = 'block';
      btnLoading.style.display = 'none';
    }
  }

  handleRedirect() {
    // Get redirect URL from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    this.redirectUrl = urlParams.get('redirect') || 'index.html';
  }

  redirectAfterLogin() {
    // Small delay for better UX
    setTimeout(() => {
      window.location.href = this.redirectUrl;
    }, 500);
  }

  async handleGoogleLogin(e) {
    e.preventDefault();
    showWarning('Google login is not yet implemented. Please use email/password login.');
    
    // TODO: Implement Google OAuth
    // This would typically involve:
    // 1. Initialize Google OAuth
    // 2. Handle the OAuth flow
    // 3. Send the token to your backend
    // 4. Receive JWT token from backend
    // 5. Store token and redirect
  }

  handleForgotPassword(e) {
    e.preventDefault();
    
    const email = this.emailInput.value.trim();
    
    if (email && this.validateEmail()) {
      // TODO: Implement forgot password
      showSuccess(`Password reset instructions will be sent to ${email}`);
    } else {
      showWarning('Please enter your email address first');
      this.emailInput.focus();
    }
  }
}

// Initialize login page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.loginPage = new LoginPage();
});