# Web Development Learnings - vibechecc

This document captures learnings, patterns, and best practices discovered during web development tasks in the vibechecc project.

## Personalized Feed Enhancement Patterns

### Context

Enhanced the home feed UI to provide better personalized experience using newly implemented personalized feed backend functions, including empty states and follow suggestions.

### Key Patterns Discovered

#### 1. Custom Empty State Handling

**Pattern**: Conditional rendering of custom empty states vs default MasonryFeed empty states

```typescript
const shouldUseCustomEmptyState = activeTab === 'for-you' && vibes.length === 0 && !isLoading;

{shouldUseCustomEmptyState ? (
  <ForYouEmptyState />
) : (
  <MasonryFeed
    // ... other props
    emptyStateAction={activeTab === 'for-you' ? null : queryConfig.emptyAction}
  />
)}
```

**Why**: Allows for rich, contextual empty states while maintaining default behavior for other feed types.

#### 2. Follow Stats Integration for Dynamic UX

**Pattern**: Use follow stats to determine user onboarding state and customize messaging

```typescript
const { data: followStats } = useCurrentUserFollowStats();
const hasFollows = followStats.following > 0;

// Dynamic tab descriptions based on follow state
description: followStats?.following > 0
  ? `personalized vibes from ${followStats.following} ${followStats.following === 1 ? 'person' : 'people'} you follow`
  : 'discover and follow people to see personalized content';
```

**Why**: Provides contextual messaging that helps users understand the value proposition of following others.

#### 3. Progressive Empty State Design

**Pattern**: Different empty states for different user journey stages

- New users (no follows): Onboarding-focused with follow suggestions
- Existing users (has follows): Activity-focused encouraging content creation

**Implementation**: Single component with conditional rendering based on follow stats.

#### 4. Smooth User Onboarding with Follow Suggestions

**Pattern**: Integrate existing components (`CompactSuggestedFollows`) into empty states

```typescript
<CompactSuggestedFollows
  limit={4}
  showMutualConnections={false}
/>
```

**Why**: Reuses tested components while providing contextual user guidance.

### Component Architecture Insights

#### 1. Feed Tab Configuration Pattern

**Current Pattern**: Array-based tab configuration with dynamic descriptions

```typescript
const feedTabs = [
  {
    id: 'for-you' as const,
    label: 'for you',
    icon: <Sparkles className="h-4 w-4" />,
    description: followStats?.following > 0
      ? `personalized vibes from ${followStats.following} people you follow`
      : 'discover and follow people to see personalized content',
    requiresAuth: true,
  },
  // ... other tabs
];
```

**Benefits**:

- Centralized tab configuration
- Dynamic descriptions based on user state
- Type-safe tab IDs with const assertions

#### 2. Query Handling for Different Feed Types

**Pattern**: Conditional query usage with proper TypeScript handling

```typescript
const personalizedFeedQuery = useForYouFeedInfinite({
  enabled: queryConfig.enabled && activeTab === 'for-you',
  queryKeyPrefix: ['home-feed', 'for-you'],
});

const generalFeedQuery = useVibesInfinite(queryConfig.filters, {
  enabled: queryConfig.enabled && activeTab !== 'for-you',
  queryKeyPrefix: ['home-feed'],
  queryKeyName: activeTab,
});

const {data, ...} = activeTab === 'for-you' ? personalizedFeedQuery : generalFeedQuery;
```

**TypeScript Consideration**: Infinite query data structure requires careful type handling:

```typescript
const vibes = React.useMemo(() => {
  if (!data?.pages) return [];
  return data.pages.flatMap((page: any) => page?.vibes || []);
}, [data]);
```

### UI/UX Design Patterns

#### 1. Themed Empty State Design

**Pattern**: Consistent theming with gradient backgrounds and themed colors

```typescript
<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-theme-primary to-theme-secondary">
  <Users className="text-primary-foreground h-8 w-8" />
</div>
```

**Benefits**: Maintains visual consistency with the app's custom theming system.

#### 2. Progressive Information Architecture

**Hierarchy for new user onboarding**:

1. Clear value proposition (what is "for you" feed)
2. Feature highlights (badges with benefits)
3. Primary action (find people to follow)
4. Alternative actions (explore other content)
5. Follow suggestions (actual users to follow)
6. Additional help (learn more about the platform)

#### 3. Smooth Interaction Patterns

**Pattern**: Scroll-to-element on button click for better UX flow

```typescript
<Button onClick={() => {
  const suggestionsElement = document.querySelector('[data-suggestions]');
  suggestionsElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}}>
  find people to follow
</Button>
```

### Performance Considerations

#### 1. Conditional Hook Execution

**Pattern**: Enable/disable queries based on active state to prevent unnecessary requests

```typescript
const personalizedFeedQuery = useForYouFeedInfinite({
  enabled: queryConfig.enabled && activeTab === 'for-you',
});
```

#### 2. Memoized Data Processing

**Pattern**: Use React.useMemo for data transformation to prevent unnecessary recalculations

```typescript
const vibes = React.useMemo(() => {
  if (!data?.pages) return [];
  return data.pages.flatMap((page: any) => page?.vibes || []);
}, [data]);
```

### Integration Patterns

#### 1. Cross-Feature Component Reuse

**Pattern**: Import and use components from feature directories in shared components

```typescript
import { CompactSuggestedFollows } from '@/features/follows/components/suggested-follows';
import { useCurrentUserFollowStats } from '@/features/follows/hooks/use-follow-stats';
```

**Benefits**: Promotes code reuse while maintaining feature boundaries.

#### 2. Hook Composition for Complex State

**Pattern**: Combine multiple hooks to build complex UI logic

```typescript
const { user } = useUser(); // Auth state
const { data: followStats } = useCurrentUserFollowStats(); // Follow stats
const personalizedFeedQuery = useForYouFeedInfinite(...); // Data fetching
```

### Debugging and Development Insights

#### 1. TypeScript with Infinite Queries

**Issue**: Infinite query return types can be complex and require careful handling
**Solution**: Use optional chaining and type guards:

```typescript
if (!data?.pages) return [];
return data.pages.flatMap((page: any) => page?.vibes || []);
```

#### 2. Development Server Testing

**Pattern**: Use `bun run dev:frontend` to test compilation and basic functionality
**Note**: Full TypeScript checking across the monorepo can be noisy - focus on specific workspace testing for development.

### Future Enhancements

#### Opportunities Identified

1. **Follow Suggestions Enhancement**: Could add user activity indicators or vibe previews
2. **Personalized Content Hints**: Show preview of what personalized feed would look like
3. **Onboarding Flow**: Could create a dedicated onboarding sequence for new users
4. **Analytics Integration**: Track conversion from empty state to follow actions

### Best Practices Established

1. **Always check follow stats** when designing personalized features
2. **Use conditional empty states** for better user experience
3. **Integrate existing components** rather than recreating functionality
4. **Provide clear value propositions** in empty states
5. **Use smooth transitions** and interactions for better UX
6. **Maintain theming consistency** across all custom components
7. **Test compilation early** to catch TypeScript issues
8. **CRITICAL: Always pass empty object `{}` to convexQuery for queries with no parameters** - prevents "undefined is not a valid Convex value" errors

## Notification System Implementation Patterns

### Context

Implemented a complete notification UI system including dropdown, filters, infinite scroll, and responsive mobile/desktop behavior using the existing backend notification system.

### Key Patterns Discovered

#### 1. Backend Type Integration

**Pattern**: Always check backend types before implementing frontend components

```typescript
// Check the actual Notification interface from types package
export interface Notification {
  _id?: string;
  userId: string;
  type: 'follow' | 'rating' | 'new_vibe' | 'new_rating';
  triggerUserId: string;
  targetId: string;
  title: string;
  description: string;
  metadata?: any;
  read: boolean; // NOT isRead!
  createdAt: number;
  _creationTime?: number;
  triggerUser?: User; // NOT fromUser!
}
```

**Why**: Prevents TypeScript errors and ensures proper data access patterns.

#### 2. Infinite Query Pattern for Notifications

**Pattern**: Use proper response property names in infinite queries

```typescript
// CORRECT: Use nextCursor, not continueCursor
getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,

// CORRECT: Handle 'all' filter by passing undefined
type: filter === 'all' ? undefined : filter,
```

#### 3. Mobile-First Notification Dropdown

**Pattern**: Use conditional rendering for mobile drawer vs desktop dropdown

