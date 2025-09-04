import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import { TagsTable } from '@/features/admin/components/tables/tags-table';

export const Route = createFileRoute('/admin/tags')({
  component: AdminTagsPage,
});

function AdminTagsPage() {
  const { data, isLoading, error } = useQuery({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep - Convex generated types
    ...convexQuery(api.admin.tags.getAllTags, {
      page: 1,
      pageSize: 100,
      search: undefined,
      minUsage: undefined,
      maxUsage: undefined,
      sortBy: 'usage',
      sortDirection: 'desc',
    }),
  });

  const { data: stats } = useQuery({
    ...convexQuery(api.admin.tags.getTagStats, {}),
  });

  if (error) {
    return (
      <AdminLayout
        title="tags"
        description="manage content tags and categories"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive">failed to load tags</p>
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
      title="tags"
      description={`manage ${stats?.totalTags || 0} content tags and categories`}
    >
      <div className="flex h-full flex-col">
        <TagsTable
          data={
            data?.data?.map((tag) => ({
              _id: tag._id as string,
              name: tag.name,
              usageCount: tag.count || 0,
              lastUsed: tag.lastUsed,
              createdAt: tag.createdAt,
            })) || []
          }
          isLoading={isLoading}
        />
      </div>
    </AdminLayout>
  );
}
