/**
 * Authentication Required CTA Component
 *
 * Secure component for prompting authentication on protected actions
 * with proper state preservation and security logging.
 */

import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import type { AnonymousActionResult } from '@/types/global';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Heart,
  MessageCircle,
  UserPlus,
  Share2 as Share,
  Bookmark,
  Star,
  LogIn,
  Lock,
} from '@/components/ui/icons';
import { AuthPromptDialog } from '@/features/auth/components/auth-prompt-dialog';

export type AuthRequiredAction =
  | 'rate'
  | 'follow'
  | 'comment'
  | 'share'
  | 'bookmark'
  | 'like'
  | 'create_vibe';

interface AuthRequiredCTAProps {
  action: AuthRequiredAction;
  targetId?: string;
  onAuthRequired?: () => void;
  onAuthenticated?: () => void;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'sm' | 'lg' | 'default' | 'icon';
  showTooltip?: boolean;
  preserveState?: boolean;
}

const ACTION_CONFIG = {
  rate: {
    icon: Star,
    label: 'rate this vibe',
    tooltip: 'sign in to rate',
    description: 'share your thoughts and rate vibes',
  },
  follow: {
    icon: UserPlus,
    label: 'follow',
    tooltip: 'sign in to follow',
    description: 'follow users and stay updated',
  },
  comment: {
    icon: MessageCircle,
    label: 'comment',
    tooltip: 'sign in to comment',
    description: 'join the conversation',
  },
  share: {
    icon: Share,
    label: 'share',
    tooltip: 'sign in to share',
    description: 'share vibes with others',
  },
  bookmark: {
    icon: Bookmark,
    label: 'save',
    tooltip: 'sign in to save',
    description: 'bookmark your favorite vibes',
  },
  like: {
    icon: Heart,
    label: 'like',
    tooltip: 'sign in to like',
    description: 'show some love',
  },
  create_vibe: {
    icon: LogIn,
    label: 'create vibe',
    tooltip: 'sign in to create',
    description: 'share your own experiences',
  },
};

