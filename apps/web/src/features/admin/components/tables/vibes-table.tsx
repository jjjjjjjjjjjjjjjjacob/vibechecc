import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Edit, Trash2, Flag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import type { Vibe } from '@viberatr/types';
import { DataTable } from '../data-table';
import { DataTableColumnHeader } from '../data-table/data-table-column-header';
import { EditableTextCell } from '../cells/editable-text-cell';
import { SelectCell } from '../cells/select-cell';
import { TagArrayCell } from '../cells/tag-array-cell';
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

interface VibesTableProps {
  data: Vibe[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: 'all' | 'public' | 'private' | 'deleted') => void;
  onDateRangeChange: (from: number | undefined, to: number | undefined) => void;
  stats?: {
    totalVibes: number;
    publicVibes: number;
    deletedVibes: number;
    averageRating: number;
    totalViews: number;
  };
}

export function VibesTable({
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
}: VibesTableProps) {
  const queryClient = useQueryClient();

  const moderateVibeMutation = useConvexMutation(api.admin.vibes.moderateVibe);
  const deleteVibeMutation = useConvexMutation(api.admin.vibes.deleteVibe);

  const handleModerateVibe = useMutation({
    mutationFn: async ({ vibeId, visibility, reason }: { 
      vibeId: string; 
      visibility: 'public' | 'deleted'; 
      reason?: string; 
    }) => {
      return moderateVibeMutation({ vibeId: vibeId as any, visibility, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vibes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'vibe-stats'] });
      toast.success('vibe updated');
    },
    onError: (error) => {
      toast.error('failed to update vibe');
      console.error('Update vibe error:', error);
    },
  });

  const handleDeleteVibe = useMutation({
    mutationFn: async ({ vibeId, reason }: { vibeId: string; reason?: string }) => {
      return deleteVibeMutation({ vibeId: vibeId as any, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vibes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'vibe-stats'] });
      toast.success('vibe deleted');
    },
    onError: (error) => {
      toast.error('failed to delete vibe');
      console.error('Delete vibe error:', error);
    },
  });

  const getAverageRating = (vibe: Vibe) => {
    if (!vibe.ratings || vibe.ratings.length === 0) return 0;
    const sum = vibe.ratings.reduce((acc, rating) => acc + rating.value, 0);
    return Math.round((sum / vibe.ratings.length) * 10) / 10;
  };

  const columns: ColumnDef<Vibe>[] = [
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
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="title" />
      ),
      cell: ({ row }) => {
        const vibe = row.original;
        return (
          <div className="space-y-1 max-w-[300px]">
            <EditableTextCell
              value={vibe.title}
              onSave={async (newValue) => {
                // This would need a mutation for updating vibe title
                console.log('Update title:', newValue);
              }}
              placeholder="no title..."
            />
            <div className="text-xs text-muted-foreground truncate">
              {vibe.description}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'author',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="author" />
      ),
      cell: ({ row }) => {
        const vibe = row.original;
        const author = vibe.createdBy;
        if (!author) return <span className="text-muted-foreground">unknown</span>;
        
        const displayName = author.username || `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'anonymous';
        
        return (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={author.image_url || author.profile_image_url} />
              <AvatarFallback className="text-xs">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{displayName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'tags',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="tags" />
      ),
      cell: ({ row }) => {
        const vibe = row.original;
        return (
          <TagArrayCell
            value={vibe.tags || []}
            onSave={async (newTags) => {
              // This would need a mutation for updating vibe tags
              console.log('Update tags:', newTags);
            }}
            maxTags={10}
          />
        );
      },
    },
    {
      accessorKey: 'rating',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="rating" />
      ),
      cell: ({ row }) => {
        const vibe = row.original;
        const avgRating = getAverageRating(vibe);
        const ratingCount = vibe.ratings?.length || 0;
        
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <span className="font-medium">{avgRating}★</span>
              <span className="text-xs text-muted-foreground">
                ({ratingCount})
              </span>
            </div>
            {ratingCount > 0 && (
              <div className="flex flex-wrap gap-1">
                {vibe.ratings.slice(0, 3).map((rating, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {rating.emoji}
                  </Badge>
                ))}
                {ratingCount > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{ratingCount - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'visibility',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="status" />
      ),
      cell: ({ row }) => {
        const vibe = row.original;
        const visibility = vibe.visibility || 'public';
        
        return (
          <SelectCell
            value={visibility}
            options={[
              { label: 'public', value: 'public' },
              { label: 'deleted', value: 'deleted' },
            ]}
            onSave={async (newVisibility) => {
              await handleModerateVibe.mutateAsync({
                vibeId: vibe._id!,
                visibility: newVisibility as 'public' | 'deleted',
                reason: `changed to ${newVisibility} by admin`,
              });
            }}
            isOptimistic={handleModerateVibe.isPending}
          />
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="created" />
      ),
      cell: ({ row }) => {
        const vibe = row.original;
        const date = new Date(vibe.createdAt);
        return (
          <div className="text-sm">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'viewCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="views" />
      ),
      cell: ({ row }) => {
        const vibe = row.original;
        return (
          <div className="text-sm">
            {(vibe.viewCount || 0).toLocaleString()}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'actions',
      cell: ({ row }) => {
        const vibe = row.original;
        const isDeleted = vibe.visibility === 'deleted';
        
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
                onClick={() => navigator.clipboard.writeText(vibe.id)}
              >
                <Eye className="mr-2 h-4 w-4" />
                copy vibe id
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Navigate to vibe page
                  window.open(`/vibes/${vibe.id}`, '_blank');
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                view vibe
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  handleModerateVibe.mutate({
                    vibeId: vibe._id!,
                    visibility: isDeleted ? 'public' : 'deleted',
                    reason: isDeleted ? 'restored by admin' : 'hidden by admin',
                  });
                }}
                disabled={handleModerateVibe.isPending}
              >
                {isDeleted ? (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    restore vibe
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    hide vibe
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('are you sure you want to permanently delete this vibe? this action cannot be undone.')) {
                    handleDeleteVibe.mutate({
                      vibeId: vibe._id!,
                      reason: 'permanently deleted by admin',
                    });
                  }
                }}
                disabled={handleDeleteVibe.isPending}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                delete permanently
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
      searchKey="title"
      searchPlaceholder="search vibes..."
      filters={[
        {
          key: 'visibility',
          title: 'status',
          options: [
            { label: 'public', value: 'public' },
            { label: 'deleted', value: 'deleted' },
          ],
        },
      ]}
      bulkActions={[
        {
          label: 'hide selected',
          action: (selectedVibes) => {
            selectedVibes.forEach((vibe) => {
              handleModerateVibe.mutate({
                vibeId: vibe._id!,
                visibility: 'deleted',
                reason: 'bulk hidden by admin',
              });
            });
          },
          variant: 'destructive',
        },
      ]}
      onExport={() => {
        // Implement CSV export
        console.log('Export vibes');
      }}
      exportLabel="export vibes"
      isLoading={isLoading}
      emptyMessage="no vibes found."
      className="space-y-4"
    />
  );
}