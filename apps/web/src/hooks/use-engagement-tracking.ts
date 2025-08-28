/**
 * Comprehensive engagement tracking hooks for funnel analytics,
 * user journeys, social sharing, and cohort analysis
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { trackEvents } from '@/lib/track-events';

/**
 * Hook for tracking user funnels with dropoff analysis
 */
export function useFunnelTracking(funnelName: string, steps: string[]) {
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const startTimeRef = useRef<number | undefined>(undefined);
  const stepTimesRef = useRef<Record<number, number>>({});

  useEffect(() => {
    startTimeRef.current = performance.now();
  }, []);

  const startStep = useCallback(
    (stepIndex: number, userId?: string) => {
      if (stepIndex < 0 || stepIndex >= steps.length) return;

      setCurrentStep(stepIndex);
      stepTimesRef.current[stepIndex] = performance.now();

      trackEvents.funnelStepCompleted(
        funnelName,
        steps[stepIndex],
        stepIndex,
        userId,
        {
          step_start_time: performance.now(),
          funnel_start_time: startTimeRef.current,
        }
      );
    },
    [funnelName, steps]
  );

  const completeStep = useCallback(
    (stepIndex: number, userId?: string) => {
      if (stepIndex < 0 || stepIndex >= steps.length) return;

      setCompletedSteps((prev) => new Set([...prev, stepIndex]));

      const stepDuration = stepTimesRef.current[stepIndex]
        ? performance.now() - stepTimesRef.current[stepIndex]
        : 0;

      trackEvents.funnelStepCompleted(
        funnelName,
        steps[stepIndex],
        stepIndex,
        userId,
        {
          step_duration: stepDuration,
          total_duration: startTimeRef.current
            ? performance.now() - startTimeRef.current
            : 0,
          completion_rate: (completedSteps.size + 1) / steps.length,
        }
      );
    },
    [funnelName, steps, completedSteps.size]
  );

  const trackDropoff = useCallback(
    (
      stepIndex: number,
      reason?: string,
      properties?: Record<string, unknown>
    ) => {
      if (stepIndex < 0 || stepIndex >= steps.length) return;

      trackEvents.funnelDropoff(
        funnelName,
        steps[stepIndex],
        stepIndex,
        reason,
        {
          completed_steps: completedSteps.size,
          completion_rate: completedSteps.size / steps.length,
          time_spent: startTimeRef.current
            ? performance.now() - startTimeRef.current
            : 0,
          ...properties,
        }
      );
    },
    [funnelName, steps, completedSteps.size]
  );

  return {
    currentStep,
    completedSteps: Array.from(completedSteps),
    completionRate: completedSteps.size / steps.length,
    startStep,
    completeStep,
    trackDropoff,
    isStepCompleted: (stepIndex: number) => completedSteps.has(stepIndex),
  };
}

/**
 * Hook for tracking user journeys with entry/exit points
 */
export function useUserJourneyTracking(journeyType: string) {
  const [isActive, setIsActive] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const startTimeRef = useRef<number | undefined>(undefined);
  const entryPointRef = useRef<string | undefined>(undefined);

  const startJourney = useCallback(
    (entryPoint: string, userId?: string) => {
      setIsActive(true);
      setStepsCompleted(0);
      startTimeRef.current = performance.now();
      entryPointRef.current = entryPoint;

      trackEvents.userJourneyStarted(journeyType, entryPoint, userId);
    },
    [journeyType]
  );

  const completeJourney = useCallback(
    (userId?: string) => {
      if (!startTimeRef.current) return;

      const completionTime = performance.now() - startTimeRef.current;
      setIsActive(false);

      trackEvents.userJourneyCompleted(
        journeyType,
        completionTime,
        stepsCompleted,
        userId
      );
    },
    [journeyType, stepsCompleted]
  );

  const incrementStep = useCallback(() => {
    setStepsCompleted((prev) => prev + 1);
  }, []);

  return {
    isActive,
    stepsCompleted,
    startJourney,
    completeJourney,
    incrementStep,
    journeyDuration: startTimeRef.current
      ? performance.now() - startTimeRef.current
      : 0,
  };
}

/**
 * Hook for tracking social sharing and viral metrics
 */
export function useSocialSharingTracking() {
  const shareAttemptsRef = useRef<Record<string, number>>({});
  const shareCompletionsRef = useRef<Record<string, number>>({});

  const trackShareAttempt = useCallback(
    (
      contentType: 'vibe' | 'rating' | 'profile',
      contentId: string,
      platform: string,
      method: 'native' | 'manual' | 'copy_link'
    ) => {
      const key = `${contentType}-${contentId}-${platform}`;
      shareAttemptsRef.current[key] = (shareAttemptsRef.current[key] || 0) + 1;

      trackEvents.shareAttempted(contentType, contentId, platform, method);
    },
    []
  );

  const trackShareCompletion = useCallback(
    (
      contentType: 'vibe' | 'rating' | 'profile',
      contentId: string,
      platform: string,
      method: 'native' | 'manual' | 'copy_link'
    ) => {
      const key = `${contentType}-${contentId}-${platform}`;
      shareCompletionsRef.current[key] =
        (shareCompletionsRef.current[key] || 0) + 1;

      trackEvents.shareCompleted(contentType, contentId, platform, method);
    },
    []
  );

  const trackShareClickback = useCallback(
    (
      contentType: 'vibe' | 'rating' | 'profile',
      contentId: string,
      platform: string,
      referrerUserId?: string
    ) => {
      trackEvents.shareClickback(
        contentType,
        contentId,
        platform,
        referrerUserId
      );
    },
    []
  );

  const calculateViralCoefficient = useCallback(
    (
      period: 'daily' | 'weekly' | 'monthly',
      invitesSent: number,
      conversions: number
    ) => {
      const coefficient = conversions / invitesSent || 0;
      trackEvents.viralCoefficientCalculated(
        period,
        coefficient,
        invitesSent,
        conversions
      );
      return coefficient;
    },
    []
  );

  return {
    trackShareAttempt,
    trackShareCompletion,
    trackShareClickback,
    calculateViralCoefficient,
    getShareAttempts: (contentId: string, platform: string) =>
      shareAttemptsRef.current[`${contentId}-${platform}`] || 0,
    getShareCompletions: (contentId: string, platform: string) =>
      shareCompletionsRef.current[`${contentId}-${platform}`] || 0,
  };
}

