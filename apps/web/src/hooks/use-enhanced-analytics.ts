import { useCallback, useEffect, useRef } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import {
  enhancedAnalytics,
  enhancedTrackEvents,
  userPropertyHelpers,
} from '@/lib/enhanced-posthog';
import { experimentService } from '@/lib/enhanced-posthog-experiments';

// Performance API type extensions for Web Vitals
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

// Main enhanced analytics hook
export function useEnhancedAnalytics() {
  const { user } = useUser();
  const userId = user?.id;

  // Engagement tracking
  const trackEngagement = useCallback(
    (action: string, target: string, context?: Record<string, unknown>) => {
      enhancedAnalytics.trackEngagement(action, target, {
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  // Performance tracking
  const trackPerformance = useCallback(
    (metric: string, value: number, context?: Record<string, unknown>) => {
      enhancedAnalytics.trackPerformance(metric, value, {
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  // Funnel tracking
  const trackFunnelStep = useCallback(
    (
      funnel: string,
      step: string,
      success: boolean,
      context?: Record<string, unknown>
    ) => {
      enhancedAnalytics.trackFunnelStep(funnel, step, success, {
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  // Error tracking
  const trackError = useCallback(
    (error: Error | string, context?: Record<string, unknown>) => {
      enhancedAnalytics.trackError(error, {
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  // Custom event tracking with user context (now includes experiment context)
  const trackEvent = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      try {
        // Enrich with experiment context
        const experimentContext = userId
          ? experimentService.getActiveExperiments(userId)
          : [];
        const experimentProps = experimentContext.reduce(
          (acc, { experiment, variant }) => ({
            ...acc,
            [`experiment_${experiment.id}`]: variant.id,
            [`experiment_${experiment.id}_is_control`]: variant.isControl,
          }),
          {}
        );

        enhancedAnalytics.captureWithContext(event, {
          user_id: userId,
          ...experimentProps,
          ...properties,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Analytics tracking error:', error);
      }
    },
    [userId]
  );

  return {
    trackEngagement,
    trackPerformance,
    trackFunnelStep,
    trackError,
    trackEvent,
    userId,
  };
}

// Hook for tracking page views with performance metrics
export function usePageTracking(
  pageName: string,
  additionalData?: Record<string, unknown>
) {
  const { userId } = useEnhancedAnalytics();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = performance.now();
    const _startTime = Date.now();

    // Track page view
    enhancedTrackEvents.navigation_page_viewed(
      window.location.pathname,
      document.referrer || undefined,
      undefined, // Load time will be calculated on unmount
      userId || undefined
    );

    // Track page performance and Core Web Vitals
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = performance.now() - (startTimeRef.current || 0);
        enhancedTrackEvents.perf_page_load_completed(
          window.location.pathname,
          loadTime,
          {
            page_name: pageName,
            ...additionalData,
          }
        );

        // Track Core Web Vitals using Performance Observer if available
        if ('PerformanceObserver' in window) {
          // Track LCP (Largest Contentful Paint)
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              enhancedAnalytics.trackPerformanceMetric(
                'LCP',
                lastEntry.startTime,
                {
                  page_name: pageName,
                  user_id: userId,
                  ...additionalData,
                }
              );
            }
          });
          lcpObserver.observe({
            type: 'largest-contentful-paint',
            buffered: true,
          });

          // Track FID (First Input Delay)
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const fidEntry = entry as PerformanceEventTiming;
              if (fidEntry.processingStart && fidEntry.startTime) {
                const fid = fidEntry.processingStart - fidEntry.startTime;
                enhancedAnalytics.trackPerformanceMetric('FID', fid, {
                  page_name: pageName,
                  user_id: userId,
                  ...additionalData,
                });
              }
            }
          });
          fidObserver.observe({ type: 'first-input', buffered: true });

          // Track CLS (Cumulative Layout Shift)
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const clsEntry = entry as LayoutShift;
              if (!clsEntry.hadRecentInput) {
                clsValue += clsEntry.value;
              }
            }
            enhancedAnalytics.trackPerformanceMetric('CLS', clsValue, {
              page_name: pageName,
              user_id: userId,
              ...additionalData,
            });
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });

          // Track FCP (First Contentful Paint)
          const fcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                enhancedAnalytics.trackPerformanceMetric(
                  'FCP',
                  entry.startTime,
                  {
                    page_name: pageName,
                    user_id: userId,
                    ...additionalData,
                  }
                );
              }
            }
          });
          fcpObserver.observe({ type: 'paint', buffered: true });

          // Track TTFB (Time to First Byte)
          const navigationEntries = performance.getEntriesByType('navigation');
          if (navigationEntries.length > 0) {
            const navEntry =
              navigationEntries[0] as PerformanceNavigationTiming;
            const ttfb = navEntry.responseStart - navEntry.requestStart;
            enhancedAnalytics.trackPerformanceMetric('TTFB', ttfb, {
              page_name: pageName,
              user_id: userId,
              ...additionalData,
            });
          }
        }
      });
    }

    return () => {
      // Track page exit time
      if (startTimeRef.current) {
        const timeOnPage = performance.now() - startTimeRef.current;
        enhancedAnalytics.captureWithContext('navigation_page_exited', {
          page_name: pageName,
          time_on_page: timeOnPage,
          user_id: userId,
          ...additionalData,
        });
      }
    };
  }, [pageName, userId, additionalData]);
}

