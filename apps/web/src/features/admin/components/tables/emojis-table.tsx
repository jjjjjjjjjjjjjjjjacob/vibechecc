import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Copy, Eye, Edit2 } from '@/components/ui/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import type { Id } from '@vibechecc/convex/dataModel';
import { DataTable } from '../data-table';
import { DataTableColumnHeader } from '../data-table/data-table-column-header';
import { EditableTextCell } from '../cells/editable-text-cell';
import { SelectCell } from '../cells/select-cell';
import { TagArrayCell } from '../cells/tag-array-cell';
import { ToggleCell } from '../cells/toggle-cell';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/utils/toast';

interface Emoji {
  _id: string;
  unicode: string;
  emoji: string;
  name: string;
  category: string;
  keywords: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  enabled: boolean;
  usageCount?: number;
  lastUsed?: number;
}

interface EmojisTableProps {
  data: Emoji[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string) => void;
  onSentimentChange: (sentiment: string) => void;
  onEnabledChange: (enabled: 'all' | 'enabled' | 'disabled') => void;
  onSortChange: (
    field: 'unicode' | 'name' | 'category',
    direction: 'asc' | 'desc'
  ) => void;
  categories: string[];
  stats?: {
    totalEmojis: number;
    enabledEmojis: number;
    categoriesCount: number;
    averageUsage: number;
  };
  searchValue: string;
  categoryValue: string;
  sentimentValue: string;
  enabledValue: 'all' | 'enabled' | 'disabled';
}

