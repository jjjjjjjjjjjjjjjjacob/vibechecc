/**
 * validates rendering of individual notification items
 * covers different notification types and link behaviors
 */
/// <reference lib="dom" />
// vitest utilities for structuring tests and mocks
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationItem } from './notification-item';
import type { Notification } from '@viberatr/types';
import { formatDistanceToNow } from 'date-fns';

// Mock the queries
vi.mock('@/queries', () => ({
  useMarkNotificationAsReadMutation: vi.fn(),
}));

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    Link: ({ to, children, onClick }: any) => (
      <a href={to} onClick={onClick}>
        {children}
      </a>
    ),
  };
});

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  ),
  AvatarFallback: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  ),
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} role="img" />,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Heart: () => <svg data-testid="heart-icon" />,
  MessageCircle: () => <svg data-testid="message-icon" />,
  UserPlus: () => <svg data-testid="user-plus-icon" />,
  Star: () => <svg data-testid="star-icon" />,
}));

describe('NotificationItem', () => {
  let queryClient: QueryClient;
  let mockUseMarkNotificationAsReadMutation: any;

  const baseNotification: Notification = {
    _id: 'notif1',
    userId: 'user1',
    triggerUserId: 'user2',
    targetId: 'target1',
    title: 'Test notification',
    description: 'Test description',
    read: false,
    createdAt: Date.now() - 3600000, // 1 hour ago
    _creationTime: Date.now() - 3600000,
    triggerUser: {
      _id: 'user2',
      externalId: 'user2',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      image_url: 'https://example.com/avatar.jpg',
    },
  };

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();

    const { useMarkNotificationAsReadMutation } =
      await vi.importMock('@/queries');
    mockUseMarkNotificationAsReadMutation = useMarkNotificationAsReadMutation;
    mockUseMarkNotificationAsReadMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  describe('Follow notifications', () => {
    it('renders follow notification correctly', () => {
      const followNotification: Notification = {
        ...baseNotification,
        type: 'follow',
        title: 'Test followed you',
      };

      renderWithProviders(
        <NotificationItem notification={followNotification} />
      );

      expect(
        screen.getByText('Test started following you')
      ).toBeInTheDocument();
      expect(screen.getByText('see profile')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('generates correct profile link for follow notification', () => {
      const followNotification: Notification = {
        ...baseNotification,
        type: 'follow',
        triggerUser: {
          ...baseNotification.triggerUser!,
          username: 'johndoe',
        },
      };

      renderWithProviders(
        <NotificationItem notification={followNotification} />
      );

      const profileLink = screen.getByText('see profile').closest('a');
      expect(profileLink).toHaveAttribute('href', '/users/johndoe');
    });

    it('falls back to user ID when username is missing', () => {
      const followNotification: Notification = {
        ...baseNotification,
        type: 'follow',
        triggerUser: {
          ...baseNotification.triggerUser!,
          username: undefined,
          _id: 'user123',
        },
      };

      renderWithProviders(
        <NotificationItem notification={followNotification} />
      );

      const profileLink = screen.getByText('see profile').closest('a');
      expect(profileLink).toHaveAttribute('href', '/users/user123');
    });
  });

  describe('Rating notifications', () => {
    it('renders rating notification with emoji', () => {
      const ratingNotification: Notification = {
        ...baseNotification,
        type: 'rating',
        title: 'Test rated your vibe with 😍',
        metadata: {
          emoji: '😍',
          ratingValue: 5,
          vibeTitle: 'My Amazing Vibe',
        },
      };

      renderWithProviders(
        <NotificationItem notification={ratingNotification} />
      );

      expect(screen.getByText('Test reacted to your vibe')).toBeInTheDocument();
      expect(screen.getByText('see rating')).toBeInTheDocument();
      expect(screen.getByText('😍')).toBeInTheDocument();
    });

    it('renders rating notification without emoji', () => {
      const ratingNotification: Notification = {
        ...baseNotification,
        type: 'rating',
        title: 'Test rated your vibe',
        metadata: {
          ratingValue: 4,
          vibeTitle: 'My Vibe',
        },
      };

      renderWithProviders(
        <NotificationItem notification={ratingNotification} />
      );

      expect(screen.getByText('Test liked your vibe')).toBeInTheDocument();
      expect(screen.getByText('see rating')).toBeInTheDocument();
      // Should show heart icon instead of emoji
      expect(screen.queryByText('😍')).not.toBeInTheDocument();
    });

    it('generates correct vibe link for rating notification', () => {
      const ratingNotification: Notification = {
        ...baseNotification,
        type: 'rating',
        targetId: 'vibe123',
      };

      renderWithProviders(
        <NotificationItem notification={ratingNotification} />
      );

      const vibeLink = screen.getByText('see rating').closest('a');
      expect(vibeLink).toHaveAttribute('href', '/ratings/vibe123');
    });
  });

  describe('New rating notifications', () => {
    it('renders new rating notification correctly', () => {
      const newRatingNotification: Notification = {
        ...baseNotification,
        type: 'new_rating',
        title: 'Test left a comment',
      };

      renderWithProviders(
        <NotificationItem notification={newRatingNotification} />
      );

      expect(
        screen.getByText('Test left a comment on your vibe')
      ).toBeInTheDocument();
      expect(screen.getByText('see comment')).toBeInTheDocument();
    });
  });

  describe('New vibe notifications', () => {
    it('renders new vibe notification correctly', () => {
      const newVibeNotification: Notification = {
        ...baseNotification,
        type: 'new_vibe',
        title: 'Test shared a new vibe',
      };

      renderWithProviders(
        <NotificationItem notification={newVibeNotification} />
      );

      expect(screen.getByText("Test shared 'a vibe'")).toBeInTheDocument();
      expect(screen.getByText('see vibe')).toBeInTheDocument();
    });
  });

  describe('User avatar and display', () => {
    it('displays user avatar correctly', () => {
      renderWithProviders(<NotificationItem notification={baseNotification} />);

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(avatar).toHaveAttribute('alt', 'Test');
    });

    it('shows initials when no avatar image', () => {
      const notificationWithoutImage: Notification = {
        ...baseNotification,
        triggerUser: {
          ...baseNotification.triggerUser!,
          image_url: undefined,
          first_name: 'John',
        },
      };

      renderWithProviders(
        <NotificationItem notification={notificationWithoutImage} />
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('uses username initial when no first name', () => {
      const notificationWithUsernameOnly: Notification = {
        ...baseNotification,
        triggerUser: {
          ...baseNotification.triggerUser!,
          first_name: undefined,
          username: 'johndoe',
        },
      };

      renderWithProviders(
        <NotificationItem notification={notificationWithUsernameOnly} />
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('falls back to question mark when no name info', () => {
      const notificationWithoutNames: Notification = {
        ...baseNotification,
        triggerUser: {
          ...baseNotification.triggerUser!,
          first_name: undefined,
          username: undefined,
        },
      };

      renderWithProviders(
        <NotificationItem notification={notificationWithoutNames} />
      );

      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('Read/unread state', () => {
    it('shows unread indicator for unread notifications', () => {
      const unreadNotification: Notification = {
        ...baseNotification,
        read: false,
      };

      renderWithProviders(
        <NotificationItem notification={unreadNotification} />
      );

      // Should have the unread indicator (blue dot)
      const unreadIndicator = document.querySelector('.bg-theme-primary');
      expect(unreadIndicator).toBeInTheDocument();
    });

    it('does not show unread indicator for read notifications', () => {
      const readNotification: Notification = {
        ...baseNotification,
        read: true,
      };

      renderWithProviders(<NotificationItem notification={readNotification} />);

      // Should not have the unread indicator
      const unreadIndicator = document.querySelector('.bg-theme-primary');
      expect(unreadIndicator).not.toBeInTheDocument();
    });

    it('applies different background for unread notifications', () => {
      const unreadNotification: Notification = {
        ...baseNotification,
        read: false,
      };

      const { container } = renderWithProviders(
        <NotificationItem notification={unreadNotification} />
      );

      const notificationElement = container.querySelector(
        'div[class*="bg-muted/20"]'
      );
      expect(notificationElement).toBeInTheDocument();
    });

    it('does not apply unread background for read notifications', () => {
      const readNotification: Notification = {
        ...baseNotification,
        read: true,
      };

      const { container } = renderWithProviders(
        <NotificationItem notification={readNotification} />
      );

      const notificationElement = container.querySelector(
        'div[class*="bg-muted/20"]'
      );
      expect(notificationElement).not.toBeInTheDocument();
    });
  });

  describe('Mark as read functionality', () => {
    it('marks unread notification as read when action is clicked', () => {
      const mockMutate = vi.fn();
      mockUseMarkNotificationAsReadMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      const unreadNotification: Notification = {
        ...baseNotification,
        _id: 'notif123',
        read: false,
        type: 'follow',
      };

      renderWithProviders(
        <NotificationItem notification={unreadNotification} />
      );

      const actionButton = screen.getByText('see profile');
      fireEvent.click(actionButton);

      expect(mockMutate).toHaveBeenCalledWith({
        notificationId: 'notif123',
      });
    });

    it('does not mark read notification as read again', () => {
      const mockMutate = vi.fn();
      mockUseMarkNotificationAsReadMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      const readNotification: Notification = {
        ...baseNotification,
        read: true,
        type: 'follow',
      };

      renderWithProviders(<NotificationItem notification={readNotification} />);

      const actionButton = screen.getByText('see profile');
      fireEvent.click(actionButton);

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('does not mark as read when notification has no ID', () => {
      const mockMutate = vi.fn();
      mockUseMarkNotificationAsReadMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      const notificationWithoutId: Notification = {
        ...baseNotification,
        _id: undefined,
        read: false,
        type: 'follow',
      };

      renderWithProviders(
        <NotificationItem notification={notificationWithoutId} />
      );

      const actionButton = screen.getByText('see profile');
      fireEvent.click(actionButton);

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('Time formatting', () => {
    it('displays formatted time correctly', () => {
      (formatDistanceToNow as any).mockReturnValue('3 minutes ago');

      renderWithProviders(<NotificationItem notification={baseNotification} />);

      expect(screen.getByText('3 minutes ago')).toBeInTheDocument();
      expect(formatDistanceToNow).toHaveBeenCalledWith(
        new Date(baseNotification._creationTime!),
        { addSuffix: true }
      );
    });
  });

  describe('Unknown notification types', () => {
    it('handles unknown notification type gracefully', () => {
      const unknownNotification: Notification = {
        ...baseNotification,
        type: 'unknown' as any,
        description: 'Something happened',
      };

      renderWithProviders(
        <NotificationItem notification={unknownNotification} />
      );

      expect(screen.getByText('Something happened')).toBeInTheDocument();
      expect(screen.getByText('view')).toBeInTheDocument();
    });

    it('provides fallback text for unknown type without description', () => {
      const unknownNotification: Notification = {
        ...baseNotification,
        type: 'unknown' as any,
        description: undefined,
      };

      renderWithProviders(
        <NotificationItem notification={unknownNotification} />
      );

      expect(
        screen.getByText('you have a new notification')
      ).toBeInTheDocument();
    });
  });

  describe('User name handling', () => {
    it('prefers first_name over username', () => {
      const notification: Notification = {
        ...baseNotification,
        type: 'follow',
        triggerUser: {
          ...baseNotification.triggerUser!,
          first_name: 'Johnny',
          username: 'john123',
        },
      };

      renderWithProviders(<NotificationItem notification={notification} />);

      expect(
        screen.getByText('Johnny started following you')
      ).toBeInTheDocument();
    });

    it('uses username when no first_name', () => {
      const notification: Notification = {
        ...baseNotification,
        type: 'follow',
        triggerUser: {
          ...baseNotification.triggerUser!,
          first_name: undefined,
          username: 'john123',
        },
      };

      renderWithProviders(<NotificationItem notification={notification} />);

      expect(
        screen.getByText('john123 started following you')
      ).toBeInTheDocument();
    });

    it('falls back to "someone" when no name available', () => {
      const notification: Notification = {
        ...baseNotification,
        type: 'follow',
        triggerUser: {
          ...baseNotification.triggerUser!,
          first_name: undefined,
          username: undefined,
        },
      };

      renderWithProviders(<NotificationItem notification={notification} />);

      expect(
        screen.getByText('someone started following you')
      ).toBeInTheDocument();
    });

    it('handles missing trigger user', () => {
      const notification: Notification = {
        ...baseNotification,
        type: 'follow',
        triggerUser: undefined,
      };

      renderWithProviders(<NotificationItem notification={notification} />);

      expect(
        screen.getByText('someone started following you')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button role for action', () => {
      renderWithProviders(
        <NotificationItem
          notification={{ ...baseNotification, type: 'follow' }}
        />
      );

      const actionLink = screen.getByText('see profile').closest('a');
      expect(actionLink).toBeInTheDocument();
    });

    it('has proper alt text for avatar image', () => {
      renderWithProviders(<NotificationItem notification={baseNotification} />);

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('alt', 'Test');
    });

    it('uses proper alt text fallback', () => {
      const notificationWithoutName: Notification = {
        ...baseNotification,
        triggerUser: {
          ...baseNotification.triggerUser!,
          first_name: undefined,
          username: 'testuser',
        },
      };

      renderWithProviders(
        <NotificationItem notification={notificationWithoutName} />
      );

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('alt', 'testuser');
    });

    it('handles missing user data for alt text', () => {
      const notificationWithoutUser: Notification = {
        ...baseNotification,
        triggerUser: {
          ...baseNotification.triggerUser!,
          first_name: undefined,
          username: undefined,
        },
      };

      renderWithProviders(
        <NotificationItem notification={notificationWithoutUser} />
      );

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('alt', 'User');
    });
  });
});
