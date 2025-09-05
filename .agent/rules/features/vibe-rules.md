# Vibe Rules - Core Implementation Patterns

This document defines the mandatory patterns and rules for implementing vibe-related features across the vibechecc platform. These rules ensure consistency, performance, and maintainability in all vibe components.

## 1. Vibe Creation Rules

### Form Patterns

- **MUST** use React Hook Form with Zod validation for all vibe creation forms
- **MUST** validate required fields: `title`, `description`, `category`
- **MUST** enforce character limits: title (100 chars), description (5000 chars)
- **MUST** sanitize user input before submission
- **MUST** show real-time validation feedback inline

```tsx
// Correct validation pattern
const vibeSchema = z.object({
  title: z
    .string()
    .min(1, 'title is required')
    .max(100, 'title must be under 100 characters'),
  description: z
    .string()
    .min(10, 'description must be at least 10 characters')
    .max(5000, 'description must be under 5000 characters'),
  category: z.string().min(1, 'category is required'),
  tags: z.array(z.string()).max(10, 'maximum 10 tags allowed'),
});
```

### Media Handling Rules

- **MUST** use `useVibeImageUrl` hook for consistent image URL resolution
- **MUST** provide fallback to `SimpleVibePlaceholder` for missing/broken images
- **MUST** implement lazy loading for all images: `loading="lazy"`
- **MUST** include proper alt text: `alt={vibe.title}`
- **MUST** prevent layout shift with proper aspect ratios

```tsx
// Correct image handling pattern
const { data: imageUrl, isLoading: isImageLoading } = useVibeImageUrl(
  vibe || {}
);
const usePlaceholder = !imageUrl || imageError || isImageLoading;

{
  usePlaceholder ? (
    <SimpleVibePlaceholder title={vibe.title} className="h-full w-full" />
  ) : (
    <img
      src={imageUrl}
      alt={vibe.title}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-200 will-change-transform hover:scale-[1.02]"
      onError={() => setImageError(true)}
    />
  );
}
```

### Error Handling

- **MUST** implement optimistic UI updates for vibe creation
- **MUST** show toast notifications for success/error states
- **MUST** handle network errors gracefully with retry options
- **MUST NOT** leave users in broken states - always provide recovery paths

## 2. Vibe Display Rules

### Component Variants

- **MUST** support all standardized variants: `default`, `compact`, `feed-grid`, `feed-masonry`, `feed-single`, `list`, `search-result`
- **MUST** use proper aspect ratios per variant:
  - `feed-single`: `sm:aspect-video`
  - `feed-masonry` & `feed-grid`: `aspect-[3/4]`
  - `compact`: `aspect-[4/3]`
  - `list`: `h-24 sm:h-28`
- **MUST** implement responsive behavior for mobile/desktop

```tsx
// Correct variant aspect ratio mapping
const getAspectRatio = (variant: VibeCardVariant, usePlaceholder: boolean) => {
  if (usePlaceholder) {
    switch (variant) {
      case 'feed-masonry':
        return 'aspect-[4/3]';
      case 'compact':
        return 'aspect-[4/3]';
      default:
        return 'aspect-video';
    }
  }
  switch (variant) {
    case 'feed-single':
      return 'sm:aspect-video';
    case 'feed-masonry':
    case 'feed-grid':
      return 'aspect-[3/4]';
    case 'compact':
      return 'aspect-[4/3]';
    default:
      return 'aspect-video';
  }
};
```

### Performance Requirements

- **MUST** use `will-change-transform` for hover effects
- **MUST** implement proper memoization with `React.useMemo` for expensive calculations
- **MUST** lazy load images outside viewport
- **MUST** use proper React keys for list items
- **SHOULD** implement virtualization for lists > 50 items

### Loading States

- **MUST** provide skeleton components matching actual content structure
- **MUST** use `Skeleton` component from shadcn/ui
- **MUST** match skeleton dimensions to actual content
- **MUST** animate skeleton appearances with proper delays

```tsx
// Correct skeleton pattern
const VibeSkeleton = ({ variant }: { variant: VibeCardVariant }) => (
  <Card className="bg-popover/20 border-border/50 relative overflow-hidden">
    <div className="absolute top-2 left-2 z-10">
      <Skeleton className="h-6 w-6 rounded-full" />
    </div>
    <Skeleton className={cn('w-full', getAspectRatio(variant, true))} />
    <CardContent className="p-4">
      <Skeleton className="mb-2 h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </CardContent>
  </Card>
);
```

