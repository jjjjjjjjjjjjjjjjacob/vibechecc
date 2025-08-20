/// <reference lib="dom" />

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { surveyManager, trackSurveyEvents } from '@/lib/survey-manager';
import posthog from 'posthog-js';

// Mock PostHog
vi.mock('posthog-js', () => ({
  default: {
    isFeatureEnabled: vi.fn(),
    setPersonProperties: vi.fn(),
    capture: vi.fn(),
  },
}));

const mockPostHog = posthog as any;

describe('SurveyManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset mocks to their default behavior
    mockPostHog.setPersonProperties.mockImplementation(() => {});
    mockPostHog.capture.mockImplementation(() => {});
    mockPostHog.isFeatureEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('triggerNewUserSurvey', () => {
    it('should set user properties and track trigger event', async () => {
      await surveyManager.triggerNewUserSurvey('user123', 'test@example.com');

      expect(mockPostHog.setPersonProperties).toHaveBeenCalledWith({
        is_new_user: true,
        signup_date: expect.any(String),
        survey_eligible: true,
      });

      expect(mockPostHog.capture).toHaveBeenCalledWith('survey_triggered', {
        survey_type: 'new_user_onboarding',
        user_id: 'user123',
        trigger_method: 'post_signup',
      });
    });

    it('should handle errors gracefully', async () => {
      mockPostHog.setPersonProperties.mockImplementation(() => {
        throw new Error('Network error');
      });

      await surveyManager.triggerNewUserSurvey('user123');

      expect(mockPostHog.capture).toHaveBeenCalledWith('survey_error', {
        error_type: 'trigger_failed',
        error_message: 'Network error',
        survey_type: 'new_user_onboarding',
      });
    });
  });

  describe('recordSurveyResponse', () => {
    const mockResponses = {
      discoveryChannel: 'social_media',
    };

    it('should record survey completion and set user properties', () => {
      surveyManager.recordSurveyResponse(mockResponses, 'user123');

      expect(mockPostHog.capture).toHaveBeenCalledWith('survey_completed', {
        survey_type: 'new_user_onboarding',
        user_id: 'user123',
        responses: mockResponses,
        completion_date: expect.any(String),
      });

      expect(mockPostHog.setPersonProperties).toHaveBeenCalledWith({
        discovery_channel: 'social_media',
        survey_completed: true,
        survey_completion_date: expect.any(String),
      });
    });

    it('should track discovery insights', () => {
      surveyManager.recordSurveyResponse(mockResponses, 'user123');

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        'user_discovery_channel',
        {
          channel: 'social_media',
        }
      );
    });

    it('should handle errors gracefully', () => {
      // Create a spy that throws on first call, succeeds on second
      let callCount = 0;
      mockPostHog.capture.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network error');
        }
      });

      surveyManager.recordSurveyResponse(mockResponses, 'user123');

      // The error handling code should capture the error
      expect(mockPostHog.capture).toHaveBeenCalledWith('survey_error', {
        error_type: 'response_recording_failed',
        error_message: 'Network error',
      });
    });
  });

  describe('recordSurveyDismissed', () => {
    it('should track survey dismissal', () => {
      surveyManager.recordSurveyDismissed('user123', 'skipped');

      expect(mockPostHog.capture).toHaveBeenCalledWith('survey_dismissed', {
        survey_type: 'new_user_onboarding',
        user_id: 'user123',
        dismissal_reason: 'skipped',
        dismissal_date: expect.any(String),
      });
    });

    it('should use default reason when none provided', () => {
      surveyManager.recordSurveyDismissed('user123');

      expect(mockPostHog.capture).toHaveBeenCalledWith('survey_dismissed', {
        survey_type: 'new_user_onboarding',
        user_id: 'user123',
        dismissal_reason: 'closed',
        dismissal_date: expect.any(String),
      });
    });
  });

  describe('isEligibleForNewUserSurvey', () => {
    it('should return true when feature flag is enabled', () => {
      mockPostHog.isFeatureEnabled.mockReturnValue(true);

      expect(surveyManager.isEligibleForNewUserSurvey()).toBe(true);
    });

    it('should return false when feature flag is disabled', () => {
      mockPostHog.isFeatureEnabled.mockReturnValue(false);

      expect(surveyManager.isEligibleForNewUserSurvey()).toBe(false);
    });
  });

  describe('trackSurveyEvents', () => {
    it('should provide wrapper functions for survey events', () => {
      expect(typeof trackSurveyEvents.triggerNewUserSurvey).toBe('function');
      expect(typeof trackSurveyEvents.recordResponse).toBe('function');
      expect(typeof trackSurveyEvents.recordDismissed).toBe('function');
    });
  });
});
