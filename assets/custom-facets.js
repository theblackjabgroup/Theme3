// Custom Facets JavaScript - Close other dropdowns when one opens
(function() {
  function setupDropdownBehavior() {
    const facetDisclosures = document.querySelectorAll('.facets__disclosure');
    
    facetDisclosures.forEach(disclosure => {
      // Remove existing listeners by checking if already processed
      if (disclosure.dataset.dropdownListener === 'true') {
        return;
      }
      
      disclosure.dataset.dropdownListener = 'true';
      
      disclosure.addEventListener('toggle', function() {
        if (this.open) {
          // Close all other dropdowns
          const allDisclosures = document.querySelectorAll('.facets__disclosure');
          allDisclosures.forEach(otherDisclosure => {
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
    FacetFiltersForm.renderFilters = function(html, event) {
      originalRenderFilters.call(this, html, event);
      
      // Re-attach the close-other-dropdowns behavior after a short delay
      setTimeout(setupDropdownBehavior, 100);
    };
  }
  
  // Also listen for mutations in case filters are added dynamically
  const observer = new MutationObserver(function(mutations) {
    setupDropdownBehavior();
  });
  
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