### Theme Integration

- **MUST** use semantic and theme colors exclusively
- **MUST NOT** use hardcoded colors (no `bg-pink-500`, `text-blue-600`)
- **MUST** use themed gradients: `from-theme-primary to-theme-secondary`
- **MUST** support light/dark theme switching seamlessly

```tsx
// Correct theme color usage
<div className="bg-theme-primary/10 shadow-theme-primary/10 transition-all">
  <Avatar className="border-theme-primary bg-background/50" />
  <Badge className="bg-muted text-muted-foreground hover:bg-secondary/80" />
</div>
```

## 3. Vibe Feed Rules

### Infinite Scroll Implementation

- **MUST** use `useInfiniteQuery` with proper cursor-based pagination
- **MUST** implement intersection observer for load triggers
- **MUST** use `react-intersection-observer` library for consistency
- **MUST** handle loading states, errors, and empty states
- **MUST** prevent duplicate requests with proper enabled flags

```tsx
// Correct infinite query pattern
const {
  data,
  fetchNextPage,
  hasNextPage,
  isLoading,
  isFetchingNextPage,
  error,
} = useInfiniteQuery({
  queryKey: ['vibes', ...filters],
  queryFn: ({ pageParam }) =>
    api.vibes.search({ cursor: pageParam, ...filters }),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage) => lastPage?.nextCursor ?? false,
  enabled: isActive && !!user, // Conditional execution
});
```

### Masonry Layout Rules

- **MUST** use `MasonryFeed` component for grid layouts
- **MUST** apply `break-inside-avoid` for masonry items
- **MUST** calculate column layouts with proper memoization
- **MUST** handle responsive breakpoints: mobile (1 col), tablet (2 cols), desktop (3+ cols)

```tsx
// Correct masonry calculation
const columnArrays = React.useMemo(() => {
  const arrays: Array<Vibe[]> = Array.from({ length: columns }, () => []);
  vibes.forEach((vibe, index) => {
    arrays[index % columns].push(vibe);
  });
  return arrays;
}, [vibes, columns]);
```

### Empty State Rules

- **MUST** provide contextual empty states per feed type
- **MUST** include clear call-to-action buttons
- **MUST** use themed gradients and semantic colors
- **MUST** implement progressive empty states based on user state

```tsx
// Correct empty state structure
<div className="py-12 text-center">
  <div className="from-theme-primary to-theme-secondary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r">
    <Icon className="text-primary-foreground h-8 w-8" />
  </div>
  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
  <p className="text-muted-foreground mb-6">{description}</p>
  {action && <div>{action}</div>}
</div>
```

### Data Processing Rules

- **MUST** flatten paginated data with proper null checks
- **MUST** memoize data transformations to prevent unnecessary recalculations
- **MUST** handle type safety with proper TypeScript patterns

```tsx
// Correct data flattening pattern
const vibes = React.useMemo(() => {
  if (!data?.pages) return [];
  return data.pages.flatMap((page: any) => page?.vibes || []);
}, [data]);
```

## 4. Vibe Interaction Rules

### Rating Integration

- **MUST** use `EmojiRatingCycleDisplay` for vibes without ratings
- **MUST** use `EmojiRatingDisplayPopover` for vibes with existing ratings
- **MUST** implement proper authentication checks before rating
- **MUST** prevent self-rating with backend validation
- **MUST** show `AuthPromptDialog` for unauthenticated users

```tsx
// Correct rating display pattern
{
  primaryEmojiRating ? (
    <EmojiRatingDisplayPopover
      rating={primaryEmojiRating}
      allRatings={emojiRatings}
      onEmojiClick={handleEmojiRatingClick}
      vibeId={vibe.id}
      showScale={variant !== 'compact'}
      size={variant === 'compact' ? 'sm' : 'md'}
    />
  ) : (
    <EmojiRatingCycleDisplay
      onSubmit={handleEmojiRating}
      isSubmitting={mutation.isPending}
      vibeTitle={vibe.title}
      emojiMetadata={emojiMetadataRecord}
      showBeTheFirst={emojiRatings.length === 0}
      delay={delay}
    />
  );
}
```

