# Web Development Learnings - vibechecc

This document captures learnings, patterns, and best practices discovered during web development tasks in the vibechecc project.

## User Points System Integration Patterns

### Context

Successfully migrated and integrated a comprehensive user points system from the broken `refactor/platform-improvements` branch, including karma calculations, daily limits, streaks, and point transactions.

### Key Implementation Patterns

#### 1. Backend Points API Architecture

**Pattern**: Centralized points management with internal mutations for atomic operations

```typescript
// Core API structure
export const getUserPointsStats = query({ ... });
export const initializeUserPoints = mutation({ ... });
export const boostContent = mutation({ ... });
export const dampenContent = mutation({ ... });
export const getPointsHistory = query({ ... });

// Internal mutations for atomic point transfers
export const transferPointsInternal = internalMutation({
  // Handles point deductions, karma updates, transaction logging
});
```

**Why**: Ensures data consistency and provides clean API for frontend consumption while maintaining atomic operations for complex point transfers.

#### 2. Karma-Based Content Moderation

**Pattern**: Community-driven content quality through point-based voting

```typescript
const boostCost = getBoostCost(userStats.level, userStats.consecutiveDays);
const dampenCost = getDampenCost(userStats.level);

// Point transfer affects both users and content karma
await transferPointsInternal({
  fromUserId: currentUser.id,
  toUserId: vibe.userId,
  amount: boostCost,
  karmaChange: 1, // Increases content karma
  reason: 'boost_content',
});
```

**Why**: Incentivizes quality content creation and enables community self-moderation through economic incentives.

#### 3. Progressive Cost Scaling

**Pattern**: Dynamic pricing based on user level and engagement streaks

```typescript
export function getBoostCost(level: number, consecutiveDays: number): number {
  const baseCost = Math.max(1, Math.floor(level / 2));
  const streakBonus = consecutiveDays >= 7 ? 0.8 : 1; // 20% discount for 7+ day streaks
  return Math.ceil(baseCost * streakBonus);
}
```

**Why**: Rewards consistent users with lower costs while scaling with user progression to maintain economic balance.

## Boost/Dampen Feature Integration Patterns

### Context

Implemented point-integrated rating system with boost (positive) and dampen (negative) actions that transfer points and affect content karma.

### Key Frontend Patterns

#### 1. Confirmation Dialog for Destructive Actions

**Pattern**: Always confirm dampen actions with clear cost implications

```typescript
const handleDampen = () => {
  setShowDampenConfirm(true);
};

// Confirmation dialog shows cost and impact
<AlertDialog open={showDampenConfirm} onOpenChange={setShowDampenConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Dampen this content?</AlertDialogTitle>
      <AlertDialogDescription>
        This will cost {dampenCost} points and reduce the content's karma by 1.
      </AlertDialogDescription>
    </AlertDialogHeader>
  </AlertDialogContent>
</AlertDialog>
```

**Why**: Prevents accidental point spending and provides transparency about the action's consequences.

#### 2. Toast Feedback with Point Changes

**Pattern**: Immediate visual feedback showing point transfers and balance updates

```typescript
toast({
  title: isBoost ? '🚀 Content boosted!' : '👎 Content dampened',
  description: `${isBoost ? 'Spent' : 'Spent'} ${cost} points. Balance: ${newBalance}`,
  duration: 3000,
});
```

**Why**: Provides immediate confirmation of successful actions and keeps users aware of their point balance changes.

#### 3. Balance Validation with Loading States

**Pattern**: Pre-validate user balance and show appropriate loading states

```typescript
const canAfford = userStats && userStats.pointsBalance >= cost;
const isDisabled = !canAfford || isLoading || !isAuthenticated;

<Button
  disabled={isDisabled}
  variant={isBoost ? "default" : "destructive"}
  size="sm"
>
  {isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    `${isBoost ? '🚀 Boost' : '👎 Dampen'} (${cost})`
  )}
</Button>
```

**Why**: Prevents failed transactions and provides clear feedback about affordability and action state.

## Enhanced Rating System Component Patterns

### Context

Extended existing rating components to integrate with the points system while maintaining backward compatibility.

### Key Integration Patterns

#### 1. Component API Extension

**Pattern**: Extend existing component APIs with optional boost/dampen props

```typescript
interface EmojiRatingDisplayProps {
  // Existing props
  vibe: Vibe;
  currentUserRating?: EmojiRating;

  // New optional props for points integration
  enableBoostDampen?: boolean;
  onBoostDampen?: (action: 'boost' | 'dampen') => void;
}
```

