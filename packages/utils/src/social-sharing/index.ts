/**
 * Social sharing utilities for vibechecc
 *
 * This module provides comprehensive social media sharing functionality including:
 * - URL generation with UTM tracking
 * - Platform-specific URL builders
 * - Content formatters for different platforms
 * - Share event tracking and analytics
 */

// URL generation utilities
export * from './url-generation';

// Platform-specific builders
export * from './platform-builders';

// Content formatters
export * from './content-formatters';

// Tracking and analytics
export * from './tracking';

// Re-export key types for convenience
export type {
  TwitterShareOptions,
  InstagramShareOptions,
  TikTokShareOptions,
  ClipboardShareData,
} from './platform-builders';

export type { ShareUrlOptions, UtmParams } from './url-generation';

export type {
  VibeShareContent,
  ProfileShareContent,
  FormattedShareContent,
} from './content-formatters';

export type {
  ShareEvent,
  ShareMetrics,
  ShareAnalytics,
  SharePlatform,
  ShareType,
  ShareContentType,
} from './tracking';
