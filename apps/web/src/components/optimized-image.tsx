import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';

interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with lazy loading, error handling, and performance hints
 */
export const OptimizedImage = React.forwardRef<
  HTMLImageElement,
  OptimizedImageProps
>(
  (
    {
      src,
      alt,
      className,
      fallback,
      priority = false,
      loading = 'lazy',
      fetchPriority = 'auto',
      sizes,
      onLoad,
      onError,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);
    const [isInView, setIsInView] = React.useState(priority);
    const imgRef = React.useRef<HTMLImageElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => imgRef.current!);

    // Use Intersection Observer for truly lazy loading
    React.useEffect(() => {
      if (priority || loading === 'eager') {
        setIsInView(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          });
        },
        {
          // Start loading when image is 50px away from viewport
          rootMargin: '50px',
          threshold: 0.01,
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }, [priority, loading]);

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
      onError?.();
    };

    // Show fallback if there's an error
    if (hasError && fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={cn('relative', className)}>
        {/* Blur placeholder while loading */}
        {isLoading && !hasError && (
          <div
            className={cn(
              'from-muted/50 to-muted/30 absolute inset-0 animate-pulse bg-gradient-to-br',
              className
            )}
            aria-hidden="true"
          />
        )}

        {/* Actual image */}
        <img
          ref={imgRef}
          src={isInView ? src : undefined}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          loading={priority ? 'eager' : loading}
          fetchPriority={priority ? 'high' : fetchPriority}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          decoding={priority ? 'sync' : 'async'}
          {...props}
        />
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

/**
 * Hook to preload images in the background
 */
export function useImagePreloader(urls: string[]) {
  React.useEffect(() => {
    const preloadImage = (url: string) => {
      const img = new Image();
      img.src = url;
    };

    urls.forEach(preloadImage);
  }, [urls]);
}

/**
 * Component to preload critical images
 */
export function ImagePreloader({ urls }: { urls: string[] }) {
  useImagePreloader(urls);
  return null;
}
