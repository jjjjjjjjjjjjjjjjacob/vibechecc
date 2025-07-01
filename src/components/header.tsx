import { Link, useRouterState } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Menu, X } from 'lucide-react';
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

export function Header() {
  const { resolvedTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            className="group/search relative m-0 p-2 data-[state=open]:flex data-[state=open]:w-80"
            data-state={isSearchOpen ? 'open' : 'closed'}
            onClick={() => {
              if (!isSearchOpen) {
                setIsSearchOpen(true);
              }
            }}
          >
            <Search className="text-muted-foreground m-0 h-4 w-4 p-0" />
            <Input
              type="search"
              placeholder="search vibes..."
              className="active:ring-none hidden w-full border-none px-0 group-data-[state=open]/search:flex focus:border-none focus:ring-0 focus-visible:ring-0 active:border-none active:ring-0"
              autoFocus
              onBlur={() => setIsSearchOpen(false)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 hidden h-9 w-9 group-data-[state=open]/search:flex"
              onClick={() => setIsSearchOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">close search</span>
            </Button>
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
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                type="search"
                placeholder="search vibes..."
                className="w-full pl-8"
              />
            </div>
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
    </header>
  );
}
