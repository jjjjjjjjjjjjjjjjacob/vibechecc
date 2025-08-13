import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import { EmojisTable } from '@/features/admin/components/tables/emojis-table';
import { useAdminAuth } from '@/features/admin/hooks/use-admin-auth';

export const Route = createFileRoute('/admin/emojis')({
  component: AdminEmojisPage,
});

function AdminEmojisPage() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<string>('all');
  const [sentiment, setSentiment] = React.useState<string>('all');
  const [enabled, setEnabled] = React.useState<'all' | 'enabled' | 'disabled'>(
    'all'
  );
  const [sortBy, setSortBy] = React.useState<'unicode' | 'name' | 'category'>(
    'unicode'
  );
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(
    'asc'
  );

  const { data, isLoading, error } = useQuery({
    ...convexQuery(api.admin.emojis.getAllEmojis, {
      page,
      pageSize,
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      sentiment:
        sentiment === 'all'
          ? undefined
          : (sentiment as 'positive' | 'negative' | 'neutral' | undefined),
      status:
        enabled === 'all'
          ? undefined
          : enabled === 'enabled'
            ? 'enabled'
            : 'disabled',
      sortBy,
      sortDirection,
    }),
    enabled: isAdmin && !authLoading,
  });

  const { data: stats } = useQuery({
    ...convexQuery(api.admin.emojis.getEmojiStats, {}),
    enabled: isAdmin && !authLoading,
  });

  // Categories matching the database seed data
  const categories = [
    'smileys',
    'people',
    'animals',
    'food',
    'travel',
    'activities',
    'objects',
    'symbols',
    'flags',
  ];

  if (error) {
    return (
      <AdminLayout
        title="emojis"
        description="manage emoji collection and settings"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive">failed to load emojis</p>
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
      title="emojis"
      description={`manage ${stats?.totalEmojis || 0} emojis with ${stats?.enabledEmojis || 0} enabled`}
    >
      <div className="flex h-full flex-col">
        <EmojisTable
          data={
            data?.data?.map((emoji) => ({
              _id: emoji._id as string,
              emoji: emoji.emoji,
              name: emoji.name,
              category: emoji.category,
              keywords: emoji.keywords || [],
              sentiment: emoji.sentiment,
              unicode: emoji.unicode || 'U+0000',
              enabled: !emoji.disabled,
              usageCount: emoji.usageCount,
              lastUsed: emoji.lastUsed,
            })) || []
          }
          totalCount={data?.totalCount || 0}
          pageCount={data?.pageCount || 0}
          currentPage={page}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPage(1); // Reset to first page when changing page size
          }}
          onSearchChange={(newSearch) => {
            setSearch(newSearch);
            setPage(1); // Reset to first page when searching
          }}
          onCategoryChange={(newCategory) => {
            setCategory(newCategory);
            setPage(1); // Reset to first page when filtering
          }}
          onSentimentChange={(newSentiment) => {
            setSentiment(newSentiment);
            setPage(1); // Reset to first page when filtering
          }}
          onEnabledChange={(newEnabled) => {
            setEnabled(newEnabled);
            setPage(1); // Reset to first page when filtering
          }}
          onSortChange={(field, direction) => {
            setSortBy(field);
            setSortDirection(direction);
          }}
          categories={categories || []}
          stats={
            stats
              ? {
                  totalEmojis: stats.totalEmojis,
                  enabledEmojis: stats.enabledEmojis,
                  categoriesCount: Object.keys(stats.categoryDistribution || {})
                    .length,
                  averageUsage: stats.averageUsagePerEmoji,
                }
              : undefined
          }
          searchValue={search}
          categoryValue={category}
          sentimentValue={sentiment}
          enabledValue={enabled}
        />
      </div>
    </AdminLayout>
  );
}
