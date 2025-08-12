import * as React from 'react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/utils/tailwind-utils';

interface ToggleCellProps {
  value: boolean;
  onSave: (newValue: boolean) => Promise<void> | void;
  className?: string;
  disabled?: boolean;
  variant?: 'switch' | 'checkbox';
  label?: string;
  isOptimistic?: boolean;
}

export function ToggleCell({
  value,
  onSave,
  className,
  disabled = false,
  variant = 'switch',
  label,
  isOptimistic = false,
}: ToggleCellProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleToggle = async (newValue: boolean) => {
    if (newValue === value) return;

    try {
      setIsLoading(true);
      await onSave(newValue);
    } catch {
      // Error handling - silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const commonProps = {
    checked: value,
    disabled: disabled || isLoading,
    className: cn(isOptimistic && 'opacity-60', isLoading && 'cursor-wait'),
  };

  if (variant === 'checkbox') {
    return (
      <div
        className={cn(
          'flex items-center space-x-2',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <Checkbox
          {...commonProps}
          onCheckedChange={(checked) => handleToggle(checked === true)}
        />
        {label && <span className="text-sm">{label}</span>}
        {isLoading && (
          <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center space-x-2',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <Switch {...commonProps} onCheckedChange={handleToggle} />
      {label && <span className="text-sm">{label}</span>}
      {isLoading && (
        <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
      )}
    </div>
  );
}
