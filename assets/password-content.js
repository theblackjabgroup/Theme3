window.PasswordModal = {
  modal: null,
  closeTimeout: null,

  init() {
    this.modal = document.getElementById('PasswordModal');
  },

  open() {
    if (!this.modal) this.init();
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    this.modal.classList.add('open');
    this.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this.modal) this.init();
    this.modal.classList.remove('open');
    if (this.closeTimeout) clearTimeout(this.closeTimeout);
    this.closeTimeout = setTimeout(() => {
      this.modal.classList.add('hidden');
      this.closeTimeout = null;
    }, 300); // Wait for fade out
    document.body.style.overflow = '';
  },

  toggleVisibility() {
    const input = document.getElementById('Password');
    if (input.type === 'password') {
      input.type = 'text';
    } else {
      input.type = 'password';
    }
  },
};

class PasswordCountdown {
  constructor(element) {
    this.element = element;
    this.targetDate = new Date(element.dataset.date.trim()).getTime();

    this.elements = {
      days: element.querySelector('[data-days]'),
      hours: element.querySelector('[data-hours]'),
      minutes: element.querySelector('[data-minutes]'),
      seconds: element.querySelector('[data-seconds]'),
    };

    this.update();
    this.interval = setInterval(this.update.bind(this), 1000);
  }

  update() {
    const now = new Date().getTime();
    const distance = this.targetDate - now;

    if (isNaN(distance) || distance < 0) {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      this.resetDisplay();
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    this.elements.days.innerText = days.toString().padStart(2, '0');
    this.elements.hours.innerText = hours.toString().padStart(2, '0');
    this.elements.minutes.innerText = minutes.toString().padStart(2, '0');
    this.elements.seconds.innerText = seconds.toString().padStart(2, '0');
  }

  resetDisplay() {
    Object.values(this.elements).forEach((el) => {
      if (el) el.innerText = '00';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const countdown = document.querySelector('.password-countdown');
  if (countdown) {
    new PasswordCountdown(countdown);
  }

  // Auto-open modal if there are errors
  const passwordInput = document.getElementById('Password');
  if (passwordInput && passwordInput.getAttribute('aria-invalid') === 'true') {
    window.PasswordModal.open();
  }
});
