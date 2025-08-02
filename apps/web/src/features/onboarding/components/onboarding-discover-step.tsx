import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Eye, UserPlus, Users, Sparkles } from 'lucide-react';
import { useVibes } from '@/queries';
import { EmojiRatingSelector } from '@/features/ratings/components/emoji-rating-selector';
import { EmojiRatingDisplay } from '@/features/ratings/components/emoji-rating-display';
import type { User, EmojiRating } from '@viberater/types';

interface OnboardingDiscoverStepProps {
  onNext: () => void;
}

export function OnboardingDiscoverStep({
  onNext,
}: OnboardingDiscoverStepProps) {
  const { data: vibes } = useVibes();
  const [_selectedRating, setSelectedRating] = React.useState(0);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [_hasRatedWithEmoji, setHasRatedWithEmoji] = React.useState(false);
  const [currentSection, setCurrentSection] = React.useState(0);

  // Mock data for demonstrations
  const mockUser: User = {
    externalId: 'demo-user',
    username: 'alex_vibes',
    full_name: 'Alex Johnson',
    image_url:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    onboardingCompleted: true,
    interests: ['photography', 'travel', 'coffee'],
  };

  const mockEmojiRatings: EmojiRating[] = [
    { emoji: '🔥', value: 4.8, count: 23 },
    { emoji: '😍', value: 4.6, count: 18 },
    { emoji: '☕', value: 4.2, count: 12 },
  ];

  // Get a featured vibe for demonstration
  const demoVibe = vibes?.[0] || {
    id: 'demo',
    title: 'Morning Coffee Ritual',
    description:
      'The perfect way to start your day with mindful coffee brewing',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    tags: ['morning', 'coffee', 'mindful'],
    createdBy: mockUser,
    averageRating: 4.5,
    totalRatings: 12,
    reactions: [
      { emoji: '☕', count: 8 },
      { emoji: '🌅', count: 5 },
      { emoji: '❤️', count: 3 },
    ],
  };

  const _handleRatingChange = (rating: number) => {
    setSelectedRating(rating);
    setHasInteracted(true);
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
    // Mock submission - don't make real API calls
    setHasRatedWithEmoji(true);
    setHasInteracted(true);
  };

  // Auto-advance through sections for demo
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSection((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-3"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            animate={{
              scale: currentSection === feature.section ? 1.05 : 1,
              borderColor:
                currentSection === feature.section
                  ? 'hsl(var(--theme-primary))'
                  : 'hsl(var(--border))',
            }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Card
              className={`h-full p-4 text-center transition-all duration-300 ${
                currentSection === feature.section
                  ? 'border-theme-primary/50 bg-theme-primary/5'
                  : ''
              }`}
            >
              <CardContent className="flex h-full flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <motion.div
                    animate={{
                      rotate:
                        currentSection === feature.section
                          ? [0, -10, 10, 0]
                          : 0,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon
                      className={`mx-auto h-8 w-8 ${feature.color}`}
                    />
                  </motion.div>
                  <h3 className="font-semibold lowercase">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Interactive Demo Sections */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {currentSection === 0 && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
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
                        <div className="text-4xl">☕</div>
                        <h3 className="text-xl font-semibold">
                          {demoVibe.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-muted-foreground">
                      {demoVibe.description}
                    </p>

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
                      topEmojis={mockEmojiRatings}
                      onSubmit={handleEmojiRating}
                      vibeTitle={demoVibe.title}
                      className="mb-4"
                    />

                    {mockEmojiRatings.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium lowercase">
                          current ratings:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {mockEmojiRatings.map((rating, index) => (
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
            </motion.div>
          )}

          {currentSection === 1 && (
            <motion.div
              key="connect"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
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
                        src={mockUser.image_url}
                        alt={mockUser.username}
                      />
                      <AvatarFallback>
                        {mockUser.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{mockUser.full_name}</h3>
                        <p className="text-muted-foreground text-sm">
                          @{mockUser.username}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {mockUser.interests?.map((interest) => (
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
                        <div>1.2k followers</div>
                        <div>43 vibes</div>
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
            </motion.div>
          )}

          {currentSection === 2 && (
            <motion.div
              key="community"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
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
                        <Heart className="h-4 w-4 text-red-500" />
                        for you feed
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        get personalized vibes from users you follow and
                        trending content
                      </p>
                    </div>

                    <div className="bg-secondary/30 space-y-3 rounded-lg p-4">
                      <h4 className="flex items-center gap-2 font-semibold lowercase">
                        <Eye className="h-4 w-4 text-blue-500" />
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => setCurrentSection(index)}
            className={`h-2 w-8 rounded-full transition-all ${
              currentSection === index
                ? 'bg-theme-primary'
                : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'
            }`}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>

      {/* Success Message */}
      {hasInteracted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center"
        >
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            awesome! you're ready to start your viberater journey 🚀
          </p>
        </motion.div>
      )}

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-center"
      >
        <Button
          onClick={onNext}
          size="lg"
          className="from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 bg-gradient-to-r px-8 transition-transform hover:scale-105"
        >
          {hasInteracted ? "let's start exploring!" : 'continue'}
        </Button>
      </motion.div>
    </div>
  );
}
