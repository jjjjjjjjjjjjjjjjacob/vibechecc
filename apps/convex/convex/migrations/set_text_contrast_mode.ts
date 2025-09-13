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

// Helper function to check if a gradient is light or dark
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
  return avgLuminance > 0.9;
}

// Migration to set textContrastMode for existing vibes
export const setTextContrastMode = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all vibes that don't have textContrastMode set
    const vibes = await ctx.db
      .query('vibes')
      .filter((q) => q.eq(q.field('textContrastMode'), undefined))
      .collect();

    let updatedCount = 0;
    let skippedCount = 0;
    let imageVibes = 0;
    let gradientVibes = 0;

    for (const vibe of vibes) {
      let textContrastMode: 'light' | 'dark' | 'auto' = 'auto';

      // If vibe has an image (either legacy URL or storage ID), assume dark background
      if (vibe.image || vibe.imageStorageId) {
        textContrastMode = 'dark'; // Use light text on dark background
        imageVibes++;
      }
      // If vibe has gradient colors, calculate based on brightness
      else if (vibe.gradientFrom && vibe.gradientTo) {
        textContrastMode = isLightGradient(vibe.gradientFrom, vibe.gradientTo)
          ? 'light'
          : 'dark';
        gradientVibes++;
      }
      // If neither image nor gradient, leave as 'auto'
      else {
        skippedCount++;
        continue;
      }

      // Update the vibe
      await ctx.db.patch(vibe._id, { textContrastMode });
      updatedCount++;
    }

    // Record migration completion
    await ctx.db.insert('migrations', {
      name: 'set_text_contrast_mode',
      completedAt: new Date().toISOString(),
      status: 'completed',
    });

    return {
      updatedCount,
      skippedCount,
      imageVibes,
      gradientVibes,
      totalProcessed: updatedCount + skippedCount,
    };
  },
});

// Regular mutation version that can be called from dashboard
export const runTextContrastMigration = mutation({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    updatedCount: number;
    skippedCount: number;
    imageVibes: number;
    gradientVibes: number;
    totalProcessed: number;
  }> => {
    // Check if migration already ran
    const existingMigration = await ctx.db
      .query('migrations')
      .withIndex('byName', (q) => q.eq('name', 'set_text_contrast_mode'))
      .first();

    if (existingMigration) {
      throw new Error(
        'Migration "set_text_contrast_mode" has already been run'
      );
    }

    // Run the internal migration via generated internal reference
    const result = await ctx.runMutation(
      internal.migrations.set_text_contrast_mode.setTextContrastMode,
      {}
    );
    return result;
  },
});
