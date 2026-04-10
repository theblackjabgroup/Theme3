// Expose variants for option -> variant resolution on the PDP.
// (Shopify variant JSON includes `options: []`, `price`, `compare_at_price`, `available`, etc.)
var productVariants = window.productVariants || [];

function formatMoney(cents) {
  var amount = (cents || 0) / 100;
  var currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD';
  var locale = document.documentElement.lang || 'en';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (e) {
    return currency + ' ' + amount.toFixed(2);
  }
}

function getSelectedVariant() {
  var selectedOptions = Array.prototype.slice
    .call(document.querySelectorAll('.product-form__variant-radio:checked'))
    .map(function (r) {
      return r.value;
    });

  if (!selectedOptions.length) return null;

  return productVariants.find(function (v) {
    if (!v || !v.options) return false;
    if (v.options.length !== selectedOptions.length) return false;
    return v.options.every(function (opt, idx) {
      return opt === selectedOptions[idx];
    });
  });
}

function setAtcButtonState(btn, available) {
  if (!btn) return;
  var textEl = btn.querySelector('.global-btn__text');

  if (available) {
    if (textEl) textEl.textContent = 'ADD TO CART';
    btn.disabled = false;
    btn.classList.remove('global-btn--disabled');
    btn.classList.add('global-btn--tertiary');
    btn.setAttribute('data-btn-variant', 'tertiary');
  } else {
    if (textEl) textEl.textContent = 'SOLD OUT';
    btn.disabled = true;
    btn.classList.remove('global-btn--tertiary');
    btn.classList.add('global-btn--disabled');
    btn.setAttribute('data-btn-variant', 'disabled');
  }
}

function updateMainProductCardVariant(variant) {
  if (!variant) return;

  var priceMainEl = document.querySelector('.product-price-main');
  if (priceMainEl) priceMainEl.textContent = formatMoney(variant.price);

  var compareEl = document.querySelector('.product-price-compare');
  if (compareEl) {
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      compareEl.textContent = formatMoney(variant.compare_at_price);
      compareEl.classList.remove('hidden');
    } else {
      compareEl.classList.add('hidden');
    }
  }

  var stockTextEl = document.querySelector('.product-stock-text');
  var stockDotEl = document.querySelector('.product-stock-dot');
  if (stockTextEl) {
    if (!variant.available) {
      stockTextEl.textContent = 'Out of stock';
    } else if (
      variant.inventory_management === 'shopify' &&
      typeof variant.inventory_quantity === 'number' &&
      variant.inventory_quantity > 0 &&
      variant.inventory_quantity <= 10
    ) {
      stockTextEl.textContent = 'Only ' + variant.inventory_quantity + ' left in stock';
    } else {
      stockTextEl.textContent = 'In stock';
    }
  }
  if (stockDotEl) {
    stockDotEl.classList.toggle('product-stock-dot--out', !variant.available);
  }

  var mainAtcBtn = document.querySelector('[data-product-form] .product-form__submit');
  setAtcButtonState(mainAtcBtn, !!variant.available);
}

function updateStickyBarVariant(variant) {
  if (!variant) return;

  var variantEl = document.querySelector('.sticky-cart-bar__variant .global-btn-2__text');
  var priceEl = document.querySelector('.sticky-cart-bar__price');
  var hiddenInput = document.querySelector('[data-product-form] input[name="id"]');
  var atcBtn = document.getElementById('StickyAddToCart');

  if (priceEl) priceEl.textContent = formatMoney(variant.price);
  if (variantEl && variant.title && variant.title !== 'Default Title') variantEl.textContent = variant.title;
  if (hiddenInput) hiddenInput.value = variant.id;
  setAtcButtonState(atcBtn, !!variant.available);
}

function updateSelectedVariantUI() {
  var variant = getSelectedVariant();
  if (!variant) return;
  updateStickyBarVariant(variant);
  updateMainProductCardVariant(variant);
}

