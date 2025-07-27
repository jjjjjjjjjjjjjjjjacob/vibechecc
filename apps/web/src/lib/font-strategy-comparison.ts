/**
 * Font loading strategy comparison for mobile performance
 */

// Current approach: Local full fonts (25MB+)
export const CURRENT_STRATEGY = {
  size: '25MB+',
  loadTime3G: '30-45s',
  loadTimeLTE: '8-12s',
  cacheability: 'site-specific',
  controlLevel: 'full',
};

// CDN approach: External full fonts
export const CDN_STRATEGY = {
  size: '25MB+', // Same size problem!
  loadTime3G: '25-35s', // Slightly faster delivery
  loadTimeLTE: '6-10s',
  cacheability: 'cross-site',
  controlLevel: 'limited',
  issues: [
    'Still massive downloads',
    'CORS complexity',
    'No loading control',
    'External dependency',
  ],
};

// Subset approach: Smart font splitting
export const SUBSET_STRATEGY = {
  size: '3-4MB', // 90% reduction!
  loadTime3G: '4-6s',
  loadTimeLTE: '1-2s',
  cacheability: 'site-specific',
  controlLevel: 'full',
  benefits: [
    'Tiered loading (core + extended)',
    'Connection-aware loading',
    'Progressive enhancement',
    'No external dependencies',
  ],
};

// Hybrid approach: Subset + CDN
export const HYBRID_STRATEGY = {
  size: '3-4MB',
  loadTime3G: '3-5s',
  loadTimeLTE: '0.5-1.5s',
  cacheability: 'cross-site',
  controlLevel: 'full',
  implementation: 'Subset fonts + serve via CDN',
};

/**
 * Performance impact comparison
 */
export const PERFORMANCE_COMPARISON = {
  current: {
    firstContentfulPaint: '8-15s',
    largestContentfulPaint: '15-30s',
    mobilePageSpeed: '20-30',
    userExperience: 'Poor - long white screens',
  },
  withSubsetting: {
    firstContentfulPaint: '1-3s',
    largestContentfulPaint: '3-6s',
    mobilePageSpeed: '70-85',
    userExperience: 'Good - fast initial render',
  },
};
