import { query } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Generate a shareable URL for a vibe with UTM tracking
 */
export const generateVibeShareUrl = query({
  args: {
    vibeId: v.string(),
    platform: v.optional(
      v.union(
        v.literal('twitter'),
        v.literal('instagram'),
        v.literal('tiktok'),
        v.literal('clipboard'),
        v.literal('native')
      )
    ),
    shareType: v.optional(
      v.union(
        v.literal('story'),
        v.literal('feed'),
        v.literal('direct'),
        v.literal('copy')
      )
    ),
    customUtm: v.optional(
      v.object({
        source: v.optional(v.string()),
        medium: v.optional(v.string()),
        campaign: v.optional(v.string()),
        term: v.optional(v.string()),
        content: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify the vibe exists and is public
    const vibe = await ctx.db
      .query('vibes')
      .withIndex('id', (q) => q.eq('id', args.vibeId))
      .first();

    if (!vibe || vibe.visibility === 'deleted') {
      throw new Error('Vibe not found or not accessible');
    }

    // Base URL from environment variables (required)
    if (!process.env.APP_URL) {
      throw new Error('APP_URL environment variable is required');
    }
    const baseUrl = process.env.APP_URL;
    const vibeUrl = `${baseUrl}/vibes/${args.vibeId}`;

    // Create URL object for parameter manipulation
    const url = new URL(vibeUrl);

    // Default UTM parameters
    const defaultUtm = {
      medium: 'social',
      campaign: 'social_sharing',
    };

    // Platform-specific UTM parameters
    const platformUtm = args.platform
      ? {
          source: args.platform,
          content: args.shareType
            ? `${args.platform}_${args.shareType}`
            : args.platform,
        }
      : {};

    // Combine UTM parameters (custom overrides defaults)
    const finalUtm = {
      ...defaultUtm,
      ...platformUtm,
      ...args.customUtm,
    };

    // Add UTM parameters to URL
    Object.entries(finalUtm).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(`utm_${key}`, value);
      }
    });

    return {
      url: url.toString(),
      vibeTitle: vibe.title,
      vibeDescription: vibe.description,
      shareCount: vibe.shareCount || 0,
    };
  },
});

/**
 * Generate a shareable URL for a user profile with UTM tracking
 */
export const generateProfileShareUrl = query({
  args: {
    userId: v.string(), // External ID
    platform: v.optional(
      v.union(
        v.literal('twitter'),
        v.literal('instagram'),
        v.literal('tiktok'),
        v.literal('clipboard'),
        v.literal('native')
      )
    ),
    shareType: v.optional(
      v.union(
        v.literal('story'),
        v.literal('feed'),
        v.literal('direct'),
        v.literal('copy')
      )
    ),
    customUtm: v.optional(
      v.object({
        source: v.optional(v.string()),
        medium: v.optional(v.string()),
        campaign: v.optional(v.string()),
        term: v.optional(v.string()),
        content: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify the user exists and is not deleted
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', args.userId))
      .first();

    if (!user || user.deleted) {
      throw new Error('User not found or not accessible');
    }

    // Base URL from environment variables (required)
    if (!process.env.APP_URL) {
      throw new Error('APP_URL environment variable is required');
    }
    const baseUrl = process.env.APP_URL;
    const profileUrl = user.username
      ? `${baseUrl}/users/${user.username}`
      : `${baseUrl}/users/${user.externalId}`;

    // Create URL object for parameter manipulation
    const url = new URL(profileUrl);

    // Default UTM parameters
    const defaultUtm = {
      medium: 'social',
      campaign: 'profile_sharing',
    };

    // Platform-specific UTM parameters
    const platformUtm = args.platform
      ? {
          source: args.platform,
          content: args.shareType
            ? `profile_${args.platform}_${args.shareType}`
            : `profile_${args.platform}`,
        }
      : {};

    // Combine UTM parameters (custom overrides defaults)
    const finalUtm = {
      ...defaultUtm,
      ...platformUtm,
      ...args.customUtm,
    };

    // Add UTM parameters to URL
    Object.entries(finalUtm).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(`utm_${key}`, value);
      }
    });

    // Compute display name
    function computeUserDisplayName(user: {
      username?: string;
      first_name?: string;
      last_name?: string;
    }): string {
      if (user.username?.trim()) return user.username.trim();
      const firstName = user.first_name?.trim();
      const lastName = user.last_name?.trim();
      if (firstName || lastName) {
        return `${firstName || ''} ${lastName || ''}`.trim();
      }
      return 'Someone';
    }

    return {
      url: url.toString(),
      displayName: computeUserDisplayName(user),
      username: user.username,
      bio: user.bio,
      followerCount: user.followerCount || 0,
    };
  },
});

/**
 * Generate multiple share URLs for different platforms at once
 */
