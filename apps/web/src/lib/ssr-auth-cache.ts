/**
 * SSR Auth Caching for Mobile Performance Optimization
 * Reduces server-side computation overhead by caching auth checks
 */

interface AuthCacheEntry {
  userId: string | null;
  token: string | null;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache for development (replace with Redis in production)
const authCache = new Map<string, AuthCacheEntry>();

// Cache TTL: 5 minutes for auth tokens
const CACHE_TTL = 5 * 60 * 1000;

// Cache TTL for failed auth: 30 seconds
const FAILED_AUTH_TTL = 30 * 1000;

/**
 * Generate cache key from request headers
 */
export function generateAuthCacheKey(request: Request): string {
  // Use session cookie and authorization header for cache key
  const sessionCookie = request.headers
    .get('cookie')
    ?.match(/__session=([^;]+)/)?.[1];
  const authHeader = request.headers.get('authorization');
  const userAgent = request.headers.get('user-agent');

  // Create a hash-like key from relevant headers
  const keyParts = [
    sessionCookie || 'no-session',
    authHeader || 'no-auth',
    userAgent?.slice(0, 50) || 'no-ua', // Truncate UA for performance
  ].join('|');

  return btoa(keyParts).slice(0, 32); // Truncate for performance
}

/**
 * Get cached auth result if valid
 */
export function getCachedAuth(cacheKey: string): AuthCacheEntry | null {
  const cached = authCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  // Check if cache entry is expired
  if (Date.now() > cached.expiresAt) {
    authCache.delete(cacheKey);
    return null;
  }

  return cached;
}

/**
 * Cache auth result with appropriate TTL
 */
export function setCachedAuth(
  cacheKey: string,
  userId: string | null,
  token: string | null
): void {
  const now = Date.now();
  const ttl = userId ? CACHE_TTL : FAILED_AUTH_TTL;

  const entry: AuthCacheEntry = {
    userId,
    token,
    timestamp: now,
    expiresAt: now + ttl,
  };

  authCache.set(cacheKey, entry);

  // Clean up expired entries periodically
  if (authCache.size > 1000) {
    // Prevent memory leak
    cleanupExpiredEntries();
  }
}

/**
 * Clean up expired cache entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, entry] of authCache.entries()) {
    if (now > entry.expiresAt) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => authCache.delete(key));
}

/**
 * Clear all auth cache (useful for deployment/restart)
 */
export function clearAuthCache(): void {
  authCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getAuthCacheStats() {
  return {
    size: authCache.size,
    entries: Array.from(authCache.entries()).map(([key, entry]) => ({
      key: key.slice(0, 8) + '...', // Truncate for security
      userId: entry.userId ? 'present' : 'null',
      age: Date.now() - entry.timestamp,
      ttl: entry.expiresAt - Date.now(),
    })),
  };
}

/**
 * Connection-aware auth timeout
 * Reduce auth computation time on slow connections
 */
export function getAuthTimeout(request: Request): number {
  // Check for slow connection indicators
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const isMobile = /mobile|android|iphone|ipad/.test(userAgent);
  const isSlowConnection = request.headers.get('save-data') === 'on';

  if (isSlowConnection) {
    return 2000; // 2s timeout for save-data users
  }

  if (isMobile) {
    return 3000; // 3s timeout for mobile
  }

  return 5000; // 5s timeout for desktop
}
