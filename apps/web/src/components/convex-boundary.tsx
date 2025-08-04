import * as React from 'react';
import { useConvex } from 'convex/react';

interface ConvexBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ConvexBoundary({ children, fallback }: ConvexBoundaryProps) {
  const [hasContext, setHasContext] = React.useState(false);

  React.useEffect(() => {
    try {
      // Try to access Convex context
      setHasContext(true);
    } catch {
      setHasContext(false);
    }
  }, []);

  if (!hasContext && fallback) {
    return <>{fallback}</>;
  }

  if (!hasContext) {
    return null;
  }

  return <>{children}</>;
}