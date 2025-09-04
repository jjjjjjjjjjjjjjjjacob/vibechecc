/**
 * Performance tracking hooks for monitoring placeholder/skeleton components,
 * render times, and user interaction metrics
 */

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Simple console-based tracking for now until full analytics are implemented
const performanceTracking = {
  placeholderPerformance: (
    name: string,
    type: string,
    value: number,
    extra?: unknown
  ) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Performance] ${name} - ${type}: ${value}ms`, extra);
    }
  },
  loadingStateChanged: (name: string, state: string) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Loading] ${name} - ${state}`);
    }
  },
  loadingDuration: (name: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Loading] ${name} completed in ${duration}ms`);
    }
  },
  componentMounted: (name: string, timestamp: number) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Component] ${name} mounted at ${timestamp}`);
    }
  },
  componentUnmounted: (name: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Component] ${name} unmounted after ${duration}ms`);
    }
  },
  componentRendered: (name: string, count: number, timeSince: number) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(
        `[Component] ${name} render #${count} (${timeSince}ms since last)`
      );
    }
  },
  componentUpdated: (name: string, count: number) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Component] ${name} updated (render #${count})`);
    }
  },
  timeToInteractive: (name: string, tti: number, type: string) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[TTI] ${name} interactive in ${tti}ms via ${type}`);
    }
  },
  elementVisible: (name: string, ratio: number) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Visibility] ${name} visible (${ratio * 100}%)`);
    }
  },
  elementVisibilityDuration: (name: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Visibility] ${name} visible for ${duration}ms`);
    }
  },
  scrollPerformance: (name: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Scroll] ${name} scroll event took ${duration}ms`);
    }
  },
  resizePerformance: (name: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Resize] ${name} resize event took ${duration}ms`);
    }
  },
  elementInteraction: (name: string, type: string) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Interaction] ${name} - ${type}`);
    }
  },
};

export interface PerformanceMetrics {
  renderTime: number;
  visibilityDuration: number;
  interactionDelay?: number;
  componentName: string;
  timestamp: number;
}

/**
 * Hook for tracking placeholder/skeleton component performance
 */
export function usePlaceholderTracking(
  componentName: string,
  options: {
    trackVisibility?: boolean;
    trackInteraction?: boolean;
    minVisibilityTime?: number; // Only track if visible for at least this many ms
  } = {}
) {
  const startTimeRef = useRef<number | undefined>(undefined);
  const visibilityStartRef = useRef<number | undefined>(undefined);
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Track component mount/render time
  useEffect(() => {
    startTimeRef.current = performance.now();
    return () => {
      if (startTimeRef.current) {
        const renderTime = performance.now() - startTimeRef.current;
        performanceTracking.placeholderPerformance(
          componentName,
          'render',
          renderTime
        );
      }
    };
  }, [componentName]);

  // Track visibility duration
  useEffect(() => {
    if (options.trackVisibility !== false && isVisible) {
      visibilityStartRef.current = performance.now();

      return () => {
        if (visibilityStartRef.current) {
          const visibilityDuration =
            performance.now() - visibilityStartRef.current;
          const minTime = options.minVisibilityTime || 100;

          if (visibilityDuration >= minTime) {
            performanceTracking.placeholderPerformance(
              componentName,
              'visibility',
              visibilityDuration
            );
          }
        }
      };
    }
  }, [
    isVisible,
    componentName,
    options.trackVisibility,
    options.minVisibilityTime,
  ]);

  // Intersection observer for visibility tracking
  const visibilityRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node || options.trackVisibility === false) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );

      observer.observe(node);
      return () => observer.disconnect();
    },
    [options.trackVisibility]
  );

  // Track interaction delays
  const trackInteraction = useCallback(
    (interactionType: string) => {
      if (!hasInteracted && startTimeRef.current) {
        const interactionDelay = performance.now() - startTimeRef.current;
        setHasInteracted(true);

        performanceTracking.placeholderPerformance(
          componentName,
          'interaction',
          interactionDelay,
          { interaction_type: interactionType }
        );
      }
    },
    [componentName, hasInteracted]
  );

  return {
    visibilityRef,
    trackInteraction,
    isVisible,
    hasInteracted,
  };
}

/**
 * Hook for tracking loading state effectiveness
 */
export function useLoadingStateTracking(
  stateName: string,
  isLoading: boolean,
  options: {
    trackTransitions?: boolean;
    trackDuration?: boolean;
  } = {}
) {
  const loadingStartRef = useRef<number | undefined>(undefined);
  const wasLoadingRef = useRef(isLoading);

  useEffect(() => {
    const wasLoading = wasLoadingRef.current;

    if (isLoading && !wasLoading) {
      // Started loading
      loadingStartRef.current = performance.now();
      if (options.trackTransitions !== false) {
        performanceTracking.loadingStateChanged(stateName, 'started');
      }
    } else if (!isLoading && wasLoading) {
      // Finished loading
      if (options.trackTransitions !== false) {
        performanceTracking.loadingStateChanged(stateName, 'completed');
      }

      if (options.trackDuration !== false && loadingStartRef.current) {
        const duration = performance.now() - loadingStartRef.current;
        performanceTracking.loadingDuration(stateName, duration);
      }
    }

    wasLoadingRef.current = isLoading;
  }, [isLoading, stateName, options.trackTransitions, options.trackDuration]);

  return {
    loadingDuration: loadingStartRef.current
      ? performance.now() - loadingStartRef.current
      : 0,
  };
}

/**
 * Hook for tracking component performance metrics
 */
