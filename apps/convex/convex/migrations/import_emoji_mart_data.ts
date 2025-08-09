import { internalMutation } from '../_generated/server';
import { getEmojiColor, getEmojiSentiment } from '../lib/emojiColors';

// Import emoji-mart data - it's a default export with the actual data
const emojiMartData = require('@emoji-mart/data');

// Internal migration to import emoji-mart data
export const importEmojiMartData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const categories = Object.keys(emojiMartData.categories || {});
    let totalImported = 0;
    let totalSkipped = 0;

    // Process each category
    for (const categoryId of categories) {
      const categoryData = emojiMartData.categories[categoryId];
      const categoryEmojis = categoryData.emojis || [];

      // Process emojis in this category
      for (const emojiId of categoryEmojis) {
        const emojiData = emojiMartData.emojis[emojiId];
        if (!emojiData) continue;

        // Get the native emoji character
        const nativeEmoji = emojiData.skins?.[0]?.native || '';
        if (!nativeEmoji) continue;

        // Check if emoji already exists
        const existing = await ctx.db
          .query('emojis')
          .withIndex('byEmoji', (q) => q.eq('emoji', nativeEmoji))
          .first();

        if (existing) {
          // Update usage metadata if needed
          if (
            existing.shortcodes === undefined ||
            existing.emoticons === undefined
          ) {
            await ctx.db.patch(existing._id, {
              shortcodes: emojiData.id ? [`:${emojiData.id}:`] : undefined,
              emoticons: emojiData.emoticons || undefined,
              aliases: emojiData.aliases || undefined,
              skins:
                emojiData.skins?.slice(1).map((s: any) => s.native) ||
                undefined,
            });
          }
          totalSkipped++;
          continue;
        }

        // Prepare keywords
        const keywords = [
          ...(emojiData.keywords || []),
          ...(emojiData.aliases || []),
        ].filter(Boolean);

        // Get color and sentiment
        const color = getEmojiColor(
          nativeEmoji,
          emojiData.name || emojiId,
          keywords,
          categoryId
        );

        const sentiment = getEmojiSentiment(
          emojiData.name || emojiId,
          keywords
        );

        // Insert new emoji
        await ctx.db.insert('emojis', {
          emoji: nativeEmoji,
          unicode: emojiData.unified ? `U+${emojiData.unified}` : undefined,
          name: emojiData.name || emojiId,
          keywords,
          category: categoryId,
          subcategory: undefined,
          version: emojiData.added || undefined,
          color,
          sentiment,
          shortcodes: emojiData.id ? [`:${emojiData.id}:`] : undefined,
          emoticons: emojiData.emoticons || undefined,
          aliases: emojiData.aliases || undefined,
          skins:
            emojiData.skins?.slice(1).map((s: any) => s.native) || undefined,
          disabled: false,
          usageCount: 0,
        });

        totalImported++;
      }
    }

    return {
      imported: totalImported,
      skipped: totalSkipped,
      total: totalImported + totalSkipped,
    };
  },
});

// Get all categories from emoji-mart data
export const getEmojiMartCategories = internalMutation({
  args: {},
  handler: async () => {
    return Object.entries(emojiMartData.categories || {}).map(
      ([id, category]: [string, any]) => ({
        id,
        name: category.name || id,
        emojis: category.emojis || [],
      })
    );
  },
});

