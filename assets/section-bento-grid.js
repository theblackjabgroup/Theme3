(() => {
  function initSpritesheetAnimations() {
    const contentCards = document.querySelectorAll(
      '.content-card.has-spritesheet, .content-card.has-spritesheet-vertical',
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
          elapsed / ((Math.abs(targetFrame - startFrame) / (totalFrames - 1)) * totalDuration || 0.001),
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

  function setToggleSlideDistance(card) {
    const ui = card.querySelector('.toggle-ui');
    const knob = card.querySelector('.toggle-knob');
    const labelsBottom = card.querySelector('.toggle-labels--bottom');
    if (!ui || !knob || !labelsBottom) return;

    const isHorizontal = card.classList.contains('toggle-card--horizontal');
    /* Measure knob at rest: getBoundingClientRect() includes CSS transform, so when
       the toggle is checked the knob is already translated and the computed distance
       would be wrong. Temporarily clear transform so we measure untransformed position. */
    const prevTransform = knob.style.transform;
    knob.style.transform = 'none';
    const knobRect = knob.getBoundingClientRect();
    knob.style.transform = prevTransform;

    const bottomRect = labelsBottom.getBoundingClientRect();
    const gap = 12; /* Spacing between icon and edge when at bottom/right */
    if (isHorizontal) {
      const slideX = bottomRect.left - knobRect.left - gap;
      ui.style.setProperty('--toggle-knob-slide-x', Math.max(0, slideX) + 'px');
    } else {
      /* Distance for knob to move down, stopping short so there's spacing after the icon */
      const slideY = bottomRect.top - knobRect.top - gap;
      ui.style.setProperty('--toggle-knob-slide', Math.max(0, slideY) + 'px');
    }
  }

  function initToggleCards() {
    const toggleCards = document.querySelectorAll('[data-toggle-card]');

    toggleCards.forEach((card) => {
      const toggleInput = card.querySelector('[data-toggle-input]');
      if (!toggleInput) return;

      setToggleSlideDistance(card);
      const ro = new ResizeObserver(() => setToggleSlideDistance(card));
      ro.observe(card);

      const schemeOn = toggleInput.dataset.schemeOn;
      const schemeOff = toggleInput.dataset.schemeOff;

      function updateTheme(checked) {
        if (!schemeOn || !schemeOff) return;

        const activeScheme = checked ? schemeOn : schemeOff;

        // Apply global attributes
        document.documentElement.setAttribute('data-global-theme-active', 'true');
        document.documentElement.setAttribute('data-active-scheme', activeScheme);

        // Persist
        localStorage.setItem('global-theme-scheme', activeScheme);
        localStorage.setItem('global-theme-checked', checked ? 'true' : 'false');

        // Sync all other toggles on the page
        document.querySelectorAll('[data-toggle-input]').forEach((input) => {
          if (input.checked !== checked) {
            input.checked = checked;
          }
        });
      }

      // Initial state from localStorage
      const savedChecked = localStorage.getItem('global-theme-checked');
      if (savedChecked !== null) {
        const isChecked = savedChecked === 'true';
        toggleInput.checked = isChecked;
        updateTheme(isChecked);
      } else if (toggleInput.checked) {
        // Handle "checked by default" in section settings
        updateTheme(true);
      }

      // Handle toggle change
      toggleInput.addEventListener('change', (e) => {
        updateTheme(e.target.checked);
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

    window.addEventListener('resize', () => {
      document.querySelectorAll('[data-toggle-card]').forEach(setToggleSlideDistance);
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
