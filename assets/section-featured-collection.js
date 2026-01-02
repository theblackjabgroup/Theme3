(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initSection(root) {
    const rail = root.querySelector('[data-fc3d-rail]');
    const allCards = Array.from(root.querySelectorAll('[data-fc3d-card]'));
    const originalCards = allCards.filter(card => !card.hasAttribute('data-fc3d-card-clone'));
    const prev = root.querySelector('[data-fc3d-prev]');
    const next = root.querySelector('[data-fc3d-next]');

    if (!rail || allCards.length === 0) return;

    function getOriginalSetWidth() {
      if (originalCards.length === 0) return 0;
      
      // Use offset-based calculations which are scroll-position independent
      // offsetLeft and offsetWidth are layout-relative, not viewport-relative,
      // so they work correctly even when the carousel is scrolled
      
      const firstCard = originalCards[0];
      const lastCard = originalCards[originalCards.length - 1];
      
      if (firstCard && lastCard) {
        // Since cards are direct children of rail, offsetLeft is relative to rail
        const firstCardLeft = firstCard.offsetLeft;
        const lastCardLeft = lastCard.offsetLeft;
        const lastCardWidth = lastCard.offsetWidth || lastCard.clientWidth;
        
        // Total width from rail left edge to last card right edge
        return lastCardLeft + lastCardWidth;
      }
      
      // Fallback - calculate manually using offsetWidth
      // This sums card widths and gaps, then adds padding from rail left to first card
      let totalWidth = 0;
      originalCards.forEach((card, index) => {
        totalWidth += card.offsetWidth || card.clientWidth;
        if (index < originalCards.length - 1) {
          // Try to get gap from CSS
          const railStyle = getComputedStyle(rail);
          const gap = parseFloat(railStyle.gap) || 
                      parseFloat(railStyle.columnGap) || 
                      0;
          totalWidth += gap;
        }
      });
      
      // Add padding from rail left edge to first card
      if (originalCards.length > 0) {
        const firstCard = originalCards[0];
        totalWidth += firstCard.offsetLeft;
      }
      
      return totalWidth;
    }
    
    let originalSetWidth = 0;
    
    // Calculate width after layout
    function calculateSetWidth() {
      originalSetWidth = getOriginalSetWidth();
    }

    function cardStep() {
      if (allCards.length < 2) return allCards[0].clientWidth;
      const a = allCards[0].getBoundingClientRect();
      const b = allCards[1].getBoundingClientRect();
      const delta = Math.abs(b.left - a.left);
      return delta || allCards[0].clientWidth;
    }

    function setCenterCard() {
      const railRect = rail.getBoundingClientRect();
      const railCenter = railRect.left + railRect.width / 2;

      let best = null;
      let bestDist = Infinity;

      allCards.forEach((card) => {
        const r = card.getBoundingClientRect();
        if (r.width === 0) return;
        const center = r.left + r.width / 2;
        const dist = Math.abs(center - railCenter);
        if (dist < bestDist) {
          bestDist = dist;
          best = card;
        }
      });

      allCards.forEach((card) => {
        const isCenter = card === best;
        card.classList.toggle('is-center', isCenter);
      });
    }

    function handleInfiniteScroll() {
      if (originalSetWidth === 0) {
        calculateSetWidth();
        if (originalSetWidth === 0) return;
      }
      
      const scrollLeft = rail.scrollLeft;
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      const threshold = 20; // Threshold to prevent flickering

      // If scrolled past the duplicate set (near the end), jump back to original set
      // Check if we're at or past the end of the duplicate set
      if (scrollLeft >= originalSetWidth * 2 - threshold || scrollLeft >= maxScroll - threshold) {
        const newScroll = scrollLeft - originalSetWidth;
        // Temporarily disable smooth scrolling for instant jump
        const oldBehavior = rail.style.scrollBehavior;
        rail.style.scrollBehavior = 'auto';
        rail.scrollLeft = newScroll;
        // Re-enable smooth scrolling after jump
        requestAnimationFrame(() => {
          rail.style.scrollBehavior = oldBehavior || '';
        });
      }
      // If scrolled to the beginning (going backwards), jump to duplicate set
      else if (scrollLeft <= threshold && originalSetWidth > 0) {
        const newScroll = originalSetWidth + scrollLeft;
        // Temporarily disable smooth scrolling for instant jump
        const oldBehavior = rail.style.scrollBehavior;
        rail.style.scrollBehavior = 'auto';
        rail.scrollLeft = newScroll;
        // Re-enable smooth scrolling after jump
        requestAnimationFrame(() => {
          rail.style.scrollBehavior = oldBehavior || '';
        });
      }
    }

    let raf = null;
    let isScrolling = false;
    let scrollTimeout = null;
    
    function onScroll() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setCenterCard();
        if (!isScrolling) {
          handleInfiniteScroll();
        }
      });
      
      // Clear any pending scroll timeout
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 150);
    }

    function scrollByStep(direction) {
      isScrolling = true;
      const step = cardStep();
      const currentScroll = rail.scrollLeft;
      const targetScroll = currentScroll + (direction * step);
      
      rail.scrollTo({
        left: targetScroll,
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
      });
      
      // Check for infinite loop after scroll
      setTimeout(() => {
        handleInfiniteScroll();
        isScrolling = false;
      }, prefersReducedMotion.matches ? 50 : 600);
    }

    prev?.addEventListener('click', () => scrollByStep(-1));
    next?.addEventListener('click', () => scrollByStep(1));

    rail.addEventListener('scroll', onScroll, { passive: true });
    
    // Recalculate on resize
    window.addEventListener('resize', () => {
      calculateSetWidth();
      handleInfiniteScroll();
      setCenterCard();
    });

    // Initialize scroll position to start of duplicate set for seamless backward scrolling
    function initializeScroll() {
      calculateSetWidth();
      
      // If width calculation failed, try again after a delay
      if (originalSetWidth === 0 && originalCards.length > 0) {
        setTimeout(() => {
          calculateSetWidth();
          if (originalSetWidth > 0) {
            rail.scrollLeft = originalSetWidth;
            setCenterCard();
          }
        }, 200);
        return;
      }
      
      if (originalSetWidth > 0) {
        // Set scroll position to start of duplicate set
        rail.scrollLeft = originalSetWidth;
      }
      setCenterCard();
    }

    // Wait for layout to calculate properly - use multiple attempts
    let initAttempts = 0;
    function tryInitialize() {
      initAttempts++;
      calculateSetWidth();
      
      if (originalSetWidth > 0 || initAttempts >= 5) {
        if (originalSetWidth > 0) {
          rail.scrollLeft = originalSetWidth;
        }
        setCenterCard();
      } else {
        requestAnimationFrame(() => {
          setTimeout(tryInitialize, 100);
        });
      }
    }
    
    requestAnimationFrame(() => {
      setTimeout(tryInitialize, 50);
    });
  }

  function initAll() {
    document.querySelectorAll('[data-fc3d-section]').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Theme editor: re-init on section load
  document.addEventListener('shopify:section:load', (event) => {
    const section = event.target?.querySelector?.('[data-fc3d-section]') || event.target;
    if (section?.matches?.('[data-fc3d-section]')) initSection(section);
  });
})();
