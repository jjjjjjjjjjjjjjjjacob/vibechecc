import { CommandItem } from '@/components/ui/command';
import { Plus, User, Settings, LogOut, Search } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { ActionSearchResult } from '@vibechecc/types';

interface ActionResultProps {
  result: ActionSearchResult;
  query?: string;
  onSelect?: () => void;
}

const iconMap: Record<string, React.ComponentType> = {
  plus: Plus,
  user: User,
  settings: Settings,
  logout: LogOut,
  search: Search,
};

export function ActionResult({ result, onSelect }: ActionResultProps) {
  const navigate = useNavigate();

  const handleSelect = () => {
    switch (result.action) {
      case 'create-vibe':
        navigate({ to: '/vibes/create' });
        break;
      case 'view-profile':
        navigate({ to: '/profile' });
        break;
      default:
      // Unknown action
    }
    onSelect?.();
  };

  const Icon = result.icon ? iconMap[result.icon] || Plus : Plus;

  return (
    <CommandItem
      value={result.title}
      onSelect={handleSelect}
      className="flex items-center gap-3 py-2"
    >
      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
        <Icon className="text-primary h-4 w-4" />
      </div>

      <div className="flex-1">
        <div className="font-medium">{result.title}</div>
        {result.subtitle && (
          <div className="text-muted-foreground text-sm">{result.subtitle}</div>
        )}
      </div>
    </CommandItem>
  );
}
