import * as React from 'react';
// `Link` lets us navigate without a full page reload
import { Link } from '@tanstack/react-router';
// Reuse the shared button component and its props for consistent styling
import { Button, type ButtonProps } from '@/components/ui/button';
// Plus icon communicates creation of a new vibe
import { Plus } from 'lucide-react';

/**
 * Button that navigates to the vibe creation page.
 *
 * The component simply wraps TanStack's `Link` in our design system's
 * `Button` so routing and styling stay consistent across the app.
 */
export function CreateVibeButton({
  // default to an outlined style to reduce visual weight by default
  variant = 'outline',
  // capture any other button props the caller might supply
  ...props
}: ButtonProps) {
  // render an accessible button that routes to the creation form
  return (
    <Button variant={variant} {...props}>
      {/* flex container ensures icon and text sit side by side */}
      <Link to="/vibes/create" className="flex items-center">
        {/* small plus icon hints at adding a new vibe */}
        <Plus className="mr-2 h-4 w-4" />
        {/* keep copy lowercase per style guide */}
        create vibe
      </Link>
    </Button>
  );
}
