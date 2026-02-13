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
 * Footer newsletter form (id: FooterNewsletter): AJAX submit, show success/error without reload.
 */
function initFooterNewsletter() {
  const form = document.getElementById('FooterNewsletter');
  if (!form) return;

  const input = form.querySelector('#FooterNewsletterInput') || form.querySelector('.newsletter-input');
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
    const url = form.getAttribute('action');

    fetch(url, {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (response.url && response.url.includes('/challenge')) {
          window.location.href = response.url;
          return;
        }
        return response.text();
      })
      .then((html) => {
        if (!html) return;

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
        } else if (errorMessage) {
          const msg = document.createElement('div');
          msg.className = 'newsletter-message newsletter-message--error';
          msg.textContent = errorMessage.textContent?.trim() || 'Something went wrong. Please try again.';
          form.appendChild(msg);
        } else {
          const msg = document.createElement('div');
          msg.className = 'newsletter-message newsletter-message--error';
          msg.textContent = 'Unable to subscribe at this moment. Please try again later.';
          form.appendChild(msg);
        }
      })
      .catch((error) => {
        console.error('Newsletter error:', error);
        const msg = document.createElement('div');
        msg.className = 'newsletter-message newsletter-message--error';
        msg.textContent = 'Something went wrong. Please check your connection and try again.';
        form.appendChild(msg);
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
        isSubmitting = false;
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
    const row = box.closest('.footer-social-row');
    if (!row) return;
    if (box.contains(e.relatedTarget)) return;

    const buttons = Array.from(row.querySelectorAll('.social-box'));
    if (buttons.length < 2) return;

    buttons.forEach(function (b) {
      b.classList.remove('is-expanded-horizontal', 'is-shrunk-horizontal');
    });
    box.classList.add('is-expanded-horizontal');
    buttons.forEach(function (b) {
      if (b !== box) b.classList.add('is-shrunk-horizontal');
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
