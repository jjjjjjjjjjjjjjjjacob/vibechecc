#!/usr/bin/env node

/**
 * Enhanced Bundle Analysis Script for vibechecc
 * Provides detailed bundle size analysis, dependency breakdown, and optimization recommendations
 */

/* eslint-disable no-console */

import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

const DIST_DIR = './.output';
const PUBLIC_DIR = './public';
const PACKAGE_JSON_PATH = './package.json';

// ANSI color codes for better terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright: '\x1b[1m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
};

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getFileSize(filePath) {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function estimateGzipSize(size) {
  // Rough estimate: gzip typically reduces by 60-80%
  return Math.round(size * 0.3);
}

function estimateBrotliSize(size) {
  // Rough estimate: brotli typically reduces by 70-85%
  return Math.round(size * 0.25);
}

function getDependencyInfo() {
  try {
    const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Estimated sizes for common heavy dependencies (in KB)
    const heavyDeps = {
      react: 42,
      'react-dom': 130,
      'framer-motion': 180,
      recharts: 350,
      '@tanstack/react-query': 85,
      '@tanstack/react-router': 120,
      '@tanstack/react-start': 150,
      '@tanstack/react-table': 95,
      'lucide-react': 600, // Very heavy due to all icons
      'date-fns': 200,
      convex: 150,
      'posthog-js': 120,
      '@clerk/tanstack-react-start': 180,
      'next-themes': 15,
      sonner: 25,
      cmdk: 45,
      vaul: 30,
      zustand: 25,
      zod: 60,
      clsx: 5,
      'tailwind-merge': 15,
      'class-variance-authority': 8,
      'tiny-invariant': 2,
      ky: 15,
      redaxios: 8,
      geist: 50,
    };

    const radixPackages = Object.keys(deps).filter((dep) =>
      dep.startsWith('@radix-ui/')
    );
    const totalRadixEstimate = radixPackages.length * 25; // ~25KB per Radix component

    return {
      totalDeps: Object.keys(deps).length,
      heavyDeps: Object.entries(heavyDeps).filter(([dep]) => deps[dep]),
      radixPackages,
      totalRadixEstimate,
      estimatedTotalSize:
        Object.entries(heavyDeps)
          .filter(([dep]) => deps[dep])
          .reduce((sum, [, size]) => sum + size, 0) + totalRadixEstimate,
    };
  } catch (error) {
    console.warn('Could not analyze dependencies:', error.message);
    return null;
  }
}

function analyzeJSBundles() {
  console.log(
    `${colors.bright}${colors.blue}📦 JavaScript Bundle Analysis${colors.reset}\n`
  );

  if (!existsSync(DIST_DIR)) {
    console.log(
      `${colors.red}❌ Build directory not found. Run: bun run build${colors.reset}`
    );
    return null;
  }

  const jsFiles = [];
  const clientFiles = [];
  const serverFiles = [];

  function findJSFiles(dir, basePath = '') {
    try {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = join(dir, item);
        const relativePath = join(basePath, item);

        if (statSync(fullPath).isDirectory()) {
          findJSFiles(fullPath, relativePath);
        } else if (item.endsWith('.js') || item.endsWith('.mjs')) {
          const size = getFileSize(fullPath);
          const fileInfo = {
            name: relativePath,
            size,
            formattedSize: formatSize(size),
            gzipSize: estimateGzipSize(size),
            brotliSize: estimateBrotliSize(size),
            path: fullPath,
            isClient: fullPath.includes('/public/'),
            isServer: fullPath.includes('/server/'),
          };

          jsFiles.push(fileInfo);

          if (fileInfo.isClient) {
            clientFiles.push(fileInfo);
          } else if (fileInfo.isServer) {
            serverFiles.push(fileInfo);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${dir}:`, error.message);
    }
  }

  findJSFiles(DIST_DIR);

  // Sort by size
  jsFiles.sort((a, b) => b.size - a.size);
  clientFiles.sort((a, b) => b.size - a.size);
  serverFiles.sort((a, b) => b.size - a.size);

  // Display client bundles (most important for performance)
  console.log(
    `${colors.bright}🌐 Client-Side Bundles (Critical for Performance):${colors.reset}`
  );
  if (clientFiles.length === 0) {
    console.log(`${colors.yellow}  No client bundles found${colors.reset}`);
  } else {
    clientFiles.slice(0, 10).forEach((file) => {
      const icon = file.size > 500000 ? '🔴' : file.size > 200000 ? '🟡' : '🟢';
      const gzipFormatted = formatSize(file.gzipSize);
      const brotliFormatted = formatSize(file.brotliSize);

      console.log(`  ${icon} ${file.name}`);
      console.log(
        `     ${colors.dim}Raw: ${file.formattedSize} | Gzip: ~${gzipFormatted} | Brotli: ~${brotliFormatted}${colors.reset}`
      );
    });
  }

  // Display server bundles summary
  console.log(`\n${colors.bright}⚙️  Server-Side Bundles:${colors.reset}`);
  if (serverFiles.length === 0) {
    console.log(`${colors.yellow}  No server bundles found${colors.reset}`);
  } else {
    const topServerFiles = serverFiles.slice(0, 5);
    topServerFiles.forEach((file) => {
      console.log(`  📄 ${file.name}: ${file.formattedSize}`);
    });
    if (serverFiles.length > 5) {
      console.log(
        `  ${colors.dim}... and ${serverFiles.length - 5} more files${colors.reset}`
      );
    }
  }

  // Calculate totals
  const totalSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
  const clientSize = clientFiles.reduce((sum, file) => sum + file.size, 0);
  const serverSize = serverFiles.reduce((sum, file) => sum + file.size, 0);

  console.log(`\n${colors.bright}📊 Bundle Size Summary:${colors.reset}`);
  console.log(
    `  🌐 Client Total: ${formatSize(clientSize)} (${colors.yellow}${formatSize(estimateGzipSize(clientSize))} gzipped${colors.reset})`
  );
  console.log(`  ⚙️  Server Total: ${formatSize(serverSize)}`);
  console.log(`  📦 Grand Total: ${formatSize(totalSize)}`);

  return {
    jsFiles,
    clientFiles,
    serverFiles,
    totalSize,
    clientSize,
    serverSize,
  };
}

function analyzeDependencies() {
  console.log(
    `\n${colors.bright}${colors.magenta}📦 Dependency Analysis${colors.reset}\n`
  );

  const depInfo = getDependencyInfo();
  if (!depInfo) return;

  console.log(`${colors.bright}📊 Dependency Overview:${colors.reset}`);
  console.log(`  Total Dependencies: ${depInfo.totalDeps}`);
  console.log(
    `  Estimated Bundle Size: ${formatSize(depInfo.estimatedTotalSize * 1024)}`
  );
  console.log(
    `  Radix UI Components: ${depInfo.radixPackages.length} (~${formatSize(depInfo.totalRadixEstimate * 1024)})`
  );

  console.log(
    `\n${colors.bright}🏋️  Heavy Dependencies (>50KB):${colors.reset}`
  );
  depInfo.heavyDeps
    .sort((a, b) => b[1] - a[1])
    .forEach(([dep, size]) => {
      const color =
        size > 200 ? colors.red : size > 100 ? colors.yellow : colors.green;
      console.log(
        `  ${color}${dep}: ~${formatSize(size * 1024)}${colors.reset}`
      );
    });

  console.log(`\n${colors.bright}🧩 Radix UI Components:${colors.reset}`);
  depInfo.radixPackages.slice(0, 8).forEach((pkg) => {
    const componentName = pkg.replace('@radix-ui/react-', '');
    console.log(`  🔸 ${componentName}`);
  });
  if (depInfo.radixPackages.length > 8) {
    console.log(
      `  ${colors.dim}... and ${depInfo.radixPackages.length - 8} more${colors.reset}`
    );
  }

  return depInfo;
}

function analyzeOptimizationOpportunities(bundleInfo, depInfo) {
  console.log(
    `\n${colors.bright}${colors.cyan}🚀 Optimization Opportunities${colors.reset}\n`
  );

  const opportunities = [];

  // Check client bundle size
  if (bundleInfo?.clientSize > 2000000) {
    // 2MB
    opportunities.push({
      type: 'critical',
      title: 'Large Client Bundle',
      description: `Client bundle is ${formatSize(bundleInfo.clientSize)}. Target: <500KB`,
      actions: [
        'Implement code splitting',
        'Use dynamic imports',
        'Remove unused dependencies',
      ],
    });
  }

  // Check for heavy dependencies
  if (depInfo?.heavyDeps) {
    const veryHeavy = depInfo.heavyDeps.filter(([, size]) => size > 200);
    if (veryHeavy.length > 0) {
      opportunities.push({
        type: 'high',
        title: 'Heavy Dependencies',
        description: `${veryHeavy.length} dependencies >200KB each`,
        actions: [
          'Consider lighter alternatives',
          'Use tree-shaking imports',
          'Lazy load heavy components',
        ],
      });
    }
  }

  // Check for many Radix components
  if (depInfo?.radixPackages.length > 10) {
    opportunities.push({
      type: 'medium',
      title: 'Many UI Components',
      description: `${depInfo.radixPackages.length} Radix UI components`,
      actions: [
        'Audit unused components',
        'Consider component bundling',
        'Use barrel exports efficiently',
      ],
    });
  }

  // Check for font optimization
  const fontsDir = join(PUBLIC_DIR, 'fonts');
  if (existsSync(fontsDir)) {
    const fontFiles = readdirSync(fontsDir).filter(
      (f) => f.endsWith('.ttf') || f.endsWith('.woff') || f.endsWith('.woff2')
    );
    const hasLargeFonts = fontFiles.some(
      (f) => getFileSize(join(fontsDir, f)) > 100000
    );

    if (hasLargeFonts) {
      opportunities.push({
        type: 'medium',
        title: 'Font Optimization',
        description: 'Large font files detected',
        actions: [
          'Subset fonts',
          'Use woff2 format',
          'Implement font-display: swap',
        ],
      });
    }
  }

  // Display opportunities
  opportunities.forEach((opp, index) => {
    const typeIcon =
      opp.type === 'critical' ? '🔴' : opp.type === 'high' ? '🟡' : '🔵';

    console.log(`${typeIcon} ${colors.bright}${opp.title}${colors.reset}`);
    console.log(`   ${colors.dim}${opp.description}${colors.reset}`);
    console.log(`   ${colors.bright}Actions:${colors.reset}`);
    opp.actions.forEach((action) => {
      console.log(`   ${colors.green}  ✓${colors.reset} ${action}`);
    });

    if (index < opportunities.length - 1) console.log('');
  });

  if (opportunities.length === 0) {
    console.log(
      `${colors.green}✅ No major optimization opportunities detected!${colors.reset}`
    );
  }

  return opportunities;
}

function showPerformanceImpact() {
  console.log(
    `\n${colors.bright}${colors.green}📈 Performance Impact Estimates${colors.reset}\n`
  );

  const networkSpeeds = {
    'Slow 3G': { speed: 0.4, description: '400 Kbps (developing countries)' },
    'Fast 3G': { speed: 1.6, description: '1.6 Mbps (rural areas)' },
    '4G LTE': { speed: 12, description: '12 Mbps (urban areas)' },
    '5G': { speed: 100, description: '100 Mbps (major cities)' },
  };

  const bundleSizes = {
    'Current (2MB)': 2048,
    'Optimized (500KB)': 512,
    'Highly Optimized (200KB)': 204.8,
  };

  console.log(`${colors.bright}⏱️  Download Time Estimates:${colors.reset}`);

  Object.entries(bundleSizes).forEach(([label, sizeKB]) => {
    console.log(`\n  ${colors.bright}${label}:${colors.reset}`);
    Object.entries(networkSpeeds).forEach(([network, { speed }]) => {
      const timeSeconds = (sizeKB * 8) / (speed * 1000); // Convert to seconds
      const formatted =
        timeSeconds < 1
          ? `${Math.round(timeSeconds * 1000)}ms`
          : timeSeconds < 60
            ? `${timeSeconds.toFixed(1)}s`
            : `${Math.floor(timeSeconds / 60)}m ${Math.round(timeSeconds % 60)}s`;

      const color =
        timeSeconds > 10
          ? colors.red
          : timeSeconds > 3
            ? colors.yellow
            : colors.green;
      console.log(`    ${network}: ${color}${formatted}${colors.reset}`);
    });
  });

  console.log(`\n${colors.bright}💡 Performance Goals:${colors.reset}`);
  console.log(
    `  🎯 ${colors.green}Primary Goal: <500KB total bundle${colors.reset}`
  );
  console.log(
    `  🎯 ${colors.green}Stretch Goal: <200KB critical path${colors.reset}`
  );
  console.log(
    `  🎯 ${colors.green}Font Budget: <100KB fonts total${colors.reset}`
  );
}

function showActionableRecommendations() {
  console.log(
    `\n${colors.bright}${colors.cyan}🛠️  Actionable Recommendations${colors.reset}\n`
  );

  const recommendations = [
    {
      priority: 'High',
      task: 'Implement Route-Based Code Splitting',
      impact: '40-60% bundle reduction',
      effort: 'Medium',
      steps: [
        'Add dynamic imports for admin routes',
        'Lazy load heavy components (charts, tables)',
        'Split vendor chunks by usage frequency',
      ],
    },
    {
      priority: 'High',
      task: 'Optimize Lucide Icons Import',
      impact: '300-500KB reduction',
      effort: 'Low',
      steps: [
        'Replace lucide-react with individual icon imports',
        'Create icon barrel file with only used icons',
        'Use tree-shaking compatible imports',
      ],
    },
    {
      priority: 'Medium',
      task: 'Configure Manual Chunks',
      impact: '20-30% better caching',
      effort: 'Medium',
      steps: [
        'Separate vendor chunks by update frequency',
        'Create shared component chunk',
        'Optimize chunk dependencies',
      ],
    },
    {
      priority: 'Medium',
      task: 'Implement Compression',
      impact: '60-70% transfer reduction',
      effort: 'Low',
      steps: [
        'Enable Brotli compression',
        'Configure gzip fallback',
        'Set proper cache headers',
      ],
    },
    {
      priority: 'Low',
      task: 'Audit and Remove Unused Dependencies',
      impact: '5-15% bundle reduction',
      effort: 'High',
      steps: [
        'Use bundle analyzer to identify unused code',
        'Remove unused Radix components',
        'Replace heavy libraries with lighter alternatives',
      ],
    },
  ];

  recommendations.forEach((rec, index) => {
    const priorityColor =
      rec.priority === 'High'
        ? colors.red
        : rec.priority === 'Medium'
          ? colors.yellow
          : colors.blue;

    console.log(
      `${colors.bright}${priorityColor}${rec.priority} Priority:${colors.reset} ${rec.task}`
    );
    console.log(
      `  ${colors.green}Impact:${colors.reset} ${rec.impact} | ${colors.blue}Effort:${colors.reset} ${rec.effort}`
    );
    console.log(`  ${colors.bright}Steps:${colors.reset}`);
    rec.steps.forEach((step) => {
      console.log(`    ${colors.dim}•${colors.reset} ${step}`);
    });

    if (index < recommendations.length - 1) console.log('');
  });
}

function main() {
  console.log(
    `${colors.bright}${colors.cyan}🎯 Enhanced Bundle Analysis for vibechecc${colors.reset}\n`
  );
  console.log(
    `${colors.dim}Analyzing build output and providing optimization recommendations...${colors.reset}\n`
  );

  const bundleInfo = analyzeJSBundles();
  const depInfo = analyzeDependencies();

  if (bundleInfo || depInfo) {
    analyzeOptimizationOpportunities(bundleInfo, depInfo);
    showPerformanceImpact();
    showActionableRecommendations();
  }

  console.log(`\n${colors.bright}🔧 Quick Commands:${colors.reset}`);
  console.log(
    `  ${colors.cyan}bun run build${colors.reset}                    # Build with current config`
  );
  console.log(
    `  ${colors.cyan}bun run bundle:analyze${colors.reset}           # Run this enhanced analyzer`
  );
  console.log(
    `  ${colors.cyan}bun run bundle:visualize${colors.reset}         # Visual bundle analysis (after implementing)`
  );
  console.log(
    `  ${colors.cyan}node scripts/optimize-bundle.js${colors.reset}  # Apply optimizations (after creating)`
  );

  console.log(
    `\n${colors.bright}${colors.green}🎉 Ready to optimize! Start with high-priority recommendations.${colors.reset}`
  );
}

main();
