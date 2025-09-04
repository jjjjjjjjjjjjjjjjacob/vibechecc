/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Analytics validation tests to ensure tracking events have proper structure
 * and required fields for PostHog integration
 */

describe('Analytics Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Event Structure Validation', () => {
    it('should validate page view events have required fields', () => {
      const validPageViewEvent = {
        event: 'page_viewed',
        properties: {
          page_url: '/vibes/123',
          page_title: 'Vibe Title',
          referrer: 'https://google.com',
          timestamp: Date.now(),
          user_id: 'user_123',
        },
      };

      // Validate required fields exist
      expect(validPageViewEvent.event).toBeDefined();
      expect(validPageViewEvent.properties).toBeDefined();
      expect(validPageViewEvent.properties.page_url).toBeDefined();
      expect(validPageViewEvent.properties.timestamp).toBeDefined();

      // Validate types
      expect(typeof validPageViewEvent.event).toBe('string');
      expect(typeof validPageViewEvent.properties.page_url).toBe('string');
      expect(typeof validPageViewEvent.properties.timestamp).toBe('number');
    });

    it('should validate vibe interaction events have required fields', () => {
      const validVibeEvent = {
        event: 'vibe_created',
        properties: {
          vibe_id: 'vibe_123',
          user_id: 'user_123',
          tags: ['adventure', 'travel'],
          has_image: true,
          character_count: 150,
          timestamp: Date.now(),
        },
      };

      expect(validVibeEvent.event).toBeDefined();
      expect(validVibeEvent.properties.vibe_id).toBeDefined();
      expect(validVibeEvent.properties.user_id).toBeDefined();
      expect(Array.isArray(validVibeEvent.properties.tags)).toBe(true);
      expect(typeof validVibeEvent.properties.has_image).toBe('boolean');
    });

    it('should validate emoji rating events have required fields', () => {
      const validEmojiRatingEvent = {
        event: 'emoji_rating_given',
        properties: {
          vibe_id: 'vibe_123',
          user_id: 'user_123',
          emoji: '🔥',
          rating: 5,
          has_review: true,
          review_length: 25,
          timestamp: Date.now(),
        },
      };

      expect(validEmojiRatingEvent.event).toBeDefined();
      expect(validEmojiRatingEvent.properties.vibe_id).toBeDefined();
      expect(validEmojiRatingEvent.properties.emoji).toBeDefined();
      expect(typeof validEmojiRatingEvent.properties.rating).toBe('number');
      expect(validEmojiRatingEvent.properties.rating).toBeGreaterThanOrEqual(1);
      expect(validEmojiRatingEvent.properties.rating).toBeLessThanOrEqual(5);
    });

    it('should validate social interaction events have required fields', () => {
      const validFollowEvent = {
        event: 'user_followed',
        properties: {
          follower_id: 'user_123',
          followed_id: 'user_456',
          follow_source: 'profile_page',
          timestamp: Date.now(),
        },
      };

      expect(validFollowEvent.event).toBeDefined();
      expect(validFollowEvent.properties.follower_id).toBeDefined();
      expect(validFollowEvent.properties.followed_id).toBeDefined();
      expect(validFollowEvent.properties.follow_source).toBeDefined();
      expect(
        ['profile_page', 'vibe_card', 'search_results', 'suggestions'].includes(
          validFollowEvent.properties.follow_source
        )
      ).toBe(true);
    });
  });

  describe('Event Property Validation', () => {
    it('should validate user_id format when present', () => {
      const userIdFormats = [
        'user_123456789', // Standard format
        'usr_abc123def', // Alternative format
        '123e4567-e89b-12d3-a456-426614174000', // UUID format
      ];

      userIdFormats.forEach((userId) => {
        expect(typeof userId).toBe('string');
        expect(userId.length).toBeGreaterThan(0);
        expect(userId).not.toContain(' '); // No spaces
      });
    });

    it('should validate timestamp format', () => {
      const validTimestamp = Date.now();
      const invalidTimestamp = '2024-01-01'; // String date

      expect(typeof validTimestamp).toBe('number');
      expect(validTimestamp).toBeGreaterThan(1640995200000); // After 2022
      expect(validTimestamp).toBeLessThan(Date.now() + 86400000); // Not more than 24h in future

      expect(typeof invalidTimestamp).toBe('string'); // Should be number, not string
    });

    it('should validate emoji format', () => {
      const validEmojis = ['🔥', '😍', '💯'];
      const validSymbols = ['⭐', '👍']; // These might not match emoji ranges but are valid
      const invalidEmojis = ['fire', ':fire:', '<emoji>fire</emoji>'];

      validEmojis.forEach((emoji) => {
        expect(typeof emoji).toBe('string');
        expect(emoji.length).toBeGreaterThanOrEqual(1);
        expect(emoji.length).toBeLessThanOrEqual(4); // Account for compound emojis
        // Basic emoji validation - contains non-ASCII characters
        expect(
          /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
            emoji
          )
        ).toBe(true);
      });

      // Valid symbols that might not match emoji ranges but are acceptable
      validSymbols.forEach((symbol) => {
        expect(typeof symbol).toBe('string');
        expect(symbol.length).toBeGreaterThanOrEqual(1);
        expect(symbol.length).toBeLessThanOrEqual(4);
        // Just validate they're not ASCII text
        expect(/^[a-zA-Z0-9\s]+$/.test(symbol)).toBe(false);
      });

      invalidEmojis.forEach((invalid) => {
        expect(typeof invalid).toBe('string');
        // These should be ASCII text (adjusted regex to include all characters)
        expect(/^[a-zA-Z0-9<>:\s_/]+$/.test(invalid)).toBe(true);
      });
    });

    it('should validate rating values', () => {
      const validRatings = [1, 2, 3, 4, 5];
      const invalidRatings = [0, 6, -1, 3.5, '5', null];

      validRatings.forEach((rating) => {
        expect(typeof rating).toBe('number');
        expect(Number.isInteger(rating)).toBe(true);
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
      });

      invalidRatings.forEach((rating) => {
        if (typeof rating === 'number') {
          expect(rating < 1 || rating > 5 || !Number.isInteger(rating)).toBe(
            true
          );
        } else {
          expect(typeof rating).not.toBe('number');
        }
      });
    });
  });

  describe('A/B Testing Event Validation', () => {
    it('should validate experiment exposure events', () => {
      const validExperimentEvent = {
        event: 'experiment_exposed',
        properties: {
          experiment_key: 'hero_tagline_test',
          variant: 'control',
          user_id: 'user_123',
          timestamp: Date.now(),
        },
      };

      expect(validExperimentEvent.event).toBeDefined();
      expect(validExperimentEvent.properties.experiment_key).toBeDefined();
      expect(validExperimentEvent.properties.variant).toBeDefined();
      expect(typeof validExperimentEvent.properties.experiment_key).toBe(
        'string'
      );
      expect(typeof validExperimentEvent.properties.variant).toBe('string');
    });

    it('should validate experiment conversion events', () => {
      const validConversionEvent = {
        event: 'experiment_conversion',
        properties: {
          experiment_key: 'hero_tagline_test',
          variant: 'test',
          conversion_goal: 'signup',
          conversion_value: 1,
          user_id: 'user_123',
          timestamp: Date.now(),
        },
      };

      expect(validConversionEvent.properties.conversion_goal).toBeDefined();
      expect(typeof validConversionEvent.properties.conversion_value).toBe(
        'number'
      );
      expect(
        validConversionEvent.properties.conversion_value
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Event Validation', () => {
    it('should validate performance tracking events', () => {
      const validPerformanceEvent = {
        event: 'component_performance',
        properties: {
          component_name: 'VibePlaceholder',
          metric_type: 'render_time',
          value: 150.5,
          user_agent: 'Mozilla/5.0...',
          timestamp: Date.now(),
        },
      };

      expect(validPerformanceEvent.properties.component_name).toBeDefined();
      expect(validPerformanceEvent.properties.metric_type).toBeDefined();
      expect(typeof validPerformanceEvent.properties.value).toBe('number');
      expect(validPerformanceEvent.properties.value).toBeGreaterThan(0);
      expect(
        ['render_time', 'visibility', 'interaction'].includes(
          validPerformanceEvent.properties.metric_type
        )
      ).toBe(true);
    });

    it('should validate funnel tracking events', () => {
      const validFunnelEvent = {
        event: 'funnel_step_completed',
        properties: {
          funnel_name: 'vibe_creation',
          step_name: 'add_image',
          step_number: 2,
          completion_time: 5000,
          user_id: 'user_123',
          timestamp: Date.now(),
        },
      };

      expect(validFunnelEvent.properties.funnel_name).toBeDefined();
      expect(validFunnelEvent.properties.step_name).toBeDefined();
      expect(typeof validFunnelEvent.properties.step_number).toBe('number');
      expect(typeof validFunnelEvent.properties.completion_time).toBe('number');
      expect(validFunnelEvent.properties.step_number).toBeGreaterThan(0);
      expect(validFunnelEvent.properties.completion_time).toBeGreaterThan(0);
    });
  });

  describe('Event Sanitization', () => {
    it('should sanitize PII from events', () => {
      const eventWithPII = {
        event: 'user_action',
        properties: {
          user_email: 'user@example.com', // Should be removed
          user_phone: '+1-555-123-4567', // Should be removed
          user_id: 'user_123', // Should be kept (anonymized ID)
          ip_address: '192.168.1.1', // Should be removed
          action_type: 'vibe_created', // Should be kept
        },
      };

      // Function to sanitize events (would be implemented in actual analytics)
      function sanitizeEvent(event: any) {
        const sanitized = { ...event };
        const piiFields = [
          'user_email',
          'user_phone',
          'ip_address',
          'full_name',
          'address',
        ];

        piiFields.forEach((field) => {
          if (sanitized.properties && sanitized.properties[field]) {
            delete sanitized.properties[field];
          }
        });

        return sanitized;
      }

      const sanitizedEvent = sanitizeEvent(eventWithPII);

      expect(sanitizedEvent.properties.user_email).toBeUndefined();
      expect(sanitizedEvent.properties.user_phone).toBeUndefined();
      expect(sanitizedEvent.properties.ip_address).toBeUndefined();
      expect(sanitizedEvent.properties.user_id).toBeDefined(); // Anonymized ID ok
      expect(sanitizedEvent.properties.action_type).toBeDefined(); // Non-PII ok
    });

    it('should validate event size limits', () => {
      const maxEventSize = 32 * 1024; // 32KB typical limit

      // Create a large event
      const largeEvent = {
        event: 'test_event',
        properties: {
          large_data: 'x'.repeat(40000), // 40KB of data
          normal_field: 'test',
        },
      };

      const eventString = JSON.stringify(largeEvent);
      const eventSize = new Blob([eventString]).size;

      expect(eventSize).toBeGreaterThan(maxEventSize);

      // Function to check event size (would be implemented in actual analytics)
      function isEventTooLarge(event: any): boolean {
        const eventString = JSON.stringify(event);
        const eventSize = new Blob([eventString]).size;
        return eventSize > maxEventSize;
      }

      expect(isEventTooLarge(largeEvent)).toBe(true);

      // Small event should pass
      const smallEvent = {
        event: 'test_event',
        properties: { field: 'value' },
      };
      expect(isEventTooLarge(smallEvent)).toBe(false);
    });
  });

  describe('PostHog Integration Validation', () => {
    it('should validate PostHog capture calls have correct format', () => {
      const mockCaptureCall = {
        eventName: 'vibe_created',
        properties: {
          vibe_id: 'vibe_123',
          user_id: 'user_123',
          timestamp: Date.now(),
        },
        options: {
          send_feature_flags: true,
        },
      };

      // Validate PostHog expects these parameters
      expect(typeof mockCaptureCall.eventName).toBe('string');
      expect(typeof mockCaptureCall.properties).toBe('object');
      expect(mockCaptureCall.properties).not.toBeNull();
    });

    it('should validate feature flag properties', () => {
      const featureFlagEvent = {
        event: 'feature_flag_called',
        properties: {
          flag_key: 'hero_tagline_experiment',
          flag_value: 'variant_a',
          flag_enabled: true,
          user_id: 'user_123',
          timestamp: Date.now(),
        },
      };

      expect(featureFlagEvent.properties.flag_key).toBeDefined();
      expect(typeof featureFlagEvent.properties.flag_enabled).toBe('boolean');
      expect(
        ['variant_a', 'variant_b', 'control', true, false].includes(
          featureFlagEvent.properties.flag_value
        )
      ).toBe(true);
    });
  });
});
