// Products Page JavaScript
class ProductsPage {
  constructor() {
    this.products = [];
    this.filteredProducts = [];
    this.currentPage = 1;
    this.productsPerPage = 12;
    this.totalProducts = 0;
    this.isLoading = false;
    this.currentView = 'grid';
    this.filters = {
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      brand: '',
      rating: '',
      sort: 'featured'
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadInitialFilters();
    this.loadProducts();
  }

  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-products-btn');
    
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.filters.search = e.target.value;
        this.applyFilters();
      }, 500));
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.filters.search = searchInput.value;
        this.applyFilters();
      });
    }

    // Category filters
    const categoryInputs = document.querySelectorAll('input[name="category"]');
    categoryInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.filters.category = e.target.value;
        this.applyFilters();
      });
    });

    // Price filter
    const applyPriceBtn = document.getElementById('apply-price-filter');
    if (applyPriceBtn) {
      applyPriceBtn.addEventListener('click', () => {
        const minPrice = document.getElementById('min-price').value;
        const maxPrice = document.getElementById('max-price').value;
        this.filters.minPrice = minPrice;
        this.filters.maxPrice = maxPrice;
        this.applyFilters();
      });
    }

    // Rating filter
    const ratingInputs = document.querySelectorAll('input[name="rating"]');
    ratingInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.filters.rating = e.target.value;
        this.applyFilters();
      });
    });

    // Sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.filters.sort = e.target.value;
        this.applyFilters();
      });
    }

    // View toggle
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const view = btn.dataset.view;
        this.toggleView(view);
      });
    });

    // Load more
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMoreProducts();
      });
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    // Add to cart
    document.addEventListener('click', (e) => {
      if (e.target.matches('.add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.add-to-cart-btn');
        const productId = btn.dataset.productId;
        if (productId && window.app) {
          window.app.addToCart(productId);
        }
      }
    });

    // Wishlist
    document.addEventListener('click', (e) => {
      if (e.target.matches('.wishlist-btn') || e.target.closest('.wishlist-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.wishlist-btn');
        const productId = btn.dataset.productId;
        this.toggleWishlist(productId, btn);
      }
    });
  }

  loadInitialFilters() {
    // Load filters from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Set category from URL
    const category = urlParams.get('category');
    if (category) {
      this.filters.category = category;
      const categoryInput = document.querySelector(`input[name="category"][value="${category}"]`);
      if (categoryInput) {
        categoryInput.checked = true;
      }
    }

    // Set search from URL
    const search = urlParams.get('search');
    if (search) {
      this.filters.search = search;
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = search;
      }
    }
  }

  async loadProducts(reset = true) {
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      const container = document.getElementById('products-grid');
      
      if (reset) {
        this.currentPage = 1;
        container.innerHTML = this.createLoadingGrid();
      }

      // Build query parameters
      const params = {
        page: this.currentPage,
        limit: this.productsPerPage,
        ...this.filters
      };

      // Handle sort parameter - convert from "field-direction" to separate sort/order
      if (params.sort && params.sort.includes('-')) {
        const [sortField, sortOrder] = params.sort.split('-');
        params.sort = sortField;
        params.order = sortOrder;
      } else if (params.sort === 'featured') {
        params.featured = 'true';
        delete params.sort;
      }

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await api.getProducts(params);
      const data = response.data;

      if (reset) {
        this.products = data.products || [];
        this.filteredProducts = [...this.products];
      } else {
        const newProducts = data.products || [];
        this.products = [...this.products, ...newProducts];
        this.filteredProducts = [...this.filteredProducts, ...newProducts];
      }

      this.totalProducts = data.pagination?.totalProducts || data.total || 0;
      this.renderProducts(reset);
      this.updateProductsCount();
      this.updateLoadMoreButton();

      // Load brands for filter
      if (reset) {
        this.loadBrandFilters();
      }

    } catch (error) {
      console.error('Failed to load products:', error);
      const container = document.getElementById('products-grid');
      container.innerHTML = this.createErrorState();
    } finally {
      this.isLoading = false;
    }
  }

  async loadBrandFilters() {
    try {
      // Extract unique brands from products
      const brands = [...new Set(this.products.map(p => p.brand).filter(Boolean))].sort();
      
      const brandFilters = document.getElementById('brand-filters');
      if (brandFilters && brands.length > 0) {
        brandFilters.innerHTML = `
          <label class="filter-option">
            <input type="radio" name="brand" value="">
            <span class="checkmark"></span>
            All Brands
          </label>
          ${brands.map(brand => `
            <label class="filter-option">
              <input type="radio" name="brand" value="${brand}">
              <span class="checkmark"></span>
              ${brand}
            </label>
          `).join('')}
        `;

        // Add event listeners to new brand filters
        const brandInputs = brandFilters.querySelectorAll('input[name="brand"]');
        brandInputs.forEach(input => {
          input.addEventListener('change', (e) => {
            this.filters.brand = e.target.value;
            this.applyFilters();
          });
        });
      }
    } catch (error) {
      console.error('Failed to load brand filters:', error);
    }
  }

  applyFilters() {
    this.loadProducts(true);
  }

  loadMoreProducts() {
    if (this.products.length < this.totalProducts && !this.isLoading) {
      this.currentPage++;
      this.loadProducts(false);
    }
  }

  renderProducts(reset = true) {
    const container = document.getElementById('products-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (this.filteredProducts.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    container.style.display = 'grid';
    emptyState.style.display = 'none';

    if (reset) {
      container.innerHTML = '';
    }

    const newProductsHtml = this.filteredProducts
      .slice(reset ? 0 : this.filteredProducts.length - this.productsPerPage)
      .map(product => this.createProductCard(product))
      .join('');

    if (reset) {
      container.innerHTML = newProductsHtml;
    } else {
      container.insertAdjacentHTML('beforeend', newProductsHtml);
    }
  }

  createProductCard(product) {
    const mainImage = product.images?.[0]?.url || product.image || 'https://via.placeholder.com/300x300?text=No+Image';
    const rating = product.rating?.average || product.averageRating || 0;
    const reviewCount = product.rating?.count || product.reviewCount || 0;
    const isOnSale = product.originalPrice && product.originalPrice > product.price;
    const currentPrice = product.price;
    const originalPrice = product.originalPrice;

    if (this.currentView === 'list') {
      return this.createProductListItem(product);
    }

    return `
      <div class="product-card card">
        <div class="product-image-container">
          <img src="${mainImage}" alt="${product.name}" class="product-image">
          ${isOnSale ? '<div class="sale-badge">Sale</div>' : ''}
          ${(product.isFeatured || product.featured) ? '<div class="featured-badge">Featured</div>' : ''}
          
          <div class="product-actions">
            <button class="action-btn wishlist-btn" data-product-id="${product._id}" aria-label="Add to wishlist">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </button>
            <a href="product.html?id=${product._id}" class="action-btn view-btn" aria-label="View product">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </a>
          </div>
        </div>
        
        <div class="product-info">
          <div class="product-category">${product.category}</div>
          <h3 class="product-name">
            <a href="product.html?id=${product._id}">${product.name}</a>
          </h3>
          <div class="product-rating">
            <div class="stars">${generateStars(rating)}</div>
            <span class="rating-text">${rating.toFixed(1)} (${reviewCount})</span>
          </div>
          <div class="product-price">
            ${isOnSale ? 
              `<span class="sale-price">${formatPrice(currentPrice)}</span>
               <span class="original-price">${formatPrice(originalPrice)}</span>` :
              `<span class="current-price">${formatPrice(currentPrice)}</span>`
            }
          </div>
          <button class="btn btn-primary add-to-cart-btn" data-product-id="${product._id}">
            Add to Cart
          </button>
        </div>
      </div>
    `;
  }

  createProductListItem(product) {
    const mainImage = product.images?.[0]?.url || product.image || 'https://via.placeholder.com/150x150?text=No+Image';
    const rating = product.rating?.average || product.averageRating || 0;
    const reviewCount = product.rating?.count || product.reviewCount || 0;
    const isOnSale = product.originalPrice && product.originalPrice > product.price;
    const currentPrice = product.price;
    const originalPrice = product.originalPrice;

    return `
      <div class="product-list-item card">
        <div class="product-list-image">
          <img src="${mainImage}" alt="${product.name}">
          ${isOnSale ? '<div class="sale-badge">Sale</div>' : ''}
          ${(product.isFeatured || product.featured) ? '<div class="featured-badge">Featured</div>' : ''}
        </div>
        
        <div class="product-list-content">
          <div class="product-list-main">
            <div class="product-category">${product.category}</div>
            <h3 class="product-name">
              <a href="product.html?id=${product._id}">${product.name}</a>
            </h3>
            <div class="product-rating">
              <div class="stars">${generateStars(rating)}</div>
              <span class="rating-text">${rating.toFixed(1)} (${reviewCount})</span>
            </div>
            <p class="product-description">${product.description ? product.description.substring(0, 150) + '...' : ''}</p>
          </div>
          
          <div class="product-list-actions">
            <div class="product-price">
              ${isOnSale ? 
                `<span class="sale-price">${formatPrice(currentPrice)}</span>
                 <span class="original-price">${formatPrice(originalPrice)}</span>` :
                `<span class="current-price">${formatPrice(currentPrice)}</span>`
              }
            </div>
            <div class="product-buttons">
              <button class="action-btn wishlist-btn" data-product-id="${product._id}" aria-label="Add to wishlist">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
              <a href="product.html?id=${product._id}" class="btn btn-outline btn-sm">View</a>
              <button class="btn btn-primary btn-sm add-to-cart-btn" data-product-id="${product._id}">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createLoadingGrid() {
    return Array(this.productsPerPage).fill(0).map(() => `
      <div class="product-card card loading-card">
        <div class="loading-image"></div>
        <div class="loading-content">
          <div class="loading-line short"></div>
          <div class="loading-line medium"></div>
          <div class="loading-line long"></div>
          <div class="loading-line short"></div>
        </div>
      </div>
    `).join('');
  }

  createErrorState() {
    return `
      <div class="error-state">
        <div class="error-icon">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3>Failed to Load Products</h3>
        <p>Unable to load products. Please try again later.</p>
        <button class="btn btn-outline" onclick="productsPage.loadProducts()">
          Try Again
        </button>
      </div>
    `;
  }

  toggleView(view) {
    this.currentView = view;
    
    // Update button states
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update grid class
    const container = document.getElementById('products-grid');
    container.className = `products-grid ${view}-view`;

    // Re-render products
    this.renderProducts(true);
  }

  updateProductsCount() {
    const countElement = document.getElementById('products-count');
    if (countElement) {
      if (this.totalProducts === 0) {
        countElement.textContent = 'No products found';
      } else if (this.totalProducts === 1) {
        countElement.textContent = '1 product';
      } else {
        const showing = Math.min(this.products.length, this.totalProducts);
        countElement.textContent = `Showing ${showing} of ${this.totalProducts} products`;
      }
    }
  }

  updateLoadMoreButton() {
    const container = document.getElementById('load-more-container');
    const btn = document.getElementById('load-more-btn');
    
    if (this.products.length >= this.totalProducts) {
      container.style.display = 'none';
    } else {
      container.style.display = 'block';
      if (btn) {
        btn.textContent = this.isLoading ? 'Loading...' : 'Load More Products';
        btn.disabled = this.isLoading;
      }
    }
  }

  clearFilters() {
    // Reset filters
    this.filters = {
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      brand: '',
      rating: '',
      sort: 'featured'
    };

    // Reset form elements
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const minPriceInput = document.getElementById('min-price');
    if (minPriceInput) minPriceInput.value = '';

    const maxPriceInput = document.getElementById('max-price');
    if (maxPriceInput) maxPriceInput.value = '';

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'featured';

    // Reset radio buttons
    const categoryInputs = document.querySelectorAll('input[name="category"]');
    categoryInputs.forEach(input => {
      input.checked = input.value === '';
    });

    const brandInputs = document.querySelectorAll('input[name="brand"]');
    brandInputs.forEach(input => {
      input.checked = input.value === '';
    });

    const ratingInputs = document.querySelectorAll('input[name="rating"]');
    ratingInputs.forEach(input => {
      input.checked = input.value === '';
    });

    // Apply filters
    this.applyFilters();
  }

  async toggleWishlist(productId, button) {
    if (!api.isAuthenticated()) {
      showWarning('Please log in to add items to your wishlist');
      window.app.redirectToLogin();
      return;
    }

    try {
      setLoading(button, true);
      
      const isWishlisted = button.classList.contains('active');
      
      if (isWishlisted) {
        await api.removeFromWishlist(productId);
        button.classList.remove('active');
        showSuccess('Removed from wishlist');
      } else {
        await api.addToWishlist(productId);
        button.classList.add('active');
        showSuccess('Added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      showError('Failed to update wishlist');
    } finally {
      setLoading(button, false);
    }
  }
}

// Initialize products page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.productsPage = new ProductsPage();
});