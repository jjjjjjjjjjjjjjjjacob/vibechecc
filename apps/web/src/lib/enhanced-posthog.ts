import posthog from 'posthog-js';
import { analytics, PostHogConfig } from './posthog';

// Enhanced analytics service with comprehensive event tracking
class EnhancedPostHogService {
  private baseService = analytics;

  // Initialize with the base service
  init(config: PostHogConfig) {
    this.baseService.init(config);
  }

  // Enhanced capture with automatic context enrichment
  captureWithContext(event: string, properties?: Record<string, any>) {
    if (!this.baseService.isInitialized()) return;

    const enrichedProperties = {
      ...properties,
      timestamp: Date.now(),
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_title: typeof document !== 'undefined' ? document.title : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      screen_resolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : undefined,
      viewport_size: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
      connection_type: this.getConnectionType(),
      device_type: this.getDeviceType(),
      browser: this.getBrowser(),
    };
    
    this.baseService.capture(event, enrichedProperties);
  }

  // Performance tracking
  trackPerformance(name: string, timing: PerformanceTiming | number, context?: Record<string, any>) {
    if (!this.baseService.isInitialized()) return;

    let performanceData: Record<string, any>;
    
    if (typeof timing === 'number') {
      performanceData = {
        metric_name: name,
        value: timing,
        ...context,
      };
    } else {
      performanceData = {
        metric_name: name,
        load_time: timing.loadEventEnd - timing.navigationStart,
        dns_time: timing.domainLookupEnd - timing.domainLookupStart,
        server_time: timing.responseEnd - timing.requestStart,
        render_time: timing.domContentLoadedEventEnd - timing.responseEnd,
        ...context,
      };
    }

    this.captureWithContext('perf_metric', performanceData);
  }

  // Error tracking with enhanced context
  trackError(error: Error | string, context?: Record<string, any>) {
    if (!this.baseService.isInitialized()) return;

    const errorData = typeof error === 'string' 
      ? { error_message: error }
      : {
          error_name: error.name,
          error_message: error.message,
          error_stack: error.stack,
        };

    this.captureWithContext('error_occurred', {
      ...errorData,
      ...context,
    });
  }

  // User engagement tracking
  trackEngagement(action: string, target: string, context?: Record<string, any>) {
    this.captureWithContext(`engagement_${action}`, {
      target_type: target,
      ...context,
    });
  }

  // Funnel step tracking
  trackFunnelStep(funnel: string, step: string, success: boolean, context?: Record<string, any>) {
    this.captureWithContext(`funnel_${funnel}_${step}`, {
      success,
      funnel_name: funnel,
      step_name: step,
      ...context,
    });
  }

  // Session tracking
  trackSessionStart() {
    this.captureWithContext('session_started', {
      session_id: this.generateSessionId(),
    });
  }

  trackSessionEnd(duration: number) {
    this.captureWithContext('session_ended', {
      session_duration: duration,
    });
  }

