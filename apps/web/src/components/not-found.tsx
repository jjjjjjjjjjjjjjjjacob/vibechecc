import { Link } from '@tanstack/react-router';
import React from 'react';

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-2 p-2">
      <div className="text-muted-foreground">
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => window.history.back()}
          className="bg-success text-success-foreground rounded px-2 py-1 text-sm font-black uppercase"
        >
          Go back
        </button>
        <Link
          to="/"
          className="bg-theme-primary text-primary-foreground rounded px-2 py-1 text-sm font-black uppercase"
        >
          Start Over
        </Link>
      </p>
    </div>
  );
}
