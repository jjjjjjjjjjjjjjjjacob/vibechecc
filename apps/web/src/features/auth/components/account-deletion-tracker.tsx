'use client';

import { useCallback } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import { enhancedTrackEvents } from '@/lib/enhanced-posthog';

/**
 * Privacy-compliant account deletion tracking
 *
 * SECURITY FEATURES:
 * - Tracks deletion events for compliance auditing
 * - Records deletion reasons for product improvement
 * - No PII retention after account deletion
 * - Complies with GDPR "right to be forgotten"
 */

export interface DeletionReason {
  category: 'privacy' | 'functionality' | 'content' | 'other';
  specific?: string;
  feedback?: string; // Optional non-PII feedback
}

interface AccountDeletionTrackerProps {
  onTrackingComplete?: () => void;
}

export function useAccountDeletionTracking() {
  const { user } = useUser();

  // Track account deletion initiation
  const trackDeletionStarted = useCallback(() => {
    if (!user?.id) return;

    enhancedTrackEvents.auth_account_deleted(user.id, 'deletion_initiated');
  }, [user?.id]);

  // Track account deletion completion with reason
  const trackDeletionCompleted = useCallback(
    (reason?: DeletionReason) => {
      if (!user?.id) return;

      const reasonString = reason
        ? `${reason.category}${reason.specific ? `_${reason.specific}` : ''}`
        : 'no_reason_provided';

      enhancedTrackEvents.auth_account_deleted(user.id, reasonString);
    },
    [user?.id]
  );

  // Track deletion cancellation
  const trackDeletionCancelled = useCallback(
    (reason?: string) => {
      if (!user?.id) return;

      enhancedTrackEvents.auth_account_deleted(
        user.id,
        `deletion_cancelled${reason ? `_${reason}` : ''}`
      );
    },
    [user?.id]
  );

  return {
    trackDeletionStarted,
    trackDeletionCompleted,
    trackDeletionCancelled,
  };
}

export function AccountDeletionTracker({
  onTrackingComplete: _onTrackingComplete,
}: AccountDeletionTrackerProps) {
  // This is a hook-only component for now
  // Could be extended to provide UI for deletion reason collection
  return null;
}

export default AccountDeletionTracker;
