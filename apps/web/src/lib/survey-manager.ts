/**
 * SurveyManager orchestrates PostHog surveys and tracks user responses.
 */
import { analytics } from './posthog';

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
  async triggerNewUserSurvey(
    userId: string,
    _userEmail?: string
  ): Promise<void> {
    if (!analytics.isInitialized()) {
      console.warn('PostHog not initialized, cannot trigger survey');
      return;
    }

    try {
      // Set user properties that can be used for survey targeting
      analytics.setPersonProperties({
        is_new_user: true,
        signup_date: new Date().toISOString(),
        survey_eligible: true,
      });

      // Track survey trigger event
      analytics.capture('survey_triggered', {
        survey_type: 'new_user_onboarding',
        user_id: userId,
        trigger_method: 'post_signup',
      });

      // Use PostHog's survey API to show survey
      // Note: This requires PostHog surveys to be enabled in your project
      const _posthogInstance = analytics.getInstance();

      // Set a delay before showing the survey
      setTimeout(() => {
        this.showSurveyIfEligible(userId);
      }, this.DEFAULT_CONFIG.delayMs);
    } catch (error) {
      console.warn('Failed to trigger new user survey:', error);
      analytics.capture('survey_error', {
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
      analytics.capture('survey_ready_to_show', {
        survey_type: 'new_user_onboarding',
        user_id: userId,
        show_method: 'custom_react_component',
      });

      // The actual survey display is handled by the NewUserSurvey React component
      // which checks user eligibility and PostHog initialization
    } catch (error) {
      console.warn('Failed to prepare survey:', error);
    }
  }

  /**
   * Records survey completion and responses
   */
  recordSurveyResponse(responses: NewUserSurveyData, userId: string): void {
    try {
      // Track the survey completion
      analytics.capture('survey_completed', {
        survey_type: 'new_user_onboarding',
        user_id: userId,
        responses,
        completion_date: new Date().toISOString(),
      });

      // Set user properties based on responses for better targeting
      analytics.setPersonProperties({
        discovery_channel: responses.discoveryChannel,
        survey_completed: true,
        survey_completion_date: new Date().toISOString(),
      });

      // Track specific insights for business intelligence
      this.trackDiscoveryInsights(responses);
    } catch (error) {
      console.warn('Failed to record survey response:', error);
      analytics.capture('survey_error', {
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
    analytics.capture('survey_dismissed', {
      survey_type: 'new_user_onboarding',
      user_id: userId,
      dismissal_reason: reason,
      dismissal_date: new Date().toISOString(),
    });

    // Mark user as having seen the survey to prevent re-showing
    analytics.setPersonProperties({
      survey_dismissed: true,
      survey_dismissed_date: new Date().toISOString(),
      survey_dismissal_reason: reason,
    });
  }

  /**
   * Checks if user has already completed or dismissed the survey
   */
  hasUserCompletedOrDismissedSurvey(): boolean {
    if (!analytics.isInitialized()) {
      return false;
    }

    try {
      const posthogInstance = analytics.getInstance();
      const personProps =
        posthogInstance.get_property('survey_completed') ||
        posthogInstance.get_property('survey_dismissed');
      return !!personProps;
    } catch (error) {
      console.warn('Failed to check survey completion status:', error);
      return false;
    }
  }

  /**
   * Tracks specific insights about user discovery channels
   */
  private trackDiscoveryInsights(responses: NewUserSurveyData): void {
    // Track discovery channel for marketing attribution
    analytics.capture('user_discovery_channel', {
      channel: responses.discoveryChannel,
    });
  }

  /**
   * Checks if a user should see the survey based on PostHog feature flag
   * Uses PostHog feature flag for flexible targeting and A/B testing
   */
  isEligibleForNewUserSurvey(): boolean {
    if (!analytics.isInitialized()) {
      return false;
    }

    // Check PostHog feature flag for survey eligibility
    return analytics.isFeatureEnabled('show-new-user-survey');
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
  triggerNewUserSurvey: (userId: string, userEmail?: string) =>
    surveyManager.triggerNewUserSurvey(userId, userEmail),

  recordResponse: (responses: NewUserSurveyData, userId: string) =>
    surveyManager.recordSurveyResponse(responses, userId),

  recordDismissed: (
    userId: string,
    reason?: 'closed' | 'skipped' | 'timeout'
  ) => surveyManager.recordSurveyDismissed(userId, reason),
} as const;
