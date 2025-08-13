import { internalMutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';

/**
 * Raw metric stored for each search related event. Metrics are appended via
 * internal mutations and later aggregated for analytics dashboards.
 */
export type SearchMetric = {
  /** document identifier assigned by Convex */
  _id: string;
  /** unix timestamp when the event occurred */
  timestamp: number;
  /** type of metric being recorded */
  type: 'search' | 'click' | 'error';
  /** original search query text */
  query: string;
  /** optional user who performed the action */
  userId?: string;
  /** number of results returned for a search event */
  resultCount?: number;
  /** identifier of the clicked result when type is `click` */
  clickedResultId?: string;
  /** category of the clicked result */
  clickedResultType?: 'vibe' | 'user' | 'tag';
  /** position within the result list for clicks */
  clickPosition?: number;
  /** response time reported by the search handler */
  responseTime?: number;
  /** error message when the search failed */
  error?: string;
  /** additional filtering options applied during the search */
  filters?: Record<string, unknown>;
};

/**
 * Aggregated metrics for a search term, used when reporting popular queries
 * and their performance characteristics.
 */
export type SearchAggregate = {
  /** normalized search term */
  term: string;
  /** number of times the term was searched */
  count: number;
  /** average number of results returned */
  avgResultCount: number;
  /** average search handler response time */
  avgResponseTime: number;
  /** percentage of searches that resulted in a click */
  clickThroughRate: number;
  /** timestamp of the most recent search for this term */
  lastSearched: number;
};

/**
 * Internal helper to persist a single search metric. The mutation accepts a
 * union of fields for search events, result clicks, and errors. A timestamp is
 * automatically added before writing to the `searchMetrics` table.
 */
export const recordSearchMetric = internalMutation({
  args: {
    // event type being recorded
    type: v.union(v.literal('search'), v.literal('click'), v.literal('error')),
    // search query text
    query: v.string(),
    // optional authenticated user id
    userId: v.optional(v.string()),
    // numeric details primarily used for search events
    resultCount: v.optional(v.number()),
    // identifiers describing the clicked result
    clickedResultId: v.optional(v.string()),
    clickedResultType: v.optional(
      v.union(v.literal('vibe'), v.literal('user'), v.literal('tag'))
    ),
    clickPosition: v.optional(v.number()),
    // additional metadata
    responseTime: v.optional(v.number()),
    error: v.optional(v.string()),
    filters: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // append the metric with a server-side timestamp
    await ctx.db.insert('searchMetrics', {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * Return aggregate performance metrics for searches in an optional time range.
 * Used by dashboards to display overall search health and responsiveness.
 */
export const getSearchPerformanceMetrics = query({
  args: {
    // optional start/end range in milliseconds since epoch
    timeRange: v.optional(
      v.object({
        start: v.number(),
        end: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // default to the last 24 hours if no range is provided
    const start = args.timeRange?.start || now - 24 * 60 * 60 * 1000;
    const end = args.timeRange?.end || now;

    // retrieve all metrics within the time window using an indexed query
    const metrics = await ctx.db
      .query('searchMetrics')
      .withIndex('by_timestamp', (q) =>
        q.gte('timestamp', start).lte('timestamp', end)
      )
      .collect();

    // partition metrics by type for easier calculations
    const searches = metrics.filter((m) => m.type === 'search');
    const clicks = metrics.filter((m) => m.type === 'click');
    const errors = metrics.filter((m) => m.type === 'error');

    // compute averages, guarding against empty datasets
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

    // bucket response times to highlight performance distribution
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

/**
 * Retrieve the most common search terms within a period along with statistics
 * such as average result counts and click-through rates.
 */
export const getPopularSearchTerms = query({
  args: {
    // limit the number of terms returned
    limit: v.optional(v.number()),
    // optional time range to constrain the query
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
    // default window is the last 7 days
    const start = args.timeRange?.start || now - 7 * 24 * 60 * 60 * 1000;
    const end = args.timeRange?.end || now;

    // gather search events in the time range
    const metrics = await ctx.db
      .query('searchMetrics')
      .withIndex('by_timestamp', (q) =>
        q.gte('timestamp', start).lte('timestamp', end)
      )
      .filter((q) => q.eq(q.field('type'), 'search'))
      .collect();

    // group metrics by normalized search term
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

    // fetch click events to compute click-through rates
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

    // convert grouped data into aggregates for the caller
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

    // order by popularity and enforce limit
    aggregates.sort((a, b) => b.count - a.count);
    return aggregates.slice(0, limit);
  },
});

/**
 * Detailed analytics for a single normalized query string, including time
 * series breakdowns and click positions.
 */
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
    // default to last 30 days
    const start = args.timeRange?.start || now - 30 * 24 * 60 * 60 * 1000;
    const end = args.timeRange?.end || now;
    // normalize query for case-insensitive matching
    const normalizedQuery = args.query.toLowerCase().trim();

    // load all metrics for the normalized query in the time range
    const metrics = await ctx.db
      .query('searchMetrics')
      .withIndex('by_timestamp', (q) =>
        q.gte('timestamp', start).lte('timestamp', end)
      )
      .filter((q) => q.eq(q.field('query'), normalizedQuery))
      .collect();

    const searches = metrics.filter((m) => m.type === 'search');
    const clicks = metrics.filter((m) => m.type === 'click');
    const errors = metrics.filter((m) => m.type === 'error');

    // bucket metrics per day for a time series chart
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

    // analyze which result positions receive clicks
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

/**
 * List queries that frequently return no results or errors to help improve
 * search relevance.
 */
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
        uniqueErrors: Array.from(new Set(data.errors)),
      }))
      .sort((a, b) => b.failureCount - a.failureCount)
      .slice(0, limit);

    return results;
  },
});

// Track search result click
/**
 * Record a click on a search result. The event is scheduled as an internal
 * mutation to avoid blocking the user interaction.
 */
export const trackSearchClick = internalMutation({
  args: {
    query: v.string(),
    resultId: v.string(),
    resultType: v.union(v.literal('vibe'), v.literal('user'), v.literal('tag')),
    position: v.number(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(
      0,
      internal.analytics['search-metrics'].recordSearchMetric,
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

/**
 * Record a search error event for analytics. Like clicks, the write is
 * scheduled so the calling request can return immediately.
 */
export const trackSearchError = internalMutation({
  args: {
    query: v.string(),
    error: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(
      0,
      internal.analytics['search-metrics'].recordSearchMetric,
      {
        type: 'error',
        query: args.query,
        userId: args.userId,
        error: args.error,
      }
    );
  },
});
