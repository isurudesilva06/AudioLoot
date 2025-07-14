// Register Page JavaScript
class RegisterPage {
  constructor() {
    this.form = document.getElementById('register-form');
    this.firstNameInput = document.getElementById('firstName');
    this.lastNameInput = document.getElementById('lastName');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.confirmPasswordInput = document.getElementById('confirmPassword');
    this.termsCheckbox = document.getElementById('terms');
    this.newsletterCheckbox = document.getElementById('newsletter');
    this.submitBtn = document.getElementById('register-btn');
    this.passwordToggle = document.getElementById('password-toggle');
    this.confirmPasswordToggle = document.getElementById('confirm-password-toggle');
    this.passwordStrength = document.getElementById('password-strength');
    
    this.isLoading = false;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupFormValidation();
    
    // Check if already logged in
    if (api.isAuthenticated()) {
      window.location.href = 'index.html';
    }
  }

  setupEventListeners() {
    // Form submission
    this.form.addEventListener('submit', this.handleSubmit.bind(this));

    // Password toggles
    if (this.passwordToggle) {
      this.passwordToggle.addEventListener('click', () => this.togglePassword('password'));
    }
    if (this.confirmPasswordToggle) {
      this.confirmPasswordToggle.addEventListener('click', () => this.togglePassword('confirmPassword'));
    }

    // Real-time validation
    this.firstNameInput.addEventListener('blur', () => this.validateFirstName());
    this.lastNameInput.addEventListener('blur', () => this.validateLastName());
    this.emailInput.addEventListener('blur', () => this.validateEmail());
    this.passwordInput.addEventListener('input', () => {
      this.checkPasswordStrength();
      this.clearError('password');
    });
    this.passwordInput.addEventListener('blur', () => this.validatePassword());
    this.confirmPasswordInput.addEventListener('blur', () => this.validateConfirmPassword());
    this.termsCheckbox.addEventListener('change', () => this.validateTerms());
    
    // Clear errors on input
    this.firstNameInput.addEventListener('input', () => this.clearError('firstName'));
    this.lastNameInput.addEventListener('input', () => this.clearError('lastName'));
    this.emailInput.addEventListener('input', () => this.clearError('email'));
    this.confirmPasswordInput.addEventListener('input', () => this.clearError('confirmPassword'));

    // Social registration
    const googleBtn = document.getElementById('google-register');
    if (googleBtn) {
      googleBtn.addEventListener('click', this.handleGoogleRegister.bind(this));
    }

    // Auth state changes
    window.addEventListener('authStateChange', (e) => {
      if (e.detail.isAuthenticated) {
        showSuccess('Account created successfully! Welcome to AudioLoot.');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
    });
  }

  setupFormValidation() {
    // Add required attributes and patterns
    // Remove pattern attribute for email - HTML5 type="email" provides built-in validation
    this.passwordInput.setAttribute('minlength', '8');
    this.firstNameInput.setAttribute('pattern', '[A-Za-z\\s]{2,}');
    this.lastNameInput.setAttribute('pattern', '[A-Za-z\\s]{2,}');
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
      const userData = {
        firstName: formData.get('firstName').trim(),
        lastName: formData.get('lastName').trim(),
        email: formData.get('email').trim().toLowerCase(),
        password: formData.get('password'),
        newsletter: formData.get('newsletter') === 'on'
      };

      const response = await api.register(userData);

      if (response.status === 'success') {
        // Registration successful - the auth state change event will handle redirect
        showSuccess('Account created successfully! Welcome to AudioLoot.');
      } else {
        throw new Error(response.message || 'Registration failed');
      }

    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('Email already exists')) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
        this.showError('email', 'Email already registered');
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
        this.showError('email', 'Invalid email format');
      } else if (error.message.includes('Password too weak')) {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
        this.showError('password', 'Password is too weak');
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showError(errorMessage);
      
    } finally {
      this.setLoading(false);
    }
  }

  validateForm() {
    let isValid = true;

    // Clear previous errors
    this.clearAllErrors();

    // Validate all fields
    if (!this.validateFirstName()) isValid = false;
    if (!this.validateLastName()) isValid = false;
    if (!this.validateEmail()) isValid = false;
    if (!this.validatePassword()) isValid = false;
    if (!this.validateConfirmPassword()) isValid = false;
    if (!this.validateTerms()) isValid = false;

    return isValid;
  }

  validateFirstName() {
    const firstName = this.firstNameInput.value.trim();
    
    if (!firstName) {
      this.showError('firstName', 'First name is required');
      return false;
    }

    if (firstName.length < 2) {
      this.showError('firstName', 'First name must be at least 2 characters');
      return false;
    }

    if (!/^[A-Za-z\s]+$/.test(firstName)) {
      this.showError('firstName', 'First name can only contain letters and spaces');
      return false;
    }

    return true;
  }

  validateLastName() {
    const lastName = this.lastNameInput.value.trim();
    
    if (!lastName) {
      this.showError('lastName', 'Last name is required');
      return false;
    }

    if (lastName.length < 2) {
      this.showError('lastName', 'Last name must be at least 2 characters');
      return false;
    }

    if (!/^[A-Za-z\s]+$/.test(lastName)) {
      this.showError('lastName', 'Last name can only contain letters and spaces');
      return false;
    }

    return true;
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

    if (password.length < 8) {
      this.showError('password', 'Password must be at least 8 characters long');
      return false;
    }

    // Check password strength
    const strength = this.getPasswordStrength(password);
    if (strength < 2) {
      this.showError('password', 'Password is too weak. Include uppercase, lowercase, numbers, and special characters.');
      return false;
    }

    return true;
  }

  validateConfirmPassword() {
    const password = this.passwordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;
    
    if (!confirmPassword) {
      this.showError('confirmPassword', 'Please confirm your password');
      return false;
    }

    if (password !== confirmPassword) {
      this.showError('confirmPassword', 'Passwords do not match');
      return false;
    }

    return true;
  }

  validateTerms() {
    if (!this.termsCheckbox.checked) {
      this.showError('terms', 'You must accept the Terms of Service and Privacy Policy');
      return false;
    }

    return true;
  }

  checkPasswordStrength() {
    const password = this.passwordInput.value;
    const strength = this.getPasswordStrength(password);
    const strengthBar = this.passwordStrength.querySelector('.strength-fill');
    const strengthText = this.passwordStrength.querySelector('.strength-text');
    
    if (password.length > 0) {
      this.passwordStrength.classList.add('show');
      
      // Remove all strength classes
      strengthBar.className = 'strength-fill';
      strengthText.className = 'strength-text';
      
      switch (strength) {
        case 0:
          strengthBar.classList.add('weak');
          strengthText.classList.add('weak');
          strengthText.textContent = 'Very weak password';
          break;
        case 1:
          strengthBar.classList.add('weak');
          strengthText.classList.add('weak');
          strengthText.textContent = 'Weak password';
          break;
        case 2:
          strengthBar.classList.add('fair');
          strengthText.classList.add('fair');
          strengthText.textContent = 'Fair password';
          break;
        case 3:
          strengthBar.classList.add('good');
          strengthText.classList.add('good');
          strengthText.textContent = 'Good password';
          break;
        case 4:
          strengthBar.classList.add('strong');
          strengthText.classList.add('strong');
          strengthText.textContent = 'Strong password';
          break;
      }
    } else {
      this.passwordStrength.classList.remove('show');
    }
  }

  getPasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    
    // Lowercase check
    if (/[a-z]/.test(password)) strength++;
    
    // Uppercase check
    if (/[A-Z]/.test(password)) strength++;
    
    // Number check
    if (/[0-9]/.test(password)) strength++;
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return Math.min(strength, 4);
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
    const inputElements = this.form.querySelectorAll('.form-input, .checkbox');
    
    errorElements.forEach(el => {
      el.textContent = '';
      el.classList.remove('show');
    });
    
    inputElements.forEach(el => {
      el.classList.remove('error');
    });
  }

  togglePassword(fieldName) {
    const input = document.getElementById(fieldName);
    const toggleBtn = document.getElementById(fieldName === 'password' ? 'password-toggle' : 'confirm-password-toggle');
    
    if (!input || !toggleBtn) return;
    
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    
    // Update icon
    const icon = toggleBtn.querySelector('svg');
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

  async handleGoogleRegister(e) {
    e.preventDefault();
    showWarning('Google registration is not yet implemented. Please use the registration form.');
    
    // TODO: Implement Google OAuth registration
  }
}

// Initialize register page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.registerPage = new RegisterPage();
});