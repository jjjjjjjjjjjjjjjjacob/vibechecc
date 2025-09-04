import posthog from 'posthog-js';

export interface NewUserSurveyData {
  discoveryChannel: string;
}

export interface SurveyConfig {
  surveyId: string;
  delayMs: number;
  maxShowAttempts: number;
}

/**
 * Manager for PostHog surveys and custom survey logic
 */
class SurveyManager {
  private readonly DEFAULT_CONFIG: SurveyConfig = {
    surveyId: 'new-user-onboarding-survey',
    delayMs: 30000, // 30 seconds
    maxShowAttempts: 3,
  };

  /**
   * Triggers the new user survey for recently signed up users
   */
  async triggerNewUserSurvey(userId: string): Promise<void> {
    if (typeof window === 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('PostHog not initialized, cannot trigger survey');
      return;
    }

    try {
      // Set user properties that can be used for survey targeting
      posthog.setPersonProperties({
        is_new_user: true,
        signup_date: new Date().toISOString(),
        survey_eligible: true,
      });

      // Track survey trigger event
      posthog.capture('survey_triggered', {
        survey_type: 'new_user_onboarding',
        user_id: userId,
        trigger_method: 'post_signup',
      });

      // Use PostHog's survey API to show survey
      // Note: This requires PostHog surveys to be enabled in your project
      // PostHog instance is available globally as 'posthog'

      // Set a delay before showing the survey
      setTimeout(() => {
        this.showSurveyIfEligible(userId);
      }, this.DEFAULT_CONFIG.delayMs);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to trigger new user survey:', error);
      posthog.capture('survey_error', {
        error_type: 'trigger_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        survey_type: 'new_user_onboarding',
      });
    }
  }

  /**
   * Shows the survey if the user is eligible
   * This method prepares the survey to be shown by our custom React component
   */
  private showSurveyIfEligible(userId: string): void {
    try {
      // Track that the survey is ready to be shown
      posthog.capture('survey_ready_to_show', {
        survey_type: 'new_user_onboarding',
        user_id: userId,
        show_method: 'custom_react_component',
      });

      // The actual survey display is handled by the NewUserSurvey React component
      // which checks user eligibility and PostHog initialization
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to prepare survey:', error);
    }
  }

  /**
   * Records survey completion and responses
   */
  recordSurveyResponse(responses: NewUserSurveyData, userId: string): void {
    try {
      // Track the survey completion
      posthog.capture('survey_completed', {
        survey_type: 'new_user_onboarding',
        user_id: userId,
        responses,
        completion_date: new Date().toISOString(),
      });

      // Set user properties based on responses for better targeting
      posthog.setPersonProperties({
        discovery_channel: responses.discoveryChannel,
        survey_completed: true,
        survey_completion_date: new Date().toISOString(),
      });

      // Track specific insights for business intelligence
      this.trackDiscoveryInsights(responses);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to record survey response:', error);
      posthog.capture('survey_error', {
        error_type: 'response_recording_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Records survey dismissal/skipping
   */
  recordSurveyDismissed(
    userId: string,
    reason: 'closed' | 'skipped' | 'timeout' = 'closed'
  ): void {
    posthog.capture('survey_dismissed', {
      survey_type: 'new_user_onboarding',
      user_id: userId,
      dismissal_reason: reason,
      dismissal_date: new Date().toISOString(),
    });

    // Mark user as having seen the survey to prevent re-showing
    posthog.setPersonProperties({
      survey_dismissed: true,
      survey_dismissed_date: new Date().toISOString(),
      survey_dismissal_reason: reason,
    });
  }

  /**
   * Checks if user has already completed or dismissed the survey
   */
  hasUserCompletedOrDismissedSurvey(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      // Check if survey response exists using native PostHog methods
      const personProps =
        posthog.get_property('survey_completed') ||
        posthog.get_property('survey_dismissed');
      return !!personProps;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to check survey completion status:', error);
      return false;
    }
  }

  /**
   * Tracks specific insights about user discovery channels
   */
  private trackDiscoveryInsights(responses: NewUserSurveyData): void {
    // Track discovery channel for marketing attribution
    posthog.capture('user_discovery_channel', {
      channel: responses.discoveryChannel,
    });
  }

  /**
   * Checks if a user should see the survey based on PostHog feature flag
   * Uses PostHog feature flag for flexible targeting and A/B testing
   */
  isEligibleForNewUserSurvey(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check PostHog feature flag for survey eligibility
    return posthog?.isFeatureEnabled('show-new-user-survey') ?? false;
  }

  /**
   * Gets survey configuration
   */
  getConfig(): SurveyConfig {
    return { ...this.DEFAULT_CONFIG };
  }
}

// Export singleton instance
export const surveyManager = new SurveyManager();

// Export survey response tracking functions for use in components
export const trackSurveyEvents = {
  triggerNewUserSurvey: (userId: string) =>
    surveyManager.triggerNewUserSurvey(userId),

  recordResponse: (responses: NewUserSurveyData, userId: string) =>
    surveyManager.recordSurveyResponse(responses, userId),

  recordDismissed: (
    userId: string,
    reason?: 'closed' | 'skipped' | 'timeout'
  ) => surveyManager.recordSurveyDismissed(userId, reason),
} as const;