function initProductPage() {
  // Ensure initial UI matches the selected/first variant.
  updateSelectedVariantUI();

  // Keep UI in sync when radios change
  document.querySelectorAll('.product-form__variant-radio').forEach(function (radio) {
    radio.addEventListener('change', updateSelectedVariantUI);
  });

  // Variant active state - buttons inside <label> don't trigger the radio's for-association
  document.querySelectorAll('.product-form__variant-option-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var label = btn.closest('label');
      if (!label) return;
      var radioId = label.getAttribute('for');
      var radio = radioId ? document.getElementById(radioId) : null;
      if (!radio || radio.checked) return;
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));

      // Update button styles within this fieldset
      var fieldset = label.closest('fieldset');
      if (!fieldset) return;
      fieldset.querySelectorAll('.product-form__variant-option-btn').forEach(function (b) {
        b.classList.remove('global-btn-2--secondary');
        b.classList.add('global-btn-2--primary');
        b.setAttribute('data-btn-variant', 'primary');
      });
      btn.classList.remove('global-btn-2--primary');
      btn.classList.add('global-btn-2--secondary');
      btn.setAttribute('data-btn-variant', 'secondary');
    });
  });

  // FAQ Accordion
  document.querySelectorAll('.faq-accordion-item').forEach(function (item) {
    item.querySelector('.faq-accordion-header').addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-accordion-item.is-open').forEach(function (open) {
        open.classList.remove('is-open');
        open.querySelector('.faq-accordion-body').style.maxHeight = '0';
      });
      if (!isOpen) {
        var body = item.querySelector('.faq-accordion-body');
        item.classList.add('is-open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // Image gallery
  var mainImage = document.getElementById('ProductMainImage');
  var thumbnails = document.querySelectorAll('.thumbnail-item[data-media-url]');
  var prevBtn = document.querySelector('.media-nav-btn.prev');
  var nextBtn = document.querySelector('.media-nav-btn.next');

  if (!mainImage || thumbnails.length === 0) return;

  var currentIndex = 0;

  function updateMainImage(index) {
    if (index < 0) index = thumbnails.length - 1;
    if (index >= thumbnails.length) index = 0;
    currentIndex = index;
    var newSrc = thumbnails[currentIndex].getAttribute('data-media-url');
    if (!newSrc) return;
    mainImage.style.opacity = '0';
    setTimeout(function () {
      mainImage.src = newSrc;
      mainImage.srcset = newSrc;
      mainImage.style.opacity = '1';
    }, 300);
    thumbnails.forEach(function (t, i) {
      t.classList.toggle('active', i === currentIndex);
    });
  }

  if (thumbnails.length > 0) thumbnails[0].classList.add('active');

  thumbnails.forEach(function (thumb, index) {
    thumb.addEventListener('click', function () {
      updateMainImage(index);
    });
  });

  if (prevBtn)
    prevBtn.addEventListener('click', function (e) {
      e.preventDefault();
      updateMainImage(currentIndex - 1);
    });
  if (nextBtn)
    nextBtn.addEventListener('click', function (e) {
      e.preventDefault();
      updateMainImage(currentIndex + 1);
    });

  // Sticky bar scroll trigger
  var stickyBar = document.getElementById('StickyCartBar');
  if (stickyBar) {
    window.addEventListener(
      'scroll',
      function () {
        stickyBar.classList.toggle('sticky-cart-bar--visible', window.scrollY > 400);
      },
      { passive: true }
    );

    // Sync sticky qty with main qty
    var mainQtyInput = document.querySelector('[data-product-form] .quantity__input');
    var stickyQtyDisplay = document.getElementById('StickyQtyDisplay');
    var stickyDecrement = document.getElementById('StickyDecrement');
    var stickyIncrement = document.getElementById('StickyIncrement');

    function getStickyQty() {
      return parseInt(stickyQtyDisplay.textContent, 10) || 1;
    }

    if (stickyDecrement) {
      stickyDecrement.addEventListener('click', function () {
        var q = Math.max(1, getStickyQty() - 1);
        stickyQtyDisplay.textContent = q;
        if (mainQtyInput) mainQtyInput.value = q;
      });
    }
    if (stickyIncrement) {
      stickyIncrement.addEventListener('click', function () {
        var q = getStickyQty() + 1;
        stickyQtyDisplay.textContent = q;
        if (mainQtyInput) mainQtyInput.value = q;
      });
    }

    var stickyAtcBtn = document.getElementById('StickyAddToCart');
    if (stickyAtcBtn) {
      stickyAtcBtn.addEventListener('click', function () {
        var mainSubmit = document.querySelector('[data-product-form] [type="submit"]');
        if (mainSubmit) mainSubmit.click();
      });
    }
  }

  // Pickup Availability Drawer
  var checkAvailBtn = document.getElementById('CheckAvailabilityBtn');
  var pickupDrawer = document.getElementById('PickupDrawer');
  var drawerClose = document.getElementById('PickupDrawerClose');
  var drawerOverlay = document.getElementById('PickupDrawerOverlay');

  function openPickupDrawer() {
    if (!pickupDrawer) return;
    pickupDrawer.setAttribute('aria-hidden', 'false');
    pickupDrawer.classList.add('active');
    document.body.classList.add('pickup-drawer-open');
    document.body.style.overflow = 'hidden';
    if (drawerClose) drawerClose.focus();
  }

  function closePickupDrawer() {
    if (!pickupDrawer) return;
    pickupDrawer.setAttribute('aria-hidden', 'true');
    pickupDrawer.classList.remove('active');
    document.body.classList.remove('pickup-drawer-open');
    document.body.style.overflow = '';
    if (checkAvailBtn) checkAvailBtn.focus();
  }

  if (checkAvailBtn && pickupDrawer) {
    checkAvailBtn.addEventListener('click', openPickupDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closePickupDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closePickupDrawer);
    pickupDrawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePickupDrawer();
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductPage);
} else {
  initProductPage();
}
