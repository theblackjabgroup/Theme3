class MobileHeader {
  constructor() {
    this.menuDrawer = document.querySelector('[data-mobile-menu]');
    this.submenuToggles = document.querySelectorAll('[data-mobile-submenu-toggle]');
    this.headerContainer = document.querySelector('.mobile-header-container');
    this.lastScrollY = window.scrollY;
    this.scrollThreshold = 10; // Minimum scroll distance to trigger hide/show
    this.closeTransitionHandler = null; // Track the close transition handler
    this.isClosing = false; // Track if menu is currently closing

    // Initialize scroll handler for mobile header
    this.initScrollHandler();

    // Get hamburger menu toggle (exclude close button)
    const hamburgerToggle = document.querySelector('.mobile-menu-toggle[data-mobile-menu-toggle]');
    if (hamburgerToggle) {
      hamburgerToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleMenu();
      });
    }

    // Handle close button clicks - use event delegation on document with capture phase
    document.addEventListener(
      'click',
      (e) => {
        // Check if click is on close button or has the close data attribute
        const closeButton = e.target.closest('[data-mobile-menu-close], .mobile-menu-close');
        if (closeButton && this.menuDrawer?.getAttribute('aria-hidden') === 'false') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          this.closeMenu();
          return false;
        }
      },
      true,
    ); // Use capture phase to catch event earlier

    // Close menu when clicking outside the content area
    if (this.menuDrawer) {
      this.menuDrawer.addEventListener('click', (e) => {
        // Only close if clicking directly on the drawer background, not on content
        if (e.target === this.menuDrawer) {
          this.closeMenu();
        }
      });
    }

    // Handle submenu toggles
    this.submenuToggles.forEach((toggle) => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSubmenu(toggle);
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.menuDrawer?.getAttribute('aria-hidden') === 'false') {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    const isOpen = this.menuDrawer?.getAttribute('aria-hidden') === 'false';

    if (isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    if (this.menuDrawer) {
      // Cancel any pending close transition handler
      if (this.closeTransitionHandler) {
        const menuContent = this.menuDrawer.querySelector('.mobile-menu-content');
        if (menuContent) {
          menuContent.removeEventListener('transitionend', this.closeTransitionHandler);
        }
        this.closeTransitionHandler = null;
      }
      
      this.isClosing = false;
      this.menuDrawer.setAttribute('aria-hidden', 'false');

      // Use requestAnimationFrame to ensure the transform animation triggers
      requestAnimationFrame(() => {
        // Check if menu is still being opened (not closed in the meantime)
        if (this.isClosing || this.menuDrawer.getAttribute('aria-hidden') === 'true') {
          return; // Menu was closed, don't proceed with opening
        }

        const menuContent = this.menuDrawer.querySelector('.mobile-menu-content');
        if (menuContent) {
          menuContent.style.transform = ''; // Clear any inline transform from closing
        }

        const hamburgerToggle = document.querySelector('.mobile-menu-toggle[data-mobile-menu-toggle]');
        if (hamburgerToggle) {
          hamburgerToggle.setAttribute('aria-expanded', 'true');
        }
        document.body.classList.add('mobile-menu-open');
        document.documentElement.classList.add('mobile-menu-open');
        document.body.style.overflow = 'hidden';
      });
    }
  }

  closeMenu() {
    if (this.menuDrawer) {
      const menuContent = this.menuDrawer.querySelector('.mobile-menu-content');
      
      // Cancel any pending close transition handler from previous close attempts
      if (this.closeTransitionHandler && menuContent) {
        menuContent.removeEventListener('transitionend', this.closeTransitionHandler);
        this.closeTransitionHandler = null;
      }

      this.isClosing = true;
      
      // Set aria-hidden to true immediately to trigger the CSS transition
      this.menuDrawer.setAttribute('aria-hidden', 'true');

      // Trigger the transform animation first by removing the open state
      if (menuContent) {
        // Force reflow to ensure the transition starts
        menuContent.offsetHeight;
        menuContent.style.transform = 'translateY(-100%)';
      }

      // Wait for animation to complete before cleaning up body classes
      const cleanup = () => {
        // Only proceed if we're still closing
        if (!this.isClosing) {
          return;
        }
        
        // Double-check menu is still closed
        if (this.menuDrawer.getAttribute('aria-hidden') !== 'true') {
          return;
        }
        
        document.body.classList.remove('mobile-menu-open');
        document.documentElement.classList.remove('mobile-menu-open');
        document.body.style.overflow = '';
        
        this.closeTransitionHandler = null;
        this.isClosing = false;
      };

      const handleTransitionEnd = (e) => {
        // Only proceed if we're still closing and this is the correct transition
        if (!this.isClosing || e.target !== menuContent) {
          return;
        }
        
        // Double-check menu is still closed
        if (this.menuDrawer.getAttribute('aria-hidden') !== 'true') {
          return;
        }
        
        cleanup();
        
        if (menuContent) {
          menuContent.removeEventListener('transitionend', handleTransitionEnd);
        }
      };

      // Store handler reference so we can cancel it if menu reopens
      this.closeTransitionHandler = handleTransitionEnd;

      // Always set up timeout fallback to prevent scroll lock
      const fallbackTimeout = setTimeout(() => {
        cleanup();
        if (menuContent && this.closeTransitionHandler) {
          menuContent.removeEventListener('transitionend', this.closeTransitionHandler);
        }
        this.closeTransitionHandler = null;
      }, 800);

      if (menuContent) {
        menuContent.addEventListener('transitionend', (e) => {
          // Only handle transform transitions from menuContent itself, not child elements
          if (e.target === menuContent && e.propertyName === 'transform') {
            clearTimeout(fallbackTimeout);
            handleTransitionEnd(e);
          }
        }, { once: true });
      } else {
        // If menuContent not found, cleanup immediately
        clearTimeout(fallbackTimeout);
        cleanup();
      }

      const hamburgerToggle = document.querySelector('.mobile-menu-toggle[data-mobile-menu-toggle]');
      if (hamburgerToggle) {
        hamburgerToggle.setAttribute('aria-expanded', 'false');
      }

      // Close all submenus
      this.submenuToggles.forEach((toggle) => {
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        const parentLink = toggle.getAttribute('data-parent-link');
        const submenu = document.querySelector(`.mobile-submenu[data-parent="${parentLink}"]`);
        if (submenu) {
          submenu.classList.remove('active');
        }
      });
    }
  }

  toggleSubmenu(toggle) {
    const menuItem = toggle.closest('.mobile-menu-item');
    if (!menuItem) return;

    const parentLink = toggle.getAttribute('data-parent-link');
    const submenu = document.querySelector(`.mobile-submenu[data-parent="${parentLink}"]`);

    if (!submenu) return;

    const isExpanded = toggle.classList.contains('active');

    // Close all other submenus and remove active states
    this.submenuToggles.forEach((otherToggle) => {
      if (otherToggle !== toggle) {
        otherToggle.classList.remove('active');
        otherToggle.setAttribute('aria-expanded', 'false');
        const otherParentLink = otherToggle.getAttribute('data-parent-link');
        const otherSubmenu = document.querySelector(`.mobile-submenu[data-parent="${otherParentLink}"]`);
        if (otherSubmenu) {
          otherSubmenu.classList.remove('active');
        }
      }
    });

    // Toggle current submenu
    if (isExpanded) {
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      submenu.classList.remove('active');
    } else {
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      submenu.classList.add('active');
    }
  }

  initScrollHandler() {
    if (!this.headerContainer) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDifference = Math.abs(currentScrollY - this.lastScrollY);

          // Only trigger if scroll difference is above threshold
          if (scrollDifference > this.scrollThreshold) {
            // Don't hide header if menu is open
            if (this.menuDrawer?.getAttribute('aria-hidden') === 'false') {
              this.lastScrollY = currentScrollY;
              ticking = false;
              return;
            }

            if (currentScrollY > this.lastScrollY && currentScrollY > 50) {
              // Scrolling down - hide header
              this.headerContainer.classList.add('header-hidden');
            } else if (currentScrollY < this.lastScrollY) {
              // Scrolling up - show header
              this.headerContainer.classList.remove('header-hidden');
            }

            this.lastScrollY = currentScrollY;
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }
}

// Convert numbers to superscript
function convertToSuperscript(num) {
  const superscriptMap = {
    0: '⁰',
    1: '¹',
    2: '²',
    3: '³',
    4: '⁴',
    5: '⁵',
    6: '⁶',
    7: '⁷',
    8: '⁸',
    9: '⁹',
  };

  const numStr = num.toString();
  let result = '';

  // If single digit, pad with leading zero
  if (numStr.length === 1) {
    result = '⁰' + superscriptMap[numStr];
  } else {
    // Convert each digit
    for (let i = 0; i < numStr.length; i++) {
      result += superscriptMap[numStr[i]] || numStr[i];
    }
  }

  return result;
}

// Convert all count numbers to superscript
function convertCountsToSuperscript() {
  const countElements = document.querySelectorAll('.mobile-menu-link-count[data-count]');
  countElements.forEach((el) => {
    const count = parseInt(el.getAttribute('data-count'), 10);
    if (!isNaN(count)) {
      el.textContent = convertToSuperscript(count);
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MobileHeader();
    convertCountsToSuperscript();
  });
} else {
  new MobileHeader();
  convertCountsToSuperscript();
}
