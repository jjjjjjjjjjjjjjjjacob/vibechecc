# Notification System Rules - vibechecc

This document defines comprehensive rules for the notification system in vibechecc, covering in-app notifications, push notifications, email notifications, data management, and UI patterns.

## 1. In-App Notification Rules

### 1.1 Real-Time Notification Delivery

**MUST** use Convex real-time queries for live notifications:

```typescript
// CORRECT: Use reactive queries for real-time updates
const notificationQuery = useQuery(api.notifications.getNotifications, {
  cursor: null,
  limit: 20,
});

// INCORRECT: Using polling for notification updates
useEffect(() => {
  const interval = setInterval(() => fetchNotifications(), 5000);
  return () => clearInterval(interval);
}, []);
```

**MUST** implement proper notification aggregation:

```typescript
// Group similar notifications to prevent spam
const aggregateNotifications = (notifications: Notification[]) => {
  const grouped = notifications.reduce(
    (acc, notification) => {
      const key = `${notification.type}-${notification.targetId}`;
      if (!acc[key]) {
        acc[key] = {
          ...notification,
          count: 1,
          triggerUsers: [notification.triggerUser],
        };
      } else {
        acc[key].count++;
        acc[key].triggerUsers.push(notification.triggerUser);
      }
      return acc;
    },
    {} as Record<string, AggregatedNotification>
  );

  return Object.values(grouped);
};
```

### 1.2 Notification State Management

**MUST** track read/unread state accurately:

```typescript
// CORRECT: Use backend-driven read state
const markAsRead = useMutation(api.notifications.markAsRead);

const handleNotificationClick = async (notification: Notification) => {
  if (!notification.read && notification._id) {
    await markAsRead({ notificationId: notification._id });
  }
  // Navigate to target
};

// INCORRECT: Only tracking read state in frontend
const [readNotifications, setReadNotifications] = useState(new Set());
```

**MUST** implement optimistic updates for better UX:

```typescript
// Optimistic read state update
const markAsReadOptimistic = useMutation(api.notifications.markAsRead);

const handleMarkAsRead = (notificationId: string) => {
  // Optimistically update UI
  queryClient.setQueryData(['notifications'], (old: any) => {
    return {
      ...old,
      pages: old.pages.map((page: any) => ({
        ...page,
        notifications: page.notifications.map((n: Notification) =>
          n._id === notificationId ? { ...n, read: true } : n
        ),
      })),
    };
  });

  // Perform actual mutation
  markAsReadOptimistic({ notificationId });
};
```

### 1.3 Notification Display Patterns

**MUST** provide contextual notification content:

```typescript
// Dynamic notification rendering based on type
const getNotificationContent = (notification: Notification) => {
  const userName = notification.triggerUser?.username || 'Someone';

  switch (notification.type) {
    case 'follow':
      return {
        icon: <Users className="h-4 w-4" />,
        text: `${userName} followed you`,
        actionText: 'view profile',
        href: `/@${notification.triggerUser?.username}`,
      };

    case 'rating':
      return {
        icon: notification.metadata?.emoji ? (
          <span className="text-lg">{notification.metadata.emoji}</span>
        ) : <Heart className="h-4 w-4" />,
        text: `${userName} ${notification.metadata?.emoji ? 'reacted to' : 'liked'} your vibe`,
        actionText: 'see rating',
        href: `/vibes/${notification.targetId}`,
      };

    case 'new_vibe':
      return {
        icon: <Sparkles className="h-4 w-4" />,
        text: `${userName} shared a new vibe`,
        subtitle: notification.metadata?.vibeTitle || 'Check it out!',
        actionText: 'view vibe',
        href: `/vibes/${notification.targetId}`,
      };

    default:
      return {
        icon: <Bell className="h-4 w-4" />,
        text: notification.title,
        subtitle: notification.description,
        actionText: 'view',
        href: '/',
      };
  }
};
```

**MUST** implement proper notification timestamps:

```typescript
// Human-readable timestamp formatting
import { formatDistanceToNow } from 'date-fns';

const formatNotificationTime = (createdAt: number) => {
  return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
};

// Usage in notification components
<span className="text-muted-foreground text-xs">
  {formatNotificationTime(notification.createdAt)}
</span>
```

## 2. Push Notification Rules

### 2.1 Browser Push Notification Setup

**MUST** request permission properly:

