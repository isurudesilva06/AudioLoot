// Admin Dashboard JS
class AdminDashboard {
  constructor() {
    this.logoutBtn = document.getElementById('admin-logout-btn');
    this.sidebarLogout = document.getElementById('sidebar-logout-link');
    this.init();
  }

  init() {
    this.protectRoute();
    this.setupLogout();
  }

  protectRoute() {
    if (!api.isAuthenticated() || !api.isAdmin()) {
      api.clearAuth();
      window.location.href = 'admin-login.html';
    }
  }

  setupLogout() {
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        api.clearAuth();
        window.location.href = 'admin-login.html';
      });
    }
    if (this.sidebarLogout) {
      this.sidebarLogout.addEventListener('click', (e) => {
        e.preventDefault();
        api.clearAuth();
        window.location.href = 'admin-login.html';
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  new AdminDashboard();
}); 