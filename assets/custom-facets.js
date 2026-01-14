// Custom Facets JavaScript - Close other dropdowns when one opens
(function () {
  function setupDropdownBehavior() {
    const facetDisclosures = document.querySelectorAll('.facets__disclosure');

    facetDisclosures.forEach((disclosure) => {
      // Remove existing listeners by checking if already processed
      if (disclosure.dataset.dropdownListener === 'true') {
        return;
      }

      disclosure.dataset.dropdownListener = 'true';

      disclosure.addEventListener('toggle', function () {
        if (this.open) {
          // Close all other dropdowns
          const allDisclosures = document.querySelectorAll('.facets__disclosure');
          allDisclosures.forEach((otherDisclosure) => {
            if (otherDisclosure !== this && otherDisclosure.open) {
              otherDisclosure.open = false;
            }
          });
        }
      });
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDropdownBehavior);
  } else {
    setupDropdownBehavior();
  }

  // Re-run when filters are updated via AJAX
  if (typeof FacetFiltersForm !== 'undefined') {
    const originalRenderFilters = FacetFiltersForm.renderFilters;
    FacetFiltersForm.renderFilters = function (html, event) {
      originalRenderFilters.call(this, html, event);

      // Re-attach the close-other-dropdowns behavior after a short delay
      setTimeout(setupDropdownBehavior, 100);
    };
  }

  // Also listen for mutations in case filters are added dynamically
  // Only observe the facets container to avoid unnecessary overhead
  let debounceTimer;
  const observer = new MutationObserver(function (mutations) {
    // Check if any mutation actually affects facet disclosures
    const hasRelevantMutation = mutations.some((mutation) => {
      // Check added nodes
      if (mutation.addedNodes.length > 0) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a disclosure or contains one
            if (node.classList?.contains('facets__disclosure') || node.querySelector?.('.facets__disclosure')) {
              return true;
            }
          }
        }
      }
      // Check removed nodes (in case disclosures are removed and re-added)
      if (mutation.removedNodes.length > 0) {
        for (let node of mutation.removedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList?.contains('facets__disclosure') || node.querySelector?.('.facets__disclosure')) {
              return true;
            }
          }
        }
      }
      return false;
    });

    // Only run setup if there's a relevant mutation
    if (hasRelevantMutation) {
      // Debounce to avoid running too frequently
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(setupDropdownBehavior, 100);
    }
  });

  // Only observe the facets container if it exists, otherwise observe body but with better filtering
  const facetsContainer = document.querySelector('.facets-container');
  const targetElement = facetsContainer || document.body;

  if (targetElement) {
    observer.observe(targetElement, {
      childList: true,
      subtree: true,
    });
  }
})();
