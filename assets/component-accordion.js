if (!customElements.get('accordion-item')) {
  customElements.define(
    'accordion-item',
    class AccordionItem extends HTMLElement {
      constructor() {
        super();
        this.onSummaryClick = this.toggle.bind(this);
        this.onSummaryKeydown = this.onKeydown.bind(this);
      }

      connectedCallback() {
        this.summary = this.querySelector('.accordion__summary');
        if (this.summary) {
          this.summary.setAttribute('aria-expanded', this.hasAttribute('open'));
          this.summary.addEventListener('click', this.onSummaryClick);
          this.summary.addEventListener('keydown', this.onSummaryKeydown);
        }
      }

      disconnectedCallback() {
        if (this.summary) {
          this.summary.removeEventListener('click', this.onSummaryClick);
          this.summary.removeEventListener('keydown', this.onSummaryKeydown);
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
