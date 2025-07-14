/**
 * Animation Controller - Handles scroll animations, micro-interactions, and visual effects
 */
class AnimationController {
  constructor() {
    this.scrollElements = [];
    this.parallaxElements = [];
    this.mouseTrails = [];
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  init() {
    if (this.isReducedMotion) {
      console.log('Reduced motion preference detected, limiting animations');
      return;
    }

    this.setupScrollObserver();
    this.setupParallaxEffect();
    this.setupMicroInteractions();
    this.setupMouseTrail();
    this.setupScrollProgress();
    this.setupCartFlyAnimation();
    this.setupTextAnimations();
    this.bindEvents();
  }

  setupScrollObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Add staggered delay for multiple elements
          const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 100;
          entry.target.style.transitionDelay = `${delay}ms`;
        }
      });
    }, options);

    // Observe all scroll reveal elements
    document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right').forEach(el => {
      this.scrollObserver.observe(el);
    });
  }

  setupParallaxEffect() {
    this.parallaxElements = document.querySelectorAll('.parallax');
    
    if (this.parallaxElements.length > 0) {
      this.updateParallax();
      window.addEventListener('scroll', this.throttle(this.updateParallax.bind(this), 16));
    }
  }

  updateParallax() {
    const scrollTop = window.pageYOffset;
    const windowHeight = window.innerHeight;

    this.parallaxElements.forEach(element => {
      const elementTop = element.offsetTop;
      const elementHeight = element.offsetHeight;
      const elementVisible = elementTop < (scrollTop + windowHeight) && (elementTop + elementHeight) > scrollTop;

      if (elementVisible) {
        const speed = element.dataset.speed || 0.5;
        const yPos = -(scrollTop - elementTop) * speed;
        
        if (element.classList.contains('parallax-slow')) {
          element.style.setProperty('--scroll-offset-slow', `${yPos * 0.3}px`);
        } else if (element.classList.contains('parallax-fast')) {
          element.style.setProperty('--scroll-offset-fast', `${yPos * 0.8}px`);
        } else {
          element.style.transform = `translate3d(0, ${yPos}px, 0)`;
        }
      }
    });
  }

  setupMicroInteractions() {
    // Enhanced button hover effects
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0) scale(1)';
      });
    });

    // Enhanced product card hover
    document.querySelectorAll('.product-card-enhanced').forEach(card => {
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
    });

    // Icon hover animations
    document.querySelectorAll('.icon-hover').forEach(icon => {
      icon.addEventListener('mouseenter', () => {
        icon.style.animation = 'icon-pulse 0.6s ease-out';
      });

      icon.addEventListener('animationend', () => {
        icon.style.animation = '';
      });
    });
  }

  setupMouseTrail() {
    if (window.innerWidth < 768) return; // Skip on mobile

    document.addEventListener('mousemove', (e) => {
      this.createMouseTrail(e.clientX, e.clientY);
    });
  }

  createMouseTrail(x, y) {
    const trail = document.createElement('div');
    trail.className = 'mouse-trail';
    trail.style.left = x + 'px';
    trail.style.top = y + 'px';
    
    document.body.appendChild(trail);

    // Remove after animation
    setTimeout(() => {
      if (trail.parentNode) {
        trail.parentNode.removeChild(trail);
      }
    }, 1000);

    // Limit number of trails
    this.mouseTrails.push(trail);
    if (this.mouseTrails.length > 20) {
      const oldTrail = this.mouseTrails.shift();
      if (oldTrail && oldTrail.parentNode) {
        oldTrail.parentNode.removeChild(oldTrail);
      }
    }
  }

  setupScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.transform = 'scaleX(0)';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', this.throttle(() => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY / windowHeight;
      progressBar.style.transform = `scaleX(${scrolled})`;
    }, 16));
  }

  setupCartFlyAnimation() {
    document.addEventListener('click', (e) => {
      const addToCartBtn = e.target.closest('.add-to-cart-btn, .btn-add-cart');
      if (addToCartBtn) {
        this.animateAddToCart(addToCartBtn);
      }
    });
  }

  animateAddToCart(button) {
    const cart = document.querySelector('.cart-count').parentElement;
    const buttonRect = button.getBoundingClientRect();
    const cartRect = cart.getBoundingClientRect();

    // Create flying element
    const flyingItem = document.createElement('div');
    flyingItem.innerHTML = `
      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61l1.38-7.39H6"/>
      </svg>
    `;
    flyingItem.className = 'cart-fly-animation cart-fly-start';
    flyingItem.style.left = buttonRect.left + buttonRect.width / 2 + 'px';
    flyingItem.style.top = buttonRect.top + buttonRect.height / 2 + 'px';
    flyingItem.style.color = getComputedStyle(document.documentElement).getPropertyValue('--theme-neon-primary');

    document.body.appendChild(flyingItem);

    // Animate to cart
    requestAnimationFrame(() => {
      flyingItem.style.left = cartRect.left + cartRect.width / 2 + 'px';
      flyingItem.style.top = cartRect.top + cartRect.height / 2 + 'px';
      flyingItem.classList.add('cart-fly-end');
    });

    // Animate cart bounce
    cart.style.animation = 'bounce 0.6s ease-out';
    
    // Cleanup
    setTimeout(() => {
      if (flyingItem.parentNode) {
        flyingItem.parentNode.removeChild(flyingItem);
      }
      cart.style.animation = '';
    }, 1000);

    // Update cart count with animation
    this.animateCartCount();
  }

  animateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
      cartCount.style.animation = 'icon-pulse 0.5s ease-out';
      setTimeout(() => {
        cartCount.style.animation = '';
      }, 500);
    }
  }

  setupTextAnimations() {
    // Typewriter effect
    document.querySelectorAll('.text-typewriter').forEach(element => {
      this.typewriterEffect(element);
    });

    // Wave text effect
    document.querySelectorAll('.text-wave-container').forEach(container => {
      this.waveTextEffect(container);
    });
  }

  typewriterEffect(element) {
    const text = element.textContent;
    element.textContent = '';
    element.style.width = '0';
    
    let i = 0;
    const timer = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        element.style.width = 'auto';
      }
    }, 100);
  }

  waveTextEffect(container) {
    const text = container.textContent;
    container.innerHTML = '';
    
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.className = 'text-wave';
      span.style.animationDelay = `${i * 0.1}s`;
      container.appendChild(span);
    });
  }

  // Utility functions
  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  bindEvents() {
    // Handle dynamic content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Add new scroll reveal elements
            const scrollElements = node.querySelectorAll?.('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right');
            scrollElements?.forEach(el => this.scrollObserver.observe(el));
            
            // Automatically make dynamically loaded product cards visible
            const productCards = node.querySelectorAll?.('.product-card');
            productCards?.forEach(card => {
              card.classList.add('visible');
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
            
            // Add new parallax elements
            const parallaxElements = node.querySelectorAll?.('.parallax');
            if (parallaxElements?.length > 0) {
              this.parallaxElements = [...this.parallaxElements, ...parallaxElements];
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Handle window resize
    window.addEventListener('resize', this.debounce(() => {
      this.updateParallax();
    }, 250));
  }

  // Public API methods
  refreshAnimations() {
    // Re-observe scroll elements
    document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right').forEach(el => {
      this.scrollObserver.observe(el);
    });
    
    // Update parallax elements
    this.parallaxElements = document.querySelectorAll('.parallax');
    this.updateParallax();
  }

  triggerCartAnimation(button) {
    this.animateAddToCart(button);
  }

  destroy() {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
    
    // Clean up mouse trails
    this.mouseTrails.forEach(trail => {
      if (trail.parentNode) {
        trail.parentNode.removeChild(trail);
      }
    });
    
    // Remove scroll progress
    const progressBar = document.querySelector('.scroll-progress');
    if (progressBar) {
      progressBar.remove();
    }
  }
}

// Initialize animation controller
document.addEventListener('DOMContentLoaded', () => {
  window.animationController = new AnimationController();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationController;
}