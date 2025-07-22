import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

// Migration to convert existing reactions to emoji ratings
export const migrateReactionsToEmojiRatings = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    startFrom: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    console.log('Starting emoji ratings migration...');

    // Get reactions that could be ratings (have ratingValue or isRating flag)
    let query = ctx.db.query('reactions');
    
    if (args.startFrom) {
      // Resume from a specific ID if provided
      query = query.filter((q) => q.gte(q.field('_id'), args.startFrom));
    }
    
    const reactions = await query.take(batchSize);

    for (const reaction of reactions) {
      try {
        // Check if this reaction should be converted to an emoji rating
        if (reaction.ratingValue && reaction.ratingValue >= 1 && reaction.ratingValue <= 5) {
          // Check if emoji rating already exists
          const existingEmojiRating = await ctx.db
            .query('emojiRatings')
            .withIndex('byUserVibeEmoji', (q) =>
              q
                .eq('userId', reaction.userId)
                .eq('vibeId', reaction.vibeId)
                .eq('emoji', reaction.emoji)
            )
            .first();

          if (!existingEmojiRating) {
            // Get emoji metadata for tags
            const emojiMetadata = await ctx.db
              .query('emojiRatingMetadata')
              .withIndex('byEmoji', (q) => q.eq('emoji', reaction.emoji))
              .first();

            // Create emoji rating
            await ctx.db.insert('emojiRatings', {
              userId: reaction.userId,
              vibeId: reaction.vibeId,
              emoji: reaction.emoji,
              value: reaction.ratingValue,
              createdAt: reaction._creationTime
                ? new Date(reaction._creationTime).toISOString()
                : new Date().toISOString(),
              tags: emojiMetadata?.tags || [],
            });

            migrated++;
          } else {
            skipped++;
          }
        }
      } catch (error) {
        console.error(`Error migrating reaction ${reaction._id}:`, error);
        errors++;
      }
    }

    const hasMore = reactions.length === batchSize;
    const lastId = reactions[reactions.length - 1]?._id;

    console.log(`Migration batch complete:
      - Migrated: ${migrated}
      - Skipped: ${skipped}
      - Errors: ${errors}
      - Has more: ${hasMore}
      - Last ID: ${lastId || 'none'}`);

    return {
      migrated,
      skipped,
      errors,
      hasMore,
      lastId,
    };
  },
});

