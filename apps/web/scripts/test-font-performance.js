#!/usr/bin/env node

/**
 * Font Performance Testing Script
 * Tests loading performance of optimized fonts
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, '../public/fonts');
const OPTIMIZED_FONTS_DIR = join(FONTS_DIR, 'optimized');

function getFileSize(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    const stats = execSync(`ls -l "${filePath}"`, { encoding: 'utf8' });
    const size = parseInt(stats.split(/\s+/)[4]);
    return size;
  } catch {
    return null;
  }
}

// function formatBytes(bytes) {
//   if (!bytes) return 'N/A';
//   const units = ['B', 'KB', 'MB', 'GB'];
//   let size = bytes;
//   let unitIndex = 0;
//
//   while (size > 1024 && unitIndex < units.length - 1) {
//     size /= 1024;
//     unitIndex++;
//   }
//
//   return `${size.toFixed(2)} ${units[unitIndex]}`;
// }

function calculateSavings() {
  const fontComparisons = [
    {
      name: 'GeistSans',
      original: join(FONTS_DIR, 'GeistSans-Variable.woff2'),
      optimized: join(OPTIMIZED_FONTS_DIR, 'GeistSans-Variable.woff2'),
    },
    {
      name: 'GeistMono',
      original: join(FONTS_DIR, 'GeistMono-Variable.woff2'),
      optimized: join(OPTIMIZED_FONTS_DIR, 'GeistMono-Variable.woff2'),
    },
    {
      name: 'Doto',
      original: join(FONTS_DIR, 'Doto-VariableFont_ROND,wght.ttf'),
      optimized: join(OPTIMIZED_FONTS_DIR, 'Doto-VariableFont_ROND,wght.woff2'),
    },
    {
      name: 'NotoColorEmoji',
      original: join(FONTS_DIR, 'NotoColorEmoji-Regular.ttf'),
      optimized: [
        join(OPTIMIZED_FONTS_DIR, 'noto-color-emoji-core.woff2'),
        join(OPTIMIZED_FONTS_DIR, 'noto-color-emoji-extended.woff2'),
      ],
    },
  ];

  // console.log('🎯 Font Optimization Performance Report\n');
  // console.log('='.repeat(60));

  // let totalOriginal = 0;
  // let totalOptimized = 0;

  fontComparisons.forEach((font) => {
    const originalSize = getFileSize(font.original);
    let optimizedSize = 0;

    if (Array.isArray(font.optimized)) {
      optimizedSize = font.optimized.reduce(
        (sum, path) => sum + (getFileSize(path) || 0),
        0
      );
    } else {
      optimizedSize = getFileSize(font.optimized) || 0;
    }

    if (originalSize && optimizedSize) {
      // const savings = originalSize - optimizedSize;
      // const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
      // totalOriginal += originalSize;
      // totalOptimized += optimizedSize;
      // console.log(`\n📁 ${font.name}:`);
      // console.log(`   Original:  ${formatBytes(originalSize)}`);
      // console.log(`   Optimized: ${formatBytes(optimizedSize)}`);
      // console.log(`   Savings:   ${formatBytes(savings)} (${savingsPercent}%)`);
    }
  });

  // console.log('\n' + '='.repeat(60));
  // console.log('\n📊 Total Summary:');
  // console.log(`   Total Original:  ${formatBytes(totalOriginal)}`);
  // console.log(`   Total Optimized: ${formatBytes(totalOptimized)}`);
  // console.log(
  //   `   Total Savings:   ${formatBytes(totalOriginal - totalOptimized)} (${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%)`
  // );
}

function estimateLoadingImpact() {
  // console.log('\n\n⚡ Estimated Loading Impact:\n');
  // console.log('='.repeat(60));

  const scenarios = [
    { name: '3G Slow (50KB/s)', speed: 50 * 1024 },
    { name: '3G Fast (200KB/s)', speed: 200 * 1024 },
    { name: '4G (5MB/s)', speed: 5 * 1024 * 1024 },
    { name: 'WiFi (30MB/s)', speed: 30 * 1024 * 1024 },
  ];

  // Calculate critical font sizes (fonts that are preloaded)
  // const criticalFonts = [
  //   join(OPTIMIZED_FONTS_DIR, 'GeistSans-Variable.woff2'),
  //   join(OPTIMIZED_FONTS_DIR, 'noto-color-emoji-core.woff2'),
  // ];

  // const criticalSize = criticalFonts.reduce(
  //   (sum, path) => sum + (getFileSize(path) || 0),
  //   0
  // );
  // const originalCriticalFonts = [
  //   join(FONTS_DIR, 'GeistSans-Variable.woff2'),
  //   join(FONTS_DIR, 'NotoColorEmoji-Regular.ttf'),
  // ];
  // const originalCriticalSize = originalCriticalFonts.reduce(
  //   (sum, path) => sum + (getFileSize(path) || 0),
  //   0
  // );

  // console.log('\n📦 Critical Fonts (Preloaded):');
  // console.log(`   Original Size:  ${formatBytes(originalCriticalSize)}`);
  // console.log(`   Optimized Size: ${formatBytes(criticalSize)}`);

  // console.log('\n⏱️  Loading Time Comparison:');
  scenarios.forEach((_scenario) => {
    // const originalTime = (originalCriticalSize / scenario.speed).toFixed(2);
    // const optimizedTime = (criticalSize / scenario.speed).toFixed(2);
    // const improvement = (originalTime - optimizedTime).toFixed(2);
    // console.log(`\n   ${scenario.name}:`);
    // console.log(`     Original:  ${originalTime}s`);
    // console.log(`     Optimized: ${optimizedTime}s`);
    // console.log(`     Saved:     ${improvement}s`);
  });
}

function generateRecommendations() {
  // console.log('\n\n💡 Recommendations:\n');
  // console.log('='.repeat(60));
  // const recommendations = [
  //   '1. ✅ Font files are optimized with subsetting',
  //   '2. ✅ Using WOFF2 format for better compression',
  //   '3. ✅ font-display: swap prevents render blocking',
  //   '4. ✅ Critical fonts are preloaded',
  //   '5. ✅ Emoji fonts are split into core and extended sets',
  //   '',
  //   'Additional optimizations to consider:',
  //   '- Use a CDN for font delivery',
  //   '- Implement resource hints (dns-prefetch, preconnect)',
  //   '- Consider variable font axis subsetting for further savings',
  //   '- Monitor real user metrics with Web Vitals',
  // ];
  // recommendations.forEach((rec) => console.log(rec));
}

function main() {
  // console.log('🚀 Font Performance Testing\n');

  if (!existsSync(OPTIMIZED_FONTS_DIR)) {
    // console.error('❌ Optimized fonts directory not found!');
    // console.error('   Run: npm run fonts:optimize');
    process.exit(1);
  }

  calculateSavings();
  estimateLoadingImpact();
  generateRecommendations();

  // console.log('\n\n✅ Font performance test complete!\n');
}

main();
