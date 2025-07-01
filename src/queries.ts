import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  convexQuery,
  useConvexMutation,
  useConvexAction,
} from '@convex-dev/react-query';
import { api } from '../convex/_generated/api';
// import { useAuth } from '@clerk/tanstack-react-start';

// vibechecc QUERIES

// Query to get all vibes (simple version for performance)
export function useVibes() {
  return useQuery(convexQuery(api.vibes.getAllSimple, {}));
}

// Query to get paginated vibes with full details
export function useVibesPaginated(limit?: number, cursor?: string) {
  return useQuery(convexQuery(api.vibes.getAll, { limit, cursor }));
}

// Query to get a vibe by ID
export function useVibe(id: string) {
  return useQuery({
    ...convexQuery(api.vibes.getById, { id }),
    enabled: !!id,
  });
}

// Query to get vibes by user
export function useUserVibes(userId: string) {
  return useQuery({
    ...convexQuery(api.vibes.getByUser, { userId }),
    enabled: !!userId,
  });
}

// Query to get vibes a user has reacted to
export function useUserReactedVibes(userId: string) {
  return useQuery({
    ...convexQuery(api.vibes.getUserReactedVibes, { userId }),
    enabled: !!userId,
  });
}

// Mutation to create a vibe
export function useCreateVibeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.vibes.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibes'] });
    },
  });
}

// Mutation to add a rating
export function useAddRatingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.vibes.addRating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibes'] });
    },
  });
}

// Mutation to react to a vibe
export function useReactToVibeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.vibes.reactToVibe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibes'] });
    },
  });
}

// Query to get all users
export function useUsers() {
  return useQuery(convexQuery(api.users.getAll, {}));
}

// Query to get user by ID
export function useUser(id: string) {
  return useQuery({
    ...convexQuery(api.users.getById, { id }),
    enabled: !!id,
  });
}

// Query to get current user from Convex
export function useCurrentUser() {
  return useQuery({
    ...convexQuery(api.users.current, {}),
    select: (data) => {
      // console.log('data', data);
      return data;
    },
  });
}

// Mutation to create a user
export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.users.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Mutation to update a user
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.users.update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Action to update user profile (syncs with both Convex and Clerk)
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexAction(api.users.updateProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Query to get vibes by tag
export function useVibesByTag(tag: string, limit?: number) {
  return useQuery({
    ...convexQuery(api.vibes.getByTag, { tag, limit }),
    enabled: !!tag,
  });
}

// Query to get all available tags
export function useAllTags() {
  return useQuery(convexQuery(api.vibes.getAllTags, {}));
}

// Query to get top-rated vibes
export function useTopRatedVibes(limit?: number) {
  return useQuery(convexQuery(api.vibes.getTopRated, { limit }));
}

// ONBOARDING QUERIES

// Debug authentication (temporary)
export function useDebugAuth() {
  return useQuery(convexQuery(api.users.debugAuth, {}));
}

// Query to get user onboarding status
export function useOnboardingStatus() {
  return useQuery(convexQuery(api.users.getOnboardingStatus, {}));
}

// Action to update onboarding data (syncs with both Convex and Clerk)
export function useUpdateOnboardingDataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexAction(api.users.updateOnboardingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Action to complete onboarding (syncs with both Convex and Clerk)
export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexAction(api.users.completeOnboarding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Mutation to ensure user exists in Convex
export function useEnsureUserExistsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.users.ensureUserExists),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Legacy stub for unused NewColumn component
export function useCreateColumnMutation() {
  return useMutation({
    mutationFn: async (_args: { boardId: string; name: string }) => {
      throw new Error(
        'useCreateColumnMutation is deprecated and not implemented'
      );
    },
  });
}