// Migration to add emoji rating data to existing ratings
export const addEmojiRatingToExistingRatings = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    startFrom: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    console.log('Starting ratings emoji enhancement migration...');

    let query = ctx.db.query('ratings');
    
    if (args.startFrom) {
      query = query.filter((q) => q.gte(q.field('_id'), args.startFrom));
    }
    
    const ratings = await query.take(batchSize);

    for (const rating of ratings) {
      try {
        // Skip if already has emoji rating
        if (rating.emojiRating) {
          skipped++;
          continue;
        }

        // Look for matching emoji ratings by the same user for the same vibe
        const userEmojiRatings = await ctx.db
          .query('emojiRatings')
          .withIndex('byUserVibe', (q) =>
            q.eq('userId', rating.userId).eq('vibeId', rating.vibeId)
          )
          .collect();

        if (userEmojiRatings.length > 0) {
          // Use the most recent emoji rating
          const mostRecent = userEmojiRatings.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          await ctx.db.patch(rating._id, {
            emojiRating: {
              emoji: mostRecent.emoji,
              value: mostRecent.value,
            },
            tags: mostRecent.tags,
          });

          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error updating rating ${rating._id}:`, error);
        errors++;
      }
    }

    const hasMore = ratings.length === batchSize;
    const lastId = ratings[ratings.length - 1]?._id;

    console.log(`Rating enhancement batch complete:
      - Updated: ${updated}
      - Skipped: ${skipped}
      - Errors: ${errors}
      - Has more: ${hasMore}
      - Last ID: ${lastId || 'none'}`);

    return {
      updated,
      skipped,
      errors,
      hasMore,
      lastId,
    };
  },
});

// Migration to ensure all emoji ratings have proper metadata
export const backfillEmojiMetadata = internalMutation({
  args: {},
  handler: async (ctx) => {
    const defaultMetadata = [
      { emoji: '😍', tags: ['love', 'amazing', 'favorite'], category: 'positive', sentiment: 'positive', popularity: 100 },
      { emoji: '🔥', tags: ['fire', 'hot', 'amazing', 'lit'], category: 'intense', sentiment: 'positive', popularity: 95 },
      { emoji: '😱', tags: ['shocked', 'surprise', 'wow', 'omg'], category: 'surprise', sentiment: 'mixed', popularity: 90 },
      { emoji: '💯', tags: ['perfect', 'hundred', 'complete', 'best'], category: 'achievement', sentiment: 'positive', popularity: 85 },
      { emoji: '😂', tags: ['funny', 'lol', 'hilarious', 'comedy'], category: 'humor', sentiment: 'positive', popularity: 88 },
      { emoji: '🤩', tags: ['starstruck', 'amazing', 'impressed', 'wow'], category: 'admiration', sentiment: 'positive', popularity: 82 },
      { emoji: '😭', tags: ['crying', 'emotional', 'sad', 'tears'], category: 'emotional', sentiment: 'mixed', popularity: 75 },
      { emoji: '🥺', tags: ['pleading', 'cute', 'aww', 'soft'], category: 'emotional', sentiment: 'mixed', popularity: 70 },
      { emoji: '🤔', tags: ['thinking', 'hmm', 'confused', 'pondering'], category: 'thinking', sentiment: 'neutral', popularity: 65 },
      { emoji: '😳', tags: ['flushed', 'embarrassed', 'shy', 'blush'], category: 'emotional', sentiment: 'mixed', popularity: 60 },
      { emoji: '🙄', tags: ['eyeroll', 'annoyed', 'whatever', 'ugh'], category: 'negative', sentiment: 'negative', popularity: 55 },
      { emoji: '💀', tags: ['dead', 'dying', 'lmao', 'cant'], category: 'humor', sentiment: 'positive', popularity: 78 },
      { emoji: '✨', tags: ['sparkles', 'magic', 'special', 'pretty'], category: 'aesthetic', sentiment: 'positive', popularity: 73 },
      { emoji: '❤️', tags: ['heart', 'love', 'red', 'passion'], category: 'love', sentiment: 'positive', popularity: 92 },
      { emoji: '👀', tags: ['eyes', 'looking', 'watching', 'interested'], category: 'attention', sentiment: 'neutral', popularity: 68 },
      { emoji: '😅', tags: ['sweat', 'nervous', 'awkward', 'haha'], category: 'nervous', sentiment: 'mixed', popularity: 63 },
      { emoji: '🤯', tags: ['mindblown', 'exploding', 'shocked', 'incredible'], category: 'surprise', sentiment: 'positive', popularity: 80 },
      { emoji: '😎', tags: ['cool', 'sunglasses', 'chill', 'awesome'], category: 'cool', sentiment: 'positive', popularity: 77 },
      { emoji: '🥰', tags: ['smiling', 'hearts', 'love', 'adore'], category: 'love', sentiment: 'positive', popularity: 87 },
      { emoji: '😩', tags: ['weary', 'tired', 'exhausted', 'done'], category: 'tired', sentiment: 'negative', popularity: 58 },
      { emoji: '🎉', tags: ['party', 'celebration', 'yay', 'excited'], category: 'celebration', sentiment: 'positive', popularity: 83 },
    ];

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const metadata of defaultMetadata) {
      try {
        // Check if already exists
        const existing = await ctx.db
          .query('emojiRatingMetadata')
          .withIndex('byEmoji', (q) => q.eq('emoji', metadata.emoji))
          .first();

        if (existing) {
          // Update if missing fields
          if (!existing.popularity || !existing.sentiment) {
            await ctx.db.patch(existing._id, {
              popularity: existing.popularity || metadata.popularity,
              sentiment: existing.sentiment || metadata.sentiment,
            });
            updated++;
          }
        } else {
          // Create new
          await ctx.db.insert('emojiRatingMetadata', metadata);
          created++;
        }
      } catch (error) {
        console.error(`Error processing emoji ${metadata.emoji}:`, error);
        errors++;
      }
    }

    console.log(`Emoji metadata backfill complete:
      - Created: ${created}
      - Updated: ${updated}
      - Errors: ${errors}`);

    return { created, updated, errors };
  },
});

// Main migration runner
export const runAllMigrations = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('Starting all emoji rating migrations...');
    
    const results = {
      metadata: { created: 0, updated: 0, errors: 0 },
      reactions: { migrated: 0, skipped: 0, errors: 0 },
      ratings: { updated: 0, skipped: 0, errors: 0 },
    };

    // Step 1: Ensure emoji metadata exists
    console.log('Step 1: Backfilling emoji metadata...');
    const metadataResult = await backfillEmojiMetadata(ctx, {});
    results.metadata = metadataResult;

    // Step 2: Migrate reactions to emoji ratings
    console.log('Step 2: Migrating reactions to emoji ratings...');
    let reactionBatch = await migrateReactionsToEmojiRatings(ctx, {});
    results.reactions.migrated += reactionBatch.migrated;
    results.reactions.skipped += reactionBatch.skipped;
    results.reactions.errors += reactionBatch.errors;

    while (reactionBatch.hasMore) {
      reactionBatch = await migrateReactionsToEmojiRatings(ctx, {
        startFrom: reactionBatch.lastId,
      });
      results.reactions.migrated += reactionBatch.migrated;
      results.reactions.skipped += reactionBatch.skipped;
      results.reactions.errors += reactionBatch.errors;
    }

    // Step 3: Add emoji ratings to existing ratings
    console.log('Step 3: Enhancing ratings with emoji data...');
    let ratingBatch = await addEmojiRatingToExistingRatings(ctx, {});
    results.ratings.updated += ratingBatch.updated;
    results.ratings.skipped += ratingBatch.skipped;
    results.ratings.errors += ratingBatch.errors;

    while (ratingBatch.hasMore) {
      ratingBatch = await addEmojiRatingToExistingRatings(ctx, {
        startFrom: ratingBatch.lastId,
      });
      results.ratings.updated += ratingBatch.updated;
      results.ratings.skipped += ratingBatch.skipped;
      results.ratings.errors += ratingBatch.errors;
    }

    console.log('All migrations complete!', results);
    return results;
  },
});