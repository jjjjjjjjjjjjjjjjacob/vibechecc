import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/tailwind-utils';

interface SelectCellProps {
  value: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  onSave: (newValue: string) => Promise<void> | void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  isOptimistic?: boolean;
}

export function SelectCell({
  value,
  options,
  onSave,
  className,
  placeholder = 'select option...',
  disabled = false,
  isOptimistic = false,
}: SelectCellProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleValueChange = async (newValue: string) => {
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

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div
      className={cn(
        'group',
        disabled && 'cursor-not-allowed opacity-50',
        isOptimistic && 'opacity-60',
        className
      )}
    >
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          className={cn(
            'hover:bg-muted/50 focus:bg-muted h-8 w-full border-0 bg-transparent px-2',
            isLoading && 'cursor-wait'
          )}
        >
          <SelectValue placeholder={placeholder}>
            <div className="flex w-full items-center justify-between">
              <span
                className={cn(
                  'text-sm',
                  !selectedOption && 'text-muted-foreground italic'
                )}
              >
                {selectedOption?.label || placeholder}
              </span>
              {isLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              ) : (
                <ChevronDown className="h-3 w-3 opacity-50" />
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center space-x-2">
                <span>{option.label}</span>
                {option.value === value && (
                  <Check className="text-primary h-3 w-3" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
