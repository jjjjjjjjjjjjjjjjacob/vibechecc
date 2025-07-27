#!/usr/bin/env node

/**
 * Bundle analysis script for monitoring mobile performance optimizations
 * Tracks bundle size improvements and identifies optimization opportunities
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = './.output';
const PUBLIC_DIR = './public';

function getFileSize(filePath) {
  try {
    const stats = statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    return `${sizeInMB}MB`;
  } catch {
    return 'unknown';
  }
}

function analyzeBundleFiles() {
  console.log('📦 Bundle Analysis\n');
  
  if (!existsSync(DIST_DIR)) {
    console.log('❌ Build directory not found. Run: bun run build');
    return;
  }

  // Analyze JavaScript bundles
  console.log('🔍 JavaScript Bundles:');
  const jsFiles = [];
  
  function findJSFiles(dir, basePath = '') {
    try {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = join(dir, item);
        const relativePath = join(basePath, item);
        
        if (statSync(fullPath).isDirectory()) {
          findJSFiles(fullPath, relativePath);
        } else if (item.endsWith('.js') || item.endsWith('.mjs')) {
          jsFiles.push({
            name: relativePath,
            size: getFileSize(fullPath),
            path: fullPath
          });
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${dir}:`, error.message);
    }
  }
  
  findJSFiles(DIST_DIR);
  
  // Sort by size (rough estimate based on MB value)
  jsFiles.sort((a, b) => {
    const sizeA = parseFloat(a.size);
    const sizeB = parseFloat(b.size);
    return sizeB - sizeA;
  });

  jsFiles.forEach(file => {
    console.log(`  ${file.name}: ${file.size}`);
  });

  const totalJSSize = jsFiles.reduce((total, file) => {
    return total + parseFloat(file.size) || 0;
  }, 0);
  
  console.log(`\n📊 Total JS: ${totalJSSize.toFixed(2)}MB`);
}

function analyzeFontFiles() {
  console.log('\n🔤 Font Analysis:');
  
  if (!existsSync(PUBLIC_DIR)) {
    console.log('❌ Public directory not found');
    return;
  }

  const fontsDir = join(PUBLIC_DIR, 'fonts');
  if (!existsSync(fontsDir)) {
    console.log('❌ Fonts directory not found');
    return;
  }

  const fontFiles = [];
  const items = readdirSync(fontsDir);
  
  for (const item of items) {
    const fullPath = join(fontsDir, item);
    if (statSync(fullPath).isFile()) {
      fontFiles.push({
        name: item,
        size: getFileSize(fullPath)
      });
    }
  }

  // Sort by name for better organization
  fontFiles.sort((a, b) => a.name.localeCompare(b.name));

  console.log('\n📁 Font Files:');
  fontFiles.forEach(file => {
    const isOptimized = file.name.includes('core') || file.name.includes('extended');
    const indicator = isOptimized ? '✅' : '⚠️';
    console.log(`  ${indicator} ${file.name}: ${file.size}`);
  });

  const totalFontSize = fontFiles.reduce((total, file) => {
    return total + parseFloat(file.size) || 0;
  }, 0);
  
  console.log(`\n📊 Total Fonts: ${totalFontSize.toFixed(2)}MB`);
  
  // Check for optimization opportunities
  const hasOriginalEmoji = fontFiles.some(f => f.name.includes('NotoColorEmoji-Regular'));
  const hasSubsetEmoji = fontFiles.some(f => f.name.includes('core') || f.name.includes('extended'));
  
  if (hasOriginalEmoji && !hasSubsetEmoji) {
    console.log('\n⚠️  Optimization Opportunity: Run font subsetting');
    console.log('   Command: bun run fonts:subset');
  } else if (hasSubsetEmoji) {
    console.log('\n✅ Font optimization applied successfully!');
  }
}

function showPerformanceMetrics() {
  console.log('\n🚀 Performance Estimates:');
  
  // These are rough estimates based on typical mobile network speeds
  const estimations = {
    '3G (1Mbps)': {
      '25MB (before)': '200-300s',
      '3MB (after)': '24-30s',
      'Core fonts (1MB)': '8-10s'
    },
    'LTE (5Mbps)': {
      '25MB (before)': '40-50s', 
      '3MB (after)': '5-6s',
      'Core fonts (1MB)': '1-2s'
    }
  };

  Object.entries(estimations).forEach(([network, times]) => {
    console.log(`\n📱 ${network}:`);
    Object.entries(times).forEach(([size, time]) => {
      console.log(`  ${size}: ${time}`);
    });
  });
}

function main() {
  console.log('🎯 Mobile Performance Bundle Analysis\n');
  
  analyzeBundleFiles();
  analyzeFontFiles();
  showPerformanceMetrics();
  
  console.log('\n💡 Tips:');
  console.log('  - Keep total bundle < 500KB for fast mobile loading');
  console.log('  - Subset fonts for 90% size reduction');
  console.log('  - Use code splitting for non-critical features');
  console.log('  - Enable compression (gzip/brotli) on server');
  
  console.log('\n🔧 Commands:');
  console.log('  bun run fonts:subset  # Create optimized font subsets');
  console.log('  bun run build         # Build with optimizations');
  console.log('  bun run fonts:check   # Check font file sizes');
}

main();