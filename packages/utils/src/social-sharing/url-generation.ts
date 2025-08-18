/**
 * URL generation utilities for shareable links
 */

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface ShareUrlOptions {
  utm?: UtmParams;
  customParams?: Record<string, string>;
}

/**
 * Default UTM parameters for social sharing
 */
export const DEFAULT_UTM_PARAMS: UtmParams = {
  medium: 'social',
  campaign: 'social_sharing',
} as const;

/**
 * Base URL for the application
 * This should be configured by the consuming application
 */
/**
 * Gets the base URL for the application
 * In browser environments, uses the current origin
 * In server/build environments, requires VITE_APP_URL environment variable
 */
export const getBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Use the current origin in browser
    return window.location.origin;
  }
  // For server-side or non-browser environments, require the environment variable
  // This will be set at build time
  if (!process.env.VITE_APP_URL) {
    console.error(
      'VITE_APP_URL environment variable is required for server-side URL generation'
    );
    // Return empty string to avoid breaking builds, but log the error
    return '';
  }
  return process.env.VITE_APP_URL;
};

/**
 * Generates a shareable URL for a vibe with optional UTM tracking
 * @param vibeId - The vibe ID to share
 * @param options - Share URL options including UTM params
 * @returns Complete shareable URL
 */
export function generateVibeShareUrl(
  vibeId: string,
  options: ShareUrlOptions = {}
): string {
  const { utm = {}, customParams = {} } = options;

  const url = new URL(`/vibes/${vibeId}`, getBaseUrl());

  // Apply UTM parameters
  const finalUtmParams = { ...DEFAULT_UTM_PARAMS, ...utm };
  Object.entries(finalUtmParams).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(`utm_${key}`, value);
    }
  });

  // Apply custom parameters
  Object.entries(customParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

/**
 * Generates a shareable URL for a user profile with optional UTM tracking
 * @param username - The username to share
 * @param options - Share URL options including UTM params
 * @returns Complete shareable URL
 */
export function generateProfileShareUrl(
  username: string,
  options: ShareUrlOptions = {}
): string {
  const { utm = {}, customParams = {} } = options;

  const url = new URL(`/users/${username}`, getBaseUrl());

  // Apply UTM parameters
  const finalUtmParams = { ...DEFAULT_UTM_PARAMS, ...utm };
  Object.entries(finalUtmParams).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(`utm_${key}`, value);
    }
  });

  // Apply custom parameters
  Object.entries(customParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

/**
 * Generates UTM parameters for a specific social platform
 * @param platform - The social platform name
 * @param shareType - Type of share (story, feed, direct, etc.)
 * @returns UTM parameters configured for the platform
 */
export function generatePlatformUtmParams(
  platform: 'twitter' | 'instagram' | 'tiktok' | 'clipboard',
  shareType: 'story' | 'feed' | 'direct' | 'copy' = 'direct'
): UtmParams {
  return {
    ...DEFAULT_UTM_PARAMS,
    source: platform,
    content: `${platform}_${shareType}`,
  };
}

/**
 * Parses UTM parameters from a URL
 * @param url - URL to parse
 * @returns Extracted UTM parameters
 */
export function parseUtmParams(url: string): UtmParams {
  const urlObj = new URL(url);
  const params: UtmParams = {};

  urlObj.searchParams.forEach((value, key) => {
    if (key.startsWith('utm_')) {
      const utmKey = key.replace('utm_', '') as keyof UtmParams;
      params[utmKey] = value;
    }
  });

  return params;
}

/**
 * Generates a shortened version of a URL for display purposes
 * @param url - Full URL to shorten
 * @param maxLength - Maximum length for display (default: 50)
 * @returns Shortened URL for display
 */
export function shortenUrlForDisplay(
  url: string,
  maxLength: number = 50
): string {
  if (url.length <= maxLength) return url;

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const path = urlObj.pathname + urlObj.search;

    if (domain.length >= maxLength - 3) {
      return `${domain.substring(0, maxLength - 3)}...`;
    }

    const availablePathLength = maxLength - domain.length - 3; // 3 for "..."
    if (path.length > availablePathLength) {
      return `${domain}${path.substring(0, availablePathLength)}...`;
    }

    return `${domain}${path}`;
  } catch {
    // If URL parsing fails, just truncate the string
    return `${url.substring(0, maxLength - 3)}...`;
  }
}