```typescript
if (isMobile) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh]">
        {content}
      </DrawerContent>
    </Drawer>
  );
}

return (
  <DropdownMenu open={open} onOpenChange={onOpenChange}>
    <DropdownMenuContent className="w-96 p-0" align="end">
      <div className="h-96">{content}</div>
    </DropdownMenuContent>
  </DropdownMenu>
);
```

#### 4. Header Integration Pattern

**Pattern**: Add notification state to existing mobile nav state management

```typescript
type MobileNavState = 'nav' | 'profile' | 'search' | 'notifications' | null;

// Handle notifications in existing escape key handler
if (
  event.key === 'Escape' &&
  mobileNavState &&
  mobileNavState !== 'search' &&
  mobileNavState !== 'notifications'
) {
  setMobileNavState(null);
}
```

#### 5. Filter System with LocalStorage Persistence

**Pattern**: Cache user's filter preference across sessions

```typescript
useEffect(() => {
  const savedFilter = localStorage.getItem('vibechecc-notification-filter');
  if (savedFilter && filterOptions.includes(savedFilter)) {
    setActiveFilter(savedFilter as NotificationFilterType);
  }
}, []);

useEffect(() => {
  localStorage.setItem('vibechecc-notification-filter', activeFilter);
}, [activeFilter]);
```

#### 6. Notification Badge Implementation

**Pattern**: Themed notification count badge with proper positioning

```typescript
<div className="relative">
  <Bell className="h-4 w-4" />
  {unreadCount && unreadCount > 0 && (
    <span className="bg-theme-primary text-primary-foreground absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-medium">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</div>
```

### Component Architecture Insights

#### 1. Empty State Contextual Design

**Pattern**: Different empty states per filter category with contextual actions

```typescript
const getEmptyStateContent = () => {
  switch (filter) {
    case 'likes':
      return {
        icon: Heart,
        title: 'no likes yet',
        description: "when someone rates your vibes, you'll see them here",
        action: 'share a vibe',
        href: '/',
      };
    // ... other cases
  }
};
```

#### 2. Notification Item Dynamic Content

**Pattern**: Switch statement for different notification types with dynamic icons and text

```typescript
switch (notification.type) {
  case 'rating':
    return {
      icon: notification.metadata?.emoji ? (
        <span className="text-lg">{notification.metadata.emoji}</span>
      ) : <Heart className="h-4 w-4" />,
      text: `${userName} ${notification.metadata?.emoji ? 'reacted to' : 'liked'} your vibe`,
      actionText: 'see rating',
      href: `/vibes/${notification.targetId}`,
    };
  // ... other cases
}
```

#### 3. Intersection Observer for Infinite Scroll

**Pattern**: Use react-intersection-observer for efficient infinite loading

```typescript
const { ref: loadMoreRef, inView } = useInView();

useEffect(() => {
  if (inView && notificationQuery.hasNextPage && !notificationQuery.isFetchingNextPage) {
    notificationQuery.fetchNextPage();
  }
}, [inView, notificationQuery]);

// In render
<div ref={loadMoreRef} className="flex items-center justify-center py-4">
  {notificationQuery.isFetchingNextPage ? (
    <div className="text-muted-foreground text-sm">loading more...</div>
  ) : (
    <Button onClick={() => notificationQuery.fetchNextPage()}>
      load more
    </Button>
  )}
</div>
```

### Dependency Management

#### 1. Required Dependencies

**Pattern**: Install needed packages for advanced UI patterns

```bash
bun add react-intersection-observer
```

**Benefits**: Provides efficient intersection observation for infinite scroll without implementing custom scroll listeners.

### TypeScript Considerations

#### 1. Convex ID Type Handling

**Pattern**: Use type assertion for Convex ID compatibility

```typescript
// CORRECT: Handle the ID type mismatch gracefully
if (!notification.read && notification._id) {
  markAsReadMutation.mutate({ notificationId: notification._id as any });
}
```

#### 2. Backend Response Property Mapping

**Pattern**: Always verify backend response structure before implementation

- `continueCursor` vs `nextCursor`
- `isRead` vs `read`
- `fromUser` vs `triggerUser`

### Performance Optimizations

#### 1. Conditional Query Execution

**Pattern**: Only fetch notifications when dropdown is open

