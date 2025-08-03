import { Link, useRouterState } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Search, ChevronUp, Menu, User, Heart, Sun, Moon } from 'lucide-react';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { cn } from '../utils/tailwind-utils';
import { ThemeToggle } from '@/features/theming/components/theme-toggle';
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
import { SearchAccordion } from '../features/search/components/search-accordion';
import { useSearchShortcuts } from '../features/search/hooks/use-search-shortcuts';
import { useCurrentUser } from '../queries';
import { ProfileDropdown } from '@/features/profiles/components/profile-dropdown';
import { enhancedTrackEvents } from '@/lib/enhanced-posthog';

type MobileNavState = 'nav' | 'profile' | 'search' | null;

export function Header() {
  const { resolvedTheme, setTheme, setColorTheme, setSecondaryColorTheme } =
    useTheme();
  const [mobileNavState, setMobileNavState] = useState<MobileNavState>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const searchButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const { user: clerkUser } = useUser();
  const { openUserProfile } = useClerk();

  // Track hydration to avoid SSR mismatches
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get current user's theme
  const { data: currentUser } = useCurrentUser();

  // Navigation analytics helpers
  const handleInternalNavigation = (to: string, _source: string = 'header') => {
    enhancedTrackEvents.navigation_internal_link_clicked(
      to,
      location.pathname,
      currentUser?._id
    );
  };

  const _handleExternalLink = (url: string, source: string = 'header') => {
    enhancedTrackEvents.navigation_external_link_clicked(
      url,
      source,
      currentUser?._id
    );
  };

  const handleMenuToggle = (isOpen: boolean, menuType: string) => {
    enhancedTrackEvents.ui_menu_toggled(
      currentUser?._id,
      isOpen ? 'opened' : 'closed',
      menuType,
      'header'
    );
  };

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
    onOpen: () => setMobileNavState('search'),
    onClose: () => setMobileNavState(null),
  });

  // Close mobile nav on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        mobileNavState &&
        mobileNavState !== 'search'
      ) {
        setMobileNavState(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavState]);

  // Handle graceful transition between menu states
  const handleNavTransition = (newState: MobileNavState) => {
    if (newState === mobileNavState) return;

    setIsTransitioning(true);
    // Slide out current content
    setTimeout(() => {
      setMobileNavState(newState);
      // Slide in new content
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

  const { location, matches } = useRouterState();
  const isVibePage = matches.some(
    (match) => match.routeId === '/vibes/$vibeId'
  );

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
              <Link
                to="/"
                className="flex items-center gap-2"
                onClick={() => handleInternalNavigation('/', 'brand_logo')}
              >
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
                  onClick={() => handleInternalNavigation('/', 'desktop_nav')}
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
                  onClick={() =>
                    handleInternalNavigation('/discover', 'desktop_nav')
                  }
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
                    onClick={() =>
                      handleInternalNavigation('/vibes/my-vibes', 'desktop_nav')
                    }
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
                    onClick={() =>
                      handleInternalNavigation('/profile', 'desktop_nav')
                    }
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
                size="icon"
                className="h-10 w-10 rounded-lg"
                onClick={() => {
                  const isOpening = mobileNavState !== 'search';
                  setMobileNavState(
                    mobileNavState === 'search' ? null : 'search'
                  );
                  handleMenuToggle(isOpening, 'search');
                }}
              >
                <div className="relative h-4 w-4">
                  <Search
                    className={cn(
                      'absolute inset-0 h-4 w-4 transition-all duration-200',
                      mobileNavState === 'search'
                        ? 'scale-95 opacity-0'
                        : 'scale-100 opacity-100'
                    )}
                  />
                  <ChevronUp
                    className={cn(
                      'absolute inset-0 h-4 w-4 transition-all duration-200',
                      mobileNavState === 'search'
                        ? 'scale-100 opacity-100'
                        : 'scale-95 opacity-0'
                    )}
                  />
                </div>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg sm:hidden"
                onClick={() => {
                  if (mobileNavState === 'nav') {
                    setMobileNavState(null);
                    handleMenuToggle(false, 'mobile_nav');
                  } else if (mobileNavState === 'profile') {
                    handleNavTransition('nav');
                    handleMenuToggle(true, 'mobile_nav');
                  } else {
                    setMobileNavState('nav');
                    handleMenuToggle(true, 'mobile_nav');
                  }
                }}
              >
                <div className="relative h-5 w-5">
                  <Menu
                    className={cn(
                      'absolute inset-0 m-auto h-5 w-5 transition-all duration-200',
                      mobileNavState === 'nav'
                        ? 'scale-95 opacity-0'
                        : 'scale-100 opacity-100'
                    )}
                  />
                  <ChevronUp
                    className={cn(
                      'absolute inset-0 m-auto h-5 w-5 transition-all duration-200',
                      mobileNavState === 'nav'
                        ? 'scale-100 opacity-100'
                        : 'scale-95 opacity-0'
                    )}
                  />
                </div>
                <span className="sr-only">toggle menu</span>
              </Button>

              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              <SignedIn>
                <div className="hidden sm:block">
                  <ProfileDropdown />
                </div>
                <div className="sm:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg p-0"
                    onClick={() => {
                      if (mobileNavState === 'profile') {
                        setMobileNavState(null);
                        handleMenuToggle(false, 'mobile_profile');
                      } else if (mobileNavState === 'nav') {
                        handleNavTransition('profile');
                        handleMenuToggle(true, 'mobile_profile');
                      } else {
                        setMobileNavState('profile');
                        handleMenuToggle(true, 'mobile_profile');
                      }
                    }}
                  >
                    <img
                      src={clerkUser?.imageUrl}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  </Button>
                </div>
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
              'overflow-hidden border-t transition-[max-height] duration-300 ease-in-out sm:hidden',
              mobileNavState === 'nav' || mobileNavState === 'profile'
                ? 'max-h-96'
                : 'max-h-0'
            )}
          >
            <div
              className={cn(
                'p-4 text-sm',
                mobileNavState === 'nav' || mobileNavState === 'profile'
                  ? 'animate-menu-slide-down'
                  : 'animate-menu-slide-up'
              )}
            >
              <div
                className={cn(
                  'transition-all duration-200 ease-in-out',
                  isTransitioning
                    ? mobileNavState === 'profile'
                      ? '-translate-x-4 transform opacity-0' // Left menu sliding out to right
                      : 'translate-x-4 transform opacity-0' // Right menu sliding out to left
                    : 'translate-x-0 transform opacity-100'
                )}
              >
                {mobileNavState === 'nav' ? (
                  /* Left side - Hamburger menu content */
                  <nav className="space-y-1">
                    <Link
                      to="/"
                      className={cn(
                        'hover:bg-muted/50 hover:text-foreground text-foreground/80 data-[selected=true]:text-foreground block rounded-lg bg-transparent px-2 py-1.5 lowercase transition-all duration-150'
                      )}
                      onClick={() => {
                        handleInternalNavigation('/', 'mobile_nav');
                        setMobileNavState(null);
                      }}
                    >
                      home
                    </Link>
                    <Link
                      to="/discover"
                      className={cn(
                        'hover:bg-muted/50 hover:text-foreground text-foreground/80 data-[selected=true]:text-foreground block rounded-lg px-2 py-1.5 lowercase transition-all duration-150'
                      )}
                      onClick={() => {
                        handleInternalNavigation('/discover', 'mobile_nav');
                        setMobileNavState(null);
                      }}
                    >
                      discover
                    </Link>
                    <SignedIn>
                      <Link
                        to="/vibes/my-vibes"
                        className={cn(
                          'hover:bg-muted/50 hover:text-foreground text-foreground/80 data-[selected=true]:text-foreground block rounded-lg px-2 py-1.5 lowercase transition-all duration-150'
                        )}
                        onClick={() => {
                          handleInternalNavigation(
                            '/vibes/my-vibes',
                            'mobile_nav'
                          );
                          setMobileNavState(null);
                        }}
                      >
                        my vibes
                      </Link>
                      <button
                        data-selected={location.pathname === '/profile'}
                        className="hover:bg-muted/50 hover:text-foreground/80 data-[selected=true]:text-foreground block w-full rounded-lg px-2 py-1.5 text-left lowercase transition-all duration-150"
                        onClick={() => {
                          enhancedTrackEvents.ui_menu_toggled(
                            currentUser?._id,
                            'opened',
                            'mobile_profile_submenu',
                            'mobile_nav'
                          );
                          handleNavTransition('profile');
                        }}
                      >
                        profile
                      </button>
                    </SignedIn>
                    <button
                      className="hover:bg-muted/50 hover:text-foreground flex w-full items-center rounded-lg px-2 py-1.5 text-left lowercase transition-all duration-150"
                      onClick={() => {
                        handleMenuToggle(true, 'search');
                        setMobileNavState('search');
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      <span>search</span>
                    </button>
                  </nav>
                ) : mobileNavState === 'profile' ? (
                  /* Right side - Profile menu content */
                  <SignedIn>
                    <nav className="space-y-1 text-right">
                      {profileItems.map((item) => (
                        <Link
                          data-selected={location.pathname === item.href}
                          key={item.href}
                          to={item.href}
                          className={cn(
                            'hover:text-foreground/80 hover:bg-muted/50 data-[selected=true]:text-primary ml-auto block w-full rounded-lg px-2 py-1.5 text-right lowercase transition-all duration-150'
                          )}
                          onClick={() => {
                            handleInternalNavigation(
                              item.href,
                              'mobile_profile'
                            );
                            setMobileNavState(null);
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <button
                        className="hover:bg-muted/50 hover:text-foreground ml-auto block w-full rounded-lg px-2 py-1.5 text-right lowercase transition-all duration-150"
                        onClick={() => {
                          enhancedTrackEvents.ui_modal_opened(
                            'clerk_user_profile',
                            'mobile_profile_menu',
                            currentUser?._id
                          );
                          setMobileNavState(null);
                          openUserProfile();
                        }}
                      >
                        settings
                      </button>
                      <div className="my-2 flex items-center justify-end gap-2">
                        {resolvedTheme === 'dark' ? (
                          <Moon className="h-4 w-4" />
                        ) : (
                          <Sun className="h-4 w-4" />
                        )}
                        <Switch
                          checked={resolvedTheme === 'dark'}
                          onCheckedChange={(checked) => {
                            const newTheme = checked ? 'dark' : 'light';
                            enhancedTrackEvents.ui_theme_toggled(
                              newTheme,
                              resolvedTheme,
                              currentUser?._id
                            );
                            setTheme(newTheme);
                          }}
                        />
                      </div>
                      <div className="border-border/50 my-2 border-t pt-2">
                        <SignOutButton>
                          <button
                            className="hover:bg-muted/50 hover:text-foreground block w-full rounded-lg px-2 py-1.5 text-right lowercase transition-all duration-150"
                            onClick={() => {
                              enhancedTrackEvents.auth_signout_completed(
                                currentUser?._id || 'unknown'
                              );
                              setMobileNavState(null);
                            }}
                          >
                            sign out
                          </button>
                        </SignOutButton>
                      </div>
                    </nav>
                  </SignedIn>
                ) : null}
              </div>
            </div>
          </div>
          {isVibePage && (
            <div className="border-border/50 container">
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-3 sm:col-span-2">
                  <div className="text-muted-foreground py-3 text-sm">
                    <Link
                      to="/"
                      className="hover:text-foreground transition-colors"
                      onClick={() =>
                        handleInternalNavigation('/', 'vibe_page_breadcrumb')
                      }
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
            open={mobileNavState === 'search'}
            onOpenChange={(open) => setMobileNavState(open ? 'search' : null)}
            triggerRef={searchButtonRef as React.RefObject<HTMLButtonElement>}
          />
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileNavState && mobileNavState !== 'search' && (
        <div
          className="animate-in fade-in fixed inset-0 z-40 bg-black/50 backdrop-blur-sm duration-200 sm:hidden"
          onClick={() => setMobileNavState(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setMobileNavState(null);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close mobile navigation"
          style={{ top: '64px' }} // Start below the header
        />
      )}
    </>
  );
}
