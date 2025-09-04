import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import { VibesTable } from '@/features/admin/components/tables/vibes-table';
import { useAdminAuth } from '@/features/admin/hooks/use-admin-auth';

export const Route = createFileRoute('/admin/vibes')({
  component: AdminVibesPage,
});

function AdminVibesPage() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();

  const { data, isLoading, error } = useQuery({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep - Convex generated types
    ...convexQuery(api.admin.vibes.getAllVibes, {
      page: 1,
      pageSize: 100,
      search: undefined,
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    }),
    enabled: isAdmin && !authLoading,
  });

  const { data: stats } = useQuery({
    ...convexQuery(api.admin.vibes.getVibeStats, {}),
    enabled: isAdmin && !authLoading,
  });

  if (error) {
    return (
      <AdminLayout title="vibes" description="manage content and moderation">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive">failed to load vibes</p>
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
      title="vibes"
      description={`manage ${stats?.totalVibes || 0} vibes and content moderation`}
    >
      <div className="flex h-full flex-col">
        <VibesTable
          data={
            data?.data?.map((vibe) => ({
              ...vibe,
              _id: vibe._id,
              id: vibe.id,
              title: vibe.title,
              description: vibe.description,
              image: vibe.image,
              createdBy: vibe.creator
                ? {
                    ...vibe.creator,
                    externalId: vibe.createdById || 'unknown',
                  }
                : null,
              createdAt: vibe.createdAt,
              ratings: (vibe.emojiRatings || []).map((rating) => ({
                ...rating,
                user: rating.user
                  ? {
                      ...rating.user,
                      externalId: rating.userId,
                    }
                  : null,
                value: rating.value,
                emoji: rating.emoji,
                review: rating.review,
                createdAt: rating.createdAt,
                tags: rating.tags,
              })),
              tags: vibe.tags,
              viewCount: 0, // viewCount not tracked in backend
              visibility: vibe.visibility,
            })) || []
          }
          isLoading={isLoading}
        />
      </div>
    </AdminLayout>
  );
}