export function AuthRequiredCTA({
  action,
  targetId,
  onAuthRequired,
  onAuthenticated,
  children,
  className,
  variant = 'ghost',
  size = 'default',
  showTooltip = true,
  preserveState = true,
}: AuthRequiredCTAProps) {
  const { user, isLoaded } = useUser();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [sessionId] = useState(() =>
    preserveState ? crypto.randomUUID() : undefined
  );

  const config = ACTION_CONFIG[action];
  const IconComponent = config.icon;

  // Store anonymous action if state preservation is enabled
  const storeAnonymousAction = useCallback(async () => {
    if (!preserveState || !sessionId || user) return;

    try {
      // This would integrate with the anonymous actions system
      const actionData = {
        sessionId,
        type: `${action}_attempt`,
        targetId: targetId || 'unknown',
        data: {
          action,
          timestamp: Date.now(),
          url: window.location.href,
          referrer: document.referrer,
        },
        timestamp: Date.now(),
      };

      // Store action for later processing
      if (typeof window !== 'undefined' && window.convex) {
        await window.convex.mutation('anonymousActions:storeAnonymousActions', {
          sessionId,
          actions: [actionData],
        });
      }

      // Track analytics event
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('auth_required_action_attempted', {
          action,
          target_id: targetId,
          session_id: sessionId,
          preserved: true,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[AUTH_CTA] Failed to store anonymous action:', error);
    }
  }, [action, targetId, sessionId, preserveState, user]);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isLoaded) return;

      if (user) {
        // User is authenticated, proceed with action
        onAuthenticated?.();
      } else {
        // User is not authenticated, store action and show auth dialog
        await storeAnonymousAction();
        onAuthRequired?.();
        setShowAuthDialog(true);

        // Track authentication prompt
        if (typeof window !== 'undefined' && window.posthog) {
          window.posthog.capture('auth_prompt_shown', {
            action,
            target_id: targetId,
            context: 'auth_required_cta',
            timestamp: Date.now(),
          });
        }
      }
    },
    [
      isLoaded,
      user,
      onAuthenticated,
      onAuthRequired,
      storeAnonymousAction,
      action,
      targetId,
    ]
  );

  // Handle successful authentication
  useEffect(() => {
    if (user && preserveState && sessionId) {
      // Process stored anonymous actions
      if (typeof window !== 'undefined' && window.convex) {
        window.convex
          .action('anonymousActions:processAnonymousActions', {
            sessionId,
          })
          .then((result: unknown) => {
            const actionResult = result as AnonymousActionResult;
            if (actionResult.processed > 0) {
              // Track successful migration
              if (typeof window !== 'undefined' && window.posthog) {
                window.posthog.capture('anonymous_actions_migrated', {
                  session_id: sessionId,
                  processed_actions: actionResult.processed,
                  total_actions:
                    actionResult.processed + actionResult.errors.length,
                  user_id: user.id,
                  timestamp: Date.now(),
                });
              }
            }
          })
          .catch((error: Error) => {
            // eslint-disable-next-line no-console
            console.error(
              '[AUTH_CTA] Failed to process anonymous actions:',
              error
            );
          });
      }
    }
  }, [user, preserveState, sessionId]);

  const buttonContent = children || (
    <div className="flex items-center space-x-2">
      <IconComponent className="h-4 w-4" />
      <span className="sr-only sm:not-sr-only">{config.label}</span>
    </div>
  );

  const buttonElement = (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      disabled={!isLoaded}
    >
      {!isLoaded ? (
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="sr-only">loading...</span>
        </div>
      ) : (
        buttonContent
      )}
    </Button>
  );

  return (
    <TooltipProvider>
      {showTooltip && !user ? (
        <Tooltip>
          <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center space-x-2">
              <Lock className="h-3 w-3" />
              <span>{config.tooltip}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        buttonElement
      )}

      <AuthPromptDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title={`sign in to ${config.label}`}
        description={config.description}
        context={action}
      />
    </TooltipProvider>
  );
}

/**
 * Higher-order component for protecting components with authentication
 */
interface WithAuthRequiredProps {
  action: AuthRequiredAction;
  targetId?: string;
  fallback?: React.ComponentType<object>;
  preserveState?: boolean;
}

export function withAuthRequired<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  {
    action,
    targetId,
    fallback: Fallback,
    preserveState = true,
  }: WithAuthRequiredProps
) {
  return function AuthRequiredWrapper(props: P) {
    const { user, isLoaded } = useUser();

    if (!isLoaded) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      );
    }

    if (!user) {
      if (Fallback) {
        return <Fallback {...props} />;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Lock className="text-muted-foreground mb-3 h-8 w-8" />
          <h3 className="mb-2 text-lg font-semibold">
            authentication required
          </h3>
          <p className="text-muted-foreground mb-4">
            sign in to {ACTION_CONFIG[action].label}
          </p>
          <AuthRequiredCTA
            action={action}
            targetId={targetId}
            preserveState={preserveState}
            variant="default"
            size="default"
            showTooltip={false}
          />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Hook for handling authentication-required actions
 */
export function useAuthRequiredAction(
  action: AuthRequiredAction,
  targetId?: string
) {
  const { user, isLoaded } = useUser();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const executeAction = useCallback(
    async (callback: () => void | Promise<void>) => {
      if (!isLoaded) return;

      if (user) {
        await callback();
      } else {
        setShowAuthDialog(true);

        // Track authentication requirement
        if (typeof window !== 'undefined' && window.posthog) {
          window.posthog.capture('auth_required_action_blocked', {
            action,
            target_id: targetId,
            timestamp: Date.now(),
          });
        }
      }
    },
    [isLoaded, user, action, targetId]
  );

  return {
    executeAction,
    isAuthenticated: !!user,
    isLoaded,
    showAuthDialog,
    setShowAuthDialog,
  };
}
