if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));

        this.cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText =
          this.submitButton.querySelector('.submit-button__text') || this.submitButton.querySelector('span');

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      connectedCallback() {
        this.onFormChangeBound = this.onFormChange.bind(this);
        // Listen to document to catch inputs outside the form tag but linked via form attribute
        document.addEventListener('change', this.onFormChangeBound);
      }

      disconnectedCallback() {
        if (this.onFormChangeBound) {
          document.removeEventListener('change', this.onFormChangeBound);
        }
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true' || this.submitButton.disabled) return;

        this.error = false; // Reset error state for new submission
        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.disabled = true;
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        // Lazy load cart element in case it wasn't ready during constructor
        if (!this.cart) {
          this.cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
        }

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id),
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            const startMarker = CartPerformance.createStartingMarker('add:wait-for-subscribers');
            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              }).then(() => {
                CartPerformance.measureFromMarker('add:wait-for-subscribers', startMarker);
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    CartPerformance.measure('add:paint-updated-sections', () => {
                      this.cart.renderContents(response);
                    });
                  });
                },
                { once: true },
              );
              quickAddModal.hide(true);
            } else {
              CartPerformance.measure('add:paint-updated-sections', () => {
                this.cart.renderContents(response);
              });
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');

            // Only re-enable button if NO error occurred (preserves Sold Out state)
            if (!this.error) {
              this.submitButton.removeAttribute('aria-disabled');
              this.submitButton.disabled = false;
            }

            this.querySelector('.loading__spinner').classList.add('hidden');

            CartPerformance.measureFromEvent('add:user-action', evt);
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      // Reset error state when user changes variant/inputs
      onFormChange(evt) {
        // More robust check: is the changed input inside the same product section?
        const sectionId = this.dataset.sectionId;
        const sectionContainer = document.getElementById(`ProductSection-${sectionId}`);

        // If we can't find the section or the target isn't inside it, ignore
        if (!sectionContainer || !sectionContainer.contains(evt.target)) {
          // Fallback: check form attribute just in case
          if (evt.target.form !== this.form && evt.target.getAttribute('form') !== this.form.id) return;
        }

        if (!this.error) return;

        this.error = false;
        this.handleErrorMessage(); // Clear error text
        this.submitButton.removeAttribute('aria-disabled');
        this.submitButton.disabled = false;
        this.submitButtonText.classList.remove('hidden');

        // Hide sold out message if it exists
        const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
        if (soldOutMessage) soldOutMessage.classList.add('hidden');
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    },
  );
}
