import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '../convex/_generated/api';

export const boardQueries = {
  list: () => convexQuery(api.board.getBoards, {}),
  detail: (id: string) => convexQuery(api.board.getBoard, { id }),
};

export function useCreateColumnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.board.createColumn),
    onSuccess: (data) => {
      if (
        data &&
        typeof data === 'object' &&
        'boardId' in data &&
        'name' in data
      ) {
        queryClient.invalidateQueries({
          queryKey: ['boards', data.boardId, data.name],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['boards'] });
      }
    },
  });
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.board.createItem),
    onSuccess: (data) => {
      if (
        data &&
        typeof data === 'object' &&
        'boardId' in data &&
        'name' in data
      ) {
        queryClient.invalidateQueries({
          queryKey: ['boards', data.boardId, data.name],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['boards'] });
      }
    },
  });
}

export function useUpdateCardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.board.updateItem),
    onSuccess: (data) => {
      if (
        data &&
        typeof data === 'object' &&
        'boardId' in data &&
        'name' in data
      ) {
        queryClient.invalidateQueries({
          queryKey: ['boards', data.boardId, data.name],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['boards'] });
      }
    },
  });
}

export function useDeleteCardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.board.deleteItem),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useDeleteColumnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.board.deleteColumn),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useUpdateBoardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.board.updateBoard),
    onSuccess: (data) => {
      if (data && typeof data === 'object' && 'id' in data && 'name' in data) {
        queryClient.invalidateQueries({ queryKey: ['boards', data.id] });
        queryClient.invalidateQueries({
          queryKey: ['boards', data.id, data.name],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['boards'] });
      }
    },
  });
}

export function useUpdateColumnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.board.updateColumn),
    onSuccess: (data) => {
      if (
        data &&
        typeof data === 'object' &&
        'boardId' in data &&
        'name' in data
      ) {
        queryClient.invalidateQueries({
          queryKey: ['boards', data.boardId, data.name],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['boards'] });
      }
    },
  });
}

// VIBECHECK QUERIES

// Query to get all vibes
export function useVibes() {
  return useQuery(convexQuery(api.vibes.getAll, {}));
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
