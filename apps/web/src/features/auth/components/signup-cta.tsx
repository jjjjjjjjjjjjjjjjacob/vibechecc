import { useState, useEffect } from 'react';
import { SignInButton, SignUpButton } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Heart,
  Users,
  TrendingUp,
  Star,
  MessageCircle,
  X,
} from '@/components/ui/icons';
import { cn } from '@/utils';
import { useAnonymousUserStore } from '@/stores';
import { trackEvents } from '@/lib/track-events';
import { useIsMobile } from '@/hooks/use-mobile';

interface SignupCtaProps {
  variant: 'minimal' | 'engagement' | 'social' | 'trending' | 'feature-gate';
  context: string;
  placement: string;
  triggerData?: {
    vibesViewed?: number;
    interactionAttempted?: boolean;
    featureBlocked?: string;
  };
  onDismiss?: () => void;
  className?: string;
}

// Progressive messaging variants based on user engagement
const getProgressiveVariant = (
  baseVariant: keyof typeof ctaVariants,
  sessionTimeMinutes: number,
  vibesViewed: number,
  hasAttemptedInteraction: boolean
) => {
  // Level 1: Initial exposure (0-2 minutes, 0-2 vibes)
  if (sessionTimeMinutes < 2 && vibesViewed < 3) {
    return 'gentle';
  }

  // Level 2: Engaged browsing (2-5 minutes, 3-7 vibes)
  if (sessionTimeMinutes < 5 && vibesViewed < 8) {
    return 'interested';
  }

  // Level 3: Highly engaged (5+ minutes, 8+ vibes, or attempted interaction)
  if (sessionTimeMinutes >= 5 || vibesViewed >= 8 || hasAttemptedInteraction) {
    return 'committed';
  }

  return baseVariant;
};

const ctaVariants = {
  minimal: {
    title: 'join vibechecc',
    description: 'create your account to start sharing vibes',
    primaryCta: 'sign up',
    secondaryCta: 'sign in',
    icon: Sparkles,
    badge: null,
  },
  engagement: {
    title: 'love what you see?',
    description: 'join thousands rating and sharing vibes daily',
    primaryCta: 'start rating vibes',
    secondaryCta: 'sign in',
    icon: Heart,
    badge: 'most popular',
  },
  social: {
    title: 'connect with vibe creators',
    description: 'follow your favorite creators and discover new vibes',
    primaryCta: 'join the community',
    secondaryCta: 'sign in',
    icon: Users,
    badge: 'social',
  },
  trending: {
    title: 'join the trending vibes',
    description: 'be part of the latest vibe conversations',
    primaryCta: 'explore trending',
    secondaryCta: 'sign in',
    icon: TrendingUp,
    badge: 'trending',
  },
  'feature-gate': {
    title: 'unlock this feature',
    description: 'sign up to rate vibes and join conversations',
    primaryCta: 'unlock now',
    secondaryCta: 'sign in',
    icon: Star,
    badge: 'premium feature',
  },
  // Progressive variants
  gentle: {
    title: 'welcome to vibechecc',
    description: 'discover amazing vibes shared by our community',
    primaryCta: 'explore more',
    secondaryCta: 'sign in',
    icon: Sparkles,
    badge: null,
  },
  interested: {
    title: 'finding good vibes?',
    description: 'create an account to save favorites and follow creators',
    primaryCta: 'join the community',
    secondaryCta: 'sign in',
    icon: Heart,
    badge: 'recommended',
  },
  committed: {
    title: 'ready to join the conversation?',
    description:
      'you seem to love what you see! become part of our vibrant community',
    primaryCta: 'start creating',
    secondaryCta: 'sign in',
    icon: TrendingUp,
    badge: 'time to join',
  },
};

