# Notifications System Implementation Learnings - vibechecc

This document captures learnings, patterns, and implementation details discovered during the implementation of the notification system backend for the vibechecc project.

## Context

Implemented a comprehensive notification system backend including database schema, core backend functions, and TypeScript interfaces to support user notifications for social interactions (follows, ratings, new vibes, etc.).

## Key Implementation Patterns

### 1. Database Schema Design

**Pattern**: Structured notification table with proper indexes for efficient querying

```typescript
notifications: defineTable({
  userId: v.string(), // External ID of user receiving notification
  type: v.union(
    v.literal('follow'),
    v.literal('rating'),
    v.literal('new_vibe'),
    v.literal('new_rating')
  ),
  triggerUserId: v.string(), // External ID of user who triggered notification
  targetId: v.string(), // ID of the target - vibeId, ratingId, etc.
  title: v.string(), // e.g., "John followed you"
  description: v.string(), // e.g., "Check out their profile"
  metadata: v.optional(v.any()), // Additional data like vibe title, rating emoji
  read: v.boolean(), // Whether notification has been read
  createdAt: v.number(), // Timestamp
})
  .index('byUser', ['userId', 'createdAt'])
  .index('byUserAndRead', ['userId', 'read', 'createdAt'])
  .index('byUserAndType', ['userId', 'type', 'createdAt']);
```

**Why**:

- Multiple indexes support different query patterns efficiently
- `byUser` for general user notifications with chronological order
- `byUserAndRead` for filtering unread notifications
- `byUserAndType` for type-specific notification queries

### 2. Authentication Patterns for Notifications

**Pattern**: Consistent authentication checks using existing helper functions

```typescript
// For queries that can return empty state for unauthenticated users
const currentUser = await getCurrentUser(ctx);
if (!currentUser) {
  return { notifications: [], nextCursor: null, hasMore: false };
}

// For mutations that require authentication
const currentUser = await getCurrentUserOrThrow(ctx);
```

**Benefits**:

- Maintains security while providing graceful degradation
- Follows existing codebase patterns for authentication
- Prevents unauthorized access to sensitive notification data

### 3. Internal Mutations for System-Generated Notifications

**Pattern**: Use `internalMutation` for creating notifications from other backend functions

```typescript
export const createNotification = internalMutation({
  args: {
    /* notification fields */
  },
  handler: async (ctx, args) => {
    // Prevent self-notifications
    if (args.userId === args.triggerUserId) {
      return null;
    }

    // Validate users exist
    // Create notification
  },
});
```

**Why**:

- Internal mutations can only be called from other backend functions, not directly from client
- Prevents clients from creating arbitrary notifications
- Allows other backend functions (follows, ratings, etc.) to trigger notifications

### 4. Data Enrichment Pattern

**Pattern**: Enrich notifications with related user data for better UX

```typescript
const enrichedNotifications = await Promise.all(
  notifications.page.map(async (notification) => {
    const triggerUser = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) =>
        q.eq('externalId', notification.triggerUserId)
      )
      .first();

    return { ...notification, triggerUser };
  })
);
```

**Benefits**:

- Provides all necessary data for rich notification UI
- Follows existing patterns in the codebase for data enrichment
- Reduces client-side queries

### 5. Pagination Support

**Pattern**: Built-in pagination support for notification lists

```typescript
const notifications = await notificationsQuery.paginate({
  numItems: limit,
  cursor: args.cursor ?? null,
});

return {
  notifications: enrichedNotifications,
  nextCursor: notifications.continueCursor,
  hasMore: notifications.isDone === false,
};
```

**Why**:

- Essential for performance with large notification lists
- Follows Convex pagination patterns
- Provides smooth infinite scroll capabilities

## Function Architecture

### Query Functions

1. **getNotifications**: Paginated notifications with optional type filtering and user data enrichment
2. **getUnreadCount**: Simple count of unread notifications for badge display
3. **getUnreadCountByType**: Detailed breakdown of unread counts per notification type

### Mutation Functions

1. **markAsRead**: Mark individual notifications as read with ownership validation
2. **markAllAsRead**: Bulk mark notifications as read with optional type filtering

### Internal Functions

1. **createNotification**: System-generated notification creation with validation

## Security Considerations

### 1. Ownership Validation

**Pattern**: Always verify notification ownership before allowing modifications

```typescript
if (notification.userId !== currentUser.externalId) {
  throw new Error('Not authorized to update this notification');
}
```

