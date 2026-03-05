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
    const labelsTop = card.querySelector('.toggle-labels--top');
    const labelsBottom = card.querySelector('.toggle-labels--bottom');
    if (!ui || !knob || !labelsTop || !labelsBottom) return;

    const isHorizontal = card.classList.contains('toggle-card--horizontal');

    // Reset transforms to measure clean coordinates
    const prevKnobTransform = knob.style.transform;
    const prevTopTransform = labelsTop.style.transform;
    const prevBottomTransform = labelsBottom.style.transform;

    knob.style.transform = 'none';
    labelsTop.style.transform = 'none';
    labelsBottom.style.transform = 'none';

    const knobRect = knob.getBoundingClientRect();
    const topRect = labelsTop.getBoundingClientRect();
    const bottomRect = labelsBottom.getBoundingClientRect();

    // Restore transforms
    knob.style.transform = prevKnobTransform;
    labelsTop.style.transform = prevTopTransform;
    labelsBottom.style.transform = prevBottomTransform;

    if (isHorizontal) {
      // In horizontal mode, calculate offsets from center to both labels
      const knobCenter = knobRect.left + knobRect.width / 2;
      const topCenter = topRect.left + topRect.width / 2;
      const bottomCenter = bottomRect.left + bottomRect.width / 2;

      const startX = topCenter - knobCenter;
      const endX = bottomCenter - knobCenter;
      ui.style.setProperty('--toggle-knob-start-x', startX + 'px');
      ui.style.setProperty('--toggle-knob-end-x', endX + 'px');
    } else {
      // Calculate how far the knob needs to move to reach the top and bottom labels
      const knobCenter = knobRect.top + knobRect.height / 2;
      const topCenter = topRect.top + topRect.height / 2;
      const bottomCenter = bottomRect.top + bottomRect.height / 2;

      const startY = topCenter - knobCenter;
      const endY = bottomCenter - knobCenter;
      ui.style.setProperty('--toggle-knob-start-y', startY + 'px');
      ui.style.setProperty('--toggle-knob-end-y', endY + 'px');
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
