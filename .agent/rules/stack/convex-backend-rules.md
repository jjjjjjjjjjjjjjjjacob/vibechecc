# Convex Backend Rules

Comprehensive rules for Convex backend development in vibechecc.

## Database Schema Rules

### Table Design

**MUST use Convex schema validators for all tables:**

```typescript
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const schema = defineSchema({
  tableName: defineTable({
    field: v.string(),
    optionalField: v.optional(v.string()),
    arrayField: v.array(v.string()),
    objectField: v.object({ nested: v.string() }),
  }),
});
```

### Indexing Strategy

**MUST create indexes for all query patterns:**

- **Primary indexes**: Use for single-field lookups
- **Compound indexes**: Use for multi-field queries
- **Search indexes**: Use for text search functionality

```typescript
// Single field index
.index('byUserId', ['userId'])

// Compound index (order matters for query efficiency)
.index('byUserAndDate', ['userId', 'createdAt'])

// Search index with filter fields
.searchIndex('searchTitle', {
  searchField: 'title',
  filterFields: ['userId', 'tags', 'visibility']
})
```

**MUST use indexes over filters for performance:**

```typescript
// ✅ Good - using index
const messages = await ctx.db
  .query('messages')
  .withIndex('by_channel', (q) => q.eq('channel', channel))
  .collect();

// ❌ Bad - using filter
const messages = await ctx.db
  .query('messages')
  .filter((q) => q.eq(q.field('channel'), channel))
  .collect();
```

### Field Naming Conventions

**MUST use consistent field naming:**

- **External IDs**: Use `externalId` for Clerk user IDs
- **Timestamps**: Use `createdAt`, `updatedAt` in ISO string or number format
- **Foreign keys**: Use descriptive names like `createdById`, `vibeId`, `userId`
- **Boolean flags**: Use descriptive names like `onboardingCompleted`, `deleted`, `suspended`

**MUST include timestamps for all entities:**

```typescript
{
  createdAt: v.string(), // or v.number() for Unix timestamps
  updatedAt: v.optional(v.string()),
}
```

### Soft Delete Pattern

**MUST use soft deletes for user-facing content:**

```typescript
{
  visibility: v.optional(v.union(v.literal('public'), v.literal('deleted'))),
  deletedAt: v.optional(v.string()),
  deletionReason: v.optional(v.string()),
}
```

## Function Organization Rules

### Function Types and Usage

**MUST use appropriate function types:**

- **Queries**: Read-only operations, auto-subscribe to changes
- **Mutations**: Data modifications, transactional
- **Actions**: External API calls, can call mutations/queries
- **Internal functions**: Server-side only, bypass authentication

### Authentication Pattern

**MUST implement consistent authentication:**

```typescript
export const authenticatedFunction = mutation({
  args: {
    /* args */
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', identity.subject))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // Function logic here
  },
});
```

### Helper Functions

**MUST use standardized helper functions:**

```typescript
// From users.ts - use these consistently
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await userByExternalId(ctx, identity.subject);
}

export async function getCurrentUserOrThrow(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error('User not authenticated');
  return user;
}
```

### Internal Functions

**MUST use internal functions for sensitive operations:**

```typescript
export const internalFunction = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Direct database access without authentication
    // Only callable from other Convex functions or actions
  },
});
```

## Authentication Rules

### Context Usage

**MUST use `ctx.auth.getUserIdentity()` for authentication:**

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error('Authentication required');
}
```

### User Validation

**MUST validate user exists after authentication:**

```typescript
const user = await ctx.db
  .query('users')
  .withIndex('byExternalId', (q) => q.eq('externalId', identity.subject))
  .unique();

if (!user) {
  throw new Error('User not found');
}
```

### Authorization Patterns

**MUST implement proper authorization checks:**

```typescript
// Own resource check
if (resource.userId !== identity.subject) {
  throw new Error('Not authorized to access this resource');
}

// Admin check (from AuthUtils.requireAdmin)
const currentUser = await getCurrentUser(ctx);
if (!currentUser?.isAdmin) {
  throw new Error('Admin access required');
}
```

## Performance Rules

### Query Optimization

**MUST follow these performance rules:**

1. **Always use indexes** instead of filters for queries
2. **Limit result sets** with `.take()` when appropriate
3. **Avoid N+1 queries** by batching related data
4. **Cache computed values** when expensive to calculate

```typescript
// ✅ Efficient aggregation pattern
const ratings = await ctx.db
  .query('ratings')
  .withIndex('by_vibe', (q) => q.eq('vibeId', vibeId))
  .collect();

const byEmoji = ratings.reduce(
  (acc, rating) => {
    if (!acc[rating.emoji]) {
      acc[rating.emoji] = { count: 0, total: 0, ratings: [] };
    }
    acc[rating.emoji].count++;
    acc[rating.emoji].total += rating.rating;
    acc[rating.emoji].ratings.push(rating);
    return acc;
  },
  {} as Record<string, EmojiStats>
);
```

### Mutation Optimization

**MUST optimize mutations:**

- **Batch related updates** together in single mutation
- **Minimize database reads** within mutations
- **Use optimistic updates** on frontend where appropriate

### Transaction Limits

**MUST respect Convex transaction limits:**

- Keep mutations focused and small
- Batch large operations into chunks
- Use actions for heavy processing that doesn't need transactions

## Testing Rules

### Test File Organization

**MUST organize tests by domain:**

```
apps/convex/convex/
├── users.test.ts        # User-related function tests
├── vibes.test.ts        # Vibe-related function tests
├── ratings.test.ts      # Rating-related function tests
└── __tests__/
    ├── integration/     # Cross-domain integration tests
    └── setup.ts        # Test setup and utilities
