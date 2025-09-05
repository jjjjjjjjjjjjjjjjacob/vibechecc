# Animation and Performance Patterns

This document outlines the sophisticated animation and performance optimization patterns consistently used throughout the vibechecc codebase. These patterns ensure smooth, accessible, and performant user experiences across all devices and connection types.

## Animation Patterns

### Data Attribute State Management

**Pattern**: Use data attributes to conditionally apply animations based on component state:

```tsx
// Mount state tracking for FOUC prevention
const [hasInitialized, setHasInitialized] = useState(false);

// Apply to elements
<div
  data-has-mounted={hasInitialized}
  className="transition data-[has-mounted=false]:delay-1000 data-[has-mounted=true]:opacity-100"
>
  {/* Content */}
</div>

// Visibility state tracking
<div
  data-show-tabs={tabsInView}
  data-has-mounted={hasInitialized}
  className="transition duration-300 data-[show-tabs=false]:-translate-y-5 data-[show-tabs=false]:opacity-0"
>
```

**When to use**:

- Preventing Flash of Unstyled Content (FOUC)
- Complex state-dependent animations
- Intersection Observer-driven animations

### Mathematical Delay Calculations for Staggered Effects

**Pattern**: Calculate animation delays mathematically for smooth staggered animations:

```tsx
// Simple stagger pattern
{
  items.map((item, index) => (
    <div
      key={item.id}
      style={{ animationDelay: `${index * 0.02}s` }}
      className="animate-stagger-fade-in"
    >
      {item.content}
    </div>
  ));
}

// Complex stagger with base delay
{
  nextSteps.map((step, index) => (
    <div
      key={index}
      style={{ animationDelay: `${0.8 + index * 0.1}s` }}
      className="animate-fadeInLeft"
    >
      {step.content}
    </div>
  ));
}

// Millisecond-based delays for fine control
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

**When to use**:

- Lists and grids that appear sequentially
- Complex UI reveals with multiple elements
- Onboarding flows with step-by-step reveals

### Tailwind Animation Class Combinations

**Pattern**: Combine Tailwind's built-in animation classes with custom keyframes:

```tsx
// Standard Tailwind + custom combinations
<div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">

// State-based animations with data attributes
<div className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">

// Complex multi-directional animations
<div className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
```

**Custom animation classes used**:

- `animate-fade-in-down` - Fade in with downward motion
- `animate-fade-in-up` - Fade in with upward motion
- `animate-emoji-slide-in` - Specialized emoji reveal animation
- `animate-stagger-fade-in` - List item staggered reveal
- `animate-scale-spring` - Gentle scale effect with spring easing

### FOUC Prevention Patterns

**Pattern**: Prevent Flash of Unstyled Content with initialization delays:

```tsx
// Initialize after intersection observer measurement
React.useEffect(() => {
  if (entry && !hasInitialized) {
    setTimeout(() => {
      setHasInitialized(true);
    }, 1000); // Delay initialization
  }
}, [entry, hasInitialized]);

// CSS with initialization delay
.transition.data-[has-mounted=false]:delay-1000
```

**When to use**:

- Components that depend on intersection observers
- Dynamic content loading
- Complex layout calculations

### Mobile-Specific Animation Optimizations

**Pattern**: Reduce animation complexity and duration on mobile devices:

```css
/* Mobile-specific animation optimizations */
@media (max-width: 768px) {
  .animate-accordion-down,
  .animate-accordion-up {
    animation-duration: 0.15s; /* Faster on mobile */
  }

  .animate-emoji-slide-in,
  .animate-emoji-slide-out {
    animation-duration: 0.2s; /* Shorter for mobile responsiveness */
  }

  /* Reduce expensive transforms on mobile */
  .hover\:scale-\[1\.02\]:hover {
    transform: scale(1.01) !important; /* Smaller scale on mobile */
  }
}
```

**When to use**:

- All hover and scale transforms
- Complex animations with multiple steps
- Resource-intensive effects

## Performance Patterns

### GPU Acceleration with `will-change-transform`

**Pattern**: Use `will-change-transform` strategically for hover effects and animations:

```tsx
// Image hover effects
<img
  className="h-full w-full object-cover transition-transform duration-200 will-change-transform hover:scale-[1.02]"
/>

// Card hover effects
<div className="group relative overflow-hidden rounded-lg transition-shadow duration-200 will-change-transform hover:shadow-md">

// Avatar hover effects
<Avatar className="h-6 w-6 shadow-md transition-transform duration-150 will-change-transform hover:scale-[1.05]">
```

**Performance implications**:

- Creates composite layer for smooth animations
- Reduces paint and layout recalculations
- Should be used sparingly to avoid memory overhead

### Memoization Strategies for Data Processing

**Pattern**: Use `useMemo` for expensive calculations and complex data transformations:

```tsx
// Flattening paginated data with proper dependencies
const vibes = React.useMemo(() => {
  if (!data || typeof data !== 'object' || !('pages' in data) || !data.pages)
    return [];
  return (data as { pages: Array<{ vibes?: Vibe[] }> }).pages.flatMap(
    (page) => page?.vibes || []
  );
}, [data]); // Include full data object for proper dependency tracking

