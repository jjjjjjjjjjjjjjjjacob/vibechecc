import { Link } from '@tanstack/react-router';
import { cn } from '@/utils/tailwind-utils';
import { APP_NAME } from '@/utils/bindings';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-background border-t', className)}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <Link to="/" className="text-foreground text-lg font-semibold">
              {APP_NAME}
            </Link>
          </div>

          {/* Legal Links */}
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

          {/* Copyright */}
          <div className="text-muted-foreground text-center text-sm md:text-right">
            © {currentYear} {APP_NAME}. all rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
