(() => {
  function initSpritesheetAnimations() {
    const contentCards = document.querySelectorAll('.content-card.has-spritesheet, .content-card.has-spritesheet-vertical');
    
    contentCards.forEach(card => {
      const spriteSide = card.querySelector('.content-card-sprite-side');
      if (!spriteSide) return;
      
      let isHovering = false;
      let isAnimatingForward = false;
      let forwardAnimationComplete = false;
      let pendingReverse = false;
      let transitionEndHandler = null;
      let fallbackTimeout = null;
      
      // Get animation duration from CSS variable
      const duration = parseFloat(getComputedStyle(spriteSide).getPropertyValue('--sprite-animation-duration')) || 1.0;
      const durationMs = duration * 1000;
      const isVertical = card.classList.contains('has-spritesheet-vertical');
      
      // Get start and end positions
      const startPosition = isVertical ? '50% 0%' : '0% 50%';
      const endPosition = isVertical ? '50% 100%' : '100% 50%';
      
      // Clean up handlers
      function removeTransitionEndHandler() {
        if (transitionEndHandler) {
          spriteSide.removeEventListener('transitionend', transitionEndHandler);
          transitionEndHandler = null;
        }
      }
      
      function clearFallbackTimeout() {
        if (fallbackTimeout) {
          clearTimeout(fallbackTimeout);
          fallbackTimeout = null;
        }
      }
      
      // Handle hover in
      card.addEventListener('mouseenter', () => {
        isHovering = true;
        pendingReverse = false;
        forwardAnimationComplete = false;
        
        // Remove any existing handlers
        removeTransitionEndHandler();
        clearFallbackTimeout();
        
        // Reset to start position instantly
        spriteSide.style.transition = 'background-position 0s';
        spriteSide.style.backgroundPosition = startPosition;
        
        // Force reflow to ensure reset happens
        spriteSide.offsetHeight;
        
        // Start forward animation
        isAnimatingForward = true;
        spriteSide.style.transition = `background-position ${duration}s var(--sprite-animation-timing)`;
        spriteSide.style.backgroundPosition = endPosition;
        
        // Listen for animation completion
        transitionEndHandler = () => {
          if (isAnimatingForward) {
            forwardAnimationComplete = true;
            isAnimatingForward = false;
            clearFallbackTimeout();
            
            // If we're not hovering anymore, start reverse
            if (!isHovering && !pendingReverse) {
              pendingReverse = true;
              reverseAnimation();
            }
          }
          removeTransitionEndHandler();
        };
        
        spriteSide.addEventListener('transitionend', transitionEndHandler);
        
        // Fallback timeout in case transitionend doesn't fire
        fallbackTimeout = setTimeout(() => {
          if (isAnimatingForward) {
            forwardAnimationComplete = true;
            isAnimatingForward = false;
            removeTransitionEndHandler();
            
            // If we're not hovering anymore, start reverse
            if (!isHovering && !pendingReverse) {
              pendingReverse = true;
              reverseAnimation();
            }
          }
        }, durationMs + 100); // Add small buffer
      });
      
      // Handle hover out
      card.addEventListener('mouseleave', () => {
        isHovering = false;
        
        // If forward animation is still in progress, mark that we want to reverse
        if (isAnimatingForward && !forwardAnimationComplete) {
          pendingReverse = true;
          // The reverse will be triggered by the transitionend handler
        } else if (forwardAnimationComplete) {
          // Animation already complete, reverse immediately
          reverseAnimation();
        }
      });
      
      function reverseAnimation() {
        if (isHovering) {
          pendingReverse = false;
          return; // Don't reverse if hovering again
        }
        
        // Remove any existing handlers
        removeTransitionEndHandler();
        clearFallbackTimeout();
        
        // Set transition for reverse animation
        spriteSide.style.transition = `background-position ${duration}s var(--sprite-animation-timing)`;
        spriteSide.style.backgroundPosition = startPosition;
        
        forwardAnimationComplete = false;
        isAnimatingForward = false;
        pendingReverse = false;
      }
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

