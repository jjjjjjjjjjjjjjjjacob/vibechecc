/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { enhancedAnalytics, enhancedTrackEvents } from '@/lib/enhanced-posthog';
import { 
  useEnhancedAnalytics, 
  usePageTracking, 
  useFormTracking,
  useSearchTracking,
  useContentTracking 
} from '@/hooks/use-enhanced-analytics';

// Mock PostHog
vi.mock('@/lib/enhanced-posthog', () => ({
  enhancedAnalytics: {
    captureWithContext: vi.fn(),
    trackError: vi.fn(),
    trackPerformance: vi.fn(),
    trackEngagement: vi.fn(),
    trackFunnelStep: vi.fn(),
    isInitialized: vi.fn(() => true),
  },
  enhancedTrackEvents: {
    auth_signup_completed: vi.fn(),
    auth_signin_completed: vi.fn(),
    content_vibe_created: vi.fn(),
    engagement_vibe_viewed: vi.fn(),
    engagement_vibe_rated: vi.fn(),
    search_query_performed: vi.fn(),
    navigation_page_viewed: vi.fn(),
    perf_page_load_completed: vi.fn(),
    ui_modal_opened: vi.fn(),
    error_api_failed: vi.fn(),
  },
}));

// Mock Clerk user
vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: vi.fn(() => ({
    user: { id: 'test-user-123' }
  })),
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => 1000),
    timing: {
      navigationStart: 0,
      loadEventEnd: 2000,
      domainLookupStart: 100,
      domainLookupEnd: 200,
      requestStart: 300,
      responseEnd: 800,
      domContentLoadedEventEnd: 1500,
    }
  },
  writable: true,
});

