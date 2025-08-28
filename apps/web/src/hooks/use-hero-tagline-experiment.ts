/**
 * Hook for A/B testing hero section taglines
 * Manages multiple tagline experiments with conversion tracking
 */

import { useMultivariateTest } from './use-ab-testing';
import { trackEvents } from '@/lib/track-events';
import { useCallback } from 'react';

export interface TaglineVariant {
  id: string;
  headline: string;
  description: string;
  cta?: {
    primary?: string;
    secondary?: string;
  };
}

export const HERO_TAGLINE_VARIANTS: Record<string, TaglineVariant> = {
  control: {
    id: 'control',
    headline: "we're vibing here",
    description:
      "welcome to vibechecc, where you can discover, share, and rate vibes because that's a thing you can do",
    cta: {
      primary: 'create vibe',
      secondary: 'discover vibes',
    },
  },
  emotional: {
    id: 'emotional',
    headline: 'share your energy',
    description:
      'connect with others through authentic experiences and discover what moves you',
    cta: {
      primary: 'share your vibe',
      secondary: 'explore vibes',
    },
  },
  social: {
    id: 'social',
    headline: 'vibe with your tribe',
    description:
      'join a community where every moment matters and genuine connections spark',
    cta: {
      primary: 'join the vibe',
      secondary: 'find your tribe',
    },
  },
  minimal: {
    id: 'minimal',
    headline: 'moments matter',
    description: 'capture, share, discover',
    cta: {
      primary: 'get started',
      secondary: 'explore',
    },
  },
  playful: {
    id: 'playful',
    headline: 'good vibes only',
    description: "where life's best moments get the recognition they deserve",
    cta: {
      primary: 'spread good vibes',
      secondary: 'discover amazing moments',
    },
  },
};

/**
 * Hook for hero tagline A/B testing with conversion tracking
 */
export function useHeroTaglineExperiment() {
  const experiment = useMultivariateTest(
    'hero_tagline_experiment',
    Object.keys(HERO_TAGLINE_VARIANTS),
    {
      defaultVariant: 'control',
      trackingEnabled: true,
    }
  );

  const activeVariant =
    HERO_TAGLINE_VARIANTS[experiment.currentVariant] ||
    HERO_TAGLINE_VARIANTS.control;

  // Track specific tagline interactions
  const trackTaglineView = useCallback(() => {
    experiment.trackAction('tagline_viewed', {
      headline: activeVariant.headline,
      description: activeVariant.description,
    });
  }, [experiment, activeVariant]);

  const trackCtaClick = useCallback(
    (ctaType: 'primary' | 'secondary', ctaText: string) => {
      experiment.trackAction('cta_clicked', {
        cta_type: ctaType,
        cta_text: ctaText,
        headline: activeVariant.headline,
      });

      // Also track as conversion for measuring effectiveness
      experiment.trackConversion('cta_engagement', 1, {
        cta_type: ctaType,
        cta_text: ctaText,
      });
    },
    [experiment, activeVariant]
  );

  const trackSignupConversion = useCallback(() => {
    experiment.trackConversion('signup', 1, {
      headline: activeVariant.headline,
    });
  }, [experiment, activeVariant]);

  const trackVibeCreationConversion = useCallback(() => {
    experiment.trackConversion('vibe_creation', 1, {
      headline: activeVariant.headline,
    });
  }, [experiment, activeVariant]);

  const trackDiscoveryConversion = useCallback(() => {
    experiment.trackConversion('discovery_engagement', 1, {
      headline: activeVariant.headline,
    });
  }, [experiment, activeVariant]);

  return {
    variant: activeVariant,
    variantId: experiment.currentVariant,
    isControl: experiment.currentVariant === 'control',
    trackTaglineView,
    trackCtaClick,
    trackSignupConversion,
    trackVibeCreationConversion,
    trackDiscoveryConversion,
    experimentKey: experiment.flagKey,
  };
}

/**
 * Hook for testing specific tagline elements independently
 */
export function useTaglineElementTest(
  element: 'headline' | 'description' | 'cta',
  variants: string[]
) {
  const experiment = useMultivariateTest(`hero_${element}_test`, variants, {
    defaultVariant: variants[0],
    trackingEnabled: true,
  });

  const trackElementView = useCallback(() => {
    experiment.trackAction('element_viewed', {
      element,
      variant: experiment.currentVariant,
    });
  }, [experiment, element]);

  const trackElementInteraction = useCallback(
    (interactionType: string) => {
      experiment.trackAction('element_interaction', {
        element,
        interaction_type: interactionType,
        variant: experiment.currentVariant,
      });
    },
    [experiment, element]
  );

  return {
    variant: experiment.currentVariant,
    isVariant: experiment.isVariant,
    trackElementView,
    trackElementInteraction,
    experimentKey: experiment.flagKey,
  };
}

/**
 * Hook for seasonal or time-based tagline experiments
 */
export function useSeasonalTaglineExperiment() {
  const currentMonth = new Date().getMonth();
  const currentHour = new Date().getHours();

  // Determine if we should show seasonal variants
  const isHolidaySeason = currentMonth === 11 || currentMonth === 0; // Dec/Jan
  const isSummer = currentMonth >= 5 && currentMonth <= 7; // Jun-Aug
  const isEvening = currentHour >= 18 || currentHour <= 6;

  const seasonalVariants = Object.keys(HERO_TAGLINE_VARIANTS);

  // Add seasonal context to tracking
  const baseExperiment = useHeroTaglineExperiment();

  const trackSeasonalView = useCallback(() => {
    trackEvents.experimentAction(
      'hero_tagline_seasonal',
      baseExperiment.variantId,
      'seasonal_tagline_viewed',
      {
        is_holiday_season: isHolidaySeason,
        is_summer: isSummer,
        is_evening: isEvening,
        month: currentMonth,
        hour: currentHour,
      }
    );
  }, [
    baseExperiment.variantId,
    isHolidaySeason,
    isSummer,
    isEvening,
    currentMonth,
    currentHour,
  ]);

  return {
    ...baseExperiment,
    seasonalContext: {
      isHolidaySeason,
      isSummer,
      isEvening,
    },
    trackSeasonalView,
  };
}
