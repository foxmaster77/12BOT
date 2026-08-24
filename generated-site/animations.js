document.addEventListener('DOMContentLoaded', () => {
  // Option configurations for IntersectionObserver
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.15
  };

  // Generic Scroll Reveal Observer
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const delay = target.dataset.delay || 0;

        setTimeout(() => {
          target.classList.add('is-visible');
        }, delay);

        observer.un