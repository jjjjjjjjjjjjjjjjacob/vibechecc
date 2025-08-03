#!/usr/bin/env node

/**
 * Memory-safe test runner that executes tests in batches to avoid OOM issues
 */

import { spawn } from 'child_process';
import { glob } from 'glob';
import { dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Test file patterns to include
const testPatterns = [
  'src/**/*.test.{ts,tsx}',
  '__tests__/**/*.test.{ts,tsx}',
];

// Batch size - number of test files to run together
const BATCH_SIZE = 3;

async function findTestFiles() {
  const files = [];
  for (const pattern of testPatterns) {
    const matches = await glob(pattern, { cwd: __dirname });
    files.push(...matches);
  }
  return files.sort();
}

function runTestBatch(files, batchNumber, totalBatches) {
  return new Promise((resolve, reject) => {
    const fileList = files.join(' ');
    console.log(`\n📦 Running batch ${batchNumber}/${totalBatches} (${files.length} files):`);
    console.log(`   ${files.map(f => relative(__dirname, f)).join(', ')}\n`);

    const child = spawn('bun', ['vitest', 'run', ...files], {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096 --expose-gc',
      },
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Batch ${batchNumber} completed successfully\n`);
        resolve();
      } else {
        console.error(`❌ Batch ${batchNumber} failed with code ${code}\n`);
        reject(new Error(`Test batch failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Batch ${batchNumber} error:`, error);
      reject(error);
    });
  });
}

async function runAllTests() {
  try {
    console.log('🔍 Finding test files...');
    const testFiles = await findTestFiles();
    console.log(`📋 Found ${testFiles.length} test files\n`);

    if (testFiles.length === 0) {
      console.log('⚠️  No test files found');
      return;
    }

    // Split into batches
    const batches = [];
    for (let i = 0; i < testFiles.length; i += BATCH_SIZE) {
      batches.push(testFiles.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Running ${batches.length} batches of up to ${BATCH_SIZE} files each\n`);

    let successfulBatches = 0;
    const totalBatches = batches.length;

    // Run batches sequentially to avoid memory accumulation
    for (let i = 0; i < batches.length; i++) {
      try {
        await runTestBatch(batches[i], i + 1, totalBatches);
        successfulBatches++;
        
        // Force garbage collection between batches
        if (global.gc) {
          global.gc();
        }
        
        // Small delay to allow system cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Batch ${i + 1} failed:`, error.message);
        // Continue with remaining batches
      }
    }

    console.log(`\n🎉 Test run complete!`);
    console.log(`✅ ${successfulBatches}/${totalBatches} batches completed successfully`);
    
    if (successfulBatches === totalBatches) {
      console.log(`🎯 All tests passed!`);
      process.exit(0);
    } else {
      console.log(`⚠️  ${totalBatches - successfulBatches} batch(es) had failures`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };