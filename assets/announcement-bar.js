class AnnouncementBar extends HTMLElement {
  constructor() {
    super();
    this.container = this;
    this.closeButton = this.querySelector('.announcement-bar__close');
    this.storageKey = 'announcement-bar-dismissed';

    if (this.closeButton) {
      this.closeButton.addEventListener('click', this.dismiss.bind(this));
    }

    this.checkDismissal();
    this.initCountdown();
  }

  checkDismissal() {
    if (sessionStorage.getItem(this.storageKey)) {
      this.setAttribute('hidden', '');
    }
  }

  dismiss() {
    this.setAttribute('hidden', '');
    sessionStorage.setItem(this.storageKey, 'true');
  }

  initCountdown() {
    const countdowns = this.querySelectorAll('[data-countdown]');
    countdowns.forEach((countdown) => {
      const targetDate = new Date(countdown.dataset.countdown).getTime();

      const update = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
          countdown.innerHTML = 'EXPIRED';
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const dBox = countdown.querySelector('.d');
        const hBox = countdown.querySelector('.h');
        const mBox = countdown.querySelector('.m');
        const sBox = countdown.querySelector('.s');

        if (dBox) dBox.innerText = days.toString().padStart(2, '0');
        if (hBox) hBox.innerText = hours.toString().padStart(2, '0');
        if (mBox) mBox.innerText = minutes.toString().padStart(2, '0');
        if (sBox) sBox.innerText = seconds.toString().padStart(2, '0');
      };

      update();
      const intervalId = setInterval(() => {
        update();
        const now = new Date().getTime();
        const distance = targetDate - now;
        if (distance < 0) {
          clearInterval(intervalId);
        }
      }, 1000);
    });
  }
}

customElements.define('announcement-bar', AnnouncementBar);