### Share Functionality

- **MUST** integrate `ShareButton` component with proper props
- **MUST** pass complete vibe data, author info, and ratings
- **MUST** track sharing events with analytics
- **MUST** support multiple share formats (text, image)

```tsx
// Correct share button integration
<ShareButton
  contentType="vibe"
  variant="ghost"
  size="sm"
  showCount={vibe.shareCount ? true : false}
  currentShareCount={vibe.shareCount}
  vibe={vibe}
  author={vibe.createdBy || undefined}
  ratings={
    topEmojiRatings?.map((r) => ({
      emoji: r.emoji,
      value: r.averageValue,
      tags: r.tags || [],
      count: r.count,
    })) || undefined
  }
/>
```

### Navigation Patterns

- **MUST** use TanStack Router for all navigation
- **MUST** implement proper onClick handlers with event prevention
- **MUST** track navigation events: `trackEvents.vibeViewed(vibe.id)`
- **MUST** handle nested link interactions properly

```tsx
// Correct navigation pattern
<Link
  to="/vibes/$vibeId"
  params={{ vibeId: vibe.id }}
  onClick={() => trackEvents.vibeViewed(vibe.id)}
  className="block"
>
  {/* Content */}
</Link>
```

## 5. Vibe Media Rules

### Image Optimization

- **MUST** use proper loading strategies: lazy loading for below-fold images
- **MUST** implement proper error handling with `onError` callbacks
- **MUST** provide consistent fallback experiences
- **MUST** maintain aspect ratios to prevent layout shift

### Responsive Images

- **MUST** serve appropriate image sizes per device/viewport
- **MUST** use modern formats (WebP, AVIF) when supported
- **MUST** implement proper srcset for high-DPI displays
- **SHOULD** use connection-aware loading strategies

### Accessibility Requirements

- **MUST** provide meaningful alt text for all images
- **MUST** implement proper focus management for interactive elements
- **MUST** ensure keyboard navigation works throughout components
- **MUST** maintain WCAG 2.1 AA compliance

```tsx
// Correct accessibility pattern
<img
  src={imageUrl}
  alt={vibe.title}
  className="h-full w-full object-cover"
  onError={() => setImageError(true)}
  tabIndex={-1} // Non-interactive image
/>

<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label={`Rate ${vibe.title} with emoji`}
>
  Rate this vibe
</button>
```

## Implementation Guidelines

### Performance Standards

- **MUST** achieve < 100ms interaction delays
- **MUST** prevent layout shifts (CLS < 0.1)
- **MUST** optimize bundle size (no unnecessary dependencies)
- **MUST** implement proper caching strategies

### Error Boundaries

- **MUST** implement error boundaries around vibe components
- **MUST** provide graceful error recovery mechanisms
- **MUST** log errors for debugging while showing user-friendly messages

### Testing Requirements

- **MUST** test all vibe variants with proper component testing
- **MUST** test error states and loading states
- **MUST** verify accessibility compliance
- **MUST** test interaction flows end-to-end

### Code Quality

- **MUST** use TypeScript with strict mode enabled
- **MUST** implement proper prop validation with interfaces
- **MUST** follow established naming conventions (kebab-case files, camelCase functions)
- **MUST** document complex business logic with clear comments

## Debugging and Troubleshooting

### Common Issues

1. **Image Loading Problems**: Always check `useVibeImageUrl` hook integration
2. **Layout Shifts**: Verify aspect ratios are set correctly
3. **Performance Issues**: Check for unnecessary re-renders and missing memoization
4. **Rating Issues**: Ensure proper authentication checks and error handling

### Development Tools

- Use React DevTools Profiler for performance analysis
- Use browser DevTools for layout debugging
- Use network throttling to test loading states
- Test across multiple devices and screen sizes

## Future Considerations

### Extensibility

- All components should be extensible through props
- Avoid hardcoding business logic - make it configurable
- Design for theme customization and localization

### Scalability

- Components should handle large datasets efficiently
- Implement proper virtualization for performance
- Consider edge cases and error scenarios
- Plan for feature evolution and backwards compatibility

This documentation serves as the definitive guide for vibe-related development in vibechecc. All new implementations must conform to these patterns, and existing code should be migrated to follow these standards during refactoring efforts.
