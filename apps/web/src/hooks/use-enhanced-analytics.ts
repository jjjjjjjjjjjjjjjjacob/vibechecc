import { useCallback, useEffect, useRef } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import { enhancedAnalytics, enhancedTrackEvents, userPropertyHelpers } from '@/lib/enhanced-posthog';

// Main enhanced analytics hook
export function useEnhancedAnalytics() {
  const { user } = useUser();
  const userId = user?.id;

  // Engagement tracking
  const trackEngagement = useCallback((action: string, target: string, context?: Record<string, any>) => {
    enhancedAnalytics.trackEngagement(action, target, {
      user_id: userId,
      ...context,
    });
  }, [userId]);

  // Performance tracking
  const trackPerformance = useCallback((metric: string, value: number, context?: Record<string, any>) => {
    enhancedAnalytics.trackPerformance(metric, value, {
      user_id: userId,
      ...context,
    });
  }, [userId]);

  // Funnel tracking
  const trackFunnelStep = useCallback((funnel: string, step: string, success: boolean, context?: Record<string, any>) => {
    enhancedAnalytics.trackFunnelStep(funnel, step, success, {
      user_id: userId,
      ...context,
    });
  }, [userId]);

  // Error tracking
  const trackError = useCallback((error: Error | string, context?: Record<string, any>) => {
    enhancedAnalytics.trackError(error, {
      user_id: userId,
      ...context,
    });
  }, [userId]);

  // Custom event tracking with user context
  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    enhancedAnalytics.captureWithContext(event, {
      user_id: userId,
      ...properties,
    });
  }, [userId]);

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
export function usePageTracking(pageName: string, additionalData?: Record<string, any>) {
  const { userId } = useEnhancedAnalytics();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = performance.now();
    const startTime = Date.now();

    // Track page view
    enhancedTrackEvents.navigation_page_viewed(
      window.location.pathname,
      document.referrer || undefined,
      undefined, // Load time will be calculated on unmount
      userId || undefined
    );

    // Track page performance
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

  const trackClick = useCallback((element: string, context?: Record<string, any>) => {
    enhancedTrackEvents.ui_modal_opened(element, 'click', userId || undefined);
  }, [userId]);

  const trackHover = useCallback((element: string, duration: number, context?: Record<string, any>) => {
    enhancedAnalytics.captureWithContext('ui_element_hovered', {
      element,
      hover_duration: duration,
      user_id: userId,
      ...context,
    });
  }, [userId]);

  const trackFocus = useCallback((element: string, context?: Record<string, any>) => {
    enhancedAnalytics.captureWithContext('ui_element_focused', {
      element,
      user_id: userId,
      ...context,
    });
  }, [userId]);

  const trackScroll = useCallback((depth: number, element?: string) => {
    enhancedAnalytics.captureWithContext('ui_scroll_depth', {
      scroll_depth: depth,
      element,
      user_id: userId,
    });
  }, [userId]);

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
  const startTimeRef = useRef<number>();
  const fieldsInteractedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    startTimeRef.current = Date.now();
    
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
          fields_interacted: Array.from(fieldsInteractedRef.current),
          field_count: fieldsInteractedRef.current.size,
          user_id: userId,
        });
      }
    };
  }, [formName, userId]);

  const trackFieldInteraction = useCallback((fieldName: string, action: 'focus' | 'blur' | 'change') => {
    fieldsInteractedRef.current.add(fieldName);
    
    enhancedAnalytics.captureWithContext('form_field_interaction', {
      form_name: formName,
      field_name: fieldName,
      action,
      user_id: userId,
    });
  }, [formName, userId]);

  const trackFieldError = useCallback((fieldName: string, errorMessage: string) => {
    enhancedAnalytics.captureWithContext('form_field_error', {
      form_name: formName,
      field_name: fieldName,
      error_message: errorMessage,
      user_id: userId,
    });
  }, [formName, userId]);

  const trackFormSubmit = useCallback((success: boolean, errors?: Record<string, string>) => {
    const timeSpent = startTimeRef.current ? Date.now() - startTimeRef.current : undefined;
    
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
  }, [formName, userId]);

  return {
    trackFieldInteraction,
    trackFieldError,
    trackFormSubmit,
  };
}

