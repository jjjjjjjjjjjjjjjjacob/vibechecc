/**
 * Comprehensive A/B testing infrastructure using PostHog feature flags
 * Provides hooks for running experiments with automatic event tracking
 */

import { useCallback, useEffect, useMemo } from 'react';
import {
  useFeatureFlagEnabled,
  useFeatureFlagPayload,
  usePostHog,
} from 'posthog-js/react';
import { trackEvents } from '@/lib/track-events';

export interface ExperimentVariant {
  id: string;
  name: string;
  weight?: number;
  payload?: Record<string, unknown>;
}

export interface ExperimentConfig {
  flagKey: string;
  variants: ExperimentVariant[];
  defaultVariant: string;
  trackingEnabled?: boolean;
}

/**
 * Core A/B testing hook for feature flag experiments
 */
export function useAbTest(config: ExperimentConfig) {
  const _posthog = usePostHog();
  const isEnabled = useFeatureFlagEnabled(config.flagKey);
  const payload = useFeatureFlagPayload(config.flagKey);

  // Determine the active variant
  const activeVariant = useMemo(() => {
    if (!isEnabled) {
      return (
        config.variants.find((v) => v.id === config.defaultVariant) ||
        config.variants[0]
      );
    }

    // If payload contains variant info, use that
    if (payload && typeof payload === 'object' && 'variant' in payload) {
      const variantId = (payload as { variant: string }).variant;
      return (
        config.variants.find((v) => v.id === variantId) ||
        config.variants.find((v) => v.id === config.defaultVariant) ||
        config.variants[0]
      );
    }

    // Default to first variant if enabled but no specific variant
    return config.variants[0];
  }, [isEnabled, payload, config.variants, config.defaultVariant]);

  // Track experiment exposure
  useEffect(() => {
    if (config.trackingEnabled !== false && activeVariant) {
      trackEvents.experimentExposed(
        config.flagKey,
        activeVariant.id,
        activeVariant.name
      );
    }
  }, [config.flagKey, config.trackingEnabled, activeVariant]);

  // Conversion tracking function
  const trackConversion = useCallback(
    (
      conversionGoal: string,
      value?: number,
      properties?: Record<string, unknown>
    ) => {
      if (activeVariant) {
        trackEvents.experimentConversion(
          config.flagKey,
          activeVariant.id,
          conversionGoal,
          value,
          properties
        );
      }
    },
    [config.flagKey, activeVariant]
  );

  // User action tracking for the experiment
  const trackAction = useCallback(
    (action: string, properties?: Record<string, unknown>) => {
      if (activeVariant) {
        trackEvents.experimentAction(
          config.flagKey,
          activeVariant.id,
          action,
          properties
        );
      }
    },
    [config.flagKey, activeVariant]
  );

  return {
    variant: activeVariant,
    isEnabled,
    payload,
    trackConversion,
    trackAction,
    flagKey: config.flagKey,
  };
}

/**
 * Hook for simple binary A/B tests (variant A vs B)
 */
export function useBinaryAbTest(
  flagKey: string,
  options: {
    variantAName?: string;
    variantBName?: string;
    trackingEnabled?: boolean;
  } = {}
) {
  const config: ExperimentConfig = {
    flagKey,
    variants: [
      { id: 'control', name: options.variantAName || 'Control' },
      { id: 'test', name: options.variantBName || 'Test' },
    ],
    defaultVariant: 'control',
    trackingEnabled: options.trackingEnabled,
  };

  const result = useAbTest(config);

  return {
    ...result,
    isVariantA: result.variant.id === 'control',
    isVariantB: result.variant.id === 'test',
    isControl: result.variant.id === 'control',
    isTest: result.variant.id === 'test',
  };
}

/**
 * Hook for multivariate testing with multiple variants
 */
export function useMultivariateTest(
  flagKey: string,
  variants: string[],
  options: {
    defaultVariant?: string;
    trackingEnabled?: boolean;
  } = {}
) {
  const config: ExperimentConfig = {
    flagKey,
    variants: variants.map((variant) => ({ id: variant, name: variant })),
    defaultVariant: options.defaultVariant || variants[0],
    trackingEnabled: options.trackingEnabled,
  };

  const result = useAbTest(config);

  return {
    ...result,
    currentVariant: result.variant.id,
    isVariant: (variantId: string) => result.variant.id === variantId,
  };
}

/**
 * Hook for feature rollouts with percentage-based exposure
 */
export function useFeatureRollout(
  flagKey: string,
  options: {
    trackingEnabled?: boolean;
    onEnabled?: () => void;
    onDisabled?: () => void;
  } = {}
) {
  const isEnabled = useFeatureFlagEnabled(flagKey);
  const payload = useFeatureFlagPayload(flagKey);

  useEffect(() => {
    if (options.trackingEnabled !== false) {
      trackEvents.featureRolloutExposed(flagKey, isEnabled || false, payload);
    }
  }, [flagKey, isEnabled, payload, options.trackingEnabled]);

  useEffect(() => {
    if (isEnabled && options.onEnabled) {
      options.onEnabled();
    } else if (!isEnabled && options.onDisabled) {
      options.onDisabled();
    }
  }, [isEnabled, options]);

  const trackFeatureUsage = useCallback(
    (action: string, properties?: Record<string, unknown>) => {
      trackEvents.featureRolloutAction(flagKey, action, properties);
    },
    [flagKey]
  );

  return {
    isEnabled,
    payload,
    trackFeatureUsage,
  };
}
