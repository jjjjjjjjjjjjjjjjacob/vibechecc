/**
 * Asset optimization utilities for mobile performance
 * Handles image optimization, caching headers, and responsive loading
 */

// Supported image formats in order of preference
export const SUPPORTED_FORMATS = [
  'avif',
  'webp',
  'png',
  'jpg',
  'jpeg',
] as const;
export type ImageFormat = (typeof SUPPORTED_FORMATS)[number];

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

/**
 * Generate optimized image URLs for different formats and sizes
 */
export function generateOptimizedImageUrls(
  src: string,
  width?: number,
  quality: number = 85
): Record<ImageFormat, string> {
  const baseUrl = src.split('.')[0];
  const formats: Record<ImageFormat, string> = {
    avif: `${baseUrl}.avif?w=${width}&q=${quality}`,
    webp: `${baseUrl}.webp?w=${width}&q=${quality}`,
    png: `${baseUrl}.png?w=${width}&q=${quality}`,
    jpg: `${baseUrl}.jpg?w=${width}&q=${quality}`,
    jpeg: `${baseUrl}.jpeg?w=${width}&q=${quality}`,
  };

  return formats;
}

/**
 * Generate responsive image sizes
 */
export function generateResponsiveSizes(maxWidth: number): string {
  const breakpoints = [640, 768, 1024, 1280, 1536];
  const sizes = breakpoints
    .filter((bp) => bp <= maxWidth)
    .map((bp) => `(max-width: ${bp}px) ${Math.min(bp, maxWidth)}px`)
    .join(', ');

  return sizes + `, ${maxWidth}px`;
}

/**
 * Detect user's connection and device capabilities
 */
export function getConnectionInfo(): {
  isSlowConnection: boolean;
  isMobile: boolean;
  supportsWebP: boolean;
  supportsAVIF: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      isSlowConnection: false,
      isMobile: false,
      supportsWebP: false,
      supportsAVIF: false,
    };
  }

  // Navigator.connection is experimental - use type assertion for compatibility
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;
  const isSlowConnection =
    connection?.effectiveType === '2g' ||
    connection?.effectiveType === 'slow-2g';
  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Feature detection for modern image formats
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  const supportsWebP =
    canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  const supportsAVIF =
    canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;

  return {
    isSlowConnection,
    isMobile,
    supportsWebP,
    supportsAVIF,
  };
}

/**
 * Get optimal image format based on browser support and connection
 */
export function getOptimalImageFormat(): ImageFormat {
  if (typeof window === 'undefined') {
    return 'webp'; // Default for SSR
  }

  const { isSlowConnection, supportsAVIF, supportsWebP } = getConnectionInfo();

  // Use more compressed formats on slow connections
  if (isSlowConnection) {
    if (supportsAVIF) return 'avif';
    if (supportsWebP) return 'webp';
  }

  // Best quality for fast connections
  if (supportsAVIF) return 'avif';
  if (supportsWebP) return 'webp';

  return 'jpg';
}

/**
 * Get optimal image quality based on connection and device
 */
export function getOptimalImageQuality(): number {
  if (typeof window === 'undefined') {
    return 85; // Default for SSR
  }

  const { isSlowConnection, isMobile } = getConnectionInfo();

  if (isSlowConnection) return 60; // Lower quality for slow connections
  if (isMobile) return 75; // Medium quality for mobile
  return 85; // High quality for desktop
}

/**
 * Generate optimized cache headers for different asset types
 */
export function getOptimizedCacheHeaders(
  assetType: 'image' | 'font' | 'script' | 'style'
): Record<string, string> {
  const baseHeaders = {
    Vary: 'Accept-Encoding',
  };

  switch (assetType) {
    case 'image':
      return {
        ...baseHeaders,
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      };

    case 'font':
      return {
        ...baseHeaders,
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
        Accept: 'font/woff2,font/woff,font/*,*/*;q=0.8',
      };

    case 'script':
    case 'style':
      return {
        ...baseHeaders,
        'Cache-Control': 'public, max-age=86400', // 1 day (shorter for updates)
      };

    default:
      return baseHeaders;
  }
}

/**
 * Preload critical assets with appropriate priorities
 */
export function preloadCriticalAssets() {
  if (typeof document === 'undefined') return;

  const { isSlowConnection } = getConnectionInfo();

  // Don't preload on slow connections to save bandwidth
  if (isSlowConnection) return;

  const criticalAssets = [
    // Core fonts
    {
      href: '/fonts/noto-color-emoji-core.woff2',
      as: 'font',
      type: 'font/woff2',
    },
    { href: '/fonts/GeistSans-Variable.woff2', as: 'font', type: 'font/woff2' },
  ];

  criticalAssets.forEach((asset) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = asset.href;
    link.as = asset.as;
    if (asset.type) link.type = asset.type;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Lazy load non-critical assets based on viewport intersection
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px 0px', // Start loading 50px before entering viewport
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}
