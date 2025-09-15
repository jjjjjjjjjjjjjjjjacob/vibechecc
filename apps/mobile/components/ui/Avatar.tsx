import React from 'react';
import {
  View,
  Text,
  Image,
  ImageProps,
  ViewProps,
  TextProps,
} from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
        xl: 'h-20 w-20',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const avatarImageVariants = cva('aspect-square h-full w-full object-cover', {
  variants: {
    size: {
      sm: 'h-8 w-8',
      default: 'h-10 w-10',
      md: 'h-12 w-12',
      lg: 'h-16 w-16',
      xl: 'h-20 w-20',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

const avatarFallbackVariants = cva(
  'flex h-full w-full items-center justify-center rounded-full bg-muted',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
        xl: 'h-20 w-20',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const avatarFallbackTextVariants = cva(
  'font-medium text-muted-foreground select-none',
  {
    variants: {
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface AvatarProps
  extends ViewProps,
    VariantProps<typeof avatarVariants> {
  children?: React.ReactNode;
}

export const Avatar = React.forwardRef<View, AvatarProps>(
  ({ className, size, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {children}
      </View>
    );
  }
);
Avatar.displayName = 'Avatar';

export interface AvatarImageProps
  extends Omit<ImageProps, 'className'>,
    VariantProps<typeof avatarImageVariants> {
  className?: string;
  alt?: string;
}

export const AvatarImage = React.forwardRef<Image, AvatarImageProps>(
  ({ className, size, alt, ...props }, ref) => {
    return (
      <Image
        ref={ref}
        className={cn(avatarImageVariants({ size }), className)}
        accessibilityLabel={alt}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = 'AvatarImage';

export interface AvatarFallbackProps
  extends ViewProps,
    VariantProps<typeof avatarFallbackVariants> {
  children?: React.ReactNode;
}

export const AvatarFallback = React.forwardRef<View, AvatarFallbackProps>(
  ({ className, size, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(avatarFallbackVariants({ size }), className)}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text className={cn(avatarFallbackTextVariants({ size }))}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    );
  }
);
AvatarFallback.displayName = 'AvatarFallback';
