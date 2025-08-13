import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Heart } from '@/components/ui/icons';
import { useAllTags } from '@/queries';

interface OnboardingInterestsStepProps {
  onNext: () => void;
  onUpdateInterests: (interests: string[]) => void;
  isLoading?: boolean;
}

export function OnboardingInterestsStep({
  onNext,
  onUpdateInterests,
  isLoading = false,
}: OnboardingInterestsStepProps) {
  const { data: allTags } = useAllTags();
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>(
    []
  );

  // Predefined popular interests if tags aren't loaded yet
  const defaultInterests = [
    'music',
    'travel',
    'food',
    'art',
    'photography',
    'nature',
    'fitness',
    'books',
    'movies',
    'fashion',
    'technology',
    'gaming',
    'sports',
    'cooking',
    'coffee',
    'beach',
    'hiking',
    'dancing',
    'writing',
    'reading',
    'meditation',
    'yoga',
    'swimming',
    'cycling',
    'painting',
    'gardening',
    'learning',
    'coding',
    'anime',
    'podcasts',
    'volunteering',
    'crafting',
    'singing',
    'guitar',
    'piano',
    'drawing',
    'running',
    'climbing',
    'skiing',
    'surfing',
    'kayaking',
    'camping',
    'fishing',
    'baking',
    'wine',
    'beer',
    'cocktails',
    'comedy',
    'theater',
    'concerts',
    'festivals',
    'exploring',
    'adventure',
    'wellness',
    'mindfulness',
    'productivity',
    'entrepreneurship',
    'investing',
    'sustainability',
  ];

  const availableInterests =
    allTags?.slice(0, 50).map((tag) => tag.tag) || defaultInterests;

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleContinue = () => {
    onUpdateInterests(selectedInterests);
    onNext();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="animate-slideInUp">
        <Card className="border-border/50 border-2">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="from-theme-primary to-theme-secondary inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r">
                <Heart className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">what are you into?</CardTitle>
              <p className="text-muted-foreground mt-2">
                select topics that interest you so we can personalize your
                experience
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-wrap justify-center gap-3">
              {availableInterests.map((interest, index) => (
                <div
                  key={interest}
                  className="animate-zoomIn"
                  style={{ animationDelay: `${index * 0.02}s` }}
                >
                  <Badge
                    variant={
                      selectedInterests.includes(interest)
                        ? 'default'
                        : 'outline'
                    }
                    className={`cursor-pointer px-4 py-2 text-sm transition-all duration-200 hover:scale-105 ${
                      selectedInterests.includes(interest)
                        ? 'from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 border-0 bg-gradient-to-r'
                        : 'hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 border-2'
                    } `}
                    onClick={() => toggleInterest(interest)}
                  >
                    <span className="lowercase">{interest}</span>
                    {selectedInterests.includes(interest) && (
                      <Check className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                </div>
              ))}
            </div>

            {selectedInterests.length > 0 && (
              <div className="text-muted-foreground animate-slideInUp text-center text-sm">
                {selectedInterests.length} interest
                {selectedInterests.length !== 1 ? 's' : ''} selected
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onNext}
                className="flex-1"
              >
                skip for now
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isLoading}
                className="from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 flex-1 bg-gradient-to-r"
              >
                {isLoading
                  ? 'saving...'
                  : `continue${selectedInterests.length > 0 ? ` (${selectedInterests.length})` : ''}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
