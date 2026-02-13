// Custom Facets JavaScript - FacetFiltersForm, PriceRange, FacetRemove + Dropdowns + Drawer
(function () {
  function debounceWithCancel(fn, wait) {
    let timer;
    const debounced = function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
    debounced.cancel = function () {
      clearTimeout(timer);
      timer = null;
    };
    return debounced;
  }

  class FacetFiltersForm extends HTMLElement {
    constructor() {
      super();
      this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

      this.debouncedOnSubmit = debounceWithCancel((event) => {
        this.onSubmitHandler(event);
      }, 800);

      const facetForm = this.querySelector('form');
      if (facetForm) {
        facetForm.addEventListener('input', this.debouncedOnSubmit.bind(this));
        facetForm.addEventListener('submit', (e) => {
          this.debouncedOnSubmit.cancel();
          this.onSubmitHandler(e);
        });
      }

      const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
      if (facetWrapper && typeof onKeyUpEscape === 'function') {
        facetWrapper.addEventListener('keyup', onKeyUpEscape);
      }
    }

    static setListeners() {
      const onHistoryChange = (event) => {
        const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
        if (searchParams === FacetFiltersForm.searchParamsPrev) return;
        FacetFiltersForm.renderPage(searchParams, null, false);
      };
      window.addEventListener('popstate', onHistoryChange);
    }

    static toggleActiveFacets(disable = true) {
      document.querySelectorAll('facet-remove, .js-facet-remove').forEach((element) => {
        element.classList.toggle('disabled', disable);
      });
    }

    static renderPage(searchParams, event, updateURLHash = true) {
      FacetFiltersForm.searchParamsPrev = searchParams;
      const sections = FacetFiltersForm.getSections();
      if (!sections.length) return;

      const gridContainer = document.getElementById('ProductGridContainer');
      const collectionEl = gridContainer?.querySelector('.collection');
      const countContainer = document.getElementById('ProductCount');
      const countContainerDesktop = document.getElementById('ProductCountDesktop');
      const loadingSpinners = document.querySelectorAll(
        '.facets-container .loading__spinner, facet-filters-form .loading__spinner',
      );
      loadingSpinners.forEach((spinner) => spinner.classList.remove('hidden'));
      if (collectionEl) collectionEl.classList.add('loading');
      if (countContainer) countContainer.classList.add('loading');
      if (countContainerDesktop) countContainerDesktop.classList.add('loading');

      sections.forEach((section) => {
        const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
        const filterDataUrl = (element) => element.url === url;

        FacetFiltersForm.filterData.some(filterDataUrl)
          ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
          : FacetFiltersForm.renderSectionFromFetch(url, event);
      });

      if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
    }

    static renderSectionFromFetch(url, event) {
      fetch(url)
        .then((response) => response.text())
        .then((responseText) => {
          const html = responseText;
          FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
          FacetFiltersForm.renderFilters(html, event);
          FacetFiltersForm.renderProductGridContainer(html);
          FacetFiltersForm.renderProductCount(html);
          if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
        });
    }

    static renderSectionFromCache(filterDataUrl, event) {
      const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
      FacetFiltersForm.renderFilters(html, event);
      FacetFiltersForm.renderProductGridContainer(html);
      FacetFiltersForm.renderProductCount(html);
      if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
    }

    static renderProductGridContainer(html) {
      const container = document.getElementById('ProductGridContainer');
      const parsed = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductGridContainer');
      if (!container || !parsed) return;
      container.innerHTML = parsed.innerHTML;
      container.querySelectorAll('.scroll-trigger').forEach((element) => {
        element.classList.add('scroll-trigger--cancel');
      });
    }

    static renderProductCount(html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const count = parsed.getElementById('ProductCount')?.innerHTML;
      if (count == null) return;
      const container = document.getElementById('ProductCount');
      const containerDesktop = document.getElementById('ProductCountDesktop');
      if (container) {
        container.innerHTML = count;
        container.classList.remove('loading');
      }
      if (containerDesktop) {
        containerDesktop.innerHTML = count;
        containerDesktop.classList.remove('loading');
      }
      document.querySelectorAll(
        '.facets-container .loading__spinner, facet-filters-form .loading__spinner',
      ).forEach((spinner) => spinner.classList.add('hidden'));
    }

    static renderFilters(html, event) {
      const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
      const facetDetailsElementsFromFetch = parsedHTML.querySelectorAll(
        '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter',
      );
      const facetDetailsElementsFromDom = document.querySelectorAll(
        '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter',
      );

      Array.from(facetDetailsElementsFromDom).forEach((currentElement) => {
        if (!Array.from(facetDetailsElementsFromFetch).some(({ id }) => currentElement.id === id)) {
          currentElement.remove();
        }
      });

      const matchesId = (element) => {
        const jsFilter = event?.target?.closest?.('.js-filter');
        return jsFilter ? element.id === jsFilter.id : false;
      };

      const facetsToRender = Array.from(facetDetailsElementsFromFetch).filter((element) => !matchesId(element));
      const countsToRender = Array.from(facetDetailsElementsFromFetch).find(matchesId);

      facetsToRender.forEach((elementToRender, index) => {
        const currentElement = document.getElementById(elementToRender.id);
        if (currentElement) {
          currentElement.innerHTML = elementToRender.innerHTML;
        } else {
          if (index > 0) {
            const { className: previousElementClassName, id: previousElementId } = facetsToRender[index - 1];
            if (elementToRender.className === previousElementClassName) {
              document.getElementById(previousElementId)?.after(elementToRender);
              return;
            }
          }
          const parent = elementToRender.parentElement;
          if (parent) {
            const insertBefore = document.querySelector(`#${parent.id} .js-filter`);
            if (insertBefore) insertBefore.before(elementToRender);
          }
        }
      });

      FacetFiltersForm.renderActiveFacets(parsedHTML);
      FacetFiltersForm.renderAdditionalElements(parsedHTML);

      if (countsToRender && event?.target?.closest?.('.js-filter')) {
        const closestJSFilterID = event.target.closest('.js-filter').id;
        if (closestJSFilterID) {
          FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
          FacetFiltersForm.renderMobileCounts(countsToRender, document.getElementById(closestJSFilterID));

          const newFacetDetailsElement = document.getElementById(closestJSFilterID);
          const newElementSelector = newFacetDetailsElement?.classList?.contains('mobile-facets__details')
            ? '.mobile-facets__close-button'
            : '.facets__summary';
          const newElementToActivate = newFacetDetailsElement?.querySelector(newElementSelector);
          const isTextInput = event.target.getAttribute('type') === 'text';
          if (newElementToActivate && !isTextInput) newElementToActivate.focus();
        }
      }
    }

    static renderActiveFacets(html) {
      const activeFacetElementSelectors = [
        '.active-facets-mobile',
        '.active-facets-desktop',
        '.facets-drawer__active-facets-container',
      ];
      activeFacetElementSelectors.forEach((selector) => {
        const activeFacetsElement = html.querySelector(selector);
        const current = document.querySelector(selector);
        if (activeFacetsElement && current) current.innerHTML = activeFacetsElement.innerHTML;
      });
      FacetFiltersForm.toggleActiveFacets(false);
    }

    static renderAdditionalElements(html) {
      const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];
      mobileElementSelectors.forEach((selector) => {
        const source = html.querySelector(selector);
        const current = document.querySelector(selector);
        if (source && current) current.innerHTML = source.innerHTML;
      });
      const menuDrawer = document.getElementById('FacetFiltersFormMobile')?.closest?.('menu-drawer');
      if (menuDrawer && typeof menuDrawer.bindEvents === 'function') menuDrawer.bindEvents();
    }

    static renderCounts(source, target) {
      const targetSummary = target?.querySelector('.facets__summary');
      const sourceSummary = source?.querySelector('.facets__summary');
      if (sourceSummary && targetSummary) targetSummary.outerHTML = sourceSummary.outerHTML;

      const targetHeaderElement = target?.querySelector('.facets__header');
      const sourceHeaderElement = source?.querySelector('.facets__header');
      if (sourceHeaderElement && targetHeaderElement) targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;

      const targetWrapElement = target?.querySelector('.facets-wrap');
      const sourceWrapElement = source?.querySelector('.facets-wrap');
      if (sourceWrapElement && targetWrapElement) {
        const isShowingMore = Boolean(target.querySelector('show-more-button .label-show-more.hidden'));
        if (isShowingMore) {
          sourceWrapElement
            .querySelectorAll('.facets__item.hidden')
            .forEach((hiddenItem) => hiddenItem.classList.replace('hidden', 'show-more-item'));
        }
        targetWrapElement.outerHTML = sourceWrapElement.outerHTML;
      }
    }

    static renderMobileCounts(source, target) {
      const targetFacetsList = target?.querySelector('.mobile-facets__list');
      const sourceFacetsList = source?.querySelector('.mobile-facets__list');
      if (sourceFacetsList && targetFacetsList) targetFacetsList.outerHTML = sourceFacetsList.outerHTML;
    }

    static updateURLHash(searchParams) {
      history.pushState(
        { searchParams },
        '',
        `${window.location.pathname}${searchParams ? '?'.concat(searchParams) : ''}`,
      );
    }

    static getSections() {
      const productGridContainer = document.getElementById('ProductGridContainer');
      let productGrid = null;
      if (productGridContainer) {
        productGrid = productGridContainer.querySelector('.product-grid[data-id]')
          || productGridContainer.querySelector('[id^="product-grid-"][data-id]');
      }
      if (!productGrid) productGrid = document.getElementById('product-grid');
      if (!productGrid?.dataset?.id) return [];
      return [{ section: productGrid.dataset.id }];
    }

    createSearchParams(form) {
      const formData = new FormData(form);
      return new URLSearchParams(formData).toString();
    }

    onSubmitForm(searchParams, event) {
      FacetFiltersForm.renderPage(searchParams, event);
    }

    onSubmitHandler(event) {
      event.preventDefault();
      const sortFilterForms = document.querySelectorAll('facet-filters-form form');
      if (event.target?.className === 'mobile-facets__checkbox') {
        const form = event.target.closest('form');
        if (form) this.onSubmitForm(this.createSearchParams(form), event);
      } else {
        const isMobile = event.target?.closest?.('form')?.id === 'FacetFiltersFormMobile';
        const forms = [];
        sortFilterForms.forEach((form) => {
          if (!isMobile) {
            if (['FacetSortForm', 'FacetFiltersForm', 'FacetSortDrawerForm'].includes(form.id)) {
              forms.push(this.createSearchParams(form));
            }
          } else if (form.id === 'FacetFiltersFormMobile') {
            forms.push(this.createSearchParams(form));
          }
        });
        this.onSubmitForm(forms.join('&'), event);
      }
    }

    onActiveFilterClick(event) {
      event.preventDefault();
      FacetFiltersForm.toggleActiveFacets();
      const url =
        event.currentTarget?.href?.indexOf('?') === -1
          ? ''
          : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
      FacetFiltersForm.renderPage(url);
    }
  }

  FacetFiltersForm.filterData = [];
  FacetFiltersForm.searchParamsInitial = typeof window !== 'undefined' ? window.location.search.slice(1) : '';
  FacetFiltersForm.searchParamsPrev = FacetFiltersForm.searchParamsInitial;
  customElements.define('facet-filters-form', FacetFiltersForm);
  FacetFiltersForm.setListeners();

  class PriceRange extends HTMLElement {
    constructor() {
      super();
      this.querySelectorAll('input').forEach((element) => {
        element.addEventListener('change', this.onRangeChange.bind(this));
        element.addEventListener('keydown', this.onKeyDown.bind(this));
      });
      this.setMinAndMaxValues();
    }

    onRangeChange(event) {
      this.adjustToValidValues(event.currentTarget);
      this.setMinAndMaxValues();
    }

    onKeyDown(event) {
      if (event.metaKey) return;
      const pattern = /[0-9]|\.|,|'| |Tab|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Delete|Escape/;
      if (!event.key.match(pattern)) event.preventDefault();
    }

    setMinAndMaxValues() {
      const inputs = this.querySelectorAll('input');
      const minInput = inputs[0];
      const maxInput = inputs[1];
      if (!minInput || !maxInput) return;
      if (maxInput.value) minInput.setAttribute('data-max', maxInput.value);
      if (minInput.value) maxInput.setAttribute('data-min', minInput.value);
      if (minInput.value === '') maxInput.setAttribute('data-min', '0');
      if (maxInput.value === '') maxInput.setAttribute('data-max', maxInput.getAttribute('data-max') || '');
    }

    adjustToValidValues(input) {
      const value = Number(input.value);
      const min = Number(input.getAttribute('data-min'));
      const max = Number(input.getAttribute('data-max'));
      if (value < min) input.value = min;
      if (value > max) input.value = max;
    }
  }

  customElements.define('price-range', PriceRange);

  class FacetRemove extends HTMLElement {
    connectedCallback() {
      const facetLink = this.querySelector('a');
      if (!facetLink || this._linkBound) return;
      this._linkBound = true;
      facetLink.setAttribute('role', 'button');
      facetLink.addEventListener('click', this.closeFilter.bind(this));
      facetLink.addEventListener('keyup', (event) => {
        event.preventDefault();
        if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
      });
    }

    closeFilter(event) {
      event.preventDefault();
      const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
      if (form?.onActiveFilterClick) form.onActiveFilterClick(event);
    }
  }

  customElements.define('facet-remove', FacetRemove);

  // --- Drawer, dropdown and price slider sync (UI behavior) ---
  const DRAWER_ANIMATION_DURATION = 600;
  const DRAWER_CLOSE_TIMEOUT_KEY = '_drawerCloseTimeoutId';

  function closeDrawerWithAnimation(details) {
    if (!details || !details.open) return;
    if (details[DRAWER_CLOSE_TIMEOUT_KEY] != null) {
      clearTimeout(details[DRAWER_CLOSE_TIMEOUT_KEY]);
      details[DRAWER_CLOSE_TIMEOUT_KEY] = null;
    }
    details.classList.add('facets-drawer--closing');
    details[DRAWER_CLOSE_TIMEOUT_KEY] = setTimeout(() => {
      details[DRAWER_CLOSE_TIMEOUT_KEY] = null;
      if (!details.classList.contains('facets-drawer--closing')) return;
      details.removeAttribute('open');
      details.classList.remove('facets-drawer--closing', 'facets-drawer--open');
      if (!document.querySelector('.facets-drawer[open]')) {
        document.body.classList.remove('facets-drawer-open', 'overflow-hidden');
      }
    }, DRAWER_ANIMATION_DURATION);
  }

  function cancelDrawerCloseTimeout(details) {
    if (details[DRAWER_CLOSE_TIMEOUT_KEY] != null) {
      clearTimeout(details[DRAWER_CLOSE_TIMEOUT_KEY]);
      details[DRAWER_CLOSE_TIMEOUT_KEY] = null;
    }
  }

  function setupDrawerBehavior() {
    const drawerDetails = document.querySelectorAll('.facets-drawer');

    drawerDetails.forEach((details) => {
      if (details.dataset.drawerListener === 'true') return;
      details.dataset.drawerListener = 'true';

      // When this drawer opens, close the other drawer, add open class for entry animation, add body class for blur
      details.addEventListener('toggle', function () {
        if (this.open) {
          cancelDrawerCloseTimeout(this);
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

    // Click overlay/backdrop (outside panel) to close drawer – like cart drawer
    if (!document.body.dataset.facetsOverlayClick) {
      document.body.dataset.facetsOverlayClick = 'true';
      document.addEventListener('click', function (e) {
        if (!document.body.classList.contains('facets-drawer-open')) return;
        if (e.target.closest('.facets-drawer__panel')) return;
        if (e.target.closest('.facets-drawer-trigger')) return;
        const openDrawer = document.querySelector('.facets-drawer[open]');
        if (openDrawer) closeDrawerWithAnimation(openDrawer);
      }, true);
    }

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
        const s = String(val).trim().replace(/\s/g, '');
        if (!s) return 0;
        const lastComma = s.lastIndexOf(',');
        const lastDot = s.lastIndexOf('.');
        const lastSep = lastComma > lastDot ? lastComma : lastDot;
        let normalized;
        if (lastSep === -1) {
          normalized = s.replace(/[^0-9]/g, '') || '0';
        } else {
          const intPart = s.slice(0, lastSep).replace(/[^0-9]/g, '') || '0';
          const decPart = s.slice(lastSep + 1).replace(/[^0-9]/g, '');
          normalized = decPart ? intPart + '.' + decPart : intPart;
        }
        const n = parseFloat(normalized) || 0;
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
      setTimeout(init, 100);
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
