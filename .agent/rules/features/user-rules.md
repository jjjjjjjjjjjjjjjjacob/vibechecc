# User Management Rules - vibechecc

This document defines comprehensive rules for user management in the vibechecc platform, covering profile management, authentication, preferences, social features, and data consistency patterns.

## 1. User Profile Rules

### 1.1 Profile Creation and Validation

**MUST** use Clerk external ID as primary identifier:

```typescript
// CORRECT: Always use externalId for user identification
const user = await userByExternalId(ctx, identity.subject);

// INCORRECT: Never use internal _id for user identification
const user = await ctx.db.get(userId);
```

**MUST** validate required fields during profile creation:

```typescript
// REQUIRED fields for user creation
{
  externalId: identity.subject, // MUST be present from Clerk
  created_at: Date.now(),
  updated_at: Date.now(),
}

// OPTIONAL fields that can be synced from Clerk
{
  username: identity.nickname || undefined,
  first_name: identity.givenName || undefined,
  last_name: identity.familyName || undefined,
  image_url: identity.pictureUrl || undefined,
  profile_image_url: identity.pictureUrl || undefined,
}
```

**MUST** handle username uniqueness constraints:

- Usernames MUST be unique across the platform
- Use `byUsername` index for efficient lookups
- Validate uniqueness before allowing username updates
- Provide clear error messages for username conflicts

### 1.2 Profile Updates and Data Integrity

**MUST** update timestamps on profile changes:

```typescript
// CORRECT: Always update timestamp on profile modifications
await ctx.db.patch(userId, {
  bio: newBio,
  updated_at: Date.now(),
});

// INCORRECT: Missing timestamp update
await ctx.db.patch(userId, { bio: newBio });
```

**MUST** validate profile data before updates:

```typescript
// Bio length validation
if (bio && bio.length > 500) {
  throw new Error('Bio must be 500 characters or less');
}

// Username format validation
const usernameRegex = /^[a-zA-Z0-9_-]+$/;
if (username && !usernameRegex.test(username)) {
  throw new Error(
    'Username can only contain letters, numbers, hyphens, and underscores'
  );
}
```

**SHOULD** sanitize user-generated content:

- Strip potentially harmful HTML/scripts from bio and social links
- Validate URL formats for social media links
- Normalize username formatting (lowercase, trim whitespace)

### 1.3 Profile Display and Privacy

**MUST** respect user privacy settings:

- Only return public profile data in search results
- Protect sensitive information (email, phone) from public APIs
- Use role-based access control for admin-only fields

**MUST** provide consistent display name logic:

```typescript
// CORRECT: Consistent display name resolution
export function getUserDisplayName(user: User): string {
  return (
    user.username ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    'Anonymous'
  );
}

// Use in all UI components
const displayName = getUserDisplayName(user);
```

## 2. User Authentication Rules

### 2.1 Authentication Patterns

**MUST** use standardized authentication helpers:

```typescript
// For queries that can gracefully handle unauthenticated users
const currentUser = await getCurrentUser(ctx);
if (!currentUser) {
  return { data: [], message: 'Login to see personalized content' };
}

// For mutations that require authentication
const currentUser = await getCurrentUserOrThrow(ctx);

// For auto-creating users during authenticated operations
const currentUser = await getCurrentUserOrCreate(ctx);
```

**MUST NOT** expose authentication logic in frontend:

```typescript
// CORRECT: Handle auth in backend functions
export const getProfile = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return user ? transformUserForUI(user) : null;
  },
});

// INCORRECT: Checking auth in frontend components
if (user?.isAuthenticated) {
  // Don't rely on client-side auth state
}
```

### 2.2 User Creation and Syncing

**MUST** sync with Clerk webhook events:

```typescript
// Handle Clerk webhook user events
case 'user.created':
case 'user.updated': {
  const userData = evt.data as UserJSON;
  await ctx.runMutation(internal.users.syncUser, {
    clerkId: userData.id,
    username: userData.username,
    firstName: userData.first_name,
    lastName: userData.last_name,
    imageUrl: userData.image_url,
    profileImageUrl: userData.profile_image_url,
  });
  break;
}
```

**MUST** handle OAuth connection syncing:

