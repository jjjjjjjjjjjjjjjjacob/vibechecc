import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

// Migration to remove tags field from emoji documents
// This field was added accidentally to some documents but isn't in the schema
export const removeEmojiTags = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all emojis
    const emojis = await ctx.db.query('emojis').collect();
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const emoji of emojis) {
      // Check if this emoji has a tags field (TypeScript will complain but it exists in data)
      const emojiWithTags = emoji as any;
      if (emojiWithTags.tags) {
        // Create a new object without the tags field
        const { tags, ...emojiWithoutTags } = emojiWithTags;
        
        // Update the document
        await ctx.db.patch(emoji._id, emojiWithoutTags);
        updatedCount++;
        
        console.log(`Removed tags from emoji: ${emoji.emoji} (${emoji.name})`);
      } else {
        skippedCount++;
      }
    }
    
    console.log(`Migration complete: Updated ${updatedCount} emojis, skipped ${skippedCount} emojis`);
    
    // Record migration completion
    await ctx.db.insert('migrations', {
      name: 'remove_emoji_tags',
      completedAt: new Date().toISOString(),
      status: 'completed',
    });
    
    return {
      updatedCount,
      skippedCount,
      totalProcessed: updatedCount + skippedCount,
    };
  },
});