```typescript
// Proper push notification permission handling
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};
```

**SHOULD** implement service worker for background notifications:

```typescript
// Service worker for push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'vibechecc-notification',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification('vibechecc', options));
});
```

### 2.2 Push Notification Content

**MUST** format push notifications consistently:

```typescript
// Standardized push notification formatting
const formatPushNotification = (notification: Notification) => {
  const userName = notification.triggerUser?.username || 'Someone';

  switch (notification.type) {
    case 'follow':
      return {
        title: 'New Follower',
        body: `${userName} started following you`,
        icon: '/icons/follow.png',
        tag: `follow-${notification.triggerUserId}`,
      };

    case 'rating':
      return {
        title: 'New Rating',
        body: `${userName} rated your vibe with ${notification.metadata?.emoji || '❤️'}`,
        icon: '/icons/rating.png',
        tag: `rating-${notification.targetId}`,
      };

    default:
      return {
        title: 'vibechecc',
        body: notification.title,
        icon: '/icon-192x192.png',
        tag: 'general-notification',
      };
  }
};
```

**SHOULD** implement notification batching for high-frequency events:

```typescript
// Batch similar notifications to prevent spam
const batchNotifications = (notifications: Notification[]) => {
  if (notifications.length === 1) {
    return formatPushNotification(notifications[0]);
  }

  const types = [...new Set(notifications.map((n) => n.type))];
  if (types.length === 1 && types[0] === 'follow') {
    return {
      title: 'New Followers',
      body: `${notifications.length} people started following you`,
      icon: '/icons/follow.png',
      tag: 'batch-follow',
    };
  }

  return {
    title: 'vibechecc',
    body: `You have ${notifications.length} new notifications`,
    icon: '/icon-192x192.png',
    tag: 'batch-notifications',
  };
};
```

## 3. Email Notification Rules

### 3.1 Email Trigger Patterns

**MUST** implement email digest for inactive users:

```typescript
// Email digest for users who haven't been active
export const sendEmailDigest = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.runQuery(internal.users.getUserByExternalId, {
      externalId: userId,
    });
    if (!user) return;

    // Check if user has been inactive for 24+ hours
    const lastActive = user.lastActiveAt || user.created_at;
    const hoursSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60);

    if (hoursSinceActive < 24) return;

    // Get unread notifications from last 24 hours
    const recentNotifications = await ctx.runQuery(
      internal.notifications.getRecentUnreadNotifications,
      { userId, hours: 24 }
    );

    if (recentNotifications.length === 0) return;

    // Send digest email
    await sendDigestEmail(user, recentNotifications);
  },
});
```

### 3.2 Email Content Templates

**MUST** provide rich email templates:

```typescript
// Email template structure
interface EmailTemplate {
  subject: string;
  preheader: string;
  content: {
    title: string;
    subtitle?: string;
    notifications: NotificationEmailItem[];
    ctaText: string;
    ctaUrl: string;
  };
}

const generateNotificationEmail = (
  user: User,
  notifications: Notification[]
): EmailTemplate => {
  const notificationCount = notifications.length;

  return {
    subject:
      notificationCount === 1
        ? notifications[0].title
        : `You have ${notificationCount} new notifications`,
    preheader: "Check out what's happening in your vibechecc community",
    content: {
      title: `Hi ${user.first_name || user.username || 'there'}!`,
      subtitle: `You have ${notificationCount} new notification${notificationCount > 1 ? 's' : ''} waiting for you.`,
      notifications: notifications.map(formatNotificationForEmail),
      ctaText: 'View All Notifications',
      ctaUrl: `${process.env.FRONTEND_URL}/notifications`,
    },
  };
};
```

### 3.3 Email Preferences and Unsubscribe

**MUST** respect email preferences:

```typescript
// Check user email preferences before sending
const shouldSendEmailNotification = (user: User, notificationType: string) => {
  const preferences = user.emailPreferences || {
    follows: true,
    ratings: true,
    newVibes: false,
    weeklyDigest: true,
  };

  return preferences[notificationType as keyof typeof preferences] !== false;
};
```

**MUST** provide easy unsubscribe mechanism:

