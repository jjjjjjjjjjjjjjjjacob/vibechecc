import * as React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '@/utils/tailwind-utils';
import { AdminGuard } from './admin-guard';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Heart,
  MessageSquare,
  Tag,
  Smile,
  Home,
  ChevronRight,
} from '@/components/ui/icons';
import { Separator } from '@/components/ui/separator';

export interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  title?: string;
  description?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navigationItems: NavItem[] = [
  {
    title: 'dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'overview and analytics',
  },
  {
    title: 'users',
    href: '/admin/users',
    icon: Users,
    description: 'manage user accounts',
  },
  {
    title: 'vibes',
    href: '/admin/vibes',
    icon: Heart,
    description: 'moderate content',
  },
  {
    title: 'reviews',
    href: '/admin/reviews',
    icon: MessageSquare,
    description: 'review moderation',
  },
  {
    title: 'tags',
    href: '/admin/tags',
    icon: Tag,
    description: 'manage tags and categories',
  },
  {
    title: 'emojis',
    href: '/admin/emojis',
    icon: Smile,
    description: 'emoji configuration',
  },
];

function AdminSidebarContent() {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="from-theme-primary to-theme-secondary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br">
            <LayoutDashboard className="size-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">admin panel</span>
              <span className="text-muted-foreground text-xs">
                vibechecc management
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={cn(isCollapsed && 'sr-only')}>
            navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPath === item.href ||
                  (item.href !== '/admin' && currentPath.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={isCollapsed ? item.title : undefined}
                      isActive={isActive}
                    >
                      <Link to={item.href}>
                        <Icon className="size-4" />
                        {!isCollapsed && (
                          <>
                            <span>{item.title}</span>
                            {isActive && (
                              <ChevronRight className="ml-auto size-4" />
                            )}
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={isCollapsed ? 'back to vibechecc' : undefined}
            >
              <Link to="/">
                <Home className="size-4" />
                {!isCollapsed && <span>back to vibechecc</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

/**
 * Main layout wrapper for admin pages
 * Includes collapsible sidebar navigation and content area
 * Automatically wraps content with AdminGuard for access control
 */
export function AdminLayout({
  children,
  className,
  contentClassName,
  title,
  description,
}: AdminLayoutProps) {
  return (
    <AdminGuard>
      <SidebarProvider defaultOpen={true}>
        <div className={cn('flex h-screen w-full overflow-hidden', className)}>
          <Sidebar>
            <AdminSidebarContent />
          </Sidebar>

          <SidebarInset className="flex h-screen flex-col overflow-hidden">
            {/* Header with Sidebar Trigger */}
            <header className="bg-background flex h-14 flex-shrink-0 items-center gap-4 border-b px-6">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                {title && (
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold lowercase">{title}</h1>
                    {description && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <p className="text-muted-foreground text-sm lowercase">
                          {description}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </header>

            {/* Main Content */}
            <main
              className={cn(
                'min-h-0 flex-1 overflow-x-hidden overflow-y-auto',
                contentClassName
              )}
            >
              <div className="h-full p-6">
                <div className="mx-auto h-full max-w-7xl">{children}</div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
}

/**
 * Simplified admin layout for pages that don't need the sidebar
 * Still includes AdminGuard for access control
 */
export function AdminSimpleLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AdminGuard>
      <div className={cn('bg-background min-h-screen', className)}>
        {children}
      </div>
    </AdminGuard>
  );
}
