// Product Detail Page JavaScript
class ProductPage {
  constructor() {
    this.productId = null;
    this.product = null;
    this.currentImageIndex = 0;
    this.quantity = 1;
    this.selectedTab = 'description';
    this.reviewRating = 0;
    
    this.init();
  }

  init() {
    this.getProductIdFromUrl();
    this.setupEventListeners();
    
    if (this.productId) {
      this.loadProduct();
    } else {
      this.showError();
    }
  }

  getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    this.productId = urlParams.get('id');
  }

  setupEventListeners() {
    // Quantity controls
    document.addEventListener('click', (e) => {
      if (e.target.matches('.quantity-btn')) {
        e.preventDefault();
        const isIncrement = e.target.textContent === '+';
        this.updateQuantity(isIncrement);
      }
    });

    // Add to cart
    document.addEventListener('click', (e) => {
      if (e.target.matches('.add-to-cart-main') || e.target.closest('.add-to-cart-main')) {
        e.preventDefault();
        this.addToCart();
      }
    });

    // Wishlist toggle
    document.addEventListener('click', (e) => {
      if (e.target.matches('.wishlist-main') || e.target.closest('.wishlist-main')) {
        e.preventDefault();
        this.toggleWishlist();
      }
    });

    // Image gallery
    document.addEventListener('click', (e) => {
      if (e.target.matches('.thumbnail img') || e.target.closest('.thumbnail')) {
        e.preventDefault();
        const thumbnail = e.target.closest('.thumbnail');
        const index = parseInt(thumbnail.dataset.index);
        this.changeMainImage(index);
      }
    });

    // Tab navigation
    document.addEventListener('click', (e) => {
      if (e.target.matches('.tab-btn')) {
        e.preventDefault();
        const tab = e.target.dataset.tab;
        this.switchTab(tab);
      }
    });

    // Review modal
    document.addEventListener('click', (e) => {
      if (e.target.matches('.write-review-btn')) {
        e.preventDefault();
        this.openReviewModal();
      }
      
      if (e.target.matches('.modal-close') || e.target.matches('#close-review-modal') || e.target.matches('#cancel-review')) {
        e.preventDefault();
        this.closeReviewModal();
      }
      
      if (e.target.matches('.modal-overlay')) {
        this.closeReviewModal();
      }
    });

    // Review rating
    document.addEventListener('click', (e) => {
      if (e.target.matches('.star-btn')) {
        e.preventDefault();
        const rating = parseInt(e.target.dataset.rating);
        this.setReviewRating(rating);
      }
    });

    // Review form submission
    document.addEventListener('submit', (e) => {
      if (e.target.matches('#review-form')) {
        e.preventDefault();
        this.submitReview();
      }
    });

    // Quantity input change
    document.addEventListener('change', (e) => {
      if (e.target.matches('.quantity-input')) {
        const value = parseInt(e.target.value) || 1;
        this.quantity = Math.max(1, Math.min(value, 99));
        e.target.value = this.quantity;
      }
    });

    // Image zoom
    document.addEventListener('click', (e) => {
      if (e.target.matches('.main-image')) {
        this.zoomImage();
      }
    });
  }

  async loadProduct() {
    try {
      this.showLoading();
      
      const response = await api.getProduct(this.productId);
      this.product = response.data;
      
      this.renderProduct();
      this.updatePageMeta();
      this.loadRelatedProducts();
      this.loadReviews();
      
    } catch (error) {
      console.error('Failed to load product:', error);
      this.showError();
    }
  }

  renderProduct() {
    if (!this.product) return;

    const content = document.getElementById('product-content');
    const isOnSale = this.product.salePrice && this.product.salePrice < this.product.price;
    const currentPrice = isOnSale ? this.product.salePrice : this.product.price;
    const discountPercent = isOnSale ? Math.round(((this.product.price - this.product.salePrice) / this.product.price) * 100) : 0;
    
    content.innerHTML = `
      <div class="product-layout">
        <!-- Product Gallery -->
        <div class="product-gallery">
          <div class="main-image-container">
            <img src="${this.getMainImage()}" alt="${this.product.name}" class="main-image" id="main-image">
            
            ${isOnSale ? '<div class="product-badges"><div class="sale-badge">Sale</div></div>' : ''}
            ${this.product.featured ? '<div class="product-badges"><div class="featured-badge">Featured</div></div>' : ''}
            
            <div class="image-zoom-overlay">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              Click to zoom
            </div>
          </div>
          
          ${this.renderThumbnailGallery()}
        </div>

        <!-- Product Info -->
        <div class="product-info">
          <div class="product-brand">${this.product.brand || 'AudioLoot'}</div>
          <h1 class="product-title">${this.product.name}</h1>
          
          <div class="product-rating-section">
            <div class="product-rating">
              <div class="stars">${generateStars(this.product.averageRating || 0)}</div>
              <span class="rating-text">${(this.product.averageRating || 0).toFixed(1)}</span>
            </div>
            <a href="#reviews" class="rating-link" onclick="productPage.switchTab('reviews')">
              (${this.product.reviewCount || 0} reviews)
            </a>
          </div>

          <div class="product-price-section">
            <div class="price-container">
              <span class="current-price">${formatPrice(currentPrice)}</span>
              ${isOnSale ? `<span class="original-price">${formatPrice(this.product.price)}</span>` : ''}
              ${isOnSale ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
            </div>
            <div class="stock-status">
              <div class="stock-indicator ${this.getStockClass()}"></div>
              <span>${this.getStockText()}</span>
            </div>
          </div>

          <div class="product-description">
            <p>${this.product.description || 'No description available.'}</p>
          </div>

          <div class="product-actions">
            <div class="quantity-container">
              <label for="quantity">Quantity:</label>
              <div class="quantity-controls">
                <button type="button" class="quantity-btn">-</button>
                <input type="number" id="quantity" class="quantity-input" value="${this.quantity}" min="1" max="99">
                <button type="button" class="quantity-btn">+</button>
              </div>
            </div>

            <div class="action-buttons">
              <button class="btn btn-primary btn-lg add-to-cart-main" ${this.product.stock <= 0 ? 'disabled' : ''}>
                ${this.product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button class="btn btn-outline wishlist-main" aria-label="Add to wishlist">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
            </div>
          </div>

          ${this.renderProductFeatures()}
        </div>
      </div>

      ${this.renderProductTabs()}
    `;

    this.hideLoading();
    content.style.display = 'block';
    this.updateBreadcrumb();
  }

  renderThumbnailGallery() {
    const images = this.product.images || [{ url: this.getMainImage() }];
    
    if (images.length <= 1) return '';

    return `
      <div class="thumbnail-gallery">
        ${images.map((image, index) => `
          <div class="thumbnail ${index === this.currentImageIndex ? 'active' : ''}" data-index="${index}">
            <img src="${image.url || image}" alt="${this.product.name}">
          </div>
        `).join('')}
      </div>
    `;
  }

  renderProductFeatures() {
    const features = this.product.features || [
      'Premium Quality Audio',
      'Comfortable Design',
      'Durable Construction',
      '30-Day Return Policy'
    ];

    return `
      <div class="product-features">
        <h3>Key Features</h3>
        <div class="features-list">
          ${features.map(feature => `
            <div class="feature-item">
              <div class="feature-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span>${feature}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderProductTabs() {
    return `
      <div class="product-tabs">
        <div class="tab-buttons">
          <button class="tab-btn ${this.selectedTab === 'description' ? 'active' : ''}" data-tab="description">
            Description
          </button>
          <button class="tab-btn ${this.selectedTab === 'specifications' ? 'active' : ''}" data-tab="specifications">
            Specifications
          </button>
          <button class="tab-btn ${this.selectedTab === 'reviews' ? 'active' : ''}" data-tab="reviews">
            Reviews (${this.product.reviewCount || 0})
          </button>
        </div>

        <div class="tab-content ${this.selectedTab === 'description' ? 'active' : ''}" id="description-tab">
          <div class="description-content">
            <p>${this.product.fullDescription || this.product.description || 'No detailed description available.'}</p>
          </div>
        </div>

        <div class="tab-content ${this.selectedTab === 'specifications' ? 'active' : ''}" id="specifications-tab">
          ${this.renderSpecifications()}
        </div>

        <div class="tab-content ${this.selectedTab === 'reviews' ? 'active' : ''}" id="reviews-tab">
          <div id="reviews-content">
            <div class="reviews-header">
              <div class="reviews-summary">
                <div class="rating-overview">
                  <div class="rating-score">${(this.product.averageRating || 0).toFixed(1)}</div>
                  <div class="stars">${generateStars(this.product.averageRating || 0)}</div>
                  <div class="text-sm text-secondary">${this.product.reviewCount || 0} reviews</div>
                </div>
                ${this.renderRatingDistribution()}
              </div>
              <button class="btn btn-primary write-review-btn">Write a Review</button>
            </div>
            <div id="reviews-list">
              <!-- Reviews will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSpecifications() {
    const specs = this.product.specifications || {
      'Brand': this.product.brand || 'AudioLoot',
      'Category': this.product.category || 'Audio Equipment',
      'Model': this.product.name,
      'Warranty': '1 Year Limited Warranty'
    };

    return `
      <div class="specifications-table">
        <table class="table">
          <tbody>
            ${Object.entries(specs).map(([key, value]) => `
              <tr>
                <td class="spec-label">${key}</td>
                <td class="spec-value">${value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderRatingDistribution() {
    const distribution = this.product.ratingDistribution || [0, 0, 0, 0, 0];
    const total = distribution.reduce((sum, count) => sum + count, 0);

    return `
      <div class="rating-distribution">
        ${[5, 4, 3, 2, 1].map(rating => {
          const count = distribution[rating - 1] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return `
            <div class="rating-bar">
              <span>${rating} star</span>
              <div class="bar-container">
                <div class="bar-fill" style="width: ${percentage}%"></div>
              </div>
              <span class="text-sm">${count}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  getMainImage() {
    if (this.product.images && this.product.images.length > 0) {
      return this.product.images[this.currentImageIndex]?.url || this.product.images[0]?.url || this.product.images[0];
    }
    return this.product.image || 'https://via.placeholder.com/600x600?text=No+Image';
  }

  getStockClass() {
    if (this.product.stock <= 0) return 'out-of-stock';
    if (this.product.stock <= 5) return 'low-stock';
    return 'in-stock';
  }

  getStockText() {
    if (this.product.stock <= 0) return 'Out of stock';
    if (this.product.stock <= 5) return `Only ${this.product.stock} left in stock`;
    return 'In stock';
  }

  updatePageMeta() {
    document.title = `${this.product.name} - AudioLoot`;
    document.getElementById('page-title').textContent = `${this.product.name} - AudioLoot`;
    document.getElementById('page-description').setAttribute('content', 
      this.product.description || `Buy ${this.product.name} at AudioLoot. Premium audio equipment with fast shipping.`
    );
  }

  updateBreadcrumb() {
    document.getElementById('breadcrumb-category').textContent = this.product.category || 'Products';
    document.getElementById('breadcrumb-product').textContent = this.product.name;
  }

  changeMainImage(index) {
    this.currentImageIndex = index;
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
      mainImage.src = this.getMainImage();
    }

    // Update thumbnail active state
    document.querySelectorAll('.thumbnail').forEach((thumbnail, i) => {
      thumbnail.classList.toggle('active', i === index);
    });
  }

  updateQuantity(increment) {
    if (increment) {
      this.quantity = Math.min(this.quantity + 1, 99);
    } else {
      this.quantity = Math.max(this.quantity - 1, 1);
    }
    
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
      quantityInput.value = this.quantity;
    }
  }

  async addToCart() {
    if (!this.product || this.product.stock <= 0) return;

    try {
      if (window.app) {
        await window.app.addToCart(this.productId, this.quantity);
        showSuccess(`Added ${this.quantity} ${this.product.name} to cart`);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showError('Failed to add item to cart');
    }
  }

  async toggleWishlist() {
    if (!api.isAuthenticated()) {
      showWarning('Please log in to add items to your wishlist');
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    try {
      const wishlistBtn = document.querySelector('.wishlist-main');
      const isWishlisted = wishlistBtn.classList.contains('active');
      
      setLoading(wishlistBtn, true);
      
      if (isWishlisted) {
        await api.removeFromWishlist(this.productId);
        wishlistBtn.classList.remove('active');
        showSuccess('Removed from wishlist');
      } else {
        await api.addToWishlist(this.productId);
        wishlistBtn.classList.add('active');
        showSuccess('Added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      showError('Failed to update wishlist');
    } finally {
      const wishlistBtn = document.querySelector('.wishlist-main');
      setLoading(wishlistBtn, false);
    }
  }

  switchTab(tab) {
    this.selectedTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tab}-tab`);
    });

    // Load reviews if switching to reviews tab
    if (tab === 'reviews' && !document.querySelector('#reviews-list .review-item')) {
      this.loadReviews();
    }
  }

  async loadReviews() {
    try {
      const response = await api.getProductReviews(this.productId);
      const reviews = response.data || [];
      
      const reviewsList = document.getElementById('reviews-list');
      if (!reviewsList) return;

      if (reviews.length === 0) {
        reviewsList.innerHTML = `
          <div class="empty-state">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        `;
        return;
      }

      reviewsList.innerHTML = reviews.map(review => this.renderReview(review)).join('');
      
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  }

  renderReview(review) {
    const reviewDate = new Date(review.createdAt).toLocaleDateString();
    const initials = review.user.name.split(' ').map(n => n[0]).join('').toUpperCase();

    return `
      <div class="review-item">
        <div class="review-header">
          <div class="reviewer-info">
            <div class="reviewer-avatar">${initials}</div>
            <div class="reviewer-details">
              <h4>${review.user.name}</h4>
              <div class="review-date">${reviewDate}</div>
            </div>
          </div>
          <div class="stars">${generateStars(review.rating)}</div>
        </div>
        
        ${review.title ? `<div class="review-title">${review.title}</div>` : ''}
        <div class="review-content">${review.comment}</div>
      </div>
    `;
  }

  async loadRelatedProducts() {
    try {
      const response = await api.getProducts({
        category: this.product.category,
        limit: 4,
        exclude: this.productId
      });
      
      const relatedProducts = response.data?.products || [];
      
      if (relatedProducts.length > 0) {
        this.renderRelatedProducts(relatedProducts);
      }
    } catch (error) {
      console.error('Failed to load related products:', error);
    }
  }

  renderRelatedProducts(products) {
    const section = document.getElementById('related-products-section');
    const grid = document.getElementById('related-products-grid');
    
    grid.innerHTML = products.map(product => this.createRelatedProductCard(product)).join('');
    section.style.display = 'block';
  }

  createRelatedProductCard(product) {
    const image = product.images?.[0]?.url || product.image || 'https://via.placeholder.com/300x300?text=No+Image';
    const isOnSale = product.salePrice && product.salePrice < product.price;
    const currentPrice = isOnSale ? product.salePrice : product.price;

    return `
      <div class="product-card card">
        <div class="product-image-container">
          <img src="${image}" alt="${product.name}" class="product-image">
          ${isOnSale ? '<div class="sale-badge">Sale</div>' : ''}
        </div>
        
        <div class="product-info">
          <div class="product-category">${product.category}</div>
          <h3 class="product-name">
            <a href="product.html?id=${product._id}">${product.name}</a>
          </h3>
          <div class="product-rating">
            <div class="stars">${generateStars(product.averageRating || 0)}</div>
            <span class="rating-text">${(product.averageRating || 0).toFixed(1)}</span>
          </div>
          <div class="product-price">
            <span class="current-price">${formatPrice(currentPrice)}</span>
            ${isOnSale ? `<span class="original-price">${formatPrice(product.price)}</span>` : ''}
          </div>
          <button class="btn btn-primary add-to-cart-btn" data-product-id="${product._id}">
            Add to Cart
          </button>
        </div>
      </div>
    `;
  }

  openReviewModal() {
    if (!api.isAuthenticated()) {
      showWarning('Please log in to write a review');
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    const modal = document.getElementById('review-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  closeReviewModal() {
    const modal = document.getElementById('review-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    
    // Reset form
    document.getElementById('review-form').reset();
    this.setReviewRating(0);
  }

  setReviewRating(rating) {
    this.reviewRating = rating;
    document.getElementById('rating-value').value = rating;
    
    document.querySelectorAll('.star-btn').forEach((star, index) => {
      star.classList.toggle('active', index < rating);
    });
  }

  async submitReview() {
    const form = document.getElementById('review-form');
    const formData = new FormData(form);
    
    if (this.reviewRating === 0) {
      showError('Please select a rating');
      return;
    }

    try {
      const reviewData = {
        rating: this.reviewRating,
        title: formData.get('title'),
        comment: formData.get('comment')
      };

      await api.addProductReview(this.productId, reviewData);
      showSuccess('Review submitted successfully!');
      
      this.closeReviewModal();
      this.loadReviews();
      this.loadProduct(); // Refresh to update rating
      
    } catch (error) {
      console.error('Failed to submit review:', error);
      showError('Failed to submit review. Please try again.');
    }
  }

  zoomImage() {
    // TODO: Implement image zoom functionality
    showWarning('Image zoom functionality coming soon!');
  }

  showLoading() {
    document.getElementById('product-loading').style.display = 'block';
    document.getElementById('product-content').style.display = 'none';
    document.getElementById('product-error').style.display = 'none';
  }

  hideLoading() {
    document.getElementById('product-loading').style.display = 'none';
  }

  showError() {
    document.getElementById('product-loading').style.display = 'none';
    document.getElementById('product-content').style.display = 'none';
    document.getElementById('product-error').style.display = 'block';
  }
}

// Initialize product page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.productPage = new ProductPage();
});