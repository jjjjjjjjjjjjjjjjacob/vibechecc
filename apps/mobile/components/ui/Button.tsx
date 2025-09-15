import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-md font-medium mobile-touch-target mobile-interaction-optimize',
  {
    variants: {
      variant: {
        default: 'bg-primary shadow-sm',
        destructive: 'bg-destructive shadow-sm',
        outline: 'border border-border bg-background',
        secondary: 'bg-secondary shadow-sm',
        ghost: 'bg-transparent',
        link: 'underline-offset-4',
        gradient: 'themed-gradient-bg shadow-md',
      },
      size: {
        default: 'px-4 py-2 h-10',
        sm: 'px-3 py-1.5 h-9 text-sm',
        lg: 'px-8 py-3 h-11',
        icon: 'w-10 h-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const textVariants = cva('text-center font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
      gradient: 'text-white',
    },
    size: {
      default: 'text-sm',
      sm: 'text-sm',
      lg: 'text-base',
      icon: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps
  extends TouchableOpacityProps,
    VariantProps<typeof buttonVariants> {
  title: string;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  title,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={cn(
        buttonVariants({ variant, size }),
        disabled && 'opacity-50',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? '#666' : '#fff'}
          style={{ marginRight: 8 }}
        />
      )}
      <Text className={cn(textVariants({ variant, size }))}>{title}</Text>
    </TouchableOpacity>
  );
}
