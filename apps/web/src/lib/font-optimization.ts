/**
 * Font optimization utilities for tiered emoji loading
 * Reduces font size from 25MB+ to ~3-4MB while maintaining full functionality
 */

// Core emojis that should be loaded immediately (most commonly used)
export const CORE_EMOJI_UNICODE_RANGES = [
  // Basic Latin emojis and symbols
  'U+1F600-1F64F', // Emoticons
  'U+1F300-1F5FF', // Misc Symbols and Pictographs
  'U+1F680-1F6FF', // Transport and Map
  'U+1F1E0-1F1FF', // Regional Indicator Symbols (flags)
  'U+2600-26FF', // Misc symbols
  'U+2700-27BF', // Dingbats
  'U+FE00-FE0F', // Variation Selectors
  'U+1F900-1F9FF', // Supplemental Symbols and Pictographs
];

// Extended emojis loaded on-demand
export const EXTENDED_EMOJI_UNICODE_RANGES = [
  'U+1F780-1F7FF', // Geometric Shapes Extended
  'U+1F800-1F8FF', // Supplemental Arrows-C
  'U+1FAA0-1FAFF', // Symbols and Pictographs Extended-A
  'U+1FB00-1FBFF', // Symbols and Pictographs Extended-B
];

// Generate CSS unicode-range for font subsetting
export function generateUnicodeRange(ranges: string[]): string {
  return ranges.join(', ');
}

// Check if browser supports font loading API
export function supportsFontLoading(): boolean {
  return 'fonts' in document;
}

// Preload critical fonts
export function preloadCriticalFonts() {
  if (!supportsFontLoading()) return;

  const coreRanges = generateUnicodeRange(CORE_EMOJI_UNICODE_RANGES);

  // Create font face for core emojis
  const coreFontFace = new FontFace(
    'Noto Color Emoji Core',
    `url('/fonts/noto-color-emoji-core.woff2') format('woff2')`,
    {
      unicodeRange: coreRanges,
      display: 'swap',
      weight: '400',
    }
  );

  // Load and add to document
  coreFontFace
    .load()
    .then((font) => {
      document.fonts.add(font);
    })
    .catch((error) => {
      console.warn('Failed to load core emoji font:', error);
    });
}

// Lazy load extended emoji fonts
export function loadExtendedEmojiFont() {
  if (!supportsFontLoading()) return Promise.resolve();

  const extendedRanges = generateUnicodeRange(EXTENDED_EMOJI_UNICODE_RANGES);

  const extendedFontFace = new FontFace(
    'Noto Color Emoji Extended',
    `url('/fonts/noto-color-emoji-extended.woff2') format('woff2')`,
    {
      unicodeRange: extendedRanges,
      display: 'swap',
      weight: '400',
    }
  );

  return extendedFontFace
    .load()
    .then((font) => {
      document.fonts.add(font);
      return font;
    })
    .catch((error) => {
      console.warn('Failed to load extended emoji font:', error);
      return null;
    });
}

// Connection-aware loading
export function getConnectionSpeed(): 'slow' | 'fast' {
  // Navigator.connection is experimental - use type assertion for compatibility
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) return 'fast';

  // Consider 2G/slow-2g as slow
  if (
    connection.effectiveType === '2g' ||
    connection.effectiveType === 'slow-2g'
  ) {
    return 'slow';
  }

  return 'fast';
}

// Adaptive font loading based on connection
export function loadFontsAdaptively() {
  const speed = getConnectionSpeed();

  // Always load core fonts
  preloadCriticalFonts();

  // Only load extended fonts on fast connections
  if (speed === 'fast') {
    // Add small delay to not block initial render
    setTimeout(() => {
      loadExtendedEmojiFont();
    }, 1000);
  }
}

// Font fallback chain for progressive enhancement
export const EMOJI_FONT_STACK = [
  '"Noto Color Emoji Core"',
  '"Noto Color Emoji Extended"',
  '"Noto Color Emoji"',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
  '"Android Emoji"',
  '"EmojiOne"',
  'sans-serif',
].join(', ');
