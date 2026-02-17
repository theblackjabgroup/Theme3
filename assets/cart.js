class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      if (cartItems && this.dataset.index) {
        event.preventDefault();
        cartItems.updateQuantity(this.dataset.index, 0, event);
      }
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener('change', debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.source === 'cart-items') {
        return;
      }
      return this.onCartUpdate();
    });
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value, 10);
    const index = event.target.dataset.index;
    if (!index || isNaN(inputValue) || inputValue < 0) return;
    let message = '';

    if (inputValue < event.target.dataset.min) {
      message = window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min);
    } else if (inputValue > parseInt(event.target.max)) {
      message = window.quickOrderListStrings.max_error.replace('[max]', event.target.max);
    } else if (inputValue % parseInt(event.target.step) !== 0) {
      message = window.quickOrderListStrings.step_error.replace('[step]', event.target.step);
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      event.target.setCustomValidity('');
      event.target.reportValidity();
      this.updateQuantity(
        index,
        inputValue,
        event,
        event.target.getAttribute('name') || document.activeElement?.getAttribute('name'),
        event.target.dataset.quantityVariantId,
      );
    }
  }

  onChange(event) {
    if (!event.target.matches('input[name="updates[]"]') && !event.target.matches('.quantity__input')) return;
    if (!event.target.dataset.index) return;
    this.validateQuantity(event);
  }

  onCartUpdate() {
    if (this.tagName === 'CART-DRAWER-ITEMS') {
      return fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      return fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('cart-items');
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    const sections = [
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section',
      },
    ];

    const mainCartItems = document.getElementById('main-cart-items');
    if (mainCartItems && mainCartItems.dataset.id) {
      sections.push({
        id: 'main-cart-items',
        section: mainCartItems.dataset.id,
        selector: '.js-contents',
      });
    }

    const mainCartFooter = document.getElementById('main-cart-footer');
    if (mainCartFooter && mainCartFooter.dataset.id) {
      sections.push({
        id: 'main-cart-footer',
        section: mainCartFooter.dataset.id,
        selector: '.js-contents',
      });
    }

    return sections;
  }

  updateQuantity(line, quantity, event, name, variantId) {
    const isCartRemove =
      event &&
      event.currentTarget &&
      typeof CartRemoveButton !== 'undefined' &&
      event.currentTarget instanceof CartRemoveButton;
    const eventTarget = isCartRemove ? 'clear' : 'change';

    let cartPerformanceUpdateMarker;
    if (typeof CartPerformance !== 'undefined') {
      cartPerformanceUpdateMarker = CartPerformance.createStartingMarker(`${eventTarget}:user-action`);
    }

    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);

        const paintSections = () => {
          const quantityElement =
            document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
          const items = document.querySelectorAll('.cart-item');

          if (parsedState.errors) {
            if (quantityElement) quantityElement.value = quantityElement.getAttribute('value');
            this.updateLiveRegions(line, parsedState.errors);
            return;
          }

          this.classList.toggle('is-empty', parsedState.item_count === 0);
          const cartDrawerWrapper = document.querySelector('cart-drawer');
          const cartFooter = document.getElementById('main-cart-footer');

          if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
          if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

          if (parsedState.sections) {
            this.getSectionsToRender().forEach((section) => {
              const sectionHtml = parsedState.sections[section.section];
              if (!sectionHtml) return;
              const container = document.getElementById(section.id);
              if (!container) return;
              const elementToReplace = container.querySelector(section.selector) || container;
              const innerHtml = this.getSectionInnerHTML(sectionHtml, section.selector);
              if (innerHtml != null) elementToReplace.innerHTML = innerHtml;
            });
          }

          // Sync drawer elements if they exist in the DOM
          if (parsedState.items) {
            parsedState.items.forEach((item, i) => {
              const lineIndex = (item.index !== undefined ? item.index : i) + 1;
              let itemEl = document.getElementById(`CartDrawer-Item-${lineIndex}`);

              // Fallback: search by variant ID if indexed element not found or mismatch
              if (
                !itemEl ||
                (item.variant_id && itemEl.dataset.variantId && itemEl.dataset.variantId !== String(item.variant_id))
              ) {
                const fallbackEl = document.querySelector(`.cart-drawer__item[data-variant-id="${item.variant_id}"]`);
                if (fallbackEl) itemEl = fallbackEl;
              }

              if (itemEl) {
                const qtyLabel = itemEl.querySelector('.cart-drawer__item-qty-value');
                if (qtyLabel) qtyLabel.textContent = item.quantity;
                const selector = itemEl.querySelector('.cart-item__quantity-selector');
                const qtyInput =
                  document.getElementById(`Drawer-quantity-${lineIndex}`) ||
                  document.getElementById(`Quantity-${lineIndex}`) ||
                  itemEl.querySelector('.quantity__input');
                if (qtyInput) qtyInput.value = item.quantity;
                if (selector) {
                  const minusBtn = selector.querySelector('.cart-item__quantity-minus');
                  const plusBtn = selector.querySelector('.cart-item__quantity-plus');
                  const maxQty = qtyInput.getAttribute('data-max');
                  const max = maxQty != null ? parseInt(maxQty, 10) : null;
                  const qty = item.quantity;
                  if (minusBtn) minusBtn.disabled = qty <= 1;
                  if (plusBtn) plusBtn.disabled = max != null && qty >= max;
                }
              }
            });

            // Update subtotal in drawer and any other locations
            const totalElements = document.querySelectorAll('#cart-drawer-total, .cart-drawer__footer-value');
            if (totalElements.length > 0 && parsedState.total_price != null) {
              totalElements.forEach((totalEl) => {
                const currentText = totalEl.textContent.trim();
                const formatAmount = (price) => {
                  const amount = (price / 100).toFixed(2);
                  const parts = amount.split('.');
                  const wholePart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  return wholePart + (parts[1] && parts[1] !== '00' ? '.' + parts[1] : '');
                };
                const match = currentText.match(/^([^\d]*?)\s*[\d,.]+\s*([^\d.]*)$/);
                if (match) {
                  const prefix = match[1] || '';
                  const suffix = match[2] || '';
                  totalEl.textContent = `${prefix}${formatAmount(parsedState.total_price)}${suffix}`.trim();
                } else {
                  totalEl.textContent = formatAmount(parsedState.total_price);
                }
              });
            }
          }

          const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
          let message = '';
          if (
            quantityElement &&
            items.length === parsedState.items.length &&
            updatedValue !== parseInt(quantityElement.value)
          ) {
            if (typeof updatedValue === 'undefined') {
              message = window.cartStrings.error;
            } else {
              message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
            }
          }
          this.updateLiveRegions(line, message);

          const lineItem =
            document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
          if (lineItem && name && lineItem.querySelector(`[name="${name}"]`)) {
            cartDrawerWrapper
              ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
              : lineItem.querySelector(`[name="${name}"]`).focus();
          } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
            trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
          } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
            trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
          }
        };

        if (typeof CartPerformance !== 'undefined') {
          CartPerformance.measure(`${eventTarget}:paint-updated-sections`, paintSections);
        } else {
          paintSections();
        }

        if (typeof publish !== 'undefined' && typeof PUB_SUB_EVENTS !== 'undefined') {
          publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
        }
      })
      .catch((error) => {
        console.error('Cart update failed:', error);
        this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        if (errors) errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        this.disableLoading(line);
        if (typeof CartPerformance !== 'undefined' && cartPerformanceUpdateMarker) {
          CartPerformance.measureFromMarker(`${eventTarget}:user-action`, cartPerformanceUpdateMarker);
        }
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError) {
      const errorText = lineItemError.querySelector('.cart-item__error-text');
      if (errorText) errorText.textContent = message;
    }

    if (this.lineItemStatusElement) this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus =
      document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    if (cartStatus) {
      cartStatus.setAttribute('aria-hidden', false);
      setTimeout(() => {
        cartStatus.setAttribute('aria-hidden', true);
      }, 1000);
    }
  }

  getSectionInnerHTML(html, selector) {
    const el = new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
    return el ? el.innerHTML : null;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    if (mainCartItems) mainCartItems.classList.add('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

    if (document.activeElement) document.activeElement.blur();
    if (this.lineItemStatusElement) this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    if (mainCartItems) mainCartItems.classList.remove('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
  }
}

customElements.define('cart-items', CartItems);

if (!customElements.get('cart-note')) {
  customElements.define(
    'cart-note',
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          'input',
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } }).then(() =>
              CartPerformance.measureFromEvent('note-update:user-action', event),
            );
          }, ON_CHANGE_DEBOUNCE_TIMER),
        );
      }
    },
  );
}
