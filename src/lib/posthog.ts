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

  // Errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorOccurred: (error: string, context?: Record<string, any>) =>
    analytics.capture('error_occurred', { error, ...context }),
} as const;
