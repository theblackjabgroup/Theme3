document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('EditorialFooterNewsletter');
  if (!form) return;

  // Fix: Use a submission flag to prevent race conditions (e.g. double Enter key)
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

    // Clear previous messages
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
        // If Shopify redirects to a challenge (captcha), we must follow it
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

        // Fix: Strict check for success/error elements. Do NOT assume success if missing.
        const successMessage = doc.querySelector('.ef-message--success');
        const errorMessage = doc.querySelector('.ef-message--error') || doc.querySelector('.errors');

        if (successMessage) {
          // Genuine Success
          input.value = '';
          form.appendChild(successMessage);
        } else if (errorMessage) {
          // Genuine Error
          if (!errorMessage.classList.contains('ef-message')) {
            errorMessage.className = 'ef-message ef-message--error';
          }
          form.appendChild(errorMessage);
        } else {
          // Unknown state - DO NOT show "Thanks for subscribing".
          // This handles cases like 500 errors or malformed responses.
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
});
