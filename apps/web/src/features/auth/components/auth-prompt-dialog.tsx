import { SignInButton, SignUpButton } from '@clerk/tanstack-react-start';
import type { AuthFeatureFlagPayload } from '@/types/global';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, LogIn, Shield } from '@/components/ui/icons';
import { useFeatureFlagEnabled, useFeatureFlagPayload } from 'posthog-js/react';

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  context?:
    | 'rating'
    | 'vibe_creation'
    | 'follow'
    | 'general'
    | 'rate'
    | 'comment'
    | 'share'
    | 'bookmark'
    | 'like'
    | 'create_vibe';
}

export function AuthPromptDialog({
  open,
  onOpenChange,
  title = 'sign in required',
  description = 'you must sign in to use vibechecc',
  context = 'general',
}: AuthPromptDialogProps) {
  // Use PostHog feature flags
  const appleIdOnlyEnabled = useFeatureFlagEnabled('apple-id-only-auth');
  const authPayload = useFeatureFlagPayload('apple-id-only-auth');

  // Get messaging from feature flag payload
  const authMessage =
    (authPayload as AuthFeatureFlagPayload)?.message || description;
  const variant = (authPayload as AuthFeatureFlagPayload)?.variant;

  const handleSignUpClick = () => {
    // Track signup attempt with PostHog
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('auth_signup_clicked', {
        context,
        apple_id_only: appleIdOnlyEnabled,
        variant,
        timestamp: Date.now(),
      });
    }
  };

  const handleSignInClick = () => {
    // Track signin attempt with PostHog
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('auth_signin_clicked', {
        context,
        apple_id_only: appleIdOnlyEnabled,
        variant,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/60 drop-shadow-primary/30 border-none drop-shadow-xl/50 backdrop-blur sm:max-w-[425px]">
        <DialogHeader className="flex text-center sm:text-left">
          <DialogTitle className="from-theme-primary via-theme-secondary to-theme-accent bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/90 mt-2 text-base">
            {authMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-3">
            <SignInButton mode="modal">
              <Button
                onClick={handleSignInClick}
                className="from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 hover:shadow-theme-primary/25 h-12 w-full border-transparent bg-gradient-to-r text-base font-semibold transition-all hover:scale-[1.02] hover:border-transparent hover:shadow-lg"
              >
                <LogIn className="mr-2 h-5 w-5" />
                sign in to vibechecc
              </Button>
            </SignInButton>

            <SignUpButton mode="modal">
              <Button
                onClick={handleSignUpClick}
                variant="outline"
                className="bg-secondary/50 border-theme-primary/20 hover:from-theme-primary hover:to-theme-secondary h-12 w-full border-2 text-base font-semibold backdrop-blur-sm transition-all hover:scale-[1.02] hover:border-none hover:border-transparent hover:bg-gradient-to-r"
              >
                <Sparkles className="text-theme-primary/70 mr-2 h-4 w-4" />
                create account
              </Button>
            </SignUpButton>
          </div>

          {appleIdOnlyEnabled && (
            <div className="bg-accent/50 border-accent dark:bg-accent/10 dark:border-accent/20 rounded-lg border p-3">
              <div className="flex items-center space-x-2">
                <Shield className="text-accent-foreground h-4 w-4 flex-shrink-0" />
                <p className="text-accent-foreground/90 dark:text-accent-foreground/80 text-xs">
                  {variant === 'apple_only'
                    ? 'new accounts require apple id for enhanced security and spam prevention'
                    : 'sign in for the full vibechecc experience'}
                </p>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="border-gradient-to-r via-primary/20 w-full border-t-2 from-transparent to-transparent" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text px-3 font-semibold text-transparent">
                or
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground hover:bg-primary/20 h-11 w-full text-sm font-medium transition-all"
          >
            continue browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
