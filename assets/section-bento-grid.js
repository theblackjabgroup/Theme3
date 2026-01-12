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

  function initAll() {
    initSpritesheetAnimations();
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
    }
  });
})();
