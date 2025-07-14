// Admin Edit Product JS
class AdminEditProduct {
  constructor() {
    this.form = document.getElementById('edit-product-form');
    this.imagePreview = document.getElementById('current-image-preview');
    this.productId = this.getProductIdFromURL();
    this.init();
  }

  async init() {
    this.protectRoute();
    if (!this.productId) {
      showError('No product ID specified.');
      window.location.href = 'admin-products.html';
      return;
    }
    await this.loadProduct();
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  protectRoute() {
    if (!api.isAuthenticated() || !api.isAdmin()) {
      api.clearAuth();
      window.location.href = 'admin-login.html';
    }
  }

  getProductIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  async loadProduct() {
    try {
      const response = await api.getProduct(this.productId);
      const product = response.data?.product || response.product || response;
      // Fill form fields
      this.form.name.value = product.name || '';
      this.form.description.value = product.description || '';
      this.form.price.value = product.price || '';
      this.form.category.value = product.category || '';
      this.form.brand.value = product.brand || '';
      this.form.stock.value = product.countInStock ?? product.stock ?? '';
      // Show current image if available
      if (product.image || product.imageUrl) {
        this.imagePreview.innerHTML = `<img src="${product.image || product.imageUrl}" alt="Current Image" style="max-width:120px;max-height:120px;">`;
      } else {
        this.imagePreview.innerHTML = '';
      }
    } catch (error) {
      showError('Failed to load product.');
      window.location.href = 'admin-products.html';
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
      let response;
      // If image is present, use FormData and fetch directly
      if (formData.get('image') && formData.get('image').size > 0) {
        const token = api.getToken();
        response = await fetch(`http://localhost:5001/api/products/${this.productId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update product');
      } else {
        // No image, use api.updateProduct (JSON)
        const productData = {
          name: formData.get('name'),
          description: formData.get('description'),
          price: parseFloat(formData.get('price')),
          category: formData.get('category'),
          brand: formData.get('brand'),
          stock: parseInt(formData.get('stock'), 10)
        };
        await api.updateProduct(this.productId, productData);
      }
      showSuccess('Product updated successfully!');
      setTimeout(() => {
        window.location.href = 'admin-products.html';
      }, 1000);
    } catch (error) {
      showError(error.message || 'Failed to update product.');
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new AdminEditProduct();
}); 