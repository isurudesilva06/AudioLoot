/**
 * Interactive Rating Widget Web Component with glassmorphism
 */
class RatingWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentRating = 0;
    this.hoverRating = 0;
  }

  static get observedAttributes() {
    return ['rating', 'max-rating', 'readonly', 'size', 'show-text'];
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

  get rating() {
    return parseFloat(this.getAttribute('rating')) || 0;
  }

  set rating(value) {
    this.setAttribute('rating', value);
    this.currentRating = value;
  }

  get maxRating() {
    return parseInt(this.getAttribute('max-rating')) || 5;
  }

  get readonly() {
    return this.hasAttribute('readonly');
  }

  get size() {
    return this.getAttribute('size') || 'medium';
  }

  get showText() {
    return this.hasAttribute('show-text');
  }

  render() {
    this.currentRating = this.rating;
    
    const sizeClasses = {
      small: '16px',
      medium: '20px',
      large: '24px',
      xlarge: '32px'
    };

    const starSize = sizeClasses[this.size] || sizeClasses.medium;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .rating-container {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--theme-bg-glass, rgba(255, 255, 255, 0.1));
          backdrop-filter: blur(10px) saturate(180%);
          -webkit-backdrop-filter: blur(10px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .rating-container:hover {
          background: var(--theme-bg-glass-hover, rgba(255, 255, 255, 0.15));
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 20px var(--theme-shadow-light, rgba(0, 0, 0, 0.1));
        }

        .stars-container {
          display: flex;
          gap: 2px;
        }

        .star {
          width: ${starSize};
          height: ${starSize};
          cursor: ${this.readonly ? 'default' : 'pointer'};
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--theme-border, #e0e0e0);
          filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.1));
        }

        .star.filled {
          color: #ffd700;
          filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.4));
        }

        .star.half {
          background: linear-gradient(90deg, #ffd700 50%, var(--theme-border, #e0e0e0) 50%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.4));
        }

        .star:hover {
          transform: scale(1.2);
          color: #ffd700;
          filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
        }

        .star.interactive:hover ~ .star {
          color: var(--theme-border, #e0e0e0);
          transform: scale(1);
        }

        .rating-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--theme-text-secondary, #757575);
          min-width: 60px;
          text-align: center;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .rating-text.glow {
          color: var(--theme-neon-primary, #2196f3);
          text-shadow: 0 0 8px var(--theme-glow-primary, rgba(33, 150, 243, 0.4));
          background: rgba(33, 150, 243, 0.1);
        }

        .rating-labels {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          text-align: center;
          font-size: 12px;
          color: var(--theme-text-secondary, #757575);
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .rating-container:hover .rating-labels {
          opacity: 1;
          transform: translateY(0);
        }

        .star-burst {
          position: absolute;
          width: 20px;
          height: 20px;
          pointer-events: none;
          opacity: 0;
        }

        .star-burst.animate {
          animation: star-burst 0.6s ease-out;
        }

        @keyframes star-burst {
          0% {
            opacity: 1;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.5) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: scale(2) rotate(360deg);
          }
        }

        .pulse-ring {
          position: absolute;
          border: 2px solid var(--theme-neon-primary, #2196f3);
          border-radius: 50%;
          opacity: 0;
          animation: pulse-ring 1s ease-out;
        }

        @keyframes pulse-ring {
          0% {
            opacity: 1;
            transform: scale(0.33);
          }
          80%, 100% {
            opacity: 0;
            transform: scale(1.33);
          }
        }
      </style>

      <div class="rating-container" style="position: relative;">
        <div class="stars-container">
          ${this.renderStars()}
        </div>
        
        ${this.showText ? `<div class="rating-text">${this.getRatingText()}</div>` : ''}
        
        ${!this.readonly ? `<div class="rating-labels">${this.getRatingLabel()}</div>` : ''}
      </div>
    `;
  }

  renderStars() {
    let stars = '';
    for (let i = 1; i <= this.maxRating; i++) {
      const isFilled = i <= this.currentRating;
      const isHalf = !isFilled && i - 0.5 <= this.currentRating;
      const isInteractive = !this.readonly;
      
      stars += `
        <svg class="star ${isFilled ? 'filled' : ''} ${isHalf ? 'half' : ''} ${isInteractive ? 'interactive' : ''}" 
             data-rating="${i}" 
             fill="currentColor" 
             viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      `;
    }
    return stars;
  }

  getRatingText() {
    if (this.hoverRating > 0) {
      return `${this.hoverRating}.0`;
    }
    return this.currentRating % 1 === 0 ? `${this.currentRating}.0` : this.currentRating.toFixed(1);
  }

  getRatingLabel() {
    const rating = this.hoverRating || this.currentRating;
    const labels = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[Math.ceil(rating)] || 'Rate this';
  }

  addEventListeners() {
    if (this.readonly) return;

    const stars = this.shadowRoot.querySelectorAll('.star');
    const container = this.shadowRoot.querySelector('.rating-container');
    const ratingText = this.shadowRoot.querySelector('.rating-text');

    stars.forEach((star, index) => {
      // Hover effects
      star.addEventListener('mouseenter', () => {
        this.hoverRating = index + 1;
        this.updateStarDisplay();
        this.updateRatingText();
        
        // Add glow effect to text
        if (ratingText) {
          ratingText.classList.add('glow');
        }
      });

      // Click handler
      star.addEventListener('click', (e) => {
        const newRating = index + 1;
        this.currentRating = newRating;
        this.rating = newRating;
        
        // Create burst effect
        this.createStarBurst(e.target);
        this.createPulseRing(e.target);
        
        // Dispatch rating change event
        this.dispatchEvent(new CustomEvent('ratingChange', {
          detail: { rating: newRating },
          bubbles: true
        }));
        
        // Haptic feedback (if supported)
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      });
    });

    // Reset hover state when leaving container
    container.addEventListener('mouseleave', () => {
      this.hoverRating = 0;
      this.updateStarDisplay();
      this.updateRatingText();
      
      if (ratingText) {
        ratingText.classList.remove('glow');
      }
    });
  }

  updateStarDisplay() {
    const stars = this.shadowRoot.querySelectorAll('.star');
    const displayRating = this.hoverRating || this.currentRating;
    
    stars.forEach((star, index) => {
      const rating = index + 1;
      star.classList.toggle('filled', rating <= displayRating);
      star.classList.toggle('half', rating - 0.5 <= displayRating && rating > displayRating);
    });
  }

  updateRatingText() {
    const ratingText = this.shadowRoot.querySelector('.rating-text');
    if (ratingText) {
      ratingText.textContent = this.getRatingText();
    }
    
    const labels = this.shadowRoot.querySelector('.rating-labels');
    if (labels) {
      labels.textContent = this.getRatingLabel();
    }
  }

  createStarBurst(target) {
    const burst = document.createElement('div');
    burst.className = 'star-burst';
    burst.innerHTML = `
      <svg fill="currentColor" viewBox="0 0 24 24" style="color: #ffd700;">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    `;
    
    const rect = target.getBoundingClientRect();
    const container = this.shadowRoot.querySelector('.rating-container');
    const containerRect = container.getBoundingClientRect();
    
    burst.style.position = 'absolute';
    burst.style.left = (rect.left - containerRect.left + rect.width / 2 - 10) + 'px';
    burst.style.top = (rect.top - containerRect.top + rect.height / 2 - 10) + 'px';
    
    container.appendChild(burst);
    burst.classList.add('animate');
    
    setTimeout(() => {
      if (burst.parentNode) {
        burst.parentNode.removeChild(burst);
      }
    }, 600);
  }

  createPulseRing(target) {
    const ring = document.createElement('div');
    ring.className = 'pulse-ring';
    
    const rect = target.getBoundingClientRect();
    const container = this.shadowRoot.querySelector('.rating-container');
    const containerRect = container.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height);
    ring.style.width = size + 'px';
    ring.style.height = size + 'px';
    ring.style.left = (rect.left - containerRect.left + rect.width / 2 - size / 2) + 'px';
    ring.style.top = (rect.top - containerRect.top + rect.height / 2 - size / 2) + 'px';
    
    container.appendChild(ring);
    
    setTimeout(() => {
      if (ring.parentNode) {
        ring.parentNode.removeChild(ring);
      }
    }, 1000);
  }

  // Public API
  setRating(rating) {
    this.rating = rating;
    this.currentRating = rating;
    this.updateStarDisplay();
    this.updateRatingText();
  }

  getRating() {
    return this.currentRating;
  }

  reset() {
    this.setRating(0);
  }
}

// Register the custom element
customElements.define('rating-widget', RatingWidget);