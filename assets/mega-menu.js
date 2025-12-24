// Mega Menu Functionality
document.addEventListener('DOMContentLoaded', function () {
  const megaMenuTriggers = document.querySelectorAll('[data-mega-menu-trigger]');
  const megaMenus = document.querySelectorAll('[data-mega-menu]');
  const dockMenu = document.querySelector('.dock-menu');
  const dockLinks = document.querySelectorAll('.dock-link');

  // Close all mega menus
  function closeAllMegaMenus() {
    megaMenuTriggers.forEach((trigger) => {
      trigger.setAttribute('aria-expanded', 'false');
    });
    
    megaMenus.forEach((menu) => {
      menu.setAttribute('aria-hidden', 'true');
    });
    
    // Remove blur class after a short delay to allow closing animation to complete
    setTimeout(() => {
      checkMegaMenuState();
    }, 300);
  }

  // Check if any mega menu is open
  function checkMegaMenuState() {
    const isAnyOpen = Array.from(megaMenus).some(
      (menu) => menu.getAttribute('aria-hidden') === 'false'
    );
    if (isAnyOpen) {
      document.body.classList.add('mega-menu-open');
    } else {
      document.body.classList.remove('mega-menu-open');
    }
  }

  // Toggle mega menu
  megaMenuTriggers.forEach((trigger) => {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const menuId = this.getAttribute('aria-controls');
      const menu = document.getElementById(menuId);
      const isExpanded = this.getAttribute('aria-expanded') === 'true';

      // Close all menus first
      closeAllMegaMenus();

      // Toggle current menu
      if (!isExpanded) {
        this.setAttribute('aria-expanded', 'true');
        menu.setAttribute('aria-hidden', 'false');
        // Add blur class when menu opens
        checkMegaMenuState();
      }
    });
  });

  // Close mega menu when clicking outside
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dock-menu-item')) {
      closeAllMegaMenus();
    }
  });

  // Close mega menu on escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllMegaMenus();
    }
  });

  // Initialize all mega menus as hidden
  megaMenus.forEach((menu) => {
    menu.setAttribute('aria-hidden', 'true');
  });

  // ========== Animated Underline ==========
  if (dockMenu && dockLinks.length > 0) {
    // Move underline to link
    function moveUnderline(link) {
      const menuRect = dockMenu.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();

      const left = linkRect.left - menuRect.left;
      const width = linkRect.width;

      dockMenu.style.setProperty('--underline-left', `${left}px`);
      dockMenu.style.setProperty('--underline-width', `${width}px`);

      // Show underline
      dockMenu.classList.add('has-underline');
    }

    // Hide underline
    function hideUnderline() {
      dockMenu.classList.remove('has-underline');
    }

    // Add hover listeners to all dock links
    dockLinks.forEach((link) => {
      link.addEventListener('mouseenter', function () {
        moveUnderline(this);
      });
    });

    // Hide underline when leaving menu
    dockMenu.addEventListener('mouseleave', hideUnderline);
  }
});