**Why**: Maintains backward compatibility while enabling new functionality where needed.

#### 2. Responsive Control Layout

**Pattern**: Mobile-optimized boost/dampen controls with proper spacing

```typescript
<div className="flex items-center gap-2 mt-2">
  <div className="flex items-center gap-1">
    <BoostButton vibe={vibe} />
    <DampenButton vibe={vibe} />
  </div>
  <div className="text-sm text-muted-foreground">
    Karma: {vibe.karma || 0}
  </div>
</div>
```

**Why**: Provides clear visual hierarchy and maintains usability on mobile devices.

#### 3. Progressive Enhancement

**Pattern**: Rating system works without points integration, enhanced when available

```typescript
const userStats = useUserPointsStats();
const canUsePoints = userStats && userStats.pointsBalance > 0;

{canUsePoints && (
  <div className="border-t pt-2 mt-2">
    <BoostDampenControls vibe={vibe} />
  </div>
)}
```

**Why**: Ensures core functionality remains available even if points system fails or is unavailable.

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

**Color Mapping Established**: See `.agent/rules-detailed.md` for comprehensive color migration patterns, including status colors, brand colors, and UI colors.

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

## Mobile Feed Animation Performance Optimization Patterns

### Context

Successfully implemented comprehensive mobile performance optimizations for vibe card feed animations, focusing on smooth 60fps interactions, battery efficiency, and adaptive quality based on device capabilities.

### Key Implementation Patterns

#### 1. Enhanced Intersection Observer with Mobile Optimization

**Pattern**: Adaptive intersection observer with mobile-specific settings and reduced motion support

```typescript
const {
  ref: intersectionRef,
  hasIntersected,
  isMobile,
  prefersReducedMotion,
} = useIntersectionObserver<HTMLDivElement>({
  threshold: 0.1,
  rootMargin: '50px',
  // Mobile-specific optimizations
  mobileThreshold: 0.05, // Lower threshold for earlier triggering on mobile
  mobileRootMargin: '100px', // Larger preload area on mobile
  triggerOnce: true,
  // Use performance metrics to decide on reduced motion
  reducedMotion: isLowPerformance || metrics.adaptiveQuality === 'low',
});
```

**Benefits**:

- Earlier animation triggering on mobile for smoother perceived performance
- Larger preload areas reduce layout shifts on slower devices
- Automatic reduced motion support based on user preferences and device performance
- Will-change hints automatically added and removed for optimal GPU utilization

#### 2. Performance Monitoring Hook for Adaptive Quality

**Pattern**: Real-time performance monitoring with adaptive UI adjustments

```typescript
const { metrics, getAdaptiveClasses, getAnimationSettings, isLowPerformance } =
  usePerformanceMonitor({
    enableBatteryMonitoring: true,
    lowFpsThreshold: 45,
  });

// Adaptive CSS classes based on performance
const adaptiveClasses = getAdaptiveClasses(
  isMobile
    ? 'mobile-animate-optimized mobile-interaction-optimize'
    : 'desktop-only-animation'
);
```

**Key Features**:

- FPS monitoring with configurable thresholds
- Battery level detection for power-conscious animations
- Connection speed awareness (2G/3G force low quality)
- Automatic will-change management for GPU optimization
- Progressive quality degradation (high → medium → low)

#### 3. Mobile-Optimized CSS Utility Classes

**Pattern**: Performance-first CSS utilities for mobile devices

```css
/* Enhanced mobile animation performance */
.mobile-animate-optimized {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
  will-change: transform, opacity;
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(
    0.25,
    0.46,
    0.45,
    0.94
  ); /* easeOutQuad - mobile optimized */
}

/* Feed-specific mobile optimizations */
.mobile-feed-optimize {
  contain: layout style;
  content-visibility: auto;
  contain-intrinsic-size: 0 400px; /* Estimated card height */
}

/* iOS specific optimizations */
.ios-optimize {
  -webkit-transform: translateZ(0);
  -webkit-perspective: 1000px;
  -webkit-backface-visibility: hidden;
}
```

**Benefits**:

- Guaranteed GPU acceleration with hardware-optimized transforms
- Layout containment prevents expensive reflows
- Content visibility API for better scroll performance
- iOS-specific webkit prefixes for maximum compatibility

#### 4. Battery-Conscious Animation Strategy

**Pattern**: Adaptive animations based on battery level and charging state

