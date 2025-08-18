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

## Social Connection Profile Integration Patterns

### Context

Integrated social connection components (SocialConnectionsList and ConnectSocialButton) into user profile pages as part of Phase 5: Profile Enhancement. Added functionality for users to view, connect, and disconnect social accounts directly from their profile pages.

### Key Integration Patterns

#### 1. Component Import and Usage

**Pattern**: Import social connection components using standard @/components path structure

```typescript
import { SocialConnectionsList } from '@/components/social/connections/social-connections-list';
import { ConnectSocialButton } from '@/components/social/connections/connect-social-button';
```

**Usage in Profile Edit Page**:

```typescript
<div className="space-y-4 pt-4">
  <div>
    <h3 className="text-sm font-medium mb-3">social connections</h3>
    <SocialConnectionsList className="mb-4" />
    <div className="flex flex-wrap gap-2">
      <ConnectSocialButton platform="twitter" size="sm" variant="outline" />
      <ConnectSocialButton platform="instagram" size="sm" variant="outline" />
      <ConnectSocialButton platform="tiktok" size="sm" variant="outline" />
    </div>
  </div>
</div>
```

**Usage in Profile View Page**:

```typescript
{/* 4. Social Connections */}
<SocialConnectionsList className="mb-6 sm:mb-8" />
```

#### 2. Profile Page Layout Integration

**Pattern**: Add social connections section within existing content management structure

- **Edit Page**: Added after theme color picker, before action buttons
- **View Page**: Added as fourth section after vibes, reviews, and interests

**Benefits**: Maintains logical flow and keeps social features grouped with profile management functionality.

#### 3. Component Self-Containment

**Pattern**: Social connection components handle their own state, API calls, and empty states

```typescript
// Components handle loading states
if (!connections) {
  return <Card className={className}><Loader2 /></Card>;
}

// Components handle empty states
if (connections.length === 0) {
  return (
    <Card className={className}>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          no social accounts connected yet. connect your accounts in profile settings.
        </p>
      </CardContent>
    </Card>
  );
}
```

**Why**: Reduces complexity in parent components and maintains separation of concerns.

#### 4. Button Configuration for Different Contexts

**Pattern**: Use different button configurations for edit vs view contexts

- **Edit Page**: Small outline buttons for compact display in form
- **View Page**: Full component with default styling for better visibility

```typescript
// Edit page - compact
<ConnectSocialButton platform="twitter" size="sm" variant="outline" />

// View page - default component handles its own presentation
<SocialConnectionsList className="mb-6 sm:mb-8" />
```

### UI Design Integration

#### 1. Consistent Spacing and Typography

**Pattern**: Follow existing profile page spacing and text conventions

```typescript
// Section header follows existing pattern
<h3 className="text-sm font-medium mb-3">social connections</h3>

// Consistent margin classes with other sections
<SocialConnectionsList className="mb-6 sm:mb-8" />
```

#### 2. Responsive Layout Integration

**Pattern**: Use flex-wrap for connection buttons to handle mobile layouts

```typescript
<div className="flex flex-wrap gap-2">
  {/* Connection buttons */}
</div>
```

**Benefits**: Ensures buttons wrap gracefully on smaller screens while maintaining alignment.

#### 3. Visual Hierarchy

**Pattern**: Place social connections as a distinct section with clear hierarchy

- Edit page: Grouped with other profile settings
- View page: Positioned after core content (vibes, reviews, interests) but before account management

### Backend Integration

#### 1. Convex Query Usage

**Pattern**: Components use useConvexQuery for real-time data fetching

```typescript
const connections = useConvexQuery(api.social.connections.getSocialConnections);
const disconnectMutation = useConvexMutation(
  api.social.connections.disconnectSocialAccount
);
```

**Benefits**: Provides real-time updates when connections change and proper error handling.

#### 2. Platform Support

**Supported Platforms**: twitter, instagram, tiktok
**Connection States**: connected, disconnected, expired, error

### User Experience Patterns

#### 1. Progressive Enhancement

**Pattern**: Show connection options even when no connections exist

- Empty state provides clear guidance on how to connect accounts
- Connection buttons remain accessible for easy account linking

#### 2. Contextual Actions

**Pattern**: Different actions available in different contexts

- **Edit Page**: Focus on connecting new accounts and managing existing ones
- **View Page**: Focus on displaying connected accounts for profile overview

### Security and Data Handling

#### 1. Secure Data Display

**Pattern**: Components only display public social connection data

- Platform usernames and connection status visible
- Sensitive tokens and credentials handled server-side only

#### 2. User Ownership Validation

**Pattern**: Components automatically scope to current user

```typescript
// Backend automatically filters to current user
const currentUser = await getCurrentUserOrThrow(ctx);
const connections = await ctx.db
  .query('socialConnections')
  .withIndex('byUser', (q) => q.eq('userId', currentUser.externalId));
```

### Development Best Practices

#### 1. Component Reusability

**Pattern**: Single components work across different profile page contexts

- SocialConnectionsList adapts to different className props
- ConnectSocialButton accepts various size and variant props

#### 2. Type Safety

**Pattern**: Use TypeScript platform unions for type safety

```typescript
platform: 'twitter' | 'instagram' | 'tiktok';
```

### Future Enhancement Opportunities

1. **Connection Status Indicators**: Visual indicators for connection health
2. **Bulk Actions**: Connect/disconnect multiple platforms at once
3. **Connection Analytics**: Show sharing statistics for connected accounts
4. **Platform-Specific Settings**: Individual settings per connected platform

### Applicable Situations

- **Profile Management Features**: When adding new profile-related functionality
- **Social Feature Integration**: When integrating social features into existing pages
- **Component Integration Patterns**: When adding complex components to existing layouts
- **User Settings Sections**: When extending user settings with new categories
