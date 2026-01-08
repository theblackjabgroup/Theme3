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

        // Animate Tooltip Value after 2s delay
        const tooltipVal = entry.target.querySelector('.dc-tooltip-val');
        if (tooltipVal) {
          setTimeout(() => {
            const finalVal = parseInt(tooltipVal.dataset.value, 10);
            const duration = 500; // 0.5s to match CSS transition
            const startTime = performance.now();

            function update(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);

              // Easing: cubic-bezier(0.22, 1, 0.36, 1) approximation or just easeOut
              const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

              const current = Math.floor(ease * finalVal);
              tooltipVal.textContent = current;

              if (progress < 1) {
                requestAnimationFrame(update);
              } else {
                tooltipVal.textContent = finalVal; // Ensure exact end
              }
            }
            requestAnimationFrame(update);
          }, 2000);
        }
      }
    });
  }, observerOptions);

  const grids = document.querySelectorAll('.sc-grid');
  grids.forEach((grid) => observer.observe(grid));
});
