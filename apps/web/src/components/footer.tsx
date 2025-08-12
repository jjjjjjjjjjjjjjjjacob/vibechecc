import { Link } from '@tanstack/react-router'; // client-side navigation component
import { cn } from '@/utils/tailwind-utils'; // utility to merge conditional classes

/**
 * Simple site-wide footer shown on every page.
 *
 * The component renders brand navigation, legal links, and a copyright notice
 * while allowing consumers to augment styling through an optional `className`.
 */
export interface FooterProps {
  className?: string; // optional style overrides passed from parent
}

export function Footer({ className }: FooterProps) {
  // capture the current year so the copyright stays up to date automatically
  const currentYear = new Date().getFullYear();

  return (
    // outer semantic footer element with default background and border
    <footer className={cn('bg-background border-t', className)}>
      {/* width-constrained wrapper ensures content aligns with rest of layout */}
      <div className="container mx-auto px-4 py-6">
        {/* flex container switches from column to row on medium screens */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* brand link back to homepage */}
          <div className="flex items-center gap-2">
            <Link to="/" className="text-foreground text-lg font-semibold">
              viberatr
            </Link>
          </div>

          {/* links to legal pages, separated by dot characters */}
          <nav className="flex flex-wrap items-center justify-center gap-1 text-sm">
            <Link
              to="/privacy"
              className="text-muted-foreground hover:text-foreground px-3 py-1 transition-colors"
            >
              privacy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/terms"
              className="text-muted-foreground hover:text-foreground px-3 py-1 transition-colors"
            >
              terms
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/data"
              className="text-muted-foreground hover:text-foreground px-3 py-1 transition-colors"
            >
              data policy
            </Link>
          </nav>

          {/* copyright line aligned right on desktop */}
          <div className="text-muted-foreground text-center text-sm md:text-right">
            © {currentYear} viberatr. all rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
