if (!customElements.get('accordion-item')) {
  customElements.define(
    'accordion-item',
    class AccordionItem extends HTMLElement {
      constructor() {
        super();
        this.summary = this.querySelector('.accordion__summary');
        this.summary.addEventListener('click', this.toggle.bind(this));
      }

      toggle(event) {
        event.preventDefault();
        this.toggleAttribute('open');
      }
    },
  );
}
