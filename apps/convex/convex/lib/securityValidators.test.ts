import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityValidators, AuthUtils } from './securityValidators';

describe('SecurityValidators', () => {
  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Clear the rate limit store before each test
      (SecurityValidators as any).rateLimitStore.clear();
    });

    it('should allow requests within the rate limit', async () => {
      const userId = 'user123';
      const action = 'testAction';

      // Should not throw for the first request
      await expect(
        SecurityValidators.checkRateLimit(userId, action, 5, 60000)
      ).resolves.toBeUndefined();

      // Should not throw for subsequent requests within limit
      await expect(
        SecurityValidators.checkRateLimit(userId, action, 5, 60000)
      ).resolves.toBeUndefined();
    });

    it('should throw error when rate limit is exceeded', async () => {
      const userId = 'user123';
      const action = 'testAction';
      const maxRequests = 3;

      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        await SecurityValidators.checkRateLimit(
          userId,
          action,
          maxRequests,
          60000
        );
      }

      // The next request should throw an error
      await expect(
        SecurityValidators.checkRateLimit(userId, action, maxRequests, 60000)
      ).rejects.toThrow('Rate limit exceeded for testAction');
    });

    it('should reset rate limit after window expires', async () => {
      const userId = 'user123';
      const action = 'testAction';
      const maxRequests = 2;
      const windowMs = 100; // Short window for testing

      // Fill up the rate limit
      for (let i = 0; i < maxRequests; i++) {
        await SecurityValidators.checkRateLimit(
          userId,
          action,
          maxRequests,
          windowMs
        );
      }

      // Should throw when limit exceeded
      await expect(
        SecurityValidators.checkRateLimit(userId, action, maxRequests, windowMs)
      ).rejects.toThrow();

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, windowMs + 10));

      // Should allow requests again
      await expect(
        SecurityValidators.checkRateLimit(userId, action, maxRequests, windowMs)
      ).resolves.toBeUndefined();
    });

    it('should handle different users independently', async () => {
      const action = 'testAction';
      const maxRequests = 2;

      // User 1 fills their rate limit
      for (let i = 0; i < maxRequests; i++) {
        await SecurityValidators.checkRateLimit(
          'user1',
          action,
          maxRequests,
          60000
        );
      }

      // User 1 should be rate limited
      await expect(
        SecurityValidators.checkRateLimit('user1', action, maxRequests, 60000)
      ).rejects.toThrow();

      // User 2 should not be affected
      await expect(
        SecurityValidators.checkRateLimit('user2', action, maxRequests, 60000)
      ).resolves.toBeUndefined();
    });

    it('should handle different actions independently', async () => {
      const userId = 'user123';
      const maxRequests = 2;

      // Fill rate limit for action1
      for (let i = 0; i < maxRequests; i++) {
        await SecurityValidators.checkRateLimit(
          userId,
          'action1',
          maxRequests,
          60000
        );
      }

      // action1 should be rate limited
      await expect(
        SecurityValidators.checkRateLimit(userId, 'action1', maxRequests, 60000)
      ).rejects.toThrow();

      // action2 should not be affected
      await expect(
        SecurityValidators.checkRateLimit(userId, 'action2', maxRequests, 60000)
      ).resolves.toBeUndefined();
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
      const result = SecurityValidators.sanitizeHtml(html);
      expect(result).toBe('<p>Hello</p><p>World</p>');
    });

    it('should remove iframe tags', () => {
      const html = '<p>Content</p><iframe src="evil.com"></iframe>';
      const result = SecurityValidators.sanitizeHtml(html);
      expect(result).toBe('<p>Content</p>');
    });

    it('should remove javascript: protocols', () => {
      const html = '<a href="javascript:alert(1)">Click me</a>';
      const result = SecurityValidators.sanitizeHtml(html);
      expect(result).toBe('<a href="alert(1)">Click me</a>');
    });

    it('should remove event handlers', () => {
      const html = '<button onclick="alert(1)">Click</button>';
      const result = SecurityValidators.sanitizeHtml(html);
      expect(result).toBe('<button "alert(1)">Click</button>');
    });

    it('should handle multiple threats in one string', () => {
      const html = `
        <p>Safe content</p>
        <script>alert("xss")</script>
        <div onclick="evil()">Click me</div>
        <a href="javascript:alert(1)">Link</a>
        <iframe src="evil.com"></iframe>
      `;
      const result = SecurityValidators.sanitizeHtml(html);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('<iframe>');
      expect(result).toContain('<p>Safe content</p>');
    });
  });

  describe('validateUsername', () => {
    it('should validate valid usernames including Latin characters', () => {
      expect(SecurityValidators.validateUsername('testuser')).toBe('testuser');
      expect(SecurityValidators.validateUsername('test_user')).toBe(
        'test_user'
      );
      expect(SecurityValidators.validateUsername('test-user')).toBe(
        'test-user'
      );
      expect(SecurityValidators.validateUsername('user123')).toBe('user123');

      // Test Latin-based characters (Clerk compatibility)
      expect(SecurityValidators.validateUsername('josé')).toBe('josé');
      expect(SecurityValidators.validateUsername('andré')).toBe('andré');
      expect(SecurityValidators.validateUsername('müller')).toBe('müller');
      expect(SecurityValidators.validateUsername('søren')).toBe('søren');
      expect(SecurityValidators.validateUsername('françois')).toBe('françois');
    });

    it('should reject invalid usernames', () => {
      expect(() => SecurityValidators.validateUsername('ab')).toThrow(
        'Username must be at least 3 characters long'
      );

      expect(() => SecurityValidators.validateUsername('a'.repeat(31))).toThrow(
        'Username must be no more than 30 characters long'
      );

      expect(() => SecurityValidators.validateUsername('user@name')).toThrow(
        'Username format is invalid'
      );

      expect(() => SecurityValidators.validateUsername('user name')).toThrow(
        'Username format is invalid'
      );

      expect(() => SecurityValidators.validateUsername('user.name')).toThrow(
        'Username format is invalid'
      );

      // Still reject emojis and other non-Latin scripts
      expect(() => SecurityValidators.validateUsername('user😀')).toThrow(
        'Username format is invalid'
      );

      expect(() => SecurityValidators.validateUsername('用户名')).toThrow(
        'Username format is invalid'
      );
    });

    it('should return null for empty/undefined usernames', () => {
      expect(SecurityValidators.validateUsername(undefined)).toBeNull();
      expect(SecurityValidators.validateUsername('')).toBeNull();
    });
  });
});