  // Private helper methods
  private getConnectionType(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    // @ts-ignore - connection API may not be available
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  private getDeviceType(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const userAgent = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private getBrowser(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    if (userAgent.includes('Opera')) return 'opera';
    return 'other';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Delegate other methods to base service
  identify(userId: string, properties?: Record<string, any>) {
    return this.baseService.identify(userId, properties);
  }

  setPersonProperties(properties: Record<string, any>) {
    return this.baseService.setPersonProperties(properties);
  }

  reset() {
    return this.baseService.reset();
  }

  isFeatureEnabled(flag: string): boolean {
    return this.baseService.isFeatureEnabled(flag);
  }

  getFeatureFlag(flag: string): string | boolean | undefined {
    return this.baseService.getFeatureFlag(flag);
  }

  isInitialized(): boolean {
    return this.baseService.isInitialized();
  }

  getInstance() {
    return this.baseService.getInstance();
  }
}

// Export enhanced singleton
export const enhancedAnalytics = new EnhancedPostHogService();

// Comprehensive event tracking with proper naming conventions
export const enhancedTrackEvents = {
  // Authentication events
  auth_signup_completed: (userId: string, method: string, onboardingStep?: string) =>
    enhancedAnalytics.captureWithContext('auth_signup_completed', { 
      user_id: userId, 
      method, 
      onboarding_step: onboardingStep 
    }),

  auth_signin_completed: (userId: string, method: string) =>
    enhancedAnalytics.captureWithContext('auth_signin_completed', { 
      user_id: userId, 
      method 
    }),

  auth_signout_completed: (userId: string) =>
    enhancedAnalytics.captureWithContext('auth_signout_completed', { 
      user_id: userId 
    }),

  auth_account_deleted: (userId: string, reason?: string) =>
    enhancedAnalytics.captureWithContext('auth_account_deleted', { 
      user_id: userId, 
      reason 
    }),

  // Profile events
  profile_updated: (userId: string, fields: string[], changes?: Record<string, any>) =>
    enhancedAnalytics.captureWithContext('profile_updated', { 
      user_id: userId, 
      updated_fields: fields,
      field_count: fields.length,
      ...changes
    }),

  profile_avatar_changed: (userId: string, uploadMethod: string, fileSize?: number) =>
    enhancedAnalytics.captureWithContext('profile_avatar_changed', { 
      user_id: userId, 
      upload_method: uploadMethod,
      file_size: fileSize
    }),

  profile_theme_changed: (userId: string, primaryColor: string, secondaryColor: string) =>
    enhancedAnalytics.captureWithContext('profile_theme_changed', { 
      user_id: userId, 
      primary_color: primaryColor,
      secondary_color: secondaryColor
    }),

  profile_bio_updated: (userId: string, bioLength: number, previousLength?: number) =>
    enhancedAnalytics.captureWithContext('profile_bio_updated', { 
      user_id: userId, 
      bio_length: bioLength,
      previous_length: previousLength,
      length_change: previousLength ? bioLength - previousLength : undefined
    }),

  profile_socials_updated: (userId: string, platforms: string[], action: 'added' | 'removed' | 'updated') =>
    enhancedAnalytics.captureWithContext('profile_socials_updated', { 
      user_id: userId, 
      platforms,
      platform_count: platforms.length,
      action
    }),

  // Content creation events
  content_vibe_created: (vibeId: string, userId: string, tags: string[], hasImage: boolean, contentLength: number) =>
    enhancedAnalytics.captureWithContext('content_vibe_created', { 
      vibe_id: vibeId,
      user_id: userId,
      tags,
      tag_count: tags.length,
      has_image: hasImage,
      content_length: contentLength
    }),

  content_vibe_edited: (vibeId: string, userId: string, changedFields: string[], timeSinceCreation?: number) =>
    enhancedAnalytics.captureWithContext('content_vibe_edited', { 
      vibe_id: vibeId,
      user_id: userId,
      changed_fields: changedFields,
      field_count: changedFields.length,
      time_since_creation: timeSinceCreation
    }),

  content_vibe_deleted: (vibeId: string, userId: string, reason?: string, timeSinceCreation?: number) =>
    enhancedAnalytics.captureWithContext('content_vibe_deleted', { 
      vibe_id: vibeId,
      user_id: userId,
      reason,
      time_since_creation: timeSinceCreation
    }),

  content_image_uploaded: (uploadMethod: string, fileSize: number, dimensions?: string, uploadTime?: number) =>
    enhancedAnalytics.captureWithContext('content_image_uploaded', { 
      upload_method: uploadMethod,
      file_size: fileSize,
      dimensions,
      upload_time: uploadTime
    }),

  // Engagement events
  engagement_vibe_viewed: (vibeId: string, userId?: string, viewDuration?: number, scrollDepth?: number, source?: string) =>
    enhancedAnalytics.captureWithContext('engagement_vibe_viewed', { 
      vibe_id: vibeId,
      user_id: userId,
      view_duration: viewDuration,
      scroll_depth: scrollDepth,
      source
    }),

  engagement_vibe_rated: (vibeId: string, userId: string, rating: number, emoji: string, hasReview: boolean, reviewLength?: number) =>
    enhancedAnalytics.captureWithContext('engagement_vibe_rated', { 
      vibe_id: vibeId,
      user_id: userId,
      rating,
      emoji,
      has_review: hasReview,
      review_length: reviewLength
    }),

  engagement_emoji_selected: (vibeId: string, userId: string, emoji: string, sentiment: string, selectionTime?: number) =>
    enhancedAnalytics.captureWithContext('engagement_emoji_selected', { 
      vibe_id: vibeId,
      user_id: userId,
      emoji,
      sentiment,
      selection_time: selectionTime
    }),

  engagement_follow_user: (followerId: string, followedUserId: string, source: string) =>
    enhancedAnalytics.captureWithContext('engagement_follow_user', { 
      follower_id: followerId,
      followed_user_id: followedUserId,
      source
    }),

  engagement_unfollow_user: (followerId: string, unfollowedUserId: string, followDuration?: number) =>
    enhancedAnalytics.captureWithContext('engagement_unfollow_user', { 
      follower_id: followerId,
      unfollowed_user_id: unfollowedUserId,
      follow_duration: followDuration
    }),

  engagement_profile_visited: (visitorId: string | null, profileUserId: string, source: string, visitDuration?: number) =>
    enhancedAnalytics.captureWithContext('engagement_profile_visited', { 
      visitor_id: visitorId,
      profile_user_id: profileUserId,
      source,
      visit_duration: visitDuration
    }),

  // Search & discovery events
  search_query_performed: (query: string, filters: Record<string, any>, resultCount: number, responseTime: number, userId?: string) =>
    enhancedAnalytics.captureWithContext('search_query_performed', { 
      query,
      query_length: query.length,
      filters,
      filter_count: Object.keys(filters).length,
      result_count: resultCount,
      response_time: responseTime,
      user_id: userId
    }),

  search_result_clicked: (query: string, resultId: string, resultType: string, position: number, userId?: string) =>
    enhancedAnalytics.captureWithContext('search_result_clicked', { 
      query,
      result_id: resultId,
      result_type: resultType,
      position,
      user_id: userId
    }),

  search_filter_applied: (filterType: string, filterValue: any, resultCount: number, userId?: string) =>
    enhancedAnalytics.captureWithContext('search_filter_applied', { 
      filter_type: filterType,
      filter_value: filterValue,
      result_count: resultCount,
      user_id: userId
    }),

  search_suggestion_selected: (suggestion: string, source: string, position: number, userId?: string) =>
    enhancedAnalytics.captureWithContext('search_suggestion_selected', { 
      suggestion,
      source,
      position,
      user_id: userId
    }),

  // Navigation events
  navigation_page_viewed: (path: string, referrer?: string, loadTime?: number, userId?: string) =>
    enhancedAnalytics.captureWithContext('navigation_page_viewed', { 
      path,
      referrer,
      load_time: loadTime,
      user_id: userId
    }),

  navigation_external_link_clicked: (url: string, source: string, userId?: string) =>
    enhancedAnalytics.captureWithContext('navigation_external_link_clicked', { 
      url,
      source,
      user_id: userId
    }),

  navigation_internal_link_clicked: (to: string, from: string, userId?: string) =>
    enhancedAnalytics.captureWithContext('navigation_internal_link_clicked', { 
      to,
      from,
      user_id: userId
    }),

  // UI interaction events
  ui_modal_opened: (modalType: string, trigger: string, userId?: string) =>
    enhancedAnalytics.captureWithContext('ui_modal_opened', { 
      modal_type: modalType,
      trigger,
      user_id: userId
    }),

  ui_modal_closed: (modalType: string, action: string, duration?: number, userId?: string) =>
    enhancedAnalytics.captureWithContext('ui_modal_closed', { 
      modal_type: modalType,
      action,
      duration,
      user_id: userId
    }),

  ui_filter_toggled: (filterType: string, isActive: boolean, context: string, userId?: string) =>
    enhancedAnalytics.captureWithContext('ui_filter_toggled', { 
      filter_type: filterType,
      is_active: isActive,
      context,
      user_id: userId
    }),

  ui_theme_toggled: (newTheme: string, previousTheme?: string, userId?: string) =>
    enhancedAnalytics.captureWithContext('ui_theme_toggled', { 
      new_theme: newTheme,
      previous_theme: previousTheme,
      user_id: userId
    }),

  ui_sort_changed: (sortType: string, context: string, previousSort?: string, userId?: string) =>
    enhancedAnalytics.captureWithContext('ui_sort_changed', { 
      sort_type: sortType,
      context,
      previous_sort: previousSort,
      user_id: userId
    }),

  // Error events
  error_api_failed: (endpoint: string, errorCode: string, errorMessage: string, context?: Record<string, any>) =>
    enhancedAnalytics.trackError(new Error(errorMessage), {
      error_type: 'api_error',
      endpoint,
      error_code: errorCode,
      ...context
    }),

  error_upload_failed: (fileType: string, fileSize: number, errorMessage: string, uploadMethod?: string) =>
    enhancedAnalytics.trackError(new Error(errorMessage), {
      error_type: 'upload_error',
      file_type: fileType,
      file_size: fileSize,
      upload_method: uploadMethod
    }),

  error_auth_failed: (method: string, errorType: string, errorMessage: string) =>
    enhancedAnalytics.trackError(new Error(errorMessage), {
      error_type: 'auth_error',
      auth_method: method,
      auth_error_type: errorType
    }),

  // Performance events
  perf_page_load_completed: (path: string, loadTime: number, metrics?: Record<string, any>) =>
    enhancedAnalytics.trackPerformance('page_load', loadTime, {
      path,
      ...metrics
    }),

  perf_image_load_completed: (imageId: string, loadTime: number, size: number, format?: string) =>
    enhancedAnalytics.trackPerformance('image_load', loadTime, {
      image_id: imageId,
      image_size: size,
      image_format: format
    }),

  perf_search_completed: (query: string, responseTime: number, resultCount: number) =>
    enhancedAnalytics.trackPerformance('search_response', responseTime, {
      query,
      result_count: resultCount
    }),

  perf_api_call_completed: (endpoint: string, responseTime: number, success: boolean, cacheHit?: boolean) =>
    enhancedAnalytics.trackPerformance('api_call', responseTime, {
      endpoint,
      success,
      cache_hit: cacheHit
    }),
};

// User property helpers
export const userPropertyHelpers = {
  setOnboardingStep: (step: string) =>
    enhancedAnalytics.setPersonProperties({ onboarding_step: step }),

  setInterestsCount: (count: number) =>
    enhancedAnalytics.setPersonProperties({ interests_count: count }),

  setThemeColors: (primaryColor: string, secondaryColor: string) =>
    enhancedAnalytics.setPersonProperties({ 
      theme_primary_color: primaryColor,
      theme_secondary_color: secondaryColor 
    }),

  setEngagementMetrics: (vibesCount: number, ratingsCount: number, followsCount: number) =>
    enhancedAnalytics.setPersonProperties({
      vibes_created_count: vibesCount,
      ratings_given_count: ratingsCount,
      follows_count: followsCount
    }),

  setSessionData: (sessionCount: number, avgDuration: number) =>
    enhancedAnalytics.setPersonProperties({
      sessions_count: sessionCount,
      avg_session_duration: avgDuration,
      last_active_date: new Date().toISOString()
    }),
};