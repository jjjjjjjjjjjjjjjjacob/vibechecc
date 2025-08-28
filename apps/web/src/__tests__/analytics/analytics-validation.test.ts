/**
 * Analytics validation tests for comprehensive tracking setup
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock PostHog before importing track-events
vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
    init: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}));

import { trackEvents } from '@/lib/track-events';
import posthog from 'posthog-js';

describe('Analytics Infrastructure Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('A/B Testing Events', () => {
    it('should track experiment exposure with correct parameters', () => {
      trackEvents.experimentExposed(
        'hero_tagline_test',
        'variant_b',
        'Emotional Tagline'
      );

      expect(posthog.capture).toHaveBeenCalledWith('experiment_exposed', {
        experiment_key: 'hero_tagline_test',
        variant_id: 'variant_b',
        variant_name: 'Emotional Tagline',
      });
    });

    it('should track experiment conversions with value and properties', () => {
      trackEvents.experimentConversion(
        'hero_tagline_test',
        'variant_b',
        'signup',
        1,
        { source: 'hero_cta' }
      );

      expect(posthog.capture).toHaveBeenCalledWith('experiment_conversion', {
        experiment_key: 'hero_tagline_test',
        variant_id: 'variant_b',
        conversion_goal: 'signup',
        value: 1,
        source: 'hero_cta',
      });
    });

    it('should track experiment actions', () => {
      trackEvents.experimentAction(
        'hero_tagline_test',
        'variant_b',
        'cta_clicked',
        { button_text: 'Share Your Vibe' }
      );

      expect(posthog.capture).toHaveBeenCalledWith('experiment_action', {
        experiment_key: 'hero_tagline_test',
        variant_id: 'variant_b',
        action: 'cta_clicked',
        button_text: 'Share Your Vibe',
      });
    });
  });

  describe('Performance Tracking Events', () => {
    it('should track placeholder performance metrics', () => {
      trackEvents.placeholderPerformance(
        'hero-buttons-skeleton',
        'render',
        245.5,
        { context: 'authentication_loading' }
      );

      expect(posthog.capture).toHaveBeenCalledWith('placeholder_performance', {
        component_name: 'hero-buttons-skeleton',
        metric_type: 'render',
        value: 245.5,
        context: 'authentication_loading',
      });
    });

    it('should track loading state changes with duration', () => {
      trackEvents.loadingStateChanged('clerk-auth', 'completed', 1200);

      expect(posthog.capture).toHaveBeenCalledWith('loading_state_changed', {
        state_name: 'clerk-auth',
        transition: 'completed',
        duration: 1200,
      });
    });

    it('should track component performance events', () => {
      trackEvents.componentPerformance('home-page', 'rerender', undefined, {
        render_count: 3,
      });

      expect(posthog.capture).toHaveBeenCalledWith('component_performance', {
        component_name: 'home-page',
        event_type: 'rerender',
        value: undefined,
        render_count: 3,
      });
    });

    it('should track time to interactive', () => {
      trackEvents.timeToInteractive('hero-section', 850);

      expect(posthog.capture).toHaveBeenCalledWith('time_to_interactive', {
        component_name: 'hero-section',
        time_ms: 850,
      });
    });
  });

  describe('Engagement & Funnel Events', () => {
    it('should track funnel step completion', () => {
      trackEvents.funnelStepCompleted(
        'user_onboarding',
        'profile_setup',
        2,
        'user123',
        { completion_rate: 0.6 }
      );

      expect(posthog.capture).toHaveBeenCalledWith('funnel_step_completed', {
        funnel_name: 'user_onboarding',
        step_name: 'profile_setup',
        step_number: 2,
        user_id: 'user123',
        completion_rate: 0.6,
      });
    });

    it('should track funnel dropoffs with reasons', () => {
      trackEvents.funnelDropoff(
        'vibe_creation',
        'image_upload',
        1,
        'file_too_large',
        { file_size: 5242880 }
      );

      expect(posthog.capture).toHaveBeenCalledWith('funnel_dropoff', {
        funnel_name: 'vibe_creation',
        dropoff_step: 'image_upload',
        step_number: 1,
        reason: 'file_too_large',
        file_size: 5242880,
      });
    });

    it('should track user journey completion', () => {
      trackEvents.userJourneyCompleted('rating_journey', 1500, 4, 'user123');

      expect(posthog.capture).toHaveBeenCalledWith('user_journey_completed', {
        journey_type: 'rating_journey',
        completion_time: 1500,
        steps_completed: 4,
        user_id: 'user123',
      });
    });
  });

  describe('Social Sharing & Viral Events', () => {
    it('should track share attempts', () => {
      trackEvents.shareAttempted('vibe', 'vibe123', 'twitter', 'native');

      expect(posthog.capture).toHaveBeenCalledWith('share_attempted', {
        content_type: 'vibe',
        content_id: 'vibe123',
        platform: 'twitter',
        method: 'native',
      });
    });

    it('should track share completions', () => {
      trackEvents.shareCompleted('rating', 'rating456', 'instagram', 'manual');

      expect(posthog.capture).toHaveBeenCalledWith('share_completed', {
        content_type: 'rating',
        content_id: 'rating456',
        platform: 'instagram',
        method: 'manual',
      });
    });

    it('should track viral coefficient calculations', () => {
      trackEvents.viralCoefficientCalculated('weekly', 1.2, 100, 120);

      expect(posthog.capture).toHaveBeenCalledWith(
        'viral_coefficient_calculated',
        {
          period: 'weekly',
          coefficient: 1.2,
          invites_sent: 100,
          conversions: 120,
        }
      );
    });
  });

  describe('Engagement Session Events', () => {
    it('should track engagement session start', () => {
      trackEvents.engagementSessionStarted('browse', 'home_page');

      expect(posthog.capture).toHaveBeenCalledWith(
        'engagement_session_started',
        {
          session_type: 'browse',
          entry_point: 'home_page',
        }
      );
    });

    it('should track engagement session end', () => {
      trackEvents.engagementSessionEnded('create', 2400, 3, 'navigation');

      expect(posthog.capture).toHaveBeenCalledWith('engagement_session_ended', {
        session_type: 'create',
        duration: 2400,
        actions_completed: 3,
        exit_point: 'navigation',
      });
    });

    it('should track rating engagement analysis', () => {
      trackEvents.ratingEngagementAnalyzed('daily', 150, 45, 4.2, 0.75);

      expect(posthog.capture).toHaveBeenCalledWith(
        'rating_engagement_analyzed',
        {
          period: 'daily',
          total_ratings: 150,
          unique_raters: 45,
          average_rating: 4.2,
          engagement_rate: 0.75,
        }
      );
    });
  });

  describe('Cohort Analysis Events', () => {
    it('should track cohort user addition', () => {
      trackEvents.cohortUserAdded(
        'weekly_signup_cohort',
        'user123',
        '2024-01-15',
        { signup_source: 'organic', interest: 'photography' }
      );

      expect(posthog.capture).toHaveBeenCalledWith('cohort_user_added', {
        cohort_name: 'weekly_signup_cohort',
        user_id: 'user123',
        cohort_date: '2024-01-15',
        signup_source: 'organic',
        interest: 'photography',
      });
    });

    it('should track cohort retention metrics', () => {
      trackEvents.cohortRetentionTracked('week_1_cohort', 7, 0.68, 68, 100);

      expect(posthog.capture).toHaveBeenCalledWith('cohort_retention_tracked', {
        cohort_name: 'week_1_cohort',
        period: 7,
        retention_rate: 0.68,
        active_users: 68,
        total_users: 100,
      });
    });
  });
});

describe('Hero Tagline Variants Configuration', () => {
  it('should have properly configured tagline variants', async () => {
    const { HERO_TAGLINE_VARIANTS } = await import(
      '@/hooks/use-hero-tagline-experiment'
    );

    expect(HERO_TAGLINE_VARIANTS).toBeDefined();
    expect(Object.keys(HERO_TAGLINE_VARIANTS)).toContain('control');
    expect(Object.keys(HERO_TAGLINE_VARIANTS)).toContain('emotional');
    expect(Object.keys(HERO_TAGLINE_VARIANTS)).toContain('social');

    // Validate variant structure
    Object.values(HERO_TAGLINE_VARIANTS).forEach((variant) => {
      expect(variant).toHaveProperty('id');
      expect(variant).toHaveProperty('headline');
      expect(variant).toHaveProperty('description');
      expect(variant).toHaveProperty('cta');
      expect(variant.cta).toHaveProperty('primary');
      expect(variant.cta).toHaveProperty('secondary');
    });
  });

  it('should have distinct content for each variant', async () => {
    const { HERO_TAGLINE_VARIANTS } = await import(
      '@/hooks/use-hero-tagline-experiment'
    );

    const headlines = Object.values(HERO_TAGLINE_VARIANTS).map(
      (v) => v.headline
    );
    const descriptions = Object.values(HERO_TAGLINE_VARIANTS).map(
      (v) => v.description
    );

    // Ensure all headlines are unique
    expect(new Set(headlines).size).toBe(headlines.length);

    // Ensure all descriptions are unique
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});

describe('Analytics Event Types Validation', () => {
  it('should export all required tracking functions', () => {
    const requiredFunctions = [
      'experimentExposed',
      'experimentConversion',
      'experimentAction',
      'placeholderPerformance',
      'loadingStateChanged',
      'componentPerformance',
      'timeToInteractive',
      'funnelStepCompleted',
      'funnelDropoff',
      'shareAttempted',
      'shareCompleted',
      'viralCoefficientCalculated',
      'engagementSessionStarted',
      'engagementSessionEnded',
      'ratingEngagementAnalyzed',
      'cohortUserAdded',
      'cohortRetentionTracked',
    ];

    requiredFunctions.forEach((funcName) => {
      expect(trackEvents).toHaveProperty(funcName);
      expect(typeof trackEvents[funcName as keyof typeof trackEvents]).toBe(
        'function'
      );
    });
  });
});
