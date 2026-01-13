import { useEffect } from 'react';

/**
 * Observes all .animate-on-scroll elements and adds .is-visible when in viewport.
 * Call once in HomePage component.
 *
 * Includes:
 * - IntersectionObserver feature detection with fallback
 * - Reduced motion preference check
 * - Cleanup on unmount
 */
export function useGlobalScrollAnimation() {
  useEffect(() => {
    // Feature detection: if IntersectionObserver not supported, show all content
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.classList.add('is-visible');
      });
      return;
    }

    // Skip animations if reduced motion is preferred
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.classList.add('is-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all animated elements
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
