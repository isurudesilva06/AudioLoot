/**
 * Theme Manager - Handles dark mode, light mode, and high contrast themes
 */
class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme();
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createThemeToggle();
    this.bindEvents();
    this.watchSystemTheme();
  }

  getStoredTheme() {
    const stored = localStorage.getItem('audioloot-theme');
    if (stored) return stored;

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      return 'high-contrast';
    }

    return 'light';
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    localStorage.setItem('audioloot-theme', theme);
    
    // Update meta theme color for mobile browsers
    this.updateMetaThemeColor(theme);
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme }
    }));
  }

  updateMetaThemeColor(theme) {
    let themeColor = '#ffffff'; // default light
    
    switch (theme) {
      case 'dark':
        themeColor = '#0a0a0a';
        break;
      case 'high-contrast':
        themeColor = '#000000';
        break;
    }

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = themeColor;
  }

  createThemeToggle() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.setAttribute('aria-label', 'Toggle theme');
    themeToggle.innerHTML = `
      <div class="theme-toggle-slider">
        <svg class="theme-toggle-icon theme-toggle-sun" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg class="theme-toggle-icon theme-toggle-moon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </div>
    `;

    // Insert into header nav-icons
    const navIcons = document.querySelector('.nav-icons');
    if (navIcons) {
      const firstButton = navIcons.querySelector('button');
      if (firstButton) {
        navIcons.insertBefore(themeToggle, firstButton);
      } else {
        navIcons.prepend(themeToggle);
      }
    }

    return themeToggle;
  }

  bindEvents() {
    // Theme toggle click
    document.addEventListener('click', (e) => {
      if (e.target.closest('.theme-toggle')) {
        this.toggleTheme();
      }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('.theme-toggle') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.toggleTheme();
      }
    });

    // Listen for theme preference changes
    window.addEventListener('themeChanged', (e) => {
      this.onThemeChanged(e.detail.theme);
    });
  }

  toggleTheme() {
    let newTheme;
    switch (this.currentTheme) {
      case 'light':
        newTheme = 'dark';
        break;
      case 'dark':
        newTheme = 'light';
        break;
      case 'high-contrast':
        newTheme = 'light';
        break;
      default:
        newTheme = 'dark';
    }

    this.applyTheme(newTheme);
    this.animateThemeTransition();
  }

  animateThemeTransition() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--theme-bg-primary);
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => {
      overlay.style.opacity = '0.8';
      
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(overlay);
        }, 300);
      }, 150);
    });
  }

  watchSystemTheme() {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    darkModeQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('audioloot-theme')) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });

    highContrastQuery.addEventListener('change', (e) => {
      if (e.matches && !localStorage.getItem('audioloot-theme')) {
        this.applyTheme('high-contrast');
      }
    });
  }

  onThemeChanged(theme) {
    // Update any theme-dependent elements
    this.updateThemeSpecificStyles(theme);
  }

  updateThemeSpecificStyles(theme) {
    // Update charts, maps, or other theme-sensitive components
    const charts = document.querySelectorAll('.chart, .graph');
    charts.forEach(chart => {
      chart.setAttribute('data-theme', theme);
    });

    // Update any embedded content that supports theming
    const embeds = document.querySelectorAll('iframe[data-theme-support]');
    embeds.forEach(embed => {
      const src = new URL(embed.src);
      src.searchParams.set('theme', theme);
      embed.src = src.toString();
    });
  }

  // Public API methods
  setTheme(theme) {
    if (['light', 'dark', 'high-contrast'].includes(theme)) {
      this.applyTheme(theme);
    }
  }

  getTheme() {
    return this.currentTheme;
  }

  // Utility method to check if dark mode is active
  isDark() {
    return this.currentTheme === 'dark' || this.currentTheme === 'high-contrast';
  }

  // Method to sync with system preference
  syncWithSystem() {
    localStorage.removeItem('audioloot-theme');
    this.currentTheme = this.getStoredTheme();
    this.applyTheme(this.currentTheme);
  }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}