```typescript
// Unsubscribe handling
export const unsubscribeFromEmails = mutation({
  args: {
    userId: v.string(),
    token: v.string(), // Secure unsubscribe token
    type: v.optional(v.string()), // Specific notification type
  },
  handler: async (ctx, { userId, token, type }) => {
    // Verify unsubscribe token
    const isValidToken = await verifyUnsubscribeToken(userId, token);
    if (!isValidToken) {
      throw new Error('Invalid unsubscribe token');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', userId))
      .first();

    if (!user) throw new Error('User not found');

    // Update preferences
    const preferences = user.emailPreferences || {};
    if (type) {
      preferences[type] = false;
    } else {
      // Unsubscribe from all
      Object.keys(preferences).forEach((key) => (preferences[key] = false));
    }

    await ctx.db.patch(user._id, {
      emailPreferences: preferences,
      updated_at: Date.now(),
    });
  },
});
```

## 4. Notification Data Rules

### 4.1 Database Schema and Indexing

**MUST** use proper indexing for notification queries:

```typescript
// Required notification indexes
notifications: defineTable({
  userId: v.string(), // External ID of receiving user
  type: v.union(
    v.literal('follow'),
    v.literal('rating'),
    v.literal('new_vibe'),
    v.literal('new_rating')
  ),
  triggerUserId: v.string(), // External ID of triggering user
  targetId: v.string(), // ID of target resource
  title: v.string(),
  description: v.string(),
  metadata: v.optional(v.any()), // Additional data
  read: v.boolean(),
  createdAt: v.number(),
})
  .index('byUser', ['userId', 'createdAt']) // Primary user notifications
  .index('byUserAndRead', ['userId', 'read', 'createdAt']) // Unread filtering
  .index('byUserAndType', ['userId', 'type', 'createdAt']); // Type filtering
```

**MUST** implement efficient notification querying:

```typescript
// CORRECT: Use appropriate indexes for notification queries
export const getNotifications = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, { cursor, limit = 20, type }) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return { notifications: [], nextCursor: null, hasMore: false };
    }

    let notificationsQuery;

    if (type && type !== 'all') {
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('byUserAndType', (q) =>
          q.eq('userId', currentUser.externalId).eq('type', type)
        )
        .order('desc');
    } else {
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('byUser', (q) => q.eq('userId', currentUser.externalId))
        .order('desc');
    }

    const notifications = await notificationsQuery.paginate({
      numItems: limit,
      cursor: cursor ?? null,
    });

    return {
      notifications: await enrichNotifications(ctx, notifications.page),
      nextCursor: notifications.continueCursor,
      hasMore: notifications.isDone === false,
    };
  },
});
```

### 4.2 Data Enrichment and Performance

**MUST** enrich notifications with related user data:

```typescript
// Enrich notifications with trigger user data
const enrichNotifications = async (
  ctx: QueryCtx,
  notifications: Notification[]
) => {
  return await Promise.all(
    notifications.map(async (notification) => {
      const triggerUser = await ctx.db
        .query('users')
        .withIndex('byExternalId', (q) =>
          q.eq('externalId', notification.triggerUserId)
        )
        .first();

      return {
        ...notification,
        triggerUser: triggerUser ? transformUserForPublic(triggerUser) : null,
      };
    })
  );
};
```

**SHOULD** implement notification cleanup:

```typescript
// Clean up old read notifications
export const cleanupOldNotifications = internalMutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const oldNotifications = await ctx.db
      .query('notifications')
      .filter((q) =>
        q.and(
          q.eq(q.field('read'), true),
          q.lt(q.field('createdAt'), thirtyDaysAgo)
        )
      )
      .collect();

    // Delete in batches to avoid transaction limits
    const batchSize = 100;
    for (let i = 0; i < oldNotifications.length; i += batchSize) {
      const batch = oldNotifications.slice(i, i + batchSize);
      await Promise.all(
        batch.map((notification) => ctx.db.delete(notification._id))
      );
    }
  },
});
```

### 4.3 Notification Creation and Validation

**MUST** use internal mutations for system-generated notifications:

```typescript
// CORRECT: Internal mutation for notification creation
export const createNotification = internalMutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal('follow'),
      v.literal('rating'),
      v.literal('new_vibe'),
      v.literal('new_rating')
    ),
    triggerUserId: v.string(),
    targetId: v.string(),
    title: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Prevent self-notifications
    if (args.userId === args.triggerUserId) {
      return null;
    }

    // Validate users exist
    const [receivingUser, triggerUser] = await Promise.all([
      ctx.db
        .query('users')
        .withIndex('byExternalId', (q) => q.eq('externalId', args.userId))
        .first(),
      ctx.db
        .query('users')
        .withIndex('byExternalId', (q) =>
          q.eq('externalId', args.triggerUserId)
        )
        .first(),
    ]);

    if (!receivingUser) {
      throw new Error('Receiving user not found');
    }

    if (!triggerUser) {
      throw new Error('Triggering user not found');
    }

    // Check for duplicate notifications (prevent spam)
    const recentNotification = await ctx.db
      .query('notifications')
      .withIndex('byUser', (q) => q.eq('userId', args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field('type'), args.type),
          q.eq(q.field('triggerUserId'), args.triggerUserId),
          q.eq(q.field('targetId'), args.targetId),
          q.gt(q.field('createdAt'), Date.now() - 60000) // Within last minute
        )
      )
      .first();

    if (recentNotification) {
      return null; // Don't create duplicate notification
    }

    // Create notification
    const notificationId = await ctx.db.insert('notifications', {
      userId: args.userId,
      type: args.type,
      triggerUserId: args.triggerUserId,
      targetId: args.targetId,
      title: args.title,
      description: args.description,
      metadata: args.metadata,
      read: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});
```

**MUST** validate notification ownership for mutations:

```typescript
// Validate ownership before allowing notification modifications
export const markAsRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, { notificationId }) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    const notification = await ctx.db.get(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== currentUser.externalId) {
      throw new Error('Not authorized to update this notification');
    }

    await ctx.db.patch(notificationId, { read: true });
  },
});
```

## 5. Notification UI Rules

### 5.1 Component Architecture

**MUST** implement responsive notification UI:

```typescript
// Mobile-first notification dropdown/drawer
const NotificationDropdown = ({ open, onOpenChange }: Props) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const content = <NotificationContent />;

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
};
```

### 5.2 Notification Badge and Indicators

**MUST** implement proper notification badges:

```typescript
// Themed notification badge with count
const NotificationBadge = ({ count }: { count: number }) => {
  if (!count || count === 0) return null;

  return (
    <span className="bg-theme-primary text-primary-foreground absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-medium">
      {count > 9 ? '9+' : count}
    </span>
  );
};

// Usage in header
<div className="relative">
  <Bell className="h-4 w-4" />
  <NotificationBadge count={unreadCount} />
</div>
```

**MUST** provide visual indicators for unread notifications:

```typescript
// Unread notification styling
const NotificationItem = ({ notification }: { notification: Notification }) => {
  return (
    <div className={`flex items-start gap-3 p-3 ${
      !notification.read ? 'bg-muted/30' : ''
    }`}>
      {!notification.read && (
        <div className="bg-theme-primary h-2 w-2 rounded-full"></div>
      )}
      {/* Notification content */}
    </div>
  );
};
```

### 5.3 Notification Actions and Interactions

**MUST** implement proper notification interaction patterns:

```typescript
// Handle notification click with read state update
const handleNotificationClick = async (notification: Notification) => {
  // Mark as read if unread
  if (!notification.read && notification._id) {
    markAsReadMutation.mutate({ notificationId: notification._id });
  }

  // Navigate to target
  const { href } = getNotificationContent(notification);
  router.push(href);

  // Close dropdown
  onOpenChange(false);
};
```

**SHOULD** implement bulk actions:

```typescript
// Bulk mark as read functionality
const markAllAsRead = async (type?: string) => {
  try {
    await markAllAsReadMutation.mutateAsync({ type });
    // Optimistically update UI
    queryClient.invalidateQueries(['notifications']);
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
  }
};
```

### 5.4 Empty States and Loading

**MUST** provide contextual empty states:

```typescript
// Context-aware empty states
const getEmptyStateContent = (filter: NotificationFilterType) => {
  switch (filter) {
    case 'follows':
      return {
        icon: Users,
        title: 'no new followers',
        description: "when someone follows you, you'll see them here",
        action: 'find people to follow',
        href: '/discover',
      };

    case 'likes':
      return {
        icon: Heart,
        title: 'no likes yet',
        description: "when someone rates your vibes, you'll see them here",
        action: 'share a vibe',
        href: '/',
      };

    default:
      return {
        icon: Bell,
        title: 'no notifications yet',
        description: "when things happen, you'll see them here",
        action: 'explore vibechecc',
        href: '/',
      };
  }
};
```

