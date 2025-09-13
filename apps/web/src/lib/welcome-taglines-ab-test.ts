/**
 * A/B Testing for Welcome Taglines using PostHog Feature Flags
 *
 * Simplified implementation that leverages PostHog's feature flag system
 * with payloads for A/B testing and conversion tracking.
 */

import type { User } from '@vibechecc/types';

// Welcome tagline variants for A/B testing
export const WELCOME_TAGLINE_VARIANTS = {
  control: {
    key: 'control',
    name: 'Original Welcome',
    taglines: [
      'discover your perfect vibe',
      'find experiences that resonate',
      'connect through shared feelings',
    ],
    cta: 'start exploring',
    theme: 'gradient-purple',
  },
  emotional_connection: {
    key: 'emotional_connection',
    name: 'Emotional Connection',
    taglines: [
      'where emotions find their match',
      'share what moves you',
      'connect hearts through vibes',
    ],
    cta: 'feel the connection',
    theme: 'gradient-pink',
  },
  community_focused: {
    key: 'community_focused',
    name: 'Community Focused',
    taglines: [
      'join a community that gets you',
      'your tribe is waiting',
      'belong somewhere special',
    ],
    cta: 'join the community',
    theme: 'gradient-blue',
  },
  personalized_discovery: {
    key: 'personalized_discovery',
    name: 'Personalized Discovery',
    taglines: [
      'tailored experiences just for you',
      'discover your unique path',
      'personalized vibes await',
    ],
    cta: 'start my journey',
    theme: 'gradient-green',
  },
} as const;

export type WelcomeTaglineVariant = keyof typeof WELCOME_TAGLINE_VARIANTS;

interface WelcomeTaglineConfig {
  variant: WelcomeTaglineVariant;
  tagline: string;
  cta: string;
  theme: string;
  isTest: boolean;
}

/**
 * Get welcome tagline configuration from PostHog payload
 */
export function getWelcomeConfigFromPayload(
  payload: Record<string, unknown> | null,
  user?: User | null,
  sessionId?: string
): WelcomeTaglineConfig {
  // If no payload or A/B testing disabled, return control
  if (!payload) {
    return getControlConfig();
  }

  const variant = payload.variant as WelcomeTaglineVariant;
  const variantConfig =
    WELCOME_TAGLINE_VARIANTS[variant] || WELCOME_TAGLINE_VARIANTS.control;

  // Use tagline from payload if provided, otherwise select randomly from variant
  let tagline = payload.tagline;
  if (!tagline) {
    const taglineIndex = getConsistentRandomIndex(
      user?.externalId || sessionId || 'anonymous',
      variantConfig.taglines.length
    );
    tagline = variantConfig.taglines[taglineIndex];
  }

  return {
    variant: variant || 'control',
    tagline: (tagline as string) || variantConfig.taglines[0],
    cta: (payload.cta as string) || variantConfig.cta,
    theme: (payload.theme as string) || variantConfig.theme,
    isTest: true,
  };
}

/**
 * Track tagline exposure event
 */
export function trackWelcomeTaglineExposure(
  variant: WelcomeTaglineVariant,
  user?: User | null,
  sessionId?: string,
  context: {
    page?: string;
    userAgent?: string;
    referrer?: string;
  } = {}
): void {
  if (typeof window === 'undefined') return;

  try {
    // Track with PostHog
    if (window.posthog) {
      window.posthog.capture('welcome_tagline_exposed', {
        variant,
        tagline_variant: variant,
        user_id: user?.externalId,
        session_id: sessionId,
        is_authenticated: !!user,
        timestamp: Date.now(),
        page: context.page || window.location.pathname,
        referrer: context.referrer || document.referrer,
        user_agent: context.userAgent || navigator.userAgent,
        experiment_key: 'welcome_tagline_ab_test',
      });
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[A/B TEST] Welcome tagline exposed:', {
        variant,
        user: user?.externalId,
        sessionId,
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[A/B TEST] Failed to track tagline exposure:', error);
  }
}

/**
 * Track conversion event (user completes signup)
 */
export function trackWelcomeTaglineConversion(
  variant: WelcomeTaglineVariant,
  conversionType: 'signup' | 'onboarding_complete' | 'first_action',
  user: User,
  metadata: {
    timeToConversion?: number;
    conversionPath?: string[];
    referrer?: string;
  } = {}
): void {
  if (typeof window === 'undefined') return;

  try {
    // Track with PostHog
    if (window.posthog) {
      window.posthog.capture('welcome_tagline_conversion', {
        variant,
        tagline_variant: variant,
        conversion_type: conversionType,
        user_id: user.externalId,
        is_new_user: isNewUser(user),
        timestamp: Date.now(),
        time_to_conversion: metadata.timeToConversion,
        conversion_path: metadata.conversionPath,
        referrer: metadata.referrer || document.referrer,
        experiment_key: 'welcome_tagline_ab_test',
      });
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[A/B TEST] Welcome tagline conversion:', {
        variant,
        conversionType,
        user: user.externalId,
        timeToConversion: metadata.timeToConversion,
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[A/B TEST] Failed to track tagline conversion:', error);
  }
}

/**
 * Get control variant configuration
 */
function getControlConfig(): WelcomeTaglineConfig {
  const controlVariant = WELCOME_TAGLINE_VARIANTS.control;

  return {
    variant: 'control',
    tagline: controlVariant.taglines[0], // Always use first tagline for control
    cta: controlVariant.cta,
    theme: controlVariant.theme,
    isTest: false,
  };
}

/**
 * Generate consistent random index based on user/session identifier
 */
function getConsistentRandomIndex(
  identifier: string,
  arrayLength: number
): number {
  // Simple hash function for consistent randomization
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash) % arrayLength;
}

/**
 * Check if user is new (within first 24 hours)
 */
function isNewUser(user: User): boolean {
  if (!user.created_at) return false;

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return user.created_at > oneDayAgo;
}
