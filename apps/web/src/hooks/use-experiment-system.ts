/**
 * Advanced React hooks for A/B testing and experiments
 * Integrates with enhanced-posthog-experiments.ts and existing analytics system
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import {
  experimentService,
  experimentHelpers,
  type ExperimentConfig,
  type ExperimentVariant,
  type ExperimentResult,
} from '@/lib/enhanced-posthog-experiments';
import { useEnhancedAnalytics } from './use-enhanced-analytics';

// Hook for using A/B experiments
export function useExperiment(
  experimentId: string,
  context?: Record<string, unknown>
) {
  const { user } = useUser();
  const { trackEvent: _trackEvent } = useEnhancedAnalytics();
  const [variant, setVariant] = useState<ExperimentVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const assignedVariant = experimentService.getVariant(
      experimentId,
      user.id,
      {
        ...context,
        user_id: user.id,
        timestamp: new Date().toISOString(),
      }
    );

    setVariant(assignedVariant);
    setIsLoading(false);
  }, [experimentId, user?.id, context]);

  const trackConversion = useCallback(
    (
      metricId: string,
      value?: number,
      additionalContext?: Record<string, unknown>
    ) => {
      if (!user?.id) return;

      experimentService.trackConversion(
        experimentId,
        user.id,
        metricId,
        value,
        {
          ...context,
          ...additionalContext,
          user_id: user.id,
          timestamp: new Date().toISOString(),
        }
      );
    },
    [experimentId, user?.id, context]
  );

  const isControl = variant?.isControl ?? false;
  const isVariant = variant && !variant.isControl;
  const config = variant?.config || {};

  return {
    variant,
    isLoading,
    isControl,
    isVariant,
    config,
    trackConversion,
    // Helper to check if user is in experiment at all
    isInExperiment: variant !== null,
    // Get specific config value with fallback
    getConfig: <T>(key: string, fallback: T): T =>
      (config[key] as T) ?? fallback,
  };
}

// Hook for feature flags (simplified experiment pattern)
export function useFeatureFlag(flagId: string, defaultValue: boolean = false) {
  const { variant, isLoading, trackConversion } = useExperiment(flagId);

  const isEnabled = useMemo(() => {
    if (isLoading || !variant) return defaultValue;
    return variant.config.enabled === true;
  }, [variant, isLoading, defaultValue]);

  const trackUsage = useCallback(
    (action: string, value?: number) => {
      trackConversion(`${flagId}_usage`, value, { action });
    },
    [flagId, trackConversion]
  );

  return {
    isEnabled,
    isLoading,
    trackUsage,
    variant,
  };
}

// Hook for multivariate testing
export function useMultivariateTest(
  experimentId: string,
  context?: Record<string, unknown>
) {
  const { variant, isLoading, trackConversion } = useExperiment(
    experimentId,
    context
  );

  const getVariantValue = useCallback(
    <T>(key: string, fallback: T): T => {
      if (!variant) return fallback;
      return (variant.config[key] as T) ?? fallback;
    },
    [variant]
  );

  const isVariantActive = useCallback(
    (variantId: string): boolean => {
      return variant?.id === variantId;
    },
    [variant]
  );

  return {
    variant,
    isLoading,
    getVariantValue,
    isVariantActive,
    trackConversion,
    variantId: variant?.id,
    variantName: variant?.name,
  };
}

// Hook for experiment management and admin features
export function useExperimentManagement() {
  const { user } = useUser();
  const { trackEvent } = useEnhancedAnalytics();
  const [experiments, setExperiments] = useState<ExperimentConfig[]>([]);

  const refreshExperiments = useCallback(() => {
    const debugInfo = experimentService.getDebugInfo();
    setExperiments(debugInfo.experiments);
  }, []);

  useEffect(() => {
    refreshExperiments();
  }, [refreshExperiments]);

  const createExperiment = useCallback(
    (config: ExperimentConfig) => {
      try {
        experimentService.configureExperiment(config);
        refreshExperiments();

        trackEvent('experiment_created', {
          experiment_id: config.id,
          experiment_name: config.name,
          variant_count: config.variants.length,
          created_by: user?.id,
        });

        return { success: true };
      } catch (error) {
        trackEvent('experiment_creation_failed', {
          experiment_id: config.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          created_by: user?.id,
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [trackEvent, user?.id, refreshExperiments]
  );

  const createSimpleABTest = useCallback(
    (
      id: string,
      name: string,
      controlConfig: Record<string, unknown>,
      variantConfig: Record<string, unknown>,
      trafficAllocation?: number
    ) => {
      const config = experimentHelpers.createSimpleABTest(
        id,
        name,
        controlConfig,
        variantConfig,
        trafficAllocation
      );
      return createExperiment(config);
    },
    [createExperiment]
  );

  const createFeatureFlag = useCallback(
    (id: string, name: string, rolloutPercentage: number) => {
      const config = experimentHelpers.createFeatureFlag(
        id,
        name,
        rolloutPercentage
      );
      return createExperiment(config);
    },
    [createExperiment]
  );

  const clearAllAssignments = useCallback(() => {
    experimentService.clearAssignments();
    trackEvent('experiment_assignments_cleared', {
      cleared_by: user?.id,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent, user?.id]);

  const getDebugInfo = useCallback(() => {
    return experimentService.getDebugInfo();
  }, []);

  const getUserExperiments = useCallback(() => {
    if (!user?.id) return [];
    return experimentService.getActiveExperiments(user.id);
  }, [user?.id]);

  return {
    experiments,
    createExperiment,
    createSimpleABTest,
    createFeatureFlag,
    clearAllAssignments,
    getDebugInfo,
    getUserExperiments,
    refreshExperiments,
  };
}

// Hook for tracking experiment performance impact
export function useExperimentPerformance(experimentId: string) {
  const { user } = useUser();
  const { trackPerformance } = useEnhancedAnalytics();
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    pageLoadTime?: number;
    renderTime?: number;
    interactionTime?: number;
  }>({});

  const trackExperimentPerformance = useCallback(
    (metric: string, value: number, context?: Record<string, unknown>) => {
      trackPerformance(metric, value, {
        experiment_id: experimentId,
        user_id: user?.id,
        ...context,
      });

      setPerformanceMetrics((prev) => ({
        ...prev,
        [metric]: value,
      }));
    },
    [experimentId, user?.id, trackPerformance]
  );

  const trackPageLoadImpact = useCallback(
    (loadTime: number) => {
      trackExperimentPerformance('pageLoadTime', loadTime, {
        metric_type: 'page_load',
        timestamp: new Date().toISOString(),
      });
    },
    [trackExperimentPerformance]
  );

  const trackRenderImpact = useCallback(
    (renderTime: number) => {
      trackExperimentPerformance('renderTime', renderTime, {
        metric_type: 'component_render',
        timestamp: new Date().toISOString(),
      });
    },
    [trackExperimentPerformance]
  );

  const trackInteractionImpact = useCallback(
    (interactionTime: number, interactionType: string) => {
      trackExperimentPerformance('interactionTime', interactionTime, {
        metric_type: 'user_interaction',
        interaction_type: interactionType,
        timestamp: new Date().toISOString(),
      });
    },
    [trackExperimentPerformance]
  );

  return {
    performanceMetrics,
    trackExperimentPerformance,
    trackPageLoadImpact,
    trackRenderImpact,
    trackInteractionImpact,
  };
}

// Hook for advanced experiment analytics
export function useExperimentAnalytics(experimentId: string) {
  const { user } = useUser();
  const { trackEvent } = useEnhancedAnalytics();

  const trackExperimentEvent = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      trackEvent(eventName, {
        experiment_id: experimentId,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
        ...properties,
      });
    },
    [experimentId, user?.id, trackEvent]
  );

  const trackVariantExposure = useCallback(
    (variantId: string, exposureContext?: Record<string, unknown>) => {
      trackExperimentEvent('experiment_variant_exposed', {
        variant_id: variantId,
        exposure_context: exposureContext,
      });
    },
    [trackExperimentEvent]
  );

  const trackVariantInteraction = useCallback(
    (variantId: string, interactionType: string, value?: unknown) => {
      trackExperimentEvent('experiment_variant_interaction', {
        variant_id: variantId,
        interaction_type: interactionType,
        interaction_value: value,
      });
    },
    [trackExperimentEvent]
  );

  const trackExperimentError = useCallback(
    (error: Error | string, context?: Record<string, unknown>) => {
      trackExperimentEvent('experiment_error', {
        error_message: error instanceof Error ? error.message : error,
        error_stack: error instanceof Error ? error.stack : undefined,
        error_context: context,
      });
    },
    [trackExperimentEvent]
  );

  return {
    trackExperimentEvent,
    trackVariantExposure,
    trackVariantInteraction,
    trackExperimentError,
  };
}

// Hook for experiment UI testing (helpful for QA and development)
export function useExperimentTesting() {
  const { user } = useUser();
  const [forceVariant, setForceVariant] = useState<string | null>(null);
  const [testingMode, setTestingMode] = useState(false);

  // Force user into specific variant (for testing)
  const forceUserIntoVariant = useCallback(
    (experimentId: string, variantId: string) => {
      if (process.env.NODE_ENV !== 'development') {
        // eslint-disable-next-line no-console
        console.warn('Experiment forcing only available in development');
        return;
      }

      setForceVariant(`${experimentId}:${variantId}`);
      setTestingMode(true);
    },
    []
  );

  // Clear forced variant
  const clearForcedVariant = useCallback(() => {
    setForceVariant(null);
    setTestingMode(false);
  }, []);

  // Check if user is in forced variant
  const isForcedVariant = useCallback(
    (experimentId: string, variantId: string): boolean => {
      return forceVariant === `${experimentId}:${variantId}`;
    },
    [forceVariant]
  );

  return {
    testingMode,
    forceUserIntoVariant,
    clearForcedVariant,
    isForcedVariant,
    // Helper to get all available variants for testing
    getTestingInfo: () => ({
      userId: user?.id,
      forcedVariant: forceVariant,
      testingMode,
      environment: process.env.NODE_ENV,
    }),
  };
}

// Hook for experiment result tracking
export function useExperimentResults(experimentId: string) {
  const { trackEvent } = useEnhancedAnalytics();
  const [results, setResults] = useState<Record<string, unknown>>({});

  const recordResult = useCallback(
    (metricId: string, value: number, context?: Record<string, unknown>) => {
      const result = {
        experiment_id: experimentId,
        metric_id: metricId,
        value,
        timestamp: new Date().toISOString(),
        ...context,
      };

      setResults((prev) => ({
        ...prev,
        [metricId]: [...((prev[metricId] as ExperimentResult[]) || []), result],
      }));

      trackEvent('experiment_result_recorded', result);
    },
    [experimentId, trackEvent]
  );

  const getMetricResults = useCallback(
    (metricId: string) => {
      return results[metricId] || [];
    },
    [results]
  );

  const getAllResults = useCallback(() => {
    return results;
  }, [results]);

  const clearResults = useCallback(() => {
    setResults({});
  }, []);

  return {
    recordResult,
    getMetricResults,
    getAllResults,
    clearResults,
    hasResults: Object.keys(results).length > 0,
  };
}
