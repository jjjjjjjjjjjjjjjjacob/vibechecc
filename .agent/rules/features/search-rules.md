# Search Rules

This document consolidates all search-related patterns and requirements for the vibechecc project. These rules MUST be followed when implementing, maintaining, or extending search functionality.

## 1. Frontend Search Rules

### Command Palette Implementation Requirements

**MUST follow these patterns:**

```typescript
// Command component structure
<Command shouldFilter={false}>
  <CommandInput />
  <CommandList>
    <CommandEmpty>No results found</CommandEmpty>
    <CommandGroup heading="Vibes">
      {/* Results */}
    </CommandGroup>
  </CommandList>
</Command>
```

**MUST use for keyboard navigation:**

- Register global shortcuts at header level using `useState` for dialog state
- Use `cmdk` component behaviors (built into shadcn Command)
- Clean up existing search UI when replacing with command palette

**MUST NOT:**

- Implement custom keyboard navigation (use Command component)
- Create multiple command palette instances

### Debouncing Patterns (Required)

**MUST implement these debouncing standards:**

```typescript
// Main search queries: 300ms
const useDebouncedValue = (value: string, delay: number = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Search suggestions: 150ms (faster feedback)
const debouncedSuggestions = useDebouncedValue(query, 150);
```

**MUST use 300ms** for main search queries to balance responsiveness and performance
**MUST use 150ms** for instant suggestions (command palette, autocomplete)

### Search State Management Standards

**MUST implement this pattern for search hooks:**

```typescript
export function useSearchSuggestions(query: string) {
  const [isLoading, startTransition] = useTransition();
  const [data, setData] = useState<SearchSuggestions | null>(null);

  const fetchSuggestions = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setData(null);
      return;
    }

    startTransition(() => {
      // Fetch logic
    });
  }, []);

  // Auto-fetch when query changes
  useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  return { data, isLoading };
}
```

**MUST include:**

- Loading states with `useTransition`
- Null data for empty queries
- Automatic refetch on query changes

### UI Component Patterns for Search Interfaces

**MUST implement these component structures:**

```typescript
// Result component pattern
interface ResultProps {
  result: SearchResultType;
  onSelect?: () => void;
}

export function Result({ result, onSelect }: ResultProps) {
  const navigate = useNavigate();

  const handleSelect = () => {
    navigate({ to: '/route', params: { id: result.id } });
    onSelect?.();
  };

  return (
    <CommandItem onSelect={handleSelect}>
      {/* Result content */}
    </CommandItem>
  );
}
```

**MUST provide:**

- Error handling components: `<SearchError error={error} onRetry={onRetry} />`
- Loading components: `<SearchLoading itemCount={9} type="grid" />`
- Empty state components

**MUST NOT:**

- Render search results without proper error boundaries
- Skip loading states during search operations

## 2. Backend Search Rules

### Database Indexing Requirements

**MUST prefer indexes over filters:**

```typescript
// Good - using index
const results = await ctx.db
  .query('messages')
  .withIndex('by_channel', (q) => q.eq('channel', channel))
  .collect();

// BAD - using filter (avoid this)
const results = await ctx.db
  .query('messages')
  .filter((q) => q.eq(q.field('channel'), channel))
  .collect();
```

**MUST create meaningful index names:**

- Use descriptive names: `byUser`, `byCount`, `byDateRange`
- Consider compound indexes for multi-field queries
- Export validator types when adding new tables

### Relevance Scoring Implementation Standards

**MUST implement this scoring hierarchy:**

```typescript
const calculateRelevance = (item: any, query: string): number => {
  const text = item.content?.toLowerCase() || '';
  const queryLower = query.toLowerCase();

  // Exact matches (highest score)
  if (text === queryLower) return 100;

  // Contains full query
  if (text.includes(queryLower)) return 80;

  // Contains all words
  const queryWords = queryLower.split(' ');
  if (queryWords.every((word) => text.includes(word))) return 60;

  // Individual word matches
  const matchingWords = queryWords.filter((word) => text.includes(word));
  return (matchingWords.length / queryWords.length) * 40;
};
```

**MUST also implement fuzzy matching:**

- Use Levenshtein distance algorithm for typo tolerance
- Set 0.7 as default similarity threshold
- Use sliding window approach for queries 4+ characters

### Query Optimization Patterns

**MUST limit queries early:**

