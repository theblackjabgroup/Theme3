/**
 * Vertical Sidebar Header Handler
 * Manages header visibility and main content adjustment
 */

(function () {
  function checkHeaderVisibility() {
    const desktopHeader = document.querySelector('.vertical-sidebar-header');
    const body = document.body;

    if (desktopHeader && window.innerWidth > 1024) {
      // Header exists and we're on desktop
      body.classList.remove('header-disabled');
    } else {
      // Header doesn't exist or we're on mobile
      body.classList.add('header-disabled');
    }
  }

  // Check on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkHeaderVisibility);
  } else {
    checkHeaderVisibility();
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
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
})();
