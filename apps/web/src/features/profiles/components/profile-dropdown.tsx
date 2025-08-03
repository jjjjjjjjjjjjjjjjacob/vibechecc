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
  className?: string;
}

export function ProfileDropdown({
  className: _className,
}: ProfileDropdownProps) {
  const { data: currentUser } = useCurrentUser();
  const { user: clerkUser } = useUser();
  const { location } = useRouterState();
  const [open, setOpen] = useState(false);

  if (!currentUser || !clerkUser) return null;

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
    {
      href: '/settings',
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
          <img
            src={clerkUser.imageUrl}
            alt={computeUserDisplayName(currentUser)}
            className="h-8 w-8 rounded-full object-cover"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="p-2">
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
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  item.isActive
                    ? 'bg-accent/50 text-accent-foreground font-medium'
                    : 'text-foreground/80'
                )}
                onClick={() => setOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <div className="border-border/50 my-2 border-t pt-2">
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
