# Rating and Review System Improvements Implementation Plan

## Overview

**Status**: ✅ **COMPLETED** (August 27, 2025)  
**Major Achievement**: Unified vibe card & rating system (commit 94160c1)

This plan addressed five critical issues with the rating and review system in vibechecc:

1. ✅ Fix revolving emoji rating display bug - **COMPLETED**
2. ✅ Implement one review per vibe per emoji type validation - **COMPLETED**
3. ✅ Prevent users from rating their own vibes - **COMPLETED**
4. 🔄 Update notification system for reviews - **PARTIALLY COMPLETED**
5. ✅ Add share functionality with image generation for ratings - **COMPLETED**

**Additional Achievements**:

- ✅ Complete rating system unification with new comprehensive dialog
- ✅ Vibe voting button system implementation
- ✅ Rating share functionality with canvas generation
- ✅ Review card component system

## Current System Analysis

### Issues Identified

1. **Revolving Emoji Rating Bug**: The `EmojiRatingCycleDisplay` component pre-selects the currently displayed emoji, which changes with the rotation cycle, creating user confusion
2. **Multiple Reviews per Emoji**: No validation preventing multiple reviews with the same emoji per user
3. **Self-Rating Prevention**: No validation preventing users from rating their own vibes
4. **Notification System**: Currently sends "comment" notifications instead of "review" notifications
5. **Missing Share Feature**: No system to generate shareable images for ratings

### Current Architecture

- **Frontend**: React components with TanStack Query, rating system with emoji metadata
- **Backend**: Convex database with ratings, emojiRatings, and notifications tables
- **Validation**: Basic 1-5 rating validation, required review text
- **Sharing**: Basic vibe sharing exists, but no rating-specific sharing

## Phase 1: Fix Revolving Emoji Rating Issue ✅ COMPLETED

**Status**: ✅ **COMPLETED** (August 2025)

### Root Cause Analysis ✅ RESOLVED

The `preSelectedEmoji` logic in `emoji-rating-cycle-display.tsx` was causing automatic emoji selection during rotation cycles.

### Solution ✅ IMPLEMENTED

- ✅ Fixed `preSelectedEmoji` logic to prevent automatic selection during rotation
- ✅ Added proper user interaction state management
- ✅ Unified rating system with comprehensive dialog component

### Files Modified ✅ COMPLETED

- ✅ `/Users/jacob/Developer/vibechecc/apps/web/src/features/ratings/components/emoji-rating-cycle-display.tsx`
- ✅ Major refactoring: New comprehensive rating dialog system
- ✅ New file: `rate-and-review-dialog.tsx` (1086 lines)

### Implementation Results ✅ ACHIEVED

1. ✅ User interaction tracking implemented
2. ✅ Automatic emoji selection eliminated
3. ✅ Complete rating system overhaul with unified components
4. ✅ Enhanced user experience with improved dialog system
5. Add tests to verify emoji doesn't change during rotation

```typescript
// Add state tracking
const [userInteracted, setUserInteracted] = useState(false);
const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

// Only pass selected emoji if user interacted
const effectiveEmoji = userInteracted ? selectedEmoji : undefined;

// Update on user interaction
const handleHover = (emoji: string) => {
  setUserInteracted(true);
  setSelectedEmoji(emoji);
};
```

## Phase 2: Implement One Review per Emoji Type Validation ✅ COMPLETED

**Status**: ✅ **COMPLETED** (August 2025)

### Database Constraint ✅ IMPLEMENTED

Compound index on `vibeId`, `userId`, and `emoji` implemented for efficient duplicate detection.

### Backend Changes ✅ COMPLETED

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/emojiRatings.ts` - **COMPLETED**

```typescript
// Check for existing rating
const existingRating = await ctx.db
  .query('emojiRatings')
  .withIndex('byVibeUserEmoji', (q) =>
    q.eq('vibeId', args.vibeId).eq('userId', userId).eq('emoji', args.emoji)
  )
  .first();

if (existingRating) {
  // Return warning with existing rating details
  return {
    error: 'DUPLICATE_EMOJI',
    message: `You've already rated this vibe with ${args.emoji}`,
    existingRating: {
      value: existingRating.value,
      review: existingRating.review,
      createdAt: existingRating._creationTime,
    },
    confirmOverwrite: true,
  };
}
```

### Frontend Changes

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/ratings/components/rating-popover.tsx`

- Add confirmation dialog for overwriting existing ratings
- Display existing rating information
- Handle validation errors gracefully

## Phase 3: Prevent Self-Rating ✅ COMPLETED

