class AnnouncementBar extends HTMLElement {
  constructor() {
    super();
    this.initCountdown();
    this.initPillLinks();
  }

  /* Make pill[data-href] elements clickable */
  initPillLinks() {
    this.querySelectorAll('.ab-pill[data-href]').forEach((pill) => {
      pill.addEventListener('click', () => {
        const href = pill.dataset.href;
        if (href) window.location.href = href;
      });
    });
  }

  initCountdown() {
    const countdowns = this.querySelectorAll('[data-countdown]');
    countdowns.forEach((countdown) => {
      const targetDate = new Date(countdown.dataset.countdown).getTime();
      if (isNaN(targetDate)) return;

      const update = () => {
        const now = Date.now();
        const distance = targetDate - now;

        if (distance < 0) {
          countdown.innerHTML = 'EXPIRED';
          return;
        }

        const days = Math.floor(distance / 86400000);
        const hours = Math.floor((distance % 86400000) / 3600000);
        const minutes = Math.floor((distance % 3600000) / 60000);
        const seconds = Math.floor((distance % 60000) / 1000);

        const pad = (n) => n.toString().padStart(2, '0');

        const dBox = countdown.querySelector('.d');
        const hBox = countdown.querySelector('.h');
        const mBox = countdown.querySelector('.m');
        const sBox = countdown.querySelector('.s');

        if (dBox) dBox.textContent = pad(days);
        if (hBox) hBox.textContent = pad(hours);
        if (mBox) mBox.textContent = pad(minutes);
        if (sBox) sBox.textContent = pad(seconds);
      };

      update();
      const id = setInterval(() => {
        update();
        if (Date.now() >= targetDate) clearInterval(id);
      }, 1000);
    });
  }
}

customElements.define('announcement-bar', AnnouncementBar);
