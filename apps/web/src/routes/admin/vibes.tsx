import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import { VibesTable } from '@/features/admin/components/tables/vibes-table';
import { useAdminAuth } from '@/features/admin/hooks/use-admin-auth';

export const Route = createFileRoute('/admin/vibes')({
  component: AdminVibesPage,
});

function AdminVibesPage() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'all' | 'public' | 'deleted'>('all');
  const [dateFrom, setDateFrom] = React.useState<number | undefined>();
  const [dateTo, setDateTo] = React.useState<number | undefined>();
  
  const { data, isLoading, error } = useQuery({
    ...convexQuery(api.admin.vibes.getAllVibes, {
      page,
      pageSize,
      search: search || undefined,
      status,
      dateFrom,
      dateTo,
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
      title="vibes"
      description={`manage ${stats?.totalVibes || 0} vibes and content moderation`}
    >
      <div className="h-full flex flex-col">
        <VibesTable
          data={data?.data?.map((vibe: any) => ({
            ...vibe,
            createdBy: vibe.creator,
            ratings: vibe.emojiRatings || [], // Use emojiRatings from backend
            emojiRatings: vibe.emojiRatings || [],
          })) || []}
          totalCount={data?.totalCount || 0}
          pageCount={data?.pageCount || 0}
          currentPage={page}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSearchChange={setSearch}
          onStatusChange={setStatus as any}
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