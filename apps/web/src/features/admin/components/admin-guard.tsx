import * as React from 'react';
import { useAdminAuth } from '../hooks/use-admin-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that guards admin routes by checking user permissions
 * Shows access denied page if user doesn't have org:admin role
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isAdmin, isLoading, error } = useAdminAuth();

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user is not an admin
  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="text-destructive mx-auto mb-2 h-12 w-12" />
            <CardTitle className="text-xl">access denied</CardTitle>
            <CardDescription>
              {error || 'you need admin privileges to access this area.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild variant="default">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                back to home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has admin role
  return <>{children}</>;
}
