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
      title: 'Share Vibes',
      description:
        'Create and share your favorite moments, places, and feelings',
    },
    {
      icon: Star,
      title: 'Rate & Discover',
      description: 'Rate vibes from others and discover new experiences',
    },
    {
      icon: Zap,
      title: 'React & Connect',
      description:
        'Express yourself with emoji reactions and connect with others',
    },
  ];

  return (
    <div className="space-y-8 text-center">
      {/* Hero Section */}
      <div className="space-y-4 animate-fade-in-down">
        <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-orange-500">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-4xl font-bold text-transparent">
          Welcome to viberater!
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-xl">
          The place to discover, share, and connect through vibes that matter to
          you.
        </p>
      </div>

      {/* Features Grid */}
      <div 
        className="grid gap-6 md:grid-cols-3 animate-fade-in-down opacity-0"
        style={{ animation: 'fade-in-down 0.5s ease-out 0.2s forwards' }}
      >
        {features.map((feature, index) => (
          <Card
            key={index}
            className="border-border/50 border-2 transition-colors hover:border-pink-200"
          >
            <CardContent className="space-y-3 p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-100 to-orange-100 dark:from-pink-900 dark:to-orange-900">
                <feature.icon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
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
        className="space-y-4 animate-fade-in-down opacity-0"
        style={{ animation: 'fade-in-down 0.5s ease-out 0.4s forwards' }}
      >
        <p className="text-muted-foreground">
          Let's get you set up in just a few quick steps!
        </p>
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-pink-500 to-orange-500 px-8 py-3 text-lg text-white hover:from-pink-600 hover:to-orange-600"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
