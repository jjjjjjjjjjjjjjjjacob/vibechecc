/**
 * action result module.
 * enhanced documentation for clarity and maintenance.
 */
import { CommandItem } from '@/components/ui/command';
// icon set used by search shortcuts such as creating a vibe or visiting profile
import { Plus, User, Settings, LogOut, Search } from 'lucide-react';
// router hook used to navigate to appropriate pages for each action
import { useNavigate } from '@tanstack/react-router';
// typed shape representing an actionable search result
import type { ActionSearchResult } from '@viberatr/types';

interface ActionResultProps {
  result: ActionSearchResult;
  query?: string;
  onSelect?: () => void;
}

// map of icon name to component for quick lookup when rendering results
const iconMap: Record<string, React.ComponentType> = {
  plus: Plus,
  user: User,
  settings: Settings,
  logout: LogOut,
  search: Search,
};

export function ActionResult({ result, onSelect }: ActionResultProps) {
  const navigate = useNavigate();

  // execute the requested action then bubble up selection event
  const handleSelect = () => {
    switch (result.action) {
      case 'create-vibe':
        navigate({ to: '/vibes/create' });
        break;
      case 'view-profile':
        navigate({ to: '/profile' });
        break;
      default:
      // unknown action falls through with no navigation
    }
    onSelect?.();
  };

  // choose icon; fall back to plus when provided name isn't in the map
  const Icon = result.icon ? iconMap[result.icon] || Plus : Plus;

  return (
    <CommandItem
      value={result.title} // use title for keyboard navigation
      onSelect={handleSelect} // run action when item is selected
      className="flex items-center gap-3 py-2"
    >
      {/* icon badge visually represents the action */}
      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
        <Icon className="text-primary h-4 w-4" />
      </div>

      {/* title and optional subtitle explaining the action */}
      <div className="flex-1">
        <div className="font-medium">{result.title}</div>
        {result.subtitle && (
          <div className="text-muted-foreground text-sm">{result.subtitle}</div>
        )}
      </div>
    </CommandItem>
  );
}
