import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, X } from 'lucide-react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onSkip?: () => void;
  showBack?: boolean;
  showSkip?: boolean;
  title?: string;
  subtitle?: string;
}

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  onSkip,
  showBack = true,
  showSkip = true,
  title,
  subtitle,
}: OnboardingLayoutProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBack && onBack && currentStep > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-foreground text-2xl font-bold">viberater</h1>
              <p className="text-muted-foreground text-sm">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>
          {showSkip && onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="mr-2 h-4 w-4" />
              Skip
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="mx-auto max-w-2xl">
          {title && (
            <div className="animate-fade-in-down mb-6 text-center">
              <h2 className="text-foreground mb-2 text-3xl font-bold">
                {title}
              </h2>
              {subtitle && (
                <p className="text-muted-foreground text-lg">{subtitle}</p>
              )}
            </div>
          )}

          <div
            className="animate-fade-in-down opacity-0"
            style={{ animation: 'fade-in-down 0.3s ease-out 0.1s forwards' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
