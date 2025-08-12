import * as React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { User, Settings, Heart, LogOut } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import { useCurrentUser } from '@/queries';
import { SignOutButton, useUser } from '@clerk/tanstack-react-start';
import { computeUserDisplayName } from '@/utils/user-utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ProfileDropdownProps {
  className?: string; // optional extra class names supplied by parent
}

/**
 * Renders a small avatar button that opens a menu with profile links and a
 * sign-out action. Uses Clerk for user data and TanStack Start for routing.
 */
export function ProfileDropdown({
  className: _className,
}: ProfileDropdownProps) {
  // Fetch the current user record from the backend
  const { data: currentUser } = useCurrentUser();
  // Clerk user object for avatar image and sign-out
  const { user: clerkUser } = useUser();
  // Router state provides current location so we can highlight active links
  const { location } = useRouterState();
  // Track whether the popover menu is open
  const [open, setOpen] = useState(false);

  // If user data is missing we cannot render the menu
  if (!currentUser || !clerkUser) return null;

  // Define menu items shown inside the dropdown
  const profileItems = [
    {
      href: '/profile', // link to profile overview
      label: 'profile',
      icon: User,
      isActive: location.pathname === '/profile',
    },
    {
      href: '/vibes/my-vibes', // link to user's vibes
      label: 'my vibes',
      icon: Heart,
      isActive: location.pathname === '/vibes/my-vibes',
    },
    {
      href: '/settings', // link to app settings
      label: 'settings',
      icon: Settings,
      isActive: location.pathname === '/settings',
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full p-0"
        >
          {/* user avatar shows current user's profile image */}
          <img
            src={clerkUser.imageUrl}
            alt={computeUserDisplayName(currentUser)}
            className="h-8 w-8 rounded-full object-cover"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="p-2">
          {/* header with user name and username */}
          <div className="border-border/50 mb-2 border-b pb-2">
            <div className="text-foreground text-sm font-medium">
              {computeUserDisplayName(currentUser)}
            </div>
            <div className="text-muted-foreground text-xs">
              @{currentUser.username || 'user'}
            </div>
          </div>
          <div className="space-y-1">
            {profileItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  // shared item styles
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  // highlight active item based on current path
                  item.isActive
                    ? 'bg-accent/50 text-accent-foreground font-medium'
                    : 'text-foreground/80'
                )}
                onClick={() => setOpen(false)} // close popover on navigation
              >
                {/* render the lucide icon for each menu item */}
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <div className="border-border/50 my-2 border-t pt-2">
              {/* clerk-provided sign out button */}
              <SignOutButton>
                <button
                  className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <LogOut className="h-4 w-4" />
                  sign out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
