/**
 * Comprehensive A/B testing infrastructure using PostHog feature flags
 * Provides hooks for running experiments with automatic event tracking
 */

import { useCallback, useEffect, useMemo } from 'react';

// Simple local tracking for A/B tests until PostHog is fully integrated
const abTestTracking = {
  experimentExposed: (
    flagKey: string,
    variantId: string,
    variantName: string
  ) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(
        `[A/B Test] ${flagKey} exposed: ${variantId} (${variantName})`
      );
    }
    // TODO: Add PostHog tracking when available
    // trackEvents.experimentExposed?.(flagKey, variantId, variantName);
  },
  experimentConversion: (
    flagKey: string,
    variantId: string,
    conversionGoal: string,
    value?: number,
    properties?: Record<string, unknown>
  ) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[A/B Test] ${flagKey} conversion: ${conversionGoal}`, {
        value,
        properties,
      });
    }
    // TODO: Add PostHog tracking when available
    // trackEvents.experimentConversion?.(flagKey, variantId, conversionGoal, value, properties);
  },
  experimentAction: (
    flagKey: string,
    variantId: string,
    action: string,
    properties?: Record<string, unknown>
  ) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[A/B Test] ${flagKey} action: ${action}`, properties);
    }
    // TODO: Add PostHog tracking when available
    // trackEvents.experimentAction?.(flagKey, variantId, action, properties);
  },
  featureRolloutExposed: (
    flagKey: string,
    isEnabled: boolean,
    payload: unknown
  ) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Feature Rollout] ${flagKey}: ${isEnabled}`, payload);
    }
  },
  featureRolloutAction: (
    flagKey: string,
    action: string,
    properties?: Record<string, unknown>
  ) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(
        `[Feature Rollout] ${flagKey} action: ${action}`,
        properties
      );
    }
  },
};

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
  // Mock implementation until PostHog is integrated
  const mockPostHog = {
    isFeatureEnabled: () => false,
    getFeatureFlagPayload: () => null,
  };

  const isEnabled = mockPostHog.isFeatureEnabled();
  const payload = mockPostHog.getFeatureFlagPayload();

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
      abTestTracking.experimentExposed(
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
        abTestTracking.experimentConversion(
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
        abTestTracking.experimentAction(
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
  // Mock implementation - always disabled until PostHog is integrated
  const isEnabled = false;
  const payload = null;

  useEffect(() => {
    if (options.trackingEnabled !== false) {
      abTestTracking.featureRolloutExposed(
        flagKey,
        isEnabled || false,
        payload
      );
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
      abTestTracking.featureRolloutAction(flagKey, action, properties);
    },
    [flagKey]
  );

  return {
    isEnabled,
    payload,
    trackFeatureUsage,
  };
}

/**
 * Hook for testing hero section taglines (example implementation)
 */
export function useHeroTaglineExperiment() {
  const taglineVariants = [
    'control',
    'emotional',
    'social',
    'minimal',
    'playful',
  ];

  const experiment = useMultivariateTest(
    'hero_tagline_experiment',
    taglineVariants,
    {
      defaultVariant: 'control',
      trackingEnabled: true,
    }
  );

  const taglineContent = {
    control: {
      headline: "we're vibing here",
      description:
        "welcome to vibechecc, where you can discover, share, and rate vibes because that's a thing you can do",
      cta: { primary: 'create vibe', secondary: 'discover vibes' },
    },
    emotional: {
      headline: 'share your energy',
      description:
        'connect with others through authentic experiences and discover what moves you',
      cta: { primary: 'share your vibe', secondary: 'explore vibes' },
    },
    social: {
      headline: 'vibe with your tribe',
      description:
        'join a community where every moment matters and genuine connections spark',
      cta: { primary: 'join the vibe', secondary: 'find your tribe' },
    },
    minimal: {
      headline: 'moments matter',
      description: 'capture, share, discover',
      cta: { primary: 'get started', secondary: 'explore' },
    },
    playful: {
      headline: 'good vibes only',
      description: "where life's best moments get the recognition they deserve",
      cta: {
        primary: 'spread good vibes',
        secondary: 'discover amazing moments',
      },
    },
  };

  const content =
    taglineContent[experiment.currentVariant as keyof typeof taglineContent] ||
    taglineContent.control;

  const trackTaglineInteraction = useCallback(
    (
      interactionType: 'view' | 'cta_click',
      ctaType?: 'primary' | 'secondary'
    ) => {
      experiment.trackAction('tagline_interaction', {
        interaction_type: interactionType,
        cta_type: ctaType,
        content: content.headline,
      });
    },
    [experiment, content]
  );

  return {
    ...experiment,
    content,
    trackTaglineInteraction,
  };
}
