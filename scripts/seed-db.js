#!/usr/bin/env node

/**
 * Database seeding script for vibechecc
 *
 * This script populates the database with sample data from src/db/sample-data.ts
 * including users, vibes, ratings, and reactions.
 *
 * Usage:
 *   bun run scripts/seed-db.js
 *   or
 *   convex run seed:seed
 */

import { execSync } from 'child_process';

// console.log('🌱 Starting database seed process...');
// console.log('');

try {
  // Run the seed action via Convex CLI
  execSync('bunx convex run seed:seed', {
    encoding: 'utf8',
    stdio: 'inherit',
  });

  // console.log('');
  // console.log('✅ Database seeding completed successfully!');
  // console.log('');
  // console.log('Next steps:');
  // console.log('- Run `bun run dev` to start your development server');
  // console.log('- Visit your app to see the seeded data');
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('❌ Error running seed script:');
  // eslint-disable-next-line no-console
  console.error(error.message);
  // console.log('');
  // console.log('Make sure:');
  // console.log('- Convex is properly configured');
  // console.log('- You have run `bunx convex dev` at least once');
  // console.log('- Your database is accessible');
  process.exit(1);
}
