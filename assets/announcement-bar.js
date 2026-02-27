class AnnouncementBar extends HTMLElement {
  constructor() {
    super();
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
}

customElements.define('announcement-bar', AnnouncementBar);
