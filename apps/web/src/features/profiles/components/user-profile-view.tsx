/**
 * user profile view module.
 * enhanced documentation for clarity and maintenance.
 */
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MasonryFeed } from '@/components/masonry-feed';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays,
  Star,
  TrendingUp,
  Heart,
  Sparkles,
  Globe,
  ChevronLeft,
  Twitter,
  Instagram,
} from 'lucide-react';
import { EmojiRatingDisplay } from '@/features/ratings/components/emoji-rating-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  useTheme,
  type PrimaryColorTheme,
  type SecondaryColorTheme,
} from '@/features/theming/components/theme-provider';
import type { Vibe } from '@viberatr/types';
import type { Id } from '@viberatr/convex/dataModel';
import { getThemeColorValue } from '@/utils/theme-colors';
import { useUser } from '@clerk/tanstack-react-start';
import {
  FollowButton,
  FollowStats,
  FollowersModal,
  FollowingModal,
} from '@/features/follows/components';

interface UserProfileViewProps {
  user: {
    _id?: string;
    id?: string;
    externalId: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    profile_image_url?: string;
    bio?: string;
    created_at?: number;
    _creationTime?: number;
    primaryColor?: string;
    themeColor?: string;
    secondaryColor?: string;
    interests?: string[];
    socials?: {
      twitter?: string;
      instagram?: string;
      website?: string;
    };
  };
  userVibes?: Array<Vibe>;
  vibesLoading?: boolean;
  userRatings?: Array<{
    _id?: string | Id<'ratings'>;
    vibeId: string;
    userId: string;
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
    createdAt: string;
    updatedAt?: string;
    vibe?: any; // Accept any vibe structure from Convex
  } | null> | null;
  ratingsLoading?: boolean;
  receivedRatings?: Array<{
    _id?: string | Id<'ratings'>;
    vibeId: string;
    userId: string;
    emoji: string;
    value: number;
    review: string;
    tags?: string[];
    createdAt: string;
    updatedAt?: string;
    rater?: {
      _id?: string | Id<'users'>;
      username?: string;
      first_name?: string;
      last_name?: string;
      image_url?: string;
    } | null;
  }> | null;
  receivedRatingsLoading?: boolean;
  emojiStats?: {
    totalEmojiRatings: number;
    mostUsedEmoji?: {
      emoji: string;
      count: number;
      averageValue: number;
    };
    topEmojis: Array<{
      emoji: string;
      count: number;
    }>;
  };
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonText?: string;
  scopedTheme?: boolean;
  currentUserId?: string;
}

