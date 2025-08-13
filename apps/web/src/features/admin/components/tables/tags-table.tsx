import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Hash, Trash2, Edit2 } from '@/components/ui/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import type { Id } from '@viberatr/convex/dataModel';
import { DataTable } from '../data-table';
import { DataTableColumnHeader } from '../data-table/data-table-column-header';
import { EditableTextCell } from '../cells/editable-text-cell';
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

interface Tag {
  _id: string;
  name: string;
  usageCount: number;
  lastUsed: number;
  createdAt: number;
}

interface TagsTableProps {
  data: Tag[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (
    field: 'name' | 'usage' | 'lastUsed',
    direction: 'asc' | 'desc'
  ) => void;
  stats?: {
    totalTags: number;
    activeTags: number;
    unusedTags: number;
    averageUsage: number;
  };
}

export function TagsTable({
  data,
  totalCount: _totalCount,
  pageCount: _pageCount,
  currentPage: _currentPage,
  pageSize: _pageSize,
  isLoading,
  onPageChange: _onPageChange,
  onPageSizeChange: _onPageSizeChange,
  onSearchChange: _onSearchChange,
  onSortChange: _onSortChange,
  stats: _stats,
}: TagsTableProps) {
  const queryClient = useQueryClient();

  const updateTagMutation = useConvexMutation(api.admin.tags.updateTag);
  const deleteTagMutation = useConvexMutation(api.admin.tags.deleteTag);
  const mergeTagsMutation = useConvexMutation(api.admin.tags.mergeTags);

  const handleUpdateTag = useMutation({
    mutationFn: async ({ tagId, name }: { tagId: string; name: string }) => {
      return updateTagMutation({ tagId: tagId as Id<'tags'>, name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tag-stats'] });
      toast.success('tag updated');
    },
    onError: (_error) => {
      toast.error('failed to update tag');
    },
  });

  const handleDeleteTag = useMutation({
    mutationFn: async ({ tagId }: { tagId: string }) => {
      return deleteTagMutation({ tagId: tagId as Id<'tags'> });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tag-stats'] });
      toast.success('tag deleted');
    },
    onError: (_error) => {
      toast.error('failed to delete tag');
    },
  });

  const handleMergeTags = useMutation({
    mutationFn: async ({
      sourceTagId,
      targetTagId,
    }: {
      sourceTagId: string;
      targetTagId: string;
    }) => {
      return mergeTagsMutation({
        sourceTagId: sourceTagId as Id<'tags'>,
        targetTagId: targetTagId as Id<'tags'>,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tag-stats'] });
      toast.success('tags merged');
    },
    onError: (_error) => {
      toast.error('failed to merge tags');
    },
  });

  const getUsageLevel = (count: number) => {
    if (count === 0) return 'unused';
    if (count < 5) return 'low';
    if (count < 20) return 'medium';
    return 'high';
  };

  const getUsageBadgeVariant = (level: string) => {
    switch (level) {
      case 'unused':
        return 'secondary';
      case 'low':
        return 'outline';
      case 'medium':
        return 'default';
      case 'high':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const columns: ColumnDef<Tag>[] = [
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
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="name" />
      ),
      cell: ({ row }) => {
        const tag = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Hash className="text-muted-foreground h-4 w-4" />
            <EditableTextCell
              value={tag.name}
              onSave={async (newValue) => {
                await handleUpdateTag.mutateAsync({
                  tagId: tag._id,
                  name: newValue,
                });
              }}
              placeholder="tag name..."
              isOptimistic={handleUpdateTag.isPending}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'usageCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="usage count" />
      ),
      cell: ({ row }) => {
        const tag = row.original;
        const usageLevel = getUsageLevel(tag.usageCount);

        return (
          <div className="flex items-center space-x-2">
            <span className="font-medium">
              {tag.usageCount.toLocaleString()}
            </span>
            <Badge
              variant={getUsageBadgeVariant(usageLevel)}
              className="text-xs"
            >
              {usageLevel}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'lastUsed',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="last used" />
      ),
      cell: ({ row }) => {
        const tag = row.original;
        const date = tag.lastUsed ? new Date(tag.lastUsed) : null;
        const now = Date.now();
        const daysSince = date
          ? Math.floor((now - date.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return (
          <div className="space-y-1">
            <div className="text-sm">
              {date ? date.toLocaleDateString() : 'never'}
            </div>
            {daysSince !== null && (
              <div
                className={cn(
                  'text-xs',
                  daysSince > 30
                    ? 'text-destructive'
                    : daysSince > 7
                      ? 'text-yellow-600'
                      : 'text-muted-foreground'
                )}
              >
                {daysSince === 0
                  ? 'today'
                  : daysSince === 1
                    ? 'yesterday'
                    : `${daysSince} days ago`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="created" />
      ),
      cell: ({ row }) => {
        const tag = row.original;
        const date = new Date(tag.createdAt);
        return <div className="text-sm">{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: 'actions',
      header: 'actions',
      cell: ({ row }) => {
        const tag = row.original;

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
                onClick={() => navigator.clipboard.writeText(tag.name)}
              >
                <Hash className="mr-2 h-4 w-4" />
                copy tag name
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Navigate to search with this tag
                  window.open(
                    `/search?tags=${encodeURIComponent(tag.name)}`,
                    '_blank'
                  );
                }}
              >
                <Hash className="mr-2 h-4 w-4" />
                search with tag
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  const targetTag = prompt(
                    'enter the name of the tag to merge into:'
                  );
                  if (targetTag) {
                    // Find the target tag ID (this would need to be improved)
                    const targetTagData = data.find(
                      (t) => t.name.toLowerCase() === targetTag.toLowerCase()
                    );
                    if (targetTagData) {
                      handleMergeTags.mutate({
                        sourceTagId: tag._id,
                        targetTagId: targetTagData._id,
                      });
                    } else {
                      toast.error('target tag not found');
                    }
                  }
                }}
                disabled={handleMergeTags.isPending}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                merge into...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (
                    confirm(
                      `are you sure you want to delete the tag "${tag.name}"? this will remove it from ${tag.usageCount} vibes.`
                    )
                  ) {
                    handleDeleteTag.mutate({
                      tagId: tag._id,
                    });
                  }
                }}
                disabled={handleDeleteTag.isPending}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                delete tag
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
      searchKey="name"
      searchPlaceholder="search tags..."
      filters={[
        {
          key: 'usageCount',
          title: 'usage level',
          options: [
            { label: 'unused (0)', value: '0' },
            { label: 'low (1-4)', value: 'low' },
            { label: 'medium (5-19)', value: 'medium' },
            { label: 'high (20+)', value: 'high' },
          ],
        },
      ]}
      bulkActions={[
        {
          label: 'delete selected',
          action: (selectedTags) => {
            if (
              confirm(
                `are you sure you want to delete ${selectedTags.length} tags? this action cannot be undone.`
              )
            ) {
              selectedTags.forEach((tag) => {
                handleDeleteTag.mutate({
                  tagId: tag._id,
                });
              });
            }
          },
          variant: 'destructive',
        },
      ]}
      onExport={() => {
        // Implement CSV export
      }}
      exportLabel="export tags"
      isLoading={isLoading}
      emptyMessage="no tags found."
      className="space-y-4"
    />
  );
}
