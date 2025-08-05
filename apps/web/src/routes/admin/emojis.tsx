import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import { EmojisTable } from '@/features/admin/components/tables/emojis-table';

export const Route = createFileRoute('/admin/emojis')({
  component: AdminEmojisPage,
});

function AdminEmojisPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<string>('all');
  const [enabled, setEnabled] = React.useState<'all' | 'enabled' | 'disabled'>('all');
  const [sortBy, setSortBy] = React.useState<'unicode' | 'name' | 'category'>('unicode');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  
  const { data, isLoading, error } = useQuery({
    ...convexQuery(api.admin.emojis.getAllEmojis, {
      page,
      pageSize,
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      status: enabled === 'all' ? undefined : (enabled === 'enabled' ? 'enabled' : 'disabled'),
      sortBy,
      sortDirection,
    }),
  });

  const { data: stats } = useQuery({
    ...convexQuery(api.admin.emojis.getEmojiStats, {}),
  });

  // Mock categories for now - in a real app, this might come from the stats or be hardcoded
  const categories = [
    'smileys-emotion',
    'people-body', 
    'animals-nature',
    'food-drink',
    'travel-places',
    'activities',
    'objects',
    'symbols',
    'flags'
  ];

  if (error) {
    return (
      <AdminLayout title="emojis" description="manage emoji collection and settings">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive">failed to load emojis</p>
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
      title="emojis"
      description={`manage ${stats?.totalEmojis || 0} emojis with ${stats?.enabledEmojis || 0} enabled`}
    >
      <div className="h-full flex flex-col">
        <EmojisTable
        data={data?.data?.map((emoji: any) => ({
          ...emoji,
          unicode: emoji.unicode || emoji.codepoint || 'U+0000',
          enabled: !emoji.disabled,
        })) || []}
        totalCount={data?.totalCount || 0}
        pageCount={data?.pageCount || 0}
        currentPage={page}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onEnabledChange={setEnabled}
        onSortChange={(field, direction) => {
          setSortBy(field);
          setSortDirection(direction);
        }}
        categories={categories || []}
        stats={stats as any}
      />
      </div>
    </AdminLayout>
  );
}