**Status**: ✅ **COMPLETED** (August 2025)

### Backend Validation ✅ IMPLEMENTED

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/emojiRatings.ts` - **COMPLETED**

```typescript
// Check if user owns the vibe
const vibe = await ctx.db.get(args.vibeId);
if (!vibe) {
  throw new Error('Vibe not found');
}

if (vibe.createdById === userId) {
  return {
    error: 'SELF_RATING',
    message: "You can't rate your own vibe",
  };
}
```

### Frontend Changes

**Files to Modify**:

- `/Users/jacob/Developer/vibechecc/apps/web/src/features/vibes/components/vibe-card.tsx`
- `/Users/jacob/Developer/vibechecc/apps/web/src/routes/vibes/$vibeId.tsx`

```typescript
// Conditionally render rating components
{!isOwnVibe ? (
  <RatingPopover vibeId={vibe._id} />
) : (
  <div className="text-muted-foreground text-sm">
    you can't rate your own vibe
  </div>
)}
```

## Phase 4: Update Notification System 🔄 PARTIALLY COMPLETED

**Status**: 🔄 **PARTIALLY COMPLETED** (August 2025)

### Notification Type Update 🔄 IN PROGRESS

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/emojiRatings.ts` - **PARTIALLY IMPLEMENTED**

```typescript
// Create review notification
await ctx.db.insert('notifications', {
  userId: vibe.createdById,
  type: 'review', // Changed from 'rating'
  message: `${userName} reviewed your vibe "${vibe.title}"`,
  link: `/vibes/${args.vibeId}#rating-${newRatingId}`,
  read: false,
  createdAt: Date.now(),
  metadata: {
    vibeId: args.vibeId,
    ratingId: newRatingId,
    emoji: args.emoji,
    value: args.value,
  },
});
```

### Update Notification Display

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/notifications/components/notification-item.tsx`

```typescript
// Handle review notifications
case 'review':
  return (
    <div className="notification-item">
      <span>{notification.message}</span>
      <Link to={notification.link}>view review</Link>
    </div>
  );
```

## Phase 5: Rating Share Image Generation ✅ COMPLETED

**Status**: ✅ **COMPLETED** (August 2025)

### New Component: Rating Share Canvas ✅ IMPLEMENTED

**Files Created**:

- ✅ `/Users/jacob/Developer/vibechecc/apps/web/src/components/social/rating-share-button.tsx` - **COMPLETED**
- ✅ `/Users/jacob/Developer/vibechecc/apps/web/src/components/social/rating-share-modal.tsx` - **COMPLETED**
- ✅ Canvas generation functionality with rating visualization - **COMPLETED**

```typescript
export function RatingShareCanvas({
  rating,
  vibe,
  user
}: RatingShareProps) {
  return (
    <div className="share-canvas square">
      {/* Vibe information */}
      <div className="vibe-info">
        <img src={vibe.imageUrl} alt={vibe.title} />
        <h3>{vibe.title}</h3>
        <p>by @{vibe.author}</p>
      </div>

      {/* Rating highlight */}
      <div className="rating-highlight">
        <div className="emoji">{rating.emoji}</div>
        <div className="stars">{rating.value}/5</div>
        <blockquote>"{rating.review}"</blockquote>
        <p>- @{user.username}</p>
      </div>

      {/* Branding */}
      <div className="branding">
        <Logo />
        <span>vibechecc</span>
      </div>
    </div>
  );
}
```

### Update Share Modal

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/components/social/share-modal.tsx`

Add rating share option:

```typescript
{shareType === 'rating' && (
  <RatingShareCanvas
    rating={rating}
    vibe={vibe}
    user={currentUser}
  />
)}
```

### Backend Support

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/social/sharing.ts`

```typescript
export const trackRatingShare = mutation({
  args: {
    ratingId: v.id('emojiRatings'),
    platform: v.string(),
  },
  handler: async (ctx, args) => {
    // Track rating share event
    await ctx.db.insert('shareEvents', {
      type: 'rating',
      ratingId: args.ratingId,
      platform: args.platform,
      userId: ctx.auth.getUserId(),
      createdAt: Date.now(),
    });
  },
});
```

## Phase 6: Rating Like System Implementation

### Overview

Implement a like system for ratings/reviews, allowing users to "like" other users' ratings similar to social media platforms. This enhances engagement and provides social validation for quality reviews.

### Database Schema Changes

**New Table**: `ratingLikes`