```typescript
// Limit before processing
const vibes = await ctx.db
  .query('vibes')
  .withIndex('by_creation_time')
  .order('desc')
  .take(500); // MUST limit early

// Break loops when limits reached
for (const item of items) {
  if (results.length >= limit) break;
  // Process item
}
```

**MUST use these performance limits:**

- Vibes: 100-500 items maximum
- Users: 200 items maximum
- Always use `.take()` to prevent full table scans

**MUST batch related data:**

```typescript
// Get related data in batches, not per-item
const userIds = results.map((r) => r.userId);
const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
```

### Search Metrics Tracking Requirements

**MUST use async scheduling for metrics:**

```typescript
// Record metrics without blocking response
ctx.scheduler.runAfter(0, internal.analytics.recordSearchMetric, {
  query,
  resultCount,
  responseTime: Date.now() - startTime,
});
```

**MUST track these metrics:**

- Search queries with result counts
- Search result clicks
- Search errors and failures
- Response times for performance monitoring

## 3. Search Integration Rules

### Convex Query Integration Patterns

**MUST check data existence before effects:**

```typescript
useEffect(() => {
  // MUST check both query and data availability
  if (debouncedQuery.trim() && searchQuery.data) {
    trackSearchMutation.mutate({
      query: debouncedQuery,
      resultCount: searchQuery.data.totalCount || 0,
    });
  }
}, [debouncedQuery, searchQuery.data]);
```

**MUST use `convexQuery` from `@convex-dev/react-query`** for proper integration

### Real-time Search Implementation

**MUST implement real-time updates:**

- Convex queries are reactive by default
- Use proper cache invalidation strategies
- Handle WebSocket connection states

**MUST format API responses for UI:**

```typescript
// Convert API data to UI format
const formatSearchSuggestions = (apiData: any[]): SearchSuggestion[] => {
  return apiData.map((item) => ({
    id: item.id,
    type: 'vibe' as const,
    title: item.content,
    // ... other required fields
  }));
};
```

### Error Handling for Search Failures

**MUST implement comprehensive error handling:**

```typescript
// Component error pattern
if (error) {
  return <SearchError error={error} onRetry={handleRetry} />;
}

// Hook error pattern
const { data, error, isLoading, refetch } = useQuery({
  queryKey: ['search', debouncedQuery],
  queryFn: () => searchFn(debouncedQuery),
  enabled: !!debouncedQuery.trim(),
});

return { data, error, isLoading, refetch };
```

**MUST provide retry functionality** in error states

### Caching Strategies

**MUST implement these cache settings:**

```typescript
const { data } = useQuery({
  queryKey: ['search', query],
  queryFn: () => searchFunction(query),
  gcTime: 15 * 60 * 1000, // 15-minute cache
  staleTime: 5 * 60 * 1000, // 5-minute stale time
  enabled: !!query.trim(),
});
```

**MUST use:**

- 15-minute garbage collection time
- 5-minute stale time for perceived performance
- Conditional enabling based on query presence

## 4. Search Testing Rules

### Mock Function Patterns for Search Tests

**MUST define mocks before vi.mock() calls:**

```typescript
/// <reference lib="dom" />

const mockUseSearchSuggestions = vi.fn();
const mockTrackSearch = vi.fn();

vi.mock('../hooks/use-search', () => ({
  useSearchSuggestions: mockUseSearchSuggestions,
}));

vi.mock('@convex-dev/react-query', () => ({
  convexQuery: vi.fn(),
  convexMutation: vi.fn(() => ({ mutate: mockTrackSearch })),
}));
```

**MUST include in all test files:**

- `/// <reference lib="dom" />` at the top
- `afterEach(cleanup)` for proper cleanup
- Mock external dependencies (Clerk, router, API calls)

### Test Data Requirements for Search

**MUST create comprehensive mock data:**

```typescript
const mockSearchResults: VibeSearchResult[] = [
  {
    id: 'test-id',
    content: 'Test vibe content',
    authorId: 'user-1',
    authorName: 'Test User',
    createdAt: Date.now(),
    tags: ['test', 'mock'],
    averageRating: 4.5,
    totalRatings: 10,
    // MUST include ALL required fields
  },
];
```

**MUST match type definitions exactly** to avoid TypeScript errors

### Testing Search Analytics and Tracking

**MUST test tracking behavior:**

