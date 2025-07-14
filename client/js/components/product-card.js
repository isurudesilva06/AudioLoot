/**
 * Enhanced Product Card Web Component with glassmorphism and animations
 */
class ProductCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['product-id', 'name', 'price', 'original-price', 'image', 'rating', 'category', 'badge'];
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  get productData() {
    return {
      id: this.getAttribute('product-id'),
      name: this.getAttribute('name') || 'Premium Audio Product',
      price: this.getAttribute('price') || '299.99',
      originalPrice: this.getAttribute('original-price'),
      image: this.getAttribute('image') || 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop',
      rating: parseFloat(this.getAttribute('rating')) || 4.5,
      category: this.getAttribute('category') || 'Audio Equipment',
      badge: this.getAttribute('badge')
    };
  }

  render() {
    const data = this.productData;
    const hasDiscount = data.originalPrice && parseFloat(data.originalPrice) > parseFloat(data.price);
    const discount = hasDiscount ? Math.round((1 - parseFloat(data.price) / parseFloat(data.originalPrice)) * 100) : 0;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }

        .product-card {
          background: var(--theme-bg-glass, rgba(255, 255, 255, 0.1));
          backdrop-filter: blur(15px) saturate(160%);
          -webkit-backdrop-filter: blur(15px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 8px 32px var(--theme-shadow-light, rgba(0, 0, 0, 0.05));
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          transform-style: preserve-3d;
          position: relative;
        }

        .product-card:hover {
          background: var(--theme-bg-glass-hover, rgba(255, 255, 255, 0.2));
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 12px 40px var(--theme-shadow, rgba(0, 0, 0, 0.1)),
            0 0 20px var(--theme-glow-primary, rgba(33, 150, 243, 0.3));
          transform: translateY(-8px) rotateX(5deg) rotateY(5deg);
        }

        .product-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            transparent 0%,
            var(--theme-glow-primary, rgba(33, 150, 243, 0.3)) 50%,
            transparent 100%
          );
          opacity: 0;
          transition: opacity 0.3s;
          border-radius: inherit;
          z-index: -1;
        }

        .product-card:hover::before {
          opacity: 0.1;
        }

        .product-image {
          position: relative;
          height: 250px;
          overflow: hidden;
          border-radius: 12px 12px 0 0;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .product-card:hover .product-image img {
          transform: scale(1.1) rotate(2deg);
        }

        .product-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          z-index: 2;
        }

        .product-badge.sale {
          background: linear-gradient(45deg, #ff6b6b, #ee5a24);
          color: white;
          box-shadow: 0 0 15px rgba(238, 90, 36, 0.4);
        }

        .product-badge.new {
          background: linear-gradient(45deg, #26de81, #20bf6b);
          color: white;
          box-shadow: 0 0 15px rgba(32, 191, 107, 0.4);
        }

        .product-badge.featured {
          background: linear-gradient(45deg, #4834d4, #6c5ce7);
          color: white;
          box-shadow: 0 0 15px rgba(108, 92, 231, 0.4);
        }

        .product-actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          opacity: 0;
          transform: translateX(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 2;
        }

        .product-card:hover .product-actions {
          opacity: 1;
          transform: translateX(0);
        }

        .action-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          color: var(--theme-text-primary, #212121);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .action-btn:hover {
          background: var(--theme-neon-primary, #2196f3);
          color: white;
          transform: scale(1.1);
          box-shadow: 0 0 20px var(--theme-glow-primary, rgba(33, 150, 243, 0.6));
        }

        .product-info {
          padding: 20px;
        }

        .product-category {
          font-size: 12px;
          color: var(--theme-text-secondary, #757575);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .product-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--theme-text-primary, #212121);
          margin-bottom: 12px;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .stars {
          display: flex;
          gap: 2px;
        }

        .star {
          width: 14px;
          height: 14px;
          color: #ffd700;
        }

        .star.empty {
          color: var(--theme-border, #e0e0e0);
        }

        .rating-text {
          font-size: 12px;
          color: var(--theme-text-secondary, #757575);
        }

        .product-price {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .current-price {
          font-size: 20px;
          font-weight: 700;
          color: var(--theme-neon-primary, #2196f3);
          text-shadow: 0 0 10px var(--theme-glow-primary, rgba(33, 150, 243, 0.3));
        }

        .original-price {
          font-size: 14px;
          color: var(--theme-text-secondary, #757575);
          text-decoration: line-through;
        }

        .discount-badge {
          background: linear-gradient(45deg, #26de81, #20bf6b);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .add-to-cart {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(45deg, var(--primary-color, #2196f3), var(--theme-neon-primary, #00d4ff));
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .add-to-cart::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s;
        }

        .add-to-cart:hover::before {
          left: 100%;
        }

        .add-to-cart:hover {
          box-shadow: 0 0 25px var(--theme-glow-primary, rgba(33, 150, 243, 0.6));
          transform: scale(1.02);
        }

        .floating-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
          border-radius: inherit;
        }

        .floating-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: var(--theme-neon-primary, #2196f3);
          border-radius: 50%;
          opacity: 0;
          animation: float-particle 4s infinite ease-in-out;
        }

        @keyframes float-particle {
          0%, 100% {
            opacity: 0;
            transform: translateY(100px) scale(0);
          }
          50% {
            opacity: 0.6;
            transform: translateY(-20px) scale(1);
          }
        }

        .floating-particle:nth-child(1) { left: 20%; animation-delay: 0s; }
        .floating-particle:nth-child(2) { left: 40%; animation-delay: 1s; }
        .floating-particle:nth-child(3) { left: 60%; animation-delay: 2s; }
        .floating-particle:nth-child(4) { left: 80%; animation-delay: 3s; }
      </style>

      <div class="product-card">
        <div class="product-image">
          <img src="${data.image}" alt="${data.name}" loading="lazy">
          ${data.badge ? `<div class="product-badge ${data.badge}">${data.badge}</div>` : ''}
          <div class="product-actions">
            <button class="action-btn" title="Quick View" data-action="quickview">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="action-btn" title="Add to Wishlist" data-action="wishlist">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="product-info">
          <div class="product-category">${data.category}</div>
          <h3 class="product-name">${data.name}</h3>
          
          <div class="product-rating">
            <div class="stars">
              ${this.renderStars(data.rating)}
            </div>
            <span class="rating-text">(${data.rating})</span>
          </div>

          <div class="product-price">
            <span class="current-price">$${data.price}</span>
            ${hasDiscount ? `
              <span class="original-price">$${data.originalPrice}</span>
              <span class="discount-badge">-${discount}%</span>
            ` : ''}
          </div>

          <button class="add-to-cart" data-product-id="${data.id}">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 8px;">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61l1.38-7.39H6"/>
            </svg>
            Add to Cart
          </button>
        </div>

        <div class="floating-elements">
          <div class="floating-particle"></div>
          <div class="floating-particle"></div>
          <div class="floating-particle"></div>
          <div class="floating-particle"></div>
        </div>
      </div>
    `;
  }

  renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      stars += `
        <svg class="star ${filled ? '' : 'empty'}" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      `;
    }
    return stars;
  }

  addEventListeners() {
    const card = this.shadowRoot.querySelector('.product-card');
    
    // Add to cart functionality
    this.shadowRoot.querySelector('.add-to-cart').addEventListener('click', (e) => {
      e.preventDefault();
      this.handleAddToCart();
    });

    // Action buttons
    this.shadowRoot.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        this.handleAction(action);
      });
    });

    // 3D hover effect
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      const rotateX = (y - 0.5) * 10;
      const rotateY = (x - 0.5) * -10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });
  }

  handleAddToCart() {
    const data = this.productData;
    
    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('addToCart', {
      detail: data,
      bubbles: true,
      composed: true
    }));

    // Show feedback
    this.showAddToCartFeedback();
  }

  handleAction(action) {
    const data = this.productData;
    
    this.dispatchEvent(new CustomEvent(action, {
      detail: data,
      bubbles: true,
      composed: true
    }));
  }

  showAddToCartFeedback() {
    const button = this.shadowRoot.querySelector('.add-to-cart');
    const originalText = button.innerHTML;
    
    button.innerHTML = `
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 8px;">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      Added!
    `;
    button.style.background = 'linear-gradient(45deg, #26de81, #20bf6b)';
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.background = '';
    }, 2000);
  }
}

// Register the custom element
customElements.define('product-card', ProductCard);