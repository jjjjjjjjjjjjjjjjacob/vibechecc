import * as React from 'react';
import { api as _api } from '@viberatr/convex';
import type { FunctionReference } from 'convex/server';
import { useConvex, type ConvexReactClient } from 'convex/react';

/**
 * Batch loader for Convex queries to reduce network requests
 * Batches multiple queries into a single request
 */
class ConvexBatchLoader {
  private batchQueue: Map<
    string,
    {
      queries: Array<{
        id: string;
        args: unknown;
        resolve: (value: unknown) => void;
        reject: (error: unknown) => void;
      }>;
      timeoutId?: NodeJS.Timeout;
    }
  > = new Map();

  private batchDelay = 10; // 10ms delay to batch requests
  private maxBatchSize = 20; // Maximum queries per batch

  /**
   * Load data with batching
   */
  async load<T>(
    queryFunction: FunctionReference<'query'>,
    args: unknown,
    convexClient: ConvexReactClient
  ): Promise<T> {
    const queryKey = this.getQueryKey(queryFunction);

    return new Promise<T>((resolve, reject) => {
      // Get or create batch for this query type
      let batch = this.batchQueue.get(queryKey);
      if (!batch) {
        batch = { queries: [] };
        this.batchQueue.set(queryKey, batch);
      }

      // Add query to batch
      const queryId = Math.random().toString(36).substr(2, 9);
      batch.queries.push({
        id: queryId,
        args,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      // Clear existing timeout
      if (batch.timeoutId) {
        clearTimeout(batch.timeoutId);
      }

      // Execute batch if it's full
      if (batch.queries.length >= this.maxBatchSize) {
        this.executeBatch(queryKey, queryFunction, convexClient);
      } else {
        // Schedule batch execution
        batch.timeoutId = setTimeout(() => {
          this.executeBatch(queryKey, queryFunction, convexClient);
        }, this.batchDelay);
      }
    });
  }

  /**
   * Execute a batch of queries
   */
  private async executeBatch(
    queryKey: string,
    queryFunction: FunctionReference<'query'>,
    convexClient: ConvexReactClient
  ) {
    const batch = this.batchQueue.get(queryKey);
    if (!batch || batch.queries.length === 0) return;

    // Remove batch from queue
    this.batchQueue.delete(queryKey);

    try {
      // Execute all queries in parallel
      const promises = batch.queries.map((query) =>
        convexClient.query(queryFunction, query.args)
      );

      const results = await Promise.allSettled(promises);

      // Resolve/reject individual promises
      results.forEach((result, index) => {
        const query = batch.queries[index];
        if (result.status === 'fulfilled') {
          query.resolve(result.value);
        } else {
          query.reject(result.reason);
        }
      });
    } catch (error) {
      // Reject all queries if batch fails
      batch.queries.forEach((query) => query.reject(error));
    }
  }

  /**
   * Get a unique key for a query function
   */
  private getQueryKey(queryFunction: FunctionReference<'query'>): string {
    return queryFunction.toString();
  }

  /**
   * Clear all pending batches
   */
  clear() {
    this.batchQueue.forEach((batch) => {
      if (batch.timeoutId) {
        clearTimeout(batch.timeoutId);
      }
      batch.queries.forEach((query) =>
        query.reject(new Error('Batch loader cleared'))
      );
    });
    this.batchQueue.clear();
  }
}

// Export singleton instance
export const convexBatchLoader = new ConvexBatchLoader();

/**
 * React hook for batched Convex queries
 */
export function useBatchedQuery<T>(
  queryFunction: FunctionReference<'query'>,
  args: unknown,
  options?: { enabled?: boolean }
): { data: T | undefined; isLoading: boolean; error: Error | null } {
  const [data, setData] = React.useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const convexClient = useConvex();

  React.useEffect(() => {
    if (options?.enabled === false) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await convexBatchLoader.load<T>(
          queryFunction,
          args,
          convexClient
        );

        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [queryFunction, args, convexClient, options?.enabled]);

  return { data, isLoading, error };
}

/**
 * Batch multiple related queries together
 */
export async function batchQueries<T extends Record<string, unknown>>(
  queries: Array<{
    key: string;
    queryFunction: FunctionReference<'query'>;
    args: unknown;
  }>,
  convexClient: ConvexReactClient
): Promise<T> {
  const results = await Promise.all(
    queries.map(({ key, queryFunction, args }) =>
      convexBatchLoader
        .load(queryFunction, args, convexClient)
        .then((data) => ({ key, data }))
    )
  );

  return results.reduce((acc, { key, data }) => {
    (acc as Record<string, unknown>)[key] = data;
    return acc;
  }, {} as T);
}
