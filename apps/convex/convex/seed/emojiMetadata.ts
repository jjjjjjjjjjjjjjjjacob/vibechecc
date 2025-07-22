import { internalMutation } from '../_generated/server';
import { defaultEmojiMetadata } from '../emojiMetadata';

// Seed function to populate emoji metadata
export const seedEmojiMetadata = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('Starting emoji metadata seeding...');

    // Check if metadata already exists
    const existingCount = await ctx.db.query('emojiRatingMetadata').take(1);

    if (existingCount.length > 0) {
      console.log('Emoji metadata already exists, skipping seed');
      return { message: 'Emoji metadata already populated', count: 0 };
    }

    // Insert all default emoji metadata
    let insertedCount = 0;
    for (const metadata of defaultEmojiMetadata) {
      await ctx.db.insert('emojiRatingMetadata', metadata);
      insertedCount++;
    }

    console.log(`Successfully seeded ${insertedCount} emoji metadata entries`);
    return {
      message: 'Emoji metadata seeded successfully',
      count: insertedCount,
    };
  },
});
