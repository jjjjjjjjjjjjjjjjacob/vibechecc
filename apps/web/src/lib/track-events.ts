/**
 * Project-specific event tracking helpers for PostHog.
 *
 * For standard PostHog functionality, use the native hooks directly:
 * - import { usePostHog } from 'posthog-js/react' - for capture, identify, reset, etc.
 * - import { useFeatureFlagEnabled } from 'posthog-js/react' - for feature flags
 * - import { useFeatureFlagPayload } from 'posthog-js/react' - for flag payloads
 *
 * This file only contains project-specific event definitions to ensure consistency.
 */

import posthog from 'posthog-js';

/**
 * Helper function to safely capture events only when PostHog is initialized
 */
function safeCapture(eventName: string, properties?: Record<string, any>) {
  // Only capture if PostHog is initialized and not opted out
  if (typeof window !== 'undefined' && posthog.__loaded) {
    try {
      posthog.capture(eventName, properties);
    } catch (error) {
      // Silently fail if PostHog capture fails
      console.warn('PostHog capture failed:', error);
    }
  }
}

/**
 * Centralized event tracking functions for consistency across the app.
 * These wrap safeCapture() with predefined event names and properties.
 */
export const trackEvents = {
  // User actions
  userSignedUp: (userId: string, method: string) =>
    safeCapture('user_signed_up', { method, user_id: userId }),

  userSignedIn: (userId: string, method: string) =>
    safeCapture('user_signed_in', { method, user_id: userId }),

  userSignedOut: () => safeCapture('user_signed_out'),

  // Vibe-related events
  vibeCreated: (vibeId: string, tags?: string[]) =>
    safeCapture('vibe_created', { vibe_id: vibeId, tags }),

  vibeViewed: (vibeId: string) =>
    safeCapture('vibe_viewed', { vibe_id: vibeId }),
    
  vibeCardExpanded: (data: {
    vibeId: string;
    feedType?: string;
    vibeTitle: string;
    hasImage: boolean;
    timestamp: number;
  }) =>
    safeCapture('vibe_card_expanded', {
      vibe_id: data.vibeId,
      feed_type: data.feedType,
      vibe_title: data.vibeTitle,
      has_image: data.hasImage,
      timestamp: data.timestamp,
    }),

  vibeRated: (vibeId: string, rating: number) =>
    safeCapture('vibe_rated', { vibe_id: vibeId, rating }),

  vibeReacted: (vibeId: string, emoji: string) =>
    safeCapture('vibe_reacted', { vibe_id: vibeId, emoji }),

  // Navigation
  pageViewed: (path: string, title?: string) =>
    safeCapture('page_viewed', { path, title }),

  // Search
  searchPerformed: (query: string, results_count: number) =>
    safeCapture('search_performed', { query, results_count }),

  searchFilterApplied: (
    filterType: string,
    filterValue: string | number | boolean | string[] | undefined,
    searchQuery?: string
  ) =>
    safeCapture('search_filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
      search_query: searchQuery,
    }),

  searchFilterRemoved: (
    filterType: string,
    filterValue: string | number | boolean | string[] | undefined,
    searchQuery?: string
  ) =>
    safeCapture('search_filter_removed', {
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
    safeCapture('search_result_clicked', {
      result_type: resultType,
      result_id: resultId,
      position,
      search_query: searchQuery,
    }),

  searchSortChanged: (
    sortType: 'recent' | 'rating_desc' | 'rating_asc' | 'top_rated',
    searchQuery?: string
  ) =>
    safeCapture('search_sort_changed', {
      sort_type: sortType,
      search_query: searchQuery,
    }),

  // Social interactions
  followUser: (targetUserId: string, username?: string) =>
    safeCapture('user_followed', {
      target_user_id: targetUserId,
      username,
    }),

  unfollowUser: (targetUserId: string, username?: string) =>
    safeCapture('user_unfollowed', {
      target_user_id: targetUserId,
      username,
    }),

  profileViewed: (profileUserId: string, username?: string) =>
    safeCapture('profile_viewed', {
      profile_user_id: profileUserId,
      username,
    }),

  // Notification events
  notificationClicked: (
    notificationId: string,
    notificationType: string,
    targetId?: string
  ) =>
    safeCapture('notification_clicked', {
      notification_id: notificationId,
      notification_type: notificationType,
      target_id: targetId,
    }),

  notificationMarkedAsRead: (
    notificationId: string,
    method: 'click' | 'button' | 'bulk'
  ) =>
    safeCapture('notification_marked_as_read', {
      notification_id: notificationId,
      method,
    }),

  notificationsOpened: (unreadCount: number) =>
    safeCapture('notifications_opened', { unread_count: unreadCount }),

  // UI interactions
  emojiPopoverOpened: (vibeId?: string, context?: string) =>
    safeCapture('emoji_popover_opened', { vibe_id: vibeId, context }),

  emojiPopoverClosed: (vibeId?: string, context?: string) =>
    safeCapture('emoji_popover_closed', { vibe_id: vibeId, context }),

  emojiSearched: (searchTerm: string, resultsCount: number, vibeId?: string) =>
    safeCapture('emoji_searched', {
      search_term: searchTerm,
      results_count: resultsCount,
      vibe_id: vibeId,
    }),

  modalOpened: (modalType: string, context?: Record<string, unknown>) =>
    safeCapture('modal_opened', { modal_type: modalType, ...context }),

  modalClosed: (modalType: string, context?: Record<string, unknown>) =>
    safeCapture('modal_closed', { modal_type: modalType, ...context }),

  // Errors
  errorOccurred: (error: string, context?: Record<string, unknown>) =>
    safeCapture('error_occurred', { error, ...context }),

  // Survey events
  surveyTriggered: (
    surveyType: string,
    userId: string,
    context?: Record<string, unknown>
  ) =>
    safeCapture('survey_triggered', {
      survey_type: surveyType,
      user_id: userId,
      ...context,
    }),

  surveyShown: (surveyId: string, userId: string, method: string) =>
    safeCapture('survey_shown', {
      survey_id: surveyId,
      user_id: userId,
      show_method: method,
    }),

  surveyCompleted: (
    surveyType: string,
    userId: string,
    responses: Record<string, unknown>
  ) =>
    safeCapture('survey_completed', {
      survey_type: surveyType,
      user_id: userId,
      responses,
    }),

  surveyDismissed: (surveyType: string, userId: string, reason: string) =>
    safeCapture('survey_dismissed', {
      survey_type: surveyType,
      user_id: userId,
      dismissal_reason: reason,
    }),

  userDiscoveryChannel: (
    channel: string,
    interest: string,
    experience: string
  ) =>
    safeCapture('user_discovery_channel', {
      channel,
      interest,
      experience,
    }),

  // A/B Testing & Experiments
  experimentExposed: (
    experimentKey: string,
    variantId: string,
    variantName: string
  ) =>
    safeCapture('experiment_exposed', {
      experiment_key: experimentKey,
      variant_id: variantId,
      variant_name: variantName,
    }),

  experimentConversion: (
    experimentKey: string,
    variantId: string,
    conversionGoal: string,
    value?: number,
    properties?: Record<string, unknown>
  ) =>
    safeCapture('experiment_conversion', {
      experiment_key: experimentKey,
      variant_id: variantId,
      conversion_goal: conversionGoal,
      value,
      ...properties,
    }),

  experimentAction: (
    experimentKey: string,
    variantId: string,
    action: string,
    properties?: Record<string, unknown>
  ) =>
    safeCapture('experiment_action', {
      experiment_key: experimentKey,
      variant_id: variantId,
      action,
      ...properties,
    }),

  // Feature Rollouts
  featureRolloutExposed: (
    featureKey: string,
    isEnabled: boolean,
    payload?: unknown
  ) =>
    safeCapture('feature_rollout_exposed', {
      feature_key: featureKey,
      is_enabled: isEnabled,
      payload,
    }),

  featureRolloutAction: (
    featureKey: string,
    action: string,
    properties?: Record<string, unknown>
  ) =>
    safeCapture('feature_rollout_action', {
      feature_key: featureKey,
      action,
      ...properties,
    }),

  // Performance Tracking
  placeholderPerformance: (
    componentName: string,
    metricType: 'render' | 'visibility' | 'interaction',
    value: number,
    properties?: Record<string, unknown>
  ) =>
    safeCapture('placeholder_performance', {
      component_name: componentName,
      metric_type: metricType,
      value,
      ...properties,
    }),

  loadingStateChanged: (
    stateName: string,
    transition: 'started' | 'completed',
    duration?: number,
    properties?: Record<string, unknown>
  ) =>
    safeCapture('loading_state_changed', {
      state_name: stateName,
      transition,
      duration,
      ...properties,
    }),

  componentPerformance: (
    componentName: string,
    eventType: 'mount' | 'unmount' | 'rerender' | 'prop_change',
    value?: number,
    properties?: Record<string, unknown>
  ) =>
    safeCapture('component_performance', {
      component_name: componentName,
      event_type: eventType,
      value,
      ...properties,
    }),

  timeToInteractive: (componentName: string, timeMs: number) =>
    safeCapture('time_to_interactive', {
      component_name: componentName,
      time_ms: timeMs,
    }),

  firstInteraction: (
    componentName: string,
    interactionType: string,
    timeMs: number,
    properties?: Record<string, unknown>
  ) =>
    safeCapture('first_interaction', {
      component_name: componentName,
      interaction_type: interactionType,
      time_ms: timeMs,
      ...properties,
    }),

  // Engagement & Funnel Analytics
  funnelStepCompleted: (
    funnelName: string,
    stepName: string,
    stepNumber: number,
    userId?: string,
    properties?: Record<string, unknown>
  ) =>
    safeCapture('funnel_step_completed', {
      funnel_name: funnelName,
      step_name: stepName,
      step_number: stepNumber,
      user_id: userId,
      ...properties,
    }),

  funnelDropoff: (
    funnelName: string,
    dropoffStep: string,
    stepNumber: number,
    reason?: string,
    properties?: Record<string, unknown>
  ) =>
    safeCapture('funnel_dropoff', {
      funnel_name: funnelName,
      dropoff_step: dropoffStep,
      step_number: stepNumber,
      reason,
      ...properties,
    }),

  userJourneyStarted: (
    journeyType: string,
    entryPoint: string,
    userId?: string
  ) =>
    safeCapture('user_journey_started', {
      journey_type: journeyType,
      entry_point: entryPoint,
      user_id: userId,
    }),

  userJourneyCompleted: (
    journeyType: string,
    completionTime: number,
    stepsCompleted: number,
    userId?: string
  ) =>
    safeCapture('user_journey_completed', {
      journey_type: journeyType,
      completion_time: completionTime,
      steps_completed: stepsCompleted,
      user_id: userId,
    }),

  // Social Sharing & Viral Metrics
  shareAttempted: (
    contentType: 'vibe' | 'rating' | 'profile',
    contentId: string,
    platform: string,
    method: 'native' | 'manual' | 'copy_link'
  ) =>
    safeCapture('share_attempted', {
      content_type: contentType,
      content_id: contentId,
      platform,
      method,
    }),

  shareCompleted: (
    contentType: 'vibe' | 'rating' | 'profile',
    contentId: string,
    platform: string,
    method: 'native' | 'manual' | 'copy_link'
  ) =>
    safeCapture('share_completed', {
      content_type: contentType,
      content_id: contentId,
      platform,
      method,
    }),

  shareClickback: (
    contentType: 'vibe' | 'rating' | 'profile',
    contentId: string,
    platform: string,
    referrerUserId?: string
  ) =>
    safeCapture('share_clickback', {
      content_type: contentType,
      content_id: contentId,
      platform,
      referrer_user_id: referrerUserId,
    }),

  viralCoefficientCalculated: (
    period: 'daily' | 'weekly' | 'monthly',
    coefficient: number,
    invites_sent: number,
    conversions: number
  ) =>
    safeCapture('viral_coefficient_calculated', {
      period,
      coefficient,
      invites_sent,
      conversions,
    }),

  // Engagement Rate Tracking
  engagementSessionStarted: (
    sessionType: 'browse' | 'create' | 'rate' | 'social',
    entryPoint: string
  ) =>
    safeCapture('engagement_session_started', {
      session_type: sessionType,
      entry_point: entryPoint,
    }),

  engagementSessionEnded: (
    sessionType: 'browse' | 'create' | 'rate' | 'social',
    duration: number,
    actionsCompleted: number,
    exitPoint?: string
  ) =>
    safeCapture('engagement_session_ended', {
      session_type: sessionType,
      duration,
      actions_completed: actionsCompleted,
      exit_point: exitPoint,
    }),

  ratingEngagementAnalyzed: (
    period: 'daily' | 'weekly' | 'monthly',
    total_ratings: number,
    unique_raters: number,
    average_rating: number,
    engagement_rate: number
  ) =>
    safeCapture('rating_engagement_analyzed', {
      period,
      total_ratings,
      unique_raters,
      average_rating,
      engagement_rate,
    }),

  // Cohort Analysis Events
  cohortUserAdded: (
    cohortName: string,
    userId: string,
    cohortDate: string,
    userProperties?: Record<string, unknown>
  ) =>
    safeCapture('cohort_user_added', {
      cohort_name: cohortName,
      user_id: userId,
      cohort_date: cohortDate,
      ...userProperties,
    }),

  cohortRetentionTracked: (
    cohortName: string,
    period: number,
    retention_rate: number,
    active_users: number,
    total_users: number
  ) =>
    safeCapture('cohort_retention_tracked', {
      cohort_name: cohortName,
      period,
      retention_rate,
      active_users,
      total_users,
    }),
} as const;
