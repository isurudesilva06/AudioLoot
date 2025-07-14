// Checkout Page JavaScript
class CheckoutPage {
  constructor() {
    this.currentStep = 1;
    this.cart = [];
    this.shippingData = {};
    this.paymentData = {};
    this.orderData = {};
    this.shippingMethods = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: '5-7 business days',
        price: 9.99
      },
      {
        id: 'express',
        name: 'Express Shipping',
        description: '2-3 business days',
        price: 19.99
      },
      {
        id: 'overnight',
        name: 'Overnight Shipping',
        description: 'Next business day',
        price: 39.99
      }
    ];
    this.selectedShippingMethod = 'standard';
    this.discountCode = null;
    this.discountAmount = 0;
    
    this.init();
  }

  init() {
    // Check authentication
    if (!api.isAuthenticated()) {
      showWarning('Please log in to proceed with checkout');
      window.location.href = 'login.html?redirect=' + encodeURIComponent('checkout.html');
      return;
    }

    this.setupEventListeners();
    this.loadCartData();
    this.loadUserData();
    this.renderShippingMethods();
  }

  setupEventListeners() {
    // Step navigation
    document.getElementById('continue-to-payment')?.addEventListener('click', () => {
      this.proceedToPayment();
    });

    document.getElementById('back-to-shipping')?.addEventListener('click', () => {
      this.goToStep(1);
    });

    document.getElementById('complete-order')?.addEventListener('click', () => {
      this.completeOrder();
    });

    // Payment method selection
    document.addEventListener('change', (e) => {
      if (e.target.name === 'paymentMethod') {
        this.handlePaymentMethodChange(e.target.value);
      }
    });

    // Billing address toggle
    document.getElementById('sameAsShipping')?.addEventListener('change', (e) => {
      this.toggleBillingAddress(!e.target.checked);
    });

    // Shipping method selection
    document.addEventListener('change', (e) => {
      if (e.target.name === 'shippingMethod') {
        this.selectedShippingMethod = e.target.value;
        this.updateOrderSummary();
      }
    });

    // Form validation
    document.addEventListener('blur', (e) => {
      if (e.target.matches('.form-input[required]')) {
        this.validateField(e.target);
      }
    });

    // Discount code
    document.getElementById('apply-discount')?.addEventListener('click', () => {
      this.applyDiscountCode();
    });

    // Card number formatting
    document.getElementById('cardNumber')?.addEventListener('input', (e) => {
      this.formatCardNumber(e.target);
    });

    // Expiry date formatting
    document.getElementById('expiry')?.addEventListener('input', (e) => {
      this.formatExpiryDate(e.target);
    });

    // Phone number formatting
    document.getElementById('phone')?.addEventListener('input', (e) => {
      this.formatPhoneNumber(e.target);
    });

    // Real-time validation
    document.addEventListener('input', (e) => {
      if (e.target.matches('.form-input')) {
        this.clearError(e.target.name || e.target.id);
      }
    });
  }

  async loadCartData() {
    try {
      // Get cart from app or API
      if (window.app && window.app.cart) {
        this.cart = window.app.cart;
      } else {
        const response = await api.getCart();
        this.cart = response.data?.cart || [];
      }

      if (this.cart.length === 0) {
        showWarning('Your cart is empty');
        window.location.href = 'cart.html';
        return;
      }

      this.renderOrderSummary();
      this.updateOrderSummary();

    } catch (error) {
      console.error('Failed to load cart:', error);
      showError('Failed to load cart data');
    }
  }

  async loadUserData() {
    try {
      const user = api.getCurrentUser();
      if (user && user.email) {
        document.getElementById('email').value = user.email;
      }

      // Load saved addresses if available
      const addresses = await api.getAddresses();
      if (addresses.data && addresses.data.length > 0) {
        this.prefillShippingAddress(addresses.data[0]);
      }

    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  prefillShippingAddress(address) {
    const fields = ['firstName', 'lastName', 'address', 'apartment', 'city', 'state', 'zipCode', 'phone'];
    fields.forEach(field => {
      const element = document.getElementById(field);
      if (element && address[field]) {
        element.value = address[field];
      }
    });
  }

  renderShippingMethods() {
    const container = document.getElementById('shipping-methods');
    if (!container) return;

    container.innerHTML = this.shippingMethods.map(method => `
      <label class="shipping-method ${method.id === this.selectedShippingMethod ? 'selected' : ''}">
        <input type="radio" name="shippingMethod" value="${method.id}" ${method.id === this.selectedShippingMethod ? 'checked' : ''}>
        <div class="shipping-info">
          <div class="shipping-name">${method.name}</div>
          <div class="shipping-description">${method.description}</div>
        </div>
        <div class="shipping-price">${method.price === 0 ? 'FREE' : formatPrice(method.price)}</div>
      </label>
    `).join('');
  }

  renderOrderSummary() {
    const container = document.getElementById('order-items');
    if (!container) return;

    container.innerHTML = this.cart.map(item => `
      <div class="order-item">
        <div class="order-item-image">
          <img src="${item.image || 'https://via.placeholder.com/60x60?text=No+Image'}" alt="${item.name}">
        </div>
        <div class="order-item-details">
          <div class="order-item-name">${item.name}</div>
          <div class="order-item-meta">Qty: ${item.quantity}</div>
        </div>
        <div class="order-item-price">${formatPrice((item.price || 0) * (item.quantity || 1))}</div>
      </div>
    `).join('');
  }

  updateOrderSummary() {
    const subtotal = this.calculateSubtotal();
    const shippingCost = this.calculateShipping();
    const taxAmount = this.calculateTax(subtotal);
    const total = subtotal + shippingCost + taxAmount - this.discountAmount;

    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('shipping-cost').textContent = shippingCost === 0 ? 'FREE' : formatPrice(shippingCost);
    document.getElementById('tax-amount').textContent = formatPrice(taxAmount);
    document.getElementById('total-amount').textContent = formatPrice(total);

    if (this.discountAmount > 0) {
      document.getElementById('discount-amount').textContent = '-' + formatPrice(this.discountAmount);
      document.getElementById('discount-line').style.display = 'flex';
    } else {
      document.getElementById('discount-line').style.display = 'none';
    }
  }

  calculateSubtotal() {
    return this.cart.reduce((total, item) => {
      return total + ((item.price || 0) * (item.quantity || 1));
    }, 0);
  }

  calculateShipping() {
    const method = this.shippingMethods.find(m => m.id === this.selectedShippingMethod);
    const subtotal = this.calculateSubtotal();
    
    // Free shipping over $100
    if (subtotal >= 100) return 0;
    
    return method ? method.price : 0;
  }

  calculateTax(subtotal) {
    return subtotal * 0.08; // 8% tax
  }

  goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(el => {
      el.classList.remove('active');
    });

    // Show target step
    document.getElementById(`step-${step}`).classList.add('active');

    // Update progress bar
    document.querySelectorAll('.progress-step').forEach((el, index) => {
      el.classList.remove('active', 'completed');
      if (index + 1 < step) {
        el.classList.add('completed');
      } else if (index + 1 === step) {
        el.classList.add('active');
      }
    });

    this.currentStep = step;
  }

  async proceedToPayment() {
    if (!this.validateShippingForm()) {
      return;
    }

    this.collectShippingData();
    this.goToStep(2);

    // Pre-fill billing address if same as shipping
    if (document.getElementById('sameAsShipping').checked) {
      this.copyShippingToBilling();
    }
  }

  validateShippingForm() {
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];
    let isValid = true;

    requiredFields.forEach(fieldName => {
      const field = document.getElementById(fieldName);
      if (field && !this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name || field.id;
    
    // Clear previous errors
    this.clearError(fieldName);

    if (field.required && !value) {
      this.showError(fieldName, 'This field is required');
      return false;
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showError(fieldName, 'Please enter a valid email address');
        return false;
      }
    }

    // ZIP code validation
    if (fieldName === 'zipCode' && value) {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(value)) {
        this.showError(fieldName, 'Please enter a valid ZIP code');
        return false;
      }
    }

    // Phone validation
    if (fieldName === 'phone' && value) {
      const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
      if (!phoneRegex.test(value)) {
        this.showError(fieldName, 'Please enter a valid phone number');
        return false;
      }
    }

    return true;
  }

  collectShippingData() {
    const form = document.getElementById('shipping-form');
    const formData = new FormData(form);
    
    this.shippingData = {
      email: formData.get('email'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      address: formData.get('address'),
      apartment: formData.get('apartment'),
      city: formData.get('city'),
      state: formData.get('state'),
      zipCode: formData.get('zipCode'),
      phone: formData.get('phone'),
      shippingMethod: this.selectedShippingMethod,
      subscribe: formData.get('subscribe') === 'on'
    };
  }

  async completeOrder() {
    if (!this.validatePaymentForm()) {
      return;
    }

    try {
      this.collectPaymentData();
      
      const orderData = {
        items: this.cart,
        shipping: this.shippingData,
        payment: this.paymentData,
        subtotal: this.calculateSubtotal(),
        shippingCost: this.calculateShipping(),
        tax: this.calculateTax(this.calculateSubtotal()),
        discount: this.discountAmount,
        total: this.calculateSubtotal() + this.calculateShipping() + this.calculateTax(this.calculateSubtotal()) - this.discountAmount
      };

      // Show loading state
      const completeBtn = document.getElementById('complete-order');
      setLoading(completeBtn, true);

      // Create order
      const response = await api.createOrder(orderData);
      
      if (response.status === 'success') {
        this.orderData = response.data;
        this.showOrderConfirmation();
        
        // Clear cart
        if (window.app) {
          window.app.cart = [];
          window.app.updateCartUI();
        }
        
        // Clear local storage
        localStorage.removeItem('audioLootCart');
        
      } else {
        throw new Error(response.message || 'Order creation failed');
      }

    } catch (error) {
      console.error('Order creation error:', error);
      
      let errorMessage = 'Failed to create order. Please try again.';
      if (error.message.includes('Payment')) {
        errorMessage = 'Payment processing failed. Please check your payment details.';
      } else if (error.message.includes('Inventory')) {
        errorMessage = 'Some items are no longer available. Please review your cart.';
      }
      
      showError(errorMessage);
      
    } finally {
      const completeBtn = document.getElementById('complete-order');
      setLoading(completeBtn, false);
    }
  }

  validatePaymentForm() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    if (paymentMethod === 'card') {
      const requiredFields = ['cardNumber', 'expiry', 'cvv', 'cardName'];
      let isValid = true;

      requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field && !this.validatePaymentField(field)) {
          isValid = false;
        }
      });

      return isValid;
    }

    return true; // PayPal validation would be handled by PayPal SDK
  }

  validatePaymentField(field) {
    const value = field.value.trim();
    const fieldName = field.name || field.id;
    
    this.clearError(fieldName);

    if (!value) {
      this.showError(fieldName, 'This field is required');
      return false;
    }

    // Card number validation (simplified)
    if (fieldName === 'cardNumber') {
      const cleanNumber = value.replace(/\s/g, '');
      if (cleanNumber.length < 13 || cleanNumber.length > 19) {
        this.showError(fieldName, 'Please enter a valid card number');
        return false;
      }
    }

    // Expiry date validation
    if (fieldName === 'expiry') {
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(value)) {
        this.showError(fieldName, 'Please enter a valid expiry date (MM/YY)');
        return false;
      }
      
      // Check if not expired
      const [month, year] = value.split('/');
      const currentDate = new Date();
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
      
      if (expiryDate < currentDate) {
        this.showError(fieldName, 'Card has expired');
        return false;
      }
    }

    // CVV validation
    if (fieldName === 'cvv') {
      if (value.length < 3 || value.length > 4) {
        this.showError(fieldName, 'Please enter a valid CVV');
        return false;
      }
    }

    return true;
  }

  collectPaymentData() {
    const form = document.getElementById('payment-form');
    const formData = new FormData(form);
    
    this.paymentData = {
      method: formData.get('paymentMethod'),
      sameAsShipping: formData.get('sameAsShipping') === 'on'
    };

    if (this.paymentData.method === 'card') {
      this.paymentData.card = {
        number: formData.get('cardNumber'),
        expiry: formData.get('expiry'),
        cvv: formData.get('cvv'),
        name: formData.get('cardName')
      };
    }
  }

  showOrderConfirmation() {
    this.goToStep(3);
    
    // Update confirmation details
    document.getElementById('order-number').textContent = this.orderData.orderNumber || 'AL' + Date.now();
    document.getElementById('confirmation-email').textContent = this.shippingData.email;
    
    // Show success message
    showSuccess('Order placed successfully!');
  }

  handlePaymentMethodChange(method) {
    const cardDetails = document.getElementById('card-details');
    if (method === 'card') {
      cardDetails.style.display = 'block';
    } else {
      cardDetails.style.display = 'none';
    }
  }

  toggleBillingAddress(show) {
    const billingSection = document.getElementById('billing-address');
    if (show) {
      billingSection.style.display = 'block';
      // Add billing address fields
      billingSection.innerHTML = this.createBillingAddressFields();
    } else {
      billingSection.style.display = 'none';
    }
  }

  createBillingAddressFields() {
    return `
      <div class="form-row">
        <div class="form-group">
          <label for="billingFirstName" class="form-label">First Name</label>
          <input type="text" id="billingFirstName" name="billingFirstName" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="billingLastName" class="form-label">Last Name</label>
          <input type="text" id="billingLastName" name="billingLastName" class="form-input" required>
        </div>
      </div>
      <!-- Add more billing fields as needed -->
    `;
  }

  copyShippingToBilling() {
    // This would copy shipping address to billing address fields
    // Implementation depends on billing address field structure
  }

  async applyDiscountCode() {
    const codeInput = document.getElementById('discountCode');
    const code = codeInput.value.trim();
    
    if (!code) {
      showWarning('Please enter a discount code');
      return;
    }

    try {
      // Mock discount validation - replace with API call
      const discounts = {
        'SAVE10': { percent: 10, description: '10% off' },
        'WELCOME': { amount: 20, description: '$20 off' },
        'FREESHIP': { freeShipping: true, description: 'Free shipping' }
      };

      const discount = discounts[code.toUpperCase()];
      
      if (discount) {
        const subtotal = this.calculateSubtotal();
        
        if (discount.percent) {
          this.discountAmount = (subtotal * discount.percent) / 100;
        } else if (discount.amount) {
          this.discountAmount = Math.min(discount.amount, subtotal);
        } else if (discount.freeShipping) {
          // Handle free shipping discount
          this.discountAmount = this.calculateShipping();
        }
        
        this.discountCode = code;
        this.updateOrderSummary();
        showSuccess(`Discount applied: ${discount.description}`);
        
        // Disable the input and button
        codeInput.disabled = true;
        document.getElementById('apply-discount').disabled = true;
        
      } else {
        throw new Error('Invalid discount code');
      }

    } catch (error) {
      showError('Invalid discount code');
    }
  }

  formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    
    if (formattedValue.length > 19) {
      formattedValue = formattedValue.substring(0, 19);
    }
    
    input.value = formattedValue;
  }

  formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    input.value = value;
  }

  formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length >= 6) {
      value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6, 10)}`;
    } else if (value.length >= 3) {
      value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
    }
    
    input.value = value;
  }

  showError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const inputElement = document.getElementById(fieldName);
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('show');
    }
    
    if (inputElement) {
      inputElement.classList.add('error');
    }
  }

  clearError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const inputElement = document.getElementById(fieldName);
    
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('show');
    }
    
    if (inputElement) {
      inputElement.classList.remove('error');
    }
  }
}

// Initialize checkout page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.checkoutPage = new CheckoutPage();
});