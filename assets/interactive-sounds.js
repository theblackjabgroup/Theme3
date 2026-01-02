/**
 * Interactive Sounds System
 * Adds sound effects for hover and click interactions on bento grid cards and header elements
 */

class InteractiveSounds {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.volume = 0.3; // Default volume (0-1)
    this.init();
  }

  init() {
    // Initialize AudioContext (requires user interaction first)
    this.setupAudioContext();
    
    // Add event listeners for bento grid cards
    this.setupBentoGridSounds();
    
    // Add event listeners for header elements
    this.setupHeaderSounds();
    
    // Respect user preferences (reduced motion, etc.)
    this.checkUserPreferences();
  }

  setupAudioContext() {
    // AudioContext requires user interaction, so we'll create it on first interaction
    document.addEventListener('click', () => {
      if (!this.audioContext) {
        try {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
          console.warn('AudioContext not supported');
          this.isEnabled = false;
        }
      }
    }, { once: true });
  }

  checkUserPreferences() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.isEnabled = false;
    }
  }

  // Generate a beep sound using Web Audio API
  playSound(frequency = 440, duration = 50, type = 'sine', volume = this.volume, envelope = null) {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      const now = this.audioContext.currentTime;
      
      if (envelope) {
        // Custom envelope
        gainNode.gain.setValueAtTime(0, now);
        envelope.forEach((point, index) => {
          gainNode.gain.linearRampToValueAtTime(
            point.value * volume,
            now + (point.time * duration / 1000)
          );
        });
      } else {
        // Default envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
      }

      oscillator.start(now);
      oscillator.stop(now + duration / 1000);
    } catch (e) {
      // Silently fail if audio can't be played
    }
  }

  // Play a chord (multiple frequencies)
  playChord(frequencies, duration = 100, type = 'sine', volume = this.volume) {
    if (!this.isEnabled || !this.audioContext) return;
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playSound(freq, duration, type, volume * 0.3);
      }, index * 10);
    });
  }

  // Hover sound - soft, pleasant pop
  playHoverSound() {
    // Quick upward sweep with gentle fade
    this.playSound(800, 40, 'sine', this.volume * 0.3, [
      { time: 0, value: 0 },
      { time: 0.1, value: 1 },
      { time: 0.3, value: 0.5 },
      { time: 1, value: 0 }
    ]);
  }

  // Click sound - satisfying pop/click
  playClickSound() {
    // Quick click with slight frequency variation
    const baseFreq = 600;
    const now = this.audioContext?.currentTime;
    
    if (!this.isEnabled || !this.audioContext || !now) return;
    
    try {
      // Main click
      const osc1 = this.audioContext.createOscillator();
      const gain1 = this.audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(this.audioContext.destination);
      
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.01);
      osc1.type = 'sine';
      
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(this.volume * 0.5, now + 0.005);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      
      osc1.start(now);
      osc1.stop(now + 0.05);
      
      // Subtle lower tone for depth
      setTimeout(() => {
        this.playSound(300, 30, 'sine', this.volume * 0.2);
      }, 5);
    } catch (e) {
      // Fallback
      this.playSound(500, 50, 'sine', this.volume * 0.5);
    }
  }

  // Success sound - pleasant two-tone chime
  playSuccessSound() {
    this.playChord([523, 659], 150, 'sine', this.volume * 0.4);
  }

  // Error sound - descending tone
  playErrorSound() {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      const now = this.audioContext.currentTime;
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      osc.type = 'sawtooth';
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      this.playSound(200, 100, 'sawtooth', this.volume * 0.5);
    }
  }

  setupBentoGridSounds() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.attachBentoGridListeners());
    } else {
      this.attachBentoGridListeners();
    }
  }

  attachBentoGridListeners() {
    // Find all bento cards
    const bentoCards = document.querySelectorAll('.bento-card');
    
    bentoCards.forEach(card => {
      // Hover sound
      card.addEventListener('mouseenter', () => {
        this.playHoverSound();
      }, { passive: true });

      // Click sound
      card.addEventListener('click', (e) => {
        // Don't play sound if clicking on interactive elements inside (buttons, links, etc.)
        if (!e.target.closest('button, a, input, select, textarea')) {
          this.playClickSound();
        }
      }, { passive: true });
    });

    // Special handling for interactive elements inside cards
    const cardButtons = document.querySelectorAll('.bento-card button, .bento-card a');
    cardButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.playClickSound();
      }, { passive: true });
    });
  }

  setupHeaderSounds() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.attachHeaderListeners());
    } else {
      this.attachHeaderListeners();
    }
  }

  attachHeaderListeners() {
    // Header search icon
    const searchButtons = document.querySelectorAll('[data-spotlight-search-toggle], .dock-search-link, .mobile-search-icon');
    searchButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.playClickSound();
      }, { passive: true });
      
      button.addEventListener('mouseenter', () => {
        this.playHoverSound();
      }, { passive: true });
    });

    // Cart icon
    const cartIcons = document.querySelectorAll('.cart-card, .mobile-cart-icon, .dock-cart-link');
    cartIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        this.playClickSound();
      }, { passive: true });
      
      icon.addEventListener('mouseenter', () => {
        this.playHoverSound();
      }, { passive: true });
    });

    // Welcome/Login icon
    const welcomeIcons = document.querySelectorAll('.login-card, .dock-welcome-link, .mobile-welcome-icon');
    welcomeIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        this.playClickSound();
      }, { passive: true });
      
      icon.addEventListener('mouseenter', () => {
        this.playHoverSound();
      }, { passive: true });
    });

    // Menu toggle (mobile)
    const menuToggle = document.querySelectorAll('[data-mobile-menu-toggle], .mobile-menu-toggle');
    menuToggle.forEach(toggle => {
      toggle.addEventListener('click', () => {
        this.playClickSound();
      }, { passive: true });
    });

    // Dock menu items
    const dockMenuItems = document.querySelectorAll('.dock-link, .dock-menu-item');
    dockMenuItems.forEach(item => {
      item.addEventListener('click', () => {
        this.playClickSound();
      }, { passive: true });
      
      item.addEventListener('mouseenter', () => {
        this.playHoverSound();
      }, { passive: true });
    });

    // Mobile menu items
    const mobileMenuItems = document.querySelectorAll('.mobile-menu-link, .mobile-submenu-link');
    mobileMenuItems.forEach(item => {
      item.addEventListener('click', () => {
        this.playClickSound();
      }, { passive: true });
    });
  }

  // Public method to enable/disable sounds
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Public method to set volume (0-1)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

// Initialize the sound system
const interactiveSounds = new InteractiveSounds();

// Export for potential external control
window.interactiveSounds = interactiveSounds;

