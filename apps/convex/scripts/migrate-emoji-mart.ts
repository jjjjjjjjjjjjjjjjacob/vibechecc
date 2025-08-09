#!/usr/bin/env bun

/**
 * Migration script to import emoji-mart data into Convex
 * Run with: bun run apps/convex/scripts/migrate-emoji-mart.ts
 */

import { ConvexClient } from 'convex/browser';

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error('❌ CONVEX_URL environment variable is not set');
  process.exit(1);
}

const client = new ConvexClient(CONVEX_URL);

async function runMigration() {
  console.log('🚀 Starting emoji-mart data migration...');
  
  try {
    // Run the internal migration function
    const result = await client.mutation('internal:migrations/import-emoji-mart-data:importEmojiMartData', {});
    
    console.log('✅ Migration completed successfully!');
    console.log(`   Imported: ${result.imported} emojis`);
    console.log(`   Skipped: ${result.skipped} existing emojis`);
    console.log(`   Total processed: ${result.total} emojis`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration()
  .then(() => {
    console.log('🎉 Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });