import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import { ReviewsTable } from '@/features/admin/components/tables/reviews-table';

export const Route = createFileRoute('/admin/reviews')({
  component: AdminReviewsPage,
});

function AdminReviewsPage() {
  const { data, isLoading, error } = useQuery({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep - Convex generated types
    ...convexQuery(api.admin.reviews.getAllReviews, {
      page: 1,
      pageSize: 100,
      search: undefined,
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    }),
  });

  const { data: stats } = useQuery({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep - Convex generated types
    ...convexQuery(api.admin.reviews.getReviewStats, {}),
  });

  if (error) {
    return (
      <AdminLayout
        title="reviews"
        description="manage user reviews and ratings"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive">failed to load reviews</p>
            <p className="text-muted-foreground mt-1 text-sm">
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
      <div className="flex h-full flex-col">
        <ReviewsTable
          data={
            data?.data?.map((review) => ({
              ...review,
              user: review.user
                ? {
                    ...review.user,
                    externalId: review.userId || 'unknown',
                  }
                : null,
              vibe: review.vibe
                ? {
                    ...review.vibe,
                    id: review.vibeId || '',
                    image: undefined,
                    createdBy: {
                      id: '',
                      name: '',
                    },
                    createdAt: review.createdAt,
                  }
                : undefined,
            })) || []
          }
          isLoading={isLoading}
        />
      </div>
    </AdminLayout>
  );
}
