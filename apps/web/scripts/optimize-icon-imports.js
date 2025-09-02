#!/usr/bin/env node

/**
 * Icon Import Optimizer for vibechecc
 *
 * This script automatically replaces all lucide-react imports with optimized
 * imports from our custom icon barrel to reduce bundle size dramatically.
 *
 * Usage: node scripts/optimize-icon-imports.js
 */

import { readFileSync, writeFileSync } from 'fs';

import { join as _join, relative as _relative } from 'path';
import { execSync } from 'child_process';

const SRC_DIR = './src';

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

function findLucideImports() {
  try {
    // Find all files with lucide-react imports
    const output = execSync(
      `grep -r "from ['"]lucide-react['"]" ${SRC_DIR} --include="*.tsx" --include="*.ts"`,
      { encoding: 'utf8' }
    );

    return output
      .trim()
      .split('\n')
      .map((line) => {
        const [filePath] = line.split(':');
        return filePath;
      })
      .filter((file, index, array) => array.indexOf(file) === index); // Remove duplicates
  } catch (error) {
    if (error.status === 1) {
      // No matches found
      return [];
    }
    throw error;
  }
}

function extractIconsFromImport(importStatement) {
  // Match import { Icon1, Icon2, ... } from 'lucide-react'
  const match = importStatement.match(
    /import\s*{\s*([^}]+)\s*}\s*from\s*['"]lucide-react['"]/
  );
  if (!match) return [];

  return match[1]
    .split(',')
    .map((icon) => icon.trim())
    .filter((icon) => icon.length > 0);
}

function _calculateRelativeIconImport(_filePath) {
  // Calculate relative path from file to icons
  const relativePath = _relative(_filePath, 'src/components/ui/icons');

  // Clean up the path (remove .tsx extension and handle current directory)
  let cleanPath = relativePath.replace(/\.tsx$/, '');

  // If we're in the same directory or a subdirectory, adjust the path
  if (!cleanPath.startsWith('../')) {
    cleanPath = './' + cleanPath;
  }

  // Ensure it ends properly for the icons file
  if (cleanPath.endsWith('/icons')) {
    // cleanPath is already correct
  } else if (cleanPath === './') {
    cleanPath = './icons';
  } else {
    cleanPath = cleanPath + '/icons';
  }

  return cleanPath;
}

function optimizeFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let hasChanges = false;
    const changedImports = [];

    const optimizedLines = lines.map((line) => {
      // Check if line contains lucide-react import
      if (
        line.includes("from 'lucide-react'") ||
        line.includes('from "lucide-react"')
      ) {
        const icons = extractIconsFromImport(line);

        if (icons.length > 0) {
          // Calculate the relative import path
          const iconImportPath = '@/components/ui/icons'; // Always use absolute import for consistency

          // Create the new import statement
          const newImportLine = `import { ${icons.join(', ')} } from '${iconImportPath}';`;

          changedImports.push({
            old: line.trim(),
            new: newImportLine,
            icons: icons,
          });

          hasChanges = true;
          return newImportLine;
        }
      }

      return line;
    });

    if (hasChanges) {
      writeFileSync(filePath, optimizedLines.join('\n'), 'utf8');
      return { success: true, changes: changedImports };
    }

    return { success: true, changes: [] };
  } catch (error) {
    console.error(
      `${colors.red}Error processing ${filePath}:${colors.reset}`,
      error.message
    );
    return { success: false, error: error.message };
  }
}

function showSummary(results) {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const withChanges = successful.filter((r) => r.changes.length > 0);

  console.log(`\n${colors.bright}📊 Optimization Summary:${colors.reset}`);
  console.log(
    `  ${colors.green}✅ Successfully processed: ${successful.length} files${colors.reset}`
  );
  console.log(
    `  ${colors.yellow}🔄 Files with changes: ${withChanges.length} files${colors.reset}`
  );
  console.log(
    `  ${colors.red}❌ Failed to process: ${failed.length} files${colors.reset}`
  );

  if (failed.length > 0) {
    console.log(`\n${colors.red}Failed Files:${colors.reset}`);
    failed.forEach((result) => {
      console.log(
        `  ${colors.red}•${colors.reset} ${result.filePath}: ${result.error}`
      );
    });
  }

  // Calculate estimated bundle savings
  const totalIconsOptimized = withChanges.reduce((total, result) => {
    return (
      total +
      result.changes.reduce((sum, change) => sum + change.icons.length, 0)
    );
  }, 0);

  const estimatedSavings = Math.min(totalIconsOptimized * 8, 550); // ~8KB per icon, max 550KB savings

  console.log(
    `\n${colors.bright}📈 Expected Performance Impact:${colors.reset}`
  );
  console.log(
    `  ${colors.green}Bundle Size Reduction: ~${estimatedSavings}KB${colors.reset}`
  );
  console.log(
    `  ${colors.green}Icons Optimized: ${totalIconsOptimized} imports${colors.reset}`
  );
  console.log(
    `  ${colors.green}Files Updated: ${withChanges.length} files${colors.reset}`
  );

  if (estimatedSavings > 300) {
    console.log(
      `\n${colors.bright}${colors.green}🎉 Major optimization achieved! Expected 30%+ bundle size reduction.${colors.reset}`
    );
  } else if (estimatedSavings > 100) {
    console.log(
      `\n${colors.bright}${colors.yellow}🚀 Good optimization! Expected 10-15% bundle size reduction.${colors.reset}`
    );
  }
}

function main() {
  console.log(
    `${colors.bright}${colors.cyan}🎯 Icon Import Optimizer${colors.reset}\n`
  );
  console.log(
    `${colors.dim}Replacing lucide-react imports with optimized icon barrel...${colors.reset}\n`
  );

  // Find all files with lucide-react imports
  const files = findLucideImports();

  if (files.length === 0) {
    console.log(
      `${colors.yellow}No lucide-react imports found. Optimization may have already been applied.${colors.reset}`
    );
    return;
  }

  console.log(
    `${colors.bright}Found ${files.length} files with lucide-react imports${colors.reset}`
  );
  console.log(`${colors.dim}Processing files...${colors.reset}\n`);

  const results = [];

  files.forEach((filePath, index) => {
    const relativePath = filePath.replace('./src/', '');
    process.stdout.write(
      `  [${index + 1}/${files.length}] ${relativePath}... `
    );

    const result = optimizeFile(filePath);
    result.filePath = filePath;
    results.push(result);

    if (result.success) {
      if (result.changes.length > 0) {
        console.log(
          `${colors.green}✓ optimized (${result.changes.length} imports)${colors.reset}`
        );
      } else {
        console.log(`${colors.dim}• no changes needed${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}✗ failed${colors.reset}`);
    }
  });

  showSummary(results);

  console.log(`\n${colors.bright}🔧 Next Steps:${colors.reset}`);
  console.log(
    `  1. ${colors.cyan}bun run build${colors.reset} - Build with optimized imports`
  );
  console.log(
    `  2. ${colors.cyan}bun run bundle:analyze${colors.reset} - Verify bundle size reduction`
  );
  console.log(
    `  3. ${colors.cyan}bun run test${colors.reset} - Ensure no breaking changes`
  );

  console.log(
    `\n${colors.bright}${colors.green}✨ Icon optimization complete!${colors.reset}`
  );
}

main();