### 2. User Existence Validation

**Pattern**: Validate both trigger and receiving users exist before creating notifications

```typescript
const receivingUser = await ctx.db
  .query('users')
  .withIndex('byExternalId', (q) => q.eq('externalId', args.userId))
  .first();

if (!receivingUser) {
  throw new Error('Receiving user not found');
}
```

### 3. Self-Notification Prevention

**Pattern**: Prevent users from creating notifications for themselves

```typescript
if (args.userId === args.triggerUserId) {
  return null;
}
```

## Type System Integration

### 1. Convex Schema Type Export

**Pattern**: Export notification type from schema for use across backend

```typescript
const _notification = schema.tables.notifications.validator;
export type Notification = Infer<typeof _notification>;
```

### 2. Shared Type Interface

**Pattern**: Create comprehensive interface in shared types package

```typescript
export interface Notification {
  _id?: string; // Convex document ID for compatibility
  userId: string;
  type: 'follow' | 'rating' | 'new_vibe' | 'new_rating';
  triggerUserId: string;
  targetId: string;
  title: string;
  description: string;
  metadata?: any;
  read: boolean;
  createdAt: number;
  _creationTime?: number; // Convex creation time for compatibility
  triggerUser?: User; // Populated user data
}
```

**Benefits**:

- Maintains type safety across frontend and backend
- Includes compatibility fields for Convex integration
- Supports data enrichment patterns

## Performance Optimizations

### 1. Index-Based Queries

**Pattern**: Always use appropriate indexes for efficient querying

```typescript
// Use specific indexes for different query patterns
ctx.db
  .query('notifications')
  .withIndex('byUserAndType', (q) =>
    q.eq('userId', userId).eq('type', args.type)
  );
```

### 2. Bulk Operations

**Pattern**: Use Promise.all for bulk operations like marking all as read

```typescript
const updatePromises = unreadNotifications.map((notification) =>
  ctx.db.patch(notification._id, { read: true })
);
await Promise.all(updatePromises);
```

## Integration Points

### Future Integration Requirements

1. **Follow System**: Call `createNotification` when users follow each other
2. **Rating System**: Call `createNotification` when users rate vibes
3. **Vibe Creation**: Call `createNotification` to notify followers of new vibes
4. **Frontend Integration**: Use shared types for consistent data handling

### Example Integration Pattern

```typescript
// In follows.ts after successful follow
await ctx.runMutation(internal.notifications.createNotification, {
  userId: args.followingId,
  type: 'follow',
  triggerUserId: followerId,
  targetId: followerId,
  title: `${currentUser.username || 'Someone'} followed you`,
  description: 'Check out their profile',
  metadata: { followerUsername: currentUser.username },
});
```

## Testing Considerations

### Unit Testing Approaches

1. **Function-level testing**: Each notification function should be testable independently
2. **Authentication testing**: Verify proper authentication handling
3. **Data validation testing**: Ensure proper validation of input parameters
4. **Integration testing**: Test notification creation from other systems

### Edge Cases to Test

1. Self-notification prevention
2. Non-existent user handling
3. Authorization validation
4. Pagination edge cases
5. Type filtering accuracy

## Best Practices Established

1. **Always use indexes** for notification queries to ensure performance
2. **Validate ownership** before allowing notification modifications
3. **Prevent self-notifications** at the system level
4. **Enrich data** to reduce client-side queries
5. **Use internal mutations** for system-generated notifications
6. **Follow existing authentication patterns** from the codebase
7. **Provide pagination support** for scalable notification lists
8. **Include type filtering** for flexible notification management

## Applicable Situations

- **Social Feature Development**: When implementing user interaction notifications
- **Backend Security**: When implementing authorization for user-specific data
- **Data Enrichment**: When building APIs that need to include related data
- **Pagination Implementation**: When dealing with potentially large datasets
- **System Integration**: When building internal APIs that other backend systems will use
- **Type Safety**: When maintaining type consistency across monorepo packages

## Future Enhancement Opportunities

1. **Push Notifications**: Integration with web push or mobile notifications
2. **Email Notifications**: Batch digest emails for inactive users
3. **Notification Preferences**: User settings for notification types
4. **Advanced Filtering**: More granular notification filtering options
5. **Analytics Integration**: Track notification engagement metrics
6. **Real-time Updates**: WebSocket integration for live notification updates
