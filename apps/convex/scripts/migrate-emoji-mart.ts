#!/usr/bin/env bun

/**
 * Migration script to import emoji-mart data into Convex
 * Run with: bun run apps/convex/scripts/migrate-emoji-mart.ts
 */

import { ConvexClient } from 'convex/browser';

const CONVEX_URL =
  process.env.VITE_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  // eslint-disable-next-line no-console
  console.error('❌ CONVEX_URL environment variable is not set');
  process.exit(1);
}

const client = new ConvexClient(CONVEX_URL);

async function runMigration() {
  // eslint-disable-next-line no-console
  console.log('🚀 Starting emoji-mart data migration...');

  try {
    // Run the internal migration function
    type MigrationResult = {
      imported: number;
      skipped: number;
      total: number;
    };

    const result = await (
      client.mutation as (
        fn: string,
        args: Record<string, never>
      ) => Promise<MigrationResult>
    )('internal:migrations/import-emoji-mart-data:importEmojiMartData', {});

    // eslint-disable-next-line no-console
    console.log('✅ Migration completed successfully!');
    // eslint-disable-next-line no-console
    console.log(`   Imported: ${result.imported} emojis`);
    // eslint-disable-next-line no-console
    console.log(`   Skipped: ${result.skipped} existing emojis`);
    // eslint-disable-next-line no-console
    console.log(`   Total processed: ${result.total} emojis`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('🎉 Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
