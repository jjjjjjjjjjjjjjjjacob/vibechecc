import { Link } from '@tanstack/react-router';
import React from 'react';

/**
 * Fallback view when a route is not found.
 * Renders optional custom content and offers navigation actions.
 */
export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-2 p-2">
      {/* Display provided children or default message */}
      <div className="text-gray-600 dark:text-gray-400">
        {children || <p>the page you are looking for does not exist.</p>}
      </div>
      {/* Navigation buttons to recover from the missing page */}
      <p className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => window.history.back()}
          className="rounded bg-emerald-500 px-2 py-1 text-sm font-black text-white"
        >
          go back
        </button>
        <Link
          to="/"
          className="rounded bg-cyan-600 px-2 py-1 text-sm font-black text-white"
        >
          start over
        </Link>
      </p>
    </div>
  );
}
