import { Link, useRouterState, useLocation } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import {
  Search,
  ChevronUp,
  Menu,
  User,
  Heart,
  Sun,
  Moon,
  Bell,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useCallback, useState, useEffect, useRef, RefObject } from 'react';
import { cn } from '../utils/tailwind-utils';
import { ThemeToggle } from '@/features/theming/components/theme-toggle';
import { FeedTabs } from './feed-tabs';
import {
  useOptionalHeaderNav,
  useHeaderNav,
  type NavState,
  PageNavState,
} from '@/contexts/header-nav-context';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  useUser,
  useClerk,
} from '@clerk/tanstack-react-start';
import {
  useTheme,
  type PrimaryColorTheme,
  type SecondaryColorTheme,
} from '@/features/theming/components/theme-provider';
import { GlobalSearchCommand } from '@/features/search/components/global-search-command';
import { useSearchShortcuts } from '@/features/search/hooks/use-search-shortcuts';
import { useCurrentUser, useUnreadNotificationCount } from '../queries';
import { NotificationAccordion as NotificationMenu } from '@/features/notifications/components/notification-accordion';
import { useConvex } from 'convex/react';
import { useAdminAuth } from '@/features/admin/hooks/use-admin-auth';
import { Separator } from '@/components/ui/separator';
import { TabAccordion, TabAccordionContent } from './tab-accordion';
import { ProfileSnapshotCard } from './profile-snapshot-card';

