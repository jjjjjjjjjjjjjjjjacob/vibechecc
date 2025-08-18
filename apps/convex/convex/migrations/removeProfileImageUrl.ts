import { internalMutation } from '../_generated/server';

/**
 * Migration to remove the redundant profile_image_url field from all user documents
 * This field was deprecated in favor of using only image_url
 */
export const removeProfileImageUrlField = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.db.query('users').collect();

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Check if user has profile_image_url field
      if ('profile_image_url' in user) {
        // Create update object without profile_image_url
        const updates: Record<string, unknown> = {};

        // If image_url is missing but profile_image_url exists, preserve it
        if (!user.image_url && user.profile_image_url) {
          updates.image_url = user.profile_image_url;
        }

        // Remove profile_image_url by patching with undefined
        // Note: Convex will remove fields when patched with undefined
        updates.profile_image_url = undefined;

        // Apply the update
        await ctx.db.patch(user._id, updates);
        migratedCount++;
      } else {
        skippedCount++;
      }
    }

    // Log migration results
    // eslint-disable-next-line no-console
    console.log(
      `Migration complete: ${migratedCount} users migrated, ${skippedCount} users skipped`
    );

    // Record migration completion
    await ctx.db.insert('migrations', {
      name: 'removeProfileImageUrlField',
      completedAt: new Date().toISOString(),
      status: 'completed',
    });

    return {
      totalUsers: users.length,
      migratedCount,
      skippedCount,
    };
  },
});
