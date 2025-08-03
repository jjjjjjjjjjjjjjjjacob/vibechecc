import * as React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from './theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { enhancedTrackEvents } from '@/lib/enhanced-posthog';
import { useCurrentUser } from '@/queries';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { data: currentUser } = useCurrentUser();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    enhancedTrackEvents.ui_theme_toggled(
      newTheme,
      resolvedTheme,
      currentUser?._id
    );
    setTheme(newTheme);
  };

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="opacity-0">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {resolvedTheme === 'dark' ? (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleThemeChange('light')}
          className="lowercase"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('dark')}
          className="lowercase"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('system')}
          className="lowercase"
        >
          <Laptop className="mr-2 h-4 w-4" />
          <span>system</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
