import { useState, type ReactNode } from 'react';
import * as React from 'react';
import { SignInButton, useUser } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import { LogIn } from '@/components/ui/icons';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import {
  useThemeStore,
  type PrimaryColorTheme,
  type SecondaryColorTheme,
} from '@/stores/theme-store';
import { APP_NAME } from '@/config/app';
import { cn } from '@/utils';

interface EnvironmentAccessGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

type LoadingState =
  | 'theme-check' // State 1: Checking theme (white bg, dark text)
  | 'access-check' // State 2: Checking access (theme gradient bg, white text)
  | 'post-check-fade-out' // State 2.5: Fading out dots before welcome
  | 'show-welcome' // State 3: Showing welcome animation
  | 'fade-out' // State 4: Fading out to content
  | 'access-denied' // State 3 (alt): Access denied
  | 'content'; // Final: Show content

/**
 * Component that restricts access to dev and ephemeral environments
 * based on PostHog feature flags
 */
export function EnvironmentAccessGuard({
  children,
  fallback,
}: EnvironmentAccessGuardProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>('theme-check');
  const [taglineIndex, setTaglineIndex] = useState(0);

  // Set random tagline only on client side to avoid hydration mismatch
  React.useEffect(() => {
    setTaglineIndex(Math.floor(Math.random() * 9));
  }, []);

  const { isLoaded: isUserLoaded, user, isSignedIn } = useUser();

  // Use PostHog React hook for feature flag
  const hasAccess = useFeatureFlagEnabled('dev-environment-access');

  const { isInitialized, initialize, applyThemeToDocument } = useThemeStore();

  // Core access logic
  const isFeatureFlagChecked = hasAccess !== undefined;

  // Theme is fully ready when initialized
  const isThemeReady = isInitialized;

  // Initialize theme once user data is loaded
  React.useEffect(() => {
    if (isUserLoaded && !isInitialized) {
      // Extract user theme preferences from user data
      const userTheme = user?.publicMetadata?.theme as
        | 'light'
        | 'dark'
        | 'system'
        | undefined;
      const userColorTheme = user?.publicMetadata?.colorTheme as
        | string
        | undefined;
      const userSecondaryColorTheme = user?.publicMetadata
        ?.secondaryColorTheme as string | undefined;

      initialize({
        isSignedIn: !!isSignedIn,
        userTheme,
        userColorTheme: userColorTheme as PrimaryColorTheme | undefined,
        userSecondaryColorTheme: userSecondaryColorTheme as
          | SecondaryColorTheme
          | undefined,
      });
      // Apply theme immediately after initialization
      applyThemeToDocument();
      // State 1 -> State 2: Move to access-check once theme is ready
      setLoadingState('access-check');
    }
  }, [
    isUserLoaded,
    isSignedIn,
    user,
    isInitialized,
    initialize,
    applyThemeToDocument,
  ]);

  // State progression logic
  React.useEffect(() => {
    // State 2 -> State 2.5/3-alt: Once access is determined
    if (loadingState === 'access-check' && isFeatureFlagChecked) {
      if (hasAccess) {
        // Transition to post-check-fade-out
        setTimeout(() => setLoadingState('post-check-fade-out'), 200);
      } else if (hasAccess === false) {
        setLoadingState('access-denied');
      }
    }

    // State 2.5 -> State 3: After dots fade out
    if (loadingState === 'post-check-fade-out') {
      setTimeout(() => setLoadingState('show-welcome'), 300);
    }

    // State 3 -> State 4: After welcome animation
    if (loadingState === 'show-welcome') {
      setTimeout(() => setLoadingState('fade-out'), 2650);
    }

    // State 4 -> Final: After fade out
    if (loadingState === 'fade-out') {
      setTimeout(() => setLoadingState('content'), 1300);
    }
  }, [loadingState, isThemeReady, isFeatureFlagChecked, hasAccess]);

  const welcomeMessage = React.useMemo(() => {
    const taglines = [
      'what am i doing here',
      'professional vibe checker',
      "careful don't vibe too hard",
      "it's a vibe",
      'no chill only vibes',
      'vibe now or vibe later',
      "it's a thing to do",
      'the nothing app',
      'who told you about this',
    ];
    const selectedTagline = taglines[taglineIndex % taglines.length];
    return selectedTagline;
  }, [taglineIndex]);

  if (
    loadingState === 'theme-check' ||
    loadingState === 'access-check' ||
    loadingState === 'post-check-fade-out' ||
    loadingState === 'show-welcome' ||
    loadingState === 'fade-out'
  ) {
    return (
      <div
        data-state={loadingState}
        className={cn(
          'to-66%, flex min-h-screen items-center justify-center bg-gradient-to-br transition duration-500',
          'data-[state=theme-check]:from-white data-[state=theme-check]:to-white',
          'data-[state=access-check]:from-theme-primary data-[state=access-check]:to-theme-secondary',
          'data-[state=post-check-fade-out]:from-theme-primary data-[state=post-check-fade-out]:to-theme-secondary',
          'data-[state=show-welcome]:from-theme-primary data-[state=show-welcome]:to-theme-secondary',
          'data-[state=fade-out]:from-background data-[state=fade-out]:to-background data-[state=fade-out]:delay-700 data-[state=fade-out]:duration-600'
        )}
      >
        <div className="space-y-6 text-center">
          <div
            data-state={loadingState}
            className="flex flex-col items-center space-y-2 transition duration-800 data-[state=fade-out]:scale-105 data-[state=fade-out]:opacity-0"
          >
            <p
              data-state={loadingState}
              className={cn(
                'inline-flex w-full items-center justify-center bg-transparent text-4xl font-bold transition duration-500 data-[state=fade-out]:opacity-0'
              )}
            >
              {Array.from(
                typeof APP_NAME === 'string' ? APP_NAME : 'vibechecc'
              ).map((char, i) => (
                <span
                  data-state={loadingState}
                  className={cn(
                    'text-foreground animate-pulse-text m-0 inline-flex rounded-full bg-transparent p-0 leading-none tracking-[-1px] transition duration-800',
                    'data-[state=theme-check]:text-foreground',
                    'data-[state=access-check]:text-white',
                    'data-[state=post-check-fade-out]:text-white',
                    'data-[state=show-welcome]:text-white',
                    'data-[state=fade-out]:opacity-0'
                  )}
                  key={i}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {char}
                </span>
              ))}
            </p>
            <div className="flex-flex-col relative h-6 w-full items-center justify-center">
              <div
                data-state={loadingState}
                className={cn(
                  'absolute inset-0 m-auto inline-flex items-center justify-center gap-1 opacity-100 transition duration-300',
                  'data-[state=post-check-fade-out]:opacity-0',
                  'data-[state=show-welcome]:hidden',
                  'data-[state=fade-out]:hidden'
                )}
              >
                <span
                  data-state={loadingState}
                  className={cn(
                    'animate-pulse-dot inline-block size-2 rounded-full bg-black transition duration-800',
                    'data-[state=theme-check]:bg-black',
                    'data-[state=access-check]:bg-white',
                    'data-[state=post-check-fade-out]:bg-white',
                    'data-[state=show-welcome]:bg-white'
                  )}
                />
                <span
                  data-state={loadingState}
                  className={cn(
                    'animate-pulse-dot inline-block size-2 rounded-full bg-black transition duration-800',
                    'data-[state=theme-check]:bg-black',
                    'data-[state=access-check]:bg-white',
                    'data-[state=post-check-fade-out]:bg-white',
                    'data-[state=show-welcome]:bg-white'
                  )}
                  style={{ animationDelay: '300ms' }}
                />
                <span
                  data-state={loadingState}
                  className={cn(
                    'animate-pulse-dot inline-block size-2 rounded-full bg-black transition duration-800',
                    'data-[state=theme-check]:bg-black',
                    'data-[state=access-check]:bg-white',
                    'data-[state=post-check-fade-out]:bg-white',
                    'data-[state=show-welcome]:bg-white'
                  )}
                  style={{ animationDelay: '600ms' }}
                />
              </div>
              <div
                data-state={loadingState}
                className={cn(
                  'absolute inset-0 hidden',
                  'data-[state=post-check-fade-out]:inline-flex',
                  'data-[state=show-welcome]:inline-flex',
                  'data-[state=fade-out]:inline-flex'
                )}
              >
                <p
                  data-state={loadingState}
                  className="inline-flex w-full items-center justify-center text-center text-lg font-medium text-white opacity-0 transition duration-800 data-[state=fade-out]:opacity-0 data-[state=show-welcome]:opacity-100"
                >
                  {Array.from(welcomeMessage).map((char, i) => (
                    <span
                      data-state={loadingState}
                      className="animate-pulse-text m-0 h-fit w-fit rounded-full bg-transparent p-0 leading-none tracking-[-1px] whitespace-pre transition duration-800 data-[state=fade-out]:opacity-0"
                      key={i}
                      style={{ animationDelay: `${i * 25}ms` }}
                    >
                      {char}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // (alt): Access denied
  if (loadingState === 'access-denied') {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md space-y-8 p-6 text-center">
          <div className="space-y-4">
            <span className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
              vibechecc
            </span>
            <div className="space-y-2">
              <h1 className="text-foreground text-2xl font-semibold">
                access restricted
              </h1>
              <p className="text-muted-foreground">
                Access to the development environment is restricted to
                authorized developers.'
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <SignInButton mode="modal">
              <Button className="from-theme-primary to-theme-secondary h-12 w-full bg-gradient-to-r text-base font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg">
                <LogIn className="mr-2 h-5 w-5" />
                sign in to vibechecc
              </Button>
            </SignInButton>
          </div>

          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              if you believe this is an error, please contact{' '}
              <a
                href="mailto:admin@vibechecc.io"
                className="text-theme-primary hover:text-theme-primary/80 underline transition-colors"
              >
                admin@vibechecc.io
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Final state: Show content
  return <>{children}</>;
}
