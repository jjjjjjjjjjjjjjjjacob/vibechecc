import { useEffect, useState, type ReactNode } from 'react';
import * as React from 'react';
import { SignInButton, useUser } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import { LogIn } from '@/components/ui/icons';
import { usePostHog } from '@/hooks/usePostHog';
import { useThemeStore } from '@/stores/theme-store';
import {
  canAccessCurrentEnvironment,
  getEnvironmentInfo,
  getAccessDenialMessage,
  trackEnvironmentAccess,
  getReadinessState,
  type ReadinessState,
} from '@/lib/environment-access';

interface EnvironmentAccessGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that restricts access to dev and ephemeral environments
 * based on PostHog feature flags and user cohorts
 */
export function EnvironmentAccessGuard({
  children,
  fallback,
}: EnvironmentAccessGuardProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [shouldShowContent, setShouldShowContent] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const { isInitialized: isPostHogInitialized } = usePostHog();
  const { isLoaded: isUserLoaded, user, isSignedIn } = useUser();
  const {
    isThemeLoaded,
    isLocalStorageLoaded,
    getEffectiveColorTheme,
    getEffectiveSecondaryColorTheme,
    setUserSignedIn,
    loadThemeFromLocalStorage,
    syncUserThemePreferences,
  } = useThemeStore();

  // Get readiness state
  const readiness: ReadinessState = getReadinessState(
    isLocalStorageLoaded,
    isThemeLoaded,
    isUserLoaded,
    isPostHogInitialized,
    hasAccess
  );

  // Initialize theme from localStorage on mount
  React.useEffect(() => {
    loadThemeFromLocalStorage();
  }, [loadThemeFromLocalStorage]);

  // Sync user authentication state with theme store
  React.useEffect(() => {
    if (isSignedIn !== undefined) {
      setUserSignedIn(isSignedIn);
    }
  }, [isSignedIn, setUserSignedIn]);

  // Sync user theme preferences when user data is available
  React.useEffect(() => {
    if (user && isUserLoaded && isLocalStorageLoaded) {
      // Extract user theme preferences from user data
      const userTheme = user.publicMetadata?.theme as
        | 'light'
        | 'dark'
        | 'system'
        | undefined;
      const userColorTheme = user.publicMetadata?.colorTheme as
        | string
        | undefined;
      const userSecondaryColorTheme = user.publicMetadata
        ?.secondaryColorTheme as string | undefined;

      syncUserThemePreferences(
        userTheme,
        userColorTheme as Parameters<typeof syncUserThemePreferences>[1],
        userSecondaryColorTheme as Parameters<
          typeof syncUserThemePreferences
        >[2]
      );
    } else if (isLocalStorageLoaded) {
      // No user data, mark theme as loaded with current localStorage state
      syncUserThemePreferences();
    }
  }, [user, isUserLoaded, isLocalStorageLoaded, syncUserThemePreferences]);

  // Show welcome when fully ready, then fade to content after 2 seconds
  React.useEffect(() => {
    if (readiness.isFullyReady && hasAccess) {
      const welcomeTimer = setTimeout(() => {
        setShowWelcome(true);
        const fadeTimer = setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setShowWelcome(false);
            setShouldShowContent(true);
          }, 1300); // Wait for fade-out animation
        }, 2650);
        return () => clearTimeout(fadeTimer);
      }, 200); // Initial delay before showing welcome

      return () => {
        clearTimeout(welcomeTimer);
      };
    }
  }, [readiness.isFullyReady, hasAccess]);

  // PostHog and Environment Access Check
  useEffect(() => {
    const checkAccess = () => {
      const envInfo = getEnvironmentInfo();
      const allowed = canAccessCurrentEnvironment();

      setHasAccess(allowed);

      // Track the access attempt (only if PostHog is initialized)
      if (isPostHogInitialized) {
        trackEnvironmentAccess(allowed, envInfo);
      }
    };

    // For localhost development, don't wait for PostHog - check access immediately
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname.includes('localhost') ||
        window.location.hostname.includes('127.0.0.1'))
    ) {
      checkAccess();
      return;
    }

    // For production environments, wait for PostHog to initialize
    if (!isPostHogInitialized) {
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        // eslint-disable-next-line no-console
        console.warn('PostHog initialization timeout, allowing access');
        setHasAccess(true);
      }, 7000); // 5 second timeout

      return () => clearTimeout(timeout);
    }

    // Check access immediately if PostHog is ready
    checkAccess();
  }, [isPostHogInitialized, user]);

  const welcomeMessage = React.useMemo(
    () =>
      Array.from(
        (() => {
          const taglines = [
            "we're vibing here",
            'vibe or be vibed',
            'what am i doing here',
            'one doesn\'t just "vibe"',
            "vibing hasn't killed anyone (yet)",
            'all vibes no chill',
            'addicted to the vibe',
            "mary wake up you're in a coma",
            'vibe summer',
            'people die but vibes are eternal',
            'professional vibe checker',
            'vibe responsibly',
            'caught in 4k vibing',
            'a vibe a day keeps the doctor away',
            "that's not a vibe this is a vibe",
            "forget it jake it's vibetown",
            'show me everest',
            "you've got vibes",
          ];
          return taglines[Math.floor(Math.random() * taglines.length)];
        })()
      ).map((char, i) => (
        <span
          data-theme-ready={readiness.isFullyReady}
          className="data-[theme-ready=false]:text-foreground animate-pulse-text m-0 h-fit w-fit rounded-full bg-transparent p-0 leading-none tracking-[-1px] whitespace-pre transition duration-800"
          key={i}
          style={{ animationDelay: `${i * 25}ms` }}
        >
          {char}
        </span>
      )),
    [showWelcome, readiness.isFullyReady]
  );

  // Show loading/welcome state while not ready or showing welcome
  if (!shouldShowContent && (hasAccess || hasAccess == null)) {
    return (
      <div
        className="data-[theme-ready=true]:from-theme-primary data-[theme-ready=true]:to-theme-secondary flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-white transition duration-500 data-[fading-out=true]:opacity-0 data-[fading-out=true]:delay-700 data-[fading-out=true]:duration-600"
        data-theme-ready={readiness.isThemeReady}
        data-posthog-ready={readiness.isPostHogReady}
        data-fully-ready={readiness.isFullyReady}
        data-show-welcome={showWelcome}
        data-has-access={hasAccess}
        data-fading-out={isFadingOut}
        data-has-custom-theme={
          !!(getEffectiveColorTheme() && getEffectiveSecondaryColorTheme())
        }
      >
        <div className="space-y-6 text-center">
          <div
            className="flex flex-col space-y-2 transition duration-800 data-[fading-out=true]:scale-105 data-[fading-out=true]:opacity-0"
            data-fading-out={isFadingOut}
          >
            <p
              data-theme-ready={readiness.isThemeReady}
              className="data-[theme-ready=false]:text-foreground inline-flex w-full bg-transparent text-4xl font-bold duration-500 data-[theme-ready=true]:text-white"
            >
              {Array.from('viberatr').map((char, i) => (
                <span
                  data-theme-ready={readiness.isFullyReady}
                  className="data-[theme-ready=false]:text-foreground animate-pulse-text m-0 h-fit w-fit rounded-full bg-transparent p-0 leading-none tracking-[-1px] transition duration-800"
                  key={i}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {char}
                </span>
              ))}
            </p>

            <div className="relative flex h-6 w-full items-center justify-center transition duration-500">
              <p
                data-theme-ready={readiness.isFullyReady}
                data-show-welcome={showWelcome}
                className="data-[theme-ready=false]:text-foreground absolute inset-0 inline-flex w-full items-center justify-center text-center text-lg font-medium opacity-100 transition delay-800 duration-800 data-[show-welcome=false]:opacity-0 data-[theme-ready=true]:text-white"
                style={{ animationDelay: `300ms` }}
              >
                {welcomeMessage}
              </p>
              <div
                data-show-welcome={
                  showWelcome || isFadingOut || shouldShowContent
                }
                className="animate-text-pulse absolute inset-0 flex items-center justify-center gap-1.5 p-0 transition duration-300 data-[show-welcome=true]:opacity-0"
              >
                <span
                  data-theme-ready={readiness.isFullyReady}
                  className="data-[theme-ready=false]:bg-foreground animate-pulse-dot inline-block size-2 rounded-full bg-white transition duration-800"
                />
                <span
                  data-theme-ready={readiness.isFullyReady}
                  className="data-[theme-ready=false]:bg-foreground animate-pulse-dot inline-block size-2 rounded-full bg-white transition duration-800"
                  style={{ animationDelay: '300ms' }}
                />
                <span
                  data-theme-ready={readiness.isFullyReady}
                  className="data-[theme-ready=false]:bg-foreground animate-pulse-dot inline-block size-2 rounded-full bg-white transition duration-800"
                  style={{ animationDelay: '600ms' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied message if user doesn't have permission
  if (!hasAccess) {
    const envInfo = getEnvironmentInfo();
    const message = getAccessDenialMessage(envInfo);

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md space-y-8 p-6 text-center">
          <div className="space-y-4">
            <span className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
              viberatr
            </span>
            <div className="space-y-2">
              <h1 className="text-foreground text-2xl font-semibold">
                access restricted
              </h1>
              <p className="text-muted-foreground">{message}</p>
            </div>
          </div>

          <div className="space-y-4">
            <SignInButton mode="modal">
              <Button className="from-theme-primary to-theme-secondary h-12 w-full bg-gradient-to-r text-base font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg">
                <LogIn className="mr-2 h-5 w-5" />
                sign in to viberatr
              </Button>
            </SignInButton>
          </div>

          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              environment:{' '}
              <span className="font-mono">
                {envInfo.subdomain || 'production'}
              </span>
            </p>
            <p>
              if you believe this is an error, please contact{' '}
              <a
                href="mailto:admin@viberatr.io"
                className="text-theme-primary hover:text-theme-primary/80 underline transition-colors"
              >
                admin@viberatr.io
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show content when ready
  if (shouldShowContent) {
    return <>{children}</>;
  }

  // This shouldn't happen, but fallback to content if something goes wrong
  return <>{children}</>;
}
