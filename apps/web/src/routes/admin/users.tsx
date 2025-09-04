import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@vibechecc/convex';
import { AdminLayout } from '@/features/admin/components/admin-layout';
import { UsersTable } from '@/features/admin/components/tables/users-table';

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { data, isLoading, error } = useQuery({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep - Convex generated types
    ...convexQuery(api.admin.users.getAllUsers, {
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
        <UsersTable data={data?.data || []} isLoading={isLoading} />
      </div>
    </AdminLayout>
  );
}
