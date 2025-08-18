/**
 * Share tracking utilities for analytics and event tracking
 */

export type SharePlatform =
  | 'twitter'
  | 'instagram'
  | 'tiktok'
  | 'clipboard'
  | 'native';
export type ShareType = 'story' | 'feed' | 'direct' | 'copy';
export type ShareContentType = 'vibe' | 'profile';

export interface ShareEvent {
  // Core event data
  contentType: ShareContentType;
  contentId: string;
  platform: SharePlatform;
  shareType: ShareType;

  // User context
  userId?: string;

  // Tracking data
  timestamp: number;
  sessionId?: string;
  referrer?: string;

  // UTM and campaign tracking
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  // Additional metadata
  metadata?: Record<string, unknown>;
}

export interface ShareMetrics {
  totalShares: number;
  platformBreakdown: Record<SharePlatform, number>;
  shareTypeBreakdown: Record<ShareType, number>;
  recentShares: ShareEvent[];
  popularContent: Array<{
    contentId: string;
    contentType: ShareContentType;
    shareCount: number;
  }>;
}

export interface ShareAnalytics {
  shareClicks: number;
  shareCompletions: number;
  conversionRate: number; // completions / clicks
  platformPerformance: Record<
    SharePlatform,
    {
      clicks: number;
      completions: number;
      conversionRate: number;
    }
  >;
}

/**
 * Generates a unique session ID for tracking user sessions
 * @returns Unique session identifier
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a share event object with proper tracking data
 * @param params - Share event parameters
 * @returns Complete share event object
 */
export function createShareEvent(params: {
  contentType: ShareContentType;
  contentId: string;
  platform: SharePlatform;
  shareType?: ShareType;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}): ShareEvent {
  const {
    contentType,
    contentId,
    platform,
    shareType = 'direct',
    userId,
    sessionId,
    metadata = {},
  } = params;

  return {
    contentType,
    contentId,
    platform,
    shareType,
    userId,
    timestamp: Date.now(),
    sessionId: sessionId || generateSessionId(),
    referrer: typeof window !== 'undefined' ? window.location.href : undefined,
    ...metadata,
  };
}

/**
 * Tracks a share button click event
 * @param event - Share event data
 * @returns Promise that resolves when tracking is complete
 */