```typescript
// Performance-conscious animation states
prefersReducedMotion || isLowPerformance
  ? 'opacity-100' // Skip animation for reduced motion or low performance
  : hasIntersected
    ? 'mobile-card-enter-active mobile-card-enter-done'
    : 'mobile-card-enter',

// Adaptive image loading
loading={
  hasIntersected && metrics.adaptiveQuality !== 'low'
    ? 'eager'
    : 'lazy'
}
```

**Quality Levels**:

- **High**: Full animations, eager image loading, complex hover effects
- **Medium**: Simplified animations, standard loading, reduced effects
- **Low**: Minimal animations, lazy loading, essential interactions only

#### 5. Touch-Optimized Interaction Design

**Pattern**: Mobile-first touch targets with enhanced accessibility

```css
/* Enhanced mobile touch targets */
.mobile-touch-optimize {
  min-height: 44px; /* Apple's recommended minimum */
  min-width: 44px;
  position: relative;
}

.mobile-touch-optimize::before {
  content: '';
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  /* Invisible larger touch area */
}
```

```typescript
// Touch-optimized interactions
isMobile
  ? 'mobile-touch-optimize mobile-focus-optimize'
  : 'transition-transform duration-100 hover:scale-[1.03]';
```

**Benefits**:

- Meets accessibility guidelines for touch targets (44px minimum)
- Extended touch areas for improved usability
- Disabled complex hover effects on mobile for better performance
- Enhanced focus states for keyboard navigation

### Performance Metrics and Monitoring

#### 1. Real-Time FPS Monitoring

**Pattern**: RequestAnimationFrame-based performance tracking

```typescript
const measureFrameRate = useCallback(() => {
  frameCountRef.current++;

  const updateFPS = () => {
    const now = performance.now();
    const elapsed = now - lastTimeRef.current;

    if (elapsed >= sampleDuration) {
      const fps = Math.round((frameCountRef.current * 1000) / elapsed);
      const isLowPerformance = fps < lowFpsThreshold;

      // Determine adaptive quality based on performance
      let adaptiveQuality: 'high' | 'medium' | 'low' = 'high';
      if (fps < 30) adaptiveQuality = 'low';
      else if (fps < lowFpsThreshold) adaptiveQuality = 'medium';

      setMetrics((prev) => ({
        ...prev,
        fps,
        isLowPerformance,
        adaptiveQuality,
      }));
    }

    rafIdRef.current = requestAnimationFrame(updateFPS);
  };

  rafIdRef.current = requestAnimationFrame(updateFPS);
}, [sampleDuration, lowFpsThreshold]);
```

#### 2. Battery API Integration

**Pattern**: Progressive quality degradation based on power state

```typescript
const updateBatteryInfo = useCallback(async () => {
  if (!enableBatteryMonitoring || !('getBattery' in navigator)) return;

  try {
    const battery = await navigator.getBattery();

    setMetrics((prev) => ({
      ...prev,
      batteryLevel: Math.round(battery.level * 100),
      isCharging: battery.charging,
      adaptiveQuality:
        !battery.charging && battery.level < 0.2
          ? 'low' // Force low quality on low battery
          : prev.adaptiveQuality,
    }));
  } catch (error) {
    console.warn('Battery monitoring not available:', error);
  }
}, [enableBatteryMonitoring]);
```

#### 3. Connection-Aware Optimizations

**Pattern**: Network speed adaptation for animation quality

```typescript
const updateConnectionInfo = useCallback(() => {
  const connection = navigator.connection;

  if (connection) {
    const connectionType = connection.effectiveType;

    setMetrics((prev) => ({
      ...prev,
      connectionType,
      adaptiveQuality:
        connectionType === '2g' || connectionType === 'slow-2g'
          ? 'low' // Force low quality on slow connections
          : prev.adaptiveQuality,
    }));
  }
}, []);
```

### Advanced Animation Patterns

#### 1. Will-Change Management

**Pattern**: Automatic will-change optimization for GPU acceleration

```typescript
// Add will-change hint when intersecting
if (element instanceof HTMLElement) {
  element.style.willChange = 'transform, opacity';

  // Remove will-change after animation completes (assume 500ms animation)
  setTimeout(() => {
    element.style.willChange = 'auto';
  }, 500);
}
```

**Benefits**:

- Enables GPU acceleration only when needed
- Prevents memory leaks from persistent will-change properties
- Optimizes for both animation smoothness and resource usage

#### 2. Reduced Motion Integration

