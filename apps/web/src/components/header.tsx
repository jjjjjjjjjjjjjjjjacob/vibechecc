import { Link, useRouterState } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Search, Menu, ChevronUp } from 'lucide-react';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { cn } from '../utils/tailwind-utils';
import { ThemeToggle } from './theme-toggle';
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from '@clerk/tanstack-react-start';
import {
  useTheme,
  type PrimaryColorTheme,
  type SecondaryColorTheme,
} from './theme-provider';
import { SearchAccordion } from '../features/search/components/search-accordion';
import { useSearchShortcuts } from '../features/search/hooks/use-search-shortcuts';
import { useCurrentUser } from '../queries';

export function Header() {
  const { resolvedTheme, setColorTheme, setSecondaryColorTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const searchButtonRef = React.useRef<HTMLButtonElement | null>(null);

  // Track hydration to avoid SSR mismatches
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get current user's theme
  const { data: currentUser } = useCurrentUser();

  // Apply user's color themes when user data changes
  useEffect(() => {
    if (currentUser) {
      const primaryColor =
        currentUser.primaryColor || currentUser.themeColor || 'pink';
      const secondaryColor = currentUser.secondaryColor || 'orange';

      setColorTheme(`${primaryColor}-primary` as PrimaryColorTheme);
      setSecondaryColorTheme(
        `${secondaryColor}-secondary` as SecondaryColorTheme
      );
    }
  }, [currentUser, setColorTheme, setSecondaryColorTheme]);

  // Set up keyboard shortcuts
  useSearchShortcuts({
    onOpen: () => setSearchOpen(true),
    onClose: () => setSearchOpen(false),
  });

  const { location, matches } = useRouterState();
  const isVibePage = matches.some(
    (match) => match.routeId === '/vibes/$vibeId'
  );

  return (
    <header
      data-is-dark={isHydrated ? resolvedTheme === 'dark' : false}
      className={cn('relative')}
    >
      <div
        data-is-vibe-page={isVibePage}
        className="h-12 data-[is-vibe-page=true]:h-32"
      ></div>
      <div
        className={cn(
          'bg-background/95 supports-[backdrop-filter]:bg-background/70 fixed top-0 z-50 w-full backdrop-blur'
        )}
      >
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent">
                viberater
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
                home
              </Link>
              <Link
                to="/discover"
                className={cn(
                  'hover:text-foreground/80 lowercase transition-colors',
                  location.pathname === '/discover'
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
              ref={searchButtonRef}
              variant="ghost"
              className="gap-2"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <div className="relative h-4 w-4">
                <Search
                  className={cn(
                    'absolute inset-0 h-4 w-4 transition-all duration-200',
                    searchOpen ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                  )}
                />
                <ChevronUp
                  className={cn(
                    'absolute inset-0 h-4 w-4 transition-all duration-200',
                    searchOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                  )}
                />
              </div>
              <span className="hidden sm:inline-flex">Search</span>
              {!searchOpen && (
                <kbd className="bg-muted pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:inline-flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              )}
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
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="profile"
                    labelIcon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    }
                    href="/profile"
                  />
                  <UserButton.Link
                    label="my vibes"
                    labelIcon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    }
                    href="/vibes/my-vibes"
                  />
                </UserButton.MenuItems>
              </UserButton>
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
        <div
          className={cn(
            'overflow-hidden border-t transition-[max-height] duration-300 ease-in-out md:hidden',
            isMobileMenuOpen ? 'max-h-96' : 'max-h-0'
          )}
        >
          <nav
            className={cn(
              'flex flex-col space-y-3 p-4 text-sm',
              isMobileMenuOpen
                ? 'animate-menu-slide-down'
                : 'animate-menu-slide-up'
            )}
          >
            <Link
              to="/"
              className={cn(
                'hover:text-foreground/80 rounded-md p-2 lowercase transition-colors',
                location.pathname === '/' ? 'bg-muted/80 font-medium' : ''
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              home
            </Link>
            <Link
              to="/discover"
              className={cn(
                'hover:text-foreground/80 rounded-md p-2 lowercase transition-colors',
                location.pathname === '/discover'
                  ? 'bg-muted/80 font-medium'
                  : ''
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
                    ? 'bg-muted/80 font-medium'
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
                  location.pathname === '/profile'
                    ? 'bg-muted/80 font-medium'
                    : ''
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
                setSearchOpen(true);
              }}
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Button>
          </nav>
        </div>
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
        <SearchAccordion
          open={searchOpen}
          onOpenChange={setSearchOpen}
          triggerRef={searchButtonRef as React.RefObject<HTMLButtonElement>}
        />
      </div>
    </header>
  );
}
