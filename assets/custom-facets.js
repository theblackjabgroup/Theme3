// Custom Facets JavaScript - Dropdowns + Drawer buttons (Filters, Sort)
(function () {
  const DRAWER_ANIMATION_DURATION = 600;

  function closeDrawerWithAnimation(details) {
    if (!details || !details.open) return;
    details.classList.add('facets-drawer--closing');
    setTimeout(() => {
      details.removeAttribute('open');
      details.classList.remove('facets-drawer--closing', 'facets-drawer--open');
      if (!document.querySelector('.facets-drawer[open]')) {
        document.body.classList.remove('facets-drawer-open', 'overflow-hidden');
      }
    }, DRAWER_ANIMATION_DURATION);
  }

  function setupDrawerBehavior() {
    const drawerDetails = document.querySelectorAll('.facets-drawer');

    drawerDetails.forEach((details) => {
      if (details.dataset.drawerListener === 'true') return;
      details.dataset.drawerListener = 'true';

      // When this drawer opens, close the other drawer, add open class for entry animation, add body class for blur
      details.addEventListener('toggle', function () {
        if (this.open) {
          this.classList.add('facets-drawer--open');
          document.body.classList.add('facets-drawer-open', 'overflow-hidden');
          document.querySelectorAll('.facets-drawer').forEach((other) => {
            if (other !== this && other.open) closeDrawerWithAnimation(other);
          });
        } else {
          this.classList.remove('facets-drawer--open');
          if (!document.querySelector('.facets-drawer[open]')) {
            document.body.classList.remove('facets-drawer-open', 'overflow-hidden');
          }
        }
      });

      // Summary click when open: prevent default close and run exit animation
      const summary = details.querySelector('.facets-drawer-trigger');
      if (summary) {
        summary.addEventListener('click', (e) => {
          if (details.open) {
            e.preventDefault();
            closeDrawerWithAnimation(details);
          }
        });
      }

      // Close button: close with exit animation
      const closeBtn = details.querySelector('.facets-drawer__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          closeDrawerWithAnimation(details);
        });
      }
    });

    // Filters drawer APPLY button: submit form then close drawer
    document.querySelectorAll('.facets-drawer--filters .facets-drawer__apply-button').forEach((btn) => {
      if (btn.classList.contains('facets-drawer__apply-button--sort')) return;
      if (btn.dataset.applyListener === 'true') return;
      btn.dataset.applyListener = 'true';
      btn.addEventListener('click', () => {
        const drawer = btn.closest('.facets-drawer');
        if (drawer) setTimeout(() => closeDrawerWithAnimation(drawer), 300);
      });
    });

    // Sort drawer apply button: close the drawer
    document.querySelectorAll('.facets-drawer__apply-button--sort').forEach((btn) => {
      if (btn.dataset.applySortListener === 'true') return;
      btn.dataset.applySortListener = 'true';
      btn.addEventListener('click', () => {
        const drawer = btn.closest('.facets-drawer');
        if (drawer) closeDrawerWithAnimation(drawer);
      });
    });

    // Sort option buttons: set select value, submit form, close drawer with animation
    document.querySelectorAll('.facets-drawer__sort-option').forEach((btn) => {
      if (btn.dataset.sortListener === 'true') return;
      btn.dataset.sortListener = 'true';
      btn.addEventListener('click', function () {
        const value = this.getAttribute('data-sort-value');
        const form = this.closest('form');
        const select = form && form.querySelector('#SortBy');
        const drawer = this.closest('.facets-drawer');
        if (select && value) {
          select.value = value;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          if (drawer) closeDrawerWithAnimation(drawer);
        }
      });
    });

    // Drawer tags: ensure Clear all and cross (remove) buttons work – delegated on filter drawer panel (capture so we run first)
    document.querySelectorAll('.facets-drawer--filters .facets-drawer__panel').forEach((panel) => {
      if (panel.dataset.tagsClickBound === 'true') return;
      panel.dataset.tagsClickBound = 'true';
      panel.addEventListener('click', function (e) {
        const link = e.target.closest('a[href]');
        if (!link || !link.closest('.facets-drawer__active-filters')) return;
        const isClearAll = link.classList.contains('facets__reset');
        const isTagRemove = link.classList.contains('active-facets__button');
        if (!isClearAll && !isTagRemove) return;
        e.preventDefault();
        e.stopPropagation();
        if (typeof FacetFiltersForm !== 'undefined') {
          const url = link.href && link.href.indexOf('?') !== -1
            ? link.href.slice(link.href.indexOf('?') + 1)
            : '';
          FacetFiltersForm.toggleActiveFacets && FacetFiltersForm.toggleActiveFacets();
          FacetFiltersForm.renderPage(url);
        }
      }, true);
    });
  }

  function setupPriceSliderSync() {
    document.querySelectorAll('price-range .price-facet-slider').forEach((sliderEl) => {
      if (sliderEl.dataset.sliderBound === 'true') return;
      sliderEl.dataset.sliderBound = 'true';

      const priceRangeEl = sliderEl.closest('price-range');
      const minRange = sliderEl.querySelector('.price-facet-slider__input--min');
      const maxRange = sliderEl.querySelector('.price-facet-slider__input--max');
      const minInput = priceRangeEl?.querySelector('.price-facet-input-min');
      const maxInput = priceRangeEl?.querySelector('.price-facet-input-max');
      const maxCents = Number(sliderEl.dataset.priceRangeMax) || 0;

      if (!minRange || !maxRange || !minInput || !maxInput || !maxCents) return;

      function centsToDisplay(cents) {
        return (cents / 100).toFixed(2).replace(/\.?0+$/, '') || '0';
      }
      function displayToCents(val) {
        const n = parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0;
        return Math.round(Math.max(0, Math.min(maxCents, n * 100)));
      }

      function updateMinInput() {
        const v = Math.min(Number(minRange.value), Number(maxRange.value));
        minRange.value = v;
        minInput.value = centsToDisplay(v);
        minInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      function updateMaxInput() {
        const v = Math.max(Number(maxRange.value), Number(minRange.value));
        maxRange.value = v;
        maxInput.value = centsToDisplay(v);
        maxInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      function syncMinFromInput() {
        const raw = String(minInput.value).trim();
        if (raw === '') return;
        const cents = displayToCents(minInput.value);
        minRange.value = Math.min(cents, Number(maxRange.value));
      }
      function syncMaxFromInput() {
        const raw = String(maxInput.value).trim();
        if (raw === '') return;
        const cents = displayToCents(maxInput.value);
        maxRange.value = Math.max(cents, Number(minRange.value) || 0);
      }

      minRange.addEventListener('input', updateMinInput);
      minRange.addEventListener('change', updateMinInput);
      maxRange.addEventListener('input', updateMaxInput);
      maxRange.addEventListener('change', updateMaxInput);
      minInput.addEventListener('input', syncMinFromInput);
      minInput.addEventListener('change', syncMinFromInput);
      maxInput.addEventListener('input', syncMaxFromInput);
      maxInput.addEventListener('change', syncMaxFromInput);

      /* Initial sync from inputs to sliders only when inputs have values (e.g. after filter applied).
         When empty (no price filter), leave sliders at Liquid-rendered values to avoid resetting max to 0. */
      syncMinFromInput();
      syncMaxFromInput();
    });
  }

  function setupDropdownBehavior() {
    const facetDisclosures = document.querySelectorAll('.facets__disclosure');

    facetDisclosures.forEach((disclosure) => {
      if (disclosure.dataset.dropdownListener === 'true') return;
      disclosure.dataset.dropdownListener = 'true';

      disclosure.addEventListener('toggle', function () {
        if (this.open) {
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

  function init() {
    setupDrawerBehavior();
    setupDropdownBehavior();
    setupPriceSliderSync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  if (typeof FacetFiltersForm !== 'undefined') {
    const originalRenderFilters = FacetFiltersForm.renderFilters;
    FacetFiltersForm.renderFilters = function (html, event) {
      originalRenderFilters.call(this, html, event);
      setTimeout(function () {
        init();
        setupPriceSliderSync();
      }, 100);
    };
  }

  // Listen for mutations so filters/drawers added dynamically get behavior bound
  let debounceTimer;
  function isRelevantNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    return (
      node.classList?.contains('facets__disclosure') ||
      node.classList?.contains('facets-drawer') ||
      node.querySelector?.('.facets__disclosure') ||
      node.querySelector?.('.facets-drawer')
    );
  }
  const observer = new MutationObserver(function (mutations) {
    const hasRelevantMutation = mutations.some((mutation) => {
      for (const node of [...mutation.addedNodes, ...mutation.removedNodes]) {
        if (isRelevantNode(node)) return true;
      }
      return false;
    });
    if (hasRelevantMutation) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(init, 100);
    }
  });

  const facetsContainer = document.querySelector('.facets-container');
  const targetElement = facetsContainer || document.body;
  if (targetElement) {
    observer.observe(targetElement, { childList: true, subtree: true });
  }
})();
