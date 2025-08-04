/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationDropdown } from './notification-dropdown';
import type { Notification } from '@viberatr/types';

// Mock the hooks
vi.mock('@/queries', () => ({
  useNotificationsInfinite: vi.fn(),
  useUnreadNotificationCountByType: vi.fn(),
  useMarkAllNotificationsAsReadMutation: vi.fn(),
}));

// Mock intersection observer
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
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
  let mockUseNotificationsInfinite: any;
  let mockUseUnreadNotificationCountByType: any;
  let mockUseMarkAllNotificationsAsReadMutation: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Setup default mock returns
    const { useNotificationsInfinite, useUnreadNotificationCountByType, useMarkAllNotificationsAsReadMutation } = 
      require('@/queries');

    mockUseNotificationsInfinite = useNotificationsInfinite;
    mockUseUnreadNotificationCountByType = useUnreadNotificationCountByType;
    mockUseMarkAllNotificationsAsReadMutation = useMarkAllNotificationsAsReadMutation;

    mockUseNotificationsInfinite.mockReturnValue({
      data: {
        pages: [{ notifications: mockNotifications, nextCursor: null }],
      },
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    mockUseUnreadNotificationCountByType.mockReturnValue({
      data: {
        follow: 1,
        rating: 0,
        new_rating: 1,
        new_vibe: 0,
        total: 2,
      },
    });

    mockUseMarkAllNotificationsAsReadMutation.mockReturnValue({
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
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
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
    mockUseNotificationsInfinite.mockReturnValue({
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
    mockUseNotificationsInfinite.mockReturnValue({
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

    // Check that notification items are rendered
    expect(screen.getByText('John started following you')).toBeInTheDocument();
    expect(screen.getByText('Jane reacted to your vibe')).toBeInTheDocument();
  });

  it('handles mark all as read', async () => {
    const mockMutate = vi.fn();
    mockUseMarkAllNotificationsAsReadMutation.mockReturnValue({
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
    mockUseUnreadNotificationCountByType.mockReturnValue({
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
    mockUseNotificationsInfinite.mockReturnValue({
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
    mockUseNotificationsInfinite.mockReturnValue({
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
    mockUseNotificationsInfinite.mockReturnValue({
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

    expect(mockUseNotificationsInfinite).toHaveBeenCalledWith(
      undefined,
      { enabled: false }
    );

    // Reset and test when open
    vi.clearAllMocks();
    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(mockUseNotificationsInfinite).toHaveBeenCalledWith(
      undefined,
      { enabled: true }
    );
  });

  it('saves and loads filter preference from localStorage', () => {
    // Mock localStorage to return a saved filter
    localStorageMock.getItem.mockReturnValue('followers');

    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith('viberatr-notification-filter');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('viberatr-notification-filter', 'followers');
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

    // The component should render drawer content
    expect(screen.getByText('notifications')).toBeInTheDocument();
  });

  it('handles window resize events for mobile detection', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('filters notifications by type correctly', () => {
    renderWithQueryClient(
      <NotificationDropdown open={true} onOpenChange={vi.fn()}>
        <button>Notifications</button>
      </NotificationDropdown>
    );

    // Initially should show all notifications
    expect(mockUseNotificationsInfinite).toHaveBeenCalledWith(
      undefined, // 'all' maps to undefined
      { enabled: true }
    );
  });

  it('handles undefined unread counts gracefully', () => {
    mockUseUnreadNotificationCountByType.mockReturnValue({
      data: undefined,
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

    mockUseNotificationsInfinite.mockReturnValue({
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
    mockUseNotificationsInfinite.mockReturnValue({
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

    mockUseUnreadNotificationCountByType.mockReturnValue({
      data: unreadCounts,
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