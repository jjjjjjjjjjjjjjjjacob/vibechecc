#!/usr/bin/env node

/**
 * Code Splitting Optimizer for vibechecc
 *
 * This script identifies heavy components and routes that should be
 * lazily loaded to reduce the initial bundle size.
 */

import { existsSync, readdirSync, statSync, readFileSync } from 'fs';

import { join, relative as _relative } from 'path';

const ROUTES_DIR = './src/routes';
const FEATURES_DIR = './src/features';

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
};

function getFileSize(filePath) {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function analyzeImports(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const heavyImports = [];

    // Look for heavy dependencies
    const heavyDeps = [
      'recharts',
      '@tanstack/react-table',
      'framer-motion',
      'posthog-js',
      'date-fns',
    ];

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      heavyDeps.forEach((dep) => {
        if (line.includes(`from '${dep}'`) || line.includes(`from "${dep}"`)) {
          heavyImports.push({
            dependency: dep,
            line: index + 1,
            import: line.trim(),
          });
        }
      });
    });

    return heavyImports;
  } catch {
    return [];
  }
}

function analyzeLargeComponents(dir, basePath = '') {
  const components = [];

  if (!existsSync(dir)) return components;

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const relativePath = join(basePath, item);

      if (statSync(fullPath).isDirectory()) {
        components.push(...analyzeLargeComponents(fullPath, relativePath));
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        const size = getFileSize(fullPath);
        const heavyImports = analyzeImports(fullPath);

        if (size > 5000 || heavyImports.length > 0) {
          // 5KB+ or has heavy imports
          components.push({
            name: relativePath,
            path: fullPath,
            size,
            heavyImports,
            isLarge: size > 10000, // 10KB+
            isHeavy: heavyImports.length > 0,
          });
        }
      }
    }
  } catch (error) {
    console.warn(`Could not analyze ${dir}:`, error.message);
  }

  return components;
}

function identifyLazyLoadCandidates() {
  console.log(
    `${colors.bright}🔍 Analyzing Components for Lazy Loading${colors.reset}\n`
  );

  // Analyze routes
  const routes = analyzeLargeComponents(ROUTES_DIR, 'routes');
  const features = analyzeLargeComponents(FEATURES_DIR, 'features');

  const allComponents = [...routes, ...features].sort(
    (a, b) => b.size - a.size
  );

  // Categorize components
  const criticalRoutes = allComponents.filter(
    (c) =>
      c.name.includes('routes/index') ||
      c.name.includes('routes/__root') ||
      c.name.includes('routes/search')
  );

  const adminRoutes = allComponents.filter(
    (c) => c.name.includes('admin') && c.name.includes('routes')
  );

  const heavyFeatures = allComponents.filter(
    (c) => c.isHeavy && c.name.includes('features')
  );

  const largeComponents = allComponents.filter(
    (c) => c.isLarge && !criticalRoutes.includes(c)
  );

  return {
    criticalRoutes,
    adminRoutes,
    heavyFeatures,
    largeComponents,
    allComponents,
  };
}

