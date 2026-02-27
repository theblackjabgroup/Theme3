if (!customElements.get('localization-form')) {
  customElements.define(
    'localization-form',
    class LocalizationForm extends HTMLElement {
      constructor() {
        super();
        this.mql = window.matchMedia('(min-width: 750px)');
        this.header = document.querySelector('.header-wrapper');
        this.elements = {
          input: this.querySelector('input[name="locale_code"], input[name="country_code"]'),
          button: this.querySelector('button.localization-form__select'),
          panel: this.querySelector('.disclosure__list-wrapper'),
          search: this.querySelector('input[name="country_filter"], input[name="language_filter"]'),
          closeButton: this.querySelector('.country-selector__close-button'),
          resetButton: this.querySelector('.country-filter__reset-button'),
          searchIcon: this.querySelector('.country-filter__search-icon'),
          liveRegion: this.querySelector('.sr-search-results'),
        };
        if (!this.elements.button || !this.elements.panel || !this.elements.input) return;

        this.addEventListener('keyup', this.onContainerKeyUp.bind(this));
        this.addEventListener('keydown', this.onContainerKeyDown.bind(this));
        this.addEventListener('focusout', this.closeSelector.bind(this));
        this.elements.button.addEventListener('click', this.openSelector.bind(this));
        this.onDocumentClick = this.handleDocumentClick.bind(this);
        document.addEventListener('click', this.onDocumentClick);

        const overlay = this.querySelector('.country-selector__overlay');
        if (overlay) overlay.addEventListener('click', this.hidePanel.bind(this));

        if (this.elements.search) {
          this.elements.search.addEventListener('keyup', this.filterCountries.bind(this));
          this.elements.search.addEventListener('focus', this.onSearchFocus.bind(this));
          this.elements.search.addEventListener('blur', this.onSearchBlur.bind(this));
          this.elements.search.addEventListener('keydown', this.onSearchKeyDown.bind(this));
        }
        if (this.elements.closeButton) {
          this.elements.closeButton.addEventListener('click', this.hidePanel.bind(this));
        }
        if (this.elements.resetButton) {
          this.elements.resetButton.addEventListener('click', this.resetFilter.bind(this));
          this.elements.resetButton.addEventListener('mousedown', (event) => event.preventDefault());
        }

        this.addEventListener('click', (e) => {
          const link = e.target.closest('a[data-value]');
          if (link && this.contains(link)) {
            e.preventDefault();
            this.onItemClick({ currentTarget: link, preventDefault: () => e.preventDefault() });
          }
        });
      }

      disconnectedCallback() {
        if (this.onDocumentClick) {
          document.removeEventListener('click', this.onDocumentClick);
        }
      }

      handleDocumentClick(event) {
        if (!this.contains(event.target)) {
          this.hidePanel();
        }
      }

      hidePanel() {
        this.elements.button.setAttribute('aria-expanded', 'false');
        this.elements.panel.setAttribute('hidden', true);
        if (this.elements.search) {
          this.elements.search.value = '';
          this.filterCountries();
          this.elements.search.setAttribute('aria-activedescendant', '');
        }
        document.body.classList.remove('overflow-hidden-mobile');
        const menuDrawer = document.querySelector('.menu-drawer');
        if (menuDrawer) menuDrawer.classList.remove('country-selector-open');
        if (this.header) this.header.preventHide = false;
      }

      onContainerKeyDown(event) {
        const focusableItems = Array.from(this.querySelectorAll('a')).filter(
          (item) => !item.parentElement.classList.contains('hidden'),
        );
        let focusedItemIndex = focusableItems.findIndex((item) => item === document.activeElement);
        let itemToFocus;

        switch (event.code.toUpperCase()) {
          case 'ARROWUP':
            event.preventDefault();
            itemToFocus =
              focusedItemIndex > 0 ? focusableItems[focusedItemIndex - 1] : focusableItems[focusableItems.length - 1];
            itemToFocus.focus();
            break;
          case 'ARROWDOWN':
            event.preventDefault();
            itemToFocus =
              focusedItemIndex < focusableItems.length - 1 ? focusableItems[focusedItemIndex + 1] : focusableItems[0];
            itemToFocus.focus();
            break;
        }

        if (!this.elements.search) return;

        setTimeout(() => {
          focusedItemIndex = focusableItems.findIndex((item) => item === document.activeElement);
          if (focusedItemIndex > -1) {
            this.elements.search.setAttribute('aria-activedescendant', focusableItems[focusedItemIndex].id);
          } else {
            this.elements.search.setAttribute('aria-activedescendant', '');
          }
        });
      }

      onContainerKeyUp(event) {
        event.preventDefault();

        switch (event.code.toUpperCase()) {
          case 'ESCAPE':
            if (this.elements.button.getAttribute('aria-expanded') == 'false') return;
            this.hidePanel();
            event.stopPropagation();
            this.elements.button.focus();
            break;
          case 'SPACE':
            if (this.elements.button.getAttribute('aria-expanded') == 'true') return;
            this.openSelector();
            break;
        }
      }

      onItemClick(event) {
        event.preventDefault();
        const form = this.querySelector('form');
        this.elements.input.value = event.currentTarget.dataset.value;
        if (form) form.submit();
      }

      openSelector(event) {
        if (event) event.preventDefault();
        const isExpanded = this.elements.button.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
          this.hidePanel();
          return;
        }

        this.lazyLoadCountryList();

        this.elements.button.focus();
        this.elements.panel.removeAttribute('hidden');
        this.elements.button.setAttribute('aria-expanded', 'true');
        if (!document.body.classList.contains('overflow-hidden-tablet')) {
          document.body.classList.add('overflow-hidden-mobile');
        }
        if (this.elements.search && this.mql.matches) {
          this.elements.search.focus();
        }
        if (this.hasAttribute('data-prevent-hide') && this.header) {
          this.header.preventHide = true;
        }
        const menuDrawer = document.querySelector('.menu-drawer');
        if (menuDrawer) menuDrawer.classList.add('country-selector-open');
      }

      lazyLoadCountryList() {
        const list = this.querySelector('ul.countries');
        if (!list || list.hasAttribute('data-loaded')) return;
        const script = this.querySelector('script[id$="-country-data"]');
        if (!script) return;
        try {
          const data = JSON.parse(script.textContent);
          const current = script.getAttribute('data-current') || '';
          const showCurrencies = script.getAttribute('data-show-currencies') === 'true';
          const tpl = this.querySelector('.country-checkmark-tpl');
          const checkmarkHtml = tpl ? tpl.innerHTML : '';
          const currencyClass = showCurrencies ? '' : ' hidden';
          data.forEach((country) => {
            const isCurrent = country.iso_code === current;
            const li = document.createElement('li');
            li.className = 'disclosure__item';
            li.tabIndex = -1;
            const link = document.createElement('a');
            link.className = 'link link--text disclosure__link caption-large focus-inset';
            link.href = '#';
            if (isCurrent) link.setAttribute('aria-current', 'true');
            link.dataset.value = country.iso_code;
            link.id = country.name;
            link.innerHTML =
              `<span ${isCurrent ? '' : 'class="visibility-hidden"'}>${checkmarkHtml}</span>` +
              `<span class="country"><img src="${country.flag_url || ''}" loading="lazy" class="localization-flag" alt=""> ${country.name}</span>` +
              `<span class="localization-form__currency motion-reduce${currencyClass}">${country.currency.iso_code} ${country.currency.symbol}</span>`;
            li.appendChild(link);
            list.appendChild(li);
          });
          list.setAttribute('data-loaded', 'true');
        } catch (e) {
          console.warn('Localization: could not load country list', e);
        }
      }

      closeSelector(event) {
        if (!event) return;
        if (event.type === 'focusout') {
          // On mobile Safari/Chrome, tap focus transitions often emit focusout
          // with a null relatedTarget; treating that as outside causes instant close.
          if (!event.relatedTarget) return;
          if (!this.contains(event.relatedTarget)) {
            this.hidePanel();
          }
          return;
        }
      }

      normalizeString(str) {
        return str
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase();
      }

      filterCountries() {
        const searchValue = this.normalizeString(this.elements.search.value);
        const popularCountries = this.querySelector('.popular-countries');
        const allItems = this.querySelectorAll('a');
        let visibleItems = allItems.length;

        this.elements.resetButton.classList.toggle('hidden', !searchValue);

        if (popularCountries) {
          popularCountries.classList.toggle('hidden', searchValue);
        }

        allItems.forEach((item) => {
          const textElement = item.querySelector('.country') || item.querySelector('.language-name') || item;
          const countryName = this.normalizeString(textElement.textContent);

          if (countryName.indexOf(searchValue) > -1) {
            item.parentElement.classList.remove('hidden');
            visibleItems++;
          } else {
            item.parentElement.classList.add('hidden');
            visibleItems--;
          }
        });

        if (this.elements.liveRegion) {
          const accessibilityString =
            this.elements.search.name === 'language_filter'
              ? window.accessibilityStrings.languageSelectorSearchCount
              : window.accessibilityStrings.countrySelectorSearchCount;
          this.elements.liveRegion.innerHTML = accessibilityString.replace('[count]', visibleItems);
        }

        this.querySelector('.disclosure__list-wrapper').scrollTop = 0;
        this.querySelector('.disclosure__list').scrollTop = 0;
      }

      resetFilter(event) {
        event.stopPropagation();
        this.elements.search.value = '';
        this.filterCountries();
        this.elements.search.focus();
      }

      onSearchFocus() {
        this.elements.searchIcon.classList.add('country-filter__search-icon--hidden');
      }

      onSearchBlur() {
        if (!this.elements.search.value) {
          this.elements.searchIcon.classList.remove('country-filter__search-icon--hidden');
        }
      }

      onSearchKeyDown(event) {
        if (event.code.toUpperCase() === 'ENTER') {
          event.preventDefault();
        }
      }
    },
  );
}
