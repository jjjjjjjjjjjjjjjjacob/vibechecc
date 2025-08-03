import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Heart, Star, Zap } from 'lucide-react';

interface OnboardingWelcomeStepProps {
  onNext: () => void;
}

export function OnboardingWelcomeStep({ onNext }: OnboardingWelcomeStepProps) {
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
      <div className="animate-fade-in-down space-y-4">
        <div className="from-theme-primary to-theme-secondary mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
          welcome to viberatr
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-xl">
          a place to discover, share, and connect through vibes that matter to
          you
        </p>
      </div>

      {/* Features Grid */}
      <div
        className="animate-fade-in-down grid gap-6 opacity-0 md:grid-cols-3"
        style={{ animation: 'fade-in-down 0.5s ease-out 0.2s forwards' }}
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
        className="animate-fade-in-down space-y-4 opacity-0"
        style={{ animation: 'fade-in-down 0.5s ease-out 0.4s forwards' }}
      >
        <p className="text-muted-foreground">
          let's get you set up in just a few quick steps
        </p>
        <Button
          onClick={onNext}
          size="lg"
          className="from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 bg-gradient-to-r px-8 py-3 text-lg"
        >
          get started
        </Button>
      </div>
    </div>
  );
}
