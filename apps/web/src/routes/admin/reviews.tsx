import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import { ReviewsTable } from '@/features/admin/components/tables/reviews-table';

export const Route = createFileRoute('/admin/reviews')({
  component: AdminReviewsPage,
});

function AdminReviewsPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'all' | 'flagged' | 'approved'>('all');
  const [dateFrom, setDateFrom] = React.useState<number | undefined>();
  const [dateTo, setDateTo] = React.useState<number | undefined>();
  
  const { data, isLoading, error } = useQuery({
    ...convexQuery(api.admin.reviews.getAllReviews, {
      page,
      pageSize,
      search: search || undefined,
      status,
      dateFrom,
      dateTo,
    }),
  });

  const { data: stats } = useQuery({
    ...convexQuery(api.admin.reviews.getReviewStats, {}),
  });

  if (error) {
    return (
      <AdminLayout title="reviews" description="manage user reviews and ratings">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive">failed to load reviews</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'unknown error'}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="reviews"
      description={`manage ${stats?.totalReviews || 0} user reviews and ratings`}
    >
      <div className="h-full flex flex-col">
        <ReviewsTable
        data={data?.data?.map((review: any) => ({
          ...review,
          user: review.user ? { ...review.user, externalId: 'unknown' } : null,
        })) || []}
        totalCount={data?.totalCount || 0}
        pageCount={data?.pageCount || 0}
        currentPage={page}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onDateRangeChange={(from, to) => {
          setDateFrom(from);
          setDateTo(to);
        }}
        stats={stats as any}
      />
      </div>
    </AdminLayout>
  );
}