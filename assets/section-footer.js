document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('EditorialFooterNewsletter');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const submitBtn = form.querySelector('.ef-submit');
    const originalBtnContent = submitBtn.innerHTML;
    const input = form.querySelector('.ef-input');
    const messageContainer = form.querySelector('.ef-form-inner'); // We'll append messages here or handle them

    // Clear previous messages
    const existingMessages = form.querySelectorAll('.ef-message');
    existingMessages.forEach((el) => el.remove());

    // Disable button to prevent double submit
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

        // Check for success or errors in the returned HTML
        const successMessage = doc.querySelector('.ef-message--success');
        const errorMessage = doc.querySelector('.ef-message--error');

        if (successMessage) {
          // Success
          input.value = '';
          form.appendChild(successMessage);
        } else if (errorMessage) {
          // Error
          form.appendChild(errorMessage);
        } else {
          // Fallback check if standard Shopify posted param checks failed to render our class
          // Alternatively, check if the URL *would* have posted successfully
          const newSuccess = document.createElement('div');
          newSuccess.className = 'ef-message ef-message--success';
          newSuccess.textContent = 'Thanks for subscribing!';
          form.appendChild(newSuccess);
          input.value = '';
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        const errDiv = document.createElement('div');
        errDiv.className = 'ef-message ef-message--error';
        errDiv.textContent = 'Something went wrong. Please try again.';
        form.appendChild(errDiv);
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
  });
});
