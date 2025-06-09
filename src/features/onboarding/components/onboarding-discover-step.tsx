import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, MessageCircle, Eye } from 'lucide-react';
import { useVibes } from '@/queries';
import { StarRating } from '@/components/star-rating';

interface OnboardingDiscoverStepProps {
  onNext: () => void;
}

export function OnboardingDiscoverStep({
  onNext,
}: OnboardingDiscoverStepProps) {
  const { data: vibes } = useVibes();
  const [selectedRating, setSelectedRating] = React.useState(0);
  const [hasInteracted, setHasInteracted] = React.useState(false);

  // Get a featured vibe for demonstration
  const demoVibe = vibes?.[0] || {
    id: 'demo',
    title: 'Morning Coffee Ritual',
    description:
      'The perfect way to start your day with mindful coffee brewing',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    tags: ['morning', 'coffee', 'mindful'],
    createdBy: { username: 'coffee_lover', avatar: '' },
    averageRating: 4.5,
    totalRatings: 12,
    reactions: [
      { emoji: '☕', count: 8 },
      { emoji: '🌅', count: 5 },
      { emoji: '❤️', count: 3 },
    ],
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRating(rating);
    setHasInteracted(true);
  };

  const features = [
    {
      icon: Star,
      title: 'Rate Vibes',
      description: 'Give 1-5 stars to vibes you discover',
      color: 'text-yellow-500',
    },
    {
      icon: Heart,
      title: 'React with Emojis',
      description: 'Express yourself with emoji reactions',
      color: 'text-red-500',
    },
    {
      icon: Eye,
      title: 'Discover & Explore',
      description: 'Browse vibes by tags and categories',
      color: 'text-blue-500',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4 text-center"
      >
        <h2 className="text-3xl font-bold">Discover Amazing Vibes</h2>
        <p className="text-muted-foreground text-lg">
          Learn how to interact with vibes and discover content you'll love
        </p>
      </motion.div>

      {/* Features Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-3"
      >
        {features.map((feature, index) => (
          <Card key={index} className="p-4 text-center">
            <CardContent className="space-y-3">
              <feature.icon className={`mx-auto h-8 w-8 ${feature.color}`} />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Interactive Demo Vibe */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-2 border-pink-200 dark:border-pink-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Try It Out!</CardTitle>
              <Badge variant="secondary">Demo Vibe</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vibe Content */}
            <div className="space-y-3">
              <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-r from-orange-200 to-pink-200 dark:from-orange-900 dark:to-pink-900">
                <div className="space-y-2 text-center">
                  <div className="text-4xl">☕</div>
                  <h3 className="text-xl font-semibold">{demoVibe.title}</h3>
                </div>
              </div>

              <p className="text-muted-foreground">{demoVibe.description}</p>

              <div className="flex flex-wrap gap-2">
                {demoVibe.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Interactive Elements */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Rate this vibe:</p>
                  <StarRating
                    rating={selectedRating}
                    onRatingChange={handleRatingChange}
                    size="lg"
                    interactive={true}
                  />
                </div>

                <div className="space-y-1 text-right">
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{demoVibe.averageRating}</span>
                    <span>({demoVibe.totalRatings} ratings)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Quick reactions:</span>
                {['☕', '🌅', '❤️', '👍'].map((emoji) => (
                  <Button
                    key={emoji}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 transition-transform hover:scale-110"
                    onClick={() => setHasInteracted(true)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>

            {hasInteracted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-800 dark:bg-green-950"
              >
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Great! You're getting the hang of it! 🎉
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

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
          className="bg-gradient-to-r from-pink-500 to-orange-500 px-8 text-white hover:from-pink-600 hover:to-orange-600"
        >
          {hasInteracted ? "I'm Ready to Explore!" : 'Continue'}
        </Button>
      </motion.div>
    </div>
  );
}
