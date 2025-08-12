import posthog from 'posthog-js';

export interface PostHogConfig {
  apiKey: string;
  apiHost: string;
  projectId: string;
  region: string;
}

class PostHogService {
  private initialized = false;
  private config: PostHogConfig | null = null;

  init(config: PostHogConfig) {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    this.config = config;

    posthog.init(config.apiKey, {
      api_host: config.apiHost,
      person_profiles: 'identified_only',
      capture_pageview: false, // We'll handle page views manually
      capture_pageleave: true,
      loaded: (_posthog) => {
        if (process.env.NODE_ENV === 'development') {
          // console.log('PostHog loaded successfully');
        }
      },
    });

    this.initialized = true;
  }

  // Page tracking
  capturePageView(path?: string) {
    if (!this.initialized) return;
    posthog.capture('$pageview', {
      $current_url: path || window.location.href,
    });
  }

  // User identification
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identify(userId: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    posthog.identify(userId, properties);
  }

  // Event tracking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  capture(event: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    posthog.capture(event, properties);
  }

  // User properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPersonProperties(properties: Record<string, any>) {
    if (!this.initialized) return;
    posthog.setPersonProperties(properties);
  }

  // Reset user (logout)
  reset() {
    if (!this.initialized) return;
    posthog.reset();
  }

  // Feature flags
  isFeatureEnabled(flag: string): boolean {
    if (!this.initialized) return false;
    return posthog.isFeatureEnabled(flag) ?? false;
  }

  getFeatureFlag(flag: string): string | boolean | undefined {
    if (!this.initialized) return undefined;
    return posthog.getFeatureFlag(flag);
  }

  // Get the PostHog instance for advanced usage
  getInstance() {
    return posthog;
  }

  isInitialized() {
    return this.initialized;
  }
}

// Export a singleton instance
export const analytics = new PostHogService();

// Utility functions for common tracking events
export const trackEvents = {
  // User actions
  userSignedUp: (userId: string, method: string) =>
    analytics.capture('user_signed_up', { method, user_id: userId }),

  userSignedIn: (userId: string, method: string) =>
    analytics.capture('user_signed_in', { method, user_id: userId }),

  userSignedOut: () => analytics.capture('user_signed_out'),

  // Vibe-related events
  vibeCreated: (vibeId: string, tags?: string[]) =>
    analytics.capture('vibe_created', { vibe_id: vibeId, tags }),

  vibeViewed: (vibeId: string) =>
    analytics.capture('vibe_viewed', { vibe_id: vibeId }),

  vibeRated: (vibeId: string, rating: number) =>
    analytics.capture('vibe_rated', { vibe_id: vibeId, rating }),

  vibeReacted: (vibeId: string, emoji: string) =>
    analytics.capture('vibe_reacted', { vibe_id: vibeId, emoji }),

  // Navigation
  pageViewed: (path: string, title?: string) =>
    analytics.capture('page_viewed', { path, title }),

  // Search
  searchPerformed: (query: string, results_count: number) =>
    analytics.capture('search_performed', { query, results_count }),

  searchFilterApplied: (
    filterType: string,
    filterValue: any,
    searchQuery?: string
  ) =>
    analytics.capture('search_filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
      search_query: searchQuery,
    }),

  searchFilterRemoved: (
    filterType: string,
    filterValue: any,
    searchQuery?: string
  ) =>
    analytics.capture('search_filter_removed', {
      filter_type: filterType,
      filter_value: filterValue,
      search_query: searchQuery,
    }),

  searchResultClicked: (
    resultType: 'vibe' | 'user' | 'tag',
    resultId: string,
    position: number,
    searchQuery?: string
  ) =>
    analytics.capture('search_result_clicked', {
      result_type: resultType,
      result_id: resultId,
      position,
      search_query: searchQuery,
    }),

  searchSortChanged: (
    sortType: 'recent' | 'rating_desc' | 'rating_asc' | 'top_rated',
    searchQuery?: string
  ) =>
    analytics.capture('search_sort_changed', {
      sort_type: sortType,
      search_query: searchQuery,
    }),

  // Social interactions
  followUser: (targetUserId: string, username?: string) =>
    analytics.capture('user_followed', {
      target_user_id: targetUserId,
      username,
    }),

  unfollowUser: (targetUserId: string, username?: string) =>
    analytics.capture('user_unfollowed', {
      target_user_id: targetUserId,
      username,
    }),

  profileViewed: (profileUserId: string, username?: string) =>
    analytics.capture('profile_viewed', {
      profile_user_id: profileUserId,
      username,
    }),

  // Notification events
  notificationClicked: (
    notificationId: string,
    notificationType: string,
    targetId?: string
  ) =>
    analytics.capture('notification_clicked', {
      notification_id: notificationId,
      notification_type: notificationType,
      target_id: targetId,
    }),

  notificationMarkedAsRead: (
    notificationId: string,
    method: 'click' | 'button' | 'bulk'
  ) =>
    analytics.capture('notification_marked_as_read', {
      notification_id: notificationId,
      method,
    }),

  notificationsOpened: (unreadCount: number) =>
    analytics.capture('notifications_opened', { unread_count: unreadCount }),

  // UI interactions
  emojiPopoverOpened: (vibeId?: string, context?: string) =>
    analytics.capture('emoji_popover_opened', { vibe_id: vibeId, context }),

  emojiPopoverClosed: (vibeId?: string, context?: string) =>
    analytics.capture('emoji_popover_closed', { vibe_id: vibeId, context }),

  emojiSearched: (searchTerm: string, resultsCount: number, vibeId?: string) =>
    analytics.capture('emoji_searched', {
      search_term: searchTerm,
      results_count: resultsCount,
      vibe_id: vibeId,
    }),

  modalOpened: (modalType: string, context?: Record<string, any>) =>
    analytics.capture('modal_opened', { modal_type: modalType, ...context }),

  modalClosed: (modalType: string, context?: Record<string, any>) =>
    analytics.capture('modal_closed', { modal_type: modalType, ...context }),

  // Errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorOccurred: (error: string, context?: Record<string, any>) =>
    analytics.capture('error_occurred', { error, ...context }),

  // Survey events
  surveyTriggered: (
    surveyType: string,
    userId: string,
    context?: Record<string, any>
  ) =>
    analytics.capture('survey_triggered', {
      survey_type: surveyType,
      user_id: userId,
      ...context,
    }),

  surveyShown: (surveyId: string, userId: string, method: string) =>
    analytics.capture('survey_shown', {
      survey_id: surveyId,
      user_id: userId,
      show_method: method,
    }),

  surveyCompleted: (
    surveyType: string,
    userId: string,
    responses: Record<string, any>
  ) =>
    analytics.capture('survey_completed', {
      survey_type: surveyType,
      user_id: userId,
      responses,
    }),

  surveyDismissed: (surveyType: string, userId: string, reason: string) =>
    analytics.capture('survey_dismissed', {
      survey_type: surveyType,
      user_id: userId,
      dismissal_reason: reason,
    }),

  userDiscoveryChannel: (
    channel: string,
    interest: string,
    experience: string
  ) =>
    analytics.capture('user_discovery_channel', {
      channel,
      interest,
      experience,
    }),
} as const;