// Hook for tracking search behavior
export function useSearchTracking() {
  const { userId } = useEnhancedAnalytics();
  const searchStartTimeRef = useRef<number>();

  const trackSearchStart = useCallback((query: string, context?: Record<string, any>) => {
    searchStartTimeRef.current = Date.now();
    
    enhancedAnalytics.captureWithContext('search_started', {
      query,
      query_length: query.length,
      user_id: userId,
      ...context,
    });
  }, [userId]);

  const trackSearchComplete = useCallback((
    query: string, 
    resultCount: number, 
    filters?: Record<string, any>,
    context?: Record<string, any>
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
  }, [userId]);

  const trackSearchResultClick = useCallback((
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
  }, [userId]);

  const trackFilterApplied = useCallback((
    filterType: string,
    filterValue: any,
    resultCount: number
  ) => {
    enhancedTrackEvents.search_filter_applied(
      filterType,
      filterValue,
      resultCount,
      userId || undefined
    );
  }, [userId]);

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
  const viewStartTimeRef = useRef<number>();
  const maxScrollDepthRef = useRef<number>(0);

  const trackContentView = useCallback((contentId: string, contentType: string = 'vibe', source?: string) => {
    viewStartTimeRef.current = Date.now();
    maxScrollDepthRef.current = 0;

    enhancedTrackEvents.engagement_vibe_viewed(
      contentId,
      userId || undefined,
      undefined, // Duration will be tracked on exit
      undefined, // Scroll depth will be tracked separately
      source
    );
  }, [userId]);

  const trackScrollDepth = useCallback((depth: number) => {
    maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, depth);
    
    // Track milestone scroll depths
    if (depth >= 25 && depth < 50 && maxScrollDepthRef.current < 25) {
      enhancedAnalytics.captureWithContext('content_scroll_milestone', {
        milestone: 25,
        user_id: userId,
      });
    } else if (depth >= 50 && depth < 75 && maxScrollDepthRef.current < 50) {
      enhancedAnalytics.captureWithContext('content_scroll_milestone', {
        milestone: 50,
        user_id: userId,
      });
    } else if (depth >= 75 && depth < 100 && maxScrollDepthRef.current < 75) {
      enhancedAnalytics.captureWithContext('content_scroll_milestone', {
        milestone: 75,
        user_id: userId,
      });
    } else if (depth >= 100 && maxScrollDepthRef.current < 100) {
      enhancedAnalytics.captureWithContext('content_scroll_milestone', {
        milestone: 100,
        user_id: userId,
      });
    }
  }, [userId]);

  const trackContentExit = useCallback((contentId: string) => {
    const viewDuration = viewStartTimeRef.current 
      ? Date.now() - viewStartTimeRef.current 
      : undefined;

    enhancedAnalytics.captureWithContext('content_view_completed', {
      content_id: contentId,
      view_duration: viewDuration,
      max_scroll_depth: maxScrollDepthRef.current,
      user_id: userId,
    });
  }, [userId]);

  const trackContentInteraction = useCallback((
    contentId: string,
    interactionType: 'like' | 'rate' | 'share' | 'comment' | 'follow',
    value?: any
  ) => {
    enhancedAnalytics.captureWithContext('content_interaction', {
      content_id: contentId,
      interaction_type: interactionType,
      value,
      user_id: userId,
    });
  }, [userId]);

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

  const trackFunnelStart = useCallback((funnelName: string, context?: Record<string, any>) => {
    enhancedAnalytics.trackFunnelStep(funnelName, 'start', true, {
      user_id: userId,
      ...context,
    });
  }, [userId]);

  const trackFunnelStep = useCallback((
    funnelName: string, 
    stepName: string, 
    success: boolean,
    context?: Record<string, any>
  ) => {
    enhancedAnalytics.trackFunnelStep(funnelName, stepName, success, {
      user_id: userId,
      ...context,
    });
  }, [userId]);

  const trackFunnelComplete = useCallback((
    funnelName: string, 
    totalDuration?: number,
    context?: Record<string, any>
  ) => {
    enhancedAnalytics.trackFunnelStep(funnelName, 'complete', true, {
      user_id: userId,
      total_duration: totalDuration,
      ...context,
    });
  }, [userId]);

  const trackFunnelAbandonment = useCallback((
    funnelName: string, 
    lastCompletedStep: string,
    reason?: string,
    context?: Record<string, any>
  ) => {
    enhancedAnalytics.captureWithContext('funnel_abandoned', {
      funnel_name: funnelName,
      last_completed_step: lastCompletedStep,
      abandonment_reason: reason,
      user_id: userId,
      ...context,
    });
  }, [userId]);

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

  const trackExperimentView = useCallback((experimentName: string, variant: string, context?: Record<string, any>) => {
    enhancedAnalytics.captureWithContext('experiment_viewed', {
      experiment_name: experimentName,
      variant,
      user_id: userId,
      ...context,
    });
  }, [userId]);

  const trackExperimentConversion = useCallback((
    experimentName: string, 
    variant: string, 
    conversionType: string,
    value?: number,
    context?: Record<string, any>
  ) => {
    enhancedAnalytics.captureWithContext('experiment_conversion', {
      experiment_name: experimentName,
      variant,
      conversion_type: conversionType,
      conversion_value: value,
      user_id: userId,
      ...context,
    });
  }, [userId]);

  const trackFeatureUsage = useCallback((featureName: string, action: string, context?: Record<string, any>) => {
    enhancedAnalytics.captureWithContext('feature_used', {
      feature_name: featureName,
      action,
      user_id: userId,
      ...context,
    });
  }, [userId]);

  return {
    trackExperimentView,
    trackExperimentConversion,
    trackFeatureUsage,
  };
}

// Export user property helpers for easy access
export { userPropertyHelpers };