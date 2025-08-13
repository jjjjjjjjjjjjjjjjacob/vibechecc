import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import { TagsTable } from '@/features/admin/components/tables/tags-table';

export const Route = createFileRoute('/admin/tags')({
  component: AdminTagsPage,
});

function AdminTagsPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'name' | 'usage' | 'lastUsed'>(
    'usage'
  );
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(
    'desc'
  );

  const { data, isLoading, error } = useQuery({
    ...convexQuery(api.admin.tags.getAllTags, {
      page,
      pageSize,
      search: search || undefined,
      sortBy,
      sortDirection,
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
          totalCount={data?.totalCount || 0}
          pageCount={data?.pageCount || 0}
          currentPage={page}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSearchChange={setSearch}
          onSortChange={(field, direction) => {
            setSortBy(field);
            setSortDirection(direction);
          }}
          stats={stats}
        />
      </div>
    </AdminLayout>
  );
}
