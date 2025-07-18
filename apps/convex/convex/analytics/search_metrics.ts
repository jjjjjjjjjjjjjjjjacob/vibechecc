import { internalMutation, internalQuery, query } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';

// Schema types for analytics
export type SearchMetric = {
  _id: string;
  timestamp: number;
  type: 'search' | 'click' | 'error';
  query: string;
  userId?: string;
  resultCount?: number;
  clickedResultId?: string;
  clickedResultType?: 'vibe' | 'user' | 'tag';
  clickPosition?: number;
  responseTime?: number;
  error?: string;
  filters?: Record<string, any>;
};

export type SearchAggregate = {
  term: string;
  count: number;
  avgResultCount: number;
  avgResponseTime: number;
  clickThroughRate: number;
  lastSearched: number;
};

// Track a search event
export const recordSearchMetric = internalMutation({
  args: {
    type: v.union(v.literal('search'), v.literal('click'), v.literal('error')),
    query: v.string(),
    userId: v.optional(v.string()),
    resultCount: v.optional(v.number()),
    clickedResultId: v.optional(v.string()),
    clickedResultType: v.optional(
      v.union(v.literal('vibe'), v.literal('user'), v.literal('tag'))
    ),
    clickPosition: v.optional(v.number()),
    responseTime: v.optional(v.number()),
    error: v.optional(v.string()),
    filters: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('searchMetrics', {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get search performance metrics
export const getSearchPerformanceMetrics = query({
  args: {
    timeRange: v.optional(
      v.object({
        start: v.number(),
        end: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const start = args.timeRange?.start || now - 24 * 60 * 60 * 1000; // Default: last 24 hours
    const end = args.timeRange?.end || now;

    const metrics = await ctx.db
      .query('searchMetrics')
      .withIndex('by_timestamp', (q) =>
        q.gte('timestamp', start).lte('timestamp', end)
      )
      .collect();

    // Calculate aggregated metrics
    const searches = metrics.filter((m) => m.type === 'search');
    const clicks = metrics.filter((m) => m.type === 'click');
    const errors = metrics.filter((m) => m.type === 'error');

    const avgResponseTime =
      searches.length > 0
        ? searches.reduce((sum, s) => sum + (s.responseTime || 0), 0) /
          searches.length
        : 0;

    const avgResultCount =
      searches.length > 0
        ? searches.reduce((sum, s) => sum + (s.resultCount || 0), 0) /
          searches.length
        : 0;

    const clickThroughRate =
      searches.length > 0 ? (clicks.length / searches.length) * 100 : 0;

    const errorRate =
      searches.length > 0 ? (errors.length / searches.length) * 100 : 0;

    // Response time distribution
    const responseTimeRanges = {
      fast: searches.filter((s) => (s.responseTime || 0) < 100).length,
      medium: searches.filter(
        (s) => (s.responseTime || 0) >= 100 && (s.responseTime || 0) < 200
      ).length,
      slow: searches.filter((s) => (s.responseTime || 0) >= 200).length,
    };

    return {
      totalSearches: searches.length,
      totalClicks: clicks.length,
      totalErrors: errors.length,
      avgResponseTime,
      avgResultCount,
      clickThroughRate,
      errorRate,
      responseTimeDistribution: responseTimeRanges,
      timeRange: { start, end },
    };
  },
});

// Get popular search terms with aggregated metrics
export const getPopularSearchTerms = query({
  args: {
    limit: v.optional(v.number()),
    timeRange: v.optional(
      v.object({
        start: v.number(),
        end: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const now = Date.now();
    const start = args.timeRange?.start || now - 7 * 24 * 60 * 60 * 1000; // Default: last 7 days
    const end = args.timeRange?.end || now;

    const metrics = await ctx.db
      .query('searchMetrics')
      .withIndex('by_timestamp', (q) =>
        q.gte('timestamp', start).lte('timestamp', end)
      )
      .filter((q) => q.eq(q.field('type'), 'search'))
      .collect();

    // Group by search term
    const termMap = new Map<
      string,
      {
        searches: typeof metrics;
        clicks: number;
      }
    >();

    for (const metric of metrics) {
      const term = metric.query.toLowerCase().trim();
      if (!termMap.has(term)) {
        termMap.set(term, { searches: [], clicks: 0 });
      }
      termMap.get(term)!.searches.push(metric);
    }

    // Get click data for CTR calculation
    const clickMetrics = await ctx.db
      .query('searchMetrics')
      .withIndex('by_timestamp', (q) =>
        q.gte('timestamp', start).lte('timestamp', end)
      )
      .filter((q) => q.eq(q.field('type'), 'click'))
      .collect();

    for (const click of clickMetrics) {
      const term = click.query.toLowerCase().trim();
      if (termMap.has(term)) {
        termMap.get(term)!.clicks++;
      }
    }

    // Calculate aggregates
    const aggregates: SearchAggregate[] = [];

    for (const [term, data] of termMap.entries()) {
      const searches = data.searches;
      const avgResultCount =
        searches.reduce((sum, s) => sum + (s.resultCount || 0), 0) /
        searches.length;
      const avgResponseTime =
        searches.reduce((sum, s) => sum + (s.responseTime || 0), 0) /
        searches.length;
      const clickThroughRate =
        searches.length > 0 ? (data.clicks / searches.length) * 100 : 0;
      const lastSearched = Math.max(...searches.map((s) => s.timestamp));

      aggregates.push({
        term,
        count: searches.length,
        avgResultCount,
        avgResponseTime,
        clickThroughRate,
        lastSearched,
      });
    }

    // Sort by count and limit
    aggregates.sort((a, b) => b.count - a.count);
    return aggregates.slice(0, limit);
  },
});

// Get search metrics for a specific query
export const getSearchMetricsForQuery = query({
  args: {
    query: v.string(),
    timeRange: v.optional(
      v.object({
        start: v.number(),
        end: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const start = args.timeRange?.start || now - 30 * 24 * 60 * 60 * 1000; // Default: last 30 days
    const end = args.timeRange?.end || now;
    const normalizedQuery = args.query.toLowerCase().trim();

    const metrics = await ctx.db
      .query('searchMetrics')
      .withIndex('by_timestamp', (q) =>
        q.gte('timestamp', start).lte('timestamp', end)
      )
      .filter((q) => q.eq(q.field('query').toLowerCase(), normalizedQuery))
      .collect();

    const searches = metrics.filter((m) => m.type === 'search');
    const clicks = metrics.filter((m) => m.type === 'click');
    const errors = metrics.filter((m) => m.type === 'error');

    // Time series data (daily buckets)
    const dailyBuckets = new Map<
      string,
      {
        searches: number;
        clicks: number;
        errors: number;
      }
    >();

    for (const metric of metrics) {
      const date = new Date(metric.timestamp).toISOString().split('T')[0];
      if (!dailyBuckets.has(date)) {
        dailyBuckets.set(date, { searches: 0, clicks: 0, errors: 0 });
      }

      const bucket = dailyBuckets.get(date)!;
      if (metric.type === 'search') bucket.searches++;
      else if (metric.type === 'click') bucket.clicks++;
      else if (metric.type === 'error') bucket.errors++;
    }

    const timeSeries = Array.from(dailyBuckets.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Click position analysis
    const clickPositions = clicks
      .filter((c) => c.clickPosition !== undefined)
      .map((c) => c.clickPosition!);

    const avgClickPosition =
      clickPositions.length > 0
        ? clickPositions.reduce((sum, pos) => sum + pos, 0) /
          clickPositions.length
        : null;

    return {
      query: args.query,
      totalSearches: searches.length,
      totalClicks: clicks.length,
      totalErrors: errors.length,
      clickThroughRate:
        searches.length > 0 ? (clicks.length / searches.length) * 100 : 0,
      avgClickPosition,
      timeSeries,
      clickedResultTypes: clicks.reduce(
        (acc, c) => {
          if (c.clickedResultType) {
            acc[c.clickedResultType] = (acc[c.clickedResultType] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  },
});

// Get failed searches (searches with no results or errors)
export const getFailedSearches = query({
  args: {
    limit: v.optional(v.number()),
    timeRange: v.optional(
      v.object({
        start: v.number(),
        end: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const now = Date.now();
    const start = args.timeRange?.start || now - 7 * 24 * 60 * 60 * 1000; // Default: last 7 days
    const end = args.timeRange?.end || now;

    const metrics = await ctx.db
      .query('searchMetrics')
      .withIndex('by_timestamp', (q) =>
        q.gte('timestamp', start).lte('timestamp', end)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field('type'), 'error'),
          q.and(
            q.eq(q.field('type'), 'search'),
            q.eq(q.field('resultCount'), 0)
          )
        )
      )
      .collect();

    // Group by query
    const failedQueries = new Map<
      string,
      {
        count: number;
        lastFailed: number;
        errors: string[];
      }
    >();

    for (const metric of metrics) {
      const query = metric.query.toLowerCase().trim();
      if (!failedQueries.has(query)) {
        failedQueries.set(query, {
          count: 0,
          lastFailed: 0,
          errors: [],
        });
      }

      const data = failedQueries.get(query)!;
      data.count++;
      data.lastFailed = Math.max(data.lastFailed, metric.timestamp);
      if (metric.error) {
        data.errors.push(metric.error);
      }
    }

    // Convert to array and sort
    const results = Array.from(failedQueries.entries())
      .map(([query, data]) => ({
        query,
        failureCount: data.count,
        lastFailed: data.lastFailed,
        uniqueErrors: [...new Set(data.errors)],
      }))
      .sort((a, b) => b.failureCount - a.failureCount)
      .slice(0, limit);

    return results;
  },
});

// Track search result click
export const trackSearchClick = internalMutation({
  args: {
    query: v.string(),
    resultId: v.string(),
    resultType: v.union(v.literal('vibe'), v.literal('user'), v.literal('tag')),
    position: v.number(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.scheduleInternal(
      internal.analytics.search_metrics.recordSearchMetric,
      {
        type: 'click',
        query: args.query,
        userId: args.userId,
        clickedResultId: args.resultId,
        clickedResultType: args.resultType,
        clickPosition: args.position,
      }
    );
  },
});

// Track search error
export const trackSearchError = internalMutation({
  args: {
    query: v.string(),
    error: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.scheduleInternal(
      internal.analytics.search_metrics.recordSearchMetric,
      {
        type: 'error',
        query: args.query,
        userId: args.userId,
        error: args.error,
      }
    );
  },
});