```typescript
it('should track search when query changes', async () => {
  const { rerender } = render(<SearchComponent />);

  // Mock search data
  mockUseSearchSuggestions.mockReturnValue({
    data: mockSearchResults,
    isLoading: false,
  });

  rerender(<SearchComponent query="test query" />);

  await waitFor(() => {
    expect(mockTrackSearch).toHaveBeenCalledWith({
      query: 'test query',
      resultCount: mockSearchResults.length,
    });
  });
});
```

### Performance Testing Standards

**MUST include performance assertions:**

```typescript
it('should complete search within acceptable time', async () => {
  const startTime = Date.now();

  const result = await searchFunction('test query');

  const endTime = Date.now();
  expect(endTime - startTime).toBeLessThan(1000); // 1 second max
});
```

**MUST test with various data sizes** to ensure scalability

## 5. Search Analytics Rules

### Required Metrics Tracking Patterns

**MUST track these events:**

```typescript
// Search performed
await ctx.db.insert('searchMetrics', {
  type: 'search',
  query,
  resultCount,
  userId: identity?.subject,
  timestamp: Date.now(),
  responseTime,
});

// Result clicked
await ctx.db.insert('searchMetrics', {
  type: 'click',
  query,
  resultId,
  resultType: 'vibe' | 'user' | 'tag',
  userId: identity?.subject,
  timestamp: Date.now(),
});

// Search error
await ctx.db.insert('searchMetrics', {
  type: 'error',
  query,
  error: errorMessage,
  userId: identity?.subject,
  timestamp: Date.now(),
});
```

### Search Event Logging Standards

**MUST use async scheduling:**

- Never block search responses for analytics
- Use `ctx.scheduler.runAfter(0, ...)` pattern
- Handle analytics failures gracefully

**MUST include these fields:**

- `type`: 'search' | 'click' | 'error'
- `query`: The search query
- `userId`: Current user ID (if authenticated)
- `timestamp`: Event timestamp
- `resultCount`: Number of results (for searches)
- `responseTime`: Search duration in milliseconds

### Performance Monitoring Requirements

**MUST monitor these metrics:**

```typescript
// Query performance
const startTime = Date.now();
const results = await performSearch(query);
const responseTime = Date.now() - startTime;

// Log if slow
if (responseTime > 2000) {
  console.warn(`Slow search query: ${query} took ${responseTime}ms`);
}
```

**MUST set performance thresholds:**

- Search queries: < 2 seconds
- Suggestions: < 500ms
- Command palette: < 300ms

### Analytics Aggregation Patterns

**MUST provide aggregated metrics queries:**

```typescript
export const getSearchAnalytics = query(async (ctx) => {
  const metrics = await ctx.db
    .query('searchMetrics')
    .withIndex('by_timestamp')
    .collect();

  return {
    totalSearches: metrics.filter((m) => m.type === 'search').length,
    totalClicks: metrics.filter((m) => m.type === 'click').length,
    averageResponseTime: calculateAverage(metrics, 'responseTime'),
    topQueries: calculateTopQueries(metrics),
    errorRate: calculateErrorRate(metrics),
  };
});
```

## Common Pitfalls to Avoid

### Performance Issues

1. **NEVER** fetch all records before filtering
2. **NEVER** use nested queries in loops
3. **NEVER** skip query limits on large datasets
4. **NEVER** block search responses with synchronous analytics

### Implementation Errors

1. **NEVER** parse search operators after fuzzy matching
2. **NEVER** forget mobile responsive design for filters
3. **NEVER** skip loading states in search UI
4. **NEVER** ignore URL length limits with complex filters

### Testing Mistakes

1. **NEVER** assume mock data - check for real Convex integration
2. **NEVER** skip configuration checks in monorepo structure
3. **NEVER** test without proper cleanup
4. **NEVER** ignore authentication mocking in tests

### Type Safety Issues

1. **NEVER** import types from relative paths - use `@vibechecc/types`
2. **NEVER** skip null checks on optional search fields
3. **NEVER** use `.eq('field', undefined)` in index queries
4. **NEVER** assume Convex timestamps are Date objects (they're numbers)

## Future Improvement Guidelines

When extending search functionality, **MUST consider:**

1. **Search Suggestions**: Popular searches, corrections, autocomplete
2. **Search Analytics**: User behavior analysis, query optimization
3. **Saved Searches**: Complex filter combinations, search history
4. **Faceted Search**: Filter counts, refinement suggestions
5. **Advanced Integration**: Elasticsearch, full-text search, semantic search

All new search features **MUST follow these established patterns** and maintain backward compatibility with existing search functionality.
