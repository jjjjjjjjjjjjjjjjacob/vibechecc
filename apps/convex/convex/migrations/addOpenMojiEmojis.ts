import { internalMutation } from '../_generated/server';
import { allOpenMojiEmojis } from '../seed/emojis/all_openmoji';

// Helper to get unicode from emoji character
function getUnicodeFromEmoji(emoji: string): string {
  return emoji
    .split('')
    .map((char) => {
      const code = char.codePointAt(0);
      return code
        ? 'U+' + code.toString(16).toUpperCase().padStart(4, '0')
        : '';
    })
    .filter(Boolean)
    .join(' ');
}

// Migration to add all OpenMoji emojis
export const addOpenMojiEmojis = internalMutation({
  handler: async (ctx) => {
    console.log('Starting OpenMoji emoji migration...');

    let added = 0;
    let skipped = 0;
    let errors = 0;

    // Process in batches to avoid timeout
    const batchSize = 100;

    for (let i = 0; i < allOpenMojiEmojis.length; i += batchSize) {
      const batch = allOpenMojiEmojis.slice(i, i + batchSize);

      for (const emojiData of batch) {
        try {
          // Check if emoji already exists
          const existing = await ctx.db
            .query('emojis')
            .withIndex('byEmoji', (q) => q.eq('emoji', emojiData.emoji))
            .first();

          if (existing) {
            skipped++;
            continue;
          }

          // Add the emoji with all metadata
          await ctx.db.insert('emojis', {
            emoji: emojiData.emoji,
            name: emojiData.name,
            keywords: emojiData.keywords,
            category: emojiData.category,
            subcategory: emojiData.subcategory,
            unicode: emojiData.unicode || getUnicodeFromEmoji(emojiData.emoji),
            version: emojiData.version,
            color: emojiData.color,
            sentiment: emojiData.sentiment,
            disabled: false,
          } as any);

          added++;
        } catch (error) {
          console.error(`Error adding emoji ${emojiData.emoji}:`, error);
          errors++;
        }
      }

      // Log progress
      if (
        (i + batchSize) % 500 === 0 ||
        i + batchSize >= allOpenMojiEmojis.length
      ) {
        console.log(
          `Progress: ${Math.min(i + batchSize, allOpenMojiEmojis.length)}/${allOpenMojiEmojis.length} processed`
        );
      }
    }

    const result = {
      total: allOpenMojiEmojis.length,
      added,
      skipped,
      errors,
      message: `Migration complete: Added ${added} new emojis, skipped ${skipped} existing, ${errors} errors`,
    };

    console.log(result.message);
    return result;
  },
});