export function SignupCta({
  variant,
  context,
  placement,
  triggerData,
  onDismiss,
  className,
}: SignupCtaProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const {
    recordCtaInteraction,
    dismissCta,
    shouldShowCta,
    vibesViewed,
    sessionStartTime,
    actions,
    assignAbTest,
  } = useAnonymousUserStore();
  const isMobile = useIsMobile();

  // A/B test for CTA messaging
  const messagingVariant = assignAbTest('cta_messaging_v1', [
    'default',
    'urgent',
    'social_proof',
  ]);
  const colorVariant = assignAbTest('cta_colors_v1', [
    'gradient',
    'solid',
    'outline',
  ]);
  const mobileLayoutVariant = assignAbTest('mobile_layout_v1', [
    'stacked',
    'compact',
    'sticky',
  ]);

  // Calculate engagement metrics for progressive messaging
  const sessionTimeMinutes = (Date.now() - sessionStartTime) / (1000 * 60);
  const hasAttemptedInteraction = actions.some(
    (a) => a.type === 'rating_attempt' || a.type === 'follow_attempt'
  );

  // Determine effective variant based on engagement (for applicable base variants)
  const shouldUseProgressive = ['engagement', 'minimal', 'social'].includes(
    variant
  );
  const effectiveVariant = shouldUseProgressive
    ? getProgressiveVariant(
        variant as keyof typeof ctaVariants,
        sessionTimeMinutes,
        vibesViewed,
        hasAttemptedInteraction
      )
    : variant;

  let ctaConfig = ctaVariants[effectiveVariant as keyof typeof ctaVariants];

  // Apply A/B test variations
  if (messagingVariant === 'urgent') {
    ctaConfig = {
      ...ctaConfig,
      title: ctaConfig.title.includes('?')
        ? ctaConfig.title
        : `${ctaConfig.title}!`,
      primaryCta: `${ctaConfig.primaryCta} now`,
    };
  } else if (messagingVariant === 'social_proof') {
    ctaConfig = {
      ...ctaConfig,
      description: `${ctaConfig.description} (join 10k+ creators)`,
      badge: ctaConfig.badge || 'popular',
    };
  }

  const ctaId = `signup-cta-${effectiveVariant}-${context}`;
  const IconComponent = ctaConfig.icon;

  // Check if CTA should be shown
  useEffect(() => {
    const shouldShow = shouldShowCta(ctaId, context);
    setIsVisible(shouldShow);

    // Track impression
    if (shouldShow && !hasTrackedImpression) {
      recordCtaInteraction({
        ctaId,
        context,
        placement,
        action: 'impression',
      });

      trackEvents.funnelStepCompleted(
        'signup_funnel',
        'cta_shown',
        1,
        undefined,
        {
          variant,
          effectiveVariant,
          context,
          placement,
          sessionTimeMinutes,
          vibesViewed,
          hasAttemptedInteraction,
          messagingVariant,
          colorVariant,
          mobileLayoutVariant,
          isMobile,
          ...triggerData,
        }
      );

      setHasTrackedImpression(true);
    }
  }, [
    ctaId,
    context,
    placement,
    variant,
    triggerData,
    recordCtaInteraction,
    shouldShowCta,
    hasTrackedImpression,
    colorVariant,
    effectiveVariant,
    hasAttemptedInteraction,
    isMobile,
    messagingVariant,
    mobileLayoutVariant,
    sessionTimeMinutes,
    vibesViewed,
  ]);

  const handleCtaClick = (action: 'signup' | 'signin') => {
    recordCtaInteraction({
      ctaId,
      context,
      placement,
      action: 'click',
    });

    trackEvents.experimentAction(
      'signup_cta_experiment',
      effectiveVariant,
      'cta_clicked',
      {
        action,
        variant,
        effectiveVariant,
        context,
        placement,
        sessionTimeMinutes,
        vibesViewed,
        hasAttemptedInteraction,
        messagingVariant,
        colorVariant,
        ...triggerData,
      }
    );
  };

  const handleDismiss = () => {
    dismissCta(ctaId);
    recordCtaInteraction({
      ctaId,
      context,
      placement,
      action: 'dismiss',
    });

    trackEvents.funnelDropoff(
      'signup_funnel',
      'cta_dismissed',
      1,
      'user_dismissed',
      {
        variant,
        effectiveVariant,
        context,
        placement,
        sessionTimeMinutes,
        vibesViewed,
        hasAttemptedInteraction,
      }
    );

    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  // Mobile-specific layout variants
  const isMobileSticky = isMobile && mobileLayoutVariant === 'sticky';
  const isMobileCompact = isMobile && mobileLayoutVariant === 'compact';

  return (
    <Card
      className={cn(
        'border-theme-primary/20 from-background/95 to-theme-primary/5 relative border-2 border-dashed bg-gradient-to-br backdrop-blur-sm',
        'hover:border-theme-primary/40 hover:shadow-theme-primary/10 transition-all duration-300 hover:shadow-lg',
        {
          // Mobile sticky variant - fixed bottom positioning
          'fixed right-4 bottom-4 left-4 z-50 shadow-2xl': isMobileSticky,
          // Mobile compact variant - smaller padding and text
          'text-sm': isMobileCompact,
          // Default responsive behavior
          'mx-auto max-w-sm': isMobile && mobileLayoutVariant === 'stacked',
        },
        className
      )}
    >
      {onDismiss && (
        <Button
          variant="ghost"
          size={isMobileCompact ? 'sm' : 'sm'}
          onClick={handleDismiss}
          className={cn(
            'hover:bg-muted/50 absolute top-2 right-2 p-0',
            isMobileCompact ? 'h-5 w-5' : 'h-6 w-6'
          )}
        >
          <X className={cn(isMobileCompact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
        </Button>
      )}

      <CardHeader className={cn('pb-3', isMobileCompact && 'px-3 pt-3 pb-2')}>
        <div
          className={cn('flex items-center gap-3', isMobileCompact && 'gap-2')}
        >
          {!isMobileCompact && (
            <div
              className={cn(
                'from-theme-primary to-theme-secondary flex items-center justify-center rounded-full bg-gradient-to-r',
                isMobileCompact ? 'h-8 w-8' : 'h-10 w-10'
              )}
            >
              <IconComponent
                className={cn(
                  'text-white',
                  isMobileCompact ? 'h-4 w-4' : 'h-5 w-5'
                )}
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle
                className={cn(
                  'font-semibold',
                  isMobileCompact ? 'text-base' : 'text-lg'
                )}
              >
                {isMobileCompact && (
                  <IconComponent className="mr-1 inline h-4 w-4" />
                )}
                {ctaConfig.title}
              </CardTitle>
              {ctaConfig.badge && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'font-medium',
                    isMobileCompact ? 'text-xs' : 'text-xs'
                  )}
                >
                  {ctaConfig.badge}
                </Badge>
              )}
            </div>
            <CardDescription
              className={cn(
                'text-muted-foreground',
                isMobileCompact ? 'text-xs' : 'text-sm'
              )}
            >
              {ctaConfig.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn('pt-0', isMobileCompact && 'px-3 pb-3')}>
        <div
          className={cn(
            'flex gap-3',
            isMobileCompact ? 'flex-row' : 'flex-col gap-3 sm:flex-row'
          )}
        >
          <SignUpButton mode="modal">
            <Button
              onClick={() => handleCtaClick('signup')}
              className={cn(
                'font-semibold transition-all hover:scale-[1.02] hover:shadow-lg',
                isMobileCompact ? 'h-8 flex-1 text-sm' : 'h-10 flex-1',
                'text-white',
                {
                  'from-theme-primary to-theme-secondary hover:shadow-theme-primary/25 bg-gradient-to-r':
                    colorVariant === 'gradient',
                  'bg-theme-primary hover:bg-theme-primary/90 hover:shadow-theme-primary/25':
                    colorVariant === 'solid',
                  'border-theme-primary text-theme-primary hover:bg-theme-primary border-2 bg-transparent hover:text-white':
                    colorVariant === 'outline',
                }
              )}
            >
              <Sparkles
                className={cn('mr-2', isMobileCompact ? 'h-3 w-3' : 'h-4 w-4')}
              />
              {isMobileCompact
                ? ctaConfig.primaryCta.split(' ')[0] || ctaConfig.primaryCta
                : ctaConfig.primaryCta}
            </Button>
          </SignUpButton>

          {!isMobileCompact && (
            <SignInButton mode="modal">
              <Button
                variant="outline"
                onClick={() => handleCtaClick('signin')}
                className={cn(
                  'border-theme-primary/20 text-theme-primary hover:bg-theme-primary/5 hover:border-theme-primary/40',
                  isMobileCompact ? 'h-8 flex-1 text-sm' : 'h-10 flex-1'
                )}
              >
                {ctaConfig.secondaryCta}
              </Button>
            </SignInButton>
          )}
        </div>

        {/* Additional context-specific content */}
        {variant === 'engagement' && triggerData?.vibesViewed && (
          <div className="text-muted-foreground mt-3 flex items-center justify-center gap-1 text-xs">
            <MessageCircle className="h-3 w-3" />
            <span>you've viewed {triggerData.vibesViewed} vibes so far</span>
          </div>
        )}

        {variant === 'feature-gate' && triggerData?.featureBlocked && (
          <div className="text-muted-foreground mt-3 flex items-center justify-center gap-1 text-xs">
            <Star className="h-3 w-3" />
            <span>unlock {triggerData.featureBlocked} and more</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Convenience components for specific contexts
export function FeedSignupCta({
  vibesViewed,
  className,
}: {
  vibesViewed: number;
  className?: string;
}) {
  return (
    <SignupCta
      variant="engagement"
      context="after_vibe_views"
      placement="feed"
      triggerData={{ vibesViewed }}
      className={className}
    />
  );
}

export function InteractionGateCta({
  featureBlocked,
  onDismiss,
  className,
}: {
  featureBlocked: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <SignupCta
      variant="feature-gate"
      context="after_interaction_attempt"
      placement="modal"
      triggerData={{ featureBlocked, interactionAttempted: true }}
      onDismiss={onDismiss}
      className={className}
    />
  );
}

export function SocialSignupCta({ className }: { className?: string }) {
  return (
    <SignupCta
      variant="social"
      context="social_discovery"
      placement="profile"
      className={className}
    />
  );
}

export function TrendingSignupCta({ className }: { className?: string }) {
  return (
    <SignupCta
      variant="trending"
      context="trending_content"
      placement="discover"
      className={className}
    />
  );
}
