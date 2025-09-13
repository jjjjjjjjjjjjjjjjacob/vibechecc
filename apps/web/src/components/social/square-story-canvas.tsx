import { forwardRef } from 'react';
import type { Vibe, User, EmojiRating, Rating } from '@vibechecc/types';
import { computeUserDisplayName, getUserAvatarUrl } from '@/utils/user-utils';
import { format } from '@/utils/date-utils';
import { APP_NAME, APP_DOMAIN } from '@/utils/bindings';
import { cn } from '@/utils/tailwind-utils';

interface SquareStoryCanvasProps {
  vibe: Vibe;
  author: User;
  ratings?: (EmojiRating | Rating)[];
  showResponses?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export const SquareStoryCanvas = forwardRef<
  HTMLDivElement,
  SquareStoryCanvasProps
>(
  (
    {
      vibe,
      author,
      ratings = [],
      showResponses = true,
      theme = 'light',
      className,
    },
    ref
  ) => {
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
        : 0;

    const topEmojis = ratings
      .reduce(
        (acc, rating) => {
          const existing = acc.find((e) => e.emoji === rating.emoji);
          if (existing) {
            existing.count++;
            existing.totalValue += rating.value;
          } else {
            acc.push({
              emoji: rating.emoji,
              count: 1,
              totalValue: rating.value,
              avgValue: rating.value,
            });
          }
          return acc;
        },
        [] as {
          emoji: string;
          count: number;
          totalValue: number;
          avgValue: number;
        }[]
      )
      .map((item) => ({ ...item, avgValue: item.totalValue / item.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const displayName = computeUserDisplayName(author);
    const avatarUrl = getUserAvatarUrl(author);
    const initials = displayName.slice(0, 2).toUpperCase();

    const isDark = theme === 'dark';

    // Theme-based colors
    const colors = {
      background: isDark ? '#0a0a0a' : '#fafafa',
      foreground: isDark ? '#fafafa' : '#0a0a0a',
      primary: '#ec4899',
      secondary: '#f97316',
      muted: isDark ? '#1a1a1a' : '#f4f4f5',
      mutedForeground: isDark ? '#a1a1aa' : '#71717a',
      card: isDark ? '#141414' : '#ffffff',
      cardForeground: isDark ? '#fafafa' : '#0a0a0a',
      border: isDark ? '#27272a' : '#e4e4e7',
    };

    // Generate color index from title for gradient
    // Generate color index based on vibe title hash
    let hash = 0;
    if (vibe.title) {
      for (let i = 0; i < vibe.title.length; i++) {
        hash = vibe.title.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const colorIndex = Math.abs(hash % 6);

    const gradientColors = isDark
      ? [
          'from-pink-500 to-rose-500',
          'from-blue-500 to-sky-500',
          'from-green-500 to-emerald-500',
          'from-yellow-500 to-amber-500',
          'from-purple-500 to-violet-500',
          'from-orange-500 to-red-500',
        ]
      : [
          'from-pink-300 to-rose-300',
          'from-blue-300 to-sky-300',
          'from-green-300 to-emerald-300',
          'from-yellow-300 to-amber-300',
          'from-purple-300 to-violet-300',
          'from-orange-300 to-red-300',
        ];

    return (
      <div
        ref={ref}
        className={cn(
          'font-system relative flex flex-col',
          'h-[1080px] w-[1080px] p-16',
          className
        )}
        style={{
          backgroundColor: colors.background,
          color: colors.foreground,
        }}
      >
        {/* Header with proper top padding to prevent cutoff */}
        <div
          className="mb-8 flex items-center justify-between"
          style={{ paddingTop: '32px' }}
        >
          <div className="flex items-center gap-4">
            <h1
              className={`bg-gradient-to-r ${gradientColors[colorIndex]} bg-clip-text text-6xl font-bold text-transparent`}
            >
              {APP_NAME}
            </h1>
          </div>
          <div
            className="text-3xl font-medium"
            style={{ color: colors.mutedForeground }}
          >
            share your vibe
          </div>
        </div>

        {/* Main content card with better positioning */}
        <div
          className="flex flex-1 flex-col overflow-hidden rounded-3xl border-2 shadow-2xl"
          style={{
            backgroundColor: colors.card,
            borderColor: `${colors.primary}33`, // 20% opacity
            marginBottom: '32px', // Prevent bottom cutoff
          }}
        >
          {/* Author section */}
          <div className="flex items-center gap-6 p-12 pb-8">
            <div
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 text-3xl font-bold"
              style={{
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderColor: `${colors.primary}33`,
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <div
                className="text-3xl font-semibold"
                style={{ color: colors.cardForeground }}
              >
                {displayName}
              </div>
              {author?.username && (
                <div
                  className="text-2xl"
                  style={{ color: colors.mutedForeground }}
                >
                  @{author.username}
                </div>
              )}
            </div>
          </div>

          {/* Vibe content with optimized spacing */}
          <div className="flex-1 px-12 pb-8">
            {/* Title */}
            <h2
              className="mb-6 line-clamp-3 text-5xl leading-tight font-bold"
              style={{ color: colors.cardForeground }}
            >
              {vibe.title}
            </h2>

            {/* Description - Only show if not showing responses */}
            {!showResponses && (
              <p
                className="mb-8 line-clamp-4 text-3xl leading-relaxed"
                style={{ color: `${colors.cardForeground}CC` }} // 80% opacity
              >
                {vibe.description}
              </p>
            )}

            {/* Tags */}
            {vibe.tags && vibe.tags.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-3">
                {vibe.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-6 py-2 text-2xl font-medium"
                    style={{
                      backgroundColor: `${colors.primary}1A`, // 10% opacity
                      color: colors.primary,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Responses section - Only show if showResponses is true */}
            {showResponses && ratings.length > 0 && (
              <div className="space-y-6">
                {/* Top emoji reactions */}
                {topEmojis.length > 0 && (
                  <div>
                    <div
                      className="mb-4 text-2xl font-medium"
                      style={{ color: colors.mutedForeground }}
                    >
                      top reactions
                    </div>
                    <div className="flex gap-4">
                      {topEmojis.map(({ emoji, avgValue, count }) => (
                        <div
                          key={emoji}
                          className="flex items-center gap-3 rounded-full border-2 px-6 py-3"
                          style={{
                            backgroundColor: colors.muted,
                            borderColor: `${colors.border}80`,
                          }}
                        >
                          <span className="text-4xl">{emoji}</span>
                          <div className="flex flex-col">
                            <span
                              className="text-2xl font-bold"
                              style={{ color: colors.foreground }}
                            >
                              {avgValue.toFixed(1)}
                            </span>
                            <span
                              className="text-xl"
                              style={{ color: colors.mutedForeground }}
                            >
                              {count} {count === 1 ? 'rating' : 'ratings'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review excerpt */}
                {ratings.some(
                  (r) => 'review' in r && r.review && r.review.trim().length > 0
                ) && (
                  <div>
                    <div
                      className="mb-4 text-2xl font-medium"
                      style={{ color: colors.mutedForeground }}
                    >
                      recent review
                    </div>
                    {(() => {
                      const reviewRating = ratings.find(
                        (r) =>
                          'review' in r &&
                          r.review &&
                          r.review.trim().length > 0
                      ) as Rating | undefined;
                      if (!reviewRating) return null;

                      return (
                        <div
                          className="rounded-2xl border-l-4 p-6"
                          style={{
                            backgroundColor: colors.muted,
                            borderLeftColor: colors.primary,
                          }}
                        >
                          <p
                            className="mb-3 line-clamp-2 text-2xl leading-relaxed italic"
                            style={{ color: colors.cardForeground }}
                          >
                            "{reviewRating.review?.substring(0, 120)}
                            {reviewRating.review &&
                            reviewRating.review.length > 120
                              ? '...'
                              : ''}
                            "
                          </p>
                          <div
                            className="text-xl"
                            style={{ color: colors.mutedForeground }}
                          >
                            — {reviewRating.emoji}{' '}
                            {reviewRating.value.toFixed(1)}
                            {reviewRating.user &&
                              ` @${reviewRating.user.username || reviewRating.user.first_name || 'anonymous'}`}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats section at bottom */}
          <div className="px-12 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💬</span>
                  <span className="text-2xl font-semibold">
                    {ratings.length}{' '}
                    {ratings.length === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
                {averageRating > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⭐</span>
                    <span className="text-2xl font-semibold">
                      {averageRating.toFixed(1)} average
                    </span>
                  </div>
                )}
              </div>
              <div
                className="text-2xl"
                style={{ color: colors.mutedForeground }}
              >
                {format(new Date(vibe.createdAt), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Positioned to prevent cutoff */}
        <div className="flex flex-col gap-2" style={{ paddingBottom: '32px' }}>
          <div
            className="text-3xl font-medium"
            style={{ color: colors.foreground }}
          >
            view full vibe at
          </div>
          <div className="text-4xl font-bold" style={{ color: colors.primary }}>
            {APP_DOMAIN}
          </div>
        </div>
      </div>
    );
  }
);

SquareStoryCanvas.displayName = 'SquareStoryCanvas';
