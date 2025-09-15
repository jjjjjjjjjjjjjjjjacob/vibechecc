import React from 'react';
import { View, ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const skeletonVariants = cva(' rounded-md bg-muted', {
  variants: {
    variant: {
      default: 'bg-muted',
      light: 'bg-muted/60',
      dark: 'bg-muted/80',
    },
    shape: {
      rectangle: 'rounded-md',
      circle: 'rounded-full',
      rounded: 'rounded-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    shape: 'rectangle',
  },
});

export interface SkeletonProps
  extends ViewProps,
    VariantProps<typeof skeletonVariants> {}

export const Skeleton = React.forwardRef<View, SkeletonProps>(
  ({ className, variant, shape, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(skeletonVariants({ variant, shape }), className)}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

// Preset skeleton components for common use cases
export const SkeletonText = React.forwardRef<
  View,
  Omit<SkeletonProps, 'shape'>
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    className={cn('h-4 w-full', className)}
    shape="rectangle"
    {...props}
  />
));
SkeletonText.displayName = 'SkeletonText';

export const SkeletonCircle = React.forwardRef<
  View,
  Omit<SkeletonProps, 'shape'>
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    className={cn('h-10 w-10', className)}
    shape="circle"
    {...props}
  />
));
SkeletonCircle.displayName = 'SkeletonCircle';

export const SkeletonButton = React.forwardRef<
  View,
  Omit<SkeletonProps, 'shape'>
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    className={cn('h-10 w-24', className)}
    shape="rounded"
    {...props}
  />
));
SkeletonButton.displayName = 'SkeletonButton';

export const SkeletonCard = React.forwardRef<
  View,
  Omit<SkeletonProps, 'shape'>
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    className={cn('h-32 w-full', className)}
    shape="rounded"
    {...props}
  />
));
SkeletonCard.displayName = 'SkeletonCard';