```typescript
// Sync external OAuth accounts from Clerk
const externalAccounts = userData.external_accounts || [];
for (const account of externalAccounts) {
  const platformMapping = {
    oauth_twitter: 'twitter',
    oauth_x: 'twitter',
    oauth_instagram: 'instagram',
    oauth_tiktok: 'tiktok',
  };

  const platform = platformMapping[account.provider];
  if (platform && account.username) {
    await syncUserSocialConnection(
      ctx,
      userData.id,
      platform,
      account.username
    );
  }
}
```

### 2.3 Session Management

**MUST** validate user sessions in sensitive operations:

- Check authentication before user data modifications
- Validate user ownership before allowing profile updates
- Implement proper session timeout handling

**SHOULD** log authentication events:

```typescript
// Log significant auth events for security monitoring
console.log(`User ${identity.subject} authenticated`);
console.log(`Profile updated for user ${user.externalId}`);
```

## 3. User Preferences Rules

### 3.1 Theme and Customization

**MUST** support custom theme colors:

```typescript
// User theme schema
{
  themeColor: v.optional(v.string()), // Legacy field
  primaryColor: v.optional(v.string()), // Primary gradient color
  secondaryColor: v.optional(v.string()), // Secondary gradient color
}
```

**MUST** validate color formats:

```typescript
// Validate hex color format
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
if (primaryColor && !hexColorRegex.test(primaryColor)) {
  throw new Error('Invalid color format. Use hex format like #FF0000');
}
```

**SHOULD** provide default theme fallbacks:

```typescript
// Default theme color resolution
export function getUserThemeColors(user: User) {
  return {
    primary: user.primaryColor || '#ec4899', // Default pink
    secondary: user.secondaryColor || '#f97316', // Default orange
  };
}
```

### 3.2 Interest and Content Preferences

**MUST** track user interests for personalization:

```typescript
// Interest tracking schema
{
  interests: v.optional(v.array(v.string())), // User selected interests/tags
  onboardingCompleted: v.optional(v.boolean()), // Onboarding state
}
```

**SHOULD** update interests based on user behavior:

- Track vibe creation tags as potential interests
- Monitor rating patterns for interest inference
- Update interest scores based on engagement

### 3.3 Notification Preferences

**MUST** provide granular notification controls:

```typescript
// Notification preferences schema (future enhancement)
{
  notificationPreferences: v.optional(v.object({
    follows: v.boolean(), // Follow notifications enabled
    ratings: v.boolean(), // Rating notifications enabled
    newVibes: v.boolean(), // New vibe notifications enabled
    emailDigests: v.boolean(), // Email digest enabled
    pushNotifications: v.boolean(), // Browser push enabled
  })),
}
```

**SHOULD** respect user notification preferences:

- Check preferences before sending notifications
- Provide easy opt-out mechanisms
- Honor unsubscribe requests immediately

## 4. User Social Rules

### 4.1 Follow System Integration

**MUST** maintain follow count accuracy:

```typescript
// Update follow counts atomically
export const followUser = mutation({
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Create follow relationship
    await ctx.db.insert('follows', {
      followerId: currentUser.externalId,
      followingId: args.followingId,
      createdAt: Date.now(),
    });

    // Update counts atomically
    await Promise.all([
      updateFollowerCount(ctx, args.followingId, 1),
      updateFollowingCount(ctx, currentUser.externalId, 1),
    ]);
  },
});
```

**MUST** prevent self-following:

```typescript
// Validate follow relationships
if (currentUser.externalId === args.followingId) {
  throw new Error('Cannot follow yourself');
}

// Check for existing relationship
const existingFollow = await ctx.db
  .query('follows')
  .withIndex('byFollowerAndFollowing', (q) =>
    q
      .eq('followerId', currentUser.externalId)
      .eq('followingId', args.followingId)
  )
  .first();

if (existingFollow) {
  throw new Error('Already following this user');
}
```

### 4.2 Social Profile Enhancement

**MUST** validate social media URLs:

