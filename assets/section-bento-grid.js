(() => {
  function initSpritesheetAnimations() {
    const contentCards = document.querySelectorAll(
      '.content-card.has-spritesheet, .content-card.has-spritesheet-vertical'
    );

    contentCards.forEach((card) => {
      const spriteSide = card.querySelector('.content-card-sprite-side');
      if (!spriteSide) return;

      const isVertical = card.classList.contains('has-spritesheet-vertical');
      const totalFrames = parseInt(getComputedStyle(spriteSide).getPropertyValue('--sprite-frames')) || 8;
      const totalDuration =
        parseFloat(getComputedStyle(spriteSide).getPropertyValue('--sprite-animation-duration')) || 1.0;
      const timingFunc =
        getComputedStyle(spriteSide).getPropertyValue('--sprite-animation-timing') || `steps(${totalFrames - 1})`;

      let currentFrame = 0;
      let animationStartTime = null;
      let startFrame = 0;
      let targetFrame = 0;
      let animationFrameId = null;
      let isHovering = false;

      function updateSpritePosition(frame) {
        const progress = frame / (totalFrames - 1);
        const percent = Math.max(0, Math.min(100, progress * 100));

        if (isVertical) {
          spriteSide.style.backgroundPosition = `50% ${percent}%`;
        } else {
          const verticalAlign =
            getComputedStyle(spriteSide).getPropertyValue('--desktop-sprite-vertical-alignment') || '50%';
          spriteSide.style.backgroundPosition = `${percent}% ${verticalAlign}`;
        }
        currentFrame = frame;
      }

      function animate() {
        if (animationStartTime === null) return;

        const now = performance.now();
        const elapsed = (now - animationStartTime) / 1000;
        const progress = Math.min(
          1,
          elapsed / ((Math.abs(targetFrame - startFrame) / (totalFrames - 1)) * totalDuration || 0.001)
        );

        const frameProgress = startFrame + (targetFrame - startFrame) * progress;

        // Use discrete steps for frames
        const frameToSet = targetFrame > startFrame ? Math.floor(frameProgress) : Math.ceil(frameProgress);

        updateSpritePosition(frameToSet);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          animationStartTime = null;
        }
      }

      function startAnimation(toFrame) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        startFrame = currentFrame;
        targetFrame = toFrame;

        if (startFrame === targetFrame) return;

        animationStartTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);
      }

      card.addEventListener('mouseenter', () => {
        isHovering = true;
        startAnimation(totalFrames - 1);
      });

      card.addEventListener('mouseleave', () => {
        isHovering = false;
        startAnimation(0);
      });

      // Initialize position
      updateSpritePosition(0);
    });
  }

  function initToggleCards() {
    const toggleCards = document.querySelectorAll('[data-toggle-card]');
    
    toggleCards.forEach((card) => {
      const toggleInput = card.querySelector('[data-toggle-input]');
      if (!toggleInput) return;

      // Optional: Load saved state from localStorage
      const cardId = toggleInput.id;
      const savedState = localStorage.getItem(`toggle-${cardId}`);
      if (savedState === 'true') {
        toggleInput.checked = true;
      }

      // Handle toggle change
      toggleInput.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        
        // Optional: Save state to localStorage
        localStorage.setItem(`toggle-${cardId}`, isChecked.toString());
        
        // Optional: Trigger custom event for other scripts to listen to
        const toggleEvent = new CustomEvent('toggleChange', {
          detail: {
            cardId: cardId,
            checked: isChecked,
            card: card
          }
        });
        card.dispatchEvent(toggleEvent);
        
        // Optional: Add ripple effect or other visual feedback
        const slider = card.querySelector('.toggle-slider');
        if (slider) {
          slider.style.transform = 'scale(0.98)';
          setTimeout(() => {
            slider.style.transform = '';
          }, 150);
        }
      });

      // Add keyboard support
      toggleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleInput.checked = !toggleInput.checked;
          toggleInput.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  function initAll() {
    initSpritesheetAnimations();
    initToggleCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Theme editor: re-init on section load
  document.addEventListener('shopify:section:load', (event) => {
    const section = event.target?.querySelector?.('.bento-grid-container') || event.target;
    if (section?.matches?.('.bento-grid-container')) {
      initSpritesheetAnimations();
      initToggleCards();
    }
  });
})();
