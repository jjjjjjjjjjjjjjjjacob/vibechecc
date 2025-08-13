import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Heart, Star, Zap } from '@/components/ui/icons';

interface OnboardingWelcomeStepProps {
  onNext: () => void;
}

export function OnboardingWelcomeStep({ onNext }: OnboardingWelcomeStepProps) {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleNext = () => {
    setIsExiting(true);
    setTimeout(() => {
      onNext();
    }, 500);
  };
  const features = [
    {
      icon: Heart,
      title: 'share vibes',
      description:
        'create and share your favorite moments, places, and feelings',
    },
    {
      icon: Star,
      title: 'rate & discover',
      description: 'rate vibes from others and discover new experiences',
    },
    {
      icon: Zap,
      title: 'react & connect',
      description:
        'express yourself with emoji reactions and connect with others',
    },
  ];

  return (
    <div className="space-y-8 text-center">
      {/* Hero Section */}
      <div
        className="space-y-4 transition-all duration-500 data-[exiting=true]:translate-y-[-20px] data-[exiting=true]:scale-110 data-[exiting=true]:opacity-0"
        data-exiting={isExiting}
      >
        <div
          className="from-theme-primary to-theme-secondary mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r transition-transform duration-500 data-[exiting=true]:scale-125"
          data-exiting={isExiting}
        >
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
          welcome to vibechecc
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-xl">
          a place to discover, share, and connect through vibes that matter to
          you
        </p>
      </div>

      {/* Features Grid */}
      <div
        className="grid gap-6 transition-all delay-75 duration-500 data-[exiting=true]:translate-y-[-10px] data-[exiting=true]:opacity-0 md:grid-cols-3"
        data-exiting={isExiting}
      >
        {features.map((feature, index) => (
          <Card
            key={index}
            className="border-border/50 hover:border-primary/20 border-2 transition-colors"
          >
            <CardContent className="space-y-3 p-6 text-center">
              <div className="from-theme-primary/10 to-theme-secondary/10 dark:from-theme-primary/20 dark:to-theme-secondary/20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r">
                <feature.icon className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-foreground font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div
        className="space-y-4 transition-all delay-150 duration-500 data-[exiting=true]:translate-y-[-10px] data-[exiting=true]:opacity-0"
        data-exiting={isExiting}
      >
        <p className="text-muted-foreground">
          let's get you set up in just a few quick steps
        </p>
        <Button
          onClick={handleNext}
          size="lg"
          className="from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 bg-gradient-to-r px-8 py-3 text-lg"
        >
          get started
        </Button>
      </div>
    </div>
  );
}
