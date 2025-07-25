import { internalAction, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';

// Main migration action
export const consolidateRatings = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log('Starting rating consolidation migration...');

    try {
      // Check if migration already ran
      const existingMigration = await ctx.runQuery(
        internal.migrations.consolidateRatings.checkMigration
      );
      if (existingMigration) {
        console.log('Migration already completed');
        return { success: true, message: 'Migration already completed' };
      }

      // Step 1: Import emoji database
      console.log('Step 1: Importing emoji database...');
      const emojiResult = await ctx.runMutation(
        internal.migrations.consolidateRatings.importEmojiDatabase
      );
      console.log(`Imported ${emojiResult.count} emojis`);

      // Step 2: Migrate existing ratings
      console.log('Step 2: Migrating existing ratings...');
      const ratingResult = await ctx.runMutation(
        internal.migrations.consolidateRatings.migrateRatings
      );
      console.log(`Migrated ${ratingResult.count} ratings`);

      // Step 4: Ensure all ratings have emojis
      console.log('Step 4: Ensuring all ratings have emojis...');
      const ensureEmojisResult = await ctx.runMutation(
        internal.migrations.consolidateRatings.ensureAllRatingsHaveEmojis
      );
      console.log(ensureEmojisResult.message);

      // Step 5: Mark migration as complete
      await ctx.runMutation(
        internal.migrations.consolidateRatings.markComplete
      );

      return {
        success: true,
        message: 'Migration completed successfully',
        stats: {
          emojisImported: emojiResult.count,
          ratingsUpdated: ratingResult.count,
          ratingsWithoutEmojisFixed: ensureEmojisResult.count,
        },
      };
    } catch (error) {
      console.error('Migration failed:', error);
      await ctx.runMutation(internal.migrations.consolidateRatings.markFailed, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});

// Check if migration already ran
export const checkMigration = internalMutation({
  args: {},
  handler: async (ctx) => {
    const migration = await ctx.db
      .query('migrations')
      .withIndex('byName', (q) => q.eq('name', 'consolidate-ratings'))
      .first();
    return migration;
  },
});

// Import emoji database with colors
export const importEmojiDatabase = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Import will be handled by the enhanced seed function
    // This is a placeholder that will be called by the seed
    return { count: 0 };
  },
});

// Migrate existing ratings to new format
export const migrateRatings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allRatings = await ctx.db.query('ratings').collect();
    let migratedCount = 0;

    // Default emoji mappings for star ratings
    const starToEmoji: Record<number, string> = {
      5: '🔥', // 5 stars = fire
      4: '😍', // 4 stars = heart eyes
      3: '😊', // 3 stars = smile
      2: '😕', // 2 stars = confused
      1: '😬', // 1 star = grimacing
    };

    for (const rating of allRatings) {
      // Handle old format with nested emojiRating field
      const ratingData = rating as any;

      // Skip if already has emoji (but still check for other issues)
      if (
        'emoji' in ratingData &&
        ratingData.emoji &&
        'value' in ratingData &&
        'createdAt' in ratingData &&
        !('date' in ratingData) &&
        !('emojiRating' in ratingData) &&
        !('rating' in ratingData)
      ) {
        continue;
      }

      // Determine emoji and value
      let emoji: string;
      let value: number;

      // Check if has emojiRating field (old format)
      if (ratingData.emojiRating) {
        emoji = ratingData.emojiRating.emoji;
        value = ratingData.emojiRating.value;
      } else if (ratingData.emoji && ratingData.emoji !== '') {
        // Already has emoji field
        emoji = ratingData.emoji;
        value =
          ratingData.value || ratingData.emojiValue || ratingData.rating || 3;
      } else {
        // Convert star rating to emoji or use default
        const starRating = Math.round(
          ratingData.rating || ratingData.value || 3
        );
        emoji = starToEmoji[starRating] || starToEmoji[3];
        value = starRating;
      }

      // Delete the old document
      await ctx.db.delete(rating._id);

      // Insert new document with correct schema
      await ctx.db.insert('ratings', {
        vibeId: ratingData.vibeId,
        userId: ratingData.userId,
        emoji,
        value,
        review: ratingData.review || `Rated ${value} out of 5`,
        createdAt:
          ratingData.date || ratingData.createdAt || new Date().toISOString(),
        tags: ratingData.tags,
      });

      migratedCount++;
    }

    return { count: migratedCount };
  },
});

// Mark migration as complete
export const markComplete = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.db.insert('migrations', {
      name: 'consolidate-ratings',
      completedAt: new Date().toISOString(),
      status: 'completed',
    });
  },
});

// Mark migration as failed
export const markFailed = internalMutation({
  args: { error: v.string() },
  handler: async (ctx, { error }) => {
    await ctx.db.insert('migrations', {
      name: 'consolidate-ratings',
      completedAt: new Date().toISOString(),
      status: 'failed',
      error,
    });
  },
});

// Ensure all ratings have emojis (can be run multiple times safely)
export const ensureAllRatingsHaveEmojis = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ratingsWithoutEmojis = await ctx.db
      .query('ratings')
      .filter((q) =>
        q.or(
          q.eq(q.field('emoji'), undefined),
          q.eq(q.field('emoji'), null),
          q.eq(q.field('emoji'), '')
        )
      )
      .collect();

    // Default emoji mappings based on value
    const valueToEmoji: Record<number, string> = {
      5: '🔥', // 5 = fire
      4: '😍', // 4 = heart eyes
      3: '😊', // 3 = smile
      2: '😕', // 2 = confused
      1: '😬', // 1 = grimacing
    };

    let updatedCount = 0;

    for (const rating of ratingsWithoutEmojis) {
      const ratingData = rating as any;
      const value = Math.round(ratingData.value || ratingData.rating || 3);
      const emoji = valueToEmoji[value] || valueToEmoji[3];

      await ctx.db.patch(rating._id, { emoji });
      updatedCount++;
    }

    return {
      count: updatedCount,
      message: `Updated ${updatedCount} ratings with default emojis`,
    };
  },
});
