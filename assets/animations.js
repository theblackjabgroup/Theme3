const SCROLL_ANIMATION_TRIGGER_CLASSNAME = 'scroll-trigger';
const SCROLL_ANIMATION_OFFSCREEN_CLASSNAME = 'scroll-trigger--offscreen';
const SCROLL_ZOOM_IN_TRIGGER_CLASSNAME = 'animate--zoom-in';
const SCROLL_ANIMATION_CANCEL_CLASSNAME = 'scroll-trigger--cancel';
const PAGE_LOAD_ANIMATION_SELECTOR = '[data-page-load-animate]';

// Scroll in animation logic
function onIntersection(elements, observer) {
  elements.forEach((element, index) => {
    if (element.isIntersecting) {
      const elementTarget = element.target;
      if (elementTarget.classList.contains(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME)) {
        elementTarget.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
        if (elementTarget.hasAttribute('data-cascade'))
          elementTarget.setAttribute('style', `--animation-order: ${index};`);
      }
      observer.unobserve(elementTarget);
    } else {
      element.target.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
      element.target.classList.remove(SCROLL_ANIMATION_CANCEL_CLASSNAME);
    }
  });
}

function initializeScrollAnimationTrigger(rootEl = document, isDesignModeEvent = false) {
  if (!window.themeAnimationsRevealOnScroll) return;

  const animationTriggerElements = Array.from(rootEl.getElementsByClassName(SCROLL_ANIMATION_TRIGGER_CLASSNAME));
  if (animationTriggerElements.length === 0) return;

  if (isDesignModeEvent) {
    animationTriggerElements.forEach((element) => {
      element.classList.add('scroll-trigger--design-mode');
    });
    return;
  }

  const observer = new IntersectionObserver(onIntersection, {
    rootMargin: '0px 0px -50px 0px',
  });
  animationTriggerElements.forEach((element) => observer.observe(element));
}

// Zoom in animation logic
function initializeScrollZoomAnimationTrigger() {
  if (!window.themeAnimationsRevealOnScroll) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const animationTriggerElements = Array.from(document.getElementsByClassName(SCROLL_ZOOM_IN_TRIGGER_CLASSNAME));

  if (animationTriggerElements.length === 0) return;

  const scaleAmount = 0.2 / 100;

  animationTriggerElements.forEach((element) => {
    let elementIsVisible = false;
    const observer = new IntersectionObserver((elements) => {
      elements.forEach((entry) => {
        elementIsVisible = entry.isIntersecting;
      });
    });
    observer.observe(element);

    element.style.setProperty('--zoom-in-ratio', 1 + scaleAmount * percentageSeen(element));

    window.addEventListener(
      'scroll',
      throttle(() => {
        if (!elementIsVisible) return;

        element.style.setProperty('--zoom-in-ratio', 1 + scaleAmount * percentageSeen(element));
      }),
      { passive: true }
    );
  });
}

function percentageSeen(element) {
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;
  const elementPositionY = element.getBoundingClientRect().top + scrollY;
  const elementHeight = element.offsetHeight;

  if (elementPositionY > scrollY + viewportHeight) {
    // If we haven't reached the image yet
    return 0;
  } else if (elementPositionY + elementHeight < scrollY) {
    // If we've completely scrolled past the image
    return 100;
  }

  // When the image is in the viewport
  const distance = scrollY + viewportHeight - elementPositionY;
  let percentage = distance / ((viewportHeight + elementHeight) / 100);
  return Math.round(percentage);
}

function getPageLoadContainers(rootEl = document) {
  const containers = [];

  if (rootEl?.matches?.(PAGE_LOAD_ANIMATION_SELECTOR)) {
    containers.push(rootEl);
  }

  if (rootEl?.querySelectorAll) {
    containers.push(...Array.from(rootEl.querySelectorAll(PAGE_LOAD_ANIMATION_SELECTOR)));
  }

  return containers;
}

function initializePageLoadAnimations(rootEl = document) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const containers = getPageLoadContainers(rootEl);
  if (!containers.length) return;

  containers.forEach((container) => {
    if (container.dataset.pageLoadAnimated === 'true') return;

    const selector = container.dataset.pageLoadSelector;
    const duration = Number(container.dataset.pageLoadDuration || 1000);
    const stagger = Number(container.dataset.pageLoadStagger || 90);
    const delay = Number(container.dataset.pageLoadDelay || 0);
    const easing = container.dataset.pageLoadEasing || 'cubic-bezier(0.34, 1.56, 0.64, 1)';
    const startOpacity = Number(container.dataset.pageLoadOpacity || 0.7);
    const startScale = Number(container.dataset.pageLoadScale || 0.88);
    const transformOrigin = container.dataset.pageLoadOrigin || 'center center';

    let targets = [];
    if (selector) {
      targets = Array.from(container.querySelectorAll(selector));
    } else {
      targets = Array.from(container.querySelectorAll('[data-page-load-item]'));
    }

    targets = targets.filter((target) => !target.hasAttribute('hidden') && target.getClientRects().length > 0);
    if (!targets.length) return;

    targets.forEach((target, index) => {
      const transitionDelay = delay + index * stagger;
      if (target.dataset.pageLoadItemAnimated === 'true') return;
      target.style.transformOrigin = transformOrigin;

      if (typeof target.animate === 'function') {
        const animation = target.animate(
          [
            { opacity: startOpacity, transform: `scale(${startScale})` },
            { opacity: 1, transform: 'scale(1)' },
          ],
          {
            duration,
            delay: transitionDelay,
            easing,
            fill: 'both',
          }
        );

        animation.onfinish = () => {
          target.style.opacity = '';
          target.style.transform = '';
          target.style.transformOrigin = '';
          target.dataset.pageLoadItemAnimated = 'true';
        };
      } else {
        target.style.opacity = String(startOpacity);
        target.style.transform = `scale(${startScale})`;
        target.style.transitionProperty = 'opacity, transform';
        target.style.transitionDuration = `${duration}ms`;
        target.style.transitionTimingFunction = easing;
        target.style.transitionDelay = `${transitionDelay}ms`;
        target.style.willChange = 'opacity, transform';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            target.style.opacity = '1';
            target.style.transform = 'scale(1)';
            target.style.transformOrigin = '';
            target.dataset.pageLoadItemAnimated = 'true';
          });
        });
      }
    });

    container.dataset.pageLoadAnimated = 'true';
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initializeScrollAnimationTrigger();
  initializeScrollZoomAnimationTrigger();
  initializePageLoadAnimations();
});

if (Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => {
    initializeScrollAnimationTrigger(event.target, true);
    initializePageLoadAnimations(event.target);
  });
  document.addEventListener('shopify:section:reorder', () => {
    initializeScrollAnimationTrigger(document, true);
    initializePageLoadAnimations(document);
  });
}
