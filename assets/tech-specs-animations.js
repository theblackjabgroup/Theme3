document.addEventListener('DOMContentLoaded', () => {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Run only once

        // Animate ALL Tooltip Values
        const tooltipVals = entry.target.querySelectorAll('.dc-tooltip-val');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        tooltipVals.forEach((tooltipVal) => {
          if (reducedMotion) {
            // Instant update for accessibility
            tooltipVal.textContent = tooltipVal.dataset.value;
          } else {
            // Standard Animation with delay
            tooltipVal.textContent = '0'; // Reset to 0
            setTimeout(() => {
              const originalText = tooltipVal.dataset.value;
              const finalVal = parseFloat(originalText);
              const decimalPlaces = originalText.includes('.') ? originalText.split('.')[1].length : 0;
              const duration = 2000; // 2s to match CSS transition
              const startTime = performance.now();

              function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing: cubic-bezier(0.22, 1, 0.36, 1) approximation or just easeOut
                const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

                const current = ease * finalVal;

                if (decimalPlaces > 0) {
                  tooltipVal.textContent = current.toFixed(decimalPlaces);
                } else {
                  tooltipVal.textContent = Math.floor(current);
                }

                if (progress < 1) {
                  requestAnimationFrame(update);
                } else {
                  tooltipVal.textContent = originalText; // Ensure exact end
                }
              }
              requestAnimationFrame(update);
            }, 2000);
          }
        });
      }
    });
  }, observerOptions);

  const grids = document.querySelectorAll('.sc-grid');
  grids.forEach((grid) => observer.observe(grid));
});