```typescript
// Add to schema.ts
ratingLikes: defineTable({
  ratingId: v.id('emojiRatings'),
  userId: v.id('users'),
  createdAt: v.number(),
})
.index('byRating', ['ratingId'])
.index('byUser', ['userId'])
.index('byRatingUser', ['ratingId', 'userId']), // For duplicate prevention
```

### Backend Implementation

**New File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/ratingLikes.ts`

```typescript
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Like/unlike a rating
export const toggleRatingLike = mutation({
  args: {
    ratingId: v.id('emojiRatings'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Authentication required');
    }

    // Check if rating exists
    const rating = await ctx.db.get(args.ratingId);
    if (!rating) {
      throw new Error('Rating not found');
    }

    // Prevent liking own rating
    if (rating.userId === identity.subject) {
      throw new Error("You can't like your own rating");
    }

    // Check for existing like
    const existingLike = await ctx.db
      .query('ratingLikes')
      .withIndex('byRatingUser', (q) =>
        q.eq('ratingId', args.ratingId).eq('userId', identity.subject)
      )
      .first();

    if (existingLike) {
      // Unlike - remove the like
      await ctx.db.delete(existingLike._id);

      return {
        action: 'unliked',
        likeCount: await getRatingLikeCount(ctx, args.ratingId),
      };
    } else {
      // Like - add new like
      await ctx.db.insert('ratingLikes', {
        ratingId: args.ratingId,
        userId: identity.subject,
        createdAt: Date.now(),
      });

      // Create notification for rating author
      const ratingAuthor = await ctx.db.get(rating.userId);
      if (ratingAuthor) {
        const liker = await ctx.db.get(identity.subject);
        await ctx.db.insert('notifications', {
          userId: rating.userId,
          type: 'rating_like',
          message: `${liker?.name || 'Someone'} liked your review`,
          link: `/vibes/${rating.vibeId}#rating-${args.ratingId}`,
          read: false,
          createdAt: Date.now(),
          metadata: {
            ratingId: args.ratingId,
            likerId: identity.subject,
          },
        });
      }

      return {
        action: 'liked',
        likeCount: await getRatingLikeCount(ctx, args.ratingId),
      };
    }
  },
});

// Get like count for a rating
export const getRatingLikeCount = query({
  args: {
    ratingId: v.id('emojiRatings'),
  },
  handler: async (ctx, args) => {
    return await getRatingLikeCount(ctx, args.ratingId);
  },
});

// Helper function
async function getRatingLikeCount(ctx: any, ratingId: string): Promise<number> {
  const likes = await ctx.db
    .query('ratingLikes')
    .withIndex('byRating', (q) => q.eq('ratingId', ratingId))
    .collect();

  return likes.length;
}

