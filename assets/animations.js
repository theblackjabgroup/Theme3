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
      { passive: true },
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

function isElementVisibleForAnimation(element) {
  return !!element && !element.hasAttribute('hidden') && element.getClientRects().length > 0;
}

function animatePageLoadTargets(targets, options = {}) {
  const {
    duration = 1000,
    stagger = 90,
    delay = 0,
    easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    startOpacity = 0.7,
    startScale = 0.88,
    transformOrigin = 'center center',
  } = options;

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
        },
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
}

function preparePageLoadTargets(targets, options = {}) {
  const {
    startOpacity = 0.7,
    startScale = 0.88,
    transformOrigin = 'center center',
  } = options;

  targets.forEach((target) => {
    if (target.dataset.pageLoadItemAnimated === 'true') return;
    if (target.dataset.pageLoadPrepared === 'true') return;

    target.style.opacity = String(startOpacity);
    target.style.transform = `scale(${startScale})`;
    target.style.transformOrigin = transformOrigin;
    target.style.willChange = 'opacity, transform';
    target.dataset.pageLoadPrepared = 'true';
  });
}

function isPageLoadSectionExcluded(section) {
  const sectionId = section?.id || '';
  const className = typeof section?.className === 'string' ? section.className : '';
  const sectionIdentity = `${sectionId} ${className}`.toLowerCase();

  return (
    sectionIdentity.includes('announcement') ||
    sectionIdentity.includes('footer') ||
    sectionIdentity.includes('header') ||
    sectionIdentity.includes('email-popup') ||
    sectionIdentity.includes('email_popup') ||
    sectionIdentity.includes('back-to-top') ||
    sectionIdentity.includes('back_to_top')
  );
}

function compareDomPosition(a, b) {
  if (a === b) return 0;
  const position = a.compareDocumentPosition(b);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

function buildPageLoadAnimationJobs(rootEl = document) {
  const jobs = [];
  const containers = getPageLoadContainers(rootEl);
  containers.forEach((container) => {
    if (container.dataset.pageLoadAnimated === 'true') return;
    if (!isElementVisibleForAnimation(container)) return;

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

    targets = targets.filter(isElementVisibleForAnimation);
    if (!targets.length) return;

    jobs.push({
      triggerEl: container,
      targets,
      options: {
        duration,
        stagger,
        delay,
        easing,
        startOpacity,
        startScale,
        transformOrigin,
      },
      run() {
        if (container.dataset.pageLoadAnimated === 'true') return;
        animatePageLoadTargets(targets, this.options);
        container.dataset.pageLoadAnimated = 'true';
      },
    });
  });

  const sections = [];
  if (rootEl?.matches?.('.shopify-section')) {
    sections.push(rootEl);
  }
  if (rootEl?.querySelectorAll) {
    sections.push(...Array.from(rootEl.querySelectorAll('.shopify-section')));
  }

  sections.forEach((section) => {
    if (isPageLoadSectionExcluded(section)) return;
    if (section.dataset.pageLoadItemAnimated === 'true') return;
    if (!isElementVisibleForAnimation(section)) return;
    if (section.querySelector('[data-page-load-animate]')) return;

    const sectionOptions = {
      duration: 2000,
      stagger: 0,
      delay: 0,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      startOpacity: 0.7,
      startScale: 0.82,
      transformOrigin: 'center bottom',
    };

    jobs.push({
      triggerEl: section,
      targets: [section],
      options: sectionOptions,
      run() {
        if (section.dataset.pageLoadItemAnimated === 'true') return;
        animatePageLoadTargets([section], sectionOptions);
      },
    });
  });

  jobs.sort((a, b) => compareDomPosition(a.triggerEl, b.triggerEl));
  return jobs;
}

function initializePageLoadAnimations(rootEl = document) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const jobs = buildPageLoadAnimationJobs(rootEl);
  if (!jobs.length) return;

  jobs.forEach((job) => {
    preparePageLoadTargets(job.targets, job.options);
  });

  const [firstJob, ...restJobs] = jobs;
  firstJob.run();

  if (!restJobs.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const triggerEl = entry.target;
        const job = restJobs.find((candidate) => candidate.triggerEl === triggerEl);
        if (!job) return;
        job.run();
        obs.unobserve(triggerEl);
      });
    },
    {
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.1,
    },
  );

  restJobs.forEach((job) => observer.observe(job.triggerEl));
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
