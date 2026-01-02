class SpotlightSearch {
  constructor() {
    this.modal = document.getElementById('spotlight-search-modal');
    this.toggleButtons = document.querySelectorAll('[data-spotlight-search-toggle]');
    this.searchInput = this.modal?.querySelector('.spotlight-search-input');
    this.resetButton = this.modal?.querySelector('.spotlight-search-reset');
    this.overlay = this.modal?.querySelector('.spotlight-search-overlay');
    
    this.init();
  }

  init() {
    if (!this.modal) return;

    // Add click listeners to toggle buttons
    this.toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });

    // Close on overlay click
    if (this.overlay) {
      this.overlay.addEventListener('click', () => {
        this.close();
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
      // Open with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Handle reset button
    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => {
        if (this.searchInput) {
          this.searchInput.value = '';
          this.searchInput.focus();
          this.toggleResetButton();
        }
      });
    }

    // Toggle reset button visibility
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.toggleResetButton();
      });
    }
  }

  open() {
    if (!this.modal) return;
    
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus input after animation
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.focus();
      }
    }, 100);
  }

  close() {
    if (!this.modal) return;
    
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Clear input
    if (this.searchInput) {
      this.searchInput.value = '';
      this.toggleResetButton();
    }
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  isOpen() {
    return this.modal?.getAttribute('aria-hidden') === 'false';
  }

  toggleResetButton() {
    if (!this.resetButton || !this.searchInput) return;
    
    if (this.searchInput.value.trim() !== '') {
      this.resetButton.classList.remove('hidden');
    } else {
      this.resetButton.classList.add('hidden');
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SpotlightSearch();
  });
} else {
  new SpotlightSearch();
}

