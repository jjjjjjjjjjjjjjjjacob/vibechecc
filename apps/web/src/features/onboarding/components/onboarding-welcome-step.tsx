import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from '@/components/ui/icons';

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

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-8 text-center">
      {/* Hero Section */}
      <div
        className="space-y-6 transition-all duration-500 data-[exiting=true]:translate-y-[-20px] data-[exiting=true]:scale-110 data-[exiting=true]:opacity-0"
        data-exiting={isExiting}
      >
        <div
          className="from-theme-primary to-theme-secondary mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r transition-transform duration-500 data-[exiting=true]:scale-125"
          data-exiting={isExiting}
        >
          <Sparkles className="h-12 w-12 text-white" />
        </div>
        <h1 className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-5xl font-bold text-transparent">
          welcome to vibechecc
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-xl">
          a place to discover, share, and connect through vibes that matter to
          you
        </p>
      </div>

      {/* Call to Action */}
      <div
        className="space-y-4 transition-all delay-150 duration-500 data-[exiting=true]:translate-y-[-10px] data-[exiting=true]:opacity-0"
        data-exiting={isExiting}
      >
        <Button
          onClick={handleNext}
          size="lg"
          className="from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 bg-gradient-to-r px-12 py-4 text-lg shadow-lg transition-all hover:scale-105"
        >
          get started
        </Button>
      </div>
    </div>
  );
}