```typescript
const notificationQuery = useNotificationsInfinite(
  FILTER_TYPE_MAP[activeFilter],
  { enabled: open } // Only run when dropdown is open
);
```

#### 2. Memoized Data Processing

**Pattern**: Flatten infinite query pages with useMemo

```typescript
const notifications = React.useMemo(() => {
  if (!notificationQuery.data?.pages) return [];
  return notificationQuery.data.pages.flatMap(
    (page: any) => page?.notifications || []
  );
}, [notificationQuery.data]);
```

### Theming Integration

#### 1. Consistent Theme Color Usage

**Pattern**: Use theme-primary for notification badges and unread indicators

```typescript
// Badge
<span className="bg-theme-primary text-primary-foreground">
  {unreadCount > 9 ? '9+' : unreadCount}
</span>

// Unread dot
<div className="bg-theme-primary h-2 w-2 rounded-full"></div>
```

### Responsive Design

#### 1. Screen Size Detection

**Pattern**: Use window resize listener for mobile/desktop detection

```typescript
useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

### Future Enhancement Opportunities

1. **Real-time Updates**: Could integrate WebSocket or polling for live notification updates
2. **Notification Grouping**: Group similar notifications (e.g., "John and 3 others liked your vibe")
3. **Push Notifications**: Browser notification API integration
4. **Notification Preferences**: User settings for notification types
5. **Rich Previews**: Show vibe thumbnails or user avatars in notifications

### Debugging Tips

1. **Backend Type Mismatches**: Always check the actual types from @vibechecc/types package
2. **Infinite Query Issues**: Verify the response structure matches expected pagination format
3. **Mobile Testing**: Use browser dev tools responsive mode to test drawer behavior
4. **Query Invalidation**: Ensure mutations properly invalidate notification queries for real-time updates

### Applicable Situations

- **Personalized Content Features**: When building features that depend on user relationships
- **Empty State Design**: When creating engaging empty states for social features
- **User Onboarding**: When designing first-time user experiences
- **Feed Systems**: When working with infinite scroll feeds and custom content states
- **Follow/Social Features**: When integrating follow system with other features

## TanStack Router beforeLoad Redirect Patterns

### Context

Working with TanStack Router's `beforeLoad` function to handle data-driven redirects, particularly for rating routes that redirect to vibe pages with anchors.

### Critical Issue: Try-Catch Blocks Break Redirects

**Problem**: When using `throw redirect()` inside a try-catch block in TanStack Router's `beforeLoad` function, the redirect gets caught as an error and triggers the catch block instead of performing the redirect.

**Root Cause**: TanStack Router redirects work by throwing special redirect objects that are caught by the router. Wrapping them in try-catch prevents the router from receiving them.

**Example - Wrong**:

```typescript
beforeLoad: async ({ params, context }) => {
  try {
    const data = await context.convexClient.query(api.something.get, { id });
    if (!data) {
      throw redirect({ to: '/' }); // Gets caught by catch block!
    }
    throw redirect({ to: `/somewhere/${data.id}` }); // Gets caught by catch block!
  } catch (error) {
    // Redirect ends up here instead of working
    throw redirect({ to: '/', search: { error: 'Failed' } });
  }
};
```

**Example - Correct**:

```typescript
beforeLoad: async ({ params, context }) => {
  const data = await context.convexClient.query(api.something.get, { id });

  if (!data?.expectedField) {
    throw redirect({ to: '/', search: { error: 'Not found' } });
  }

  throw redirect({ to: `/somewhere/${data.id}` });
};
```

### Best Practices for beforeLoad Redirects

1. **Avoid try-catch around redirects**: Let query errors bubble up naturally or handle them without try-catch
2. **Use optional chaining**: Check for required fields with `data?.field` instead of relying on try-catch
3. **Handle API errors at the query level**: Use Convex error handling patterns instead of wrapping in try-catch
4. **Test redirects carefully**: Always verify that redirects actually work, especially when refactoring

### Applicable Situations

- **Data-driven redirects**: Routes that fetch data and redirect based on results
- **Rating/comment permalink routes**: Routes that redirect to parent content with anchors
- **Authentication redirects**: Routes that check auth state and redirect accordingly
- **Legacy URL handling**: Routes that convert old URLs to new formats

## Code Standards Enforcement Patterns

### Context

Performed comprehensive code standards and style guide compliance enforcement across the vibechecc codebase as part of Phase 1 Workstream B multi-agent execution, including theme color standardization, file naming conventions, and import pattern corrections.

### Key Tasks Completed

#### 1. Theme Color Standardization (P0)

**Problem**: Widespread use of hardcoded Tailwind colors (`bg-pink-500`, `text-blue-600`, `border-purple-500`) throughout the codebase, preventing proper theme customization and creating visual inconsistencies.

**Solution Pattern**: Systematic replacement with semantic and theme colors using grep-based search and targeted replacements.

**Search Strategy**:

```bash
# Find hardcoded colors
rg "(bg-|text-|border-)(red|blue|green|yellow|purple|pink|orange|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)(-\d+)?" apps/web/src --type tsx --type ts