export function Header() {
  const { resolvedTheme, setTheme, setColorTheme, setSecondaryColorTheme } =
    useTheme();
  const headerNav = useHeaderNav();
  const navState = headerNav.navState;
  const setNavState = headerNav.setNavState;
  const [isHydrated, setIsHydrated] = useState(false);
  const [navHasMounted, setNavHasMounted] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);
  const { user: clerkUser } = useUser();
  const { openUserProfile } = useClerk();
  const { isAdmin } = useAdminAuth();
  const currentLocation = useLocation();
  const headerNavOptional = useOptionalHeaderNav();
  const pageNavState = headerNavOptional?.pageNavState ?? null;
  const isHomePage = currentLocation.pathname === '/';

  // Check if Convex context is available - call useConvex at top level
  const convex = useConvex();
  const convexAvailable = !!convex;

  // Get unread notification count for signed-in users only (when Convex is available)
  const { data: unreadCount } = useUnreadNotificationCount({
    enabled: !!clerkUser && convexAvailable,
  });

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
    onOpen: () => setNavState('search'),
    onClose: () => setNavState(null),
  });

  // Close mobile nav on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && navState) {
        setNavState(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navState]);

  // Disable background scrolling when a mobile overlay is open
  useEffect(() => {
    if (!navState) return;
    const { documentElement } = document;
    const previousOverflow = documentElement.style.overflow;
    const previousPaddingRight = documentElement.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    documentElement.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      documentElement.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      documentElement.style.overflow = previousOverflow;
      documentElement.style.paddingRight = previousPaddingRight;
    };
  }, [navState]);

  // Handle graceful transition between menu states
  const handleNavTransition = useCallback(
    (newState: NavState | PageNavState, context: 'page' | 'nav') => {
      if (!headerNavOptional) return;
      if (newState === navState && context == 'page') return;
      if (newState === pageNavState && context == 'nav') return;

      setNavHasMounted(false);
      if (context === 'page') {
        headerNavOptional.setPageNavState(newState as PageNavState);
      } else if (context === 'nav') {
        headerNavOptional.setNavState(newState as NavState);
      }
      // Slide in new content
      return setTimeout(() => {
        setNavHasMounted(true);
      }, 200);
    },
    [headerNavOptional, pageNavState, navState]
  );

  // Block mounting during transitions for consistent animations
  useEffect(() => {
    const t = handleNavTransition(pageNavState, 'page');
    return () => clearTimeout(t);
  }, [pageNavState, handleNavTransition]);

  // Sync nav/profile states with responsive breakpoints
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sm = window.matchMedia('(min-width: 640px)'); // sm and up shows profile dropdown
    const md = window.matchMedia('(min-width: 768px)'); // md and up shows main nav

    const handleChange = () => {
      // When profile drawer selected and we widen to desktop, close drawer
      // const isSmUp = sm.matches;
      const isMdUp = md.matches;

      // Close hamburger nav when widening to desktop where links are visible
      if (navState === 'nav' && isMdUp) {
        setNavState(null);
      }
    };

    handleChange();
    sm.addEventListener('change', handleChange);
    md.addEventListener('change', handleChange);
    return () => {
      sm.removeEventListener('change', handleChange);
      md.removeEventListener('change', handleChange);
    };
  }, [navState, handleNavTransition, setNavState]);

  const { location, matches } = useRouterState();
  const isVibePage = matches.some(
    (match) => match.routeId === '/vibes/$vibeId'
  );

  // Handle graceful transition into vibe page state
  useEffect(() => {
    if (!headerNavOptional) return;
    if (isVibePage && pageNavState !== 'vibe') {
      headerNavOptional.setPageNavState('vibe');
    } else if (!isVibePage && pageNavState === 'vibe') {
      headerNavOptional.setPageNavState(null);
    }
  }, [headerNavOptional, isVibePage]);

  const profileItems = [
    {
      href: '/profile',
      label: 'profile',
      icon: User,
      isActive: location.pathname === '/profile',
    },
    {
      href: '/vibes/my-vibes',
      label: 'my vibes',
      icon: Heart,
      isActive: location.pathname === '/vibes/my-vibes',
    },
  ];

  return (
    <>
      <header
        data-is-dark={isHydrated ? resolvedTheme === 'dark' : false}
        className={cn('relative h-fit')}
      >
        <div
          data-is-vibe-page={isVibePage}
          className="transition-height h-12 duration-300 data-[is-vibe-page=true]:h-32"
        ></div>
        <div
          data-page-nav-state={!navState && pageNavState}
          data-mobile-nav-state={navState}
          className={cn(
            'bg-background/95 supports-[backdrop-filter]:bg-background/70 fixed top-0 z-50 flex w-full flex-shrink-0 flex-col overflow-hidden backdrop-blur'
          )}
        >
          <TabAccordion
            value={navState ?? (pageNavState as string | null) ?? undefined}
            onValueChange={(val) => setNavState((val as NavState) ?? null)}
            // collapsible={true}
          >
            <div className="container flex h-16 flex-shrink-0 items-center">
              <div className="flex items-center gap-2 md:gap-4">
                <Link
                  to="/"
                  className="flex items-center gap-2"
                  onClick={() => setNavState(null)}
                >
                  <span className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent">
                    viberatr
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
                    onClick={() => setNavState(null)}
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
                    onClick={() => setNavState(null)}
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
                      onClick={() => setNavState(null)}
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
                      onClick={() => setNavState(null)}
                    >
                      profile
                    </Link>
                  </SignedIn>
                </nav>
              </div>

              <div className={cn('ml-auto flex items-center gap-2')}>
                <Button
                  ref={searchButtonRef}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                  onClick={() => {
                    if (navState === 'search') {
                      setNavState(null);
                      return;
                    }
                    handleNavTransition('search', 'nav');
                  }}
                >
                  <div className="relative flex h-4 w-4">
                    <Search
                      className={cn(
                        'absolute inset-0 h-4 w-4 transition-all duration-200',
                        navState === 'search'
                          ? 'scale-95 opacity-0'
                          : 'scale-100 opacity-100'
                      )}
                    />
                    <ChevronUp
                      className={cn(
                        'absolute inset-0 h-4 w-4 transition-all duration-200',
                        navState === 'search'
                          ? 'scale-100 opacity-100'
                          : 'scale-95 opacity-0'
                      )}
                    />
                  </div>
                </Button>

                <SignedIn>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-10 w-10 rounded-lg"
                      onClick={() => {
                        if (navState === 'notifications') {
                          setNavState(null);
                          return;
                        }
                        handleNavTransition('notifications', 'nav');
                      }}
                    >
                      <div className="relative h-4 w-4">
                        {navState !== 'notifications' ? (
                          <>
                            <Bell className="h-4 w-4" />
                            {unreadCount && unreadCount > 0 ? (
                              <span className="bg-theme-primary text-primary-foreground absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-xs font-medium">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <ChevronUp
                            className={cn(
                              'absolute inset-0 m-auto h-5 w-5 transition-all duration-200',
                              navState == 'notifications'
                                ? 'scale-100 opacity-100'
                                : 'scale-95 opacity-0'
                            )}
                          />
                        )}
                      </div>
                    </Button>
                  </div>
                </SignedIn>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-lg sm:hidden"
                  onClick={() => {
                    if (navState === 'nav') {
                      setNavState(null);
                      return;
                    }
                    handleNavTransition('nav', 'nav');
                  }}
                >
                  <div className="relative h-5 w-5">
                    <Menu
                      className={cn(
                        'absolute inset-0 m-auto h-5 w-5 transition duration-200',
                        navState === 'nav'
                          ? 'scale-95 opacity-0'
                          : 'scale-100 opacity-100'
                      )}
                    />
                    <ChevronUp
                      className={cn(
                        'absolute inset-0 m-auto h-5 w-5 transition-all duration-200',
                        navState === 'nav'
                          ? 'scale-100 opacity-100'
                          : 'scale-95 opacity-0'
                      )}
                    />
                  </div>
                  <span className="sr-only">toggle menu</span>
                </Button>

                <SignedOut>
                  <div className="hidden sm:block">
                    <ThemeToggle />
                  </div>
                </SignedOut>

                <SignedIn>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg p-0"
                    onClick={() => {
                      if (navState === 'profile') {
                        setNavState(null);
                        return;
                      }
                      handleNavTransition('profile', 'nav');
                    }}
                  >
                    <img
                      src={clerkUser?.imageUrl}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  </Button>
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
            {/* Accordion items, handles sliding animations */}
            <TabAccordionContent value="tabs" className="container pb-2">
              <div
                data-has-mounted={navHasMounted}
                className="w-fit scale-100 opacity-100 transition delay-200 duration-300 data-[has-mounted=false]:translate-y-5 data-[has-mounted=false]:scale-100 data-[has-mounted=false]:opacity-0"
              >
                <FeedTabs />
              </div>
            </TabAccordionContent>
            <TabAccordionContent value="vibe" className="pb-0">
              <div className="container">
                <div className="grid scale-100 grid-cols-3 gap-8">
                  <div
                    data-has-mounted={navHasMounted}
                    className="col-span-3 opacity-100 transition delay-250 duration-300 data-[has-mounted=false]:scale-95 data-[has-mounted=false]:opacity-0 sm:col-span-2"
                  >
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
                  <div
                    data-has-mounted={navHasMounted}
                    className="col-span-1 hidden opacity-100 transition duration-300 data-[has-mounted=false]:scale-95 data-[has-mounted=false]:opacity-0 sm:block"
                  >
                    <h2 className="text-md text-muted-foreground py-2 font-bold lowercase lg:text-xl">
                      similar vibes
                    </h2>
                  </div>
                </div>
              </div>
            </TabAccordionContent>
            <TabAccordionContent value="search" className="pb-0">
              <div
                data-has-mounted={navHasMounted}
                className="h-auto max-h-[calc(70vh+84px)] opacity-100 transition delay-200 duration-200 data-[has-mounted=false]:translate-y-10 data-[has-mounted=false]:opacity-0"
              >
                <GlobalSearchCommand
                  open={true}
                  onOpenChange={(open) => setNavState(open ? 'search' : null)}
                  triggerRef={searchButtonRef as RefObject<HTMLButtonElement>}
                  commandListClassName="max-h-[70vh]"
                />
              </div>
            </TabAccordionContent>
            <TabAccordionContent value="notifications" className="pb-0">
              <div
                data-has-mounted={navHasMounted}
                className="translate-y-0 opacity-100 transition delay-200 duration-200 data-[has-mounted=false]:translate-y-10 data-[has-mounted=false]:opacity-0"
              >
                <NotificationMenu />
              </div>
            </TabAccordionContent>
            <TabAccordionContent value="nav" className="container !px-2 pb-2">
              <div className={cn('text-sm')}>
                <div
                  data-has-mounted={navHasMounted}
                  className={cn(
                    'opacity-100 transition delay-200 duration-200 ease-in-out data-[has-mounted=false]:opacity-0',
                    'translate-x-0 data-[has-mounted=false]:-translate-x-4'
                  )}
                >
                  {/* Left side - Hamburger menu content */}
                  <nav className="space-y-1">
                    <Link
                      to="/"
                      className={cn(
                        'hover:bg-muted/50 hover:text-foreground text-foreground/80 data-[selected=true]:text-foreground block w-full rounded-lg px-2 py-1.5 lowercase transition-all duration-150'
                      )}
                      onClick={() => {
                        setNavState(null);
                      }}
                    >
                      home
                    </Link>
                    <Link
                      to="/discover"
                      className={cn(
                        'hover:bg-muted/50 hover:text-foreground text-foreground/80 data-[selected=true]:text-foreground block w-full rounded-lg px-2 py-1.5 lowercase transition-all duration-150'
                      )}
                      onClick={() => {
                        setNavState(null);
                      }}
                    >
                      discover
                    </Link>
                    <SignedIn>
                      <Link
                        to="/vibes/my-vibes"
                        className={cn(
                          'hover:bg-muted/50 hover:text-foreground text-foreground/80 data-[selected=true]:text-foreground block w-full rounded-lg px-2 py-1.5 lowercase transition-all duration-150'
                        )}
                        onClick={() => {
                          setNavState(null);
                        }}
                      >
                        my vibes
                      </Link>
                      <button
                        data-selected={location.pathname === '/profile'}
                        className="hover:bg-muted/50 hover:text-foreground data-[selected=true]:text-foreground block w-full rounded-lg px-2 py-1.5 text-left lowercase transition-all duration-150"
                        onClick={() => {
                          handleNavTransition('profile', 'nav');
                        }}
                      >
                        profile
                      </button>
                    </SignedIn>
                    <button
                      className="hover:bg-muted/50 hover:text-foreground text-foreground/80 data-[selected=true]:text-foreground flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left lowercase transition-all duration-150"
                      onClick={() => {
                        handleNavTransition('search', 'nav');
                      }}
                    >
                      <Search className="h-4 w-4" />
                      <span>search</span>
                    </button>
                  </nav>
                </div>
              </div>
            </TabAccordionContent>
            <TabAccordionContent
              value="profile"
              className="container !px-2 pb-2"
            >
              <div className={cn('flex w-full gap-6 text-sm')}>
                <div
                  data-has-mounted={navHasMounted}
                  className={cn(
                    'xs:flex hidden w-full rounded-md',
                    'opacity-100 transition delay-500 duration-1000 ease-in-out data-[has-mounted=false]:opacity-0'
                  )}
                >
                  <ProfileSnapshotCard />
                </div>
                <div
                  data-has-mounted={navHasMounted}
                  className={cn(
                    'xs:min-w-28 xs:w-fit w-full',
                    'opacity-100 transition delay-100 duration-200 ease-in-out data-[has-mounted=false]:opacity-0',
                    'translate-x-0 data-[has-mounted=false]:translate-x-4'
                  )}
                >
                  <nav className="space-y-1 text-right">
                    {profileItems.map((item) => (
                      <Link
                        data-selected={location.pathname === item.href}
                        key={item.href}
                        to={item.href}
                        className={cn(
                          'hover:bg-muted/50 hover:text-foreground text-foreground/80 data-[selected=true]:text-foreground ml-auto block flex w-full items-center justify-end gap-2 rounded-lg px-2 py-1.5 lowercase transition-all duration-150'
                        )}
                        onClick={() => {
                          setNavState(null);
                        }}
                      >
                        <span>{item.label}</span>
                      </Link>
                    ))}
                    <button
                      className="hover:bg-muted/50 hover:text-foreground text-foreground/80 ml-auto block flex w-full items-center justify-end gap-2 rounded-lg px-2 py-1.5 text-right lowercase transition-all duration-150"
                      onClick={() => {
                        setNavState(null);
                        openUserProfile();
                      }}
                    >
                      <span>settings</span>
                    </button>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="hover:bg-muted/50 hover:text-foreground text-foreground/80 ml-auto block flex w-full items-center justify-end gap-2 rounded-lg px-2 py-1.5 text-right lowercase transition-all duration-150"
                        onClick={() => {
                          setNavState(null);
                        }}
                      >
                        <span>admin panel</span>
                      </Link>
                    )}
                    <div className="my-2 flex items-center justify-end gap-2 px-2 pb-2">
                      <Switch
                        checked={resolvedTheme === 'dark'}
                        onCheckedChange={(checked) => {
                          setTheme(checked ? 'dark' : 'light');
                        }}
                      />
                      {resolvedTheme === 'dark' ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                    </div>
                    <Separator className="w=full" />
                    <SignedIn>
                      <SignOutButton>
                        <button
                          className="hover:bg-muted/50 hover:text-foreground text-foreground/80 ml-auto flex w-full items-center justify-end gap-2 rounded-lg px-2 py-1.5 text-right lowercase transition-all duration-150"
                          onClick={() => setNavState(null)}
                        >
                          <span>sign out</span>
                          <LogOut className="h-4 w-4" />
                        </button>
                      </SignOutButton>
                    </SignedIn>
                    <SignedOut>
                      <SignInButton mode="modal">
                        <button
                          className="hover:bg-muted/50 hover:text-foreground text-foreground/80 ml-auto flex w-full items-center justify-end gap-2 rounded-lg py-1.5 text-right lowercase transition-all duration-150"
                          onClick={() => setNavState(null)}
                        >
                          <span>sign in</span>
                          <LogIn className="h-4 w-4" />
                        </button>
                      </SignInButton>
                    </SignedOut>
                  </nav>
                </div>
              </div>
            </TabAccordionContent>
          </TabAccordion>
        </div>
      </header>
    </>
  );
}
