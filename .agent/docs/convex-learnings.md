# Backend (apps/convex) Development Learnings

## Database Schema Design

### Emoji Ratings Implementation
**When to reference**: Adding rating/feedback features

- Separate emoji ratings from reactions for flexibility
- Always include timestamps for sorting
- Make review comments required to improve quality
- Support decimal ratings for more granularity

**Schema pattern**:
```typescript
emojiRatings: defineTable({
  vibe_id: v.id("vibes"),
  user_id: v.id("users"),
  emoji: v.string(),
  rating: v.number(), // 1-5, supports decimals
  comment: v.string(), // Required
  tags: v.optional(v.array(v.string())),
  created_at: v.number(),
  updated_at: v.number(),
})
.index("by_vibe", ["vibe_id"])
.index("by_user", ["user_id"])
.index("by_vibe_user", ["vibe_id", "user_id"])
```

### Index Strategy
**When to reference**: Optimizing database queries

- Always use indexes for queries, not filters
- Create composite indexes for multi-field queries
- Index foreign key relationships
- Consider query patterns when designing indexes

## Function Patterns

### Authentication Pattern
**When to reference**: Writing authenticated functions

```typescript
export const myFunction = mutation({
  args: { /* args */ },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", q => q.eq("external_id", identity.subject))
      .unique();
      
    if (!user) {
      throw new Error("User not found");
    }
    
    // Function logic here
  },
});
```

### Aggregation Pattern
**When to reference**: Computing statistics

```typescript
// Get aggregated data efficiently
const ratings = await ctx.db
  .query("emojiRatings")
  .withIndex("by_vibe", q => q.eq("vibe_id", vibeId))
  .collect();

const byEmoji = ratings.reduce((acc, rating) => {
  if (!acc[rating.emoji]) {
    acc[rating.emoji] = { 
      count: 0, 
      total: 0,
      ratings: [] 
    };
  }
  acc[rating.emoji].count++;
  acc[rating.emoji].total += rating.rating;
  acc[rating.emoji].ratings.push(rating);
  return acc;
}, {} as Record<string, EmojiStats>);
```

## Seeding Strategies

### Enhanced Seeding
**When to reference**: Creating comprehensive test data

- Use deterministic random data for consistency
- Create realistic relationships between entities
- Include edge cases in seed data
- Ensure all required fields are populated

### Clear Database Pattern
**When to reference**: Implementing data cleanup

```typescript
// Clear in dependency order
const tables = [
  "reactions",
  "emojiRatings", 
  "ratings",
  "vibes",
  "users"
];

for (const table of tables) {
  const items = await ctx.db.query(table).collect();
  for (const item of items) {
    await ctx.db.delete(item._id);
  }
}
```

## Testing Patterns

### Convex Test Setup
**When to reference**: Writing backend tests

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { modules } from "./test.setup";

test("should do something", async () => {
  const t = convexTest(schema, modules);
  
  // Setup test user
  const identity = { subject: "test-user" };
  
  // Run mutation
  const result = await t.mutation(api.vibes.createVibe, {
    title: "Test",
    // ... args
  }, { identity });
  
  expect(result).toBeDefined();
});
```

## Common Gotchas

### Webhook Verification
**When to reference**: Implementing webhook handlers

- Always verify webhook signatures
- Handle webhook replay attacks
- Return proper HTTP status codes
- Log webhook processing for debugging

### Transaction Limits
**When to reference**: Bulk operations

- Convex has transaction size limits
- Batch large operations into chunks
- Use pagination for large result sets
- Consider using actions for heavy processing

### Real-time Considerations
**When to reference**: Designing reactive features

- Queries automatically subscribe to data changes
- Mutations trigger reactive updates
- Keep queries focused for better performance
- Avoid computed fields in hot paths

### Type Safety
**When to reference**: Defining function arguments

```typescript
import { v } from "convex/values";

// Use Convex validators for runtime type checking
export const myFunction = mutation({
  args: {
    id: v.id("vibes"),
    rating: v.number(),
    optional: v.optional(v.string()),
    union: v.union(v.literal("a"), v.literal("b")),
    array: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // args is fully typed
  },
});
```

## Performance Tips

### Query Optimization
**When to reference**: Slow queries

1. Always use indexes over filters
2. Limit result sets with `.take()`
3. Project only needed fields
4. Cache computed values when appropriate

### Mutation Optimization
**When to reference**: Slow mutations

1. Minimize database reads in mutations
2. Batch related updates together
3. Use optimistic updates on frontend
4. Avoid unnecessary validations