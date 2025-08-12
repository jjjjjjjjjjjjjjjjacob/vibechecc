import * as React from 'react'; // React primitives
import { useConvex } from 'convex/react'; // Hook to access Convex context

/**
 * Props supported by {@link ConvexBoundary}.
 * @property children Elements to render when a Convex provider is present.
 * @property fallback Optional content to show if Convex context is missing.
 */
interface ConvexBoundaryProps {
  children: React.ReactNode; // UI rendered when Convex is available
  fallback?: React.ReactNode; // Fallback rendered when context is absent
}

/**
 * Boundary component that verifies a Convex provider exists before
 * rendering its children. When the Convex client is unavailable, it
 * returns the provided fallback or nothing.
 */
export function ConvexBoundary({ children, fallback }: ConvexBoundaryProps) {
  // Attempt to grab the Convex client from React context
  try {
    const convex = useConvex(); // Retrieve client; throws if no provider
    // If the hook returns a falsy client, render fallback or nothing
    if (!convex) {
      if (fallback) {
        return <>{fallback}</>; // Show fallback when supplied
      }
      return null; // Nothing to display without context
    }
  } catch {
    // Hook threw meaning we have no Convex provider in the tree
    if (fallback) {
      return <>{fallback}</>; // Display fallback when missing context
    }
    return null; // Default to rendering nothing
  }

  // Convex context exists so render the intended children
  return <>{children}</>;
}
