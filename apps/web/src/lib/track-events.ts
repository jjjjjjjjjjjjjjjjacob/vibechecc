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
 * Centralized event tracking functions for consistency across the app.
 * These wrap posthog.capture() with predefined event names and properties.
 */
export const trackEvents = {
  // User actions
  userSignedUp: (userId: string, method: string) =>
    posthog.capture('user_signed_up', { method, user_id: userId }),

  userSignedIn: (userId: string, method: string) =>
    posthog.capture('user_signed_in', { method, user_id: userId }),

  userSignedOut: () => posthog.capture('user_signed_out'),

  // Vibe-related events
  vibeCreated: (vibeId: string, tags?: string[]) =>
    posthog.capture('vibe_created', { vibe_id: vibeId, tags }),

  vibeViewed: (vibeId: string) =>
    posthog.capture('vibe_viewed', { vibe_id: vibeId }),

  vibeRated: (vibeId: string, rating: number) =>
    posthog.capture('vibe_rated', { vibe_id: vibeId, rating }),

  vibeReacted: (vibeId: string, emoji: string) =>
    posthog.capture('vibe_reacted', { vibe_id: vibeId, emoji }),

  // Navigation
  pageViewed: (path: string, title?: string) =>
    posthog.capture('page_viewed', { path, title }),

  // Search
  searchPerformed: (query: string, results_count: number) =>
    posthog.capture('search_performed', { query, results_count }),

  searchFilterApplied: (
    filterType: string,
    filterValue: string | number | boolean | string[] | undefined,
    searchQuery?: string
  ) =>
    posthog.capture('search_filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
      search_query: searchQuery,
    }),

  searchFilterRemoved: (
    filterType: string,
    filterValue: string | number | boolean | string[] | undefined,
    searchQuery?: string
  ) =>
    posthog.capture('search_filter_removed', {
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
    posthog.capture('search_result_clicked', {
      result_type: resultType,
      result_id: resultId,
      position,
      search_query: searchQuery,
    }),

  searchSortChanged: (
    sortType: 'recent' | 'rating_desc' | 'rating_asc' | 'top_rated',
    searchQuery?: string
  ) =>
    posthog.capture('search_sort_changed', {
      sort_type: sortType,
      search_query: searchQuery,
    }),

  // Social interactions
  followUser: (targetUserId: string, username?: string) =>
    posthog.capture('user_followed', {
      target_user_id: targetUserId,
      username,
    }),

  unfollowUser: (targetUserId: string, username?: string) =>
    posthog.capture('user_unfollowed', {
      target_user_id: targetUserId,
      username,
    }),

  profileViewed: (profileUserId: string, username?: string) =>
    posthog.capture('profile_viewed', {
      profile_user_id: profileUserId,
      username,
    }),

  // Notification events
  notificationClicked: (
    notificationId: string,
    notificationType: string,
    targetId?: string
  ) =>
    posthog.capture('notification_clicked', {
      notification_id: notificationId,
      notification_type: notificationType,
      target_id: targetId,
    }),

  notificationMarkedAsRead: (
    notificationId: string,
    method: 'click' | 'button' | 'bulk'
  ) =>
    posthog.capture('notification_marked_as_read', {
      notification_id: notificationId,
      method,
    }),

  notificationsOpened: (unreadCount: number) =>
    posthog.capture('notifications_opened', { unread_count: unreadCount }),

  // UI interactions
  emojiPopoverOpened: (vibeId?: string, context?: string) =>
    posthog.capture('emoji_popover_opened', { vibe_id: vibeId, context }),

  emojiPopoverClosed: (vibeId?: string, context?: string) =>
    posthog.capture('emoji_popover_closed', { vibe_id: vibeId, context }),

  emojiSearched: (searchTerm: string, resultsCount: number, vibeId?: string) =>
    posthog.capture('emoji_searched', {
      search_term: searchTerm,
      results_count: resultsCount,
      vibe_id: vibeId,
    }),

  modalOpened: (modalType: string, context?: Record<string, unknown>) =>
    posthog.capture('modal_opened', { modal_type: modalType, ...context }),

  modalClosed: (modalType: string, context?: Record<string, unknown>) =>
    posthog.capture('modal_closed', { modal_type: modalType, ...context }),

  // Errors
  errorOccurred: (error: string, context?: Record<string, unknown>) =>
    posthog.capture('error_occurred', { error, ...context }),

  // Survey events
  surveyTriggered: (
    surveyType: string,
    userId: string,
    context?: Record<string, unknown>
  ) =>
    posthog.capture('survey_triggered', {
      survey_type: surveyType,
      user_id: userId,
      ...context,
    }),

  surveyShown: (surveyId: string, userId: string, method: string) =>
    posthog.capture('survey_shown', {
      survey_id: surveyId,
      user_id: userId,
      show_method: method,
    }),

  surveyCompleted: (
    surveyType: string,
    userId: string,
    responses: Record<string, unknown>
  ) =>
    posthog.capture('survey_completed', {
      survey_type: surveyType,
      user_id: userId,
      responses,
    }),

  surveyDismissed: (surveyType: string, userId: string, reason: string) =>
    posthog.capture('survey_dismissed', {
      survey_type: surveyType,
      user_id: userId,
      dismissal_reason: reason,
    }),

  userDiscoveryChannel: (
    channel: string,
    interest: string,
    experience: string
  ) =>
    posthog.capture('user_discovery_channel', {
      channel,
      interest,
      experience,
    }),
} as const;
