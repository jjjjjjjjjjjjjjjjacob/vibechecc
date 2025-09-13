import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
  // Mobile optimization options
  mobileThreshold?: number | number[];
  mobileRootMargin?: string;
  reducedMotion?: boolean;
}

interface UseIntersectionObserverReturn<T extends Element = Element> {
  ref: React.RefObject<T | null>;
  isIntersecting: boolean;
  hasIntersected: boolean;
  // Mobile optimization properties
  isMobile: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Custom hook for intersection observer functionality
 * Optimized for mobile performance with adaptive thresholds and reduced motion support
 * Useful for implementing viewport-based animations and lazy loading
 */
export function useIntersectionObserver<T extends Element = Element>({
  threshold = 0.1,
  root = null,
  rootMargin = '0px',
  triggerOnce = false,
  // Mobile-optimized defaults
  mobileThreshold,
  mobileRootMargin,
  reducedMotion = false,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn<T> {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<T>(null);

  // Detect mobile and reduced motion preferences
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for mobile device
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Calculate optimized threshold and root margin for mobile
  const optimizedThreshold =
    isMobile && mobileThreshold !== undefined ? mobileThreshold : threshold;

  const optimizedRootMargin =
    isMobile && mobileRootMargin !== undefined
      ? mobileRootMargin
      : isMobile
        ? '100px' // Larger preload area on mobile
        : rootMargin;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip intersection observer if reduced motion is enabled
    if (reducedMotion || prefersReducedMotion) {
      setHasIntersected(true);
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;

        setIsIntersecting(isElementIntersecting);

        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);

          // Add will-change hint for animation performance
          if (element instanceof HTMLElement) {
            element.style.willChange = 'transform, opacity';

            // Remove will-change after animation completes (assume 500ms animation)
            setTimeout(() => {
              element.style.willChange = 'auto';
            }, 500);
          }
        }

        // If triggerOnce is true, disconnect observer after first intersection
        if (triggerOnce && isElementIntersecting) {
          observer.unobserve(element);
        }
      },
      {
        threshold: optimizedThreshold,
        root,
        rootMargin: optimizedRootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [
    optimizedThreshold,
    root,
    optimizedRootMargin,
    triggerOnce,
    hasIntersected,
    reducedMotion,
    prefersReducedMotion,
  ]);

  return {
    ref,
    isIntersecting,
    hasIntersected,
    // Additional mobile performance info
    isMobile,
    prefersReducedMotion: reducedMotion || prefersReducedMotion,
  };
}
