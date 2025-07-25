# Seed Approach Learnings

## Key Principle: Single Seed Command

During early development, maintain **ONE comprehensive seed command** that creates a consistent snapshot of development data.

### Why Single Seed?

- **Consistency**: Everyone on the team works with the same data
- **Predictability**: Clear expectations about what data exists
- **Simplicity**: No confusion about which seed variant to use
- **Development Focus**: During early stages, we need rich data for testing all features

### Current Seed Configuration

- **20 users** with diverse profiles and interests
- **25 vibes** covering various topics and moods
- **Emoji database** imported from organized emoji files
- **Ratings** with emoji reactions and reviews
- **Search data** including history and trending terms
- **Search metrics** for analytics testing

### Implementation Details

1. **Consolidated seed.ts**: Single file at `apps/convex/convex/seed.ts`
2. **Emoji organization**: Emojis stored in `apps/convex/convex/seed/emojis/` by category
3. **Commands**:
   ```bash
   bun run seed        # Seeds all data
   bun run seed:clear  # Clears all data
   ```

### When This Might Change

- **Production launch**: May need minimal seed for production DB
- **Performance testing**: May need massive data sets
- **Demo environments**: May need curated showcase data

But until then, **keep it simple with one comprehensive seed**.

### Anti-patterns to Avoid

- ❌ Multiple seed variants (seed, seed:minimal, seed:enhanced)
- ❌ Conditional seeding based on environment during development
- ❌ Sparse data that doesn't exercise all features
- ❌ Complex seed orchestration scripts

### Related Files

- `apps/convex/convex/seed.ts` - Main seed implementation
- `apps/convex/convex/seed/emojis/` - Organized emoji data
- `package.json` - Seed command definitions
