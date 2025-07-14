// Admin Products Management JS
class AdminProducts {
  constructor() {
    this.tableBody = document.getElementById('products-table-body');
    this.init();
  }

  async init() {
    this.protectRoute();
    await this.loadProducts();
    this.setupTableActions();
  }

  protectRoute() {
    if (!api.isAuthenticated() || !api.isAdmin()) {
      api.clearAuth();
      window.location.href = 'admin-login.html';
    }
  }

  async loadProducts() {
    try {
      this.tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
      const response = await api.getProducts();
      const products = response.data.products || response.products || [];
      if (!products.length) {
        this.tableBody.innerHTML = '<tr><td colspan="5">No products found.</td></tr>';
        return;
      }
      this.tableBody.innerHTML = '';
      for (const product of products) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${product.name}</td>
          <td>${window.formatPrice ? window.formatPrice(product.price) : product.price}</td>
          <td>${product.category || ''}</td>
          <td>${product.countInStock ?? product.stock ?? ''}</td>
          <td>
            <a href="edit-product.html?id=${product._id}" class="admin-btn edit-btn">Edit</a>
            <button class="admin-btn delete-btn" data-id="${product._id}">Delete</button>
          </td>
        `;
        this.tableBody.appendChild(row);
      }
    } catch (error) {
      this.tableBody.innerHTML = '<tr><td colspan="5">Failed to load products.</td></tr>';
      showError('Failed to load products.');
    }
  }

  setupTableActions() {
    this.tableBody.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const productId = e.target.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this product?')) {
          try {
            await api.deleteProduct(productId);
            showSuccess('Product deleted.');
            await this.loadProducts();
          } catch (err) {
            showError('Failed to delete product.');
          }
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new AdminProducts();
}); 