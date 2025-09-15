import React from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        success:
          'border-transparent bg-success text-success-foreground hover:bg-success/80',
        warning:
          'border-transparent bg-warning text-warning-foreground hover:bg-warning/80',
        outline: 'text-foreground border-border bg-transparent',
        ghost:
          'border-transparent bg-transparent text-foreground hover:bg-accent',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-2xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const badgeTextVariants = cva('font-semibold text-center', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      success: 'text-success-foreground',
      warning: 'text-warning-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
    },
    size: {
      default: 'text-xs',
      sm: 'text-2xs',
      lg: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface BadgeProps
  extends ViewProps,
    VariantProps<typeof badgeVariants> {
  children?: React.ReactNode;
  textClassName?: string;
}

export const Badge = React.forwardRef<View, BadgeProps>(
  ({ className, textClassName, variant, size, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text
            className={cn(badgeTextVariants({ variant, size }), textClassName)}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    );
  }
);
Badge.displayName = 'Badge';
