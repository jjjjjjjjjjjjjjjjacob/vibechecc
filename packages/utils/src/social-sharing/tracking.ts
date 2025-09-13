/**
 * Share tracking and analytics utilities
 */

export type SharePlatform =
  | 'twitter'
  | 'instagram'
  | 'tiktok'
  | 'clipboard'
  | 'native';
export type ShareContentType = 'vibe' | 'profile' | 'rating';
export type ShareType = 'direct' | 'story' | 'post';

export interface ShareEvent {
  platform: SharePlatform;
  contentType: ShareContentType;
  contentId: string;
  shareType?: ShareType;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ShareMetrics {
  totalShares: number;
  sharesByPlatform: Record<SharePlatform, number>;
  sharesByContentType: Record<ShareContentType, number>;
  recentShares: ShareEvent[];
}

export interface ShareAnalytics {
  metrics: ShareMetrics;
  topSharedContent: Array<{
    contentId: string;
    contentType: ShareContentType;
    shareCount: number;
  }>;
  shareGrowth: Array<{
    date: string;
    count: number;
  }>;
}

export function trackShareEvent(event: ShareEvent): void {
  // This would integrate with your analytics provider
  // For now, just log to console in development
  if (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost'
  ) {
    // eslint-disable-next-line no-console -- Development-only logging
    console.log('Share event tracked:', event);
  }
}

export function calculateShareMetrics(events: ShareEvent[]): ShareMetrics {
  const metrics: ShareMetrics = {
    totalShares: events.length,
    sharesByPlatform: {} as Record<SharePlatform, number>,
    sharesByContentType: {} as Record<ShareContentType, number>,
    recentShares: events.slice(-10),
  };

  events.forEach((event) => {
    // Count by platform
    metrics.sharesByPlatform[event.platform] =
      (metrics.sharesByPlatform[event.platform] || 0) + 1;

    // Count by content type
    metrics.sharesByContentType[event.contentType] =
      (metrics.sharesByContentType[event.contentType] || 0) + 1;
  });

  return metrics;
}
