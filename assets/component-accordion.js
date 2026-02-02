if (!customElements.get('accordion-item')) {
  customElements.define(
    'accordion-item',
    class AccordionItem extends HTMLElement {
      constructor() {
        super();
        this.summary = this.querySelector('.accordion__summary');
        if (this.summary) {
          this.summary.setAttribute('aria-expanded', this.hasAttribute('open'));
          this.summary.addEventListener('click', this.toggle.bind(this));
          this.summary.addEventListener('keydown', this.onKeydown.bind(this));
        }
      }

      onKeydown(event) {
        if (event.code === 'Enter' || event.code === 'Space') {
          this.toggle(event);
        }
      }

      toggle(event) {
        event.preventDefault();
        this.toggleAttribute('open');
        this.summary.setAttribute('aria-expanded', this.hasAttribute('open'));
      }
    },
  );
}
