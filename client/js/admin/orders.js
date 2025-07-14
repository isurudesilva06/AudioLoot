// Admin Orders Management JS
class AdminOrders {
  constructor() {
    this.tableBody = document.getElementById('orders-table-body');
    this.statusOptions = [
      'Pending',
      'Processing',
      'Shipped',
      'Delivered',
      'Cancelled'
    ];
    this.init();
  }

  async init() {
    this.protectRoute();
    await this.loadOrders();
    this.setupTableActions();
  }

  protectRoute() {
    if (!api.isAuthenticated() || !api.isAdmin()) {
      api.clearAuth();
      window.location.href = 'admin-login.html';
    }
  }

  async loadOrders() {
    try {
      this.tableBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
      const response = await api.getOrders();
      const orders = response.data?.orders || response.orders || [];
      if (!orders.length) {
        this.tableBody.innerHTML = '<tr><td colspan="6">No orders found.</td></tr>';
        return;
      }
      this.tableBody.innerHTML = '';
      for (const order of orders) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${order._id}</td>
          <td>${order.user?.name || order.customerName || ''}<br><small>${order.user?.email || order.customerEmail || ''}</small></td>
          <td>
            <select class="order-status-select" data-id="${order._id}">
              ${this.statusOptions.map(status => `<option value="${status}"${order.status === status ? ' selected' : ''}>${status}</option>`).join('')}
            </select>
          </td>
          <td>${window.formatPrice ? window.formatPrice(order.totalPrice) : order.totalPrice}</td>
          <td>${window.formatDate ? window.formatDate(order.createdAt) : order.createdAt}</td>
          <td>
            <button class="admin-btn update-status-btn" data-id="${order._id}">Update</button>
          </td>
        `;
        this.tableBody.appendChild(row);
      }
    } catch (error) {
      this.tableBody.innerHTML = '<tr><td colspan="6">Failed to load orders.</td></tr>';
      showError('Failed to load orders.');
    }
  }

  setupTableActions() {
    this.tableBody.addEventListener('click', async (e) => {
      if (e.target.classList.contains('update-status-btn')) {
        const orderId = e.target.getAttribute('data-id');
        const select = this.tableBody.querySelector(`select[data-id='${orderId}']`);
        const newStatus = select.value;
        try {
          await api.put(`/orders/${orderId}/status`, { status: newStatus });
          showSuccess('Order status updated.');
          await this.loadOrders();
        } catch (err) {
          showError('Failed to update order status.');
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new AdminOrders();
}); 