export const generateMultiPlatformShareUrls = query({
  args: {
    contentType: v.union(v.literal('vibe'), v.literal('profile')),
    contentId: v.string(),
    platforms: v.array(
      v.union(
        v.literal('twitter'),
        v.literal('instagram'),
        v.literal('tiktok'),
        v.literal('clipboard'),
        v.literal('native')
      )
    ),
    shareType: v.optional(
      v.union(
        v.literal('story'),
        v.literal('feed'),
        v.literal('direct'),
        v.literal('copy')
      )
    ),
    customUtm: v.optional(
      v.object({
        source: v.optional(v.string()),
        medium: v.optional(v.string()),
        campaign: v.optional(v.string()),
        term: v.optional(v.string()),
        content: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results: Record<string, { url?: string; error?: string }> = {};

    // Helper function to generate URL for each platform
    const generatePlatformUrl = async (platform: string) => {
      // Base URL from environment variables
      const baseUrl = process.env.APP_URL || 'https://vibechecc.com';
      let contentUrl: string;

      if (args.contentType === 'vibe') {
        // Verify the vibe exists and is public
        const vibe = await ctx.db
          .query('vibes')
          .withIndex('id', (q) => q.eq('id', args.contentId))
          .first();

        if (!vibe || vibe.visibility === 'deleted') {
          throw new Error('Vibe not found or not accessible');
        }

        contentUrl = `${baseUrl}/vibes/${args.contentId}`;
      } else {
        // Verify the user exists and is not deleted
        const user = await ctx.db
          .query('users')
          .withIndex('byExternalId', (q) => q.eq('externalId', args.contentId))
          .first();

        if (!user || user.deleted) {
          throw new Error('User not found or not accessible');
        }

        contentUrl = user.username
          ? `${baseUrl}/users/${user.username}`
          : `${baseUrl}/users/${user.externalId}`;
      }

      // Create URL object for parameter manipulation
      const url = new URL(contentUrl);

      // Default UTM parameters
      const defaultUtm = {
        medium: 'social',
        campaign:
          args.contentType === 'vibe' ? 'social_sharing' : 'profile_sharing',
      };

      // Platform-specific UTM parameters
      const platformUtm = {
        source: platform,
        content: args.shareType
          ? `${args.contentType}_${platform}_${args.shareType}`
          : `${args.contentType}_${platform}`,
      };

      // Combine UTM parameters (custom overrides defaults)
      const finalUtm = {
        ...defaultUtm,
        ...platformUtm,
        ...args.customUtm,
      };

      // Add UTM parameters to URL
      Object.entries(finalUtm).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(`utm_${key}`, value);
        }
      });

      return url.toString();
    };

    for (const platform of args.platforms) {
      try {
        const url = await generatePlatformUrl(platform);
        results[platform] = { url };
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        results[platform] = { error: errorMessage };
      }
    }

    return results;
  },
});

/**
 * Get shortened display version of a URL (for UI purposes)
 */
export const getShortenedUrl = query({
  args: {
    url: v.string(),
    maxLength: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxLength = args.maxLength || 50;
    const url = args.url;

    if (url.length <= maxLength) {
      return { shortened: url, isTruncated: false };
    }

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const path = urlObj.pathname + urlObj.search;

      if (domain.length >= maxLength - 3) {
        return {
          shortened: `${domain.substring(0, maxLength - 3)}...`,
          isTruncated: true,
        };
      }

      const availablePathLength = maxLength - domain.length - 3; // 3 for "..."
      if (path.length > availablePathLength) {
        return {
          shortened: `${domain}${path.substring(0, availablePathLength)}...`,
          isTruncated: true,
        };
      }

      return { shortened: `${domain}${path}`, isTruncated: false };
    } catch {
      // If URL parsing fails, just truncate the string
      return {
        shortened: `${url.substring(0, maxLength - 3)}...`,
        isTruncated: true,
      };
    }
  },
});

/**
 * Parse UTM parameters from a URL (for analytics)
 */
export const parseUtmFromUrl = query({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const urlObj = new URL(args.url);
      const utmParams: Record<string, string> = {};

      urlObj.searchParams.forEach((value, key) => {
        if (key.startsWith('utm_')) {
          const utmKey = key.replace('utm_', '');
          utmParams[utmKey] = value;
        }
      });

      return {
        success: true,
        utm: utmParams,
        baseUrl: `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`,
      };
    } catch {
      return {
        success: false,
        error: 'Invalid URL format',
        utm: {},
        baseUrl: args.url,
      };
    }
  },
});

/**
 * Get share URL configuration for a specific platform
 */
export const getPlatformShareConfig = query({
  args: {
    platform: v.union(
      v.literal('twitter'),
      v.literal('instagram'),
      v.literal('tiktok'),
      v.literal('clipboard'),
      v.literal('native')
    ),
  },
  handler: async (ctx, args) => {
    const configs = {
      twitter: {
        supportsWebSharing: true,
        maxTextLength: 280,
        urlLength: 23, // Twitter's t.co URL length
        recommendedHashtags: 2,
        shareUrlTemplate: 'https://twitter.com/intent/tweet',
      },
      instagram: {
        supportsWebSharing: false,
        maxTextLength: 2200,
        maxHashtags: 30,
        recommendedHashtags: 11,
        requiresMobileApp: true,
      },
      tiktok: {
        supportsWebSharing: false,
        maxTextLength: 300,
        maxHashtags: 10,
        requiresMobileApp: true,
      },
      clipboard: {
        supportsWebSharing: true,
        universalSupport: true,
        fallbackOption: true,
      },
      native: {
        supportsWebSharing: true,
        requiresNavigatorShare: true,
        modernBrowsersOnly: true,
      },
    };

    return configs[args.platform];
  },
});
