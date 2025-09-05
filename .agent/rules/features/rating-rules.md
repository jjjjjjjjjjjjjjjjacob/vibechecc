# Rating Rules - Emoji and Star Rating System Implementation

This document defines the mandatory patterns and rules for implementing rating and review features across the vibechecc platform. These rules ensure consistency, data integrity, and optimal user experience for the comprehensive emoji rating system.

## 1. Emoji Rating Rules

### 5-Scale Emoji System

- **MUST** use 5-point rating scale (1.0 to 5.0) with 0.5 increments
- **MUST** require review text for all emoji ratings (minimum 1 character, maximum 3000 characters)
- **MUST** implement proper emoji metadata integration using `useEmojiMetadata` hook
- **MUST** validate emoji selection before allowing rating submission
- **MUST** enforce one rating per user per emoji per vibe

```tsx
// Correct rating validation pattern
const handleSubmit = async (data: {
  emoji: string;
  value: number;
  review: string;
}) => {
  if (!selectedEmoji) {
    setError('please select an emoji');
    return;
  }

  if (review.length === 0) {
    setError('please write a review');
    return;
  }

  if (review.length > MAX_REVIEW_LENGTH) {
    setError(`review must be under ${MAX_REVIEW_LENGTH} characters`);
    return;
  }

  await onSubmit(data);
};
```

### Emoji Selection UI

- **MUST** use `EmojiSearchCollapsible` component for emoji picker
- **MUST** show emoji metadata tags when available
- **MUST** implement proper mobile responsive behavior
- **MUST** provide "change emoji" option after initial selection
- **MUST** randomize review placeholders on emoji/rating changes

```tsx
// Correct emoji picker integration
<EmojiSearchCommand
  searchValue={searchValue}
  open={true}
  onSearchChange={setSearchValue}
  onSelect={handleEmojiSelect}
  showCategories={true}
  pageSize={200}
  perLine={isMobile ? 9 : 7}
  className="pointer-events-auto h-full max-h-[80vh] w-full"
  expandButtonVariant="circle"
/>
```

### Rating Input Patterns

- **MUST** use `RatingScale` component with proper props
- **MUST** implement hover effects with value preview
- **MUST** show lock-in animations with `FlipClockDigit` component
- **MUST** provide mobile slider functionality
- **MUST** display rating confirmation with themed visual feedback

```tsx
// Correct rating scale implementation
<RatingScale
  emoji={selectedEmoji}
  value={selectedRatingValue}
  onChange={setRatingValue}
  onClick={(value) => {
    setPreviousLockedValue(selectedRatingValue);
    setSelectedRatingValue(value);
    setHasSelectedRating(true);
    setIsLockingIn(true);
  }}
  size="lg"
  showTooltip={false}
  mobileSlider={true}
  className="w-full"
/>
```

### Review Requirements

- **MUST** enforce minimum review length (configurable, typically 1+ characters)
- **MUST** implement character counter with live updates
- **MUST** use creative, randomized placeholder text
- **MUST** validate review content on submission
- **MUST** show real-time character count: `{count} / {max} characters`

```tsx
// Correct review input pattern
<Textarea
  value={review}
  onChange={handleReviewChange}
  placeholder={getPlaceholderText()}
  rows={4}
  maxLength={MAX_REVIEW_LENGTH}
  className={cn('resize-none', error && 'border-destructive')}
  aria-invalid={!!error}
  aria-describedby={error ? 'review-error' : undefined}
/>
```

## 2. Star Rating Rules

### Legacy Compatibility

- **MUST** provide fallback to star ratings when no emoji ratings exist
- **MUST** maintain backward compatibility with existing star rating data
- **MUST** implement proper migration path from stars to emojis
- **MUST** show star ratings in contexts where emoji ratings aren't available

### Star Rating Display

- **MUST** use consistent star iconography across platform
- **MUST** support partial stars for decimal values
- **MUST** implement proper hover states and interactions
- **MUST** maintain accessibility standards with proper ARIA labels

```tsx
// Correct star rating fallback pattern
{
  emojiRatings.length > 0 ? (
    <EmojiRatingDisplay rating={primaryEmojiRating} />
  ) : starRatings.length > 0 ? (
    <StarRatingDisplay rating={primaryStarRating} />
  ) : (
    <div className="text-muted-foreground text-xs">no ratings yet</div>
  );
}
```

## 3. Rating Display Rules

### Compact Mode Implementation

- **MUST** show primary emoji with rating value and count
- **MUST** use consistent sizing: emoji (text-lg), value (text-sm), count (text-xs)
- **MUST** implement proper hover states with popover details
- **MUST** limit space usage for dense layouts

```tsx
// Correct compact display pattern
<div className="flex items-center gap-2">
  <span className="text-lg">{rating.emoji}</span>
  <div className="flex flex-col">
    <span className="text-sm font-medium">{rating.value.toFixed(1)}</span>
    <span className="text-muted-foreground text-xs">{rating.count}</span>
  </div>
</div>
```

### Expanded Mode Implementation