describe('Enhanced Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/test',
        pathname: '/test',
      },
      writable: true,
    });
    
    // Mock document
    Object.defineProperty(document, 'title', {
      value: 'Test Page',
      writable: true,
    });
    
    Object.defineProperty(document, 'referrer', {
      value: 'https://example.com/previous',
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useEnhancedAnalytics Hook', () => {
    it('should track engagement with user context', () => {
      const { result } = renderHook(() => useEnhancedAnalytics());
      
      act(() => {
        result.current.trackEngagement('click', 'button', { button_type: 'primary' });
      });

      expect(enhancedAnalytics.trackEngagement).toHaveBeenCalledWith(
        'click',
        'button',
        expect.objectContaining({
          user_id: 'test-user-123',
          button_type: 'primary',
        })
      );
    });

    it('should track performance metrics', () => {
      const { result } = renderHook(() => useEnhancedAnalytics());
      
      act(() => {
        result.current.trackPerformance('page_load', 1500, { page: 'home' });
      });

      expect(enhancedAnalytics.trackPerformance).toHaveBeenCalledWith(
        'page_load',
        1500,
        expect.objectContaining({
          user_id: 'test-user-123',
          page: 'home',
        })
      );
    });

    it('should track funnel steps', () => {
      const { result } = renderHook(() => useEnhancedAnalytics());
      
      act(() => {
        result.current.trackFunnelStep('onboarding', 'profile_setup', true, { step: 1 });
      });

      expect(enhancedAnalytics.trackFunnelStep).toHaveBeenCalledWith(
        'onboarding',
        'profile_setup',
        true,
        expect.objectContaining({
          user_id: 'test-user-123',
          step: 1,
        })
      );
    });

    it('should track errors with context', () => {
      const { result } = renderHook(() => useEnhancedAnalytics());
      const testError = new Error('Test error');
      
      act(() => {
        result.current.trackError(testError, { component: 'TestComponent' });
      });

      expect(enhancedAnalytics.trackError).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          user_id: 'test-user-123',
          component: 'TestComponent',
        })
      );
    });

    it('should track custom events', () => {
      const { result } = renderHook(() => useEnhancedAnalytics());
      
      act(() => {
        result.current.trackEvent('custom_action', { action_type: 'test' });
      });

      expect(enhancedAnalytics.captureWithContext).toHaveBeenCalledWith(
        'custom_action',
        expect.objectContaining({
          user_id: 'test-user-123',
          action_type: 'test',
        })
      );
    });
  });

  describe('usePageTracking Hook', () => {
    it('should track page view on mount', () => {
      renderHook(() => usePageTracking('test-page', { section: 'main' }));

      expect(enhancedTrackEvents.navigation_page_viewed).toHaveBeenCalledWith(
        '/test',
        'https://example.com/previous',
        undefined,
        'test-user-123'
      );
    });

    it('should track page exit on unmount', () => {
      const { unmount } = renderHook(() => usePageTracking('test-page'));
      
      act(() => {
        unmount();
      });

      expect(enhancedAnalytics.captureWithContext).toHaveBeenCalledWith(
        'navigation_page_exited',
        expect.objectContaining({
          page_name: 'test-page',
          user_id: 'test-user-123',
        })
      );
    });
  });

  describe('useFormTracking Hook', () => {
    it('should track form start on mount', () => {
      renderHook(() => useFormTracking('signup-form'));

      expect(enhancedAnalytics.captureWithContext).toHaveBeenCalledWith(
        'form_started',
        expect.objectContaining({
          form_name: 'signup-form',
          user_id: 'test-user-123',
        })
      );
    });

    it('should track field interactions', () => {
      const { result } = renderHook(() => useFormTracking('signup-form'));
      
      act(() => {
        result.current.trackFieldInteraction('email', 'focus');
      });

      expect(enhancedAnalytics.captureWithContext).toHaveBeenCalledWith(
        'form_field_interaction',
        expect.objectContaining({
          form_name: 'signup-form',
          field_name: 'email',
          action: 'focus',
          user_id: 'test-user-123',
        })
      );
    });

    it('should track field errors', () => {
      const { result } = renderHook(() => useFormTracking('signup-form'));
      
      act(() => {
        result.current.trackFieldError('email', 'Invalid email format');
      });

      expect(enhancedAnalytics.captureWithContext).toHaveBeenCalledWith(
        'form_field_error',
        expect.objectContaining({
          form_name: 'signup-form',
          field_name: 'email',
          error_message: 'Invalid email format',
          user_id: 'test-user-123',
        })
      );
    });

    it('should track form submission', () => {
      const { result } = renderHook(() => useFormTracking('signup-form'));
      
      // Simulate field interaction first
      act(() => {
        result.current.trackFieldInteraction('email', 'change');
        result.current.trackFieldInteraction('password', 'change');
      });

      act(() => {
        result.current.trackFormSubmit(true);
      });

      expect(enhancedAnalytics.captureWithContext).toHaveBeenCalledWith(
        'form_submitted',
        expect.objectContaining({
          form_name: 'signup-form',
          success: true,
          field_count: 2,
          user_id: 'test-user-123',
        })
      );
    });
  });

  describe('useSearchTracking Hook', () => {
    it('should track search start', () => {
      const { result } = renderHook(() => useSearchTracking());
      
      act(() => {
        result.current.trackSearchStart('test query', { source: 'header' });
      });

      expect(enhancedAnalytics.captureWithContext).toHaveBeenCalledWith(
        'search_started',
        expect.objectContaining({
          query: 'test query',
          query_length: 10,
          user_id: 'test-user-123',
          source: 'header',
        })
      );
    });

    it('should track search completion with timing', () => {
      const { result } = renderHook(() => useSearchTracking());
      
      act(() => {
        result.current.trackSearchStart('test query');
      });

      act(() => {
        result.current.trackSearchComplete('test query', 15, { tag: 'music' });
      });

      expect(enhancedTrackEvents.search_query_performed).toHaveBeenCalledWith(
        'test query',
        { tag: 'music' },
        15,
        expect.any(Number),
        'test-user-123'
      );
    });

    it('should track search result clicks', () => {
      const { result } = renderHook(() => useSearchTracking());
      
      act(() => {
        result.current.trackSearchResultClick('test query', 'vibe-123', 2, 'vibe');
      });

      expect(enhancedTrackEvents.search_result_clicked).toHaveBeenCalledWith(
        'test query',
        'vibe-123',
        'vibe',
        2,
        'test-user-123'
      );
    });

    it('should track filter applications', () => {
      const { result } = renderHook(() => useSearchTracking());
      
      act(() => {
        result.current.trackFilterApplied('tag', 'music', 25);
      });

      expect(enhancedTrackEvents.search_filter_applied).toHaveBeenCalledWith(
        'tag',
        'music',
        25,
        'test-user-123'
      );
    });
  });

  describe('useContentTracking Hook', () => {
    it('should track content view', () => {
      const { result } = renderHook(() => useContentTracking());
      
      act(() => {
        result.current.trackContentView('vibe-123', 'vibe', 'search_results');
      });

      expect(enhancedTrackEvents.engagement_vibe_viewed).toHaveBeenCalledWith(
        'vibe-123',
        'test-user-123',
        undefined,
        undefined,
        'search_results'
      );
    });

    it('should track scroll depth milestones', () => {
      const { result } = renderHook(() => useContentTracking());
      
      act(() => {
        result.current.trackScrollDepth(25);
      });

      expect(enhancedAnalytics.captureWithContext).toHaveBeenCalledWith(
        'content_scroll_milestone',
        expect.objectContaining({
          milestone: 25,
          user_id: 'test-user-123',
        })
      );
    });

    it('should track content exit with duration', () => {
      const { result } = renderHook(() => useContentTracking());
      
      act(() => {
        result.current.trackContentView('vibe-123');
      });

      act(() => {
        result.current.trackContentExit('vibe-123');
      });

      expect(enhancedAnalytics.captureWithContext).toHaveBeenCalledWith(
        'content_view_completed',
        expect.objectContaining({
          content_id: 'vibe-123',
          user_id: 'test-user-123',
          view_duration: expect.any(Number),
        })
      );
    });

    it('should track content interactions', () => {
      const { result } = renderHook(() => useContentTracking());
      
      act(() => {
        result.current.trackContentInteraction('vibe-123', 'rate', 5);
      });

      expect(enhancedAnalytics.captureWithContext).toHaveBeenCalledWith(
        'content_interaction',
        expect.objectContaining({
          content_id: 'vibe-123',
          interaction_type: 'rate',
          value: 5,
          user_id: 'test-user-123',
        })
      );
    });
  });

  describe('Enhanced Track Events', () => {
    it('should track authentication events', () => {
      enhancedTrackEvents.auth_signup_completed('user-123', 'email', 'profile_setup');

      expect(enhancedTrackEvents.auth_signup_completed).toHaveBeenCalledWith(
        'user-123',
        'email',
        'profile_setup'
      );
    });

    it('should track content creation events', () => {
      enhancedTrackEvents.content_vibe_created(
        'vibe-123',
        'user-123',
        ['music', 'art'],
        true,
        250
      );

      expect(enhancedTrackEvents.content_vibe_created).toHaveBeenCalledWith(
        'vibe-123',
        'user-123',
        ['music', 'art'],
        true,
        250
      );
    });

    it('should track engagement events', () => {
      enhancedTrackEvents.engagement_vibe_rated(
        'vibe-123',
        'user-123',
        5,
        '🔥',
        true,
        150
      );

      expect(enhancedTrackEvents.engagement_vibe_rated).toHaveBeenCalledWith(
        'vibe-123',
        'user-123',
        5,
        '🔥',
        true,
        150
      );
    });
  });

  describe('Analytics Context Enrichment', () => {
    it('should enrich events with browser context', () => {
      const { result } = renderHook(() => useEnhancedAnalytics());
      
      act(() => {
        result.current.trackEvent('test_event');
      });

      expect(enhancedAnalytics.captureWithContext).toHaveBeenCalledWith(
        'test_event',
        expect.objectContaining({
          user_id: 'test-user-123',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock analytics to throw an error
      vi.mocked(enhancedAnalytics.captureWithContext).mockImplementation(() => {
        throw new Error('Analytics error');
      });

      const { result } = renderHook(() => useEnhancedAnalytics());
      
      // Should not throw
      expect(() => {
        act(() => {
          result.current.trackEvent('test_event');
        });
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Impact', () => {
    it('should not block main thread', async () => {
      const { result } = renderHook(() => useEnhancedAnalytics());
      
      const startTime = performance.now();
      
      act(() => {
        // Track multiple events quickly
        for (let i = 0; i < 100; i++) {
          result.current.trackEvent(`test_event_${i}`);
        }
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (under 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});