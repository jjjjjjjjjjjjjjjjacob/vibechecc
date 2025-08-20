import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Sparkles, ArrowRight, Plus } from '@/components/ui/icons';
import { Link } from '@tanstack/react-router';

interface OnboardingCompleteStepProps {
  onComplete: () => void;
  isLoading?: boolean;
}

export function OnboardingCompleteStep({
  onComplete,
  isLoading = false,
}: OnboardingCompleteStepProps) {
  // Scroll to top on mount (especially important for mobile)
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const nextSteps = [
    {
      icon: Plus,
      title: 'create your first vibe',
      description: 'share something that inspires you',
      action: 'create vibe',
      href: '/vibes/create',
    },
    {
      icon: Sparkles,
      title: 'explore the community',
      description: 'discover vibes from other creators',
      action: 'browse vibes',
      href: '/discover',
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8 text-center">
      {/* Success Animation */}
      <div className="animate-bounceIn flex justify-center">
        <div className="relative">
          <div className="from-theme-primary to-theme-secondary flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-gradient-to-r shadow-lg">
            <CheckCircle className="animate-wiggle h-12 w-12 text-white" />
          </div>
          {/* Animated rings */}
          <div className="border-primary/30 absolute inset-0 animate-ping rounded-full border-4" />
          <div
            className="border-theme-secondary/30 absolute inset-0 animate-ping rounded-full border-4"
            style={{ animationDelay: '0.3s' }}
          />
        </div>
      </div>

      {/* Success Message */}
      <div
        className="animate-fadeInUp space-y-4"
        style={{ animationDelay: '0.4s' }}
      >
        <h1 className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
          you're all set
        </h1>
        <p className="text-muted-foreground text-xl">
          welcome to the vibechecc community!
          <br />
          you're ready to start discovering and sharing vibes.
        </p>
      </div>

      {/* Next Steps */}
      <div
        className="animate-fadeInUp space-y-4"
        style={{ animationDelay: '0.6s' }}
      >
        <h2 className="text-foreground text-xl font-semibold">what's next?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {nextSteps.map((step, index) => (
            <div
              key={index}
              className={`${index === 0 ? 'animate-fadeInLeft' : 'animate-fadeInRight'}`}
              style={{ animationDelay: `${0.8 + index * 0.1}s` }}
            >
              <Link to={step.href} className="block">
                <Card className="border-border/50 group hover:border-primary/20 cursor-pointer border-2 transition-colors">
                  <CardContent className="space-y-3 p-6 text-center">
                    <div className="from-theme-primary/10 to-theme-secondary/10 dark:from-theme-primary/20 dark:to-theme-secondary/20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r transition-transform group-hover:scale-110">
                      <step.icon className="text-primary h-6 w-6" />
                    </div>
                    <h3 className="text-foreground font-semibold">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                    <div className="text-primary flex items-center justify-center text-sm font-medium transition-all group-hover:gap-2">
                      <span>{step.action}</span>
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="animate-fadeInUp space-y-4"
        style={{ animationDelay: '1s' }}
      >
        <Button
          onClick={onComplete}
          disabled={isLoading}
          size="lg"
          className="from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 bg-gradient-to-r px-8 py-3 text-lg"
        >
          {isLoading ? 'finishing setup...' : 'start vibing'}
        </Button>

        <p className="text-muted-foreground text-sm">
          you can always access these features from the main navigation
        </p>
      </div>

      {/* Confetti Effect */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ animationDelay: '0.5s' }}
      >
        {[...Array(30)].map((_, i) => {
          const colors = [
            'from-theme-primary',
            'from-theme-secondary',
            'from-accent',
            'from-yellow-400',
            'from-green-400',
          ];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          const randomX = Math.random() * 100;
          const randomDelay = Math.random() * 2;
          const randomDuration = 2 + Math.random() * 1;

          return (
            <div
              key={i}
              className={`absolute opacity-80`}
              style={{
                left: `${randomX}%`,
                top: '-20px',
                animation: `confettiFall ${randomDuration}s ease-out ${randomDelay}s forwards`,
              }}
            >
              <div
                className={`${randomColor} h-2 w-2 animate-spin rounded-full bg-gradient-to-br to-transparent`}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 20px)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
