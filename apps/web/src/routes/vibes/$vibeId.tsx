import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import {
  useVibe,
  useAddRatingMutation,
  useReactToVibeMutation,
  useVibesPaginated,
} from '@/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/star-rating';
import { SimpleVibePlaceholder } from '@/components/simple-vibe-placeholder';
import { VibeDetailSkeleton } from '@/components/ui/vibe-detail-skeleton';
import { VibeCard } from '@/features/vibes/components/vibe-card';
import {
  computeUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
} from '@/utils/user-utils';
import { useUser } from '@clerk/tanstack-react-start';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/vibes/$vibeId')({
  component: VibePage,
});

function VibePage() {
  const { vibeId } = Route.useParams();
  const { data: vibe, isLoading, error } = useVibe(vibeId);
  const { data: allVibesData } = useVibesPaginated(50);
  const allVibes = allVibesData?.vibes || [];
  const [rating, setRating] = React.useState(0);
  const [review, setReview] = React.useState('');
  const { user: _user } = useUser();
  const addRatingMutation = useAddRatingMutation();
  const reactToVibeMutation = useReactToVibeMutation();

  // Extract context keywords from vibe for emoji suggestions
  const _contextKeywords = React.useMemo(() => {
    if (!vibe) return [];

    const keywords: string[] = [];

    // Extract words from title and description
    const titleWords = vibe.title
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2);
    const descriptionWords =
      vibe.description
        ?.toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 2) || [];

    keywords.push(...titleWords, ...descriptionWords);

    // Add keywords from tags
    if (vibe.tags) {
      keywords.push(...vibe.tags.map((tag) => tag.toLowerCase()));
    }

    // Add some context-based keywords based on common patterns
    const title = vibe.title.toLowerCase();
    const description = vibe.description?.toLowerCase() || '';

    // Add contextual keywords based on content analysis
    if (
      title.includes('money') ||
      title.includes('rich') ||
      title.includes('expensive') ||
      description.includes('money')
    ) {
      keywords.push('money', 'rich', 'expensive');
    }
    if (
      title.includes('time') ||
      title.includes('clock') ||
      title.includes('fast') ||
      description.includes('time')
    ) {
      keywords.push('time', 'fast', 'speed');
    }
    if (
      title.includes('love') ||
      title.includes('heart') ||
      description.includes('love')
    ) {
      keywords.push('love', 'heart');
    }
    if (
      title.includes('fire') ||
      title.includes('hot') ||
      description.includes('fire')
    ) {
      keywords.push('fire', 'hot', 'amazing');
    }

    return [...new Set(keywords)]; // Remove duplicates
  }, [vibe]);

  // Get similar vibes based on tags, creator, or fallback to recent vibes
  const similarVibes = React.useMemo(() => {
    if (!vibe || !allVibes) return [];

    // Filter out the current vibe
    const otherVibes = allVibes.filter((v) => v.id !== vibe.id);

    // Simple similarity algorithm:
    // 1. Vibes with matching tags
    // 2. Vibes from the same creator
    // 3. Fallback to recent vibes

    const vibesWithTags = vibe.tags
      ? otherVibes.filter((v) =>
          v.tags?.some((tag) => vibe.tags?.includes(tag))
        )
      : [];

    const vibesFromSameCreator = otherVibes.filter(
      (v) => v.createdById === vibe.createdById
    );

    // Combine and deduplicate
    const similar = [...vibesWithTags, ...vibesFromSameCreator].filter(
      (v, index, arr) => arr.findIndex((item) => item.id === v.id) === index
    );

    // If we don't have enough similar vibes, add some recent ones
    if (similar.length < 4) {
      const recentVibes = otherVibes
        .filter((v) => !similar.some((s) => s.id === v.id))
        .slice(0, 4 - similar.length);
      similar.push(...recentVibes);
    }

    return similar.slice(0, 4); // Limit to 4 similar vibes
  }, [vibe, allVibes]);

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
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vibe.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
      vibe.ratings.length
    : 0;

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    try {
      await addRatingMutation.mutateAsync({
        vibeId: vibe.id,
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
      // eslint-disable-next-line no-console
      console.error('Failed to submit rating:', error);
      toast.error('failed to submit rating. please try again.', {
        duration: 3000,
        icon: '❌',
      });
    }
  };

  const _handleReact = async (emoji: string) => {
    try {
      await reactToVibeMutation.mutateAsync({
        vibeId: vibe.id,
        emoji,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to react:', error);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="grid w-full grid-cols-3 gap-8 transition-all duration-300">
        {/* Main Content */}
        <div className="col-span-3 w-full transition-all duration-300 sm:col-span-2">
          {/* Main Vibe Card */}
          <div className="relative mb-6 overflow-hidden rounded-lg">
            {/* Main Image */}
            <div className="relative aspect-video">
              {vibe.image ? (
                <img
                  src={vibe.image}
                  alt={vibe.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <SimpleVibePlaceholder title={vibe.title} />
              )}
            </div>
          </div>

          {/* Tags */}
          {vibe.tags && vibe.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {vibe.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="mb-6 text-4xl font-bold lowercase">{vibe.title}</h1>

          {/* Rating */}
          <div className="mb-4 flex items-center gap-2">
            <StarRating value={averageRating} readOnly />
            <span className="text-lg font-medium">
              {averageRating > 0 ? averageRating.toFixed(1) : '-'}
            </span>
            <span className="text-muted-foreground text-sm">
              ({vibe.ratings.length} rating
              {vibe.ratings.length !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Creator Info */}
          <div className="mb-6 flex items-center">
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
                  <p className="font-medium">
                    originally vibed by {computeUserDisplayName(vibe.createdBy)}
                  </p>
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

          {/* Reactions */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-4">
              <span className="text-2xl">😂</span>
              <span className="text-2xl">💰</span>
              <span className="text-2xl">🎉</span>
              <span className="text-2xl">💯</span>
              <button className="border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed transition-colors">
                <span className="text-lg">+</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {vibe.description}
          </p>

          {/* Rate This Vibe */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-bold lowercase">
                rate this vibe
              </h2>
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
            </CardContent>
          </Card>

          {/* Reviews */}
          {vibe.ratings.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-bold lowercase">reviews</h2>
                <div className="space-y-4">
                  {vibe.ratings
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .filter((r: any) => r.review)
                    .sort(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (a: any, b: any) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((rating: any, index: number) => (
                      <div
                        key={index}
                        className="border-b pb-4 last:border-b-0"
                      >
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
                            <p className="font-medium">
                              {computeUserDisplayName(rating.user)}
                            </p>
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
              </CardContent>
            </Card>
          )}
        </div>

        {/* Similar Vibes Sidebar */}
        <div className="col-span-1 hidden overflow-y-auto sm:block">
          <div className="sticky">
            <div className="space-y-4">
              {similarVibes.map((similarVibe) => (
                <VibeCard
                  key={similarVibe.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  vibe={similarVibe as any}
                  compact={true}
                />
              ))}
              {similarVibes.length === 0 && (
                <div className="text-muted-foreground py-8 text-center">
                  <p>no similar vibes found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
