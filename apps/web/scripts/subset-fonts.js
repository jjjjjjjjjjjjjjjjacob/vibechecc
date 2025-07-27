#!/usr/bin/env node

/**
 * Font subsetting script for Noto Color Emoji fonts
 * Reduces 25MB+ fonts to ~3-4MB by creating core and extended subsets
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_FONTS_DIR = join(__dirname, '../public/fonts');
const ORIGINAL_FONT = join(PUBLIC_FONTS_DIR, 'NotoColorEmoji-Regular.ttf');

// Core emoji Unicode ranges (most commonly used)
const CORE_RANGES = [
  'U+1F600-1F64F', // Emoticons
  'U+1F300-1F5FF', // Misc Symbols and Pictographs
  'U+1F680-1F6FF', // Transport and Map
  'U+1F1E0-1F1FF', // Regional Indicator Symbols (flags)
  'U+2600-26FF', // Misc symbols
  'U+2700-27BF', // Dingbats
  'U+FE00-FE0F', // Variation Selectors
  'U+1F900-1F9FF', // Supplemental Symbols and Pictographs
];

// Extended emoji ranges (loaded on-demand)
const EXTENDED_RANGES = [
  'U+1F780-1F7FF', // Geometric Shapes Extended
  'U+1F800-1F8FF', // Supplemental Arrows-C
  'U+1FAA0-1FAFF', // Symbols and Pictographs Extended-A
  'U+1FB00-1FBFF', // Symbols and Pictographs Extended-B
];

function checkFontTools() {
  try {
    execSync('pyftsubset --help', { stdio: 'ignore' });
    console.log('✅ pyftsubset found');
    return true;
  } catch {
    console.error(
      '❌ pyftsubset not found. Install with: pip install fonttools[woff]'
    );
    return false;
  }
}

function subsetFont(inputPath, outputPath, unicodeRanges, format = 'woff2') {
  const ranges = unicodeRanges.join(',');
  const cmd = [
    'pyftsubset',
    `"${inputPath}"`,
    `--output-file="${outputPath}"`,
    `--flavor=${format}`,
    `--unicodes=${ranges}`,
    '--layout-features="*"',
    '--glyph-names',
    '--symbol-cmap',
    '--legacy-cmap',
    '--notdef-glyph',
    '--notdef-outline',
    '--recommended-glyphs',
    '--name-legacy',
    '--drop-tables+=DSIG',
    '--ignore-missing-glyphs',
  ].join(' ');

  console.log(`Creating ${format.toUpperCase()} subset: ${outputPath}`);

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ Created: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to create ${outputPath}:`, error.message);
    throw error;
  }
}

function getFileSize(filePath) {
  try {
    const stats = execSync(`ls -lh "${filePath}"`, { encoding: 'utf8' });
    const size = stats.split(/\\s+/)[4];
    return size;
  } catch {
    return 'unknown';
  }
}

async function main() {
  console.log('🎨 Starting font subsetting process...\n');

  // Check if tools are available
  if (!checkFontTools()) {
    process.exit(1);
  }

  // Check if original font exists
  if (!existsSync(ORIGINAL_FONT)) {
    console.error(`❌ Original font not found: ${ORIGINAL_FONT}`);
    process.exit(1);
  }

  const originalSize = getFileSize(ORIGINAL_FONT);
  console.log(`📦 Original font size: ${originalSize}\n`);

  // Ensure output directory exists
  mkdirSync(PUBLIC_FONTS_DIR, { recursive: true });

  try {
    // Create core emoji subset (WOFF2)
    const coreOutputWoff2 = join(
      PUBLIC_FONTS_DIR,
      'noto-color-emoji-core.woff2'
    );
    subsetFont(ORIGINAL_FONT, coreOutputWoff2, CORE_RANGES, 'woff2');

    // Create extended emoji subset (WOFF2)
    const extendedOutputWoff2 = join(
      PUBLIC_FONTS_DIR,
      'noto-color-emoji-extended.woff2'
    );
    subsetFont(ORIGINAL_FONT, extendedOutputWoff2, EXTENDED_RANGES, 'woff2');

    // Create TTF fallbacks for older browsers
    const coreOutputTtf = join(PUBLIC_FONTS_DIR, 'noto-color-emoji-core.ttf');
    subsetFont(ORIGINAL_FONT, coreOutputTtf, CORE_RANGES, 'ttf');

    console.log('\n📊 Size comparison:');
    console.log(`Original: ${originalSize}`);
    console.log(`Core WOFF2: ${getFileSize(coreOutputWoff2)}`);
    console.log(`Extended WOFF2: ${getFileSize(extendedOutputWoff2)}`);
    console.log(`Core TTF: ${getFileSize(coreOutputTtf)}`);

    console.log('\n✅ Font subsetting completed successfully!');
    console.log('🚀 Mobile performance should be significantly improved.');
  } catch (error) {
    console.error('\n❌ Font subsetting failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