describe('AuthUtils', () => {
  describe('requireAdmin', () => {
    it('should throw error when no identity is found', async () => {
      const mockCtx = {
        auth: {
          getUserIdentity: vi.fn().mockResolvedValue(null),
        },
      };

      await expect(AuthUtils.requireAdmin(mockCtx)).rejects.toThrow(
        'Authentication required'
      );
    });

    it('should throw error when user has no admin role', async () => {
      const mockCtx = {
        auth: {
          getUserIdentity: vi.fn().mockResolvedValue({
            subject: 'user123',
            org_role: 'member',
            roles: ['user'],
          }),
        },
      };

      await expect(AuthUtils.requireAdmin(mockCtx)).rejects.toThrow(
        'Admin privileges required'
      );
    });

    it('should pass when user has org:admin role', async () => {
      const mockCtx = {
        auth: {
          getUserIdentity: vi.fn().mockResolvedValue({
            subject: 'user123',
            org_role: 'org:admin',
            roles: ['user'],
          }),
        },
      };

      await expect(AuthUtils.requireAdmin(mockCtx)).resolves.toBeUndefined();
    });

    it('should pass when user has admin in roles array', async () => {
      const mockCtx = {
        auth: {
          getUserIdentity: vi.fn().mockResolvedValue({
            subject: 'user123',
            org_role: 'member',
            roles: ['user', 'admin'],
          }),
        },
      };

      await expect(AuthUtils.requireAdmin(mockCtx)).resolves.toBeUndefined();
    });

    it('should pass when user has org:admin in roles array', async () => {
      const mockCtx = {
        auth: {
          getUserIdentity: vi.fn().mockResolvedValue({
            subject: 'user123',
            org_role: 'member',
            roles: ['user', 'org:admin'],
          }),
        },
      };

      await expect(AuthUtils.requireAdmin(mockCtx)).resolves.toBeUndefined();
    });

    it('should handle missing roles array gracefully', async () => {
      const mockCtx = {
        auth: {
          getUserIdentity: vi.fn().mockResolvedValue({
            subject: 'user123',
            org_role: 'member',
            // roles array is missing
          }),
        },
      };

      await expect(AuthUtils.requireAdmin(mockCtx)).rejects.toThrow(
        'Admin privileges required'
      );
    });
  });

  describe('validateOwnership', () => {
    it('should throw error when current user ID is undefined', () => {
      expect(() => {
        AuthUtils.validateOwnership(undefined, 'owner123', 'resource');
      }).toThrow('Authentication required');
    });

    it('should throw error when user does not own resource', () => {
      expect(() => {
        AuthUtils.validateOwnership('user123', 'owner456', 'document');
      }).toThrow('You can only access your own document');
    });

    it('should pass when user owns the resource', () => {
      expect(() => {
        AuthUtils.validateOwnership('user123', 'user123', 'document');
      }).not.toThrow();
    });
  });

  describe('requireAuth', () => {
    it('should throw error when user ID is undefined', () => {
      expect(() => {
        AuthUtils.requireAuth(undefined);
      }).toThrow('Authentication required');
    });

    it('should return user ID when provided', () => {
      const userId = 'user123';
      const result = AuthUtils.requireAuth(userId);
      expect(result).toBe(userId);
    });
  });
});
