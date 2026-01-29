document.addEventListener('DOMContentLoaded', function () {
  initFooterSocialHover();
  initEditorialFooterNewsletter();
});

function initEditorialFooterNewsletter() {
  const form = document.getElementById('EditorialFooterNewsletter');
  if (!form) return;

  let isSubmitting = false;

  form.addEventListener('submit', function (e) {
    if (isSubmitting) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    isSubmitting = true;

    const submitBtn = form.querySelector('.ef-submit');
    const input = form.querySelector('.ef-input');
    const existingMessages = form.querySelectorAll('.ef-message');
    existingMessages.forEach((el) => el.remove());

    submitBtn.disabled = true;

    const formData = new FormData(form);
    const url = form.getAttribute('action');

    fetch(url, {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (response.url.includes('/challenge')) {
          window.location.href = response.url;
          return;
        }
        return response.text();
      })
      .then((html) => {
        if (!html) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const successMessage = doc.querySelector('.ef-message--success');
        const errorMessage = doc.querySelector('.ef-message--error') || doc.querySelector('.errors');

        if (successMessage) {
          input.value = '';
          form.appendChild(successMessage);
        } else if (errorMessage) {
          if (!errorMessage.classList.contains('ef-message')) {
            errorMessage.className = 'ef-message ef-message--error';
          }
          form.appendChild(errorMessage);
        } else {
          console.error('Newsletter submission returned unknown response format.');
          const unknownErr = document.createElement('div');
          unknownErr.className = 'ef-message ef-message--error';
          unknownErr.textContent = 'Unable to subscribe at this moment. Please try again later.';
          form.appendChild(unknownErr);
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        const errDiv = document.createElement('div');
        errDiv.className = 'ef-message ef-message--error';
        errDiv.textContent = 'Something went wrong. Please check your connection and try again.';
        form.appendChild(errDiv);
      })
      .finally(() => {
        submitBtn.disabled = false;
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
