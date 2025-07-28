import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import {
  OptimizedImageProps,
  generateOptimizedImageUrls,
  generateResponsiveSizes,
  getOptimalImageFormat,
  getOptimalImageQuality,
  createIntersectionObserver,
} from '@/lib/asset-optimization';

/**
 * Optimized Image component for mobile performance
 * Features: WebP/AVIF support, lazy loading, responsive sizes, connection-aware quality
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality,
  priority = false,
  className,
  sizes,
  ...props
}: OptimizedImageProps & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(priority);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const placeholderRef = React.useRef<HTMLDivElement>(null);

  // Get optimal settings based on device and connection
  const optimalFormat = getOptimalImageFormat();
  const optimalQuality = quality || getOptimalImageQuality();

  // Generate optimized URLs
  const optimizedUrls = React.useMemo(() => {
    return generateOptimizedImageUrls(src, width, optimalQuality);
  }, [src, width, optimalQuality]);

  // Generate responsive sizes
  const responsiveSizes = React.useMemo(() => {
    if (sizes) return sizes;
    if (width) return generateResponsiveSizes(width);
    return '100vw';
  }, [sizes, width]);

  // Set up intersection observer for lazy loading
  React.useEffect(() => {
    if (priority || isInView) return;

    const observer = createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer?.disconnect();
          }
        });
      },
      { rootMargin: '50px 0px' }
    );

    if (observer && placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }

    return () => observer?.disconnect();
  }, [priority, isInView]);

  // Handle image load
  const handleLoad = React.useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Handle image error
  const handleError = React.useCallback(() => {
    setHasError(true);
  }, []);

  // Don't load image until it's in view (unless priority)
  const shouldLoad = priority || isInView;

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Placeholder */}
      <div
        ref={placeholderRef}
        className={cn(
          'bg-muted absolute inset-0 transition-opacity duration-300',
          isLoaded ? 'opacity-0' : 'opacity-100'
        )}
        aria-hidden="true"
      >
        {/* Simple placeholder pattern */}
        <div className="flex h-full w-full items-center justify-center">
          <div className="animate-pulse">
            <svg
              className="text-muted-foreground/30 h-8 w-8"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Optimized Image */}
      {shouldLoad && !hasError && (
        <picture>
          {/* AVIF source */}
          <source
            srcSet={optimizedUrls.avif}
            type="image/avif"
            sizes={responsiveSizes}
          />

          {/* WebP source */}
          <source
            srcSet={optimizedUrls.webp}
            type="image/webp"
            sizes={responsiveSizes}
          />

          {/* Fallback */}
          <img
            ref={imgRef}
            src={optimizedUrls[optimalFormat] || src}
            alt={alt}
            width={width}
            height={height}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            {...props}
          />
        </picture>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="bg-muted absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="text-muted-foreground/50 mx-auto h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-muted-foreground mt-2 text-xs">Failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Optimized Avatar component with connection-aware loading
 */
interface OptimizedAvatarProps extends OptimizedImageProps {
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function OptimizedAvatar({
  src,
  alt,
  fallback: _fallback,
  size = 'md',
  className,
  ...props
}: OptimizedAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const sizePixels = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizePixels[size]}
      height={sizePixels[size]}
      className={cn('rounded-full', sizeClasses[size], className)}
      quality={70} // Lower quality for avatars
      {...props}
    />
  );
}
