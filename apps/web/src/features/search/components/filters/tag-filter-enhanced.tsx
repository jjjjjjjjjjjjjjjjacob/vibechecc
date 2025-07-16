import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TagFilterEnhancedProps {
  selected: string[];
  available: { name: string; count: number }[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export function TagFilterEnhanced({ 
  selected, 
  available, 
  onChange,
  className 
}: TagFilterEnhancedProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery) return available;
    
    const query = searchQuery.toLowerCase();
    return available.filter(tag => 
      tag.name.toLowerCase().includes(query)
    );
  }, [available, searchQuery]);

  // Sort tags by popularity and selection
  const sortedTags = useMemo(() => {
    return [...filteredTags].sort((a, b) => {
      // Selected tags first
      const aSelected = selected.includes(a.name);
      const bSelected = selected.includes(b.name);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      // Then by count
      return b.count - a.count;
    });
  }, [filteredTags, selected]);

  const handleTagToggle = (tag: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, tag]);
    } else {
      onChange(selected.filter(t => t !== tag));
    }
  };

  const handleClearSelection = () => {
    onChange([]);
    setSearchQuery('');
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">Tags</h4>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="h-auto py-1 px-2 text-xs"
          >
            Clear ({selected.length})
          </Button>
        )}
      </div>

      {/* Search input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Selected tags preview */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selected.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => handleTagToggle(tag, false)}
            >
              {tag}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Tag list */}
      <ScrollArea className="h-[200px] pr-4">
        <div className="space-y-2">
          {sortedTags.length > 0 ? (
            sortedTags.map(tag => {
              const isSelected = selected.includes(tag.name);
              return (
                <div 
                  key={tag.name} 
                  className={`flex items-center space-x-2 rounded-md px-2 py-1.5 transition-colors
                    ${isSelected ? 'bg-accent' : 'hover:bg-accent/50'}`}
                >
                  <Checkbox
                    id={`tag-${tag.name}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleTagToggle(tag.name, checked as boolean)}
                  />
                  <Label
                    htmlFor={`tag-${tag.name}`}
                    className="flex-1 cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-medium">{tag.name}</span>
                    <Badge 
                      variant={isSelected ? "default" : "secondary"} 
                      className="ml-2 text-xs"
                    >
                      {tag.count}
                    </Badge>
                  </Label>
                </div>
              );
            })
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              {searchQuery ? `No tags found matching "${searchQuery}"` : 'No tags available'}
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Summary */}
      {available.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {filteredTags.length === available.length 
            ? `${available.length} tags available`
            : `Showing ${filteredTags.length} of ${available.length} tags`}
        </p>
      )}
    </div>
  );
}