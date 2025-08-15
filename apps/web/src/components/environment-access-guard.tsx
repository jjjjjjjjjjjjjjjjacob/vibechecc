import { useEffect, useState, type ReactNode } from 'react';
import * as React from 'react';
import { SignInButton, useUser } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import { LogIn } from '@/components/ui/icons';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { usePostHog } from '@/hooks/use-posthog';
import { useThemeStore } from '@/stores/theme-store';
import { APP_NAME } from '@/config/app';
import {
  getEnvironmentInfo,
  getAccessDenialMessage,
  trackEnvironmentAccess,
  getReadinessState,
  type ReadinessState,
} from '@/lib/environment-access';
import {
  getMockConfig,
  getMockedEnvironmentInfo,
  MockStatusIndicator,
  type MockEnvironmentConfig,
} from '@/lib/environment-mock';

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
  const [showWelcome, setShowWelcome] = useState(false);
  const [shouldShowContent, setShouldShowContent] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Start with false to match SSR, then update after mount
  const [isPostHogReady, setIsPostHogReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isInitialized: isPostHogInitialized } = usePostHog();
  const { isLoaded: isUserLoaded, user, isSignedIn } = useUser();

  // Use PostHog React hook for feature flag - this will automatically update when the flag changes
  const devAccessFlag = useFeatureFlagEnabled('dev-environment-access');

  const {
    isThemeLoaded,
    isLocalStorageLoaded,
    getEffectiveColorTheme,
    getEffectiveSecondaryColorTheme,
    setUserSignedIn,
    loadThemeFromLocalStorage,
    syncUserThemePreferences,
  } = useThemeStore();

  // Get mock config for testing - only on client to avoid SSR mismatch
  const [mockConfig, setMockConfig] = useState<MockEnvironmentConfig>(() => {
    // Initial state must match server (no mocking during SSR)
    if (typeof window === 'undefined') {
      return { enabled: false };
    }
    return { enabled: false }; // Start with disabled to match SSR
  });

  // Load mock config after mount to avoid hydration issues
  React.useEffect(() => {
    const config = getMockConfig();
    if (config.enabled) {
      setMockConfig(config);
    }
  }, []);

  // Use mocked environment info if available, otherwise use real info
  const envInfo = React.useMemo(() => {
    const mockedInfo = getMockedEnvironmentInfo(mockConfig);
    return mockedInfo || getEnvironmentInfo();
  }, [mockConfig]);

  // Check if we're on an allowlisted host after mount
  React.useEffect(() => {
    // Show mock indicator if in mock mode and on allowlisted host
    if (envInfo.isAllowlistedHost && mockConfig.enabled) {
      MockStatusIndicator()?.render();
    }
  }, [mockConfig, envInfo.isAllowlistedHost]);

  // Apply mock access override if configured - start with real flag for SSR
  const [effectiveDevAccessFlag, setEffectiveDevAccessFlag] = useState<
    boolean | undefined
  >(devAccessFlag);

  // Update effective flag when mock config or real flag changes
  React.useEffect(() => {
    if (mockConfig.enabled && mockConfig.hasDevAccess !== undefined) {
      // Convert null to undefined for TypeScript compatibility
      setEffectiveDevAccessFlag(
        mockConfig.hasDevAccess === null ? undefined : mockConfig.hasDevAccess
      );
    } else {
      setEffectiveDevAccessFlag(devAccessFlag);
    }
  }, [mockConfig, devAccessFlag]);

  // Determine if feature flag has loaded (not undefined)
  // On allowlisted hosts when NOT mocking, consider flag loaded
  const isFeatureFlagLoaded =
    effectiveDevAccessFlag !== undefined ||
    (envInfo.isAllowlistedHost && !mockConfig.enabled); // Only bypass for allowlisted hosts when NOT mocking

  // Calculate access - start with SSR-safe default
  const [hasAccess, setHasAccess] = useState<boolean>(() => {
    // During SSR or initial client render, use default logic without mocks
    if (typeof window === 'undefined') {
      return false; // SSR default - deny until verified
    }
    // Initial client state should match SSR - deny until feature flag is checked
    return false;
  });

  // Update access calculation after mount when all data is available
  React.useEffect(() => {
    // If we're mocking on an allowlisted host, use the mocked environment requirements
    if (mockConfig.enabled && envInfo.isAllowlistedHost) {
      // Check if environment requires dev access
      if (envInfo.requiresDevAccess === true) {
        // Environment requires dev access, check the flag
        setHasAccess(effectiveDevAccessFlag === true);
      } else if (envInfo.requiresDevAccess === false) {
        // Environment explicitly doesn't require dev access
        setHasAccess(true);
      } else {
        // requiresDevAccess is undefined/null - deny by default
        setHasAccess(false);
      }
    } else if (envInfo.isAllowlistedHost) {
      // Non-mock behavior: allowlisted hosts always have access
      setHasAccess(true);
    } else {
      // Production behavior: explicit checks
      if (envInfo.requiresDevAccess === true) {
        // Environment requires dev access, must have the flag
        setHasAccess(effectiveDevAccessFlag === true);
      } else if (envInfo.requiresDevAccess === false) {
        // Environment explicitly doesn't require dev access (production)
        setHasAccess(true);
      } else {
        // requiresDevAccess is undefined/null - deny by default
        setHasAccess(false);
      }
    }
  }, [
    mockConfig,
    envInfo.isAllowlistedHost,
    envInfo.requiresDevAccess,
    effectiveDevAccessFlag,
  ]);

  // Get readiness state - use the stable PostHog state
  const readiness: ReadinessState = getReadinessState(
    isLocalStorageLoaded,
    isThemeLoaded,
    isUserLoaded,
    isPostHogReady, // Use stable state instead of directly from hook
    isFeatureFlagLoaded ? hasAccess : null // Pass null if flag not loaded yet
  );

  // Initialize theme from localStorage on mount
  React.useEffect(() => {
    loadThemeFromLocalStorage();
  }, [loadThemeFromLocalStorage]);

  // Track when component is mounted
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update PostHog ready state after mount to avoid hydration mismatch
  React.useEffect(() => {
    // Only update after mount to ensure SSR/client consistency
    if (isMounted) {
      setIsPostHogReady(isPostHogInitialized);
    }
  }, [isMounted, isPostHogInitialized]);

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

  // Add timeout to prevent infinite loading if Clerk fails to initialize
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!readiness.isFullyReady && !shouldShowContent) {
        // eslint-disable-next-line no-console
        console.warn(
          'environment access guard timed out - proceeding with fallback'
        );
        setHasTimedOut(true);
        setShouldShowContent(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);
  }, [readiness.isFullyReady, shouldShowContent]);

  // Show welcome when fully ready, then fade to content after 2 seconds
  React.useEffect(() => {
    // Only proceed if fully ready AND feature flag has been loaded
    if (readiness.isFullyReady && isFeatureFlagLoaded) {
      if (hasAccess) {
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
      } else {
        // If no access, immediately set shouldShowContent to show the access denied screen
        setShouldShowContent(true);
      }
    }
  }, [readiness.isFullyReady, hasAccess, isFeatureFlagLoaded]);

  // Track environment access attempts
  useEffect(() => {
    if (isPostHogReady && typeof effectiveDevAccessFlag === 'boolean') {
      trackEnvironmentAccess(hasAccess, envInfo);
    }
  }, [isPostHogReady, effectiveDevAccessFlag, hasAccess, envInfo]);

  // Use a stable tagline index that won't change between server and client
  const [taglineIndex] = useState(() => {
    // Use a deterministic value for SSR (always use first tagline)
    // On client, we could use random but keeping it stable prevents hydration issues
    return 0;
  });

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

    return Array.from(selectedTagline).map((char, i) => (
      <span
        data-theme-ready={String(readiness.isFullyReady)}
        className="data-[theme-ready=false]:text-foreground animate-pulse-text m-0 h-fit w-fit rounded-full bg-transparent p-0 leading-none tracking-[-1px] whitespace-pre transition duration-800 data-[theme-ready=true]:text-white"
        key={i}
        style={{ animationDelay: `${i * 25}ms` }}
      >
        {char}
      </span>
    ));
  }, [readiness.isFullyReady, taglineIndex]);

  // Show loading/welcome state while not ready or showing welcome (unless timed out)
  if (!shouldShowContent && !hasTimedOut) {
    return (
      <div
        className="data-[theme-ready=true]:from-theme-primary data-[theme-ready=true]:to-theme-secondary flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-white transition duration-500 data-[fading-out=true]:opacity-0 data-[fading-out=true]:delay-700 data-[fading-out=true]:duration-600"
        data-theme-ready={String(readiness.isThemeReady)}
        data-posthog-ready={String(readiness.isPostHogReady)}
        data-fully-ready={String(readiness.isFullyReady)}
        data-show-welcome={String(showWelcome)}
        data-has-access={String(hasAccess)}
        data-fading-out={String(isFadingOut)}
        data-has-custom-theme={String(
          !!(getEffectiveColorTheme() && getEffectiveSecondaryColorTheme())
        )}
      >
        <div className="space-y-6 text-center">
          <div
            className="flex flex-col space-y-2 transition duration-800 data-[fading-out=true]:scale-105 data-[fading-out=true]:opacity-0"
            data-fading-out={String(isFadingOut)}
          >
            <p
              data-theme-ready={String(readiness.isThemeReady)}
              className="data-[theme-ready=false]:text-foreground inline-flex w-full bg-transparent text-4xl font-bold duration-500 data-[theme-ready=true]:text-white"
            >
              {Array.from(APP_NAME as string).map((char, i) => (
                <span
                  data-theme-ready={String(readiness.isFullyReady)}
                  className="data-[theme-ready=false]:text-foreground animate-pulse-text m-0 h-fit w-fit rounded-full bg-transparent p-0 leading-none tracking-[-1px] transition duration-800 data-[theme-ready=true]:text-white"
                  key={i}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {char}
                </span>
              ))}
            </p>

            <div className="relative flex h-6 w-full items-center justify-center transition duration-500">
              <p
                data-theme-ready={String(readiness.isFullyReady)}
                data-show-welcome={String(showWelcome)}
                className="data-[theme-ready=false]:text-foreground absolute inset-0 inline-flex w-full items-center justify-center text-center text-lg font-medium opacity-100 transition delay-800 duration-800 data-[show-welcome=false]:opacity-0 data-[theme-ready=true]:text-white"
                style={{ animationDelay: `300ms` }}
              >
                {welcomeMessage}
              </p>
              <div
                data-show-welcome={String(
                  showWelcome || isFadingOut || shouldShowContent
                )}
                data-dots-initialized={String(
                  readiness.isThemeReady || readiness.isFullyReady
                )}
                className="animate-text-pulse absolute inset-0 flex items-center justify-center gap-1.5 p-0 transition duration-300 data-[show-welcome=true]:opacity-0"
              >
                <span
                  data-dots-initialized={String(
                    readiness.isThemeReady || readiness.isFullyReady
                  )}
                  className="data-[dots-initialized=false]:bg-foreground animate-pulse-dot inline-block size-2 rounded-full bg-white transition duration-800 data-[dots-initialized=true]:bg-white"
                />
                <span
                  data-dots-initialized={String(
                    readiness.isThemeReady || readiness.isFullyReady
                  )}
                  className="data-[dots-initialized=false]:bg-foreground animate-pulse-dot inline-block size-2 rounded-full bg-white transition duration-800 data-[dots-initialized=true]:bg-white"
                  style={{ animationDelay: '300ms' }}
                />
                <span
                  data-dots-initialized={String(
                    readiness.isThemeReady || readiness.isFullyReady
                  )}
                  className="data-[dots-initialized=false]:bg-foreground animate-pulse-dot inline-block size-2 rounded-full bg-white transition duration-800 data-[dots-initialized=true]:bg-white"
                  style={{ animationDelay: '600ms' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show access denied if feature flag is loaded and user doesn't have access
  if (isFeatureFlagLoaded && !hasAccess) {
    const message = getAccessDenialMessage(envInfo);

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
              <p className="text-muted-foreground">{message}</p>
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
              environment:{' '}
              <span className="font-mono">
                {envInfo.subdomain || 'production'}
                {mockConfig.enabled && ' (mocked)'}
              </span>
            </p>
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

  // Show content when ready or if timed out with error recovery
  if (shouldShowContent || hasTimedOut) {
    // If we timed out, show a warning but still render the app
    if (hasTimedOut && !readiness.isFullyReady) {
      return (
        <>
          <div className="bg-destructive/10 border-destructive/20 fixed top-16 right-0 left-0 z-40 border-b p-2 text-center">
            <p className="text-destructive text-sm">
              authentication service is taking longer than expected - some
              features may be limited
            </p>
          </div>
          {children}
        </>
      );
    }
    return <>{children}</>;
  }

  // This shouldn't happen, but fallback to content if something goes wrong
  return <>{children}</>;
}
