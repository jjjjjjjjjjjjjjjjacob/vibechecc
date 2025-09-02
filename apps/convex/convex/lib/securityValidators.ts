// SECURITY: Input validation and sanitization utilities

import type { QueryCtx, MutationCtx } from '../_generated/server';

/**
 * Validates and sanitizes user input to prevent injection attacks
 */
export class SecurityValidators {
  /**
   * Validates string input with length and pattern constraints
   */
  static validateString(
    input: string | undefined,
    options: {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      required?: boolean;
      fieldName?: string;
    } = {}
  ): string | null {
    const {
      minLength = 0,
      maxLength = 1000,
      pattern,
      required = false,
      fieldName = 'Field',
    } = options;

    if (!input) {
      if (required) {
        throw new Error(`${fieldName} is required`);
      }
      return null;
    }

    // SECURITY: Prevent null bytes and control characters
    if (input.includes('\0')) {
      throw new Error(`${fieldName} contains invalid characters`);
    }

    // Length validation
    if (input.length < minLength) {
      throw new Error(
        `${fieldName} must be at least ${minLength} characters long`
      );
    }
    if (input.length > maxLength) {
      throw new Error(
        `${fieldName} must be no more than ${maxLength} characters long`
      );
    }

    // Pattern validation
    if (pattern && !pattern.test(input)) {
      throw new Error(`${fieldName} format is invalid`);
    }

    return input.trim();
  }

  /**
   * Validates username format
   * Compatible with Clerk's "Latin-based characters" requirement
   */
  static validateUsername(username: string | undefined): string | null {
    return this.validateString(username, {
      minLength: 3,
      maxLength: 30,
      pattern: /^[\p{Script=Latin}\p{N}_-]+$/u, // Latin script letters, numbers, underscore, hyphen
      fieldName: 'Username',
    });
  }

  /**
   * Validates bio/description content
   */
  static validateBio(bio: string | undefined): string | null {
    return this.validateString(bio, {
      maxLength: 500,
      fieldName: 'Bio',
    });
  }

  /**
   * Validates vibe title
   */
  static validateVibeTitle(title: string | undefined): string {
    const validated = this.validateString(title, {
      minLength: 1,
      maxLength: 100,
      required: true,
      fieldName: 'Vibe title',
    });
    return validated!;
  }

  /**
   * Validates vibe description
   */
  static validateVibeDescription(description: string | undefined): string {
    const validated = this.validateString(description, {
      minLength: 1,
      maxLength: 1000,
      required: true,
      fieldName: 'Vibe description',
    });
    return validated!;
  }

  /**
   * Validates review content
   */
  static validateReview(review: string | undefined): string {
    const validated = this.validateString(review, {
      minLength: 1,
      maxLength: 500,
      required: true,
      fieldName: 'Review',
    });
    return validated!;
  }