# Find hex colors
rg "#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})" apps/web/src --type tsx --type ts
```

**Replacement Patterns**:

- **Status colors**: Use semantic tokens (`text-destructive`, `text-green-600 dark:text-green-400`)
- **Brand colors**: Use theme tokens (`bg-theme-primary`, `border-theme-secondary`)
- **UI colors**: Use semantic tokens (`bg-muted`, `text-muted-foreground`)
- **Interactive states**: Use semantic tokens (`hover:bg-muted/50`)

**Special Cases Found**:

```typescript
// Generated color placeholders - kept hardcoded for algorithm functionality
const getBgClass = () => {
  switch (colorIndex) {
    case 0:
      return isDark
        ? 'bg-gradient-to-br from-pink-500 to-rose-400'
        : 'bg-gradient-to-br from-pink-300 to-rose-200';
    // ... continues for algorithmic color generation
  }
};
```

#### 2. File Naming Convention Enforcement (P0)

**Problem**: Files not following kebab-case naming convention required by the style guide.

**Search Strategy**:

```bash
# Find non-kebab-case files
find apps/web/src -name "*.tsx" -o -name "*.ts" | grep -E "[A-Z]|_"
```

**Files Renamed**:

- `IconLink.tsx` → `icon-link.tsx` (PascalCase to kebab-case)
- `useOfflineIndicator.tsx` → `use-offline-indicator.tsx` (camelCase to kebab-case)

**Important Discovery**: TanStack Router files like `$vibeId.tsx` correctly use dollar prefix for route parameters and should not be renamed.

#### 3. Import Pattern Standardization (Critical Fix)

**Problem**: Incorrect workspace imports using non-existent `@/types` instead of correct `@vibechecc/types`.

**Discovery**: 15 files were using `@/types` which pointed to a non-existent local types directory instead of the workspace package.

**Fix Applied**:

```bash
find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/@\/types/@vibechecc\/types/g'
```

**Type Compatibility Issue**: Found mismatch between UI component expectations and shared types:

- UI component expected `EmojiReaction` interface with `users` property
- Shared types only had `EmojiRating` without `users` property
- **Solution**: Created local interface definition for UI-specific needs

#### 4. Quality Check Enforcement

**Critical Lint Errors Fixed**:

1. **Unused variable**: Removed unused `resolvedTheme` from `star-rating.tsx`
2. **Duplicate imports**: Consolidated type imports in `search-results-list.tsx`

**Final Results**:

- ✅ TypeScript compilation: All projects successful
- ✅ Tests: All 336 tests passing
- ✅ Formatting: All files properly formatted
- ✅ Linting: 0 errors, 13 warnings (acceptable - mostly console.log statements)

### Patterns Discovered

#### 1. Theme Color Migration Strategy

**Systematic Approach**:

1. Search for all instances of hardcoded colors
2. Categorize by purpose (status, brand, UI, interactive)
3. Replace with appropriate semantic/theme tokens
4. Verify visual consistency after changes

**Color Mapping Established**:

```typescript
// Status colors
'text-green-500' → 'text-green-600 dark:text-green-400'
'text-red-500' → 'text-destructive'
'text-orange-500' → 'text-orange-600 dark:text-orange-400'

// Brand colors
'border-pink-500' → 'border-theme-primary'
'bg-purple-500' → 'bg-theme-primary'
'border-purple-500' → 'border-theme-secondary'

