class MobileHeader {
  constructor() {
    this.menuToggle = document.querySelector('[data-mobile-menu-toggle]');
    this.menuDrawer = document.querySelector('[data-mobile-menu]');
    this.submenuToggles = document.querySelectorAll('[data-mobile-submenu-toggle]');
    
    if (this.menuToggle) {
      this.menuToggle.addEventListener('click', () => this.toggleMenu());
    }

    // Close menu when clicking outside
    if (this.menuDrawer) {
      this.menuDrawer.addEventListener('click', (e) => {
        if (e.target === this.menuDrawer) {
          this.closeMenu();
        }
      });
    }

    // Handle submenu toggles
    this.submenuToggles.forEach(toggle => {
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
    if (this.menuDrawer && this.menuToggle) {
      this.menuDrawer.setAttribute('aria-hidden', 'false');
      this.menuToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('mobile-menu-open');
      document.documentElement.classList.add('mobile-menu-open');
      document.body.style.overflow = 'hidden';
      
      // Open all submenus by default
      this.submenuToggles.forEach(toggle => {
        const parentLink = toggle.getAttribute('data-parent-link');
        const submenu = document.querySelector(`.mobile-submenu[data-parent="${parentLink}"]`);
        if (submenu) {
          toggle.classList.add('active');
          toggle.setAttribute('aria-expanded', 'true');
          submenu.classList.add('active');
        }
      });
    }
  }

  closeMenu() {
    if (this.menuDrawer && this.menuToggle) {
      this.menuDrawer.setAttribute('aria-hidden', 'true');
      this.menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-menu-open');
      document.documentElement.classList.remove('mobile-menu-open');
      document.body.style.overflow = '';
      
      // Close all submenus
      this.submenuToggles.forEach(toggle => {
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
    this.submenuToggles.forEach(otherToggle => {
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
}

// Convert numbers to superscript
function convertToSuperscript(num) {
  const superscriptMap = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹'
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
  countElements.forEach(el => {
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

