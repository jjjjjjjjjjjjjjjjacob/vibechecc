import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@viberatr/convex';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import { UsersTable } from '@/features/admin/components/tables/users-table';

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'all' | 'active' | 'suspended'>(
    'all'
  );
  const [dateFrom, setDateFrom] = React.useState<number | undefined>();
  const [dateTo, setDateTo] = React.useState<number | undefined>();

  const { data, isLoading, error } = useQuery({
    ...convexQuery(api.admin.users.getAllUsers, {
      page,
      pageSize,
      search: search || undefined,
      status,
      dateFrom,
      dateTo,
    }),
  });

  const { data: stats } = useQuery({
    ...convexQuery(api.admin.users.getUserStats, {}),
  });

  if (error) {
    return (
      <AdminLayout
        title="users"
        description="manage user accounts and permissions"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive">failed to load users</p>
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
      title="users"
      description={`manage ${stats?.totalUsers || 0} user accounts and permissions`}
    >
      <div className="flex h-full flex-col">
        <UsersTable
          data={data?.data || []}
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
          stats={stats}
        />
      </div>
    </AdminLayout>
  );
}