function showAnalysis(candidates) {
  const {
    criticalRoutes,
    adminRoutes,
    heavyFeatures,
    largeComponents,

    allComponents: _allComponents,
  } = candidates;

  console.log(`${colors.bright}📊 Component Analysis Results${colors.reset}\n`);

  // Show critical routes (should stay in main bundle)
  console.log(
    `${colors.green}✅ Critical Routes (Keep in Main Bundle):${colors.reset}`
  );
  if (criticalRoutes.length === 0) {
    console.log(`  ${colors.dim}No critical routes identified${colors.reset}`);
  } else {
    criticalRoutes.forEach((component) => {
      console.log(`  📄 ${component.name}: ${formatSize(component.size)}`);
    });
  }

  // Show admin routes (good lazy loading candidates)
  console.log(
    `\n${colors.yellow}🎯 Admin Routes (Lazy Load Candidates):${colors.reset}`
  );
  if (adminRoutes.length === 0) {
    console.log(`  ${colors.dim}No admin routes found${colors.reset}`);
  } else {
    adminRoutes.slice(0, 10).forEach((component) => {
      const indicator = component.isHeavy ? '🔴' : '🟡';
      console.log(
        `  ${indicator} ${component.name}: ${formatSize(component.size)}`
      );
      if (component.heavyImports.length > 0) {
        component.heavyImports.forEach((imp) => {
          console.log(`     ${colors.dim}└── ${imp.dependency}${colors.reset}`);
        });
      }
    });
  }

  // Show heavy features
  console.log(
    `\n${colors.red}🏋️  Heavy Features (Priority Lazy Loading):${colors.reset}`
  );
  if (heavyFeatures.length === 0) {
    console.log(`  ${colors.dim}No heavy features identified${colors.reset}`);
  } else {
    heavyFeatures.slice(0, 10).forEach((component) => {
      console.log(`  🔴 ${component.name}: ${formatSize(component.size)}`);
      component.heavyImports.forEach((imp) => {
        console.log(`     ${colors.dim}└── ${imp.dependency}${colors.reset}`);
      });
    });
  }

  // Show large components
  console.log(
    `\n${colors.blue}📦 Large Components (Consider Lazy Loading):${colors.reset}`
  );
  if (largeComponents.length === 0) {
    console.log(`  ${colors.dim}No large components identified${colors.reset}`);
  } else {
    largeComponents.slice(0, 8).forEach((component) => {
      console.log(`  📄 ${component.name}: ${formatSize(component.size)}`);
    });
  }

  // Calculate potential savings
  const lazyLoadCandidates = [...adminRoutes, ...heavyFeatures];
  const totalLazySize = lazyLoadCandidates.reduce((sum, c) => sum + c.size, 0);

  console.log(
    `\n${colors.bright}💰 Potential Bundle Size Reduction:${colors.reset}`
  );
  console.log(`  Components to lazy load: ${lazyLoadCandidates.length}`);
  console.log(`  Estimated size reduction: ${formatSize(totalLazySize)}`);

  const estimatedPercentage = Math.min(
    (totalLazySize / (2 * 1024 * 1024)) * 100,
    40
  ); // Max 40% reduction estimate
  console.log(
    `  Expected bundle reduction: ~${estimatedPercentage.toFixed(1)}%`
  );
}

function generateOptimizationRecommendations(candidates) {
  const { adminRoutes, heavyFeatures } = candidates;

  console.log(
    `\n${colors.bright}🛠️  Optimization Recommendations${colors.reset}\n`
  );

  const recommendations = [];

  // Admin routes optimization
  if (adminRoutes.length > 0) {
    recommendations.push({
      priority: 'High',
      title: 'Lazy Load Admin Routes',
      impact: `${formatSize(adminRoutes.reduce((sum, c) => sum + c.size, 0))} bundle reduction`,
      files: adminRoutes.slice(0, 5).map((c) => c.name),
      action: 'Convert to lazy-loaded route components using React.lazy()',
    });
  }

  // Heavy features optimization
  const chartsFeatures = heavyFeatures.filter((c) =>
    c.heavyImports.some((imp) => imp.dependency === 'recharts')
  );

  if (chartsFeatures.length > 0) {
    recommendations.push({
      priority: 'High',
      title: 'Lazy Load Chart Components',
      impact: `${formatSize(chartsFeatures.reduce((sum, c) => sum + c.size, 0))} + 350KB recharts`,
      files: chartsFeatures.map((c) => c.name),
      action: 'Wrap chart components with React.lazy() and Suspense',
    });
  }

  const tableFeatures = heavyFeatures.filter((c) =>
    c.heavyImports.some((imp) => imp.dependency === '@tanstack/react-table')
  );

  if (tableFeatures.length > 0) {
    recommendations.push({
      priority: 'Medium',
      title: 'Lazy Load Data Table Components',
      impact: `${formatSize(tableFeatures.reduce((sum, c) => sum + c.size, 0))} + 95KB react-table`,
      files: tableFeatures.map((c) => c.name),
      action: 'Use dynamic imports for admin table components',
    });
  }

  // Display recommendations
  recommendations.forEach((rec, index) => {
    const priorityColor =
      rec.priority === 'High'
        ? colors.red
        : rec.priority === 'Medium'
          ? colors.yellow
          : colors.blue;

    console.log(
      `${priorityColor}${rec.priority} Priority: ${colors.bright}${rec.title}${colors.reset}`
    );
    console.log(`  ${colors.green}Impact:${colors.reset} ${rec.impact}`);
    console.log(`  ${colors.blue}Action:${colors.reset} ${rec.action}`);
    console.log(`  ${colors.dim}Files:${colors.reset}`);
    rec.files.slice(0, 3).forEach((file) => {
      console.log(`    • ${file}`);
    });
    if (rec.files.length > 3) {
      console.log(
        `    ${colors.dim}... and ${rec.files.length - 3} more${colors.reset}`
      );
    }

    if (index < recommendations.length - 1) console.log('');
  });

  return recommendations;
}

function generateCodeExamples() {
  console.log(`\n${colors.bright}📝 Implementation Examples${colors.reset}\n`);

  console.log(`${colors.cyan}1. Lazy Loading Admin Routes:${colors.reset}`);
  console.log(`${colors.dim}// Before:${colors.reset}`);
  console.log(
    `import { AdminDashboard } from '../features/admin/components/admin-dashboard';`
  );
  console.log(``);
  console.log(`${colors.dim}// After:${colors.reset}`);
  console.log(`import { lazy, Suspense } from 'react';`);
  console.log(
    `const AdminDashboard = lazy(() => import('../features/admin/components/admin-dashboard'));`
  );
  console.log(``);
  console.log(`function AdminRoute() {`);
  console.log(`  return (`);
  console.log(`    <Suspense fallback={<div>Loading admin...</div>}>`);
  console.log(`      <AdminDashboard />`);
  console.log(`    </Suspense>`);
  console.log(`  );`);
  console.log(`}`);

  console.log(
    `\n${colors.cyan}2. Lazy Loading Chart Components:${colors.reset}`
  );
  console.log(
    `${colors.dim}// components/charts/lazy-chart.tsx${colors.reset}`
  );
  console.log(`import { lazy, Suspense } from 'react';`);
  console.log(
    `const ReChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })));`
  );
  console.log(``);
  console.log(`export function LazyLineChart(props) {`);
  console.log(`  return (`);
  console.log(
    `    <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded" />}>`
  );
  console.log(`      <ReChart {...props} />`);
  console.log(`    </Suspense>`);
  console.log(`  );`);
  console.log(`}`);

  console.log(
    `\n${colors.cyan}3. Dynamic Import with Loading States:${colors.reset}`
  );
  console.log(`${colors.dim}// hooks/use-lazy-component.ts${colors.reset}`);
  console.log(`import { useState, useEffect } from 'react';`);
  console.log(``);
  console.log(
    `export function useLazyComponent<T>(importFn: () => Promise<{ default: T }>) {`
  );
  console.log(`  const [component, setComponent] = useState<T | null>(null);`);
  console.log(`  const [loading, setLoading] = useState(true);`);
  console.log(``);
  console.log(`  useEffect(() => {`);
  console.log(`    importFn().then(module => {`);
  console.log(`      setComponent(module.default);`);
  console.log(`      setLoading(false);`);
  console.log(`    });`);
  console.log(`  }, []);`);
  console.log(``);
  console.log(`  return { component, loading };`);
  console.log(`}`);
}

function main() {
  console.log(
    `${colors.bright}${colors.cyan}🎯 Code Splitting Analysis for vibechecc${colors.reset}\n`
  );
  console.log(
    `${colors.dim}Identifying components for lazy loading optimization...${colors.reset}\n`
  );

  const candidates = identifyLazyLoadCandidates();

  showAnalysis(candidates);
  const recommendations = generateOptimizationRecommendations(candidates);
  generateCodeExamples();

  console.log(`\n${colors.bright}🚀 Next Steps:${colors.reset}`);
  console.log(`  1. Implement lazy loading for high-priority components`);
  console.log(`  2. Add proper loading states and error boundaries`);
  console.log(`  3. Test that routes still work correctly`);
  console.log(`  4. Measure bundle size improvements`);

  console.log(
    `\n${colors.bright}${colors.green}✨ Code splitting analysis complete!${colors.reset}`
  );

  if (recommendations.length > 0) {
    console.log(
      `\n${colors.yellow}💡 Tip: Start with high-priority recommendations for maximum impact.${colors.reset}`
    );
  }
}

main();
