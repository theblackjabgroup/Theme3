function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.editState = null;

    this.addEventListener('keyup', (evt) => {
      if (evt.code === 'Escape') {
        if (this.classList.contains('editing')) this.closeEditPanel();
        else this.close();
      }
    });
    this.addEventListener('click', (e) => {
      if (e.target.closest('.drawer__close')) this.close();
      if (e.target.closest('[data-edit-panel-close]')) {
        e.preventDefault();
        this.closeEditPanel();
      }
      if (e.target.closest('[data-edit-trigger]')) {
        e.preventDefault();
        const btn = e.target.closest('[data-edit-trigger]');
        const lineIndex = btn.getAttribute('data-line-index');
        if (lineIndex) this.openEditPanel(parseInt(lineIndex, 10));
      }
      if (e.target.closest('[data-edit-variant-btn]')) {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.target.closest('[data-edit-variant-btn]');
        const variantId = parseInt(btn.getAttribute('data-variant-id'), 10);
        if (variantId && this.editState) this.selectEditVariant(variantId);
      }
      if (e.target.closest('[data-edit-update-btn]')) {
        e.preventDefault();
        e.stopPropagation();
        this.updateCartFromEditPanel();
      }
      // Drawer list: quantity selector +/- (same behaviour as cart page – update input, qty label, subtotal, then trigger change)
      const editPanel = this.querySelector('#CartDrawer-EditPanel');
      const listSelector = e.target.closest('.cart-item__quantity-selector');
      if (listSelector && (!editPanel || !editPanel.contains(listSelector))) {
        const input = listSelector.querySelector('.quantity__input[name="updates[]"]');
        const minusBtn = listSelector.querySelector('.cart-item__quantity-minus');
        const plusBtn = listSelector.querySelector('.cart-item__quantity-plus');
        const itemIndex = listSelector.getAttribute('data-item-index');
        if (
          input &&
          itemIndex &&
          (e.target.closest('.cart-item__quantity-minus') || e.target.closest('.cart-item__quantity-plus'))
        ) {
          e.preventDefault();
          e.stopPropagation();
          const MIN_QTY = 1;
          const currentQty = parseInt(input.value.trim(), 10) || MIN_QTY;
          const maxQty = input.getAttribute('data-max');
          const max = maxQty != null ? parseInt(maxQty, 10) : null;
          let newQty = currentQty;
          if (e.target.closest('.cart-item__quantity-minus')) {
            newQty = Math.max(MIN_QTY, currentQty - 1);
          } else {
            newQty = max != null ? Math.min(currentQty + 1, max) : currentQty + 1;
          }
          if (newQty !== currentQty) {
            input.value = newQty;
            if (minusBtn) minusBtn.disabled = newQty <= 1;
            if (plusBtn) plusBtn.disabled = max != null && newQty >= max;
            const itemEl = listSelector.closest('.cart-drawer__item');
            const qtyLabel = itemEl && itemEl.querySelector('.cart-drawer__item-qty-value');
            if (qtyLabel) qtyLabel.textContent = newQty;
            this.recalculateDrawerSubtotal();
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
          return;
        }
      }
      // Edit panel: quantity selector +/- (snippet has no quantity-input, so handle here)
      const editSelector = editPanel && e.target.closest('.cart-item__quantity-selector');
      if (editPanel && editSelector && editPanel.contains(editSelector)) {
        const input = editSelector.querySelector('[data-edit-qty-input]');
        const minusBtn = editSelector.querySelector('.cart-item__quantity-minus');
        const plusBtn = editSelector.querySelector('.cart-item__quantity-plus');
        if (!input) return;
        const min = 1;
        const max = input.getAttribute('data-max') ? parseInt(input.getAttribute('data-max'), 10) : null;
        let qty = parseInt(input.value, 10) || min;
        if (e.target.closest('.cart-item__quantity-minus')) {
          e.preventDefault();
          e.stopPropagation();
          qty = Math.max(min, qty - 1);
        } else if (e.target.closest('.cart-item__quantity-plus')) {
          e.preventDefault();
          e.stopPropagation();
          qty = max != null ? Math.min(qty + 1, max) : qty + 1;
        } else {
          return;
        }
        input.value = qty;
        if (minusBtn) minusBtn.disabled = qty <= min;
        if (plusBtn) plusBtn.disabled = max != null && qty >= max;
      }
    });
    // Handle clicks outside the drawer content to close it
    document.addEventListener('click', (e) => {
      if (
        this.classList.contains('active') &&
        !e.target.closest('.drawer__inner') &&
        !e.target.closest('#cart-icon-bubble') &&
        !e.target.closest('.cart-drawer-trigger') &&
        !e.target.closest('[data-open-cart-drawer-edit]')
      ) {
        this.close();
      }
      // Close when clicking on overlay
      if (e.target.classList.contains('cart-drawer__overlay')) {
        this.close();
      }
    });
    this.setHeaderCartIconAccessibility();

    // Cart page: when Edit is clicked, open drawer and show edit panel for that line (bound ref so it works after close/reopen)
    const drawerEl = this;
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-cart-drawer-edit]');
      if (!trigger) return;
      e.preventDefault();
      e.stopPropagation();
      const lineIndex = trigger.getAttribute('data-line-index');
      if (lineIndex && typeof drawerEl.open === 'function' && typeof drawerEl.openEditPanel === 'function') {
        drawerEl.open();
        drawerEl.openEditPanel(parseInt(lineIndex, 10));
      }
    }, true);
  }

  openEditPanel(lineIndex) {
    const scriptEl = document.getElementById(`CartDrawer-EditData-${lineIndex}`);
    if (!scriptEl) return;
    let data;
    try {
      data = JSON.parse(scriptEl.textContent);
    } catch (err) {
      return;
    }
    const variants = data.variants || [];
    this.editState = {
      lineIndex: data.lineIndex,
      originalVariantId: data.variantId,
      selectedVariantId: data.variantId,
      quantity: data.quantity,
      variants,
      optionsWithValues: data.optionsWithValues || [],
    };
    const panel = this.querySelector('#CartDrawer-EditPanel');
    if (!panel) return;

    const img = panel.querySelector('[data-edit-image]');
    const nameEl = panel.querySelector('[data-edit-name]');
    const priceEl = panel.querySelector('[data-edit-price]');
    const qtyInput = panel.querySelector('[data-edit-qty-input]');
    const stockEl = panel.querySelector('[data-edit-stock]');
    const variantsWrap = panel.querySelector('[data-edit-variants]');

    if (img) {
      img.src = data.image || '';
      img.alt = data.title || '';
    }
    if (nameEl) nameEl.textContent = (data.title || '').toUpperCase();
    if (priceEl) {
      if (
        data.compareAtPriceFormatted &&
        data.compareAtPrice != null &&
        data.price != null &&
        data.compareAtPrice > data.price
      ) {
        priceEl.innerHTML = `<s>${data.compareAtPriceFormatted}</s> ${data.priceFormatted}`;
      } else {
        priceEl.textContent = data.priceFormatted;
      }
    }
    if (qtyInput) {
      qtyInput.value = data.quantity;
      qtyInput.min = 1;
      qtyInput.setAttribute('min', '1');
      const currentVariant = variants.find((v) => v.id === data.variantId);
      const maxQty = this.getEditPanelMaxQuantity(currentVariant);
      if (maxQty != null) {
        qtyInput.max = maxQty;
        qtyInput.setAttribute('max', String(maxQty));
        qtyInput.setAttribute('data-max', String(maxQty));
      } else {
        qtyInput.removeAttribute('max');
        qtyInput.removeAttribute('data-max');
      }
      const selector = qtyInput.closest('.cart-item__quantity-selector');
      if (selector) {
        const minusBtn = selector.querySelector('.cart-item__quantity-minus');
        const plusBtn = selector.querySelector('.cart-item__quantity-plus');
        const qty = parseInt(qtyInput.value, 10) || 1;
        if (minusBtn) minusBtn.disabled = qty <= 1;
        if (plusBtn) plusBtn.disabled = maxQty != null && qty >= maxQty;
      }
    }
    if (stockEl) stockEl.textContent = data.available ? 'In Stock' : 'Out of Stock';

    if (variantsWrap && data.optionsWithValues && data.optionsWithValues.length > 0) {
      const currentVariant = variants.find((v) => v.id === data.variantId);
      const currentOptions = currentVariant && currentVariant.options ? currentVariant.options.slice() : [];
      variantsWrap.innerHTML = this.renderEditVariantButtons(
        variants,
        data.optionsWithValues,
        currentOptions,
        data.variantId,
      );
    } else if (variantsWrap) {
      variantsWrap.innerHTML = '';
    }

    panel.setAttribute('aria-hidden', 'false');
    this.classList.add('editing');
  }

  getEditPanelMaxQuantity(variant) {
    if (!variant) return null;
    let max = null;
    if (variant.inventory_management === 'shopify' && variant.inventory_policy === 'deny') {
      max = variant.inventory_quantity != null ? variant.inventory_quantity : null;
    }
    if (variant.quantity_rule_max != null) {
      const ruleMax = parseInt(variant.quantity_rule_max, 10);
      if (max == null || ruleMax < max) max = ruleMax;
    }
    return max;
  }

  findVariantForOptionValue(variants, optionIndex, value, currentOptions) {
    return variants.find(
      (v) =>
        v.options &&
        v.options[optionIndex] === value &&
        v.options.every((opt, j) => j === optionIndex || currentOptions[j] === undefined || opt === currentOptions[j]),
    );
  }

  renderEditVariantButtons(variants, optionsWithValues, currentOptions, selectedVariantId) {
    return optionsWithValues
      .map((option, optionIndex) => {
        const buttons = (option.values || [])
          .map((value) => {
            const variant = this.findVariantForOptionValue(variants, optionIndex, value, currentOptions);
            const isSelected = variant && variant.id === selectedVariantId;
            const isUnavailable = !variant;
            const variantClasses = [
              'global-btn',
              'global-btn--fit-content',
              isSelected ? 'global-btn--secondary' : 'global-btn--primary',
              'cart-drawer__edit-variant-btn',
              isSelected ? 'is-selected' : '',
              isUnavailable ? 'cart-drawer__edit-variant-btn--unavailable' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return `<button type="button" class="${variantClasses}" data-edit-variant-btn data-variant-id="${
              variant ? variant.id : ''
            }"${isUnavailable ? ' disabled aria-disabled="true"' : ''}>
              <span class="global-btn__shadow" aria-hidden="true"></span>
              <span class="global-btn__content">
                <span class="global-btn__text">${escapeHtml(value)}</span>
              </span>
            </button>`;
          })
          .join('');
        return `<div class="cart-drawer__edit-option-row">${buttons}</div>`;
      })
      .join('');
  }

  selectEditVariant(variantId) {
    if (!this.editState) return;
    const variant = this.editState.variants.find((v) => v.id === variantId);
    if (!variant) return;
    this.editState.selectedVariantId = variantId;
    const panel = this.querySelector('#CartDrawer-EditPanel');
    if (!panel) return;
    const variantsWrap = panel.querySelector('[data-edit-variants]');
    if (variantsWrap && this.editState.optionsWithValues && this.editState.optionsWithValues.length > 0) {
      const currentOptions = (variant.options && variant.options.slice()) || [];
      variantsWrap.innerHTML = this.renderEditVariantButtons(
        this.editState.variants,
        this.editState.optionsWithValues,
        currentOptions,
        variantId,
      );
    }
    const priceEl = panel.querySelector('[data-edit-price]');
    if (priceEl) {
      if (
        variant.compareAtPriceFormatted &&
        variant.compareAtPrice != null &&
        variant.price != null &&
        variant.compareAtPrice > variant.price
      ) {
        priceEl.innerHTML = `<s>${variant.compareAtPriceFormatted}</s> ${variant.priceFormatted}`;
      } else {
        priceEl.textContent = variant.priceFormatted;
      }
    }
    const stockEl = panel.querySelector('[data-edit-stock]');
    if (stockEl) stockEl.textContent = variant.available ? 'In Stock' : 'Out of Stock';
    const qtyInput = panel.querySelector('[data-edit-qty-input]');
    if (qtyInput) {
      const maxQty = this.getEditPanelMaxQuantity(variant);
      if (maxQty != null) {
        qtyInput.max = maxQty;
        qtyInput.setAttribute('max', String(maxQty));
        qtyInput.setAttribute('data-max', String(maxQty));
      } else {
        qtyInput.removeAttribute('max');
        qtyInput.removeAttribute('data-max');
      }
    }
  }

  closeEditPanel() {
    this.classList.remove('editing');
    this.editState = null;
    const panel = this.querySelector('#CartDrawer-EditPanel');
    if (panel) panel.setAttribute('aria-hidden', 'true');
  }

  updateCartFromEditPanel() {
    if (!this.editState) return;
    const panel = this.querySelector('#CartDrawer-EditPanel');
    const qtyInput = panel && panel.querySelector('[data-edit-qty-input]');
    let quantity = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : this.editState.quantity;
    const selectedVariant = this.editState.variants.find((v) => v.id === this.editState.selectedVariantId);
    const maxQty = this.getEditPanelMaxQuantity(selectedVariant);
    if (maxQty != null) quantity = Math.min(quantity, maxQty);
    const { lineIndex, originalVariantId, selectedVariantId } = this.editState;
    const updateBtn = panel && panel.querySelector('[data-edit-update-btn]');
    const updateButtonText = (text) => {
      if (!updateBtn) return;
      const textSpan = updateBtn.querySelector('.submit-button__text');
      if (textSpan) textSpan.textContent = text;
      else updateBtn.textContent = text;
    };

    if (updateBtn) {
      updateBtn.disabled = true;
      updateButtonText('Updating…');
    }

    const changePayload = (qty) =>
      JSON.stringify({
        line: lineIndex,
        quantity: qty,
        sections: ['cart-drawer', 'cart-icon-bubble'],
        sections_url: window.location.pathname,
      });

    const addPayload = (variantId, qty) =>
      JSON.stringify({
        id: variantId,
        quantity: qty,
        sections: ['cart-drawer', 'cart-icon-bubble'],
        sections_url: window.location.pathname,
      });

    const refreshDrawer = () => {
      return fetch(`${window.routes?.cart_url || '/cart'}?sections=cart-drawer,cart-icon-bubble`)
        .then((res) => res.json())
        .then((sections) => {
          const parser = new DOMParser();
          const cartDrawerHtml = sections['cart-drawer'];
          if (cartDrawerHtml) {
            const doc = parser.parseFromString(cartDrawerHtml, 'text/html');
            const newInner = doc.querySelector('.drawer__inner');
            const currentInner = this.querySelector('.drawer__inner');
            if (newInner && currentInner) currentInner.innerHTML = newInner.innerHTML;
          }
          const bubbleHtml = sections['cart-icon-bubble'];
          if (bubbleHtml) {
            const bubbleDoc = parser.parseFromString(bubbleHtml, 'text/html');
            const bubbleSection = bubbleDoc.querySelector('#shopify-section-cart-icon-bubble');
            const currentBubble = document.getElementById('shopify-section-cart-icon-bubble');
            if (bubbleSection && currentBubble) currentBubble.innerHTML = bubbleSection.innerHTML;
          }
        });
    };

    const done = () => {
      this.closeEditPanel();
      if (updateBtn) {
        updateBtn.disabled = false;
        updateButtonText('Update Cart');
      }
    };

    const fail = () => {
      if (updateBtn) {
        updateBtn.disabled = false;
        updateButtonText('Update Cart');
      }
    };

    const restoreAndFail = (err) => {
      const message = err && err.message ? err.message : "Couldn't switch variant. Your item has been restored.";
      return fetch(window.routes?.cart_add_url || '/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: addPayload(originalVariantId, quantity),
      })
        .then((res) => res.json())
        .then((addResponse) => {
          if (addResponse && addResponse.status) {
            throw new Error(addResponse.description || addResponse.message);
          }
          return refreshDrawer();
        })
        .then(() => {
          this.closeEditPanel();
          if (updateBtn) {
            updateBtn.disabled = false;
            updateButtonText('Update Cart');
          }
        })
        .catch(() => {
          refreshDrawer().finally(() => {
            this.closeEditPanel();
            fail();
          });
        });
    };

    if (selectedVariantId !== originalVariantId) {
      let removalSucceeded = false;
      let addSucceeded = false;
      fetch(window.routes?.cart_change_url || '/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: changePayload(0),
      })
        .then((res) => res.json())
        .then((changeResponse) => {
          if (changeResponse && changeResponse.status) {
            throw new Error(changeResponse.description || changeResponse.message);
          }
          removalSucceeded = true;
          return fetch(window.routes?.cart_add_url || '/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: addPayload(selectedVariantId, quantity),
          }).then((res) => res.json());
        })
        .then((response) => {
          if (response && response.status) {
            throw new Error(response.description || response.message);
          }
          addSucceeded = true;
          return refreshDrawer();
        })
        .then(done)
        .catch((err) => {
          if (removalSucceeded && !addSucceeded) restoreAndFail(err);
          else fail();
        });
    } else {
      fetch(window.routes?.cart_change_url || '/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: changePayload(quantity),
      })
        .then((res) => res.json())
        .then((response) => {
          if (response && response.status) {
            throw new Error(response.description || response.message);
          }
          return refreshDrawer();
        })
        .then(done)
        .catch(fail);
    }
  }

  /**
   * Recalculate drawer subtotal from DOM (same approach as cart page).
   * Sums (data-unit-price × quantity) for each .cart-drawer__item and updates #cart-drawer-total.
   */
  recalculateDrawerSubtotal() {
    const totalEl = document.getElementById('cart-drawer-total');
    const footerValues = document.querySelectorAll('.cart-drawer__footer-value');
    const elementsToUpdate = totalEl ? [totalEl, ...footerValues] : [...footerValues];
    if (elementsToUpdate.length === 0) return;

    let totalPrice = 0;
    const items = this.querySelectorAll('.cart-drawer__item[data-unit-price]');
    items.forEach((itemEl) => {
      const unitPrice = parseInt(itemEl.getAttribute('data-unit-price'), 10) || 0;
      const input = itemEl.querySelector('.quantity__input[name="updates[]"]');
      const qty = parseInt(input?.value?.trim(), 10) || 0;
      totalPrice += unitPrice * qty;
    });

    const originalFormat = totalEl ? totalEl.textContent.trim() : '';
    const formatted = this.formatDrawerMoney(totalPrice, originalFormat);
    elementsToUpdate.forEach((el) => {
      el.textContent = formatted;
    });
  }

  formatDrawerMoney(cents, originalFormat) {
    if (typeof cents === 'string') return cents;
    const ref = originalFormat || '';
    const currencyMatch = ref.match(/^([^\d\s.,]+)/);
    const currencySymbol = currencyMatch ? currencyMatch[1] : '';
    const amount = (cents / 100).toFixed(2);
    const parts = amount.split('.');
    const wholePart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decimalPart = parts[1];

    // Check if original format had decimals OR if the new value has cents
    const numberMatch = ref.match(/[\d,]+\.?\d*/);
    const hasDecimals = (numberMatch && numberMatch[0].includes('.')) || (decimalPart && decimalPart !== '00');

    const numStr = wholePart + (hasDecimals ? '.' + decimalPart : '');
    return currencySymbol ? currencySymbol + ' ' + numStr : numStr;
  }

  setHeaderCartIconAccessibility() {
    const cartTriggers = document.querySelectorAll('#cart-icon-bubble, .cart-drawer-trigger');
    cartTriggers.forEach((cartLink) => {
      cartLink.setAttribute('role', 'button');
      cartLink.setAttribute('aria-haspopup', 'dialog');
      cartLink.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(cartLink);
      });
      cartLink.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'SPACE') {
          event.preventDefault();
          this.open(cartLink);
        }
      });
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true },
    );

    document.body.classList.add('overflow-hidden', 'cart-drawer-open');
  }

  close() {
    if (this.classList.contains('editing')) this.closeEditPanel();
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden', 'cart-drawer-open');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    const drawerInner = this.querySelector('.drawer__inner');
    if (drawerInner && drawerInner.classList.contains('is-empty')) {
      drawerInner.classList.remove('is-empty');
    }
    this.productId = parsedState.id;
    try {
      this.getSectionsToRender().forEach((section) => {
        const sectionElement = section.selector
          ? document.querySelector(section.selector)
          : document.getElementById(section.id);

        if (!sectionElement) return;
        const sectionHtml = parsedState.sections && parsedState.sections[section.id];
        if (!sectionHtml) return;
        const inner = this.getSectionInnerHTML(sectionHtml, section.selector);
        if (inner != null) sectionElement.innerHTML = inner;
      });
    } catch (e) {
      console.error('Cart drawer renderContents:', e);
    }

    setTimeout(() => {
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    if (!html || typeof html !== 'string') return null;
    const node = new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
    return node ? node.innerHTML : null;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
