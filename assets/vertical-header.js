/**
 * Vertical Sidebar Header Handler
 * Manages header visibility and main content adjustment
 */

(function () {
  function checkHeaderVisibility() {
    const desktopHeader = document.querySelector('.vertical-sidebar-header');
    const body = document.body;

    if (desktopHeader && window.innerWidth >= 1025) {
      // Header exists and we're on desktop
      body.classList.remove('header-disabled');
    } else {
      // Header doesn't exist or we're on mobile
      body.classList.add('header-disabled');
    }
  }

  function initActionButtonHover() {
    const actionRows = document.querySelectorAll('.vertical-sidebar-actions-row');

    actionRows.forEach((row) => {
      const buttons = Array.from(row.querySelectorAll('.header-action-button'));

      if (buttons.length === 0) return;

      const isMultipleButtons = buttons.length > 1;

      buttons.forEach((button) => {
        button.addEventListener('mouseenter', () => {
          if (isMultipleButtons) {
            button.classList.add('is-expanded-horizontal');

            // Shrink adjacent buttons
            buttons.forEach((otherButton) => {
              if (otherButton !== button) {
                otherButton.classList.add('is-shrunk-horizontal');
              }
            });
          } else {
            // Vertical expansion for single button (like nav items)
            button.classList.add('is-expanded-vertical');
          }
        });

        button.addEventListener('mouseleave', () => {
          if (isMultipleButtons) {
            // Reset horizontal expansion
            button.classList.remove('is-expanded-horizontal');
            buttons.forEach((otherButton) => {
              otherButton.classList.remove('is-shrunk-horizontal');
            });
          } else {
            // Reset vertical expansion
            button.classList.remove('is-expanded-vertical');
          }
        });
      });
    });
  }

  // Check on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkHeaderVisibility();
      initActionButtonHover();
    });
  } else {
    checkHeaderVisibility();
    initActionButtonHover();
  }

  // Check on resize (to handle mobile/desktop transitions)
  let resizeTimer;
  window.addEventListener(
    'resize',
    function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkHeaderVisibility, 100);
    },
    { passive: true },
  );

  // Watch for header changes (for theme editor)
  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    const observer = new MutationObserver(function (mutations) {
      checkHeaderVisibility();
      initActionButtonHover();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Theme Toggle
  function initThemeToggle() {
    const toggles = Array.from(document.querySelectorAll('.header-theme-toggle'));
    if (!toggles.length) return;

    const darkScheme = toggles[0].dataset.darkScheme;
    const STORAGE_KEY = 'global-theme-scheme';

    function applyMode(mode) {
      const isDark = mode === 'dark';
      toggles.forEach(function (toggle) {
        toggle.setAttribute('data-mode', isDark ? 'dark' : 'light');
        toggle.querySelector('.header-theme-toggle__btn').setAttribute('aria-checked', isDark ? 'true' : 'false');
      });

      if (isDark) {
        document.documentElement.setAttribute('data-global-theme-active', 'true');
        document.documentElement.setAttribute('data-active-scheme', darkScheme);
        localStorage.setItem(STORAGE_KEY, darkScheme);
      } else {
        document.documentElement.removeAttribute('data-global-theme-active');
        document.documentElement.removeAttribute('data-active-scheme');
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Restore saved state
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === darkScheme) {
      applyMode('dark');
    }

    toggles.forEach(function (toggle) {
      toggle.querySelector('.header-theme-toggle__btn').addEventListener('click', function () {
        applyMode(toggle.getAttribute('data-mode') === 'dark' ? 'light' : 'dark');
      });
    });
  }

  initThemeToggle();
})();
