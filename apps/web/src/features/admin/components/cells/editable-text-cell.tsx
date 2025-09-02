import * as React from 'react';
import { Check, X, Edit2 } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/tailwind-utils';

interface EditableTextCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  isOptimistic?: boolean;
}

export function EditableTextCell({
  value,
  onSave,
  className,
  multiline = false,
  placeholder = 'enter text...',
  disabled = false,
  maxLength,
  isOptimistic = false,
}: EditableTextCellProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing) {
      if (multiline) {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      } else {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
  }, [isEditing, multiline]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    try {
      setIsLoading(true);
      await onSave(editValue);
      setIsEditing(false);
    } catch {
      // Error handling - silently fail
      setEditValue(value); // Reset to original value on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && multiline && e.metaKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {multiline ? (
          <Textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={maxLength}
            className="min-h-[60px] resize-none"
            rows={3}
          />
        ) : (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={maxLength}
            className="h-8"
          />
        )}
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            {isLoading ? (
              <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
            ) : (
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <X className="text-destructive h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group hover:bg-muted/50 flex cursor-pointer items-center space-x-2 rounded px-2 py-1',
        disabled && 'cursor-not-allowed opacity-50',
        isOptimistic && 'opacity-60',
        className
      )}
      onClick={() => !disabled && setIsEditing(true)}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Click to edit"
    >
      <span
        className={cn(
          'flex-1 truncate text-sm',
          !value && 'text-muted-foreground italic'
        )}
      >
        {value || placeholder}
      </span>
      {!disabled && (
        <Edit2 className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );
}