- **MUST** show full emoji scale visualization with filled/unfilled states
- **MUST** display rating distribution and metadata
- **MUST** implement accordion pattern for ratings lists > 3 items
- **MUST** show "X more" pattern for collapsed items

```tsx
// Correct expanded display with accordion
{
  ratings.slice(0, 3).map((rating) => <RatingItem key={rating.id} />);
}

{
  ratings.length > 3 && (
    <Accordion type="single" collapsible>
      <AccordionItem value="more">
        <AccordionTrigger className="text-muted-foreground text-xs">
          {ratings.length - 3} more
        </AccordionTrigger>
        <AccordionContent>
          {ratings.slice(3).map((rating) => (
            <RatingItem key={rating.id} />
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### Rating Aggregation Rules

- **MUST** calculate accurate average ratings weighted by count
- **MUST** show individual rating counts alongside averages
- **MUST** implement proper rounding for display (1 decimal place)
- **MUST** handle edge cases (no ratings, single rating)

```tsx
// Correct aggregation calculation
const averageRating = React.useMemo(() => {
  if (!ratings.length) return null;
  const totalValue = ratings.reduce((sum, r) => sum + r.value * r.count, 0);
  const totalCount = ratings.reduce((sum, r) => sum + r.count, 0);
  return totalCount > 0 ? totalValue / totalCount : 0;
}, [ratings]);
```

### Animation Requirements

- **MUST** implement staggered entrance animations for rating lists
- **MUST** use mathematical delay calculations: `index * 50ms`
- **MUST** apply proper Tailwind animation classes
- **MUST** respect `prefers-reduced-motion` settings

```tsx
// Correct animation pattern
{
  ratings.map((rating, index) => (
    <div
      key={rating.id}
      style={{ animationDelay: `${index * 50}ms` }}
      className="animate-in fade-in-0 slide-in-from-top-2"
    >
      {rating.emoji}
    </div>
  ));
}
```

## 4. Rating Interaction Rules

### Submission Flow

- **MUST** implement optimistic UI updates for immediate feedback
- **MUST** show loading states during submission with proper spinners
- **MUST** handle success/error states with appropriate toast notifications
- **MUST** reset form state after successful submission

```tsx
// Correct submission pattern
const mutation = useMutation({
  mutationFn: createEmojiRating,
  onMutate: () => {
    // Optimistic update
    setOptimisticRating({ emoji, value, review });
  },
  onSuccess: () => {
    toast.success(`vibe rated ${value} ${emoji}! review submitted.`, {
      duration: 3000,
      icon: emoji,
    });
    setOpen(false);
    resetForm();
  },
  onError: () => {
    // Revert optimistic update
    setOptimisticRating(null);
    setError('Failed to submit rating');
  },
});
```

### Authentication Handling

- **MUST** check user authentication before allowing rating interactions
- **MUST** show `AuthPromptDialog` for unauthenticated users
- **MUST** provide clear messaging about sign-in requirements
- **MUST** implement proper redirect after authentication

```tsx
// Correct auth check pattern
const handleRatingClick = (emoji: string, value?: number) => {
  if (!user?.id) {
    setShowAuthDialog(true);
    return;
  }

  // Proceed with rating flow
  setSelectedEmoji(emoji);
  setShowRatingPopover(true);
};
```

### Validation Rules

- **MUST** prevent self-rating with client and server validation
- **MUST** enforce one rating per emoji per user per vibe
- **MUST** validate rating values within allowed range (1.0-5.0)
- **MUST** provide clear error messages for validation failures

```tsx
// Correct validation patterns
if (vibe.createdById === currentUser.id) {
  return {
    error: 'SELF_RATING',
    message: "You can't rate your own vibe",
  };
}

if (existingRating) {
  return {
    error: 'DUPLICATE_EMOJI',
    message: `You've already rated this vibe with ${emoji}`,
    existingRating,
    confirmOverwrite: true,
  };
}
```

### Review Text Patterns

- **MUST** use creative placeholder text that changes with rating values
- **MUST** implement proper sanitization of review content
- **MUST** support markdown-like formatting in display
- **MUST** validate review length constraints

```tsx
// Correct placeholder generation
const REVIEW_PLACEHOLDERS = [
  'damn why does this deserve {value} {emoji}s',
  'is it actually {value} {emoji}s tho -_-',
  '100% agree {value} {emoji}s',
  'thinking {value} {emoji}s might be overkill. or underkill?',
];

const getPlaceholderText = () => {
  const template = REVIEW_PLACEHOLDERS[placeholderIndex];
  return template
    .replace(/{value}/g, selectedRatingValue.toFixed(1))
    .replace(/{emoji}/g, selectedEmoji || '?');
};
```

## 5. Rating Performance Rules

### Caching Strategies

- **MUST** implement proper query caching with TanStack Query
- **MUST** use appropriate stale times for rating data
- **MUST** invalidate caches on rating mutations
- **MUST** implement optimistic updates for better UX

```tsx
// Correct caching configuration
const { data: topEmojiRatings } = useQuery({
  queryKey: ['emoji-ratings', vibeId],
  queryFn: () => api.emojiRatings.getTopEmojiRatings({ vibeId, limit: 20 }),
  staleTime: 5 * 60 * 1000, // 5 minutes
  enabled: !!vibeId,
});