export function useComponentPerformance(
  componentName: string,
  options: {
    trackRender?: boolean;
    trackMount?: boolean;
    trackUpdate?: boolean;
  } = {}
) {
  const mountTimeRef = useRef<number | undefined>(undefined);
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number | undefined>(undefined);

  // Track component mount
  useEffect(() => {
    if (options.trackMount !== false) {
      mountTimeRef.current = performance.now();
      performanceTracking.componentMounted(componentName, performance.now());
    }

    return () => {
      if (options.trackMount !== false && mountTimeRef.current) {
        const mountDuration = performance.now() - mountTimeRef.current;
        performanceTracking.componentUnmounted(componentName, mountDuration);
      }
    };
  }, [componentName, options.trackMount]);

  // Track renders
  useEffect(() => {
    if (options.trackRender !== false) {
      renderCountRef.current += 1;
      const renderTime = performance.now();

      if (lastRenderTimeRef.current) {
        const timeSinceLastRender = renderTime - lastRenderTimeRef.current;
        performanceTracking.componentRendered(
          componentName,
          renderCountRef.current,
          timeSinceLastRender
        );
      }

      lastRenderTimeRef.current = renderTime;
    }
  });

  // Track updates (excluding initial render)
  useEffect(() => {
    if (options.trackUpdate !== false && renderCountRef.current > 1) {
      performanceTracking.componentUpdated(
        componentName,
        renderCountRef.current
      );
    }
  });

  return {
    renderCount: renderCountRef.current,
    mountDuration: mountTimeRef.current
      ? performance.now() - mountTimeRef.current
      : 0,
  };
}

/**
 * Hook for tracking time to interactive metrics
 */
export function useTimeToInteractive(
  componentName: string,
  options: {
    interactionTypes?: string[];
    trackFirstInteraction?: boolean;
  } = {}
) {
  const loadStartRef = useRef<number>(performance.now());
  const [timeToInteractive, setTimeToInteractive] = useState<number | null>(
    null
  );
  const [hasInteracted, setHasInteracted] = useState(false);

  const trackFirstInteraction = useCallback(
    (interactionType: string) => {
      if (
        !hasInteracted &&
        options.trackFirstInteraction !== false &&
        (!options.interactionTypes ||
          options.interactionTypes.includes(interactionType))
      ) {
        const tti = performance.now() - loadStartRef.current;
        setTimeToInteractive(tti);
        setHasInteracted(true);

        performanceTracking.timeToInteractive(
          componentName,
          tti,
          interactionType
        );
      }
    },
    [
      hasInteracted,
      componentName,
      options.trackFirstInteraction,
      options.interactionTypes,
    ]
  );

  // Auto-track common interaction types
  const interactionHandlers = React.useMemo(
    () => ({
      onClick: () => trackFirstInteraction('click'),
      onFocus: () => trackFirstInteraction('focus'),
      onMouseEnter: () => trackFirstInteraction('hover'),
      onTouchStart: () => trackFirstInteraction('touch'),
      onKeyDown: (e: React.KeyboardEvent) =>
        trackFirstInteraction(`key_${e.key}`),
    }),
    [trackFirstInteraction]
  );

  return {
    timeToInteractive,
    hasInteracted,
    trackFirstInteraction,
    interactionHandlers,
  };
}

/**
 * Hook for tracking viewport performance
 */
export function useViewportPerformance(
  elementName: string,
  options: {
    trackVisibility?: boolean;
    trackScrollPerformance?: boolean;
    trackResizePerformance?: boolean;
  } = {}
) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [visibilityTime, setVisibilityTime] = useState<number | null>(null);
  const visibilityStartRef = useRef<number | undefined>(undefined);

  // Intersection Observer for visibility tracking
  useEffect(() => {
    if (!elementRef.current || options.trackVisibility === false) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);

        if (isIntersecting && !visibilityStartRef.current) {
          visibilityStartRef.current = performance.now();
          performanceTracking.elementVisible(
            elementName,
            entry.intersectionRatio
          );
        } else if (!isIntersecting && visibilityStartRef.current) {
          const duration = performance.now() - visibilityStartRef.current;
          setVisibilityTime(duration);
          performanceTracking.elementVisibilityDuration(elementName, duration);
          visibilityStartRef.current = undefined;
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [elementName, options.trackVisibility]);

  // Scroll performance tracking
  useEffect(() => {
    if (options.trackScrollPerformance === false) return;

    let scrollStartTime: number;
    let scrollTimeout: NodeJS.Timeout;

    const handleScrollStart = () => {
      scrollStartTime = performance.now();
    };

    const handleScrollEnd = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollDuration = performance.now() - scrollStartTime;
        performanceTracking.scrollPerformance(elementName, scrollDuration);
      }, 150); // Debounce scroll end
    };

    const handleScroll = () => {
      if (!scrollStartTime) {
        handleScrollStart();
      }
      handleScrollEnd();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [elementName, options.trackScrollPerformance]);

  // Resize performance tracking
  useEffect(() => {
    if (options.trackResizePerformance === false) return;

    let resizeStartTime: number;
    let resizeTimeout: NodeJS.Timeout;

    const handleResizeStart = () => {
      resizeStartTime = performance.now();
    };

    const handleResizeEnd = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const resizeDuration = performance.now() - resizeStartTime;
        performanceTracking.resizePerformance(elementName, resizeDuration);
      }, 250);
    };

    const handleResize = () => {
      if (!resizeStartTime) {
        handleResizeStart();
      }
      handleResizeEnd();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [elementName, options.trackResizePerformance]);

  const ref = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  return {
    ref,
    isVisible,
    visibilityTime,
    trackInteraction: (type: string) =>
      performanceTracking.elementInteraction(elementName, type),
  };
}