```typescript
// Social media URL validation
const socialValidators = {
  twitter: (url: string) =>
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+$/.test(url),
  instagram: (url: string) =>
    /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+$/.test(url),
  tiktok: (url: string) =>
    /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+$/.test(url),
  website: (url: string) => /^https?:\/\/[^\s]+$/.test(url),
};
```

**SHOULD** normalize social media handles:

```typescript
// Extract and normalize social handles
function normalizeSocialHandle(platform: string, input: string): string {
  // Remove common prefixes and clean up handles
  return input.replace(/^@/, '').replace(/^https?:\/\/[^\/]+\//, '');
}
```

### 4.3 User Discovery and Suggestions

**MUST** provide follow suggestions based on:

- Mutual connections (friends of friends)
- Similar interests and activity patterns
- Recently active users
- Popular content creators

**SHOULD** implement privacy-respecting discovery:

- Allow users to opt out of suggestions
- Respect privacy settings in suggestion algorithms
- Avoid suggesting blocked or muted users

## 5. User Data Rules

### 5.1 External ID and Internal ID Mapping

**MUST** always use external IDs for business logic:

```typescript
// CORRECT: Use external IDs in all business operations
const vibe = await ctx.db
  .query('vibes')
  .withIndex('createdBy', (q) => q.eq('createdById', user.externalId))
  .first();

// INCORRECT: Using internal Convex IDs for business logic
const vibe = await ctx.db
  .query('vibes')
  .withIndex('createdBy', (q) => q.eq('createdById', user._id))
  .first();
```

**MUST** maintain external ID consistency:

- External IDs MUST match Clerk user IDs exactly
- Never modify external IDs after user creation
- Use external IDs in all foreign key relationships

### 5.2 Data Consistency and Integrity

**MUST** implement proper indexing for user queries:

```typescript
// Required indexes for user operations
.index('byExternalId', ['externalId']) // Primary lookup
.index('byUsername', ['username']) // Username searches
.searchIndex('searchUsername', { searchField: 'username' })
.searchIndex('searchBio', { searchField: 'bio' })
```

**MUST** handle user deletion properly:

```typescript
// Soft delete pattern for user accounts
export const deleteUser = mutation({
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Soft delete user
    await ctx.db.patch(user._id, {
      deleted: true,
      deletedAt: Date.now(),
      deletionReason: args.reason || 'User requested deletion',
      updated_at: Date.now(),
    });

    // Clean up user data (optional)
    await cleanupUserData(ctx, user.externalId);
  },
});
```

### 5.3 Data Migration and Compatibility

**MUST** handle schema evolution gracefully:

```typescript
// Handle optional fields that may not exist on older users
const themeColor = user.themeColor || user.primaryColor || '#ec4899';
const displayName = user.username || getUserDisplayName(user);
```

**SHOULD** provide data migration utilities:

- Scripts to backfill missing user data
- Utilities to update user schemas
- Tools to sync with Clerk data changes

## 6. Performance and Optimization Rules

### 6.1 Query Optimization

**MUST** use indexes for all user queries:

```typescript
// CORRECT: Use appropriate indexes
const user = await ctx.db
  .query('users')
  .withIndex('byExternalId', (q) => q.eq('externalId', externalId))
  .first();

// INCORRECT: Using filter without index
const user = await ctx.db
  .query('users')
  .filter((q) => q.eq(q.field('externalId'), externalId))
  .first();
```

**SHOULD** cache frequently accessed user data:

- Cache user display names and avatars
- Precompute follow counts when possible
- Use pagination for large user lists

### 6.2 Data Loading Strategies

**MUST** limit user data exposure:

```typescript
// Transform user data for public consumption
function transformUserForPublic(user: User) {
  return {
    _id: user._id,
    externalId: user.externalId,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    bio: user.bio,
    image_url: user.image_url,
    followerCount: user.followerCount || 0,
    followingCount: user.followingCount || 0,
    // EXCLUDE: email, phone, admin flags, etc.
  };
}
```

**SHOULD** implement efficient user search:

```typescript
// Optimized user search with proper indexing
export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, limit = 10 }) => {
    const results = await ctx.db.search('searchUsername', query).take(limit);

    return results.map(transformUserForPublic);
  },
});
```

## 7. Security and Privacy Rules

### 7.1 Data Protection

