import { Outlet, createFileRoute } from '@tanstack/react-router';
import * as React from 'react';

export const Route = createFileRoute('/admin')({
  component: AdminLayoutRoute,
});

/**
 * Layout route for admin pages that doesn't include the main app header/footer
 * All admin/* routes will be rendered within this layout
 */
function AdminLayoutRoute() {
  return <Outlet />;
}
