/**
 * Optimized auth helper for SSR performance
 * Implements caching, timeouts, and mobile-specific optimizations
 */

import { getAuth } from '@clerk/tanstack-react-start/server';
import {
  generateAuthCacheKey,
  getCachedAuth,
  setCachedAuth,
  getAuthTimeout,
} from './ssr-auth-cache';

export interface OptimizedAuthResult {
  userId: string | null;
  token: string | null;
  fromCache?: boolean;
  computeTime?: number;
}

/**
 * Get auth with caching and mobile optimization
 */
export async function getOptimizedAuth(
  request: Request
): Promise<OptimizedAuthResult> {
  const startTime = Date.now();

  // Try cache first
  const cacheKey = generateAuthCacheKey(request);
  const cached = getCachedAuth(cacheKey);

  if (cached) {
    return {
      userId: cached.userId,
      token: cached.token,
      fromCache: true,
      computeTime: Date.now() - startTime,
    };
  }

  // Get connection-aware timeout
  const timeout = getAuthTimeout(request);

  try {
    // Race auth computation against timeout
    const authResult = await Promise.race([
      getAuthWithTimeout(request, timeout),
      createTimeoutPromise(timeout),
    ]);

    if (authResult === 'TIMEOUT') {
      // Return null auth on timeout, cache briefly
      setCachedAuth(cacheKey, null, null);
      return {
        userId: null,
        token: null,
        fromCache: false,
        computeTime: timeout,
      };
    }

    // Cache successful result
    if (typeof authResult === 'object' && authResult !== null) {
      setCachedAuth(cacheKey, authResult.userId, authResult.token);

      return {
        ...authResult,
        fromCache: false,
        computeTime: Date.now() - startTime,
      };
    } else {
      // Handle string result (fallback)
      setCachedAuth(cacheKey, null, null);
      return {
        userId: null,
        token: null,
        fromCache: false,
        computeTime: Date.now() - startTime,
      };
    }
  } catch {
    // Cache failed auth briefly to prevent repeated attempts
    setCachedAuth(cacheKey, null, null);

    return {
      userId: null,
      token: null,
      fromCache: false,
      computeTime: Date.now() - startTime,
    };
  }
}

/**
 * Get auth with timeout
 */
async function getAuthWithTimeout(
  request: Request,
  timeoutMs: number
): Promise<{ userId: string | null; token: string | null }> {
  try {
    const authResult = await getAuth(request);

    // Handle Clerk redirect responses during SSR
    if (
      authResult &&
      typeof authResult === 'object' &&
      'status' in authResult &&
      'headers' in authResult
    ) {
      return { userId: null, token: null };
    }

    const auth = authResult;

    // Validate auth object
    if (
      !auth ||
      typeof auth !== 'object' ||
      !('userId' in auth) ||
      !auth.userId
    ) {
      return { userId: null, token: null };
    }

    // Get token with timeout
    let token = null;
    try {
      if ('getToken' in auth && typeof auth.getToken === 'function') {
        // Race token generation against a shorter timeout
        const tokenTimeout = Math.min(timeoutMs * 0.7, 2000);
        token = await Promise.race([
          auth.getToken({ template: 'convex' }),
          createTimeoutPromise(tokenTimeout, 'TOKEN_TIMEOUT'),
        ]);

        if (token === 'TOKEN_TIMEOUT') {
          token = null;
        }
      }
    } catch {
      // Token generation failed, continue with null token
      token = null;
    }

    return {
      userId: auth.userId as string,
      token,
    };
  } catch (error) {
    // Handle Clerk redirect errors
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'headers' in error
    ) {
      return { userId: null, token: null };
    }

    throw error;
  }
}

/**
 * Create a timeout promise
 */
function createTimeoutPromise<T = string>(
  ms: number,
  value: T = 'TIMEOUT' as T
): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

/**
 * Non-blocking auth for critical rendering path
 * Returns immediately with cached result or null
 */
export function getNonBlockingAuth(request: Request): OptimizedAuthResult {
  const cacheKey = generateAuthCacheKey(request);
  const cached = getCachedAuth(cacheKey);

  if (cached) {
    return {
      userId: cached.userId,
      token: cached.token,
      fromCache: true,
      computeTime: 0,
    };
  }

  // Start async auth computation without blocking
  getOptimizedAuth(request).catch(() => {
    // Silently handle errors for non-blocking auth
  });

  return {
    userId: null,
    token: null,
    fromCache: false,
    computeTime: 0,
  };
}
