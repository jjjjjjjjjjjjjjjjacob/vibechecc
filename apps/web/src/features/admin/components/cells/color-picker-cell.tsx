import * as React from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/utils/tailwind-utils';

interface ColorPickerCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  className?: string;
  disabled?: boolean;
  isOptimistic?: boolean;
  presetColors?: string[];
}

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#6b7280', '#374151', '#111827',
];

export function ColorPickerCell({
  value,
  onSave,
  className,
  disabled = false,
  isOptimistic = false,
  presetColors = DEFAULT_COLORS,
}: ColorPickerCellProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleColorChange = async (newColor: string) => {
    if (newColor === value) return;

    try {
      setIsLoading(true);
      await onSave(newColor);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setInputValue(value); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleColorChange(inputValue);
    } else if (e.key === 'Escape') {
      setInputValue(value);
      setIsOpen(false);
    }
  };

  const isValidColor = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  return (
    <div className={cn(
      'group',
      disabled && 'cursor-not-allowed opacity-50',
      isOptimistic && 'opacity-60',
      className
    )}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            disabled={disabled || isLoading}
            className="h-8 w-full justify-start px-2 hover:bg-muted/50"
          >
            <div className="flex items-center space-x-2 w-full">
              <div
                className="h-4 w-4 rounded border border-border"
                style={{ backgroundColor: value }}
              />
              <span className="text-sm font-mono">{value}</span>
              {isLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent ml-auto" />
              ) : (
                <Palette className="h-3 w-3 opacity-50 ml-auto" />
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            {/* Custom color input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">custom color</label>
              <div className="flex items-center space-x-2">
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder="#000000"
                  className="h-8 font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleColorChange(inputValue)}
                  disabled={!isValidColor(inputValue) || inputValue === value}
                  className="h-8"
                >
                  apply
                </Button>
              </div>
            </div>

            {/* Preset colors */}
            <div className="space-y-2">
              <label className="text-sm font-medium">preset colors</label>
              <div className="grid grid-cols-5 gap-2">
                {presetColors.map((color) => (
                  <Button
                    key={color}
                    variant="outline"
                    size="sm"
                    onClick={() => handleColorChange(color)}
                    disabled={isLoading}
                    className={cn(
                      'h-8 w-8 p-0 border-2',
                      color === value && 'ring-2 ring-primary ring-offset-2'
                    )}
                    style={{ backgroundColor: color }}
                  >
                    <span className="sr-only">{color}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}