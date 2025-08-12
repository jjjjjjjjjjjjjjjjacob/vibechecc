#!/usr/bin/env bun
/**
 * CLI script to seed the Convex database with a predefined emoji set. It reads
 * emojis from the local JSON file and invokes a Convex action to insert them in
 * batches. Run this whenever a fresh environment needs basic emoji data.
 */
import { EMOJI_DATABASE } from '../lib/emoji-database'; // local source of emoji metadata
import { api } from '@viberatr/convex';
import { ConvexHttpClient } from 'convex/browser';

// Determine the Convex deployment URL from env vars
const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
const _BATCH_SIZE = 100; // batch insert size

// Abort early if no Convex endpoint is configured
if (!CONVEX_URL) {
  // eslint-disable-next-line no-console
  console.error('convex_url is not set');
  process.exit(1);
}

// Initialize a simple HTTP client for server-side actions
const client = new ConvexHttpClient(CONVEX_URL);

async function importEmojis() {
  // eslint-disable-next-line no-console
  console.log(`importing ${EMOJI_DATABASE.length} emojis...`);

  try {
    // Use the importBasicEmojis action to seed all entries
    const result = await client.action(
      api['import-emojis'].importBasicEmojis,
      {},
    );

    // eslint-disable-next-line no-console
    console.log('import result:', result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('error importing emojis:', error);
    process.exit(1);
  }
}

// Run the import and surface any unhandled promise rejection
// eslint-disable-next-line no-console
importEmojis().catch(console.error);