// Invalidation on mutation
const mutation = useMutation({
  mutationFn: createEmojiRating,
  onSuccess: () => {
    queryClient.invalidateQueries(['emoji-ratings', vibeId]);
    queryClient.invalidateQueries(['most-interacted-emoji', vibeId]);
  },
});
```

### Data Processing Optimization

- **MUST** memoize expensive rating calculations
- **MUST** use proper dependency arrays in useMemo
- **MUST** avoid unnecessary re-computations in render cycles
- **MUST** batch related state updates

```tsx
// Correct memoization pattern
const emojiRatings = React.useMemo(() => {
  if (!topEmojiRatings || topEmojiRatings.length === 0) return [];

  return topEmojiRatings.map((rating) => ({
    emoji: rating.emoji,
    value: rating.averageValue,
    count: rating.count,
    tags: rating.tags,
  }));
}, [topEmojiRatings]);

const primaryEmojiRating = React.useMemo(() => {
  if (ratingDisplayMode === 'top-rated' && topEmojiRatings?.length) {
    return topEmojiRatings.reduce((max, current) =>
      current.averageValue > max.averageValue ? current : max
    );
  }
  return mostInteractedEmojiData;
}, [ratingDisplayMode, topEmojiRatings, mostInteractedEmojiData]);
```

### Loading State Management

- **MUST** show skeleton components during data fetching
- **MUST** handle loading states for each rating operation
- **MUST** provide meaningful loading indicators
- **MUST** prevent multiple simultaneous submissions

```tsx
// Correct loading state pattern
{
  isRatingsLoading ? (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-12 rounded-full" />
        ))}
      </div>
    </div>
  ) : (
    <RatingDisplay ratings={ratings} />
  );
}
```

## Implementation Guidelines

### Component Architecture

- **MUST** use composition pattern for rating components
- **MUST** implement proper separation of concerns
- **MUST** make components reusable across different contexts
- **MUST** follow single responsibility principle

### Type Safety

- **MUST** use strict TypeScript typing for all rating interfaces
- **MUST** define proper props interfaces with JSDoc
- **MUST** implement discriminated unions for rating types
- **MUST** use branded types where appropriate

```tsx
// Correct type definitions
interface EmojiRating {
  _id: Id<'emojiRatings'>;
  vibeId: Id<'vibes'>;
  userId: Id<'users'>;
  emoji: string;
  value: number; // 1.0 to 5.0
  review: string;
  tags?: string[];
  _creationTime: number;
}

interface RatingDisplayProps {
  rating: EmojiRating;
  allRatings?: EmojiRating[];
  onEmojiClick?: (emoji: string, value?: number) => void;
  vibeId: string;
  showScale?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

### Error Handling

- **MUST** implement comprehensive error boundaries
- **MUST** provide user-friendly error messages
- **MUST** log errors for debugging purposes
- **MUST** implement retry mechanisms where appropriate

### Accessibility Requirements

- **MUST** provide proper ARIA labels for all rating interactions
- **MUST** ensure keyboard navigation functionality
- **MUST** maintain proper focus management
- **MUST** support screen readers with descriptive text

```tsx
// Correct accessibility pattern
<button
  onClick={handleRatingClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRatingClick();
    }
  }}
  aria-label={`Rate with ${emoji} - ${value} out of 5 stars`}
  role="button"
  tabIndex={0}
>
  <span className="text-lg" role="img" aria-label={emoji}>
    {emoji}
  </span>
</button>
```

## Testing Requirements

### Unit Testing

- **MUST** test rating calculation logic
- **MUST** test validation rules and error handling
- **MUST** test component state management
- **MUST** mock external dependencies properly

### Integration Testing

- **MUST** test complete rating submission flow
- **MUST** test authentication integration
- **MUST** test error states and recovery
- **MUST** verify cache invalidation

### E2E Testing

- **MUST** test rating interactions across devices
- **MUST** verify mobile and desktop experiences
- **MUST** test accessibility compliance
- **MUST** validate performance requirements

## Debugging Guidelines

### Common Issues

1. **Rating Not Saving**: Check authentication, validation, and network connectivity
2. **Display Issues**: Verify data structure matches component expectations
3. **Performance Problems**: Check for missing memoization and excessive re-renders
4. **Animation Issues**: Ensure proper CSS classes and reduced motion support

### Development Tools

- Use React DevTools for state inspection
- Use network tab to verify API calls
- Use accessibility auditing tools
- Test with slow network conditions

## Future Enhancements

### Planned Features

- Rating like/dislike system for social validation
- Rating comment threading
- Advanced rating analytics and insights
- Rating moderation and reporting

### Extensibility Considerations

- Design for internationalization support
- Plan for additional rating types beyond emojis
- Consider rating aggregation improvements
- Design for advanced filtering and sorting

This documentation establishes the comprehensive framework for rating system implementation in vibechecc. All rating-related features must adhere to these patterns to ensure consistency, performance, and maintainability across the platform.