**MUST** implement proper loading states:

```typescript
// Loading and error states
const NotificationsList = () => {
  const { data, isLoading, error, hasNextPage, fetchNextPage } = useNotificationsInfinite();

  if (isLoading) {
    return (
      <div className="space-y-3 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground text-sm">
          Failed to load notifications
        </p>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  // Render notifications...
};
```

### 5.5 Animation and Transitions

**SHOULD** implement smooth animations:

```typescript
// Notification entrance animations
const NotificationItem = ({ notification, index }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="notification-item"
    >
      {/* Notification content */}
    </motion.div>
  );
};
```

**SHOULD** provide feedback for user actions:

```typescript
// Toast feedback for notification actions
const handleMarkAllAsRead = async () => {
  try {
    await markAllAsReadMutation.mutateAsync();
    toast.success('All notifications marked as read');
  } catch (error) {
    toast.error('Failed to mark notifications as read');
  }
};
```

## 6. Integration and Triggering Rules

### 6.1 Cross-Feature Integration

**MUST** trigger notifications from other features:

```typescript
// Example: Follow notification from follows system
export const followUser = mutation({
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Create follow relationship
    const followId = await ctx.db.insert('follows', {
      followerId: currentUser.externalId,
      followingId: args.followingId,
      createdAt: Date.now(),
    });

    // Trigger notification
    await ctx.runMutation(internal.notifications.createNotification, {
      userId: args.followingId,
      type: 'follow',
      triggerUserId: currentUser.externalId,
      targetId: currentUser.externalId,
      title: `${currentUser.username || 'Someone'} followed you`,
      description: 'Check out their profile',
      metadata: {
        followerUsername: currentUser.username,
      },
    });

    return followId;
  },
});
```

### 6.2 Notification Preferences Integration

**SHOULD** check preferences before creating notifications:

```typescript
// Check user preferences before notification creation
const shouldCreateNotification = async (
  ctx: QueryCtx,
  userId: string,
  type: NotificationType
) => {
  const user = await ctx.db
    .query('users')
    .withIndex('byExternalId', (q) => q.eq('externalId', userId))
    .first();

  if (!user) return false;

  const preferences = user.notificationPreferences || {
    follows: true,
    ratings: true,
    newVibes: false,
    newRatings: true,
  };

  return preferences[type] !== false;
};
```

## 7. Performance and Optimization Rules

### 7.1 Query Optimization

**MUST** use pagination for notification lists:

```typescript
// Efficient pagination for notifications
export const getNotificationsInfinite = ({
  enabled = true,
  queryKeyPrefix = ['notifications'],
}: Options) => {
  return useInfiniteQuery({
    queryKey: [...queryKeyPrefix, 'infinite'],
    queryFn: ({ pageParam }) =>
      convex.query(api.notifications.getNotifications, {
        cursor: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    enabled,
  });
};
```

**SHOULD** implement conditional queries for better performance:

```typescript
// Only fetch notifications when dropdown is open
const notificationQuery = useNotificationsInfinite(
  filter,
  { enabled: open } // Only run when dropdown is open
);
```

### 7.2 Caching and Local Storage

**MUST** cache notification preferences:

```typescript
// Cache filter preferences in localStorage
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

### 7.3 Infinite Scroll Implementation

**MUST** implement efficient infinite scroll:

```typescript
// Intersection observer for infinite scroll
const { ref: loadMoreRef, inView } = useInView();

useEffect(() => {
  if (inView && notificationQuery.hasNextPage && !notificationQuery.isFetchingNextPage) {
    notificationQuery.fetchNextPage();
  }
}, [inView, notificationQuery]);

