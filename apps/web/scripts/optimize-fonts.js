#!/usr/bin/env node

/**
 * Comprehensive font optimization script
 * - Subsets fonts to include only used characters
 * - Converts to modern formats (WOFF2, WOFF)
 * - Generates optimized CSS with font-display
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_FONTS_DIR = join(__dirname, '../public/fonts');
const OPTIMIZED_FONTS_DIR = join(PUBLIC_FONTS_DIR, 'optimized');
const CSS_OUTPUT = join(__dirname, '../src/styles/fonts.css');

// Font configurations
const FONTS = [
  {
    name: 'GeistSans',
    file: 'GeistSans-Variable.woff2',
    weight: '100 900',
    style: 'normal',
    unicodeRange:
      'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    subset: 'latin',
    fallback: 'system-ui, -apple-system, sans-serif',
  },
  {
    name: 'GeistMono',
    file: 'GeistMono-Variable.woff2',
    weight: '100 900',
    style: 'normal',
    unicodeRange:
      'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    subset: 'latin',
    fallback: 'ui-monospace, monospace',
  },
  {
    name: 'Doto',
    file: 'Doto-VariableFont_ROND,wght.ttf',
    weight: '100 900',
    style: 'normal',
    unicodeRange: 'U+0000-00FF',
    subset: 'latin',
    fallback: 'system-ui, sans-serif',
    variableAxes: 'ROND,wght',
  },
];

// Emoji font configurations (separate handling due to size)
const EMOJI_FONTS = [
  {
    name: 'NotoColorEmoji',
    file: 'NotoColorEmoji-Regular.ttf',
    weight: 'normal',
    style: 'normal',
    coreRanges: [
      'U+1F600-1F64F', // Emoticons
      'U+1F300-1F5FF', // Misc Symbols and Pictographs
      'U+1F680-1F6FF', // Transport and Map
      'U+2600-26FF', // Misc symbols
      'U+2700-27BF', // Dingbats
      'U+1F900-1F9FF', // Supplemental Symbols
    ],
    extendedRanges: [
      'U+1F1E0-1F1FF', // Regional Indicator Symbols (flags)
      'U+1FAA0-1FAFF', // Symbols Extended-A
    ],
    fallback: 'Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol',
  },
  {
    name: 'NotoEmoji',
    file: 'NotoEmoji-VariableFont_wght.ttf',
    weight: '300 700',
    style: 'normal',
    unicodeRange: 'U+1F300-1F9FF',
    subset: 'emoji',
    fallback: 'Apple Color Emoji, Segoe UI Emoji',
  },
];

function checkDependencies() {
  const deps = {
    pyftsubset: checkCommand(
      'pyftsubset --help',
      'pip install fonttools[woff]'
    ),
    glyphhanger: checkCommand(
      'glyphhanger --version',
      'npm install -g glyphhanger'
    ),
    ttf2woff2: checkCommand(
      'woff2_compress --help 2>&1',
      'npm install -g ttf2woff2'
    ),
  };

  const missing = Object.entries(deps).filter(([_, available]) => !available);
  if (missing.length > 0) {
    // console.log('⚠️  Missing dependencies:');
    // missing.forEach(([tool]) => {
    //   console.log(`   - ${tool}: Install with: ${deps[tool]}`);
    // });

    // Use pyftsubset as fallback if available
    if (deps.pyftsubset) {
      // console.log('\n✅ Using pyftsubset for optimization');
      return 'pyftsubset';
    }
    return false;
  }

  return 'all';
}

function checkCommand(cmd, installCmd) {
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return installCmd;
  }
}

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

function subsetFont(inputPath, outputPath, options = {}) {
  const pyftsubset = getPyftsubsetPath();
  if (!pyftsubset) {
    throw new Error('pyftsubset not found');
  }

  const {
    unicodeRange = null,
    text = null,
    format = 'woff2',
    layoutFeatures = '*',
    hinting = false,
  } = options;

  const args = [
    pyftsubset,
    `"${inputPath}"`,
    `--output-file="${outputPath}"`,
    `--flavor=${format}`,
    `--layout-features="${layoutFeatures}"`,
  ];

  if (unicodeRange) {
    args.push(`--unicodes="${unicodeRange}"`);
  }

  if (text) {
    args.push(`--text="${text}"`);
  }

  if (!hinting) {
    args.push('--no-hinting');
  }

  args.push(
    '--desubroutinize',
    '--name-IDs="*"',
    '--name-legacy',
    '--name-languages="*"',
    '--glyph-names',
    '--legacy-kern',
    '--notdef-outline',
    '--notdef-glyph',
    '--recommended-glyphs',
    '--canonical-order'
  );

  const cmd = args.join(' ');
  // console.log(`Subsetting ${basename(inputPath)} -> ${basename(outputPath)}`);

  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch {
    // console.error(`Failed to subset ${inputPath}:`, error.message);
    return false;
  }
}

function generateFontFaceCSS(fonts, emojiCore = null, emojiExtended = null) {
  let css = `/* Optimized Font Loading - Generated by optimize-fonts.js */\n\n`;

  // Add font-face rules for text fonts
  fonts.forEach((font) => {
    const fontPath = `/fonts/optimized/${basename(font.output || font.file, extname(font.file))}.woff2`;

    css += `@font-face {
  font-family: '${font.name}';
  src: url('${fontPath}') format('woff2');
  font-weight: ${font.weight};
  font-style: ${font.style};
  font-display: swap;${font.unicodeRange ? `\n  unicode-range: ${font.unicodeRange};` : ''}
}\n\n`;
  });

  // Add emoji font rules if provided
  if (emojiCore) {
    css += `/* Emoji Fonts - Core Set */
