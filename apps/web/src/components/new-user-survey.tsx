import { useEffect, useState } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import { usePostHog } from '@/hooks/usePostHog';
import {
  surveyManager,
  trackSurveyEvents,
  type NewUserSurveyData,
} from '@/lib/survey-manager';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { X, Circle } from 'lucide-react';

interface NewUserSurveyProps {
  onComplete?: () => void;
  onDismiss?: () => void;
}

/**
 * Survey component for new users to gather onboarding insights
 * Integrates with PostHog for analytics and user targeting
 */
export function NewUserSurvey({ onComplete, onDismiss }: NewUserSurveyProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user } = useUser();
  const { isInitialized } = usePostHog();
  const [discoveryChannel, setDiscoveryChannel] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);

  // Check if user is eligible for survey
  useEffect(() => {
    if (!user || !isInitialized || !user.createdAt) return;

    // Don't show if user has already completed or dismissed the survey
    if (surveyManager.hasUserCompletedOrDismissedSurvey()) {
      return;
    }

    // Show survey if PostHog feature flag is enabled for this user
    const isEligible = surveyManager.isEligibleForNewUserSurvey();

    if (isEligible) {
      setShowSurvey(true);
    }
  }, [user, isInitialized]);

  const discoveryOptions = [
    {
      value: 'social_media',
      label: 'social media (twitter/x, instagram, tiktok)',
    },
    { value: 'search_engine', label: 'search engine (google, bing)' },
    {
      value: 'friend_recommendation',
      label: 'friend or colleague recommendation',
    },
    { value: 'blog_article', label: 'blog post or article' },
    { value: 'product_hunt', label: 'product hunt or similar platform' },
    { value: 'other', label: 'other' },
  ];

  const handleSubmit = async () => {
    if (!user || !discoveryChannel) {
      return;
    }

    setIsSubmitting(true);

    try {
      const responses: NewUserSurveyData = {
        discoveryChannel,
      };

      // Record the survey response
      trackSurveyEvents.recordResponse(responses, user.id);

      // Close the survey
      setShowSurvey(false);
      onComplete?.();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to submit survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    if (user) {
      trackSurveyEvents.recordDismissed(user.id, 'closed');
    }
    setShowSurvey(false);
    onDismiss?.();
  };

  if (!showSurvey || !user) {
    return null;
  }

  // Shared form content
  const formContent = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-6 p-6"
    >
      <div className="flex flex-col space-y-4">
        <Label className="text-base">how did you hear about viberatr?</Label>
        <RadioGroup
          value={discoveryChannel}
          onValueChange={setDiscoveryChannel}
          className="space-y-3"
        >
          {discoveryOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-3">
              <RadioGroupItem
                value={option.value}
                id={option.value}
                className="border-border text-primary"
              />
              <Label
                htmlFor={option.value}
                className="text-foreground flex-1 cursor-pointer text-sm"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleDismiss}
          disabled={isSubmitting}
          className="h-12 flex-1"
        >
          skip for now
        </Button>
        <Button
          type="submit"
          disabled={!discoveryChannel || isSubmitting}
          className="h-12 flex-1"
        >
          {isSubmitting ? (
            <>
              <Circle className="mr-2 h-4 w-4 animate-spin" />
              submitting...
            </>
          ) : (
            'submit'
          )}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer
        open={showSurvey}
        onOpenChange={(open) => !open && handleDismiss()}
        shouldScaleBackground
      >
        <DrawerContent className="bg-background/90 min-h-[50vh] overflow-y-auto backdrop-blur">
          <DrawerHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-xl text-transparent">
                welcome to viberatr
              </DrawerTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>
          {formContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={showSurvey} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent
        className="bg-background/95 border-border max-w-md overflow-y-auto border backdrop-blur"
        showCloseButton={false}
      >
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle>welcome to viberatr</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-left">
            help us understand how you discovered us
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
