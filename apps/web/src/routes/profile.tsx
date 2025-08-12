import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/profile')({
  component: ProfileLayout,
});

function ProfileLayout() {
  return <Outlet />;
}

export default ProfileLayout;
