// react primitives for state and effects
import * as React from 'react';
// icons representing available theme modes
import { Moon, Sun, Laptop } from 'lucide-react';
// hook that reads and updates the current theme
import { useTheme } from './theme-provider';
// button component reused across the app
import { Button } from '@/components/ui/button';
// dropdown menu primitives for the theme selector
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * A button that lets the user switch between light, dark, and system themes via
 * a dropdown menu. The component waits until mounted to avoid mismatches
 * between server-rendered and client themes.
 */
export function ThemeToggle() {
  // access helper to update theme and read the currently resolved theme
  const { setTheme, resolvedTheme } = useTheme();
  // track whether the component has mounted to prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false);

  // once mounted on the client, flip the flag so we render interactive UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // render a visually hidden button during SSR to preserve layout
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
      {/* use the button as the trigger for the dropdown menu */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {/* show moon icon when in dark mode, sun otherwise */}
          {resolvedTheme === 'dark' ? (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      {/* menu with options for each theme mode */}
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="lowercase"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="lowercase"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="lowercase"
        >
          <Laptop className="mr-2 h-4 w-4" />
          <span>system</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
