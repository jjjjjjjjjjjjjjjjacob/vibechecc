/// <reference lib="dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ClerkPostHogIntegration } from '@/features/auth/components/clerk-posthog-integration';

// Mock Clerk
vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: vi.fn(),
}));

// Mock PostHog hook
vi.mock('posthog-js/react', () => ({
  usePostHog: vi.fn(),
}));

// Mock survey manager
vi.mock('@/lib/survey-manager', () => ({
  trackSurveyEvents: {
    triggerNewUserSurvey: vi.fn(),
  },
}));

// Mock track events
vi.mock('@/lib/track-events', () => ({
  trackEvents: {
    userSignedUp: vi.fn(),
    userSignedIn: vi.fn(),
  },
}));

import { useUser } from '@clerk/tanstack-react-start';
import { usePostHog } from 'posthog-js/react';
import { trackSurveyEvents } from '@/lib/survey-manager';
import { trackEvents } from '@/lib/track-events';

const mockUseUser = useUser as any;
const mockUsePostHog = usePostHog as any;
const mockTrackSurveyEvents = trackSurveyEvents as any;
const mockTrackEvents = trackEvents as any;

describe('ClerkPostHogIntegration Signup Tracking', () => {
  const mockPostHogMethods = {
    identify: vi.fn(),
    setPersonProperties: vi.fn(),
    reset: vi.fn(),
    reloadFeatureFlags: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    mockUsePostHog.mockReturnValue(mockPostHogMethods);
    mockTrackSurveyEvents.triggerNewUserSurvey.mockResolvedValue(undefined);
  });

  it('should track signup for users who signed up within 7 days', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3); // 3 days ago

    mockUseUser.mockReturnValue({
      isSignedIn: true,
      user: {
        id: 'user_123',
        createdAt: recentDate.toISOString(),
        primaryEmailAddress: { emailAddress: 'test@example.com' },
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        imageUrl: 'https://example.com/avatar.jpg',
        twoFactorEnabled: false,
      },
    });

    render(<ClerkPostHogIntegration />);

    // userSignedIn is called first
    expect(mockTrackEvents.userSignedIn).toHaveBeenCalledWith(
      'user_123',
      'clerk'
    );
    // Then userSignedUp is called for recent signups
    expect(mockTrackEvents.userSignedUp).toHaveBeenCalledWith(
      'user_123',
      'clerk'
    );
  });

  it('should trigger survey for users who signed up within 24 hours', () => {
    const veryRecentDate = new Date();
    veryRecentDate.setHours(veryRecentDate.getHours() - 12); // 12 hours ago

    mockUseUser.mockReturnValue({
      isSignedIn: true,
      user: {
        id: 'user_456',
        createdAt: veryRecentDate.toISOString(),
        primaryEmailAddress: { emailAddress: 'newuser@example.com' },
        firstName: 'Jane',
        lastName: 'Smith',
      },
    });

    render(<ClerkPostHogIntegration />);

    // userSignedIn is called first
    expect(mockTrackEvents.userSignedIn).toHaveBeenCalledWith(
      'user_456',
      'clerk'
    );
    // Then userSignedUp is called for recent signups
    expect(mockTrackEvents.userSignedUp).toHaveBeenCalledWith(
      'user_456',
      'clerk'
    );
    expect(mockTrackSurveyEvents.triggerNewUserSurvey).toHaveBeenCalledWith(
      'user_456'
    );
  });

  it('should not track signup for users who signed up more than 7 days ago', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

    mockUseUser.mockReturnValue({
      isSignedIn: true,
      user: {
        id: 'user_789',
        createdAt: oldDate.toISOString(),
        primaryEmailAddress: { emailAddress: 'olduser@example.com' },
      },
    });

    render(<ClerkPostHogIntegration />);

    expect(mockTrackEvents.userSignedUp).not.toHaveBeenCalled();
    expect(mockTrackSurveyEvents.triggerNewUserSurvey).not.toHaveBeenCalled();
  });

  it('should not trigger survey for users who signed up more than 24 hours ago', () => {
    const recentButNotVeryRecentDate = new Date();
    recentButNotVeryRecentDate.setDate(
      recentButNotVeryRecentDate.getDate() - 2
    ); // 2 days ago

    mockUseUser.mockReturnValue({
      isSignedIn: true,
      user: {
        id: 'user_101',
        createdAt: recentButNotVeryRecentDate.toISOString(),
        primaryEmailAddress: { emailAddress: 'user@example.com' },
      },
    });

    render(<ClerkPostHogIntegration />);

    // userSignedIn is called first
    expect(mockTrackEvents.userSignedIn).toHaveBeenCalledWith(
      'user_101',
      'clerk'
    );
    // Then userSignedUp is called for recent signups
    expect(mockTrackEvents.userSignedUp).toHaveBeenCalledWith(
      'user_101',
      'clerk'
    );
    expect(mockTrackSurveyEvents.triggerNewUserSurvey).not.toHaveBeenCalled();
  });

  it('should handle users without createdAt date', () => {
    mockUseUser.mockReturnValue({
      isSignedIn: true,
      user: {
        id: 'user_no_date',
        createdAt: null,
        primaryEmailAddress: { emailAddress: 'nodate@example.com' },
      },
    });

    render(<ClerkPostHogIntegration />);

    expect(mockTrackEvents.userSignedUp).not.toHaveBeenCalled();
    expect(mockTrackSurveyEvents.triggerNewUserSurvey).not.toHaveBeenCalled();
  });
});
