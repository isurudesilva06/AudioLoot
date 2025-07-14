// Home Page JavaScript
class HomePage {
  constructor() {
    this.init();
  }

  init() {
    this.loadFeaturedProducts();
    this.loadCategories();
    this.loadBestSellers();
    this.loadTestimonials();
    this.setupEventListeners();
    this.setupTestimonialCarousel();
  }

  setupEventListeners() {
    // Search functionality
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', this.handleSearch.bind(this));
    }

    // Add to cart buttons
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

    // Wishlist buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.wishlist-btn') || e.target.closest('.wishlist-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.wishlist-btn');
        const productId = btn.dataset.productId;
        this.toggleWishlist(productId, btn);
      }
    });

    // Newsletter form
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', this.handleNewsletterSignup.bind(this));
    }
  }

  async loadFeaturedProducts() {
    const container = document.getElementById('featured-products-grid');
    if (!container) return;

    try {
      // Show loading state
      container.innerHTML = this.createLoadingGrid();

      // Fetch featured products
      const response = await api.getFeaturedProducts(6);
      const products = response.data?.products || [];

      if (products.length === 0) {
        container.innerHTML = this.createEmptyState();
        return;
      }

      // Render products
      const productCards = products.map(product => this.createProductCard(product)).join('');
      container.innerHTML = productCards;
      
      // Manually ensure visibility for dynamically loaded content
      setTimeout(() => {
        const cards = container.querySelectorAll('.product-card');
        cards.forEach(card => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
      }, 100);

    } catch (error) {
      console.error('Failed to load featured products:', error);
      container.innerHTML = this.createErrorState();
    }
  }

  createProductCard(product) {
    const mainImage = product.images?.[0]?.url || product.image || 'https://via.placeholder.com/300x300?text=No+Image';
    const rating = product.rating?.average || product.averageRating || 0;
    const reviewCount = product.rating?.count || product.reviewCount || 0;
    const isOnSale = product.originalPrice && product.originalPrice > product.price;
    const currentPrice = product.price;
    const originalPrice = product.originalPrice;

    return `
      <div class="product-card glass-card product-card-enhanced">
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

  createLoadingGrid() {
    return Array(6).fill(0).map(() => `
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

  createEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
        </div>
        <h3>No Featured Products</h3>
        <p>Check back later for our featured product selection.</p>
      </div>
    `;
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
        <p>Unable to load featured products. Please try again later.</p>
        <button class="btn btn-outline" onclick="homePage.loadFeaturedProducts()">
          Try Again
        </button>
      </div>
    `;
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

  handleSearch() {
    // Create a modern search modal instead of prompt
    this.createSearchModal();
  }

  createSearchModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('search-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create search modal
    const modal = document.createElement('div');
    modal.id = 'search-modal';
    modal.className = 'search-modal glass';
    modal.innerHTML = `
      <div class="search-modal-content">
        <div class="search-modal-header">
          <h3>Search Products</h3>
          <button class="search-modal-close" aria-label="Close search">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="search-modal-body">
          <div class="search-input-container">
            <input type="text" id="search-modal-input" class="search-modal-input" placeholder="Search for headphones, speakers, earbuds..." autofocus>
            <button class="search-modal-btn" id="search-modal-btn">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
          <div class="search-suggestions">
            <div class="suggestion-category">
              <h4>Popular Categories</h4>
              <div class="suggestion-items">
                <button class="suggestion-item" data-search="headphones">Headphones</button>
                <button class="suggestion-item" data-search="speakers">Speakers</button>
                <button class="suggestion-item" data-search="earbuds">Earbuds</button>
                <button class="suggestion-item" data-search="wireless">Wireless</button>
              </div>
            </div>
            <div class="suggestion-category">
              <h4>Popular Brands</h4>
              <div class="suggestion-items">
                <button class="suggestion-item" data-search="Sony">Sony</button>
                <button class="suggestion-item" data-search="Bose">Bose</button>
                <button class="suggestion-item" data-search="Apple">Apple</button>
                <button class="suggestion-item" data-search="Sennheiser">Sennheiser</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    const searchInput = modal.querySelector('#search-modal-input');
    const searchBtn = modal.querySelector('#search-modal-btn');
    const closeBtn = modal.querySelector('.search-modal-close');
    const suggestionItems = modal.querySelectorAll('.suggestion-item');

    // Search functionality
    const performSearch = () => {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        window.location.href = `products.html?search=${encodeURIComponent(searchTerm)}`;
      }
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });

    // Suggestion clicks
    suggestionItems.forEach(item => {
      item.addEventListener('click', () => {
        const searchTerm = item.dataset.search;
        window.location.href = `products.html?search=${encodeURIComponent(searchTerm)}`;
      });
    });

    // Close modal
    const closeModal = () => {
      modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });

    // Show modal with animation
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
  }

  async loadCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;

    const categories = [
      {
        id: 'headphones',
        name: 'Headphones',
        description: 'Premium over-ear and on-ear headphones',
        icon: `<path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
               <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>`,
        count: 45
      },
      {
        id: 'speakers',
        name: 'Speakers',
        description: 'Bookshelf and portable speakers',
        icon: `<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
               <circle cx="12" cy="14" r="4"/>
               <line x1="12" y1="6" x2="12.01" y2="6"/>`,
        count: 32
      },
      {
        id: 'earbuds',
        name: 'Earbuds',
        description: 'Wireless and wired earbuds',
        icon: `<circle cx="12" cy="12" r="3"/>
               <path d="M12 1v6m0 6v6"/>
               <path d="m20.2 7.8-4.2 4.2m0 0 4.2 4.2M3.8 7.8l4.2 4.2m0 0-4.2 4.2"/>`,
        count: 28
      },
      {
        id: 'accessories',
        name: 'Accessories',
        description: 'Cables, interfaces, and more',
        icon: `<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
               <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
               <line x1="6" y1="6" x2="6.01" y2="6"/>
               <line x1="6" y1="18" x2="6.01" y2="18"/>`,
        count: 19
      }
    ];

    container.innerHTML = categories.map(category => `
      <a href="products.html?category=${category.id}" class="category-card card">
        <div class="category-icon">
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${category.icon}
          </svg>
        </div>
        <h3>${category.name}</h3>
        <p>${category.description}</p>
        <div class="category-count">${category.count} products</div>
      </a>
    `).join('');
  }

  async loadBestSellers() {
    const container = document.getElementById('bestsellers-grid');
    if (!container) return;

    try {
      container.innerHTML = this.createLoadingGrid();

      // Mock best sellers data - replace with API call
      const bestSellers = [
        {
          _id: 'bs1',
          name: 'Sony WH-1000XM4 Wireless Headphones',
          category: 'headphones',
          price: 349.99,
          salePrice: null,
          averageRating: 4.8,
          reviewCount: 1247,
          image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300&h=300&fit=crop',
          featured: true
        },
        {
          _id: 'bs2',
          name: 'Bose QuietComfort Earbuds',
          category: 'earbuds',
          price: 279.99,
          salePrice: 249.99,
          averageRating: 4.6,
          reviewCount: 892,
          image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop'
        },
        {
          _id: 'bs3',
          name: 'KEF LS50 Meta Bookshelf Speakers',
          category: 'speakers',
          price: 1499.99,
          salePrice: null,
          averageRating: 4.9,
          reviewCount: 324,
          image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop'
        },
        {
          _id: 'bs4',
          name: 'Audio-Technica ATH-M50x',
          category: 'headphones',
          price: 149.99,
          salePrice: 119.99,
          averageRating: 4.7,
          reviewCount: 2103,
          image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=300&h=300&fit=crop'
        }
      ];

      container.innerHTML = bestSellers.map(product => this.createProductCard(product)).join('');

    } catch (error) {
      console.error('Failed to load best sellers:', error);
      container.innerHTML = this.createErrorState();
    }
  }

  async loadTestimonials() {
    const container = document.getElementById('testimonials-carousel');
    if (!container) return;

    const testimonials = [
      {
        id: 1,
        quote: "AudioLoot has completely transformed my listening experience. The quality of their products and customer service is unmatched. I've never been happier with my audio setup!",
        author: "Sarah Johnson",
        role: "Music Producer",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b95b6e1d?w=80&h=80&fit=crop&crop=face"
      },
      {
        id: 2,
        quote: "As an audiophile, I'm extremely picky about sound quality. AudioLoot's curated selection and expert recommendations helped me find the perfect headphones. Outstanding service!",
        author: "Michael Chen",
        role: "Audio Engineer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
      },
      {
        id: 3,
        quote: "The expertise and passion of the AudioLoot team really shows. They didn't just sell me products; they helped me understand what would work best for my specific needs and budget.",
        author: "Emily Rodriguez",
        role: "Podcast Host",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face"
      }
    ];

    container.innerHTML = testimonials.map((testimonial, index) => `
      <div class="testimonial-card ${index === 0 ? 'active' : ''}">
        <img src="${testimonial.avatar}" alt="${testimonial.author}" class="testimonial-avatar">
        <blockquote class="testimonial-quote">"${testimonial.quote}"</blockquote>
        <div class="testimonial-author">${testimonial.author}</div>
        <div class="testimonial-role">${testimonial.role}</div>
      </div>
    `).join('');

    this.testimonials = testimonials;
    this.currentTestimonial = 0;
  }

  setupTestimonialCarousel() {
    const prevBtn = document.getElementById('testimonial-prev');
    const nextBtn = document.getElementById('testimonial-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.showPreviousTestimonial());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.showNextTestimonial());
    }

    // Auto-advance testimonials
    setInterval(() => {
      this.showNextTestimonial();
    }, 8000); // Change every 8 seconds
  }

  showNextTestimonial() {
    if (!this.testimonials) return;

    this.currentTestimonial = (this.currentTestimonial + 1) % this.testimonials.length;
    this.updateTestimonialDisplay();
  }

  showPreviousTestimonial() {
    if (!this.testimonials) return;

    this.currentTestimonial = this.currentTestimonial === 0 
      ? this.testimonials.length - 1 
      : this.currentTestimonial - 1;
    this.updateTestimonialDisplay();
  }

  updateTestimonialDisplay() {
    const cards = document.querySelectorAll('.testimonial-card');
    cards.forEach((card, index) => {
      card.classList.toggle('active', index === this.currentTestimonial);
    });
  }

  async handleNewsletterSignup(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    
    if (!email) {
      showError('Please enter your email address');
      return;
    }

    try {
      const submitBtn = e.target.querySelector('.newsletter-btn');
      setLoading(submitBtn, true);

      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccess('Thank you for subscribing! Check your email for a 10% discount code.');
      e.target.reset();

    } catch (error) {
      console.error('Newsletter signup error:', error);
      showError('Failed to subscribe. Please try again.');
    } finally {
      const submitBtn = e.target.querySelector('.newsletter-btn');
      setLoading(submitBtn, false);
    }
  }
}

// Initialize home page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.homePage = new HomePage();
});