@font-face {
  font-family: 'NotoColorEmoji';
  src: url('/fonts/optimized/noto-color-emoji-core.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
  unicode-range: ${EMOJI_FONTS[0].coreRanges.join(', ')};
}\n\n`;
  }

  if (emojiExtended) {
    css += `/* Emoji Fonts - Extended Set (Lazy Loaded) */
@font-face {
  font-family: 'NotoColorEmoji';
  src: url('/fonts/optimized/noto-color-emoji-extended.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
  unicode-range: ${EMOJI_FONTS[0].extendedRanges.join(', ')};
}\n\n`;
  }

  // Add CSS custom properties
  css += `/* Font Stacks */
:root {
  --font-sans: 'GeistSans', system-ui, -apple-system, sans-serif;
  --font-mono: 'GeistMono', ui-monospace, monospace;
  --font-display: 'Doto', system-ui, sans-serif;
  --font-emoji: 'NotoColorEmoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
}\n`;

  return css;
}

// function generatePreloadLinks() {
//   const links = [];
//
//   // Preload critical fonts (Geist Sans is likely the primary font)
//   links.push(
//     `<link rel="preload" href="/fonts/optimized/GeistSans-Variable.woff2" as="font" type="font/woff2" crossorigin>`
//   );
//   links.push(
//     `<link rel="preload" href="/fonts/optimized/noto-color-emoji-core.woff2" as="font" type="font/woff2" crossorigin>`
//   );
//
//   return links;
// }

// function getFileSize(filePath) {
//   try {
//     if (!existsSync(filePath)) return 'N/A';
//     const stats = execSync(`ls -lh "${filePath}"`, { encoding: 'utf8' });
//     const parts = stats.trim().split(/\s+/);
//     return parts[4] || 'unknown';
//   } catch {
//     return 'unknown';
//   }
// }

async function main() {
  // console.log('🚀 Starting comprehensive font optimization...\n');

  // Check dependencies
  const toolsAvailable = checkDependencies();
  if (!toolsAvailable) {
    // console.error(
    //   '❌ Required tools not available. Please install dependencies.'
    // );
    process.exit(1);
  }

  // Create output directory
  mkdirSync(OPTIMIZED_FONTS_DIR, { recursive: true });

  const optimizedFonts = [];

  // Process text fonts
  // console.log('📝 Optimizing text fonts...\n');
  for (const font of FONTS) {
    const inputPath = join(PUBLIC_FONTS_DIR, font.file);
    if (!existsSync(inputPath)) {
      // console.warn(`⚠️  Font not found: ${font.file}`);
      continue;
    }

    const outputName = `${basename(font.file, extname(font.file))}.woff2`;
    const outputPath = join(OPTIMIZED_FONTS_DIR, outputName);

    const success = subsetFont(inputPath, outputPath, {
      unicodeRange: font.unicodeRange,
      format: 'woff2',
    });

    if (success) {
      font.output = outputName;
      optimizedFonts.push(font);
      // console.log(
      //   `✅ ${font.name}: ${getFileSize(inputPath)} -> ${getFileSize(outputPath)}\n`
      // );
    }
  }

  // Process emoji fonts
  // console.log('😀 Optimizing emoji fonts...\n');
  let emojiCoreOptimized = false;
  let emojiExtendedOptimized = false;

  const emojiFont = EMOJI_FONTS[0];
  const emojiInputPath = join(PUBLIC_FONTS_DIR, emojiFont.file);

  if (existsSync(emojiInputPath)) {
    // Core emoji set
    const coreOutputPath = join(
      OPTIMIZED_FONTS_DIR,
      'noto-color-emoji-core.woff2'
    );
    emojiCoreOptimized = subsetFont(emojiInputPath, coreOutputPath, {
      unicodeRange: emojiFont.coreRanges.join(','),
      format: 'woff2',
    });

    // Extended emoji set
    const extendedOutputPath = join(
      OPTIMIZED_FONTS_DIR,
      'noto-color-emoji-extended.woff2'
    );
    emojiExtendedOptimized = subsetFont(emojiInputPath, extendedOutputPath, {
      unicodeRange: emojiFont.extendedRanges.join(','),
      format: 'woff2',
    });

    if (emojiCoreOptimized) {
      // console.log(
      //   `✅ Emoji Core: ${getFileSize(emojiInputPath)} -> ${getFileSize(coreOutputPath)}`
      // );
    }
    if (emojiExtendedOptimized) {
      // console.log(`✅ Emoji Extended: ${getFileSize(extendedOutputPath)}\n`);
    }
  }

  // Generate optimized CSS
  // console.log('🎨 Generating optimized CSS...');
  const css = generateFontFaceCSS(
    optimizedFonts,
    emojiCoreOptimized,
    emojiExtendedOptimized
  );
  writeFileSync(CSS_OUTPUT, css);
  // console.log(`✅ CSS written to: ${CSS_OUTPUT}`);

  // Generate preload links
  // console.log('\n📋 Add these preload links to your HTML <head>:');
  // const preloadLinks = generatePreloadLinks();
  // preloadLinks.forEach((link) => console.log(`   ${link}`));

  // console.log('\n✅ Font optimization complete!');
  // console.log('📊 Next steps:');
  // console.log('   1. Import the generated CSS: @import "./fonts.css";');
  // console.log('   2. Add preload links to your HTML head');
  // console.log('   3. Use CSS variables: font-family: var(--font-sans);');
}

main().catch((_e) => {
  // console.error(e);
  process.exit(1);
});
