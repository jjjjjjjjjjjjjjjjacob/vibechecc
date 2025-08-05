/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationDropdown } from './notification-dropdown';
import type { Notification } from '@viberatr/types';

// Mock the hooks
vi.mock('@/queries', () => ({
  useNotificationsInfinite: vi.fn(),
  useUnreadNotificationCountByType: vi.fn(),
  useMarkAllNotificationsAsReadMutation: vi.fn(),
  useMarkNotificationAsReadMutation: vi.fn(),
}));

// Mock Convex
vi.mock('convex/react', () => ({
  useConvex: vi.fn(() => ({
    query: vi.fn(),
    mutation: vi.fn(),
  })),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="convex-provider">{children}</div>
  ),
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  Link: vi.fn(({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  )),
}));

// Mock intersection observer
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock window.innerWidth for mobile detection
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock react-intersection-observer
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: vi.fn(), inView: false }),
}));

// Mock UI components to always show content when open
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover">{children}</div>
  ),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drawer">{children}</div>
  ),
  DrawerTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drawer-trigger">{children}</div>
  ),
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drawer-content">{children}</div>
  ),
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-area">{children}</div>
  ),
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({
    children,
  }: {
    open?: boolean;
    children: React.ReactNode;
  }) => {
    // Always render all children directly to make content available to tests
    return <div data-testid="dropdown-menu">{children}</div>;
  },
  DropdownMenuTrigger: ({ children, ...props }: any) => (
    <div data-testid="dropdown-trigger" {...props}>
      {children}
    </div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader">⌛</span>,
  Grid3X3: () => <span data-testid="grid-icon">⚏</span>,
  Heart: () => <span data-testid="heart-icon">❤️</span>,
  MessageCircle: () => <span data-testid="message-icon">💬</span>,
  UserPlus: () => <span data-testid="user-plus-icon">👤+</span>,
  Star: () => <span data-testid="star-icon">⭐</span>,
  Bell: () => <span data-testid="bell-icon">🔔</span>,
  Sparkles: () => <span data-testid="sparkles-icon">✨</span>,
}));

const mockNotifications: Notification[] = [
  {
    _id: 'notif1',
    userId: 'user1',
    type: 'follow',
    triggerUserId: 'user2',
    targetId: 'user2',
    title: 'John followed you',
    description: 'check out their profile',
    read: false,
    createdAt: Date.now() - 3600000, // 1 hour ago
    _creationTime: Date.now() - 3600000,
    triggerUser: {
      _id: 'user2',
      externalId: 'user2',
      username: 'john',
      first_name: 'John',
      image_url: 'https://example.com/john.jpg',
    },
  },
  {
    _id: 'notif2',
    userId: 'user1',
    type: 'rating',
    triggerUserId: 'user3',
    targetId: 'vibe1',
    title: 'Jane rated your vibe with 😍',
    description: 'see what they thought',
    read: true,
    createdAt: Date.now() - 7200000, // 2 hours ago
    _creationTime: Date.now() - 7200000,
    metadata: {
      vibeTitle: 'My Amazing Vibe',
      emoji: '😍',
      ratingValue: 5,
    },
    triggerUser: {
      _id: 'user3',
      externalId: 'user3',
      username: 'jane',
      first_name: 'Jane',
      image_url: 'https://example.com/jane.jpg',
    },
  },
];

