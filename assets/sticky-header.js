/**
 * Animated Header Behavior
 * Header slides out to the right when scrolling down, and slides back in when at top
 */

class AnimatedHeader {
  constructor() {
    this.desktopHeader = document.querySelector('.floating-dock-header');
    this.mobileHeader = document.querySelector('.mobile-header');
    this.lastScrollY = 0;
    this.scrollThreshold = 50; // Scroll distance before header hides
    this.isScrollingDown = false;

    // Get animation speed from global variable (set by theme editor)
    this.animationSpeed = window.headerAnimationSpeed || 1;

    // Check if mobile device (disable animations on mobile)
    this.isMobile = window.innerWidth <= 768;

    // State tracking
    this.desktopIsVisible = true;
    this.mobileIsVisible = true;

    if (this.desktopHeader || this.mobileHeader) {
      this.init();
    }
  }

  init() {
    // Set initial styles
    this.setInitialStyles();

    // Add scroll listener with throttling
    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );

    // Handle resize
    window.addEventListener(
      'resize',
      () => {
        // Update mobile detection on resize
        this.isMobile = window.innerWidth <= 768;
        // Update transition styles based on new mobile state
        this.setInitialStyles();
        // Update header position based on current scroll state
        this.handleScroll();
      },
      { passive: true }
    );

    // Initial check
    this.handleScroll();
  }

  setInitialStyles() {
    // Desktop header - ensure it has transition and right position
    if (this.desktopHeader) {
      this.desktopHeader.style.transition = `transform ${this.animationSpeed}s cubic-bezier(0.4, 0, 0.2, 1)`;
      this.desktopHeader.style.willChange = 'transform';
      // Set initial right position to match the return position
      this.desktopHeader.style.right = '0px';
    }

    // Mobile header - disable transition on mobile
    if (this.mobileHeader) {
      if (this.isMobile) {
        // Disable animation on mobile
        this.mobileHeader.style.transition = 'none';
        this.mobileHeader.style.willChange = 'auto';
        // Keep header visible on mobile
        this.mobileHeader.style.transform = 'translateX(0)';
      } else {
        this.mobileHeader.style.transition = `transform ${this.animationSpeed}s cubic-bezier(0.4, 0, 0.2, 1)`;
        this.mobileHeader.style.willChange = 'transform';
      }
    }
  }

  handleScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollingDown = scrollY > this.lastScrollY;
    this.lastScrollY = scrollY;

    // Desktop header
    if (this.desktopHeader) {
      if (scrollY <= this.scrollThreshold) {
        // At top - slide back in with right: 20px
        if (!this.desktopIsVisible) {
          this.desktopIsVisible = true;
          this.desktopHeader.style.right = '20px';
          this.desktopHeader.style.transform = 'translateX(0)';
        } else {
          // Ensure position is correct even if already visible (e.g., initial load at top)
          this.desktopHeader.style.right = '20px';
        }
      } else if (scrollY > this.scrollThreshold) {
        // Scrolled past threshold - slide out to the right
        if (this.desktopIsVisible) {
          this.desktopIsVisible = false;
          // Calculate distance to slide off screen to the right
          const rect = this.desktopHeader.getBoundingClientRect();
          const distanceToRight = window.innerWidth - rect.left; // Add some padding
          this.desktopHeader.style.transform = `translateX(${distanceToRight + 20}px)`;
        }
      }
    }

    // Mobile header - disable animation on mobile devices
    if (this.mobileHeader) {
      if (this.isMobile) {
        // On mobile, keep header always visible (no animation)
        this.mobileHeader.style.transform = 'translateX(0)';
        this.mobileIsVisible = true;
      } else {
        // Desktop behavior - animate header
        if (scrollY <= this.scrollThreshold) {
          // At top - slide back in
          if (!this.mobileIsVisible) {
            this.mobileIsVisible = true;
            this.mobileHeader.style.transform = 'translateX(0)';
          }
        } else if (scrollY > this.scrollThreshold) {
          // Scrolled past threshold - slide out to the right
          if (this.mobileIsVisible) {
            this.mobileIsVisible = false;
            this.mobileHeader.style.transform = 'translateX(100%)';
          }
        }
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AnimatedHeader();
  });
} else {
  new AnimatedHeader();
}
