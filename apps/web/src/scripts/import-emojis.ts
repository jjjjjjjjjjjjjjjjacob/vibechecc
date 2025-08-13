#!/usr/bin/env bun
import { EMOJI_DATABASE } from '../lib/emoji-database';
import { api } from '@vibechecc/convex';
import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
const _BATCH_SIZE = 100;

if (!CONVEX_URL) {
  // eslint-disable-next-line no-console
  console.error('CONVEX_URL is not set');
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function importEmojis() {
  // eslint-disable-next-line no-console
  console.log(`Importing ${EMOJI_DATABASE.length} emojis...`);

  try {
    // Use the importBasicEmojis action
    const result = await client.action(api.importEmojis.importBasicEmojis, {});

    // eslint-disable-next-line no-console
    console.log('Import result:', result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error importing emojis:', error);
    process.exit(1);
  }
}

// Run the import
// eslint-disable-next-line no-console
importEmojis().catch(console.error);
