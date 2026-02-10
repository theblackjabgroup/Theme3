// Mega Menu Functionality
document.addEventListener('DOMContentLoaded', function () {
  const megaMenuTriggers = document.querySelectorAll('[data-mega-menu-trigger]');
  const megaMenus = document.querySelectorAll('[data-mega-menu]');
  const dockMenu = document.querySelector('.dock-menu');
  const dockLinks = document.querySelectorAll('.dock-link');
  let isTriggerClick = false;

  // Delay (ms) for menu exit transform – keep overlay/blur until after this to avoid lag
  const MEGA_MENU_EXIT_DURATION = 1200;

  // Close all mega menus
  function closeAllMegaMenus(skipStateCheck = false) {
    megaMenuTriggers.forEach((trigger) => {
      trigger.setAttribute('aria-expanded', 'false');
    });

    megaMenus.forEach((menu) => {
      menu.setAttribute('aria-hidden', 'true');
    });

    // Defer body class removal until after exit animation so overlay/blur don't animate during transform (avoids lag)
    if (!skipStateCheck) {
      setTimeout(checkMegaMenuState, MEGA_MENU_EXIT_DURATION);
    }
  }

  // Check if any mega menu is open
  function checkMegaMenuState() {
    const isAnyOpen = Array.from(megaMenus).some((menu) => menu.getAttribute('aria-hidden') === 'false');
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
      e.stopImmediatePropagation();

      // Set flag to prevent click-outside handler from interfering
      isTriggerClick = true;
      setTimeout(() => {
        isTriggerClick = false;
      }, 200);

      const menuId = this.getAttribute('aria-controls');
      const menu = document.getElementById(menuId);
      if (!menu) {
        isTriggerClick = false;
        return;
      }

      // Get current state from the menu itself, not just the trigger
      const menuIsHidden = menu.getAttribute('aria-hidden') === 'true';
      const triggerIsExpanded = this.getAttribute('aria-expanded') === 'true';

      // If menu is visible or trigger says expanded, close it
      if (!menuIsHidden || triggerIsExpanded) {
        this.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        setTimeout(checkMegaMenuState, MEGA_MENU_EXIT_DURATION);
        return;
      }

      // Close all other menus first - do this synchronously to prevent race conditions
      megaMenuTriggers.forEach((otherTrigger) => {
        if (otherTrigger !== this) {
          otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });

      megaMenus.forEach((otherMenu) => {
        if (otherMenu !== menu) {
          otherMenu.setAttribute('aria-hidden', 'true');
        }
      });

      // Update state immediately after closing other menus
      checkMegaMenuState();

      // Open the clicked menu - do this synchronously to prevent race conditions
      this.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      checkMegaMenuState();

      // Focus search input when search popup opens – after entry animation (1.2s) to avoid layout jank
      if (menu.id === 'HeaderSearchPopup') {
        const searchInput = menu.querySelector('#HeaderSearchPopupInput');
        if (searchInput) {
          setTimeout(() => searchInput.focus(), 1300);
        }
      }
    });
  });

  // Close mega menu when clicking outside or on overlay
  document.addEventListener(
    'click',
    function (e) {
      // Don't close if this was a trigger click
      if (isTriggerClick) {
        return;
      }

      // Don't close if clicking on a trigger button
      if (e.target.closest('[data-mega-menu-trigger]')) {
        return;
      }

      // Check if any menu is actually open before closing
      const isAnyMenuOpen = Array.from(megaMenus).some((menu) => menu.getAttribute('aria-hidden') === 'false');

      if (!isAnyMenuOpen) {
        return; // No menu is open, nothing to close
      }

      // Close when clicking outside menu items and mega menu
      if (!e.target.closest('.dock-menu-item') && !e.target.closest('.mega-menu')) {
        closeAllMegaMenus();
      }

      // Close when clicking on overlay
      if (e.target.classList.contains('mega-menu-overlay')) {
        closeAllMegaMenus();
      }
    },
    true
  ); // Use capture phase to handle before other handlers

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