// In render
{hasNextPage && (
  <div ref={loadMoreRef} className="flex items-center justify-center py-4">
    {isFetchingNextPage ? (
      <div className="text-muted-foreground text-sm">loading more...</div>
    ) : (
      <Button variant="ghost" onClick={() => fetchNextPage()}>
        load more notifications
      </Button>
    )}
  </div>
)}
```

## 8. Security and Privacy Rules

### 8.1 Authorization and Access Control

**MUST** validate notification ownership:

```typescript
// CORRECT: Validate ownership in all notification mutations
export const deleteNotification = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, { notificationId }) => {
    const currentUser = await getCurrentUserOrThrow(ctx);
    const notification = await ctx.db.get(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== currentUser.externalId) {
      throw new Error('Not authorized to delete this notification');
    }

    await ctx.db.delete(notificationId);
  },
});
```

### 8.2 Data Privacy

**MUST** protect sensitive notification data:

- Never expose notification content to unauthorized users
- Encrypt sensitive notification metadata if necessary
- Respect user privacy settings in notification visibility

**SHOULD** implement notification privacy controls:

```typescript
// Privacy-aware notification creation
const createPrivateNotification = async (
  ctx: MutationCtx,
  notification: NotificationData
) => {
  // Check if receiving user allows notifications from trigger user
  const privacySettings = await getUserPrivacySettings(
    ctx,
    notification.userId
  );

  if (!privacySettings.allowNotificationsFrom(notification.triggerUserId)) {
    return null; // Don't create notification
  }

  return await createNotification(ctx, notification);
};
```

## 9. Testing and Quality Assurance

### 9.1 Notification System Testing

**MUST** test notification creation and delivery:

```typescript
// Test notification creation from different triggers
test('should create follow notification', async () => {
  const t = convexTest(schema, modules);

  // Create test users
  const follower = await t.mutation(api.users.createUser, testUserData1);
  const following = await t.mutation(api.users.createUser, testUserData2);

  // Create follow relationship
  await t.mutation(
    api.follows.followUser,
    { followingId: following.externalId },
    { identity: { subject: follower.externalId } }
  );

  // Verify notification was created
  const notifications = await t.query(
    api.notifications.getNotifications,
    {},
    { identity: { subject: following.externalId } }
  );

  expect(notifications.notifications).toHaveLength(1);
  expect(notifications.notifications[0].type).toBe('follow');
});
```

**MUST** test notification UI components:

```typescript
// Test notification component rendering and interactions
test('should render notification item correctly', () => {
  const mockNotification = {
    _id: '123',
    type: 'follow',
    title: 'John followed you',
    description: 'Check out their profile',
    read: false,
    createdAt: Date.now(),
    triggerUser: { username: 'john', first_name: 'John' },
  };

  render(<NotificationItem notification={mockNotification} />);

  expect(screen.getByText('John followed you')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /view profile/i })).toBeInTheDocument();
});
```

### 9.2 Performance Testing

**SHOULD** test notification query performance:

- Test with large numbers of notifications
- Verify pagination efficiency
- Test real-time update performance

## 10. Future Enhancement Opportunities

### 10.1 Advanced Notification Features

**COULD** implement notification grouping:

```typescript
// Group similar notifications together
const groupNotifications = (notifications: Notification[]) => {
  return notifications.reduce(
    (groups, notification) => {
      const key = `${notification.type}-${notification.targetId}`;
      if (!groups[key]) {
        groups[key] = [notification];
      } else {
        groups[key].push(notification);
      }
      return groups;
    },
    {} as Record<string, Notification[]>
  );
};
```

**COULD** add notification snoozing:

```typescript
// Snooze notifications for later
export const snoozeNotification = mutation({
  args: {
    notificationId: v.id('notifications'),
    snoozeUntil: v.number(), // Timestamp
  },
  handler: async (ctx, { notificationId, snoozeUntil }) => {
    // Implementation for notification snoozing
  },
});
```

### 10.2 Analytics and Insights

**COULD** track notification engagement:

```typescript
// Track notification click-through rates
const trackNotificationEngagement = async (
  notificationId: string,
  action: 'viewed' | 'clicked' | 'dismissed'
) => {
  await convex.mutation(api.analytics.trackNotificationEngagement, {
    notificationId,
    action,
    timestamp: Date.now(),
  });
};
```

## Best Practices Summary

1. **Use real-time Convex queries** for live notification updates
2. **Implement proper indexing** for efficient notification queries
3. **Validate notification ownership** in all mutation operations
4. **Prevent self-notifications** and duplicate notifications
5. **Enrich notifications** with related user data for better UX
6. **Use internal mutations** for system-generated notifications
7. **Implement mobile-responsive** notification UI patterns
8. **Provide contextual empty states** and loading indicators
9. **Cache user preferences** and implement efficient filtering
10. **Test notification creation** and UI interactions thoroughly
11. **Respect user privacy** and notification preferences
12. **Use pagination** and infinite scroll for performance
13. **Implement proper error handling** and fallback states
14. **Track notification engagement** for system optimization
15. **Follow established theming** patterns for visual consistency
