import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  convexQuery,
  useConvexMutation,
  useConvexAction,
} from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';

// Query to get all users
export function useUsers() {
  return useQuery({
    ...convexQuery(api.users.getAll, {}),
  });
}

// Query to get user by ID
export function useUser(id: string) {
  return useQuery({
    ...convexQuery(api.users.getById, { id }),
    enabled: !!id,
  });
}

// Query to get user by username
export function useUserByUsername(username: string) {
  return useQuery({
    ...convexQuery(api.users.getByUsername, { username }),
    enabled: !!username,
  });
}

// Query to get current user from Convex
export function useCurrentUser() {
  return useQuery({
    ...convexQuery(api.users.current, {}),
    select: (data) => {
      return data;
    },
  });
}

// Debug authentication (development only)
export function useDebugAuth() {
  return useQuery({
    ...convexQuery(api.users.debugAuth, {}),
    enabled: __DEV__, // Only run in development
  });
}

// Query to get user onboarding status
export function useOnboardingStatus() {
  return useQuery({
    ...convexQuery(api.users.getOnboardingStatus, {}),
  });
}

// Mutation to create a user
export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.users.create);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Mutation to update a user
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.users.update);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Action to update user profile (syncs with both Convex and Clerk)
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const convexAction = useConvexAction(api.users.updateProfile);

  return useMutation({
    mutationFn: convexAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Action to update onboarding data (syncs with both Convex and Clerk)
export function useUpdateOnboardingDataMutation() {
  const queryClient = useQueryClient();
  const convexAction = useConvexAction(api.users.updateOnboardingData);

  return useMutation({
    mutationFn: convexAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Action to complete onboarding (syncs with both Convex and Clerk)
export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();
  const convexAction = useConvexAction(api.users.completeOnboarding);

  return useMutation({
    mutationFn: convexAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Action to update user theme (syncs with Convex)
export function useUpdateThemeMutation() {
  const queryClient = useQueryClient();
  const convexAction = useConvexAction(api.users.updateProfile);

  return useMutation({
    mutationFn: convexAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Mutation to ensure user exists in Convex
export function useEnsureUserExistsMutation() {
  const queryClient = useQueryClient();
  const convexMutation = useConvexMutation(api.users.ensureUserExists);

  return useMutation({
    mutationFn: convexMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}