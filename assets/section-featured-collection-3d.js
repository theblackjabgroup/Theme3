(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initSection(root) {
    const rail = root.querySelector('[data-fc3d-rail]');
    const cards = Array.from(root.querySelectorAll('[data-fc3d-card]'));
    const prev = root.querySelector('[data-fc3d-prev]');
    const next = root.querySelector('[data-fc3d-next]');

    if (!rail || cards.length === 0) return;

    function cardStep() {
      if (cards.length < 2) return cards[0].clientWidth;
      const a = cards[0].getBoundingClientRect();
      const b = cards[1].getBoundingClientRect();
      const delta = Math.abs(b.left - a.left);
      return delta || cards[0].clientWidth;
    }

    function setCenterCard() {
      const railRect = rail.getBoundingClientRect();
      const railCenter = railRect.left + railRect.width / 2;

      let best = null;
      let bestDist = Infinity;

      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        if (r.width === 0) return;
        const center = r.left + r.width / 2;
        const dist = Math.abs(center - railCenter);
        if (dist < bestDist) {
          bestDist = dist;
          best = card;
        }
      });

      cards.forEach((card) => {
        const isCenter = card === best;
        card.classList.toggle('is-center', isCenter);
        if (!isCenter) card.classList.remove('is-flipped');
      });
    }

    let raf = null;
    function onScroll() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(setCenterCard);
    }

    function scrollByStep(direction) {
      rail.scrollBy({
        left: direction * cardStep(),
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
      });
    }

    prev?.addEventListener('click', () => scrollByStep(-1));
    next?.addEventListener('click', () => scrollByStep(1));

    rail.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', setCenterCard);

    // Mobile/touch: tap the center card to flip/unflip.
    const canHover = window.matchMedia('(hover: hover)').matches;
    if (!canHover) {
      rail.addEventListener('pointerup', (e) => {
        const targetCard = e.target.closest('[data-fc3d-card]');
        if (!targetCard || !targetCard.classList.contains('is-center')) return;

        // Don't interfere with actual navigation clicks.
        if (e.target.closest('a, button')) return;

        targetCard.classList.toggle('is-flipped');
      });
    }

    // Initial state
    setCenterCard();
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
