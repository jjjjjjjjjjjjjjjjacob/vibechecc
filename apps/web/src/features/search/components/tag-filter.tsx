/**
 * tag filter module.
 * enhanced documentation for clarity and maintenance.
 */
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TagFilterProps {
  selected: string[];
  available: string[];
  onChange: (tags: string[]) => void;
}

export function TagFilter({ selected, available, onChange }: TagFilterProps) {
  const handleTagToggle = (tag: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, tag]);
    } else {
      onChange(selected.filter((t) => t !== tag));
    }
  };

  return (
    <div>
      <h4 className="mb-3 font-medium">Tags</h4>
      <ScrollArea className="h-[200px] pr-4">
        <div className="space-y-2">
          {available.map((tag) => (
            <div key={tag} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag}`}
                checked={selected.includes(tag)}
                onCheckedChange={(checked) =>
                  handleTagToggle(tag, checked as boolean)
                }
              />
              <Label
                htmlFor={`tag-${tag}`}
                className="flex flex-1 cursor-pointer items-center justify-between"
              >
                <span>{tag}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {Math.floor(Math.random() * 50) + 1}
                </Badge>
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
