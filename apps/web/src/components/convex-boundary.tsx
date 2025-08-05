import * as React from 'react';
import { useConvex } from 'convex/react';

interface ConvexBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ConvexBoundary({ children, fallback }: ConvexBoundaryProps) {
  // Try to access the Convex context
  try {
    const convex = useConvex();
    // If we successfully get the convex client, we have proper context
    if (!convex) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return null;
    }
  } catch {
    // If useConvex throws, we don't have proper context
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}
