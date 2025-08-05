import { useAuth, useUser } from '@clerk/tanstack-react-start';
import { useMemo } from 'react';

export interface UseAdminAuthResult {
  isAdmin: boolean;
  isLoading: boolean;
  error?: string;
}

/**
 * Hook to check if the current user has admin privileges
 * Checks for org:admin role using Clerk's authentication
 */
export function useAdminAuth(): UseAdminAuthResult {
  const { isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const result = useMemo(() => {
    // If auth or user data is still loading
    if (!authLoaded || !userLoaded) {
      return {
        isAdmin: false,
        isLoading: true,
      };
    }

    // If no user is authenticated
    if (!user) {
      return {
        isAdmin: false,
        isLoading: false,
        error: 'User not authenticated',
      };
    }

    // Check if user has org:admin role
    const hasAdminRole = user.organizationMemberships?.some(
      (membership) => 
        membership.role === 'org:admin' ||
        membership.publicMetadata?.role === 'admin'
    ) || false;

    // Also check user's public metadata for admin role
    const hasAdminMetadata = user.publicMetadata?.role === 'admin' || false;

    return {
      isAdmin: hasAdminRole || hasAdminMetadata,
      isLoading: false,
    };
  }, [authLoaded, userLoaded, user]);

  return result;
}