// URL parsing with complex logic
const filtersFromUrl = useMemo((): Partial<ExtendedFilters> => {
  if (!syncWithUrl) return defaultFilters;

  const filters: Partial<ExtendedFilters> = {};
  // Complex parsing logic...
  return filters;
}, [search, syncWithUrl, defaultFilters]);

// Column layout calculations
const columnArrays = React.useMemo(() => {
  const arrays: Array<ItemType[]> = Array.from({ length: columns }, () => []);
  items.forEach((item, index) => {
    arrays[index % columns].push(item);
  });
  return arrays;
}, [items, columns]);
```

**When to use**:

- Data transformations on large datasets
- Complex filtering and sorting operations
- Layout calculations that depend on dynamic data

### Conditional Hook Execution for Performance

**Pattern**: Use conditional patterns to optimize query execution:

```tsx
// Conditional query execution
const personalizedFeedQuery = useInfiniteQuery({
  queryKey: ['vibes', 'feed', 'personalized', currentUser?.externalId],
  queryFn: ({ pageParam = 0 }) =>
    api.vibes.getPersonalizedFeed({ cursor: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage?.nextCursor ?? false,
  enabled: !!currentUser && feedTab === 'for-you', // Conditional execution
});

// Connection-aware optimization
const { isSlowConnection, isMobile } = getConnectionInfo();
const shouldLoadHighQuality = !isSlowConnection && !isMobile;
```

**When to use**:

- User-dependent queries
- Tab-based data loading
- Connection-aware features

### Intersection Observer Patterns

**Pattern**: Efficient setup and cleanup for intersection observers:

```tsx
// Intersection observer utility
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
  };

  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
}

// Load more with intersection observer
const loadMore = React.useCallback(() => {
  if (!hasNextPage || isFetchingNextPage) return;
  fetchNextPage();
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```

**When to use**:

- Infinite scroll implementations
- Visibility-based animations
- Lazy loading optimizations

### Connection-Aware Optimizations

**Pattern**: Adapt functionality based on network conditions:

```tsx
// Connection detection
export function getConnectionInfo(): {
  isSlowConnection: boolean;
  isMobile: boolean;
  supportsWebP: boolean;
  supportsAVIF: boolean;
} {
  const connection = (navigator as { connection?: { effectiveType?: string } })
    .connection;

  const isSlowConnection =
    connection?.effectiveType === '2g' ||
    connection?.effectiveType === 'slow-2g';

  // Use connection info to optimize image loading, animation complexity, etc.
}

// Conditional features based on connection
const shouldPreloadImages = !isSlowConnection;
const imageQuality = isSlowConnection ? 'low' : 'high';
```

**When to use**:

- Image loading strategies
- Animation complexity decisions
- Prefetching optimizations

## Accessibility Considerations

### Reduced Motion Support

**Pattern**: Respect user's motion preferences:

```css
/* Responsive animation controls */
@media (prefers-reduced-motion: reduce) {
  .animate-accordion-down,
  .animate-fade-in-down,
  .animate-emoji-slide-in,
  .animate-stagger-fade-in {
    animation: none !important;
    transition: none !important;
  }

  /* Keep opacity transitions for accessibility */
  .animate-fade-in-down {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

**When to use**:

- All decorative animations
- Complex motion effects
- Ensure functionality remains with static fallbacks

## Implementation Guidelines

### Best Practices

1. **Always provide reduced motion fallbacks** - Ensure core functionality works without animations
2. **Use mathematical delays** - Calculate animation delays programmatically for consistent timing
3. **Prefer data attributes** - Use data attributes over CSS classes for complex state-dependent animations
4. **Memoize expensive calculations** - Use `useMemo` and `useCallback` for performance-critical operations
5. **Apply `will-change-transform` strategically** - Only use on elements that will definitely animate
6. **Test on mobile devices** - Verify performance optimizations work on lower-powered devices
7. **Monitor bundle size** - Animation libraries can impact bundle size significantly

### Performance Monitoring

- Use React DevTools Profiler for component render analysis
- Monitor Core Web Vitals, especially Cumulative Layout Shift (CLS)
- Test on various network conditions and device types
- Measure animation frame rates during complex sequences

### Debugging Tips

- Use browser DevTools to inspect composite layers
- Check for unnecessary repaints with paint flashing
- Profile animation performance during development
- Test intersection observer behavior with network throttling

This documentation serves as a reference for maintaining the sophisticated animation system and performance optimizations found throughout vibechecc. Always prioritize accessibility and performance when implementing new animations or interactions.
