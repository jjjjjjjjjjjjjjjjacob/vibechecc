import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Eye, UserPlus, Users, Sparkles } from '@/components/ui/icons';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import { EmojiRatingSelector } from '@/features/ratings/components/emoji-rating-selector';
import { EmojiRatingDisplay } from '@/features/ratings/components/emoji-rating-display';
import type { EmojiRating } from '@vibechecc/types';
import { computeUserDisplayName } from '@/utils/user-utils';

interface OnboardingDiscoverStepProps {
  onNext: () => void;
}

export function OnboardingDiscoverStep({
  onNext,
}: OnboardingDiscoverStepProps) {
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [currentSection, setCurrentSection] = React.useState(0);

  // Fetch real top-rated vibe
  const { data: mostRatedVibe } = useQuery(
    convexQuery(api.vibes.getMostRatedVibe, {})
  );

  // Fetch real most followed user
  const { data: mostFollowedUser } = useQuery(
    convexQuery(api.users.getMostFollowedUser, {})
  );

  // Use real data if available, otherwise use fallback
  const demoVibe = mostRatedVibe || {
    id: 'demo',
    title: 'Morning Coffee Ritual',
    description:
      'The perfect way to start your day with mindful coffee brewing',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    tags: ['morning', 'coffee', 'mindful'],
    createdBy: null,
    averageRating: 4.5,
    totalRatings: 12,
    emojiRatings: [
      { emoji: '☕', value: 4.5, count: 8 },
      { emoji: '🌅', value: 4.2, count: 5 },
      { emoji: '❤️', value: 4.8, count: 3 },
    ] as EmojiRating[],
  };

  const demoUser = mostFollowedUser || {
    externalId: 'demo-user',
    username: 'alex_vibes',
    full_name: 'Alex Johnson',
    first_name: 'Alex',
    last_name: 'Johnson',
    image_url:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    onboardingCompleted: true,
    interests: ['photography', 'travel', 'coffee'],
    followerCount: 1200,
    vibesCount: 43,
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    setHasInteracted(true);
  };

  const handleEmojiRating = async (_data: {
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
  }) => {
    // Mock submission for demo - track interaction
    setHasInteracted(true);
  };

  // Remove auto-advance - now user controlled
  // Add keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setCurrentSection((prev) => (prev - 1 + 3) % 3);
      } else if (event.key === 'ArrowRight') {
        setCurrentSection((prev) => (prev + 1) % 3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: 'discover vibes',
      description: 'rate and review content with emoji ratings',
      color: 'text-theme-primary',
      section: 0,
    },
    {
      icon: UserPlus,
      title: 'connect with users',
      description: 'follow creators you love and build your network',
      color: 'text-theme-secondary',
      section: 1,
    },
    {
      icon: Users,
      title: 'join the community',
      description: 'get personalized recommendations in your feed',
      color: 'text-accent',
      section: 2,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Features Overview */}
      <div
        className="animate-slideInUp grid gap-4 md:grid-cols-3"
        style={{ animationDelay: '0.1s' }}
      >
        {features.map((feature, index) => (
          <div
            key={index}
            className={`h-full transition-all duration-300 ${
              currentSection === feature.section ? 'scale-105' : 'scale-100'
            }`}
          >
            <Card
              className={`hover:border-theme-primary/30 hover:bg-theme-primary/5 h-full cursor-pointer p-4 text-center transition-all duration-300 ${
                currentSection === feature.section
                  ? 'border-theme-primary/50 bg-theme-primary/5'
                  : ''
              }`}
              onClick={() => setCurrentSection(feature.section)}
            >
              <CardContent className="flex h-full flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div
                    className={`${
                      currentSection === feature.section ? 'animate-bounce' : ''
                    }`}
                  >
                    <feature.icon
                      className={`mx-auto h-8 w-8 ${feature.color}`}
                    />
                  </div>
                  <h3 className="font-semibold lowercase">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Interactive Demo Sections */}
      <div className="space-y-6">
        {currentSection === 0 && (
          <div className="animate-slideInRight">
            <Card className="border-theme-primary/20 border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg lowercase">
                    discover vibes
                  </CardTitle>
                  <Badge variant="secondary">demo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vibe Content */}
                <div className="space-y-3">
                  <div className="from-theme-secondary/20 to-theme-primary/20 flex aspect-video items-center justify-center rounded-lg bg-gradient-to-r">
                    <div className="space-y-2 text-center">
                      <div className="text-4xl">
                        {demoVibe.emojiRatings?.[0]?.emoji || '☕'}
                      </div>
                      <h3 className="text-xl font-semibold">
                        {demoVibe.title}
                      </h3>
                      {demoVibe.createdBy && (
                        <p className="text-muted-foreground text-sm">
                          by @{demoVibe.createdBy.username}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-muted-foreground">
                    {demoVibe.description}
                  </p>

                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <span>{demoVibe.totalRatings || 0} ratings</span>
                    <span>
                      ⭐ {demoVibe.averageRating?.toFixed(1) || '4.5'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {demoVibe.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Emoji Rating Demo */}
                <div className="border-t pt-4">
                  <EmojiRatingSelector
                    topEmojis={demoVibe.emojiRatings || []}
                    onSubmit={handleEmojiRating}
                    vibeTitle={demoVibe.title}
                    className="mb-4"
                  />

                  {demoVibe.emojiRatings &&
                    demoVibe.emojiRatings.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium lowercase">
                          top-rated emotions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {demoVibe.emojiRatings.map((rating, index) => (
                            <EmojiRatingDisplay
                              key={`${rating.emoji}-${index}`}
                              rating={rating}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentSection === 1 && (
          <div className="animate-slideInRight">
            <Card className="border-theme-secondary/20 border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg lowercase">
                    connect with users
                  </CardTitle>
                  <Badge variant="secondary">demo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Profile Card */}
                <div className="bg-secondary/30 flex items-center gap-4 rounded-lg p-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={demoUser.image_url}
                      alt={demoUser.username}
                    />
                    <AvatarFallback>
                      {demoUser.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="space-y-1">
                      <h3 className="font-semibold">
                        {computeUserDisplayName(demoUser)}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        @{demoUser.username}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {demoUser.interests?.map((interest) => (
                        <Badge
                          key={interest}
                          variant="outline"
                          className="text-xs lowercase"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant={isFollowing ? 'outline' : 'default'}
                      onClick={handleFollowToggle}
                      className={`transition-all ${
                        isFollowing
                          ? 'from-theme-primary to-theme-secondary text-primary-foreground bg-gradient-to-r'
                          : ''
                      }`}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {isFollowing ? 'following' : 'follow'}
                    </Button>

                    <div className="text-muted-foreground text-center text-xs">
                      <div>{demoUser.followerCount || 0} followers</div>
                      <div>{demoUser.vibesCount || 0} vibes</div>
                    </div>
                  </div>
                </div>

                <div className="from-theme-primary/10 to-theme-secondary/10 rounded-lg bg-gradient-to-br p-4 text-center">
                  <p className="text-sm">
                    <strong className="lowercase">follow users</strong> to get
                    their vibes in your personalized feed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentSection === 2 && (
          <div className="animate-slideInRight">
            <Card className="border-accent/20 border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg lowercase">
                    join the community
                  </CardTitle>
                  <Badge variant="secondary">demo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-secondary/30 space-y-3 rounded-lg p-4">
                    <h4 className="flex items-center gap-2 font-semibold lowercase">
                      <Heart className="text-destructive h-4 w-4" />
                      for you feed
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      get personalized vibes from users you follow and trending
                      content
                    </p>
                  </div>

                  <div className="bg-secondary/30 space-y-3 rounded-lg p-4">
                    <h4 className="flex items-center gap-2 font-semibold lowercase">
                      <Eye className="text-theme-primary h-4 w-4" />
                      discover more
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      explore vibes by tags, trending topics, and community
                      recommendations
                    </p>
                  </div>
                </div>

                <div className="from-accent/10 to-theme-primary/10 rounded-lg bg-gradient-to-br p-4 text-center">
                  <div className="space-y-2">
                    <div className="text-2xl">🎉</div>
                    <p className="text-sm font-medium">
                      join thousands of users sharing and discovering amazing
                      vibes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Progress Indicators */}
      <div className="space-y-2 text-center">
        <div className="flex justify-center gap-3">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => setCurrentSection(index)}
              className={`h-3 w-12 rounded-full transition-all duration-300 ${
                currentSection === index
                  ? 'bg-theme-primary scale-110 shadow-lg'
                  : 'bg-muted-foreground/20 hover:bg-muted-foreground/40 hover:scale-105'
              }`}
              aria-label={`Go to section ${index + 1}: ${features[index].title}`}
            />
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          click cards above or use arrow keys to navigate
        </p>
      </div>

      {/* Success Message */}
      {hasInteracted && (
        <div className="animate-zoomIn rounded-lg border border-green-600/20 bg-green-600/10 p-4 text-center dark:border-green-400/20 dark:bg-green-400/10">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            awesome! you're ready to start your vibechecc journey 🚀
          </p>
        </div>
      )}

      {/* Continue Button */}
      <div
        className="animate-slideInUp text-center"
        style={{ animationDelay: '0.3s' }}
      >
        <Button
          onClick={onNext}
          size="lg"
          className="from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 bg-gradient-to-r px-8 transition-transform hover:scale-105"
        >
          {hasInteracted ? "let's start exploring!" : 'continue'}
        </Button>
      </div>
    </div>
  );
}
