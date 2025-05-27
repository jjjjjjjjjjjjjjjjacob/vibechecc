import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '../convex/_generated/api'

export const boardQueries = {
  list: () => convexQuery(api.board.getBoards, {}),
  detail: (id: string) => convexQuery(api.board.getBoard, { id }),
}

export function useCreateColumnMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      boardId,
      name,
    }: {
      boardId: string
      name: string
    }) => {
      const result = await api.board.createColumn({
        boardId,
        name,
      })
      return result
    },
    onSuccess: (data: { name: string; boardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['boards', data.boardId, data.name] })
    },
  })
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      boardId,
      columnId,
      title,
      order,
      content = '',
    }: {
      boardId: string
      columnId: string
      title: string
      order: number
      content?: string
    }) => {
      const result = await api.board.createItem({
        boardId,
        columnId,
        title,
        order,
        content,
      })
      return result
    },
    onSuccess: (data: { name: string; boardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['boards', data.boardId, data.name] })
    },
  })
}

export function useUpdateCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      itemId,
      boardId,
      title,
      content,
    }: {
      itemId: string
      boardId: string
      title?: string
      content?: string
    }) => {
      const result = await api.board.updateItem({ itemId, boardId, title, content })
      return result
    },
    onSuccess: (data: { name: string; boardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['boards', data.boardId, data.name] })
    },
  })
}

export function useDeleteCardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      itemId,
      boardId,
    }: {
      itemId: string
      boardId: string
    }) => {
      const result = await api.board.deleteItem({ itemId, boardId })
      return result
    },
    onSuccess: (data: { name: string; boardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['boards', data.boardId, data.name] })
    },
  })
}

export function useDeleteColumnMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      boardId,
      columnId,
    }: {
      boardId: string
      columnId: string
    }) => {
      const result = await api.board.deleteColumn({
        boardId,
        columnId,
      })
      return result
    },
    onSuccess: (data: { name: string; boardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['boards', data.boardId, data.name] })
    },
  })
}

export function useUpdateBoardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; name: string }) => {
      const result = await api.board.updateBoard(args)
      return result
    },
    onSuccess: (data: { name: string; boardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['boards', data.boardId, data.name] })
    },
  })
}

export function useUpdateColumnMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      boardId: string
      name: string
      order?: number
    }) => {
      const result = await api.board.updateColumn(args)
      return result
    },
    onSuccess: (data: { name: string; boardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['boards', data.boardId, data.name] })
    },
  })
}

// VIBECHECK QUERIES

// Query to get all vibes
export function useVibes() {
  return useQuery(convexQuery(api.vibes.getAll, {}))
}

// Query to get a vibe by ID
export function useVibe(id: string) {
  return useQuery({
    ...convexQuery(api.vibes.getById, { id }),
    enabled: !!id,
  })
}

// Query to get vibes by user
export function useUserVibes(userId: string) {
  return useQuery({
    ...convexQuery(api.vibes.getByUser, { userId }),
    enabled: !!userId,
  })
}

// Mutation to create a vibe
export function useCreateVibeMutation() {
  const queryClient = useQueryClient()
  return useConvexMutation(api.vibes.create, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibes'] })
    },
  })
}

// Mutation to add a rating
export function useAddRatingMutation() {
  const queryClient = useQueryClient()
  return useConvexMutation(api.vibes.addRating, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibes'] })
    },
  })
}

// Mutation to react to a vibe
export function useReactToVibeMutation() {
  const queryClient = useQueryClient()
  return useConvexMutation(api.vibes.reactToVibe, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibes'] })
    },
  })
}

// Query to get all users
export function useUsers() {
  return useQuery(convexQuery(api.users.getAll, {}))
}

// Query to get user by ID
export function useUser(id: string) {
  return useQuery({
    ...convexQuery(api.users.getById, { id }),
    enabled: !!id,
  })
}

// Mutation to create a user
export function useCreateUserMutation() {
  const queryClient = useQueryClient()
  return useConvexMutation(api.users.create, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Mutation to update a user
export function useUpdateUserMutation() {
  const queryClient = useQueryClient()
  return useConvexMutation(api.users.update, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
