// Admin Add Product JS
class AdminAddProduct {
  constructor() {
    this.form = document.getElementById('add-product-form');
    this.init();
  }

  init() {
    this.protectRoute();
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  protectRoute() {
    if (!api.isAuthenticated() || !api.isAdmin()) {
      api.clearAuth();
      window.location.href = 'admin-login.html';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this.form);
    // Basic validation
    if (!formData.get('name') || !formData.get('description') || !formData.get('price') || !formData.get('category') || !formData.get('brand') || !formData.get('stock')) {
      showError('Please fill in all required fields.');
      return;
    }
    try {
      // Prepare payload
      let response;
      // If image is present, use FormData and fetch directly
      if (formData.get('image') && formData.get('image').size > 0) {
        // Use fetch directly for multipart/form-data
        const token = api.getToken();
        response = await fetch('http://localhost:5001/api/products', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add product');
      } else {
        // No image, use api.createProduct (JSON)
        const productData = {
          name: formData.get('name'),
          description: formData.get('description'),
          price: parseFloat(formData.get('price')),
          category: formData.get('category'),
          brand: formData.get('brand'),
          stock: parseInt(formData.get('stock'), 10)
        };
        await api.createProduct(productData);
      }
      showSuccess('Product added successfully!');
      setTimeout(() => {
        window.location.href = 'admin-products.html';
      }, 1000);
    } catch (error) {
      showError(error.message || 'Failed to add product.');
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new AdminAddProduct();
}); 