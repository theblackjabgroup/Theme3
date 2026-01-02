/**
 * Animated Header Behavior
 * Header slides out left-to-right when scrolling, then slides back in from top 20px
 */

class AnimatedHeader {
  constructor() {
    this.desktopHeader = document.querySelector('.floating-dock-header');
    this.mobileHeader = document.querySelector('.mobile-header');
    this.stickyOffset = 20; // Distance from top when sticky
    this.scrollThreshold = 200; // Scroll distance before header comes back
    this.lastScrollY = 0;
    this.isVisible = true;
    this.hasReturned = false;

    if (this.desktopHeader || this.mobileHeader) {
      this.init();
    }
  }

  init() {
    // Set initial position
    this.setInitialPosition();

    // Add scroll listener
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
        this.handleScroll();
      },
      { passive: true }
    );

    // Initial check
    this.handleScroll();
  }

  setInitialPosition() {
    // Desktop header starts at bottom right
    if (this.desktopHeader) {
      this.desktopHeader.style.position = 'fixed';
      this.desktopHeader.style.bottom = '24px';
      this.desktopHeader.style.right = '20px';
      this.desktopHeader.style.top = 'auto';
      this.desktopHeader.style.transform = 'translateX(0)';
      this.desktopHeader.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      this.desktopHeader.style.willChange = 'transform';
    }

    // Mobile header starts at top
    if (this.mobileHeader) {
      this.mobileHeader.style.position = 'relative';
      this.mobileHeader.style.top = '0';
      this.mobileHeader.style.transform = 'translateX(0)';
      this.mobileHeader.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      this.mobileHeader.style.willChange = 'transform';
      const container = this.mobileHeader.querySelector('.mobile-header-container');
      if (container) {
        container.style.position = 'relative';
        container.style.top = '0';
      }
    }
  }

  handleScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollingDown = scrollY > this.lastScrollY;
    this.lastScrollY = scrollY;

    // Desktop header
    if (this.desktopHeader) {
      // Slide back in from top when reaching threshold
      if (scrollY >= this.scrollThreshold) {
        if (!this.hasReturned) {
          this.hasReturned = true;
          this.isVisible = true;
          this.desktopHeader.classList.add('header-sticky');
          this.desktopHeader.style.position = 'fixed';
          this.desktopHeader.style.top = `${this.stickyOffset}px`;
          this.desktopHeader.style.bottom = 'auto';
          this.desktopHeader.style.right = '20px';
          // Start from right (off screen) and slide in from right to left
          const headerWidth = this.desktopHeader.offsetWidth || 200;
          const rightOffset = 20;
          this.desktopHeader.style.transform = `translateX(calc(100vw - ${rightOffset}px))`;
          // Use double requestAnimationFrame for smooth animation
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              this.desktopHeader.style.transform = 'translateX(0)';
            });
          });
        }
      }
      // When scrolling back up from sticky position - repeat animation
      else if (scrollY < this.scrollThreshold && this.hasReturned) {
        if (this.hasReturned) {
          this.hasReturned = false;
          this.isVisible = false;
          this.desktopHeader.classList.remove('header-sticky');
          // Ensure transition is enabled for smooth exit
          this.desktopHeader.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          // Slide out to the right - calculate distance to slide off screen
          const rect = this.desktopHeader.getBoundingClientRect();
          const distanceToRight = window.innerWidth - rect.left;
          this.desktopHeader.style.transform = `translateX(${distanceToRight}px)`;

          // After exit animation completes, reset to original position and slide in
          setTimeout(() => {
            if (!this.hasReturned && !this.isVisible) {
              // First, reset position to original bottom-right location (without transition)
              this.desktopHeader.style.transition = 'none';
              this.desktopHeader.style.position = 'fixed';
              this.desktopHeader.style.bottom = '24px';
              this.desktopHeader.style.top = 'auto';
              this.desktopHeader.style.right = '20px';
              // Start from left (off screen)
              this.desktopHeader.style.transform = 'translateX(-100vw)';

              // Force reflow to ensure position change is applied
              this.desktopHeader.offsetHeight;

              // Now enable transition and slide in smoothly
              requestAnimationFrame(() => {
                this.desktopHeader.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                requestAnimationFrame(() => {
                  this.isVisible = true;
                  this.desktopHeader.style.transform = 'translateX(0)';
                });
              });
            }
          }, 600);
        }
      }
      // Slide out when scrolling down (after 50px) and not at sticky position
      else if (scrollY > 50 && !this.hasReturned) {
        if (this.isVisible) {
          this.isVisible = false;
          // Ensure transition is enabled
          this.desktopHeader.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          // Calculate distance to slide off screen to the right
          const rect = this.desktopHeader.getBoundingClientRect();
          const distanceToRight = window.innerWidth - rect.left;
          this.desktopHeader.style.transform = `translateX(${distanceToRight}px)`;
        }
      }
      // When at top or near top, ensure it's visible
      else if (scrollY <= 50 && !this.hasReturned && !this.isVisible) {
        this.isVisible = true;
        this.desktopHeader.style.transform = 'translateX(0)';
      }
    }

    // Mobile header
    if (this.mobileHeader) {
      // Slide back in from top when reaching threshold
      if (scrollY >= this.scrollThreshold) {
        if (!this.hasReturned) {
          this.hasReturned = true;
          this.isVisible = true;
          this.mobileHeader.classList.add('header-sticky');
          this.mobileHeader.style.position = 'fixed';
          this.mobileHeader.style.top = `${this.stickyOffset}px`;
          this.mobileHeader.style.left = '0';
          this.mobileHeader.style.right = '0';
          this.mobileHeader.style.width = '100%';
          // Start from right (off screen) and slide in from right to left
          this.mobileHeader.style.transform = 'translateX(100%)';
          // Use double requestAnimationFrame for smooth animation
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              this.mobileHeader.style.transform = 'translateX(0)';
            });
          });
        }
      }
      // When scrolling back up from sticky position - repeat animation
      else if (scrollY < this.scrollThreshold && this.hasReturned) {
        if (this.hasReturned) {
          this.hasReturned = false;
          this.isVisible = false;
          this.mobileHeader.classList.remove('header-sticky');
          // Ensure transition is enabled for smooth exit
          this.mobileHeader.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          // Slide out to the right
          this.mobileHeader.style.transform = 'translateX(100%)';

          // After exit animation completes, reset to original position and slide in
          setTimeout(() => {
            if (!this.hasReturned && !this.isVisible) {
              // First, reset position to original top location (without transition)
              this.mobileHeader.style.transition = 'none';
              this.mobileHeader.style.position = 'relative';
              this.mobileHeader.style.top = '0';
              this.mobileHeader.style.left = 'auto';
              this.mobileHeader.style.right = 'auto';
              this.mobileHeader.style.width = 'auto';
              // Start from left (off screen)
              this.mobileHeader.style.transform = 'translateX(-100%)';

              // Force reflow to ensure position change is applied
              this.mobileHeader.offsetHeight;

              // Now enable transition and slide in smoothly
              requestAnimationFrame(() => {
                this.mobileHeader.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                requestAnimationFrame(() => {
                  this.isVisible = true;
                  this.mobileHeader.style.transform = 'translateX(0)';
                });
              });
            }
          }, 600);
        }
      }
      // Slide out when scrolling down (after 50px) and not at sticky position
      else if (scrollY > 50 && !this.hasReturned) {
        if (this.isVisible) {
          this.isVisible = false;
          // Ensure transition is enabled
          this.mobileHeader.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          // Slide out to the right
          this.mobileHeader.style.transform = 'translateX(100%)';
        }
      }
      // When at top or near top, ensure it's visible
      else if (scrollY <= 50 && !this.hasReturned && !this.isVisible) {
        this.isVisible = true;
        this.mobileHeader.style.transform = 'translateX(0)';
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