export function EmojisTable({
  data,
  totalCount,
  pageCount,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onCategoryChange,
  onSentimentChange,
  onEnabledChange,
  onSortChange: _onSortChange,
  categories,
  stats: _stats,
  searchValue,
  categoryValue,
  sentimentValue,
  enabledValue,
}: EmojisTableProps) {
  const queryClient = useQueryClient();

  const updateEmojiFieldMutation = useConvexMutation(
    api.admin.emojis.updateEmojiField
  );
  const toggleEmojiStatusMutation = useConvexMutation(
    api.admin.emojis.toggleEmojiStatus
  );

  const handleUpdateEmojiField = useMutation({
    mutationFn: async (params: {
      emojiId: string;
      field: 'name' | 'category' | 'sentiment' | 'keywords';
      value: string | string[] | undefined;
    }) => {
      return updateEmojiFieldMutation({
        emojiId: params.emojiId as Id<'emojis'>,
        field: params.field,
        value: params.value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'emojis'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'emoji-stats'] });
      toast.success('emoji updated');
    },
    onError: (_error) => {
      toast.error('failed to update emoji');
    },
  });

  const handleToggleEmojiStatus = useMutation({
    mutationFn: async (params: { emojiId: string; disabled: boolean }) => {
      return toggleEmojiStatusMutation({
        emojiId: params.emojiId as Id<'emojis'>,
        disabled: params.disabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'emojis'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'emoji-stats'] });
      toast.success('emoji status updated');
    },
    onError: (_error) => {
      toast.error('failed to update emoji status');
    },
  });

  const _getSentimentBadgeVariant = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'default';
      case 'negative':
        return 'destructive';
      case 'neutral':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const _getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const columns: ColumnDef<Emoji>[] = [
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
      accessorKey: 'emoji',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="emoji" />
      ),
      cell: ({ row }) => {
        const emoji = row.original;
        return (
          <div className="space-y-2">
            {/* System emoji previews */}
            <div className="flex space-x-2">
              <div className="text-center">
                <div
                  className="text-2xl"
                  style={{
                    fontFamily: 'Apple Color Emoji, Segoe UI Emoji',
                  }}
                >
                  {emoji.emoji}
                </div>
                <div className="text-muted-foreground text-xs">color</div>
              </div>
              <div className="text-center">
                <div
                  className="text-2xl"
                  style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}
                >
                  {emoji.emoji}
                </div>
                <div className="text-muted-foreground text-xs">native</div>
              </div>
            </div>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'unicode',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="unicode" />
      ),
      cell: ({ row }) => {
        const emoji = row.original;
        // Generate Unicode from the actual emoji character
        const unicode = emoji.emoji
          .split('')
          .map((char) => {
            const code = char.codePointAt(0);
            return code
              ? 'U+' + code.toString(16).toUpperCase().padStart(4, '0')
              : '';
          })
          .filter(Boolean)
          .join(' ');
        return <div className="font-mono text-sm">{unicode || 'U+0000'}</div>;
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="name" />
      ),
      cell: ({ row }) => {
        const emoji = row.original;
        return (
          <EditableTextCell
            value={emoji.name}
            onSave={async (newValue) => {
              await handleUpdateEmojiField.mutateAsync({
                emojiId: emoji._id,
                field: 'name',
                value: newValue,
              });
            }}
            placeholder="emoji name..."
            isOptimistic={handleUpdateEmojiField.isPending}
          />
        );
      },
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="category" />
      ),
      cell: ({ row }) => {
        const emoji = row.original;
        return (
          <SelectCell
            value={emoji.category}
            options={categories.map((cat) => ({ label: cat, value: cat }))}
            onSave={async (newValue) => {
              await handleUpdateEmojiField.mutateAsync({
                emojiId: emoji._id,
                field: 'category',
                value: newValue,
              });
            }}
            isOptimistic={handleUpdateEmojiField.isPending}
          />
        );
      },
    },
    {
      accessorKey: 'keywords',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="keywords" />
      ),
      cell: ({ row }) => {
        const emoji = row.original;
        return (
          <TagArrayCell
            value={emoji.keywords || []}
            onSave={async (newKeywords) => {
              await handleUpdateEmojiField.mutateAsync({
                emojiId: emoji._id,
                field: 'keywords',
                value: newKeywords,
              });
            }}
            placeholder="add keyword..."
            maxTags={10}
            isOptimistic={handleUpdateEmojiField.isPending}
          />
        );
      },
    },
    {
      accessorKey: 'sentiment',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="sentiment" />
      ),
      cell: ({ row }) => {
        const emoji = row.original;
        return (
          <SelectCell
            value={emoji.sentiment || 'neutral'}
            options={[
              { label: 'positive', value: 'positive' },
              { label: 'neutral', value: 'neutral' },
              { label: 'negative', value: 'negative' },
            ]}
            onSave={async (newValue) => {
              await handleUpdateEmojiField.mutateAsync({
                emojiId: emoji._id,
                field: 'sentiment',
                value: newValue,
              });
            }}
            isOptimistic={handleUpdateEmojiField.isPending}
          />
        );
      },
    },
    {
      accessorKey: 'enabled',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="enabled" />
      ),
      cell: ({ row }) => {
        const emoji = row.original;
        return (
          <ToggleCell
            value={emoji.enabled}
            onSave={async (enabled) => {
              await handleToggleEmojiStatus.mutateAsync({
                emojiId: emoji._id,
                disabled: !enabled,
              });
            }}
            variant="switch"
            isOptimistic={handleToggleEmojiStatus.isPending}
          />
        );
      },
    },
    {
      accessorKey: 'usageCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="usage" />
      ),
      cell: ({ row }) => {
        const emoji = row.original;
        const usageCount = emoji.usageCount || 0;
        const lastUsed = emoji.lastUsed ? new Date(emoji.lastUsed) : null;

        return (
          <div className="space-y-1">
            <div className="font-medium">{usageCount.toLocaleString()}</div>
            {lastUsed && (
              <div className="text-muted-foreground text-xs">
                last: {lastUsed.toLocaleDateString()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'actions',
      cell: ({ row }) => {
        const emoji = row.original;

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
                onClick={() => navigator.clipboard.writeText(emoji.emoji)}
              >
                <Copy className="mr-2 h-4 w-4" />
                copy emoji
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(emoji.unicode)}
              >
                <Copy className="mr-2 h-4 w-4" />
                copy unicode
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(emoji.name)}
              >
                <Copy className="mr-2 h-4 w-4" />
                copy name
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Navigate to search with this emoji
                  window.open(
                    `/search?emoji=${encodeURIComponent(emoji.emoji)}`,
                    '_blank'
                  );
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                search with emoji
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  handleToggleEmojiStatus.mutate({
                    emojiId: emoji._id,
                    disabled: emoji.enabled,
                  });
                }}
                disabled={handleToggleEmojiStatus.isPending}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                {emoji.enabled ? 'disable' : 'enable'} emoji
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
      searchPlaceholder="search emojis..."
      searchValue={searchValue}
      onSearchValueChange={onSearchChange}
      filters={[
        {
          key: 'category',
          title: 'category',
          options: [
            { label: 'all', value: 'all' },
            ...categories.map((cat) => ({ label: cat, value: cat })),
          ],
          value: categoryValue,
          onChange: onCategoryChange,
        },
        {
          key: 'status',
          title: 'status',
          options: [
            { label: 'all', value: 'all' },
            { label: 'enabled', value: 'enabled' },
            { label: 'disabled', value: 'disabled' },
          ],
          value: enabledValue,
          onChange: (value: string) =>
            onEnabledChange(value as 'all' | 'enabled' | 'disabled'),
        },
        {
          key: 'sentiment',
          title: 'sentiment',
          options: [
            { label: 'all', value: 'all' },
            { label: 'positive', value: 'positive' },
            { label: 'neutral', value: 'neutral' },
            { label: 'negative', value: 'negative' },
          ],
          value: sentimentValue,
          onChange: onSentimentChange,
        },
      ]}
      totalCount={totalCount}
      currentPage={currentPage}
      pageCount={pageCount}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      bulkActions={[
        {
          label: 'enable selected',
          action: (selectedEmojis) => {
            selectedEmojis.forEach((emoji) => {
              handleToggleEmojiStatus.mutate({
                emojiId: emoji._id,
                disabled: false,
              });
            });
          },
        },
        {
          label: 'disable selected',
          action: (selectedEmojis) => {
            selectedEmojis.forEach((emoji) => {
              handleToggleEmojiStatus.mutate({
                emojiId: emoji._id,
                disabled: true,
              });
            });
          },
          variant: 'destructive',
        },
      ]}
      onExport={() => {
        // Implement CSV export
        // console.log('Export emojis');
      }}
      exportLabel="export emojis"
      isLoading={isLoading}
      emptyMessage="no emojis found."
      className="space-y-4"
    />
  );
}
