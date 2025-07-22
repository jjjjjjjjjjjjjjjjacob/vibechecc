import { createFileRoute } from '@tanstack/react-router';
import {
  useUserByUsername,
  useUserVibes,
  useUserRatings,
  useUserReceivedRatings,
  useUserEmojiStats,
} from '@/queries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VibeGrid } from '@/components/vibe-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { VibeGridSkeleton } from '@/components/ui/vibe-grid-skeleton';
import { CalendarDays, Twitter, Instagram, Globe, Star } from 'lucide-react';
import { EmojiRatingDisplay } from '@/components/emoji-rating-display';

export const Route = createFileRoute('/users/$username')({
  component: UserProfile,
});

function UserProfile() {
  const { username } = Route.useParams();
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useUserByUsername(username);
  const { data: userVibes, isLoading: vibesLoading } = useUserVibes(
    user?.externalId || ''
  );
  const { data: userRatings, isLoading: ratingsLoading } = useUserRatings(
    user?.externalId || ''
  );
  const { data: receivedRatings, isLoading: receivedRatingsLoading } =
    useUserReceivedRatings(user?.externalId || '');
  const { data: emojiStats, isLoading: emojiStatsLoading } = useUserEmojiStats(
    user?.externalId || ''
  );

  if (userLoading) {
    return <UserProfileSkeleton />;
  }

  if (userError || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="mb-2 text-2xl font-bold">User not found</h1>
            <p className="text-muted-foreground">
              The user @{username} could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName =
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username ||
    'User';
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : 'Unknown';
  const vibeCount = userVibes?.length || 0;
  const givenRatingsCount = userRatings?.length || 0;
  const receivedRatingsCount = receivedRatings?.length || 0;
  const averageReceivedRating =
    receivedRatings && receivedRatings.length > 0
      ? receivedRatings.reduce((sum, rating) => sum + rating.rating, 0) /
        receivedRatings.length
      : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col gap-8 md:flex-row">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32">
                  <AvatarImage
                    src={user.image_url || user.profile_image_url}
                    alt={displayName}
                  />
                  <AvatarFallback className="text-4xl">
                    {displayName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">{displayName}</h1>
                  <p className="text-muted-foreground text-xl">
                    @{user.username}
                  </p>
                </div>

                {/* Bio */}
                {user.bio && <p className="text-lg">{user.bio}</p>}

                {/* Stats */}
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    <span>Joined {joinDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{vibeCount}</span>
                    <span className="text-muted-foreground">vibes</span>
                  </div>
                  {averageReceivedRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">
                        {averageReceivedRating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({receivedRatingsCount} reviews)
                      </span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {user.socials && (
                  <div className="flex gap-3">
                    {user.socials.twitter && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://twitter.com/${user.socials.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {user.socials.instagram && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://instagram.com/${user.socials.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Instagram className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {user.socials.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={user.socials.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="vibes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vibes">Vibes</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="vibes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Created Vibes</CardTitle>
                <CardDescription>
                  {vibeCount} {vibeCount === 1 ? 'vibe' : 'vibes'} created
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vibesLoading ? (
                  <VibeGridSkeleton count={6} />
                ) : userVibes && userVibes.length > 0 ? (
                  <VibeGrid vibes={userVibes} />
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {user.username} hasn't created any vibes yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Reviews Given */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviews Given</CardTitle>
                  <CardDescription>
                    {givenRatingsCount}{' '}
                    {givenRatingsCount === 1 ? 'review' : 'reviews'} given
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ratingsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton className="h-12 w-12 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : userRatings && userRatings.length > 0 ? (
                    <div className="space-y-4">
                      {userRatings.slice(0, 5).map((rating) => (
                        <div
                          key={rating?._id || Math.random()}
                          className="flex items-start gap-3"
                        >
                          <img
                            src={rating?.vibe?.image || ''}
                            alt={rating?.vibe?.title || ''}
                            className="h-12 w-12 rounded object-cover"
                          />
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="text-sm font-medium">
                                {rating?.vibe?.title || 'Unknown'}
                              </h4>
                              {rating?.emojiRating ? (
                                <EmojiRatingDisplay
                                  rating={rating.emojiRating}
                                  mode="compact"
                                  showScale={false}
                                />
                              ) : (
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${rating?.rating && i < rating.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            {rating?.review && (
                              <p className="text-muted-foreground text-sm">
                                {rating.review}
                              </p>
                            )}
                            <p className="text-muted-foreground mt-1 text-xs">
                              {rating?.date
                                ? new Date(rating.date).toLocaleDateString()
                                : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                      {userRatings.length > 5 && (
                        <p className="text-muted-foreground text-center text-sm">
                          and {userRatings.length - 5} more...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">
                        {user.username} hasn't given any reviews yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reviews Received */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviews Received</CardTitle>
                  <CardDescription>
                    {receivedRatingsCount}{' '}
                    {receivedRatingsCount === 1 ? 'review' : 'reviews'} received
                    {averageReceivedRating > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{averageReceivedRating.toFixed(1)} average</span>
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {receivedRatingsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : receivedRatings && receivedRatings.length > 0 ? (
                    <div className="space-y-4">
                      {receivedRatings.slice(0, 5).map((rating) => (
                        <div
                          key={rating?._id || Math.random()}
                          className="flex items-start gap-3"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={rating.rater?.image_url} />
                            <AvatarFallback>
                              {rating.rater?.username?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {rating.rater?.username || 'Unknown'}
                              </span>
                              {rating?.emojiRating ? (
                                <EmojiRatingDisplay
                                  rating={rating.emojiRating}
                                  mode="compact"
                                  showScale={false}
                                />
                              ) : (
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${rating?.rating && i < rating.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-1 text-sm">
                              on "{rating.vibe.title}"
                            </p>
                            {rating?.review && (
                              <p className="text-muted-foreground text-sm">
                                {rating.review}
                              </p>
                            )}
                            <p className="text-muted-foreground mt-1 text-xs">
                              {rating?.date
                                ? new Date(rating.date).toLocaleDateString()
                                : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                      {receivedRatings.length > 5 && (
                        <p className="text-muted-foreground text-center text-sm">
                          and {receivedRatings.length - 5} more...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">
                        {user.username} hasn't received any reviews yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest actions and interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Activity feed coming soon...
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About {displayName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {user.bio && (
                  <div>
                    <h3 className="mb-2 font-semibold">Bio</h3>
                    <p className="text-muted-foreground">{user.bio}</p>
                  </div>
                )}

                {user.interests && user.interests.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest) => (
                        <Badge key={interest} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="mb-2 font-semibold">Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{vibeCount}</p>
                      <p className="text-muted-foreground text-sm">
                        Vibes Created
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{givenRatingsCount}</p>
                      <p className="text-muted-foreground text-sm">
                        Reviews Given
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {receivedRatingsCount}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Reviews Received
                      </p>
                    </div>
                    {averageReceivedRating > 0 && (
                      <div>
                        <p className="flex items-center gap-1 text-2xl font-bold">
                          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                          {averageReceivedRating.toFixed(1)}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Average Rating
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Member Since</h3>
                  <p className="text-muted-foreground">{joinDate}</p>
                </div>

                {emojiStats && emojiStats.totalEmojiRatings > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold">Emoji Rating Style</h3>
                    <div className="space-y-4">
                      {emojiStats.mostUsedEmoji && (
                        <div>
                          <p className="text-muted-foreground mb-2 text-sm">
                            Most used emoji
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl">
                              {emojiStats.mostUsedEmoji.emoji}
                            </span>
                            <div>
                              <p className="text-sm font-medium">
                                Used {emojiStats.mostUsedEmoji.count} times
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Average:{' '}
                                {emojiStats.mostUsedEmoji.averageValue.toFixed(
                                  1
                                )}{' '}
                                out of 5
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {emojiStats.highestRatedEmoji &&
                        emojiStats.highestRatedEmoji.emoji !==
                          emojiStats.mostUsedEmoji?.emoji && (
                          <div>
                            <p className="text-muted-foreground mb-2 text-sm">
                              Highest rated emoji
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-3xl">
                                {emojiStats.highestRatedEmoji.emoji}
                              </span>
                              <div>
                                <p className="text-sm font-medium">
                                  Average:{' '}
                                  {emojiStats.highestRatedEmoji.averageValue.toFixed(
                                    1
                                  )}{' '}
                                  out of 5
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Used {emojiStats.highestRatedEmoji.count}{' '}
                                  times
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      {emojiStats.topEmojis.length > 0 && (
                        <div>
                          <p className="text-muted-foreground mb-2 text-sm">
                            Top emoji ratings
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {emojiStats.topEmojis.map((stat) => (
                              <div
                                key={stat.emoji}
                                className="bg-secondary/50 flex items-center gap-1 rounded-full px-3 py-1"
                              >
                                <span className="text-lg">{stat.emoji}</span>
                                <span className="text-muted-foreground text-xs">
                                  {stat.count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function UserProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col gap-8 md:flex-row">
              <div className="flex-shrink-0">
                <Skeleton className="h-32 w-32 rounded-full" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="mt-2 h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-96" />
                <div className="flex gap-6">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <VibeGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}
