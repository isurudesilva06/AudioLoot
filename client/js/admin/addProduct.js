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
      let images = [];
      const imageFiles = this.form.querySelector('input[name="image"]').files;
      if (imageFiles && imageFiles.length > 0) {
        const cloudName = 'dnqpkxxm3';
        const uploadPreset = 'AudioLoot-unsigned';
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        for (let i = 0; i < imageFiles.length; i++) {
          const uploadData = new FormData();
          uploadData.append('file', imageFiles[i]);
          uploadData.append('upload_preset', uploadPreset);
          const uploadRes = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: uploadData
          });
          const uploadResult = await uploadRes.json();
          if (uploadResult.secure_url) {
            images.push({
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              alt: imageFiles[i].name || ''
            });
          } else {
            showError('Image upload failed.');
            return;
          }
        }
      } else {
        // No image selected, use a placeholder
        images.push({ url: 'https://via.placeholder.com/300x300?text=No+Image', publicId: 'placeholder', alt: 'No image' });
      }
      // Prepare product data with images array
      const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        category: formData.get('category'),
        brand: formData.get('brand'),
        stock: parseInt(formData.get('stock'), 10),
        images: images
      };
      await api.createProduct(productData);
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