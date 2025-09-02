/**
 * Performance tracking hooks for monitoring placeholder/skeleton components,
 * render times, and user interaction metrics
 */

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trackEvents } from '@/lib/track-events';

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
        trackEvents.placeholderPerformance(componentName, 'render', renderTime);
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
            trackEvents.placeholderPerformance(
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

        trackEvents.placeholderPerformance(
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
        trackEvents.loadingStateChanged(stateName, 'started');
      }
    } else if (!isLoading && wasLoading) {
      // Finished loading
      if (loadingStartRef.current && options.trackDuration !== false) {
        const duration = performance.now() - loadingStartRef.current;
        trackEvents.loadingStateChanged(stateName, 'completed', duration);
      } else if (options.trackTransitions !== false) {
        trackEvents.loadingStateChanged(stateName, 'completed');
      }
      loadingStartRef.current = undefined;
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
 * Hook for comprehensive component performance monitoring
 */
export function useComponentPerformance(
  componentName: string,
  options: {
    trackRender?: boolean;
    trackRerender?: boolean;
    trackProps?: boolean;
    propNames?: string[];
  } = {}
) {
  const renderCountRef = useRef(0);
  const lastPropsRef = useRef<Record<string, unknown>>({});
  const mountTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    mountTimeRef.current = performance.now();
    if (options.trackRender !== false) {
      trackEvents.componentPerformance(componentName, 'mount');
    }

    return () => {
      if (mountTimeRef.current && options.trackRender !== false) {
        const lifetime = performance.now() - mountTimeRef.current;
        trackEvents.componentPerformance(componentName, 'unmount', lifetime, {
          render_count: renderCountRef.current,
        });
      }
    };
  }, [componentName, options.trackRender]);

  // Track rerenders
  React.useLayoutEffect(() => {
    renderCountRef.current += 1;

    if (renderCountRef.current > 1 && options.trackRerender !== false) {
      // Debounce tracking to prevent flooding
      const timeoutId = setTimeout(() => {
        trackEvents.componentPerformance(componentName, 'rerender', undefined, {
          render_count: renderCountRef.current,
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  });

  // Track prop changes
  const trackPropChange = useCallback(
    (props: Record<string, unknown>) => {
      if (options.trackProps === false) return;

      const trackedProps = options.propNames
        ? Object.fromEntries(
            Object.entries(props).filter(([key]) =>
              options.propNames!.includes(key)
            )
          )
        : props;

      const changedProps = Object.keys(trackedProps).filter(
        (key) => trackedProps[key] !== lastPropsRef.current[key]
      );

      if (changedProps.length > 0) {
        trackEvents.componentPerformance(
          componentName,
          'prop_change',
          undefined,
          {
            changed_props: changedProps,
            render_count: renderCountRef.current,
          }
        );
      }

      lastPropsRef.current = trackedProps;
    },
    [componentName, options.trackProps, options.propNames]
  );

  return {
    renderCount: renderCountRef.current,
    trackPropChange,
  };
}

/**
 * Hook for measuring time to interactive (TTI) metrics
 */
export function useTimeToInteractive(
  componentName: string,
  isInteractive: boolean,
  options: {
    trackFirstInteraction?: boolean;
    trackInteractionType?: boolean;
  } = {}
) {
  const startTimeRef = useRef<number | undefined>(undefined);
  const [hasTrackedTTI, setHasTrackedTTI] = useState(false);

  useEffect(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
    }
  }, []);

  useEffect(() => {
    if (isInteractive && !hasTrackedTTI && startTimeRef.current) {
      const timeToInteractive = performance.now() - startTimeRef.current;
      trackEvents.timeToInteractive(componentName, timeToInteractive);
      setHasTrackedTTI(true);
    }
  }, [isInteractive, hasTrackedTTI, componentName]);

  const trackFirstInteraction = useCallback(
    (interactionType: string, target?: string) => {
      if (options.trackFirstInteraction !== false && startTimeRef.current) {
        const timeToFirstInteraction = performance.now() - startTimeRef.current;
        trackEvents.firstInteraction(
          componentName,
          interactionType,
          timeToFirstInteraction,
          { target }
        );
      }
    },
    [componentName, options.trackFirstInteraction]
  );

  return {
    trackFirstInteraction,
    timeToInteractive:
      startTimeRef.current && isInteractive
        ? performance.now() - startTimeRef.current
        : null,
  };
}
