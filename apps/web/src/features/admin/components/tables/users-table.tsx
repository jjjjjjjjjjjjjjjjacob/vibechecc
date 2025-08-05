import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, User as UserIcon, Shield, Ban, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import type { User } from '@viberatr/types';
import { DataTable } from '../data-table';
import { DataTableColumnHeader } from '../data-table/data-table-column-header';
import { EditableTextCell } from '../cells/editable-text-cell';
import { ToggleCell } from '../cells/toggle-cell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/tailwind-utils';
import { toast } from '@/utils/toast';

interface UsersTableProps {
  data: User[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: 'all' | 'active' | 'suspended') => void;
  onDateRangeChange: (from: number | undefined, to: number | undefined) => void;
  stats?: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    onboardingCompletionRate: number;
    profileCompletionRate: number;
  };
}

export function UsersTable({
  data,
  totalCount,
  pageCount,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onStatusChange,
  onDateRangeChange,
  stats,
}: UsersTableProps) {
  const queryClient = useQueryClient();

  const updateUserMutation = useConvexMutation(api.admin.users.updateUserStatus);
  const deleteUserMutation = useConvexMutation(api.admin.users.deleteUser);

  const handleUpdateUser = useMutation({
    mutationFn: async ({ userId, suspended, reason }: { 
      userId: string; 
      suspended: boolean; 
      reason?: string; 
    }) => {
      return updateUserMutation({ userId: userId as any, suspended, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-stats'] });
      toast.success('user status updated');
    },
    onError: (error) => {
      toast.error('failed to update user status');
      console.error('Update user error:', error);
    },
  });

  const handleDeleteUser = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      return deleteUserMutation({ userId: userId as any, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-stats'] });
      toast.success('user deleted');
    },
    onError: (error) => {
      toast.error('failed to delete user');
      console.error('Delete user error:', error);
    },
  });

  const columns: ColumnDef<User>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'avatar',
      header: '',
      cell: ({ row }) => {
        const user = row.original;
        const displayName = user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'anonymous';
        return (
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image_url || user.profile_image_url} />
            <AvatarFallback>
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'username',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="username" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const displayName = user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'anonymous';
        return (
          <div className="space-y-1">
            <div className="font-medium">{displayName}</div>
            {user.first_name && user.last_name && (
              <div className="text-sm text-muted-foreground">
                {user.first_name} {user.last_name}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'bio',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="bio" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <EditableTextCell
            value={user.bio || ''}
            onSave={async (newValue) => {
              // This would need a separate mutation for updating user bio
              console.log('Update bio:', newValue);
            }}
            multiline
            placeholder="no bio..."
            className="max-w-[200px]"
          />
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="status" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const isSuspended = (user as any).suspended === true;
        
        return (
          <div className="space-y-2">
            <ToggleCell
              value={!isSuspended}
              onSave={async (enabled) => {
                await handleUpdateUser.mutateAsync({
                  userId: user._id!,
                  suspended: !enabled,
                  reason: enabled ? 'unsuspended by admin' : 'suspended by admin',
                });
              }}
              label={isSuspended ? 'suspended' : 'active'}
              variant="switch"
              isOptimistic={handleUpdateUser.isPending}
            />
            {isSuspended && (
              <Badge variant="destructive" className="text-xs">
                suspended
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="joined" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const date = user.created_at ? new Date(user.created_at) : null;
        return (
          <div className="text-sm">
            {date ? date.toLocaleDateString() : 'unknown'}
          </div>
        );
      },
    },
    {
      accessorKey: 'last_sign_in_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="last sign in" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const date = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
        return (
          <div className="text-sm text-muted-foreground">
            {date ? date.toLocaleDateString() : 'never'}
          </div>
        );
      },
    },
    {
      accessorKey: 'onboardingCompleted',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="onboarded" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const completed = (user as any).onboardingCompleted === true;
        return (
          <Badge variant={completed ? 'default' : 'secondary'} className="text-xs">
            {completed ? 'yes' : 'no'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        const isSuspended = (user as any).suspended === true;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.externalId)}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                copy user id
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  handleUpdateUser.mutate({
                    userId: user._id!,
                    suspended: !isSuspended,
                    reason: isSuspended ? 'unsuspended by admin' : 'suspended by admin',
                  });
                }}
                disabled={handleUpdateUser.isPending}
              >
                {isSuspended ? (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    unsuspend user
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    suspend user
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('are you sure you want to delete this user? this action cannot be undone.')) {
                    handleDeleteUser.mutate({
                      userId: user._id!,
                      reason: 'deleted by admin',
                    });
                  }
                }}
                disabled={handleDeleteUser.isPending}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                delete user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="username"
      searchPlaceholder="search users..."
      filters={[
        {
          key: 'status',
          title: 'status',
          options: [
            { label: 'active', value: 'active' },
            { label: 'suspended', value: 'suspended' },
          ],
        },
      ]}
      bulkActions={[
        {
          label: 'suspend selected',
          action: (selectedUsers) => {
            selectedUsers.forEach((user) => {
              handleUpdateUser.mutate({
                userId: user._id!,
                suspended: true,
                reason: 'bulk suspended by admin',
              });
            });
          },
          variant: 'destructive',
        },
      ]}
      onExport={() => {
        // Implement CSV export
        console.log('Export users');
      }}
      exportLabel="export users"
      isLoading={isLoading}
      emptyMessage="no users found."
      className="space-y-4"
    />
  );
}