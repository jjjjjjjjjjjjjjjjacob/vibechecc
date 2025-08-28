/**
 * Hero section component with A/B testing and performance tracking
 */

import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from '@/components/ui/icons';
import { useHeroTaglineExperiment } from '@/hooks/use-hero-tagline-experiment';
import {
  usePlaceholderTracking,
  useTimeToInteractive,
} from '@/hooks/use-performance-tracking';
import { APP_NAME } from '@/utils/bindings';

interface HeroSectionProps {
  isAuthenticated: boolean;
  isClerkLoaded: boolean;
  clerkTimedOut: boolean;
  hasMounted: boolean;
}

function HeroButtonsSkeleton() {
  const { visibilityRef, trackInteraction } = usePlaceholderTracking(
    'hero-buttons-skeleton',
    {
      trackVisibility: true,
      trackInteraction: true,
      minVisibilityTime: 200,
    }
  );

  return (
    <div ref={visibilityRef} className="flex gap-3">
      <div
        className="h-10 w-32 animate-pulse rounded-md bg-white/10"
        onClick={() => trackInteraction('skeleton_click')}
      />
      <div
        className="h-10 w-36 animate-pulse rounded-md bg-white/10"
        onClick={() => trackInteraction('skeleton_click')}
      />
    </div>
  );
}

export function HeroSection({
  isAuthenticated,
  isClerkLoaded,
  clerkTimedOut,
  hasMounted,
}: HeroSectionProps) {
  const {
    variant,
    variantId,
    trackTaglineView,
    trackCtaClick,
    trackSignupConversion,
    trackVibeCreationConversion,
    trackDiscoveryConversion,
  } = useHeroTaglineExperiment();

  const { trackFirstInteraction } = useTimeToInteractive(
    'hero-section',
    hasMounted && isClerkLoaded,
    { trackFirstInteraction: true }
  );

  // Track tagline view when component mounts and is visible
  React.useEffect(() => {
    if (hasMounted) {
      trackTaglineView();
    }
  }, [hasMounted, trackTaglineView]);

  const handleCtaClick = React.useCallback(
    (
      ctaType: 'primary' | 'secondary',
      action: 'create' | 'discover' | 'signup',
      ctaText: string
    ) => {
      trackFirstInteraction('cta_click', action);
      trackCtaClick(ctaType, ctaText);

      // Track specific conversion types
      switch (action) {
        case 'create':
          trackVibeCreationConversion();
          break;
        case 'discover':
          trackDiscoveryConversion();
          break;
        case 'signup':
          trackSignupConversion();
          break;
      }
    },
    [
      trackFirstInteraction,
      trackCtaClick,
      trackVibeCreationConversion,
      trackDiscoveryConversion,
      trackSignupConversion,
    ]
  );

  return (
    <section className="container mx-auto px-4 py-8">
      <div
        data-has-mounted={hasMounted}
        data-variant={variantId}
        className="from-theme-primary to-theme-secondary animate-gradient-shift rounded-2xl bg-gradient-to-r p-8 text-white transition delay-100 duration-500 data-[has-mounted=false]:opacity-0 data-[has-mounted=true]:opacity-100 md:p-12"
        style={{ backgroundSize: '200% 200%' }}
      >
        <div className="max-w-2xl">
          <h1 className="mb-4 text-4xl font-bold lowercase md:text-5xl">
            {variant.headline}
          </h1>
          <p className="mb-6 text-lg opacity-90 md:text-xl">
            {variant.description.includes(APP_NAME)
              ? variant.description
              : variant.description.replace('vibechecc', APP_NAME)}
          </p>

          {/* Show skeleton while Clerk is loading, unless it times out */}
          {!isClerkLoaded && !clerkTimedOut ? (
            <HeroButtonsSkeleton />
          ) : (
            <>
              {clerkTimedOut && !isClerkLoaded ? (
                // Fallback UI when Clerk fails to load
                <div className="space-y-4">
                  <p className="text-lg opacity-75">
                    authentication service is currently unavailable
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="bg-secondary/10 hover:bg-primary-foreground/20 border-white/20 text-white"
                    onClick={() =>
                      handleCtaClick(
                        'secondary',
                        'discover',
                        'browse vibes anyway'
                      )
                    }
                  >
                    <Link to="/discover" search={{}}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      browse vibes anyway
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  {isAuthenticated ? (
                    <div className="flex gap-3">
                      <Button
                        asChild
                        variant="outline"
                        className="bg-secondary/10 hover:bg-primary-foreground/20 border-white/20 text-white"
                        onClick={() =>
                          handleCtaClick(
                            'primary',
                            'create',
                            variant.cta?.primary || 'create vibe'
                          )
                        }
                      >
                        <Link to="/vibes/create">
                          <Plus className="mr-2 h-4 w-4" />
                          {variant.cta?.primary || 'create vibe'}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="bg-secondary/10 hover:bg-primary-foreground/20 border-white/20 text-white"
                        onClick={() =>
                          handleCtaClick(
                            'secondary',
                            'discover',
                            variant.cta?.secondary || 'discover vibes'
                          )
                        }
                      >
                        <Link to="/discover" search={{}}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {variant.cta?.secondary || 'discover vibes'}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-lg opacity-75">
                        sign in to start creating and sharing your own vibes
                      </p>
                      <div className="flex gap-3">
                        <Button
                          asChild
                          variant="outline"
                          className="bg-secondary/10 hover:bg-primary-foreground/20 border-white/20 text-white"
                          onClick={() =>
                            handleCtaClick('primary', 'signup', 'sign up')
                          }
                        >
                          <Link to="/sign-up">
                            <Plus className="mr-2 h-4 w-4" />
                            sign up
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="bg-secondary/10 hover:bg-primary-foreground/20 border-white/20 text-white"
                          onClick={() =>
                            handleCtaClick(
                              'secondary',
                              'discover',
                              variant.cta?.secondary || 'discover vibes'
                            )
                          }
                        >
                          <Link to="/discover" search={{}}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {variant.cta?.secondary || 'discover vibes'}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