**Pattern**: Comprehensive accessibility support with performance benefits

```typescript
// Detect reduced motion preferences
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
setPrefersReducedMotion(mediaQuery.matches);

// Skip intersection observer if reduced motion is enabled
if (reducedMotion || prefersReducedMotion) {
  setHasIntersected(true);
  setIsIntersecting(true);
  return;
}
```

**CSS Implementation**:

```css
@media (prefers-reduced-motion: reduce) {
  .mobile-animate-optimized,
  .mobile-fade-in,
  .desktop-only-animation {
    transition: none !important;
    transform: none !important;
    animation: none !important;
  }
}
```

#### 3. Progressive Image Loading

**Pattern**: Performance-aware image loading strategy

```typescript
// Performance optimizations for images
loading={
  hasIntersected && metrics.adaptiveQuality !== 'low'
    ? 'eager'
    : 'lazy'
}
decoding="async"
```

**Benefits**:

- Eager loading only for visible, high-performance scenarios
- Async decoding prevents main thread blocking
- Reduces memory pressure on low-performance devices

### Mobile-Specific Optimizations

#### 1. Viewport-Aware Animation Thresholds

**Pattern**: Mobile-optimized intersection thresholds

```typescript
// Calculate optimized threshold and root margin for mobile
const optimizedThreshold =
  isMobile && mobileThreshold !== undefined ? mobileThreshold : threshold;

const optimizedRootMargin =
  isMobile && mobileRootMargin !== undefined
    ? mobileRootMargin
    : isMobile
      ? '100px' // Larger preload area on mobile
      : rootMargin;
```

#### 2. iOS Safari Optimizations

**Pattern**: WebKit-specific performance enhancements

```css
/* iOS specific optimizations */
@supports (-webkit-touch-callout: none) {
  .ios-optimize {
    -webkit-transform: translateZ(0);
    -webkit-perspective: 1000px;
    -webkit-backface-visibility: hidden;
  }
}
```

#### 3. Mobile Interaction Optimizations

**Pattern**: Touch-first interaction design

```css
.mobile-interaction-optimize {
  touch-action: manipulation; /* Prevents 300ms delay */
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none; /* Disable callout on iOS */
}
```

### Performance Validation Strategies

#### 1. Development Server Integration

**Pattern**: Real-time performance monitoring during development

- Dev server runs successfully with optimizations
- TypeScript compilation confirms type safety
- Hot reloading maintains performance characteristics

#### 2. Responsive Design Testing

**Pattern**: Multi-device performance validation

- Desktop: Full animation suite with complex hover effects
- Tablet: Medium quality with simplified interactions
- Mobile: Optimized animations with touch-first design
- Low-end devices: Essential animations only

#### 3. Network Condition Simulation

**Pattern**: Connection-aware performance testing

- Fast connections: High-quality animations and eager loading
- Slow connections: Reduced animations and lazy loading
- Offline scenarios: Minimal animations with cached content

### Best Practices Established

#### 1. Performance-First Design

- **Always measure before optimizing**: Use performance monitoring to guide decisions
- **Progressive enhancement**: Start with minimal animations, enhance based on capability
- **Resource cleanup**: Properly manage will-change properties and event listeners

#### 2. Mobile-First Animation Strategy

- **Touch targets over hover effects**: Prioritize mobile interactions
- **Battery awareness**: Reduce animations on low battery devices
- **Connection sensitivity**: Adapt quality based on network speed

#### 3. Accessibility Integration

- **Reduced motion respect**: Honor user preferences automatically
- **Focus management**: Enhanced focus states for keyboard navigation
- **Screen reader compatibility**: Ensure animations don't interfere with assistive technology

### Future Enhancement Opportunities

1. **Service Worker Integration**: Cache animation states for offline performance
2. **Web Workers**: Offload performance monitoring to prevent main thread blocking
3. **WebGL Acceleration**: Advanced GPU utilization for complex animations
4. **Predictive Loading**: Machine learning-based preloading strategies
5. **Haptic Feedback**: iOS/Android vibration API integration for touch responses

### Applicable Situations

- **Mobile-first applications**: When optimizing for mobile user bases
- **Performance-critical interfaces**: Applications requiring smooth 60fps animations
- **Battery-conscious apps**: PWAs and mobile web applications
- **Accessibility-focused projects**: Applications requiring reduced motion support
- **Feed-based interfaces**: Infinite scroll implementations with complex cards
- **Cross-platform development**: Ensuring consistent performance across devices
