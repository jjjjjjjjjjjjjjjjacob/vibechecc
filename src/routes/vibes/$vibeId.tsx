import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import {
  useVibe,
  useAddRatingMutation,
  useReactToVibeMutation,
} from '@/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/star-rating';
import { EmojiReactions } from '@/components/emoji-reaction';
import { SimpleVibePlaceholder } from '@/components/simple-vibe-placeholder';
import { VibeDetailSkeleton } from '@/components/ui/vibe-detail-skeleton';
import { computeUserDisplayName, getUserAvatarUrl, getUserInitials } from '@/utils/user-utils';
import { useUser } from '@clerk/tanstack-react-start';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/vibes/$vibeId')({
  component: VibePage,
});

function VibePage() {
  const { vibeId } = Route.useParams();
  const { data: vibe, isLoading, error } = useVibe(vibeId);
  const [rating, setRating] = React.useState(0);
  const [review, setReview] = React.useState('');
  const { user } = useUser();
  const addRatingMutation = useAddRatingMutation();
  const reactToVibeMutation = useReactToVibeMutation();

  // Extract context keywords from vibe for emoji suggestions
  const contextKeywords = React.useMemo(() => {
    if (!vibe) return [];
    
    const keywords: string[] = [];
    
    // Extract words from title and description
    const titleWords = vibe.title.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    const descriptionWords = vibe.description?.toLowerCase().split(/\W+/).filter(word => word.length > 2) || [];
    
    keywords.push(...titleWords, ...descriptionWords);
    
    // Add keywords from tags
    if (vibe.tags) {
      keywords.push(...vibe.tags.map(tag => tag.toLowerCase()));
    }
    
    // Add some context-based keywords based on common patterns
    const title = vibe.title.toLowerCase();
    const description = vibe.description?.toLowerCase() || '';
    
    // Add contextual keywords based on content analysis
    if (title.includes('money') || title.includes('rich') || title.includes('expensive') || description.includes('money')) {
      keywords.push('money', 'rich', 'expensive');
    }
    if (title.includes('time') || title.includes('clock') || title.includes('fast') || description.includes('time')) {
      keywords.push('time', 'fast', 'speed');
    }
    if (title.includes('love') || title.includes('heart') || description.includes('love')) {
      keywords.push('love', 'heart');
    }
    if (title.includes('fire') || title.includes('hot') || description.includes('fire')) {
      keywords.push('fire', 'hot', 'amazing');
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }, [vibe]);

  if (isLoading) {
    return <VibeDetailSkeleton />;
  }

  if (error || !vibe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3">
          <p>failed to load vibe. it may not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const averageRating = vibe.ratings.length
    ? vibe.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
      vibe.ratings.length
    : 0;

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    try {
      await addRatingMutation.mutateAsync({
        vibeId: vibe.id,
        userId: 'demo-user', // Use demo user ID for now
        rating,
        review: review.trim() || undefined,
      });
      setReview('');
      // We don't reset rating to allow the user to see what they rated
      
      // Show success toast
      toast.success(
        `vibe rated ${rating} circle${rating === 1 ? '' : 's'}! ${review.trim() ? 'review submitted.' : ''}`,
        {
          duration: 3000,
          icon: '✨',
        }
      );
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast.error('failed to submit rating. please try again.', {
        duration: 3000,
        icon: '❌',
      });
    }
  };

  const handleReact = async (emoji: string) => {
    try {
      await reactToVibeMutation.mutateAsync({
        vibeId: vibe.id,
        emoji,
        userId: 'demo-user', // Use demo user ID for now
      });
    } catch (error) {
      console.error('Failed to react:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8 overflow-hidden">
        <div className="relative">
          {vibe.image ? (
            <img
              src={vibe.image}
              alt={vibe.title}
              className="h-64 w-full object-cover md:h-96"
            />
          ) : (
            <div className="h-64 w-full md:h-96">
              <SimpleVibePlaceholder title={vibe.title} />
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold lowercase">{vibe.title}</h1>
            <div className="flex items-center gap-2">
              <StarRating value={averageRating} readOnly />
              <span className="text-muted-foreground text-sm">
                {averageRating > 0 ? averageRating.toFixed(1) : '-'} (
                {vibe.ratings.length})
              </span>
            </div>
          </div>

          <div className="mb-4 flex items-center">
            {vibe.createdBy ? (
              <>
                <Avatar className="mr-3 h-10 w-10">
                  <AvatarImage
                    src={getUserAvatarUrl(vibe.createdBy)}
                    alt={computeUserDisplayName(vibe.createdBy)}
                  />
                  <AvatarFallback>
                    {getUserInitials(vibe.createdBy)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{computeUserDisplayName(vibe.createdBy)}</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(vibe.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Avatar className="mr-3 h-10 w-10">
                  <AvatarFallback>??</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Unknown User</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(vibe.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </div>

          <p className="text-foreground mb-6 whitespace-pre-line">
            {vibe.description}
          </p>

          {vibe.tags && vibe.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {vibe.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 border-t pt-6">
            <h2 className="mb-4 text-xl font-bold lowercase">reactions</h2>
            <EmojiReactions
              reactions={vibe.reactions || []}
              onReact={handleReact}
              showAddButton={true}
              contextKeywords={contextKeywords}
            />
          </div>

          <div className="mb-6 border-t pt-6">
            <h2 className="mb-4 text-xl font-bold lowercase">rate this vibe</h2>
            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div>
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>

              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="write your review (optional)"
                rows={4}
              />

              <Button
                type="submit"
                disabled={rating === 0 || addRatingMutation.isPending}
              >
                {addRatingMutation.isPending
                  ? 'submitting...'
                  : 'submit rating'}
              </Button>
            </form>
          </div>

          {vibe.ratings.length > 0 && (
            <div className="border-t pt-6">
              <h2 className="mb-4 text-xl font-bold lowercase">reviews</h2>
              <div className="space-y-4">
                {vibe.ratings
                  .filter((r: any) => r.review)
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((rating: any, index: number) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="mb-2 flex items-center">
                        <Avatar className="mr-2 h-8 w-8">
                          <AvatarImage
                            src={getUserAvatarUrl(rating.user)}
                            alt={computeUserDisplayName(rating.user)}
                          />
                          <AvatarFallback>
                            {getUserInitials(rating.user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{computeUserDisplayName(rating.user)}</p>
                          <div className="flex items-center gap-2">
                            <StarRating
                              value={rating.rating}
                              readOnly
                              size="sm"
                            />
                            <span className="text-muted-foreground text-sm">
                              {new Date(rating.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {rating.review && (
                        <p className="text-muted-foreground whitespace-pre-line">
                          {rating.review}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
