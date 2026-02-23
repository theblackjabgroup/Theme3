function init() {
  initFooterSocialHover();
  initFooterNewsletter();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/**
 * Footer newsletter forms: AJAX submit with graceful fallback to native submit.
 */
function initFooterNewsletter() {
  const forms = document.querySelectorAll('.footer-newsletter-form');
  if (!forms.length) return;

  forms.forEach((form) => {
    if (form.dataset.newsletterBound === 'true') return;
    form.dataset.newsletterBound = 'true';

    const input = form.querySelector('.newsletter-input');
    if (!input) return;

    let isSubmitting = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isSubmitting) return;

      isSubmitting = true;
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const existingMessages = form.querySelectorAll('.newsletter-message');
      existingMessages.forEach((el) => el.remove());

      const formData = new FormData(form);
      const url = form.getAttribute('action') || window.location.pathname;

      fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      })
        .then((response) => {
          if (response.url && response.url.includes('/challenge')) {
            window.location.href = response.url;
            return '__CHALLENGE_REDIRECT__';
          }
          if (!response.ok) return null;
          return response.text();
        })
        .then((html) => {
          if (html === '__CHALLENGE_REDIRECT__') {
            return;
          }
          if (!html) {
            HTMLFormElement.prototype.submit.call(form);
            return;
          }

          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          const successMessage = doc.querySelector('.form__message--success, .note--success, [data-success]');
          const errorMessage =
            doc.querySelector('.form__message--error, .note--error, .errors, [data-error]') ||
            doc.querySelector('.form-status.is-error');

          if (successMessage) {
            input.value = '';
            const msg = document.createElement('div');
            msg.className = 'newsletter-message newsletter-message--success';
            msg.textContent = successMessage.textContent?.trim() || 'Thanks for subscribing.';
            form.appendChild(msg);
            return;
          }

          if (errorMessage) {
            const msg = document.createElement('div');
            msg.className = 'newsletter-message newsletter-message--error';
            msg.textContent = errorMessage.textContent?.trim() || 'Something went wrong. Please try again.';
            form.appendChild(msg);
            return;
          }

          HTMLFormElement.prototype.submit.call(form);
        })
        .catch((error) => {
          console.error('Newsletter error:', error);
          HTMLFormElement.prototype.submit.call(form);
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
          isSubmitting = false;
        });
    });
  });
}

/**
 * Footer social icons: horizontal expand on hover (hovered icon grows, others shrink).
 * Uses event delegation so it works when footer is loaded/re-rendered (e.g. theme editor).
 */
var footerSocialHoverInitialized = false;
function initFooterSocialHover() {
  if (footerSocialHoverInitialized) return;
  footerSocialHoverInitialized = true;

  document.addEventListener('mouseover', function footerSocialMouseOver(e) {
    const box = e.target.closest('.social-box');
    if (!box) return;
    const grid = box.closest('.footer-social-row');
    if (!grid) return;
    if (box.contains(e.relatedTarget)) return;

    const buttons = Array.from(grid.querySelectorAll('.social-box'));
    if (buttons.length < 2) return;

    let perRow = parseInt(grid.getAttribute('data-icons-per-row') || '4', 10);
    if (window.matchMedia('(max-width: 768px)').matches) {
      perRow = parseInt(grid.getAttribute('data-icons-per-row-mobile') || '4', 10);
    }
    const hoveredIndex = buttons.indexOf(box);
    const hoveredRow = Math.floor(hoveredIndex / perRow);

    buttons.forEach(function (b) {
      b.classList.remove('is-expanded-horizontal', 'is-shrunk-horizontal');
    });
    box.classList.add('is-expanded-horizontal');
    buttons.forEach(function (b, i) {
      if (b !== box && Math.floor(i / perRow) === hoveredRow) b.classList.add('is-shrunk-horizontal');
    });
  }, true);

  document.addEventListener('mouseout', function footerSocialMouseOut(e) {
    const row = e.target.closest('.footer-social-row');
    if (!row) return;
    if (row.contains(e.relatedTarget)) return;

    row.querySelectorAll('.social-box').forEach(function (b) {
      b.classList.remove('is-expanded-horizontal', 'is-shrunk-horizontal');
    });
  }, true);
}