describe('NotificationDropdown', () => {
  let queryClient: QueryClient;
  let useNotificationsInfinite: any;
  let useUnreadNotificationCountByType: any;
  let useMarkAllNotificationsAsReadMutation: any;
  let useMarkNotificationAsReadMutation: any;

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Reset window width to desktop for all tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock useConvex to return a valid object for all tests by default
    const { useConvex } = await vi.importMock('convex/react');
    useConvex.mockReturnValue({
      query: vi.fn(),
      mutation: vi.fn(),
    });

    // Setup default mock returns
    ({
      useNotificationsInfinite,
      useUnreadNotificationCountByType,
      useMarkAllNotificationsAsReadMutation,
      useMarkNotificationAsReadMutation,
    } = await vi.importMock('@/queries'));

    useNotificationsInfinite.mockReturnValue({
      data: {
        pages: [{ notifications: mockNotifications, nextCursor: null }],
      },
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    useUnreadNotificationCountByType.mockReturnValue({
      data: {
        follow: 1,
        rating: 0,
        new_rating: 1,
        new_vibe: 0,
        total: 2,
      },
    });

    useMarkAllNotificationsAsReadMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    useMarkNotificationAsReadMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it('renders notification dropdown with trigger', () => {
    renderWithQueryClient(
      <NotificationDropdown open={false} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('displays notifications when open', () => {
    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(screen.getByText('notifications')).toBeInTheDocument();
    expect(screen.getByText('mark all read')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useNotificationsInfinite.mockReturnValue({
      data: null,
      isLoading: true,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(screen.getByText('loading notifications...')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    useNotificationsInfinite.mockReturnValue({
      data: {
        pages: [{ notifications: [], nextCursor: null }],
      },
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    // The empty state component should be rendered
    expect(screen.getByText('notifications')).toBeInTheDocument();
  });

  it('renders notification items correctly', () => {
    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    // Check that notification items are rendered (text is split across spans)
    expect(screen.getByText('John started following you')).toBeInTheDocument();
    expect(screen.getByText('Jane reacted to your vibe')).toBeInTheDocument();
    // Both notifications should be rendered
    expect(
      screen.getAllByText(
        /John started following you|Jane reacted to your vibe/
      )
    ).toHaveLength(2);
  });

  it('handles mark all as read', async () => {
    const mockMutate = vi.fn();
    useMarkAllNotificationsAsReadMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    });

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    const markAllButton = screen.getByText('mark all read');
    fireEvent.click(markAllButton);

    expect(mockMutate).toHaveBeenCalledWith({});
  });

  it('disables mark all read when no unread notifications', () => {
    useUnreadNotificationCountByType.mockReturnValue({
      data: {
        follow: 0,
        rating: 0,
        new_rating: 0,
        new_vibe: 0,
        total: 0,
      },
    });

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    const markAllButton = screen.getByText('mark all read');
    expect(markAllButton).toBeDisabled();
  });

  it('shows load more button when has next page', () => {
    useNotificationsInfinite.mockReturnValue({
      data: {
        pages: [{ notifications: mockNotifications, nextCursor: 'cursor1' }],
      },
      isLoading: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(screen.getByText('load more')).toBeInTheDocument();
  });

  it('shows loading more state when fetching next page', () => {
    useNotificationsInfinite.mockReturnValue({
      data: {
        pages: [{ notifications: mockNotifications, nextCursor: 'cursor1' }],
      },
      isLoading: false,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: vi.fn(),
    });

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(screen.getByText('loading more...')).toBeInTheDocument();
  });

  it('handles load more button click', async () => {
    const mockFetchNextPage = vi.fn();
    useNotificationsInfinite.mockReturnValue({
      data: {
        pages: [{ notifications: mockNotifications, nextCursor: 'cursor1' }],
      },
      isLoading: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    });

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    const loadMoreButton = screen.getByText('load more');
    fireEvent.click(loadMoreButton);

    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it('respects enabled prop based on open state', () => {
    // Test when closed
    renderWithQueryClient(
      <NotificationDropdown open={false} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(useNotificationsInfinite).toHaveBeenCalledWith(undefined, {
      enabled: false,
    });

    // Reset and test when open
    vi.clearAllMocks();
    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(useNotificationsInfinite).toHaveBeenCalledWith(undefined, {
      enabled: true,
    });
  });

  it('saves and loads filter preference from localStorage', () => {
    // Mock localStorage to return a saved filter
    localStorageMock.getItem.mockReturnValue('followers');

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      'viberatr-notification-filter'
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'viberatr-notification-filter',
      'followers'
    );
  });

  it('uses drawer on mobile devices', () => {
    // Mock mobile screen size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    // Create a new component instance to trigger the mobile check
    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    // On mobile, only the trigger should be rendered (no dropdown content)
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    // The dropdown content should NOT be rendered on mobile
    expect(screen.queryByText('notifications')).not.toBeInTheDocument();
  });

  it('handles window resize events for mobile detection', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  it('filters notifications by type correctly', () => {
    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    // Initially should show all notifications
    expect(useNotificationsInfinite).toHaveBeenCalledWith(
      undefined, // 'all' maps to undefined
      { enabled: true }
    );
  });

  it('handles undefined unread counts gracefully', () => {
    useUnreadNotificationCountByType.mockReturnValue({
      data: undefined,
    });

    // Ensure notifications are available for the component to render
    useNotificationsInfinite.mockReturnValue({
      data: {
        pages: [{ notifications: mockNotifications, nextCursor: null }],
      },
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    // Should not crash and should disable mark all read button
    const markAllButton = screen.getByText('mark all read');
    expect(markAllButton).toBeDisabled();
  });

  it('flattens notification pages correctly', () => {
    const page1Notifications = [mockNotifications[0]];
    const page2Notifications = [mockNotifications[1]];

    useNotificationsInfinite.mockReturnValue({
      data: {
        pages: [
          { notifications: page1Notifications, nextCursor: 'cursor1' },
          { notifications: page2Notifications, nextCursor: null },
        ],
      },
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    // Both notifications from different pages should be visible
    expect(screen.getByText('John started following you')).toBeInTheDocument();
    expect(screen.getByText('Jane reacted to your vibe')).toBeInTheDocument();
  });

  it('handles empty pages in notification data', () => {
    useNotificationsInfinite.mockReturnValue({
      data: {
        pages: [
          { notifications: [], nextCursor: null },
          null, // Simulate a null page
          { notifications: mockNotifications, nextCursor: null },
        ],
      },
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    // Should handle null pages gracefully and show available notifications
    expect(screen.getByText('John started following you')).toBeInTheDocument();
    expect(screen.getByText('Jane reacted to your vibe')).toBeInTheDocument();
  });

  it('calculates unread counts correctly', () => {
    const unreadCounts = {
      follow: 2,
      rating: 1,
      new_rating: 3,
      new_vibe: 0,
      total: 6,
    };

    useUnreadNotificationCountByType.mockReturnValue({
      data: unreadCounts,
    });

    // Ensure notifications are available for the component to render
    useNotificationsInfinite.mockReturnValue({
      data: {
        pages: [{ notifications: mockNotifications, nextCursor: null }],
      },
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    // The component should calculate total from individual counts
    // total = follow + rating + new_rating + new_vibe = 2 + 1 + 3 + 0 = 6
    const markAllButton = screen.getByText('mark all read');
    expect(markAllButton).not.toBeDisabled();
  });
});
