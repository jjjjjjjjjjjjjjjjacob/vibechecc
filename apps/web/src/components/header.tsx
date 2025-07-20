import { Link, useRouterState } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Search, Menu } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils/tailwind-utils';
import { ThemeToggle } from './theme-toggle';
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from '@clerk/tanstack-react-start';
import { useTheme } from './theme-provider';
import { SearchCommand } from '../features/search/components/search-command';
import { useSearchShortcuts } from '../features/search/hooks/use-search-shortcuts';

export function Header() {
  const { resolvedTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Set up keyboard shortcuts
  useSearchShortcuts({
    onOpen: () => setCommandOpen(true),
    onClose: () => setCommandOpen(false),
  });

  const { location, matches } = useRouterState();
  const isVibePage = matches.some(
    (match) => match.routeId === '/vibes/$vibeId'
  );

  return (
    <header
      data-is-dark={resolvedTheme === 'dark'}
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full backdrop-blur'
      )}
    >
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-xl font-bold text-transparent">
              vibechecc
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link
              to="/"
              className={cn(
                'hover:text-foreground/80 lowercase transition-colors',
                location.pathname === '/'
                  ? 'text-foreground font-medium'
                  : 'text-foreground/60'
              )}
            >
              discover
            </Link>
            <SignedIn>
              <Link
                to="/vibes/my-vibes"
                className={cn(
                  'hover:text-foreground/80 lowercase transition-colors',
                  location.pathname === '/vibes/my-vibes'
                    ? 'text-foreground font-medium'
                    : 'text-foreground/60'
                )}
              >
                my vibes
              </Link>
              <Link
                to="/profile"
                className={cn(
                  'hover:text-foreground/80 lowercase transition-colors',
                  location.pathname === '/profile'
                    ? 'text-foreground font-medium'
                    : 'text-foreground/60'
                )}
              >
                profile
              </Link>
            </SignedIn>
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline-flex">Search</span>
            <kbd className="bg-muted pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:inline-flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">toggle menu</span>
          </Button>

          <ThemeToggle />

          <SignedIn>
            <UserButton />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                sign in
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="flex flex-col space-y-3 p-4 text-sm">
            <Link
              to="/"
              className={cn(
                'hover:text-foreground/80 rounded-md p-2 lowercase transition-colors',
                location.pathname === '/' ? 'bg-muted font-medium' : ''
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              discover
            </Link>
            <SignedIn>
              <Link
                to="/vibes/my-vibes"
                className={cn(
                  'hover:text-foreground/80 rounded-md p-2 lowercase transition-colors',
                  location.pathname === '/vibes/my-vibes'
                    ? 'bg-muted font-medium'
                    : ''
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                my vibes
              </Link>
              <Link
                to="/profile"
                className={cn(
                  'hover:text-foreground/80 rounded-md p-2 lowercase transition-colors',
                  location.pathname === '/profile' ? 'bg-muted font-medium' : ''
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                profile
              </Link>
            </SignedIn>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-left"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setCommandOpen(true);
              }}
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Button>
          </nav>
        </div>
      )}

      {isVibePage && (
        <div className="border-border/50 container">
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-3 sm:col-span-2">
              <div className="text-muted-foreground py-3 text-sm">
                <Link
                  to="/"
                  className="hover:text-foreground transition-colors"
                >
                  home
                </Link>
                <span className="mx-2">/</span>
                <span>vibe</span>
              </div>
            </div>
            <div className="col-span-1 hidden sm:block">
              <h2 className="text-md text-muted-foreground py-2 font-bold lowercase lg:text-xl">
                similar vibes
              </h2>
            </div>
          </div>
        </div>
      )}

      <SearchCommand open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  );
}