// Check if current user has liked a rating
export const hasUserLikedRating = query({
  args: {
    ratingId: v.id('emojiRatings'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const like = await ctx.db
      .query('ratingLikes')
      .withIndex('byRatingUser', (q) =>
        q.eq('ratingId', args.ratingId).eq('userId', identity.subject)
      )
      .first();

    return !!like;
  },
});

// Get ratings with like counts and user like status
export const getRatingsWithLikes = query({
  args: {
    vibeId: v.id('vibes'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const currentUserId = identity?.subject;

    const ratings = await ctx.db
      .query('emojiRatings')
      .withIndex('byVibe', (q) => q.eq('vibeId', args.vibeId))
      .collect();

    const ratingsWithLikes = await Promise.all(
      ratings.map(async (rating) => {
        const likeCount = await getRatingLikeCount(ctx, rating._id);

        let hasLiked = false;
        if (currentUserId) {
          const userLike = await ctx.db
            .query('ratingLikes')
            .withIndex('byRatingUser', (q) =>
              q.eq('ratingId', rating._id).eq('userId', currentUserId)
            )
            .first();
          hasLiked = !!userLike;
        }

        return {
          ...rating,
          likeCount,
          hasLiked,
        };
      })
    );

    return ratingsWithLikes;
  },
});
```

### Frontend Components

**New Component**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/ratings/components/rating-like-button.tsx`

```typescript
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@vibechecc/convex';
import { cn } from '@/utils/tailwind-utils';
import { Heart } from 'lucide-react';

interface RatingLikeButtonProps {
  ratingId: string;
  initialLikeCount?: number;
  initialHasLiked?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function RatingLikeButton({
  ratingId,
  initialLikeCount = 0,
  initialHasLiked = false,
  size = 'sm',
  className,
}: RatingLikeButtonProps) {
  const [optimisticState, setOptimisticState] = useState({
    likeCount: initialLikeCount,
    hasLiked: initialHasLiked,
  });

  const { data: likeCount } = useQuery({
    queryKey: ['rating-like-count', ratingId],
    queryFn: () => api.ratingLikes.getRatingLikeCount({ ratingId }),
    initialData: initialLikeCount,
  });

  const { data: hasLiked } = useQuery({
    queryKey: ['rating-has-liked', ratingId],
    queryFn: () => api.ratingLikes.hasUserLikedRating({ ratingId }),
    initialData: initialHasLiked,
  });

  const likeMutation = useMutation({
    mutationFn: () => api.ratingLikes.toggleRatingLike({ ratingId }),
    onMutate: () => {
      // Optimistic update
      setOptimisticState((prev) => ({
        likeCount: prev.hasLiked ? prev.likeCount - 1 : prev.likeCount + 1,
        hasLiked: !prev.hasLiked,
      }));
    },
    onSuccess: (data) => {
      setOptimisticState({
        likeCount: data.likeCount,
        hasLiked: data.action === 'liked',
      });
    },
    onError: () => {
      // Revert optimistic update
      setOptimisticState({
        likeCount,
        hasLiked,
      });
    },
  });

  const effectiveLikeCount = optimisticState.likeCount;
  const effectiveHasLiked = optimisticState.hasLiked;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={likeMutation.isPending}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
        effectiveHasLiked && 'border-theme-primary bg-theme-primary/10 text-theme-primary',
        size === 'sm' && 'px-2 py-1 text-xs',
        size === 'md' && 'px-3 py-1.5 text-sm',
        likeMutation.isPending && 'opacity-70',
        className
      )}
    >
      <Heart
        className={cn(
          'transition-all',
          size === 'sm' && 'h-3 w-3',
          size === 'md' && 'h-4 w-4',
          effectiveHasLiked && 'fill-current'
        )}
      />
      {effectiveLikeCount > 0 && (
        <span className="font-medium">{effectiveLikeCount}</span>
      )}
    </button>
  );
}
```

### Integration with Existing Components

**Update**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/ratings/components/rating-display.tsx`

```typescript
// Add like button to rating display
import { RatingLikeButton } from './rating-like-button';

// In the rating item component
<div className="rating-footer">
  <div className="rating-meta">
    <span className="author">@{rating.userName}</span>
    <span className="date">{formatDate(rating._creationTime)}</span>
  </div>

  <RatingLikeButton
    ratingId={rating._id}
    initialLikeCount={rating.likeCount}
    initialHasLiked={rating.hasLiked}
    size="sm"
  />
</div>
```

**Update**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/ratings/hooks/use-ratings.ts`

```typescript
// Use the new query that includes like data
export function useRatingsWithLikes(vibeId: string) {
  return useQuery({
    queryKey: ['ratings-with-likes', vibeId],
    queryFn: () => api.ratingLikes.getRatingsWithLikes({ vibeId }),
    enabled: !!vibeId,
  });
}
```

### Notification Updates

**Update**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/notifications/components/notification-item.tsx`

```typescript
// Add case for rating like notifications
case 'rating_like':
  return (
    <div className="notification-item">
      <Heart className="h-4 w-4 text-theme-primary" />
      <span>{notification.message}</span>
      <Link to={notification.link} className="text-theme-primary">
        view rating
      </Link>
    </div>
  );
```

### Testing Requirements

#### Unit Tests

- Rating like/unlike functionality
- Duplicate like prevention
- Self-like prevention
- Like count accuracy
- Optimistic UI updates

#### Integration Tests

- Complete like/unlike flow
- Notification creation for likes
- Like count synchronization
- Error handling for invalid ratings

#### UI Tests

- Like button visual states
- Like count display
- Responsive behavior
- Accessibility compliance

### API Types

```typescript
// Add to @vibechecc/types
export interface RatingWithLikes extends EmojiRating {
  likeCount: number;
  hasLiked: boolean;
}

export interface RatingLikeResponse {
  action: 'liked' | 'unliked';
  likeCount: number;
}

export interface RatingLike {
  _id: Id<'ratingLikes'>;
  ratingId: Id<'emojiRatings'>;
  userId: Id<'users'>;
  createdAt: number;
}
```

### Performance Considerations

1. **Database Indexes**: Compound indexes for efficient lookups
2. **Caching**: Like counts cached with rating data
3. **Optimistic Updates**: Immediate UI feedback for better UX
4. **Batch Operations**: Group multiple like operations when possible

### Success Metrics

- 30% increase in rating engagement
- Average 2-3 likes per quality rating
- Reduced time to recognition for good reviews
- Improved overall review quality due to social validation

## Phase 7: Testing & Validation

### Test Coverage

#### Unit Tests

- Revolving emoji state management
- Validation logic for duplicates and self-rating
- Notification creation and formatting
- Share canvas generation

#### Integration Tests

- Complete rating submission flow
- Error handling and user feedback
- Share functionality end-to-end

#### UI Tests

- User interaction with revolving emojis
- Confirmation dialogs
- Error message display
- Share preview and generation

### Error Handling

```typescript
interface RatingError {
  type: 'DUPLICATE_EMOJI' | 'SELF_RATING' | 'INVALID_VIBE' | 'AUTH_REQUIRED';
  message: string;
  details?: {
    existingRating?: ExistingRating;
    confirmOverwrite?: boolean;
  };
}
```

### Success Metrics

- Zero revolving emoji bugs reported
- 95% reduction in duplicate emoji ratings
- Improved user engagement with reviews
- Increased social sharing of ratings by 40%
- Higher quality ratings due to validation

## Technical Specifications

### Database Schema Updates

```typescript
// Add compound index for emoji rating uniqueness
.index('byVibeUserEmoji', ['vibeId', 'userId', 'emoji'])

// Add field for tracking rating shares
shareEvents: defineTable({
  // ... existing fields
  ratingId: v.optional(v.id('emojiRatings')),
})
```

### API Contract Changes

```typescript
// Enhanced error response
interface RatingValidationError {
  type: 'DUPLICATE_EMOJI' | 'SELF_RATING' | 'INVALID_VIBE';
  message: string;
  existingRating?: {
    emoji: string;
    value: number;
    review: string;
    createdAt: string;
  };
}

// Rating submission response
interface RatingSubmissionResponse {
  success: boolean;
  ratingId?: string;
  error?: RatingValidationError;
  requiresConfirmation?: boolean;
}
```

### Frontend State Management

```typescript
interface RatingFormState {
  showDuplicateWarning: boolean;
  existingRating: EmojiRating | null;
  confirmOverwrite: boolean;
  userInteracted: boolean;
  isSubmitting: boolean;
  error: RatingValidationError | null;
}
```

## Risk Assessment & Mitigation

### High Risk Items

1. **Database Performance**: New compound indexes may affect query performance
   - **Mitigation**: Performance testing and query optimization
2. **User Experience**: Additional validation may slow down rating flow
   - **Mitigation**: Async validation and optimistic UI updates

### Medium Risk Items

1. **Backward Compatibility**: Changes to notification system
   - **Mitigation**: Gradual rollout and fallback mechanisms
2. **Share Image Generation**: Canvas rendering performance on mobile
   - **Mitigation**: Progressive loading and size optimization

### Low Risk Items

1. **UI Changes**: Minor visual updates to rating components
2. **Error Messages**: New validation messages

## Implementation Timeline

### Phase 1-3: Core Bug Fixes (3-4 days)

- Day 1: Fix revolving emoji issue
- Day 2: Implement duplicate validation
- Day 3: Add self-rating prevention
- Day 4: Testing and refinement

### Phase 4: Notification Updates (1-2 days)

- Update notification creation
- Modify notification display
- Test notification flow

### Phase 5: Share Feature (2-3 days)

- Create share canvas component
- Integrate with share modal
- Add backend tracking
- Test on various devices

### Phase 6: Rating Like System (2-3 days)

- Design and implement database schema
- Create backend functions for like/unlike operations
- Build frontend like button component
- Integrate with existing rating display
- Add notification system for rating likes
- Test like functionality and performance

### Phase 7: Testing & Validation (2-3 days)

- Comprehensive test coverage
- User acceptance testing
- Performance validation
- Bug fixes and polish

**Total Estimated Time**: 10-15 days

## Deployment Strategy

### Rollout Phases

1. **Phase 1**: Deploy bug fixes (immediate)
2. **Phase 2**: Roll out validation features (gradual)
3. **Phase 3**: Enable share functionality (feature flag)

### Monitoring

- Track error rates for rating submissions
- Monitor validation trigger frequency
- Measure share feature adoption
- Collect user feedback on new validations

## Success Criteria

1. **Bug Resolution**: Zero reports of revolving emoji issues within 2 weeks
2. **Data Quality**: 95% reduction in duplicate emoji ratings
3. **User Feedback**: Positive response to validation messages
4. **Engagement**: 20% increase in review completion rate
5. **Social Sharing**: At least 10% of ratings generate share events
6. **Performance**: No degradation in rating submission time

This comprehensive plan addresses all identified issues while maintaining the existing codebase patterns and following the established testing and development conventions in the vibechecc project.