/**
 * Hook for tracking engagement sessions
 */
export function useEngagementSession(
  sessionType: 'browse' | 'create' | 'rate' | 'social'
) {
  const [isActive, setIsActive] = useState(false);
  const [actionsCompleted, setActionsCompleted] = useState(0);
  const startTimeRef = useRef<number | undefined>(undefined);
  const entryPointRef = useRef<string | undefined>(undefined);

  const startSession = useCallback(
    (entryPoint: string) => {
      setIsActive(true);
      setActionsCompleted(0);
      startTimeRef.current = performance.now();
      entryPointRef.current = entryPoint;

      trackEvents.engagementSessionStarted(sessionType, entryPoint);
    },
    [sessionType]
  );

  const endSession = useCallback(
    (exitPoint?: string) => {
      if (!startTimeRef.current || !isActive) return;

      const duration = performance.now() - startTimeRef.current;
      setIsActive(false);

      trackEvents.engagementSessionEnded(
        sessionType,
        duration,
        actionsCompleted,
        exitPoint
      );
    },
    [sessionType, actionsCompleted, isActive]
  );

  const trackAction = useCallback(() => {
    if (isActive) {
      setActionsCompleted((prev) => prev + 1);
    }
  }, [isActive]);

  // Auto-end session when component unmounts
  useEffect(() => {
    return () => {
      if (isActive) {
        endSession('component_unmount');
      }
    };
  }, [isActive, endSession]);

  return {
    isActive,
    actionsCompleted,
    startSession,
    endSession,
    trackAction,
    sessionDuration:
      startTimeRef.current && isActive
        ? performance.now() - startTimeRef.current
        : 0,
  };
}

/**
 * Hook for rating engagement analysis
 */
export function useRatingEngagementAnalytics() {
  const analyticsRef = useRef<{
    totalRatings: number;
    uniqueRaters: Set<string>;
    ratingSum: number;
  }>({
    totalRatings: 0,
    uniqueRaters: new Set(),
    ratingSum: 0,
  });

  const trackRating = useCallback((rating: number, userId?: string) => {
    analyticsRef.current.totalRatings += 1;
    analyticsRef.current.ratingSum += rating;

    if (userId) {
      analyticsRef.current.uniqueRaters.add(userId);
    }
  }, []);

  const analyzeEngagement = useCallback(
    (period: 'daily' | 'weekly' | 'monthly', totalPossibleRaters: number) => {
      const { totalRatings, uniqueRaters, ratingSum } = analyticsRef.current;
      const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;
      const engagementRate =
        totalPossibleRaters > 0 ? uniqueRaters.size / totalPossibleRaters : 0;

      trackEvents.ratingEngagementAnalyzed(
        period,
        totalRatings,
        uniqueRaters.size,
        averageRating,
        engagementRate
      );

      return {
        totalRatings,
        uniqueRaters: uniqueRaters.size,
        averageRating,
        engagementRate,
      };
    },
    []
  );

  const resetAnalytics = useCallback(() => {
    analyticsRef.current = {
      totalRatings: 0,
      uniqueRaters: new Set(),
      ratingSum: 0,
    };
  }, []);

  return {
    trackRating,
    analyzeEngagement,
    resetAnalytics,
    currentStats: {
      totalRatings: analyticsRef.current.totalRatings,
      uniqueRaters: analyticsRef.current.uniqueRaters.size,
      averageRating:
        analyticsRef.current.totalRatings > 0
          ? analyticsRef.current.ratingSum / analyticsRef.current.totalRatings
          : 0,
    },
  };
}

/**
 * Hook for cohort analysis tracking
 */
export function useCohortTracking(cohortName: string) {
  const cohortUsersRef = useRef<
    Map<string, { date: string; properties: Record<string, unknown> }>
  >(new Map());

  const addUserToCohort = useCallback(
    (
      userId: string,
      cohortDate: string,
      userProperties?: Record<string, unknown>
    ) => {
      cohortUsersRef.current.set(userId, {
        date: cohortDate,
        properties: userProperties || {},
      });
      trackEvents.cohortUserAdded(
        cohortName,
        userId,
        cohortDate,
        userProperties
      );
    },
    [cohortName]
  );

  const trackCohortRetention = useCallback(
    (period: number, activeUsers: number) => {
      const totalUsers = cohortUsersRef.current.size;
      const retentionRate = totalUsers > 0 ? activeUsers / totalUsers : 0;

      trackEvents.cohortRetentionTracked(
        cohortName,
        period,
        retentionRate,
        activeUsers,
        totalUsers
      );

      return { retentionRate, activeUsers, totalUsers };
    },
    [cohortName]
  );

  return {
    addUserToCohort,
    trackCohortRetention,
    cohortSize: cohortUsersRef.current.size,
    getCohortUsers: () => Array.from(cohortUsersRef.current.entries()),
  };
}
