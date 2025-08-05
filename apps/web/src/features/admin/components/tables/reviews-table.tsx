import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Flag, Trash2, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import type { Rating } from '@viberatr/types';
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

interface ReviewsTableProps {
  data: Rating[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: 'all' | 'flagged' | 'approved') => void;
  onDateRangeChange: (from: number | undefined, to: number | undefined) => void;
  stats?: {
    totalReviews: number;
    flaggedReviews: number;
    averageRating: number;
    totalRatings: number;
  };
}

export function ReviewsTable({
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
}: ReviewsTableProps) {
  const queryClient = useQueryClient();

  const moderateReviewMutation = useConvexMutation(api.admin.reviews.moderateReview);
  const deleteReviewMutation = useConvexMutation(api.admin.reviews.deleteReview);

  const handleModerateReview = useMutation({
    mutationFn: async ({ reviewId, flagged, reason }: { 
      reviewId: string; 
      flagged: boolean; 
      reason?: string; 
    }) => {
      return moderateReviewMutation({ reviewId: reviewId as any, flagged, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'review-stats'] });
      toast.success('review updated');
    },
    onError: (error) => {
      toast.error('failed to update review');
      console.error('Update review error:', error);
    },
  });

  const handleDeleteReview = useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason?: string }) => {
      return deleteReviewMutation({ reviewId: reviewId as any, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'review-stats'] });
      toast.success('review deleted');
    },
    onError: (error) => {
      toast.error('failed to delete review');
      console.error('Delete review error:', error);
    },
  });

  const columns: ColumnDef<Rating>[] = [
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
      accessorKey: 'user',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="user" />
      ),
      cell: ({ row }) => {
        const rating = row.original;
        const user = rating.user || rating.rater;
        if (!user) return <span className="text-muted-foreground">unknown</span>;
        
        const displayName = user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'anonymous';
        
        return (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.image_url} />
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
      accessorKey: 'vibe',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="vibe" />
      ),
      cell: ({ row }) => {
        const rating = row.original;
        const vibe = rating.vibe;
        if (!vibe) return <span className="text-muted-foreground">unknown</span>;
        
        return (
          <div className="max-w-[200px]">
            <div className="font-medium truncate">{vibe.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              {vibe.description}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'emoji',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="emoji" />
      ),
      cell: ({ row }) => {
        const rating = row.original;
        return (
          <div className="text-center">
            <span className="text-2xl">{rating.emoji}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'value',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="rating" />
      ),
      cell: ({ row }) => {
        const rating = row.original;
        return (
          <div className="flex items-center space-x-1">
            <span className="font-medium">{rating.value}</span>
            <span className="text-xs text-muted-foreground">★</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'review',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="review" />
      ),
      cell: ({ row }) => {
        const rating = row.original;
        return (
          <div className="max-w-[300px]">
            <EditableTextCell
              value={rating.review}
              onSave={async (newValue) => {
                // This would need a mutation for updating review text
                console.log('Update review:', newValue);
              }}
              multiline
              placeholder="no review..."
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'flagged',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="flagged" />
      ),
      cell: ({ row }) => {
        const rating = row.original;
        const isFlagged = (rating as any).flagged === true;
        
        return (
          <ToggleCell
            value={isFlagged}
            onSave={async (flagged) => {
              await handleModerateReview.mutateAsync({
                reviewId: rating._id!,
                flagged,
                reason: flagged ? 'flagged by admin' : 'unflagged by admin',
              });
            }}
            label={isFlagged ? 'flagged' : 'approved'}
            variant="switch"
            isOptimistic={handleModerateReview.isPending}
          />
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="date" />
      ),
      cell: ({ row }) => {
        const rating = row.original;
        const date = new Date(rating.createdAt);
        return (
          <div className="text-sm">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'actions',
      cell: ({ row }) => {
        const rating = row.original;
        const isFlagged = (rating as any).flagged === true;
        
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
                onClick={() => navigator.clipboard.writeText(rating._id!)}
              >
                <Eye className="mr-2 h-4 w-4" />
                copy review id
              </DropdownMenuItem>
              {rating.vibeId && (
                <DropdownMenuItem
                  onClick={() => {
                    window.open(`/vibes/${rating.vibeId}`, '_blank');
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  view vibe
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  handleModerateReview.mutate({
                    reviewId: rating._id!,
                    flagged: !isFlagged,
                    reason: isFlagged ? 'unflagged by admin' : 'flagged by admin',
                  });
                }}
                disabled={handleModerateReview.isPending}
              >
                {isFlagged ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    approve review
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    flag review
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('are you sure you want to delete this review? this action cannot be undone.')) {
                    handleDeleteReview.mutate({
                      reviewId: rating._id!,
                      reason: 'deleted by admin',
                    });
                  }
                }}
                disabled={handleDeleteReview.isPending}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                delete review
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
      searchKey="review"
      searchPlaceholder="search reviews..."
      filters={[
        {
          key: 'flagged',
          title: 'status',
          options: [
            { label: 'approved', value: 'false' },
            { label: 'flagged', value: 'true' },
          ],
        },
      ]}
      bulkActions={[
        {
          label: 'flag selected',
          action: (selectedReviews) => {
            selectedReviews.forEach((review) => {
              handleModerateReview.mutate({
                reviewId: review._id!,
                flagged: true,
                reason: 'bulk flagged by admin',
              });
            });
          },
          variant: 'destructive',
        },
        {
          label: 'approve selected',
          action: (selectedReviews) => {
            selectedReviews.forEach((review) => {
              handleModerateReview.mutate({
                reviewId: review._id!,
                flagged: false,
                reason: 'bulk approved by admin',
              });
            });
          },
        },
      ]}
      onExport={() => {
        // Implement CSV export
        console.log('Export reviews');
      }}
      exportLabel="export reviews"
      isLoading={isLoading}
      emptyMessage="no reviews found."
      className="space-y-4"
    />
  );
}