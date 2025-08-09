/**
 * Font optimization utilities for system fonts
 */


// Check if browser supports font loading API
export function supportsFontLoading(): boolean {
  return 'fonts' in document;
}

// Preload critical fonts (placeholder for future font loading)
export function preloadCriticalFonts() {
  // Currently using system fonts only
}

// Lazy load extended fonts (placeholder for future font loading)
export function loadExtendedEmojiFont() {
  return Promise.resolve();
}

// Connection-aware loading
export function getConnectionSpeed(): 'slow' | 'fast' {
  // Navigator.connection is experimental - use type assertion for compatibility
  const connection =
    (navigator as { connection?: { effectiveType?: string } }).connection ||
    (navigator as { mozConnection?: { effectiveType?: string } })
      .mozConnection ||
    (navigator as { webkitConnection?: { effectiveType?: string } })
      .webkitConnection;

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
  // Currently using system fonts only
}

// Font fallback chain for progressive enhancement
export const EMOJI_FONT_STACK = [
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
  '"Android Emoji"',
  '"EmojiOne"',
  'sans-serif',
].join(', ');
