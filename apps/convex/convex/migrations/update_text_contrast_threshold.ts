import { internalMutation, mutation } from '../_generated/server';
import { internal } from '../_generated/api';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { v } from 'convex/values';

// Helper function to convert hex to RGB
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Helper function to check if a gradient is light or dark using new threshold
function isLightGradient(from: string, to: string) {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);

  if (!fromRgb || !toRgb) {
    return true; // Default to light
  }

  // Calculate luminance
  const fromLuminance =
    (0.299 * fromRgb.r + 0.587 * fromRgb.g + 0.114 * fromRgb.b) / 255;
  const toLuminance =
    (0.299 * toRgb.r + 0.587 * toRgb.g + 0.114 * toRgb.b) / 255;

  const avgLuminance = (fromLuminance + toLuminance) / 2;
  return avgLuminance > 0.82;
}

// Migration to update textContrastMode for existing vibes with new threshold
export const updateTextContrastThreshold = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all vibes that have gradient colors (either from old migration or manual)
    const vibes = await ctx.db
      .query('vibes')
      .filter((q) =>
        q.and(
          q.neq(q.field('gradientFrom'), undefined),
          q.neq(q.field('gradientTo'), undefined)
        )
      )
      .collect();

    let updatedCount = 0;
    let skippedCount = 0;

    for (const vibe of vibes) {
      // Skip if no gradient colors
      if (!vibe.gradientFrom || !vibe.gradientTo) {
        skippedCount++;
        continue;
      }

      // Recalculate with new threshold (0.9 instead of 0.75/0.5)
      const newTextContrastMode = isLightGradient(
        vibe.gradientFrom,
        vibe.gradientTo
      )
        ? 'light'
        : 'dark';

      // Only update if different from current value
      if (vibe.textContrastMode !== newTextContrastMode) {
        await ctx.db.patch(vibe._id, { textContrastMode: newTextContrastMode });
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    // Record migration completion
    await ctx.db.insert('migrations', {
      name: 'update_text_contrast_threshold',
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

// Regular mutation version that can be called from dashboard
export const runTextContrastThresholdUpdate = mutation({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    updatedCount: number;
    skippedCount: number;
    totalProcessed: number;
  }> => {
    // Check if migration already ran
    const existingMigration = await ctx.db
      .query('migrations')
      .withIndex('byName', (q) =>
        q.eq('name', 'update_text_contrast_threshold')
      )
      .first();

    if (existingMigration) {
      throw new Error(
        'Migration "update_text_contrast_threshold" has already been run'
      );
    }

    // Run the internal migration via generated internal reference
    const result = await ctx.runMutation(
      internal.migrations.update_text_contrast_threshold
        .updateTextContrastThreshold,
      {}
    );
    return result;
  },
});