// Hook for tracking user interactions with UI elements
export function useInteractionTracking() {
  const { userId } = useEnhancedAnalytics();

  const trackClick = useCallback(
    (element: string, _context?: Record<string, unknown>) => {
      enhancedTrackEvents.ui_modal_opened(
        element,
        'click',
        userId || undefined
      );
    },
    [userId]
  );

  const trackHover = useCallback(
    (element: string, duration: number, _context?: Record<string, unknown>) => {
      enhancedAnalytics.captureWithContext('ui_element_hovered', {
        element,
        hover_duration: duration,
        user_id: userId,
        ..._context,
      });
    },
    [userId]
  );

  const trackFocus = useCallback(
    (element: string, context?: Record<string, unknown>) => {
      enhancedAnalytics.captureWithContext('ui_element_focused', {
        element,
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  const trackScroll = useCallback(
    (depth: number, element?: string) => {
      enhancedAnalytics.captureWithContext('ui_scroll_depth', {
        scroll_depth: depth,
        element,
        user_id: userId,
      });
    },
    [userId]
  );

  return {
    trackClick,
    trackHover,
    trackFocus,
    trackScroll,
  };
}

// Hook for tracking form interactions and completion
export function useFormTracking(formName: string) {
  const { userId } = useEnhancedAnalytics();
  const startTimeRef = useRef<number | undefined>(Date.now());
  const fieldsInteractedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    startTimeRef.current = Date.now();
    const fieldsInteractedAtStart = fieldsInteractedRef.current;

    // Track form start
    enhancedAnalytics.captureWithContext('form_started', {
      form_name: formName,
      user_id: userId,
    });

    return () => {
      // Track form abandonment on unmount (unless completed)
      if (startTimeRef.current) {
        const timeSpent = Date.now() - startTimeRef.current;
        enhancedAnalytics.captureWithContext('form_abandoned', {
          form_name: formName,
          time_spent: timeSpent,
          fields_interacted: Array.from(fieldsInteractedAtStart),
          field_count: fieldsInteractedAtStart.size,
          user_id: userId,
        });
      }
    };
  }, [formName, userId]);

  const trackFieldInteraction = useCallback(
    (fieldName: string, action: 'focus' | 'blur' | 'change') => {
      fieldsInteractedRef.current.add(fieldName);

      enhancedAnalytics.captureWithContext('form_field_interaction', {
        form_name: formName,
        field_name: fieldName,
        action,
        user_id: userId,
      });
    },
    [formName, userId]
  );

  const trackFieldError = useCallback(
    (fieldName: string, errorMessage: string) => {
      enhancedAnalytics.captureWithContext('form_field_error', {
        form_name: formName,
        field_name: fieldName,
        error_message: errorMessage,
        user_id: userId,
      });
    },
    [formName, userId]
  );

  const trackFormSubmit = useCallback(
    (success: boolean, errors?: Record<string, string>) => {
      const timeSpent = startTimeRef.current
        ? Date.now() - startTimeRef.current
        : undefined;

      enhancedAnalytics.captureWithContext('form_submitted', {
        form_name: formName,
        success,
        time_spent: timeSpent,
        fields_interacted: Array.from(fieldsInteractedRef.current),
        field_count: fieldsInteractedRef.current.size,
        error_count: errors ? Object.keys(errors).length : 0,
        errors,
        user_id: userId,
      });

      // Clear the start time to prevent abandonment tracking
      startTimeRef.current = undefined;
    },
    [formName, userId]
  );

  return {
    trackFieldInteraction,
    trackFieldError,
    trackFormSubmit,
  };
}

// Hook for tracking search behavior
export function useSearchTracking() {
  const { userId } = useEnhancedAnalytics();
  const searchStartTimeRef = useRef<number>(Date.now());

  const trackSearchStart = useCallback(
    (query: string, context?: Record<string, unknown>) => {
      searchStartTimeRef.current = Date.now();

      enhancedAnalytics.captureWithContext('search_started', {
        query,
        query_length: query.length,
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  const trackSearchComplete = useCallback(
    (
      query: string,
      resultCount: number,
      filters?: Record<string, unknown>,
      _context?: Record<string, unknown>
    ) => {
      const responseTime = searchStartTimeRef.current
        ? Date.now() - searchStartTimeRef.current
        : undefined;

      enhancedTrackEvents.search_query_performed(
        query,
        filters || {},
        resultCount,
        responseTime || 0,
        userId || undefined
      );
    },
    [userId]
  );

  const trackSearchResultClick = useCallback(
    (
      query: string,
      resultId: string,
      position: number,
      resultType: string = 'vibe'
    ) => {
      enhancedTrackEvents.search_result_clicked(
        query,
        resultId,
        resultType,
        position,
        userId || undefined
      );
    },
    [userId]
  );

  const trackFilterApplied = useCallback(
    (filterType: string, filterValue: unknown, resultCount: number) => {
      enhancedTrackEvents.search_filter_applied(
        filterType,
        filterValue,
        resultCount,
        userId || undefined
      );
    },
    [userId]
  );

  return {
    trackSearchStart,
    trackSearchComplete,
    trackSearchResultClick,
    trackFilterApplied,
  };
}

// Hook for tracking content engagement
export function useContentTracking() {
  const { userId } = useEnhancedAnalytics();
  const viewStartTimeRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);

  const trackContentView = useCallback(
    (contentId: string, _contentType: string = 'vibe', source?: string) => {
      viewStartTimeRef.current = Date.now();
      maxScrollDepthRef.current = 0;

      enhancedTrackEvents.engagement_vibe_viewed(
        contentId,
        userId || undefined,
        undefined, // Duration will be tracked on exit
        undefined, // Scroll depth will be tracked separately
        source
      );
    },
    [userId]
  );

  const trackScrollDepth = useCallback(
    (depth: number) => {
      const previousMaxDepth = maxScrollDepthRef.current;
      maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, depth);

      // Track milestone scroll depths
      if (depth >= 25 && depth < 50 && previousMaxDepth < 25) {
        enhancedAnalytics.captureWithContext('content_scroll_milestone', {
          milestone: 25,
          user_id: userId,
        });
      } else if (depth >= 50 && depth < 75 && previousMaxDepth < 50) {
        enhancedAnalytics.captureWithContext('content_scroll_milestone', {
          milestone: 50,
          user_id: userId,
        });
      } else if (depth >= 75 && depth < 100 && previousMaxDepth < 75) {
        enhancedAnalytics.captureWithContext('content_scroll_milestone', {
          milestone: 75,
          user_id: userId,
        });
      } else if (depth >= 100 && previousMaxDepth < 100) {
        enhancedAnalytics.captureWithContext('content_scroll_milestone', {
          milestone: 100,
          user_id: userId,
        });
      }
    },
    [userId]
  );

  const trackContentExit = useCallback(
    (contentId: string) => {
      const viewDuration = viewStartTimeRef.current
        ? Date.now() - viewStartTimeRef.current
        : undefined;

      enhancedAnalytics.captureWithContext('content_view_completed', {
        content_id: contentId,
        view_duration: viewDuration,
        max_scroll_depth: maxScrollDepthRef.current,
        user_id: userId,
      });
    },
    [userId]
  );

  const trackContentInteraction = useCallback(
    (
      contentId: string,
      interactionType: 'like' | 'rate' | 'share' | 'comment' | 'follow',
      value?: unknown
    ) => {
      enhancedAnalytics.captureWithContext('content_interaction', {
        content_id: contentId,
        interaction_type: interactionType,
        value,
        user_id: userId,
      });
    },
    [userId]
  );

  return {
    trackContentView,
    trackScrollDepth,
    trackContentExit,
    trackContentInteraction,
  };
}

// Hook for tracking conversion funnels
export function useConversionTracking() {
  const { userId } = useEnhancedAnalytics();

  const trackFunnelStart = useCallback(
    (funnelName: string, context?: Record<string, unknown>) => {
      enhancedAnalytics.trackFunnelStep(funnelName, 'start', true, {
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  const trackFunnelStep = useCallback(
    (
      funnelName: string,
      stepName: string,
      success: boolean,
      context?: Record<string, unknown>
    ) => {
      enhancedAnalytics.trackFunnelStep(funnelName, stepName, success, {
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  const trackFunnelComplete = useCallback(
    (
      funnelName: string,
      totalDuration?: number,
      context?: Record<string, unknown>
    ) => {
      enhancedAnalytics.trackFunnelStep(funnelName, 'complete', true, {
        user_id: userId,
        total_duration: totalDuration,
        ...context,
      });
    },
    [userId]
  );

  const trackFunnelAbandonment = useCallback(
    (
      funnelName: string,
      lastCompletedStep: string,
      reason?: string,
      context?: Record<string, unknown>
    ) => {
      enhancedAnalytics.captureWithContext('funnel_abandoned', {
        funnel_name: funnelName,
        last_completed_step: lastCompletedStep,
        abandonment_reason: reason,
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  return {
    trackFunnelStart,
    trackFunnelStep,
    trackFunnelComplete,
    trackFunnelAbandonment,
  };
}

// Hook for A/B testing and feature flag tracking
export function useExperimentTracking() {
  const { userId } = useEnhancedAnalytics();

  const trackExperimentView = useCallback(
    (
      experimentName: string,
      variant: string,
      context?: Record<string, unknown>
    ) => {
      enhancedAnalytics.captureWithContext('experiment_viewed', {
        experiment_name: experimentName,
        variant,
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  const trackExperimentConversion = useCallback(
    (
      experimentName: string,
      variant: string,
      conversionType: string,
      value?: number,
      context?: Record<string, unknown>
    ) => {
      enhancedAnalytics.captureWithContext('experiment_conversion', {
        experiment_name: experimentName,
        variant,
        conversion_type: conversionType,
        conversion_value: value,
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  const trackFeatureUsage = useCallback(
    (
      featureName: string,
      action: string,
      context?: Record<string, unknown>
    ) => {
      enhancedAnalytics.captureWithContext('feature_used', {
        feature_name: featureName,
        action,
        user_id: userId,
        ...context,
      });
    },
    [userId]
  );

  return {
    trackExperimentView,
    trackExperimentConversion,
    trackFeatureUsage,
  };
}

// Hook for performance monitoring and alerting
export function usePerformanceMonitoring(pageName: string) {
  const { userId } = useEnhancedAnalytics();

  const trackWebVital = useCallback(
    (name: string, value: number, context?: Record<string, unknown>) => {
      enhancedAnalytics.trackPerformanceMetric(name, value, {
        page_name: pageName,
        user_id: userId,
        ...context,
      });
    },
    [pageName, userId]
  );

  const trackAPICall = useCallback(
    (endpoint: string, startTime: number, success: boolean) => {
      const responseTime = Date.now() - startTime;
      enhancedTrackEvents.perf_api_call_completed(
        endpoint,
        responseTime,
        success
      );
    },
    []
  );

  const trackImageLoad = useCallback(
    (imageId: string, startTime: number, size?: number) => {
      const loadTime = Date.now() - startTime;
      enhancedTrackEvents.perf_image_load_completed(
        imageId,
        loadTime,
        size || 0
      );
    },
    []
  );

  const trackSearchPerformance = useCallback(
    (query: string, startTime: number, resultCount: number) => {
      const responseTime = Date.now() - startTime;
      enhancedTrackEvents.perf_search_completed(
        query,
        responseTime,
        resultCount
      );
    },
    []
  );

  return {
    trackWebVital,
    trackAPICall,
    trackImageLoad,
    trackSearchPerformance,
  };
}

// Hook for real-time performance monitoring
export function useRealtimePerformanceMonitoring(
  pageName: string,
  enabled: boolean = true
) {
  const { userId: _userId } = useEnhancedAnalytics();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Start real-time monitoring
    let cleanup: (() => void) | undefined;

    // Dynamically import performance monitoring to avoid SSR issues
    import('@/lib/performance-monitoring').then(({ performanceMonitor }) => {
      cleanup = performanceMonitor.startRealtimeMonitoring(pageName);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [pageName, enabled]);

  const checkCriticalPath = useCallback(
    async (metrics: Record<string, number>) => {
      if (typeof window === 'undefined') return;

      const { performanceMonitor } = await import(
        '@/lib/performance-monitoring'
      );
      return performanceMonitor.checkCriticalPathPerformance(pageName, metrics);
    },
    [pageName]
  );

  return {
    checkCriticalPath,
  };
}

// Export user property helpers for easy access
export { userPropertyHelpers };
