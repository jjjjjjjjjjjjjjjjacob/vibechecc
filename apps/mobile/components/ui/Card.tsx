import React from 'react';
import { View, ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const cardVariants = cva(
  'bg-card/50 border-border/50 rounded-xl border shadow-sm',
  {
    variants: {
      variant: {
        default: 'bg-card/50 border-border/50',
        elevated: 'bg-card border-border shadow-lg',
        outlined: 'bg-transparent border-border border-2',
        filled: 'bg-card border-none',
      },
      size: {
        default: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface CardProps
  extends ViewProps,
    VariantProps<typeof cardVariants> {
  children?: React.ReactNode;
}

export const Card = React.forwardRef<View, CardProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(cardVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </View>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<View, ViewProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('p-standard flex flex-col space-y-1.5', className)}
      {...props}
    >
      {children}
    </View>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<View, ViewProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </View>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<View, ViewProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    >
      {children}
    </View>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<View, ViewProps>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={cn('p-standard pt-0', className)} {...props}>
      {children}
    </View>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<View, ViewProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('p-standard flex flex-row items-center pt-0', className)}
      {...props}
    >
      {children}
    </View>
  )
);
CardFooter.displayName = 'CardFooter';
