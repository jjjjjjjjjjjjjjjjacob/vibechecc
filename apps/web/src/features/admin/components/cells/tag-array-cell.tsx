import * as React from 'react';
import { X, Plus, Check } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/tailwind-utils';

interface TagArrayCellProps {
  value: string[];
  onSave: (newValue: string[]) => Promise<void> | void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  isOptimistic?: boolean;
}

export function TagArrayCell({
  value,
  onSave,
  className,
  placeholder = 'add tag...',
  disabled = false,
  maxTags,
  isOptimistic = false,
}: TagArrayCellProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState('');
  const [tags, setTags] = React.useState(value);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setTags(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleAddTag = async () => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue || tags.includes(trimmedValue)) {
      setEditValue('');
      return;
    }

    if (maxTags && tags.length >= maxTags) {
      setEditValue('');
      return;
    }

    const newTags = [...tags, trimmedValue];
    setTags(newTags);
    setEditValue('');

    try {
      setIsLoading(true);
      await onSave(newTags);
    } catch {
      // Error handling - silently fail
      setTags(value); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);

    try {
      setIsLoading(true);
      await onSave(newTags);
    } catch {
      // Error handling - silently fail
      setTags(value); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setEditValue('');
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        'space-y-2',
        disabled && 'cursor-not-allowed opacity-50',
        isOptimistic && 'opacity-60',
        className
      )}
    >
      {/* Tags display */}
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center space-x-1 text-xs"
          >
            <span>{tag}</span>
            {!disabled && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveTag(tag)}
                disabled={isLoading}
                className="hover:bg-destructive hover:text-destructive-foreground h-3 w-3 p-0"
              >
                <X className="h-2 w-2" />
              </Button>
            )}
          </Badge>
        ))}
      </div>

      {/* Add tag input */}
      {!disabled && (maxTags === undefined || tags.length < maxTags) && (
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
                className="h-6 text-xs"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddTag}
                disabled={isLoading || !editValue.trim()}
                className="h-6 w-6 p-0"
              >
                {isLoading ? (
                  <div className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
                ) : (
                  <Check className="h-2 w-2 text-green-600" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditValue('');
                  setIsEditing(false);
                }}
                disabled={isLoading}
                className="h-6 w-6 p-0"
              >
                <X className="h-2 w-2 text-red-600" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs"
            >
              <Plus className="mr-1 h-2 w-2" />
              add tag
            </Button>
          )}
        </div>
      )}

      {/* Max tags indicator */}
      {maxTags && (
        <div className="text-muted-foreground text-xs">
          {tags.length}/{maxTags} tags
        </div>
      )}
    </div>
  );
}
