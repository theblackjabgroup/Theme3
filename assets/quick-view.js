/**
 * Quick View Modal
 * Opens from top to center when clicking the eye icon on product cards.
 */

if (!customElements.get('quick-view-modal')) {
  customElements.define(
    'quick-view-modal',
    class QuickViewModal extends HTMLElement {
      constructor() {
        super();
        this.productId = this.dataset.productId;
        this.slider = this.querySelector('[data-quick-view-slider]');
        this.slides = this.querySelectorAll('.quick-view-modal__slide');
        this.prevBtn = this.querySelector('[data-quick-view-prev]');
        this.nextBtn = this.querySelector('[data-quick-view-next]');
        this.closeButtons = this.querySelectorAll('[data-quick-view-close]');
        this.variantButtons = this.querySelectorAll('.quick-view-modal__variant-btn');
        this.variantIdInput = this.querySelector('[data-quick-view-variant-id]');
        this.currentSlide = 0;
        this.variants = this.getVariants();

        this.bindEvents();
      }

      getVariants() {
        // Get the modal ID from the element's ID attribute
        const modalId = this.id.replace('QuickView-', '');
        const variantScript = document.querySelector(`[data-quick-view-variants="${modalId}"]`);
        if (variantScript) {
          try {
            return JSON.parse(variantScript.textContent);
          } catch (e) {
            console.error('Error parsing variants:', e);
          }
        }
        return [];
      }

      bindEvents() {
        // Close buttons
        this.closeButtons.forEach((btn) => {
          btn.addEventListener('click', () => this.hide());
        });

        // Escape key
        this.addEventListener('keyup', (e) => {
          if (e.key === 'Escape') this.hide();
        });

        // Slider navigation
        if (this.prevBtn) {
          this.prevBtn.addEventListener('click', () => this.prevSlide());
        }
        if (this.nextBtn) {
          this.nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Variant buttons
        this.variantButtons.forEach((btn) => {
          btn.addEventListener('click', () => this.selectVariant(btn));
        });

        // Quantity buttons
        const qtyMinus = this.querySelector('[data-quick-view-qty-minus]');
        const qtyPlus = this.querySelector('[data-quick-view-qty-plus]');
        const qtyInput = this.querySelector('[data-quick-view-qty-input]');

        if (qtyMinus && qtyInput) {
          qtyMinus.addEventListener('click', () => {
            const currentQty = parseInt(qtyInput.value, 10) || 1;
            const newQty = Math.max(1, currentQty - 1);
            qtyInput.value = newQty;
            qtyMinus.disabled = newQty <= 1;
          });
        }

        if (qtyPlus && qtyInput) {
          qtyPlus.addEventListener('click', () => {
            const currentQty = parseInt(qtyInput.value, 10) || 1;
            const max = qtyInput.getAttribute('max');
            const maxQty = max ? parseInt(max, 10) : Infinity;
            const newQty = Math.min(maxQty, currentQty + 1);
            qtyInput.value = newQty;
            if (qtyMinus) qtyMinus.disabled = false;
            if (max) qtyPlus.disabled = newQty >= maxQty;
          });
        }

        if (qtyInput) {
          qtyInput.addEventListener('change', () => {
            let value = parseInt(qtyInput.value, 10) || 1;
            const max = qtyInput.getAttribute('max');
            const maxQty = max ? parseInt(max, 10) : Infinity;
            value = Math.max(1, Math.min(maxQty, value));
            qtyInput.value = value;
            if (qtyMinus) qtyMinus.disabled = value <= 1;
            if (qtyPlus && max) qtyPlus.disabled = value >= maxQty;
          });
        }
      }

      show(opener) {
        this.openedBy = opener;
        document.body.classList.add('overflow-hidden');
        this.setAttribute('open', '');
        this.focus();

        // Trap focus
        if (typeof trapFocus === 'function') {
          trapFocus(this, this.querySelector('[role="dialog"]'));
        }
      }

      hide() {
        document.body.classList.remove('overflow-hidden');
        this.removeAttribute('open');

        // Remove trap focus
        if (typeof removeTrapFocus === 'function') {
          removeTrapFocus(this.openedBy);
        }

        // Return focus to opener
        if (this.openedBy) {
          this.openedBy.focus();
        }
      }

      prevSlide() {
        const newIndex = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
        this.goToSlide(newIndex);
      }

      nextSlide() {
        const newIndex = this.currentSlide === this.slides.length - 1 ? 0 : this.currentSlide + 1;
        this.goToSlide(newIndex);
      }

      goToSlide(index) {
        this.slides.forEach((slide, i) => {
          slide.classList.toggle('is-active', i === index);
        });
        this.currentSlide = index;
      }

      selectVariant(btn) {
        const optionIndex = parseInt(btn.dataset.optionIndex, 10);
        const optionValue = btn.dataset.optionValue;

        // Update button states for this option group
        const optionGroup = btn.closest('.quick-view-modal__option');
        const groupButtons = optionGroup.querySelectorAll('.quick-view-modal__variant-btn');

        groupButtons.forEach((groupBtn) => {
          const isSelected = groupBtn === btn;
          groupBtn.classList.toggle('is-selected', isSelected);

          // Update the variant class (primary vs secondary)
          if (isSelected) {
            groupBtn.classList.remove('global-btn-2--primary');
            groupBtn.classList.add('global-btn-2--secondary');
            groupBtn.setAttribute('data-btn-variant', 'secondary');
          } else {
            groupBtn.classList.remove('global-btn-2--secondary');
            groupBtn.classList.add('global-btn-2--primary');
            groupBtn.setAttribute('data-btn-variant', 'primary');
          }
        });

        // Find matching variant
        this.updateSelectedVariant();
      }

      updateSelectedVariant() {
        // Get all selected option values
        const selectedOptions = [];
        const optionGroups = this.querySelectorAll('.quick-view-modal__option');

        optionGroups.forEach((group) => {
          const selectedBtn = group.querySelector('.quick-view-modal__variant-btn.is-selected');
          if (selectedBtn) {
            selectedOptions.push(selectedBtn.dataset.optionValue);
          }
        });

        // Find matching variant
        const matchingVariant = this.variants.find((variant) => {
          return selectedOptions.every((opt, index) => variant.options[index] === opt);
        });

        if (matchingVariant && this.variantIdInput) {
          this.variantIdInput.value = matchingVariant.id;
          this.variantIdInput.disabled = !matchingVariant.available;

          // Update price display
          this.updatePrice(matchingVariant);

          // Update stock status
          this.updateStock(matchingVariant);

          // Update add to cart button
          this.updateAddToCart(matchingVariant);

          // Update variant label
          this.updateVariantLabel(matchingVariant);

          // Update image to show variant featured image
          if (matchingVariant.featured_media) {
            const mediaIndex = matchingVariant.featured_media.position - 1;
            this.goToSlide(mediaIndex);
          }
        }
      }

      updateVariantLabel(variant) {
        const labelEl = this.querySelector('[data-variant-label]');
        if (labelEl && variant.title) {
          labelEl.textContent = variant.title;
        }
      }

      updatePrice(variant) {
        const priceEl = this.querySelector('.quick-view-modal__price-current');
        const compareEl = this.querySelector('.quick-view-modal__price-compare');

        if (priceEl) {
          priceEl.textContent = this.formatMoney(variant.price);
        }

        if (compareEl) {
          if (variant.compare_at_price && variant.compare_at_price > variant.price) {
            compareEl.textContent = this.formatMoney(variant.compare_at_price);
            compareEl.style.display = '';
          } else {
            compareEl.style.display = 'none';
          }
        }
      }

      updateStock(variant) {
        const stockEl = this.querySelector('.quick-view-modal__stock');
        if (stockEl) {
          stockEl.textContent = variant.available ? 'In Stock' : 'Out of Stock';
        }
      }

      updateAddToCart(variant) {
        const addBtn = this.querySelector('.quick-view-modal__add-btn');
        if (addBtn) {
          const textEl = addBtn.querySelector('.global-btn__text');
          if (textEl) {
            textEl.textContent = variant.available ? 'Add to cart' : 'Sold Out';
          }
          addBtn.disabled = !variant.available;
        }
      }

      formatMoney(cents) {
        const amount = (cents / 100).toFixed(2);
        return window.Shopify?.currency?.active
          ? `${window.Shopify.currency.active} ${amount}`
          : `$${amount}`;
      }
    }
  );
}

// Initialize quick view triggers with event delegation
document.addEventListener('DOMContentLoaded', () => {
  // Use event delegation for dynamically added elements
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-quick-view-trigger]');
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      // Get the modal ID (format: section_id-product_id)
      const modalId = trigger.dataset.quickViewTrigger.replace(/['"]/g, '');
      const modal = document.getElementById(`QuickView-${modalId}`);
      if (modal) {
        modal.show(trigger);
      }
    }
  });
});
