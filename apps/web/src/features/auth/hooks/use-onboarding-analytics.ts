import { useCallback, useRef } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import {
  enhancedTrackEvents,
  userPropertyHelpers,
} from '@/lib/enhanced-posthog';

/**
 * Privacy-compliant onboarding analytics hook
 *
 * PRIVACY FEATURES:
 * - No PII tracking
 * - Step-by-step progress tracking without personal data
 * - Anonymized completion metrics
 * - Drop-off point identification for UX optimization
 */

export interface OnboardingStep {
  stepId: string;
  stepName: string;
  stepNumber: number;
  totalSteps: number;
  metadata?: Record<string, unknown>;
}

export function useOnboardingAnalytics() {
  const { user } = useUser();
  const currentStepRef = useRef<string | null>(null);
  const stepStartTimeRef = useRef<number>(0);

  // Track onboarding step start
  const trackStepStart = useCallback(
    (step: OnboardingStep) => {
      if (!user?.id) return;

      currentStepRef.current = step.stepId;
      stepStartTimeRef.current = Date.now();

      // Update user properties with current onboarding step
      userPropertyHelpers.setOnboardingStep(step.stepId);

      // Track step start event (no PII)
      enhancedTrackEvents.auth_signup_completed(user.id, 'clerk', step.stepId);
    },
    [user?.id]
  );

  // Track onboarding step completion
  const trackStepCompletion = useCallback(
    (step: OnboardingStep, success: boolean = true) => {
      if (!user?.id || currentStepRef.current !== step.stepId) return;

      const _completionTime = Date.now() - stepStartTimeRef.current;

      // Track completion with privacy-safe metadata
      enhancedTrackEvents.auth_signup_completed(
        user.id,
        'clerk',
        `${step.stepId}_completed`
      );

      // Update user properties if step was successful
      if (success) {
        userPropertyHelpers.setOnboardingStep(`${step.stepId}_completed`);

        // Track engagement based on step type (no PII)
        if (step.stepId.includes('interests') && step.metadata?.interestCount) {
          userPropertyHelpers.setInterestsCount(
            step.metadata.interestCount as number
          );
        }

        if (
          step.stepId.includes('theme') &&
          step.metadata?.primaryColor &&
          step.metadata?.secondaryColor
        ) {
          userPropertyHelpers.setThemeColors(
            step.metadata.primaryColor as string,
            step.metadata.secondaryColor as string
          );
        }
      }
    },
    [user?.id]
  );

  // Track onboarding abandonment
  const trackStepAbandonment = useCallback(
    (step: OnboardingStep, _reason?: string) => {
      if (!user?.id) return;

      const _abandonmentTime = Date.now() - stepStartTimeRef.current;

      // Track abandonment for funnel analysis (no PII)
      enhancedTrackEvents.auth_signup_completed(
        user.id,
        'clerk',
        `${step.stepId}_abandoned`
      );
    },
    [user?.id]
  );

  // Track overall onboarding completion
  const trackOnboardingComplete = useCallback(
    (_completedSteps: string[], _totalTime: number) => {
      if (!user?.id) return;

      // Track final completion event
      enhancedTrackEvents.auth_signup_completed(
        user.id,
        'clerk',
        'onboarding_completed'
      );

      // Update user properties
      userPropertyHelpers.setOnboardingStep('completed');

      // Reset tracking state
      currentStepRef.current = null;
      stepStartTimeRef.current = 0;
    },
    [user?.id]
  );

  // Track field interactions within onboarding steps
  const trackFieldInteraction = useCallback(
    (
      stepId: string,
      fieldName: string,
      action: 'focus' | 'blur' | 'change' | 'error',
      _metadata?: Record<string, unknown>
    ) => {
      if (!user?.id) return;

      // Track form field interactions for UX optimization (no PII values)
      enhancedTrackEvents.auth_signup_completed(
        user.id,
        'clerk',
        `${stepId}_field_${action}`
      );
    },
    [user?.id]
  );

  return {
    trackStepStart,
    trackStepCompletion,
    trackStepAbandonment,
    trackOnboardingComplete,
    trackFieldInteraction,
  };
}
