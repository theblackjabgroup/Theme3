/**
 * Mega Menu Modal Interaction and Animated Underline
 */

class MegaMenu {
  constructor() {
    this.nav = document.querySelector('.header__nav');
    this.underline = document.querySelector('.header__nav-underline');
    this.triggers = document.querySelectorAll('.header__menu-item'); // Includes all nav links
    this.modals = document.querySelectorAll('[data-mega-menu]');
    this.body = document.body;

    this.init();
  }

  init() {
    this.triggers.forEach((trigger) => {
      // Mega Menu Toggle
      if (trigger.hasAttribute('data-mega-menu-trigger')) {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          const expanded = trigger.getAttribute('aria-expanded') === 'true';
          this.closeAll();
          if (!expanded) {
            this.open(trigger);
          }
        });
      }

      // Underline Movement on Hover
      trigger.addEventListener('mouseenter', () => this.moveUnderline(trigger));
    });

    // Reset underline when leaving the navigation area
    if (this.nav) {
      this.nav.addEventListener('mouseleave', () => this.resetUnderline());
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header__menu-item-wrapper')) {
        this.closeAll();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAll();
      }
    });

    // Initial underline check (if an item is open)
    this.resetUnderline();
  }

  moveUnderline(element) {
    if (!this.underline || !element || !this.nav) return;

    const navRect = this.nav.getBoundingClientRect();
    const elRect = element.getBoundingClientRect();

    const left = elRect.left - navRect.left;
    const width = elRect.width;

    this.underline.style.width = `${width}px`;
    this.underline.style.transform = `translateX(${left}px)`;
    this.underline.style.opacity = '1';
  }

  resetUnderline() {
    const activeTrigger = Array.from(this.triggers).find((t) => t.getAttribute('aria-expanded') === 'true');
    if (activeTrigger) {
      this.moveUnderline(activeTrigger);
    } else {
      if (this.underline) this.underline.style.opacity = '0';
    }
  }

  open(trigger) {
    const modalId = trigger.getAttribute('aria-controls');
    const modal = document.getElementById(modalId);
    if (modal) {
      trigger.setAttribute('aria-expanded', 'true');
      modal.classList.add('is-open');
      this.body.classList.add('mega-menu-open');
      this.moveUnderline(trigger);
    }
  }

  closeAll() {
    this.triggers.forEach((t) => t.setAttribute('aria-expanded', 'false'));
    this.modals.forEach((m) => m.classList.remove('is-open'));
    this.body.classList.remove('mega-menu-open');
    this.resetUnderline();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MegaMenu();
});