```

### Convex Test Setup

**MUST use convex-test for backend testing:**

```typescript
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import schema from './schema';
import { modules } from './test.setup';

test('should create user successfully', async () => {
  const t = convexTest(schema, modules);

  // Setup test data
  const identity = { subject: 'test-user-123' };

  // Run mutation
  const result = await t.mutation(
    api.users.create,
    { username: 'testuser' },
    { identity }
  );

  expect(result).toBeDefined();
  expect(result.username).toBe('testuser');
});
```

### Test Data Management

**MUST use consistent test data patterns:**

```typescript
// Create deterministic test data
const testUser = {
  externalId: 'test-user-123',
  username: 'testuser',
  email: 'test@example.com',
  created_at: Date.now(),
};

// Clean up after tests
afterEach(async () => {
  await t.mutation(api.test.cleanup);
});
```

### Mock Authentication

**MUST use identity objects for auth testing:**

```typescript
const identity = {
  subject: 'clerk-user-id',
  tokenIdentifier: 'test-token',
};

const result = await t.mutation(api.protected.function, { args }, { identity });
```

## Seeding Rules

### Seed Architecture

**MUST use Convex-native seeding approach:**

- **Actions** for public API endpoints (`seed:seed`, `seed:clear`)
- **Internal mutations** for actual data manipulation
- **Single comprehensive seed** for development consistency

```typescript
// Public action
export const seed = action({
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.clearAllData);
    await ctx.runMutation(internal.seed.seedUsers, { count: 20 });
    await ctx.runMutation(internal.seed.seedVibes, { count: 25 });
  },
});

// Internal mutation
export const seedUsers = internalMutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    // Direct database operations
  },
});
```

### Development Data Strategy

**MUST create comprehensive development data:**

- **20 users** with diverse profiles and interests
- **25+ vibes** covering various topics and moods
- **Realistic ratings** with contextual reviews
- **Search data** including history and trending terms

### Seed Command Integration

**MUST use direct Convex commands in package.json:**

```json
{
  "seed": "bunx convex run seed:seed",
  "seed:clear": "bunx convex run seed:clear"
}
```

### Clear Database Pattern

**MUST clear in dependency order:**

```typescript
export const clearAllData = internalMutation({
  handler: async (ctx) => {
    // Order matters - clear dependent tables first
    const tables = [
      'ratings', // References vibes and users
      'vibes', // References users
      'users', // No dependencies
    ];

    for (const table of tables) {
      const items = await ctx.db.query(table).collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
    }
  },
});
```

### Seeding Anti-patterns

**MUST NOT do these things:**

- ❌ Create standalone scripts directory for Convex operations
- ❌ Mix Action/Mutation database access patterns
- ❌ Use hardcoded file paths or directory assumptions
- ❌ Create multiple seed variants during early development

## Security Rules

### Input Validation

**MUST validate all inputs using Convex validators:**

```typescript
export const createVibe = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Convex automatically validates args against schema
  },
});
```

### Data Access Control

**MUST implement proper data access controls:**

- **Public data**: Return limited fields for non-authenticated users
- **Private data**: Require authentication and ownership checks
- **Admin data**: Require admin privileges

```typescript
// Public profile data
return {
  _id: user._id,
  username: user.username,
  image_url: user.image_url,
  bio: user.bio,
  // DO NOT expose: interests, socials, email, etc.
};
```

### Webhook Security

**MUST verify webhook signatures:**

```typescript
// Use Clerk's webhook verification in http.ts
const payload = await request.text();
const headers = Object.fromEntries(request.headers.entries());

try {
  const evt = await Webhook.construct(payload, headers, CLERK_WEBHOOK_SECRET);
  // Process verified webhook
} catch (err) {
  console.error('Webhook verification failed:', err.message);
  return new Response('Unauthorized', { status: 401 });
}
```

## Error Handling Rules

### Error Messages

**MUST use descriptive error messages:**

```typescript
if (!user) {
  throw new Error('User not found');
}

if (user.suspended) {
  throw new Error('User account is suspended');
}

if (!identity.subject) {
  throw new Error('Authentication required');
}
```

### Error Logging

**MUST log errors appropriately:**

```typescript
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Internal server error');
}
```

### Environment-Specific Behavior

**MUST handle development vs production:**

```typescript
// Development-only functions
if (process.env.NODE_ENV === 'production') {
  throw new Error('Debug functions not available in production');
}
```

## File Organization Rules

### Domain-Based Structure

**MUST organize functions by domain:**

```
apps/convex/convex/
├── users.ts           # User management
├── vibes.ts           # Vibe CRUD operations
├── ratings.ts         # Rating system
├── search.ts          # Search functionality
├── admin/             # Admin-only functions
│   ├── users.ts
│   └── dashboard.ts
└── lib/               # Shared utilities
    └── validators.ts
```

### Import Patterns

**MUST use consistent imports:**

```typescript
// Convex runtime imports
import { query, mutation, action, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal, api } from './_generated/api';

// Type imports (for shared types)
import type { User, Vibe, Rating } from '@vibechecc/types';

// Local utilities
import { getCurrentUser, userByExternalId } from './users';
import { SecurityValidators } from './lib/securityValidators';
```

### Function Export Pattern

**MUST export functions with descriptive names:**

```typescript
// ✅ Good - descriptive function names
export const getUserById = query({...});
export const createVibe = mutation({...});
export const searchVibes = action({...});

// ❌ Bad - generic function names
export const get = query({...});
export const create = mutation({...});
export const search = action({...});
```
