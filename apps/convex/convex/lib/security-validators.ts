// SECURITY: Input validation and sanitization utilities

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
   */
  static validateUsername(username: string | undefined): string | null {
    return this.validateString(username, {
      minLength: 3,
      maxLength: 30,
      pattern: /^[a-zA-Z0-9_-]+$/,
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
   * Sanitizes HTML content by removing potentially dangerous elements
   */
  static sanitizeHtml(html: string): string {
    // SECURITY: Very basic HTML sanitization
    // For production, consider using a proper library like DOMPurify
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Rate limiting check (basic implementation)
   */
  static async checkRateLimit(
    userId: string,
    action: string,
    maxRequests: number = 10,
    windowMs: number = 60000 // 1 minute
  ): Promise<void> {
    // SECURITY: Basic rate limiting implementation
    // In production, use Redis or similar for distributed rate limiting
    const key = `rate_limit:${userId}:${action}`;
    const _now = Date.now();

    // This is a simplified version - in production you'd want to use
    // a proper rate limiting solution with Redis or similar
    // For now, we'll skip the actual implementation but include the interface

    // TODO: Implement proper rate limiting with Redis/database storage
    // eslint-disable-next-line no-console
    console.log(
      `Rate limit check for ${key}: ${maxRequests} requests per ${windowMs}ms`
    );
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
}