**MUST** protect sensitive user information:

- Never expose email addresses in public APIs
- Protect user phone numbers and personal identifiers
- Implement proper access controls for user data

**MUST** validate user ownership for modifications:

```typescript
// CORRECT: Validate ownership before allowing updates
export const updateProfile = mutation({
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    if (currentUser.externalId !== args.userId) {
      throw new Error('Can only update your own profile');
    }

    // Proceed with update
  },
});
```

### 7.2 Admin and Moderation

**MUST** implement proper admin controls:

```typescript
// Admin-only user operations
export const suspendUser = mutation({
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);

    await ctx.db.patch(args.userId, {
      suspended: true,
      suspensionReason: args.reason,
      updated_at: Date.now(),
    });
  },
});
```

**SHOULD** log moderation actions:

- Track all admin actions on user accounts
- Maintain audit logs for user modifications
- Provide transparency tools for affected users

## 8. Error Handling and Validation

### 8.1 Input Validation

**MUST** validate all user inputs:

```typescript
// Comprehensive input validation
const validateUserInput = {
  username: (value: string) => {
    if (!value || value.length < 2) throw new Error('Username too short');
    if (value.length > 30) throw new Error('Username too long');
    if (!/^[a-zA-Z0-9_-]+$/.test(value))
      throw new Error('Invalid username characters');
  },
  bio: (value: string) => {
    if (value.length > 500) throw new Error('Bio too long');
  },
  email: (value: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      throw new Error('Invalid email format');
  },
};
```

### 8.2 Error Messages

**MUST** provide clear, actionable error messages:

```typescript
// CORRECT: Specific, helpful error messages
if (!user) {
  throw new Error('User not found. Please check the username and try again.');
}

// INCORRECT: Vague error messages
if (!user) {
  throw new Error('Error');
}
```

**SHOULD** implement graceful degradation:

- Return empty states instead of errors when appropriate
- Provide fallback values for missing user data
- Handle network timeouts and retries gracefully

## 9. Testing and Quality Assurance

### 9.1 User Operation Testing

**MUST** test all user CRUD operations:

```typescript
// Example user test pattern
test('should create user with valid data', async () => {
  const t = convexTest(schema, modules);
  const identity = { subject: 'test-user-123' };

  const user = await t.mutation(
    api.users.createUser,
    { username: 'testuser', bio: 'Test bio' },
    { identity }
  );

  expect(user.externalId).toBe('test-user-123');
  expect(user.username).toBe('testuser');
});
```

**MUST** test authentication flows:

- Test authenticated and unauthenticated access
- Verify ownership validation
- Test admin privilege escalation

### 9.2 Data Integrity Testing

**MUST** test user data consistency:

- Test follow count accuracy after follow/unfollow operations
- Verify user search functionality
- Test user deletion and data cleanup

## 10. Integration Patterns

### 10.1 Frontend Integration

**MUST** provide consistent user hooks:

```typescript
// Standardized user hooks for frontend
export function useCurrentUser() {
  return useQuery(api.users.getCurrentUser);
}

export function useUser(userId: string) {
  return useQuery(api.users.getUser, { userId });
}

export function useUserProfile(username: string) {
  return useQuery(api.users.getUserByUsername, { username });
}
```

### 10.2 Cross-Feature Integration

**MUST** integrate with other platform features:

- Notification system for user events
- Search system for user discovery
- Follow system for social connections
- Content creation linking to user profiles

**SHOULD** maintain loose coupling:

- Use standardized user interfaces across features
- Avoid tight dependencies between user management and other systems
- Provide clear APIs for cross-feature integration

## Best Practices Summary

1. **Always use external IDs** for user identification and business logic
2. **Validate all inputs** and provide clear error messages
3. **Maintain data consistency** with proper indexing and atomic operations
4. **Protect sensitive information** and implement proper access controls
5. **Use standardized authentication helpers** throughout the codebase
6. **Test user operations thoroughly** including edge cases and error conditions
7. **Provide graceful degradation** and fallback values for missing data
8. **Sync with Clerk** for authentication and profile data consistency
9. **Implement proper user search** with efficient indexing and pagination
10. **Follow established patterns** for user data transformation and API design
