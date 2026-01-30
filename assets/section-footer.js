document.addEventListener('DOMContentLoaded', function () {
  initFooterSocialHover();
  initFooterNewsletter();
});

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
 * Footer social icons: same expansion logic as header profile/cart row (vertical-header.js).
 * Each .footer-social-row is a flex row; hovered icon expands, sibling in row shrinks.
 */
function initFooterSocialHover() {
  const rows = document.querySelectorAll('.footer-social-row');
  if (!rows.length) return;

  rows.forEach((row) => {
    const buttons = Array.from(row.querySelectorAll('.social-box'));
    if (buttons.length === 0) return;

    const isMultipleButtons = buttons.length > 1;

    buttons.forEach((button) => {
      button.addEventListener('mouseenter', () => {
        if (isMultipleButtons) {
          button.classList.add('is-expanded-horizontal');

          buttons.forEach((otherButton) => {
            if (otherButton !== button) {
              otherButton.classList.add('is-shrunk-horizontal');
            }
          });
        }
      });

      button.addEventListener('mouseleave', () => {
        if (isMultipleButtons) {
          button.classList.remove('is-expanded-horizontal');
          buttons.forEach((otherButton) => {
            otherButton.classList.remove('is-shrunk-horizontal');
          });
        }
      });
    });
  });
}