// UI colors
'bg-gray-100' → 'bg-muted'
'text-gray-500' → 'text-muted-foreground'
'hover:bg-gray-50' → 'hover:bg-muted/50'
```

#### 2. File Naming Audit Process

**Comprehensive Search Strategy**:

```bash
# Find files with uppercase letters or underscores
find apps/web/src -name "*.tsx" -o -name "*.ts" | grep -E "[A-Z]|_"

# Exclude legitimate patterns
# - Route parameters: $vibeId.tsx, $username.tsx (TanStack Router)
# - Test files: Already follow [name].test.ts pattern correctly
```

**Key Discovery**: Only 2 files needed renaming, indicating good existing compliance with kebab-case naming.

#### 3. Import Pattern Validation

**Critical Pattern**: Always use workspace imports in monorepo:

```typescript
// CORRECT
import type { User, Vibe, Rating } from '@vibechecc/types';
import { api } from '@vibechecc/convex';

// INCORRECT
import type { User } from '@/types'; // Points to non-existent directory
```

#### 4. TypeScript Compatibility Management

**Pattern**: When UI components need different type shapes than shared types, create local interfaces:

```typescript
// Local interface for UI component needs
interface EmojiReactionType {
  emoji: string;
  count: number;
  users: string[]; // UI-specific property not in shared types
}

// Instead of modifying shared types or forcing compatibility
```

### Automation Opportunities

#### 1. Lint Rules for Theme Colors

Could add custom ESLint rules to prevent hardcoded color usage:

```typescript
// Custom rule to catch hardcoded colors
'no-hardcoded-colors': ['error', {
  'allowedPatterns': ['bg-gradient-to-', 'from-', 'to-'] // For algorithmic gradients
}]
```

#### 2. File Naming Pre-commit Hook

```bash
# Pre-commit hook to validate kebab-case naming
find . -name "*.tsx" -o -name "*.ts" | grep -E "[A-Z]|_" | grep -v "\$"
```

#### 3. Import Pattern Validation

Could add import restrictions in ESLint config:

```typescript
'no-restricted-imports': ['error', {
  'patterns': ['@/types'] // Prevent incorrect local type imports
}]
```

### Best Practices Established

#### 1. Color Usage Guidelines

- **Always use semantic colors** for maximum theme compatibility
- **Theme colors for brand elements** (theme-primary, theme-secondary)
- **Hardcoded colors only for algorithmic generation** (e.g., user avatars, content placeholders)
- **Test across light/dark themes** after color changes

#### 2. File Organization Standards

- **Strict kebab-case naming** for all source files
- **Route parameter files** correctly use dollar prefix syntax
- **Test files** follow `[name].test.ts/tsx` pattern

#### 3. Import Pattern Enforcement

- **Always use workspace imports** for shared packages
- **Local type interfaces** when UI needs differ from shared types
- **Verify import paths exist** before committing

#### 4. Quality Assurance Process

- **Run full quality checks** after any systematic changes
- **Fix lint errors immediately** - warnings acceptable, errors not
- **Verify TypeScript compilation** across all workspaces
- **Test formatting compliance** with Prettier

### Future Maintenance

#### 1. Ongoing Color Standards

- New components should only use semantic/theme colors
- Regular audits for hardcoded color introduction
- Documentation updates when new semantic tokens added

#### 2. Naming Convention Monitoring

- Pre-commit hooks to catch naming violations
- Documentation for contributors about kebab-case requirements
- Regular codebase scans for violations

#### 3. Import Pattern Vigilance

- ESLint rules to prevent incorrect import patterns
- Workspace setup validation in CI/CD
- Clear documentation about monorepo import patterns

### Performance Impact

**Positive Impact**:

- Better theme switching performance (fewer hardcoded style recalculations)
- Improved build consistency (correct workspace imports)
- Reduced maintenance overhead (standardized patterns)

**No Negative Impact**:

- File renames had no import references (safe operation)
- Color changes maintained visual consistency
- Quality improvements with zero functionality changes

### Applicable Situations

- **Code standards enforcement projects**: When implementing design system compliance
- **Monorepo import standardization**: When correcting workspace import patterns
- **Theme system migrations**: When moving from hardcoded to semantic colors
- **File naming standardization**: When enforcing consistent naming conventions
- **Quality assurance workflows**: When establishing systematic code quality checks