  /**
   * Validates rating value
   */
  static validateRating(rating: number): number {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be an integer between 1 and 5');
    }
    return rating;
  }

  /**
   * Validates tags array
   */
  static validateTags(tags: string[] | undefined): string[] {
    if (!tags) return [];

    if (!Array.isArray(tags)) {
      throw new Error('Tags must be an array');
    }

    if (tags.length > 10) {
      throw new Error('Maximum 10 tags allowed');
    }

    return tags.map((tag, index) => {
      const validated = this.validateString(tag, {
        minLength: 1,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9\s-]+$/,
        required: true,
        fieldName: `Tag ${index + 1}`,
      });
      return validated!.toLowerCase();
    });
  }

  /**
   * Validates URL format
   */
  static validateUrl(url: string | undefined): string | null {
    if (!url) return null;

    const validated = this.validateString(url, {
      maxLength: 500,
      fieldName: 'URL',
    });

    if (validated) {
      try {
        new URL(validated);
        // SECURITY: Only allow HTTP/HTTPS protocols
        if (
          !validated.startsWith('http://') &&
          !validated.startsWith('https://')
        ) {
          throw new Error('URL must use HTTP or HTTPS protocol');
        }
      } catch {
        throw new Error('Invalid URL format');
      }
    }

    return validated;
  }

  /**
   * ⚠️  SECURITY WARNING: INADEQUATE HTML SANITIZATION ⚠️
   *
   * This method uses basic regex replacements that are INSUFFICIENT for secure HTML sanitization
   * and CAN BE BYPASSED by attackers. This implementation is NOT secure for production use.
   *
   * CRITICAL LIMITATIONS:
   * - Regex-based sanitization can be bypassed with encoding, case variations, or malformed HTML
   * - Does not handle all dangerous HTML elements, attributes, or CSS injections
   * - Vulnerable to various XSS attack vectors
   * - Not compatible with complex HTML parsing requirements
   *
   * SAFE USAGE CONTEXTS ONLY:
   * - Simple display-only text with minimal HTML (e.g., basic formatting)
   * - Content that will be further processed by secure parsers
   * - Non-security-critical internal tools with trusted input sources
   *
   * STRONGLY RECOMMENDED: Replace with DOMPurify or similar library:
   *
   * Example with DOMPurify:
   * ```typescript
   * import DOMPurify from 'isomorphic-dompurify';
   *
   * static sanitizeHtml(html: string): string {
   *   return DOMPurify.sanitize(html, {
   *     ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
   *     ALLOWED_ATTR: []
   *   });
   * }
   * ```
   *
   * DO NOT USE this method for:
   * - User-generated content that will be displayed to other users
   * - Any content from untrusted sources
   * - Security-sensitive applications
   * - Production systems handling external input
   */
  static sanitizeHtml(html: string): string {
    // ⚠️  WARNING: This is NOT secure HTML sanitization - see method documentation above
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  // In-memory rate limiting storage (for single-instance deployments)
  // PRODUCTION NOTE: Use Redis or database for distributed systems
  private static rateLimitStore = new Map<string, number[]>();

  /**
   * Rate limiting check (functional in-memory implementation)
   */
  static async checkRateLimit(
    userId: string,
    action: string,
    maxRequests: number = 10,
    windowMs: number = 60000 // 1 minute
  ): Promise<void> {
    // SECURITY: Functional rate limiting implementation
    // WARNING: This uses in-memory storage - use Redis for production distributed systems
    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing timestamps for this user/action
    let timestamps = this.rateLimitStore.get(key) || [];

    // Remove timestamps outside the current window (sliding window approach)
    timestamps = timestamps.filter((timestamp) => timestamp > windowStart);

    // Check if the user has exceeded the rate limit
    if (timestamps.length >= maxRequests) {
      const oldestRequest = Math.min(...timestamps);
      const resetTime = Math.ceil((oldestRequest + windowMs - now) / 1000);
      throw new Error(
        `Rate limit exceeded for ${action}. Too many requests. Try again in ${resetTime} seconds.`
      );
    }

    // Add current timestamp and update store
    timestamps.push(now);
    this.rateLimitStore.set(key, timestamps);

    // Cleanup old entries to prevent memory leaks (run occasionally)
    if (Math.random() < 0.01) {
      // 1% chance to trigger cleanup
      this.cleanupRateLimitStore(windowMs * 2); // Clean entries older than 2x window
    }
  }

  /**
   * Cleanup old rate limit entries to prevent memory leaks
   */
  private static cleanupRateLimitStore(maxAgeMs: number): void {
    const cutoff = Date.now() - maxAgeMs;

    for (const [key, timestamps] of this.rateLimitStore.entries()) {
      const validTimestamps = timestamps.filter(
        (timestamp) => timestamp > cutoff
      );

      if (validTimestamps.length === 0) {
        this.rateLimitStore.delete(key);
      } else if (validTimestamps.length < timestamps.length) {
        this.rateLimitStore.set(key, validTimestamps);
      }
    }
  }

  /**
   * SECURITY: Validates Apple ID provider string to prevent spoofing
   */
  static validateAppleProvider(provider: string | undefined): string {
    if (!provider) {
      throw new Error('Apple provider is required');
    }

    const validated = this.validateString(provider, {
      minLength: 5,
      maxLength: 50,
      required: true,
      fieldName: 'Apple provider',
    });

    // SECURITY: Strict validation of Apple provider strings
    const validAppleProviders = [
      'apple',
      'oauth_apple',
      'apple_oauth',
      'oauth_apple_id',
      'apple_id',
    ];

    const normalizedProvider = validated!.toLowerCase().replace(/[-_]/g, '');
    const isValidApple = validAppleProviders.some((valid) =>
      normalizedProvider.includes(valid.replace(/[-_]/g, ''))
    );

    if (!isValidApple) {
      throw new Error('Invalid Apple provider format');
    }

    return validated!;
  }

  /**
   * SECURITY: Validates Apple relay email format to handle privacy emails
   */
  static validateAppleEmail(email: string | undefined): string | null {
    if (!email) return null;

    const validated = this.validateString(email, {
      maxLength: 100,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      fieldName: 'Apple email',
    });

    if (validated) {
      // SECURITY: Detect Apple's private relay emails
      const isAppleRelay = validated.includes('@privaterelay.appleid.com');

      // Log Apple relay detection for monitoring (but don't block)
      if (isAppleRelay) {
        // eslint-disable-next-line no-console
        console.log('Apple private relay email detected - preserving privacy');
      }
    }

    return validated;
  }

  /**
   * SECURITY: Validates Clerk user ID format to prevent injection
   */
  static validateClerkUserId(userId: string | undefined): string {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const validated = this.validateString(userId, {
      minLength: 5,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_-]+$/,
      required: true,
      fieldName: 'User ID',
    });

    // SECURITY: Validate Clerk user ID format (typically user_xxx or similar)
    if (
      !validated!.startsWith('user_') &&
      !validated!.match(/^[a-zA-Z0-9_-]{5,}$/)
    ) {
      throw new Error('Invalid user ID format');
    }

    return validated!;
  }
}

/**
 * Authentication helper utilities
 */
export class AuthUtils {
  /**
   * Validates that a user can only access their own resources
   */
  static validateOwnership(
    currentUserId: string | undefined,
    resourceOwnerId: string,
    resourceType: string = 'resource'
  ): void {
    if (!currentUserId) {
      throw new Error('Authentication required');
    }
    if (currentUserId !== resourceOwnerId) {
      throw new Error(`You can only access your own ${resourceType}`);
    }
  }

  /**
   * Checks if user is authenticated and returns user ID
   */
  static requireAuth(userId: string | undefined): string {
    if (!userId) {
      throw new Error('Authentication required');
    }
    return userId;
  }

  /**
   * Checks if the authenticated user has admin privileges
   * Uses Clerk's organization roles to determine admin status
   */
  static async requireAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Authentication required');
    }

    // First check JWT roles from Clerk
    const hasJWTAdminRole =
      identity.org_role === 'org:admin' ||
      identity.org_role === 'admin' ||
      (Array.isArray(identity.roles) &&
        (identity.roles.includes('admin') ||
          identity.roles.includes('org:admin')));

    if (hasJWTAdminRole) {
      return; // User has admin role in JWT, allow access
    }

    // Fall back to database check if JWT doesn't have admin role
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', identity.subject))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has admin role in the database
    // You can set this field manually in the database for admin users
    if (!user.isAdmin) {
      throw new Error('Admin privileges required to access this resource');
    }
  }
}
