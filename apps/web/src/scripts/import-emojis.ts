#!/usr/bin/env bun
import { EMOJI_DATABASE } from '../lib/emoji-database';
import { api } from '@vibechecc/convex';
import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
const BATCH_SIZE = 100;

if (!CONVEX_URL) {
  console.error('CONVEX_URL is not set');
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function importEmojis() {
  console.log(`Importing ${EMOJI_DATABASE.length} emojis...`);

  try {
    const result = await client.action(api.seed.importEmojis, {
      emojis: EMOJI_DATABASE.map((emoji) => ({
        emoji: emoji.emoji,
        name: emoji.name,
        keywords: emoji.keywords,
        category: emoji.category,
      })),
    });

    console.log('Import result:', result);
  } catch (error) {
    console.error('Error importing emojis:', error);
    process.exit(1);
  }
}

// Run the import
importEmojis().catch(console.error);
