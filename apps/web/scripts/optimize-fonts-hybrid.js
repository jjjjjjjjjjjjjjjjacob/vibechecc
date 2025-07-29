#!/usr/bin/env node

/**
 * Hybrid Font Optimization
 * - Uses system fonts for emoji (instant)
 * - Only processes fonts that need conversion
 * - Skips already optimized WOFF2 files
 */

import { execSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  // statSync,
} from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_FONTS_DIR = join(__dirname, '../public/fonts');
const OPTIMIZED_FONTS_DIR = join(PUBLIC_FONTS_DIR, 'optimized');
const CSS_OUTPUT = join(__dirname, '../src/styles/fonts.css');

const FONTS_CONFIG = [
  {
    name: 'GeistSans',
    file: 'GeistSans-Variable.woff2',
    skipOptimization: true, // Already WOFF2
  },
  {
    name: 'GeistMono',
    file: 'GeistMono-Variable.woff2',
    skipOptimization: true, // Already WOFF2
  },
  {
    name: 'Doto',
    file: 'Doto-VariableFont_ROND,wght.ttf',
    skipOptimization: false, // Needs conversion
    unicodeRange: 'U+0000-00FF', // Latin only
  },
  {
    name: 'NotoEmoji',
    file: 'NotoEmoji-VariableFont_wght.ttf',
    skipOptimization: false, // Needs conversion
    unicodeRange: 'U+1F600-1F64F, U+1F300-1F5FF, U+1F680-1F6FF, U+1F1E0-1F1FF, U+2600-26FF, U+2700-27BF, U+FE00-FE0F, U+1F900-1F9FF', // Common emoji ranges
  },
  {
    name: 'NotoColorEmoji',
    file: 'NotoColorEmoji-Regular.ttf',
    skipOptimization: true, // Use pre-optimized files
    skipInCSS: true, // We'll add manually in CSS generation
  },
];

function getPyftsubsetPath() {
  try {
    execSync('pyftsubset --help', { stdio: 'ignore' });
    return 'pyftsubset';
  } catch {
    try {
      execSync('/Users/jacob/Library/Python/3.9/bin/pyftsubset --help', {
        stdio: 'ignore',
      });
      return '/Users/jacob/Library/Python/3.9/bin/pyftsubset';
    } catch {
      return null;
    }
  }
}

function quickSubset(inputPath, outputPath, unicodeRange) {
  const pyftsubset = getPyftsubsetPath();
  if (!pyftsubset) {
    // console.warn('⚠️  pyftsubset not found, copying original file');
    copyFileSync(inputPath, outputPath);
    return;
  }

  const cmd = `${pyftsubset} "${inputPath}" --output-file="${outputPath}" --flavor=woff2 --unicodes="${unicodeRange}" --no-hinting --desubroutinize`;

  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch {
    // console.warn('⚠️  Subsetting failed, copying original');
    copyFileSync(inputPath, outputPath);
  }
}

function generateCSS(processedFonts) {
  let css = `/* Hybrid Font Loading - Fast & Optimized */

`;

  // Add font-face rules
  processedFonts.forEach((font) => {
    if (font.skipInCSS) return; // Skip fonts we'll add manually
    
    const fontPath = `/fonts/optimized/${font.outputName}`;

    css += `@font-face {
  font-family: '${font.name}';
  src: url('${fontPath}') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;${font.unicodeRange ? `\n  unicode-range: ${font.unicodeRange};` : ''}
}

`;
  });

  // Add Noto Color Emoji fonts
  css += `/* Noto Color Emoji - Core Set (Most Common Emojis) */
@font-face {
  font-family: 'NotoColorEmoji';
  src: url('/fonts/optimized/noto-color-emoji-core.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
  unicode-range: U+1F600-1F64F, U+1F300-1F5FF, U+1F680-1F6FF, U+1F1E0-1F1FF, U+2600-26FF, U+2700-27BF, U+FE00-FE0F, U+1F900-1F9FF;
}

/* Noto Color Emoji - Extended Set (Less Common Emojis) */
@font-face {
  font-family: 'NotoColorEmoji';
  src: url('/fonts/optimized/noto-color-emoji-extended.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
  unicode-range: U+1F780-1F7FF, U+1F800-1F8FF, U+1FAA0-1FAFF, U+1FB00-1FBFF;
}

/* Font Stacks */
:root {
  --font-sans: 'GeistSans', system-ui, -apple-system, sans-serif;
  --font-mono: 'GeistMono', ui-monospace, monospace;
  --font-display: 'Doto', system-ui, sans-serif;
  --font-emoji: 'NotoColorEmoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  --font-emoji-outline: 'NotoEmoji', system-ui, sans-serif;
}

/* Apply emoji font to common elements */
body {
  font-family: var(--font-sans), var(--font-emoji);
}

/* Ensure emojis use the emoji font */
.emoji, [data-emoji] {
  font-family: var(--font-emoji);
}`;

  return css;
}

// function formatBytes(bytes) {
//   return (bytes / 1024).toFixed(1) + ' KB';
// }

async function main() {
  // console.log('🚀 Hybrid Font Optimization (Fast Mode)\n');
  // const startTime = Date.now();

  mkdirSync(OPTIMIZED_FONTS_DIR, { recursive: true });

  const processedFonts = [];

  for (const font of FONTS_CONFIG) {
    const inputPath = join(PUBLIC_FONTS_DIR, font.file);
    if (!existsSync(inputPath)) {
      // console.warn(`⚠️  Font not found: ${font.file}`);
      continue;
    }

    // const inputSize = statSync(inputPath).size;
    // console.log(`📁 ${font.name} (${formatBytes(inputSize)})`);

    if (font.skipOptimization) {
      // Just copy WOFF2 files
      const outputName = basename(font.file);
      const outputPath = join(OPTIMIZED_FONTS_DIR, outputName);

      copyFileSync(inputPath, outputPath);
      // console.log(`   ✅ Copied (already optimized)\n`);

      processedFonts.push({ ...font, outputName });
    } else {
      // Convert TTF to WOFF2 with subsetting
      const outputName = basename(font.file, '.ttf') + '.woff2';
      const outputPath = join(OPTIMIZED_FONTS_DIR, outputName);

      // console.log(`   ⚙️  Converting to WOFF2...`);
      quickSubset(inputPath, outputPath, font.unicodeRange || 'U+0000-00FF');

      // const outputSize = existsSync(outputPath) ? statSync(outputPath).size : 0;
      // const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);
      // console.log(
      //   `   ✅ Optimized to ${formatBytes(outputSize)} (${savings}% smaller)\n`
      // );

      processedFonts.push({ ...font, outputName });
    }
  }

  // Generate CSS
  // console.log('📝 Generating CSS...');
  const css = generateCSS(processedFonts);
  writeFileSync(CSS_OUTPUT, css);

  // const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  // console.log(`\n✅ Complete in ${duration}s!`);

  // console.log('\n🎯 Optimizations Applied:');
  // console.log('   • WOFF2 fonts used directly (no re-processing)');
  // console.log('   • System emoji fonts (0 KB download)');
  // console.log('   • Latin-only subset for Doto font');
  // console.log('   • font-display: swap for instant text');
}

main().catch((_e) => {
  // console.error(e);
  process.exit(1);
});