export function UserProfileView({
  user,
  userVibes,
  vibesLoading = false,
  userRatings,
  ratingsLoading = false,
  receivedRatings,
  receivedRatingsLoading = false,
  emojiStats,
  showBackButton = false,
  onBackClick,
  backButtonText = 'back to profile',
  scopedTheme = true,
  currentUserId,
}: UserProfileViewProps) {
  const profileContainerRef = React.useRef<HTMLDivElement>(null);
  const { user: clerkUser } = useUser();

  // Modal states for follow system
  const [isFollowersModalOpen, setIsFollowersModalOpen] = React.useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = React.useState(false);

  // Calculate derived data
  const displayName =
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    user?.username ||
    'User';
  const joinDate =
    user?.created_at || user?._creationTime
      ? new Date(user.created_at || user._creationTime!).toLocaleDateString()
      : 'Unknown';
  const vibeCount = userVibes?.length || 0;
  const givenRatingsCount = userRatings?.filter((r) => r !== null).length || 0;
  const receivedRatingsCount = receivedRatings?.length || 0;
  const averageReceivedRating =
    receivedRatings && receivedRatings.length > 0
      ? receivedRatings.reduce((sum, rating) => sum + (rating?.value || 0), 0) /
        receivedRatings.length
      : 0;

  // Determine if viewing own profile
  const isOwnProfile = currentUserId
    ? currentUserId === user.externalId
    : clerkUser?.id === user.externalId;

  // Get user's theme colors
  const userTheme = React.useMemo(
    () => ({
      primaryColor: user?.primaryColor || user?.themeColor || 'pink',
      secondaryColor: user?.secondaryColor || 'orange',
    }),
    [user?.primaryColor, user?.themeColor, user?.secondaryColor]
  );

  const { setColorTheme, setSecondaryColorTheme } = useTheme();

  React.useEffect(() => {
    // Apply global theme when not using scoped theme (e.g., on own profile)
    if (!scopedTheme && user) {
      setColorTheme(`${userTheme.primaryColor}-primary` as PrimaryColorTheme);
      setSecondaryColorTheme(
        `${userTheme.secondaryColor}-secondary` as SecondaryColorTheme
      );
    }
  }, [
    scopedTheme,
    user,
    userTheme.primaryColor,
    userTheme.secondaryColor,
    setColorTheme,
    setSecondaryColorTheme,
  ]);

  // Apply scoped theme styles when viewing other users' profiles
  const scopedThemeStyles = React.useMemo(() => {
    if (scopedTheme && user) {
      return {
        '--theme-primary': getThemeColorValue(userTheme.primaryColor),
        '--theme-secondary': getThemeColorValue(userTheme.secondaryColor),
      } as React.CSSProperties;
    }
    return {};
  }, [scopedTheme, user, userTheme.primaryColor, userTheme.secondaryColor]);

  return (
    <div
      ref={profileContainerRef}
      className="from-background via-background to-theme-primary/10 min-h-screen bg-gradient-to-br"
      style={scopedThemeStyles}
    >
      <div className="container mx-auto space-y-6 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          {/* Back Button */}
          {showBackButton && onBackClick && (
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={onBackClick}
                className="text-foreground border-border/50 bg-background/10 transition-all hover:scale-105 hover:bg-white/20"
              >
                <ChevronLeft className="h-4 w-4" />
                {backButtonText}
              </Button>
            </div>
          )}

          {/* Hero Profile Section */}
          <div className="bg-background/80 border-theme-primary/20 relative overflow-hidden rounded-2xl p-6 shadow-xl backdrop-blur-md sm:p-8">
            <div className="bg-background absolute inset-0 opacity-20" />
            <div className="relative z-10">
              <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-8 sm:text-left">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="bg-theme-primary/20 absolute -inset-3 rounded-full opacity-60 blur-xl" />
                  <div className="from-theme-primary/10 to-theme-secondary/10 border-theme-primary/30 border-theme-primary/40 relative rounded-full bg-gradient-to-r p-1.5">
                    <Avatar className="border-theme-primary/50 h-28 w-28 sm:h-32 sm:w-32">
                      <AvatarImage
                        src={user.image_url || user.profile_image_url}
                        alt={displayName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-bold sm:text-3xl">
                        {displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-foreground text-3xl font-bold lowercase drop-shadow-lg sm:text-4xl">
                      {displayName}
                    </h1>
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground text-lg font-medium drop-shadow-md sm:text-xl">
                        @{user.username}
                      </p>
                      {/* Follow Button - only show for authenticated users viewing other profiles */}
                      {clerkUser && !isOwnProfile && (
                        <FollowButton
                          targetUserId={user.externalId}
                          username={user.username}
                          variant="default"
                          size="sm"
                          className="ml-auto sm:ml-0"
                        />
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <div className="max-w-xl">
                      <p className="text-muted-foreground text-sm leading-relaxed drop-shadow-sm sm:text-base">
                        {user.bio}
                      </p>
                    </div>
                  )}

                  {/* Stats Pills */}
                  <div className="flex flex-wrap gap-3">
                    <div className="border-border bg-card/50 rounded-full border px-3 py-1.5 backdrop-blur">
                      <div className="text-foreground flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">
                          joined {joinDate}
                        </span>
                      </div>
                    </div>
                    <div className="border-border bg-card/50 rounded-full border px-3 py-1.5 backdrop-blur">
                      <div className="text-foreground flex items-center gap-2">
                        <Heart className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold">{vibeCount}</span>
                        <span className="text-xs font-medium">vibes</span>
                      </div>
                    </div>
                    {averageReceivedRating > 0 && (
                      <div className="border-border bg-card/50 rounded-full border px-3 py-1.5 backdrop-blur">
                        <div className="text-foreground flex items-center gap-2">
                          <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                          <span className="text-xs font-bold">
                            {averageReceivedRating.toFixed(1)}
                          </span>
                          <span className="text-xs font-medium">
                            ({receivedRatingsCount} reviews)
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Follow Stats Pills */}
                    {clerkUser && (
                      <FollowStats
                        userId={user.externalId}
                        onFollowersClick={() => setIsFollowersModalOpen(true)}
                        onFollowingClick={() => setIsFollowingModalOpen(true)}
                        variant="default"
                      />
                    )}
                  </div>

                  {/* Interests Preview - show up to 3 interests */}
                  {user.interests && user.interests.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Sparkles className="text-muted-foreground h-3.5 w-3.5" />
                      {user.interests.slice(0, 3).map((interest) => (
                        <Badge
                          key={interest}
                          variant="secondary"
                          className="border-border bg-card/30 text-foreground hover:bg-card/50 text-xs transition-all"
                        >
                          {interest}
                        </Badge>
                      ))}
                      {user.interests.length > 3 && (
                        <span className="text-muted-foreground text-xs">
                          +{user.interests.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Social Links and Follow Button */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Social Links */}
                    {user.socials && (
                      <>
                        {user.socials.twitter && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-border bg-card/30 text-foreground hover:bg-card/50 transition-all hover:scale-105"
                          >
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
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-border bg-card/30 text-foreground hover:bg-card/50 transition-all hover:scale-105"
                          >
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
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-border bg-card/30 text-foreground hover:bg-card/50 transition-all hover:scale-105"
                          >
                            <a
                              href={user.socials.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Navigation */}
          <Tabs defaultValue="vibes" className="w-full">
            <div className="mt-12 mb-8 flex justify-center">
              <TabsList className="gap-1 rounded-2xl border-0 bg-transparent p-1.5 shadow-2xl backdrop-blur-md">
                <TabsTrigger
                  value="vibes"
                  className="data-[state=active]:from-theme-primary data-[state=active]:to-theme-secondary hover:bg-foreground/10 data-[state=active]:text-primary-foreground rounded-xl px-6 py-2 font-medium lowercase transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-lg"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  vibes
                </TabsTrigger>
                {userRatings !== undefined && (
                  <TabsTrigger
                    value="reviews"
                    className="data-[state=active]:from-theme-primary data-[state=active]:to-theme-secondary hover:bg-foreground/10 data-[state=active]:text-primary-foreground rounded-xl px-6 py-2 font-medium lowercase transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-lg"
                  >
                    <Star className="mr-2 h-4 w-4" />
                    reviews
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:from-theme-primary data-[state=active]:to-theme-secondary hover:bg-foreground/10 data-[state=active]:text-primary-foreground rounded-xl px-6 py-2 font-medium lowercase transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-lg"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  about
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Vibes Tab */}
            <TabsContent value="vibes" className="mt-8 space-y-0">
              <div className="space-y-8">
                <div className="text-center">
                  <h2
                    className={`from-theme-primary to-theme-secondary mb-3 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent lowercase`}
                  >
                    created vibes
                  </h2>
                  <p className="text-muted-foreground/80 text-base">
                    {vibeCount}{' '}
                    {vibeCount === 1 ? 'unique vibe' : 'unique vibes'} shared
                    with the community
                  </p>
                </div>

                <div>
                  <MasonryFeed
                    vibes={userVibes || []}
                    isLoading={vibesLoading}
                    variant="category"
                    ratingDisplayMode="most-rated"
                    showLoadMoreTarget={false}
                    emptyStateTitle="no vibes yet"
                    emptyStateDescription={`${user.username} hasn't created any vibes yet. check back later for amazing content ✨`}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            {userRatings !== undefined && (
              <TabsContent value="reviews" className="mt-8 space-y-0">
                <div className="space-y-8">
                  <div className="text-center">
                    <h2
                      className={`from-theme-primary to-theme-secondary mb-3 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent lowercase`}
                    >
                      review activity
                    </h2>
                    <p className="text-muted-foreground/80 text-base">
                      community feedback and ratings
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Reviews Given */}
                    <Card
                      className={`bg-background/80 border-theme-primary/20 shadow-xl backdrop-blur-md`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`from-theme-primary to-theme-secondary rounded-lg bg-gradient-to-r p-2`}
                          >
                            <TrendingUp className="text-primary-foreground h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle
                              className={`from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent lowercase`}
                            >
                              reviews given
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80 text-sm">
                              {givenRatingsCount} thoughtful{' '}
                              {givenRatingsCount === 1 ? 'review' : 'reviews'}
                            </CardDescription>
                          </div>
                        </div>
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
                            {userRatings
                              .filter((r) => r !== null)
                              .slice(0, 5)
                              .map((rating, index) => {
                                if (!rating) return null;
                                return (
                                  <div
                                    key={
                                      rating._id ||
                                      `rating-${rating.vibeId}-${rating.userId}-${index}`
                                    }
                                    className="border-border bg-card rounded-lg border p-4"
                                  >
                                    <div className="flex items-start gap-3">
                                      <img
                                        src={rating.vibe?.image || ''}
                                        alt={rating.vibe?.title || ''}
                                        className="h-12 w-12 rounded-lg object-cover"
                                      />
                                      <div className="flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                          <h4 className="text-sm font-medium">
                                            {rating.vibe?.title || 'Unknown'}
                                          </h4>
                                          {rating.emoji ? (
                                            <EmojiRatingDisplay
                                              rating={{
                                                emoji: rating.emoji,
                                                value: rating.value || 0,
                                                count: 1,
                                              }}
                                              showScale={false}
                                            />
                                          ) : (
                                            <div className="flex items-center gap-1">
                                              {[...Array(5)].map((_, i) => (
                                                <Star
                                                  key={i}
                                                  className={`h-3 w-3 ${rating.value && i < rating.value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                />
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        {rating.review && (
                                          <p className="text-muted-foreground text-sm">
                                            {rating.review}
                                          </p>
                                        )}
                                        <p className="text-muted-foreground mt-1 text-xs">
                                          {rating.createdAt
                                            ? new Date(
                                                rating.createdAt
                                              ).toLocaleDateString()
                                            : ''}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            {givenRatingsCount > 5 && (
                              <p className="text-muted-foreground text-center text-sm">
                                and {givenRatingsCount - 5} more reviews...
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="py-8 text-center">
                            <div className="mb-4 text-4xl opacity-50">💭</div>
                            <p className="text-muted-foreground/80">
                              no reviews given yet
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Reviews Received */}
                    <Card
                      className={`bg-background/80 border-theme-primary/20 shadow-xl backdrop-blur-md`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`from-theme-primary to-theme-secondary rounded-lg bg-gradient-to-r p-2`}
                          >
                            <Star className="text-primary-foreground h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle
                              className={`from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent lowercase`}
                            >
                              reviews received
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80 text-sm">
                              <div className="flex flex-wrap items-center gap-2">
                                <span>
                                  {receivedRatingsCount} community{' '}
                                  {receivedRatingsCount === 1
                                    ? 'review'
                                    : 'reviews'}
                                </span>
                                {averageReceivedRating > 0 && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/20 px-2 py-1 text-xs font-medium">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-yellow-600">
                                      {averageReceivedRating.toFixed(1)} avg
                                    </span>
                                  </span>
                                )}
                              </div>
                            </CardDescription>
                          </div>
                        </div>
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
                            {receivedRatings
                              .slice(0, 5)
                              .map((rating, index) => (
                                <div
                                  key={
                                    rating._id ||
                                    `received-rating-${rating.vibeId}-${rating.userId}-${index}`
                                  }
                                  className="border-border bg-card rounded-lg border p-4"
                                >
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={rating.rater?.image_url}
                                      />
                                      <AvatarFallback>
                                        {rating.rater?.username?.[0] || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="mb-1 flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                          {rating.rater?.username || 'Unknown'}
                                        </span>
                                        {rating.emoji ? (
                                          <EmojiRatingDisplay
                                            rating={{
                                              emoji: rating.emoji,
                                              value: rating.value || 0,
                                              count: 1,
                                            }}
                                            showScale={false}
                                          />
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                              <Star
                                                key={i}
                                                className={`h-3 w-3 ${rating.value && i < rating.value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-muted-foreground mb-1 text-sm">
                                        on "
                                        {(
                                          rating as {
                                            vibe?: { title?: string };
                                          }
                                        ).vibe?.title || 'Unknown'}
                                        "
                                      </p>
                                      {rating.review && (
                                        <p className="text-muted-foreground text-sm">
                                          {rating.review}
                                        </p>
                                      )}
                                      <p className="text-muted-foreground mt-1 text-xs">
                                        {rating.createdAt
                                          ? new Date(
                                              rating.createdAt
                                            ).toLocaleDateString()
                                          : ''}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {receivedRatingsCount > 5 && (
                              <p className="text-muted-foreground text-center text-sm">
                                and {receivedRatingsCount - 5} more reviews...
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="py-8 text-center">
                            <div className="mb-4 text-4xl opacity-50">⭐</div>
                            <p className="text-muted-foreground/80">
                              no reviews received yet
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* About Tab */}
            <TabsContent value="about" className="mt-8 space-y-0">
              <div className="space-y-8">
                <div className="text-center">
                  <h2
                    className={`from-theme-primary to-theme-secondary mb-3 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent lowercase`}
                  >
                    about {displayName.toLowerCase()}
                  </h2>
                  <p className="text-muted-foreground/80 text-base">
                    community presence and personality insights
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Profile Details */}
                  <Card
                    className={`bg-background/80 border-theme-primary/20 shadow-xl backdrop-blur-md`}
                  >
                    <CardContent className="space-y-6 p-6">
                      {user.bio && (
                        <div>
                          <h3
                            className={`from-theme-primary to-theme-secondary mb-3 bg-gradient-to-r bg-clip-text text-base font-semibold text-transparent lowercase`}
                          >
                            bio
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {user.bio}
                          </p>
                        </div>
                      )}

                      {user.interests && user.interests.length > 0 && (
                        <div>
                          <h3
                            className={`from-theme-primary to-theme-secondary mb-3 bg-gradient-to-r bg-clip-text text-base font-semibold text-transparent lowercase`}
                          >
                            interests
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {user.interests.map((interest) => (
                              <Badge
                                key={interest}
                                variant="secondary"
                                className="themed-pills text-foreground"
                              >
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3
                          className={`from-theme-primary to-theme-secondary mb-3 bg-gradient-to-r bg-clip-text text-base font-semibold text-transparent lowercase`}
                        >
                          member since
                        </h3>
                        <p className="text-muted-foreground">{joinDate}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Community Stats */}
                  <Card
                    className={`bg-background/80 border-theme-primary/20 shadow-xl backdrop-blur-md`}
                  >
                    <CardContent className="p-6">
                      <h3
                        className={`from-theme-primary to-theme-secondary mb-4 bg-gradient-to-r bg-clip-text text-base font-semibold text-transparent lowercase`}
                      >
                        community impact
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="text-center">
                          <div
                            className={`from-theme-primary/10 to-theme-secondary/10 border-theme-primary/30 border-border rounded-xl border bg-gradient-to-r p-3`}
                          >
                            <p
                              className={`from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent`}
                            >
                              {vibeCount}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm lowercase">
                              vibes created
                            </p>
                          </div>
                        </div>
                        {userRatings !== undefined && (
                          <div className="text-center">
                            <div
                              className={`from-theme-primary/10 to-theme-secondary/10 border-theme-primary/30 border-border rounded-xl border bg-gradient-to-r p-3`}
                            >
                              <p
                                className={`from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent`}
                              >
                                {givenRatingsCount}
                              </p>
                              <p className="text-muted-foreground mt-1 text-sm lowercase">
                                reviews given
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="text-center">
                          <div
                            className={`from-theme-primary/10 to-theme-secondary/10 border-theme-primary/30 border-border rounded-xl border bg-gradient-to-r p-3`}
                          >
                            <p
                              className={`from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent`}
                            >
                              {receivedRatingsCount}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm lowercase">
                              reviews received
                            </p>
                          </div>
                        </div>
                        {averageReceivedRating > 0 && (
                          <div className="text-center">
                            <div
                              className={`from-theme-primary/10 to-theme-secondary/10 border-theme-primary/30 border-border rounded-xl border bg-gradient-to-r p-3`}
                            >
                              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                <span
                                  className={`from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-transparent`}
                                >
                                  {averageReceivedRating.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-muted-foreground mt-1 text-sm lowercase">
                                average rating
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Emoji Personality */}
                  {emojiStats && emojiStats.totalEmojiRatings > 0 && (
                    <Card
                      className={`bg-background/80 border-theme-primary/20 shadow-xl backdrop-blur-md`}
                    >
                      <CardContent className="p-6">
                        <h3
                          className={`from-theme-primary to-theme-secondary mb-4 bg-gradient-to-r bg-clip-text text-base font-semibold text-transparent lowercase`}
                        >
                          emoji personality
                        </h3>
                        <div className="space-y-4">
                          {emojiStats.mostUsedEmoji && (
                            <div className="text-center">
                              <p className="text-muted-foreground mb-2 text-xs lowercase">
                                signature emoji
                              </p>
                              <div
                                className={`from-theme-primary/10 to-theme-secondary/10 border-theme-primary/30 border-border rounded-xl border bg-gradient-to-r p-4`}
                              >
                                <span className="mb-2 block text-3xl">
                                  {emojiStats.mostUsedEmoji.emoji}
                                </span>
                                <p className="text-xs font-medium">
                                  used {emojiStats.mostUsedEmoji.count} times
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {emojiStats.mostUsedEmoji.averageValue.toFixed(
                                    1
                                  )}
                                  /5 average
                                </p>
                              </div>
                            </div>
                          )}

                          {emojiStats.topEmojis.length > 0 && (
                            <div>
                              <p className="text-muted-foreground mb-2 text-center text-xs lowercase">
                                emoji collection
                              </p>
                              <div className="flex flex-wrap justify-center gap-2">
                                {emojiStats.topEmojis
                                  .slice(0, 6)
                                  .map((stat) => (
                                    <div
                                      key={stat.emoji}
                                      className={`from-theme-primary/10 to-theme-secondary/10 border-theme-primary/30 border-border flex items-center gap-1 rounded-full border bg-gradient-to-r px-2 py-1`}
                                    >
                                      <span className="text-sm">
                                        {stat.emoji}
                                      </span>
                                      <span className="text-muted-foreground text-xs font-medium">
                                        {stat.count}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Follow Modals */}
      {clerkUser && (
        <>
          <FollowersModal
            isOpen={isFollowersModalOpen}
            onClose={() => setIsFollowersModalOpen(false)}
            userId={user.externalId}
            username={user.username}
          />
          <FollowingModal
            isOpen={isFollowingModalOpen}
            onClose={() => setIsFollowingModalOpen(false)}
            userId={user.externalId}
            username={user.username}
          />
        </>
      )}
    </div>
  );
}
