#!/usr/bin/env bun

/**
 * Sync tags from dev Convex deployment to production
 * Usage: bun run scripts/sync-tags.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';

const execAsync = promisify(exec);

const DEV_DEPLOYMENT = 'dev:reliable-porpoise-366';
const PROD_DEPLOYMENT = 'prod:ardent-egret-416';

interface Tag {
  name: string;
  count: number;
}

async function runConvexCommand(
  deployment: string,
  command: string
): Promise<any> {
  const { stdout, stderr } = await execAsync(
    `CONVEX_DEPLOYMENT=${deployment} bunx convex run ${command}`
  );

  if (stderr && !stderr.includes('Deprecation warning')) {
    throw new Error(`Convex command failed: ${stderr}`);
  }

  try {
    return JSON.parse(stdout);
  } catch (e) {
    console.error('Failed to parse JSON:', stdout);
    throw e;
  }
}

async function exportTagsFromDev(): Promise<Tag[]> {
  console.log('🔍 Fetching all tags from dev deployment...');

  try {
    const tags = await runConvexCommand(DEV_DEPLOYMENT, 'tags:getAllTags');
    console.log(`✅ Found ${tags.length} tags in dev`);

    // Save to file for backup
    await writeFile('dev-tags-backup.json', JSON.stringify(tags, null, 2));
    console.log('💾 Backup saved to dev-tags-backup.json');

    return tags;
  } catch (error) {
    console.error('❌ Failed to export tags from dev:', error);
    throw error;
  }
}

async function seedTagsToProd(tags: Tag[]): Promise<void> {
  console.log(
    `\n🌱 Seeding ${tags.length} tags to production with counts preserved...`
  );

  // Show sample of tags being seeded with their counts
  console.log('📊 Sample tags with counts:');
  tags.slice(0, 5).forEach((tag, i) => {
    console.log(`  ${i + 1}. ${tag.name}: ${tag.count} uses`);
  });

  try {
    // First, ensure the production deployment has the necessary functions
    console.log('\n📦 Deploying functions to production...');
    await execAsync(
      `CONVEX_DEPLOYMENT=${PROD_DEPLOYMENT} bunx convex deploy -y --typecheck disable`
    );

    // Seed the tags with counts preserved
    const args = JSON.stringify({ tags });
    const result = await runConvexCommand(
      PROD_DEPLOYMENT,
      `seed:seedProductionTagsWithCounts '${args}' --prod`
    );

    console.log('✅ Seeding result:', result);

    // Verify the tags were seeded
    await verifyProductionTags();
  } catch (error) {
    console.error('❌ Failed to seed tags to production:', error);
    throw error;
  }
}

async function verifyProductionTags(): Promise<void> {
  console.log('\n🔍 Verifying production tags...');

  try {
    const prodTags = await runConvexCommand(
      PROD_DEPLOYMENT,
      'tags:getAllTags --prod'
    );
    console.log(`✅ Production has ${prodTags.length} tags`);

    // Calculate total usage count
    const totalCount = prodTags.reduce(
      (sum: number, tag: Tag) => sum + tag.count,
      0
    );
    console.log(`📈 Total tag usage count: ${totalCount}`);

    // Show top 5 popular tags
    const popularTags = await runConvexCommand(
      PROD_DEPLOYMENT,
      'tags:getPopularTags \'{"limit": 5}\''
    );

    console.log('\n📊 Top 5 tags in production (with preserved counts):');
    popularTags.forEach((tag: Tag, i: number) => {
      console.log(`  ${i + 1}. ${tag.name} (used ${tag.count} times)`);
    });
  } catch (error) {
    console.error('❌ Failed to verify production tags:', error);
    throw error;
  }
}

async function main() {
  console.log('🔄 Syncing tags from dev to production\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Export from dev
    const devTags = await exportTagsFromDev();

    // Step 2: Seed to production
    await seedTagsToProd(devTags);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Tag sync completed successfully!');
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
main();
