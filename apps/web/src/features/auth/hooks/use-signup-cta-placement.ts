import { useMemo, useCallback } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import { useAnonymousUserStore } from '@/stores';

export interface CtaPlacementConfig {
  showInFeed: boolean;
  showInVibeDetail: boolean;
  showInProfile: boolean;
  showInSearch: boolean;
  showOnInteraction: boolean;
  showInEmptyStates: boolean;
}

interface UseCTAPlacementOptions {
  enableFeedCta?: boolean;
  enableVibeDetailCta?: boolean;
  enableProfileCta?: boolean;
  enableSearchCta?: boolean;
  enableInteractionGate?: boolean;
  enableEmptyStateCta?: boolean;
  feedThreshold?: number; // number of vibes viewed before showing CTA
  scrollThreshold?: number; // percentage of page scrolled
}

export function useSignupCtaPlacement(options: UseCTAPlacementOptions = {}) {
  const { user, isLoaded } = useUser();
  const isAuthenticated = isLoaded && !!user;

  // Use individual stable selectors to avoid object recreation
  const vibesViewed = useAnonymousUserStore((state) => state.vibesViewed);
  const sessionStartTime = useAnonymousUserStore(
    (state) => state.sessionStartTime
  );

  // Use stable selectors for action counts
  const ratingAttempts = useAnonymousUserStore(
    (state) => state.actions.filter((a) => a.type === 'rating_attempt').length
  );
  const followAttempts = useAnonymousUserStore(
    (state) => state.actions.filter((a) => a.type === 'follow_attempt').length
  );
  const searchAttempts = useAnonymousUserStore(
    (state) => state.actions.filter((a) => a.type === 'search').length
  );

  const {
    enableFeedCta = true,
    enableVibeDetailCta = true,
    enableProfileCta = true,
    enableSearchCta = true,
    enableInteractionGate = true,
    enableEmptyStateCta = true,
    feedThreshold = 3,
    scrollThreshold = 60,
  } = options;

  // Use the store's shouldShowCta function instead of duplicating logic
  const shouldShowCtaFromStore = useAnonymousUserStore(
    (state) => state.shouldShowCta
  );

  // Calculate derived values once
  const derivedValues = useMemo(() => {
    if (isAuthenticated) {
      return {
        sessionTimeMinutes: 0,
        hasAttemptedInteraction: false,
        hasEngagedWithSearch: false,
        hasSpentTimeOnSite: false,
      };
    }

    const sessionTimeMinutes =
      sessionStartTime > 0 ? (Date.now() - sessionStartTime) / (1000 * 60) : 0;

    const hasAttemptedInteraction = ratingAttempts > 0 || followAttempts > 0;
    const hasEngagedWithSearch = searchAttempts > 0;
    const hasSpentTimeOnSite = sessionTimeMinutes >= 2; // 2 minutes minimum

    return {
      sessionTimeMinutes,
      hasAttemptedInteraction,
      hasEngagedWithSearch,
      hasSpentTimeOnSite,
    };
  }, [
    isAuthenticated,
    sessionStartTime,
    ratingAttempts,
    followAttempts,
    searchAttempts,
  ]);

  // Calculate placement configuration
  const placement = useMemo(() => {
    if (isAuthenticated) {
      return {
        showInFeed: false,
        showInVibeDetail: false,
        showInProfile: false,
        showInSearch: false,
        showOnInteraction: false,
        showInEmptyStates: false,
      };
    }

    const {
      hasAttemptedInteraction,
      hasEngagedWithSearch,
      hasSpentTimeOnSite,
    } = derivedValues;
    const hasViewedEnoughVibes = vibesViewed >= feedThreshold;

    return {
      showInFeed:
        enableFeedCta &&
        hasViewedEnoughVibes &&
        shouldShowCtaFromStore('feed-cta', 'after_vibe_views'),
      showInVibeDetail:
        enableVibeDetailCta &&
        vibesViewed >= 2 &&
        shouldShowCtaFromStore('vibe-detail-cta', 'vibe_detail'),
      showInProfile:
        enableProfileCta &&
        hasSpentTimeOnSite &&
        shouldShowCtaFromStore('profile-cta', 'social_discovery'),
      showInSearch:
        enableSearchCta &&
        hasEngagedWithSearch &&
        shouldShowCtaFromStore('search-cta', 'search_context'),
      showOnInteraction: enableInteractionGate && hasAttemptedInteraction,
      showInEmptyStates:
        enableEmptyStateCta &&
        hasSpentTimeOnSite &&
        shouldShowCtaFromStore('empty-state-cta', 'empty_state'),
    };
  }, [
    isAuthenticated,
    vibesViewed,
    feedThreshold,
    derivedValues,
    shouldShowCtaFromStore,
    enableFeedCta,
    enableVibeDetailCta,
    enableProfileCta,
    enableSearchCta,
    enableInteractionGate,
    enableEmptyStateCta,
  ]);

  // Helper functions - memoized to prevent recreating on every render
  const shouldShowFeedCta = useCallback(
    (currentVibeIndex: number) => {
      return (
        placement.showInFeed &&
        currentVibeIndex > 0 &&
        currentVibeIndex % feedThreshold === 0
      );
    },
    [placement.showInFeed, feedThreshold]
  );

  const shouldShowScrollCta = useCallback(
    (scrollPercentage: number) => {
      return placement.showInFeed && scrollPercentage >= scrollThreshold;
    },
    [placement.showInFeed, scrollThreshold]
  );

  const shouldShowInteractionGate = useCallback(
    (_interactionType: 'rating' | 'follow' | 'like') => {
      return placement.showOnInteraction && !isAuthenticated;
    },
    [placement.showOnInteraction, isAuthenticated]
  );

  const shouldShowEmptyStateCta = useCallback(
    (_context: 'no_results' | 'no_content' | 'no_following') => {
      return placement.showInEmptyStates;
    },
    [placement.showInEmptyStates]
  );

  return {
    placement,
    isAuthenticated,
    shouldShowFeedCta,
    shouldShowScrollCta,
    shouldShowInteractionGate,
    shouldShowEmptyStateCta,
    vibesViewed,
    sessionTimeMinutes: derivedValues.sessionTimeMinutes,
    hasAttemptedInteraction: derivedValues.hasAttemptedInteraction,
  };
}