export async function trackShareClick(event: ShareEvent): Promise<void> {
  // This would typically send data to your analytics service
  // For now, we'll just log to console in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('Share click tracked:', event);
  }

  // Store in localStorage for client-side tracking
  try {
    const existingEvents = getStoredShareEvents();
    const updatedEvents = [
      ...existingEvents,
      { ...event, eventType: 'click' },
    ].slice(-100); // Keep last 100 events
    localStorage.setItem(
      'vibechecc-share-events',
      JSON.stringify(updatedEvents)
    );
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Tracks a successful share completion
 * @param event - Share event data
 * @returns Promise that resolves when tracking is complete
 */
export async function trackShareCompletion(event: ShareEvent): Promise<void> {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('Share completion tracked:', event);
  }

  try {
    const existingEvents = getStoredShareEvents();
    const updatedEvents = [
      ...existingEvents,
      { ...event, eventType: 'completion' },
    ].slice(-100);
    localStorage.setItem(
      'vibechecc-share-events',
      JSON.stringify(updatedEvents)
    );
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Gets stored share events from localStorage
 * @returns Array of stored share events
 */
export function getStoredShareEvents(): (ShareEvent & { eventType: string })[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('vibechecc-share-events');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Calculates share metrics from stored events
 * @returns Share metrics summary
 */
export function calculateShareMetrics(): ShareMetrics {
  const events = getStoredShareEvents();

  const totalShares = events.filter((e) => e.eventType === 'completion').length;

  const platformBreakdown: Record<SharePlatform, number> = {
    twitter: 0,
    instagram: 0,
    tiktok: 0,
    clipboard: 0,
    native: 0,
  };

  const shareTypeBreakdown: Record<ShareType, number> = {
    story: 0,
    feed: 0,
    direct: 0,
    copy: 0,
  };

  const contentShares: Record<
    string,
    { contentId: string; contentType: ShareContentType; count: number }
  > = {};

  events
    .filter((e) => e.eventType === 'completion')
    .forEach((event) => {
      platformBreakdown[event.platform]++;
      shareTypeBreakdown[event.shareType]++;

      const key = `${event.contentType}:${event.contentId}`;
      if (!contentShares[key]) {
        contentShares[key] = {
          contentId: event.contentId,
          contentType: event.contentType,
          count: 0,
        };
      }
      contentShares[key].count++;
    });

  const popularContent = Object.values(contentShares)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item) => ({
      contentId: item.contentId,
      contentType: item.contentType,
      shareCount: item.count,
    }));

  const recentShares = events
    .filter((e) => e.eventType === 'completion')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  return {
    totalShares,
    platformBreakdown,
    shareTypeBreakdown,
    recentShares,
    popularContent,
  };
}

/**
 * Calculates share analytics including conversion rates
 * @returns Share analytics with conversion metrics
 */
export function calculateShareAnalytics(): ShareAnalytics {
  const events = getStoredShareEvents();

  const clicks = events.filter((e) => e.eventType === 'click').length;
  const completions = events.filter((e) => e.eventType === 'completion').length;
  const conversionRate = clicks > 0 ? completions / clicks : 0;

  const platformPerformance: Record<
    SharePlatform,
    { clicks: number; completions: number; conversionRate: number }
  > = {
    twitter: { clicks: 0, completions: 0, conversionRate: 0 },
    instagram: { clicks: 0, completions: 0, conversionRate: 0 },
    tiktok: { clicks: 0, completions: 0, conversionRate: 0 },
    clipboard: { clicks: 0, completions: 0, conversionRate: 0 },
    native: { clicks: 0, completions: 0, conversionRate: 0 },
  };

  events.forEach((event) => {
    const platform = event.platform;
    if (event.eventType === 'click') {
      platformPerformance[platform].clicks++;
    } else if (event.eventType === 'completion') {
      platformPerformance[platform].completions++;
    }
  });

  // Calculate conversion rates for each platform
  Object.keys(platformPerformance).forEach((platform) => {
    const perf = platformPerformance[platform as SharePlatform];
    perf.conversionRate = perf.clicks > 0 ? perf.completions / perf.clicks : 0;
  });

  return {
    shareClicks: clicks,
    shareCompletions: completions,
    conversionRate,
    platformPerformance,
  };
}

/**
 * Clears stored share events (useful for testing or privacy)
 */
export function clearShareEvents(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('vibechecc-share-events');
    } catch {
      // Ignore localStorage errors
    }
  }
}

/**
 * Exports share data for analysis
 * @returns Share data in a format suitable for export
 */
export function exportShareData(): {
  events: (ShareEvent & { eventType: string })[];
  metrics: ShareMetrics;
  analytics: ShareAnalytics;
  exportedAt: number;
} {
  return {
    events: getStoredShareEvents(),
    metrics: calculateShareMetrics(),
    analytics: calculateShareAnalytics(),
    exportedAt: Date.now(),
  };
}

/**
 * Validates a share event object
 * @param event - Event to validate
 * @returns True if event is valid
 */
export function validateShareEvent(
  event: Partial<ShareEvent>
): event is ShareEvent {
  return !!(
    event.contentType &&
    event.contentId &&
    event.platform &&
    event.shareType &&
    event.timestamp
  );
}

/**
 * Generates a unique tracking ID for a share action
 * @param contentType - Type of content being shared
 * @param contentId - ID of the content
 * @param platform - Platform being shared to
 * @returns Unique tracking ID
 */
export function generateTrackingId(
  contentType: ShareContentType,
  contentId: string,
  platform: SharePlatform
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  return `${contentType}_${contentId}_${platform}_${timestamp}_${random}`;
}