// Hook for tracking anonymous interactions that should trigger CTAs
export function useAnonymousInteractionTracking() {
  const { user } = useUser();
  const addAction = useAnonymousUserStore((state) => state.addAction);

  const trackVibeView = useCallback(
    (vibeId: string) => {
      if (!user) {
        addAction({
          type: 'vibe_view',
          targetId: vibeId,
        });
      }
    },
    [user, addAction]
  );

  const trackRatingAttempt = useCallback(
    (vibeId: string) => {
      if (!user) {
        addAction({
          type: 'rating_attempt',
          targetId: vibeId,
        });
      }
    },
    [user, addAction]
  );

  const trackFollowAttempt = useCallback(
    (userId: string) => {
      if (!user) {
        addAction({
          type: 'follow_attempt',
          targetId: userId,
        });
      }
    },
    [user, addAction]
  );

  const trackSearch = useCallback(
    (query: string) => {
      if (!user) {
        addAction({
          type: 'search',
          targetId: query,
          data: { query },
        });
      }
    },
    [user, addAction]
  );

  const trackVibeLike = useCallback(
    (vibeId: string) => {
      if (!user) {
        addAction({
          type: 'vibe_like',
          targetId: vibeId,
        });
      }
    },
    [user, addAction]
  );

  return {
    trackVibeView,
    trackRatingAttempt,
    trackFollowAttempt,
    trackSearch,
    trackVibeLike,
    isAuthenticated: !!user,
  };
}
