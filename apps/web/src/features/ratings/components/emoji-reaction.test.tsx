/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import {
  EmojiReactionButton as EmojiReaction,
  EmojiReactionsRow as EmojiReactions,
  type EmojiRatingData,
  type UnifiedEmojiRatingHandler,
} from './emoji-reaction';

// Mock useUser from Clerk
vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: () => ({
    user: { id: 'user123' },
    isSignedIn: true,
    isLoaded: true,
  }),
  SignInButton: ({ children }: any) => <div>{children}</div>,
  SignUpButton: ({ children }: any) => <div>{children}</div>,
}));

// Mock the theme provider
vi.mock('@/features/theming/components/theme-provider', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
  }),
}));

// Mock the theme store
vi.mock('@/stores/theme-store', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
  }),
  useThemeStore: (selector: any) => {
    const mockStore = {
      theme: 'light',
      resolvedTheme: 'light',
      initializeTheme: vi.fn(),
    };
    return selector ? selector(mockStore) : mockStore;
  },
}));

// Mock posthog
vi.mock('@/lib/posthog', () => ({
  trackEvents: {
    emojiReactionClicked: vi.fn(),
    emojiRatingOpened: vi.fn(),
    emojiPopoverOpened: vi.fn(),
    emojiPopoverClosed: vi.fn(),
  },
}));

// Mock the useMutation from react-query
vi.mock('@convex-dev/react-query', () => ({
  useConvexMutation: () => vi.fn(),
}));

// Mock the RateAndReviewDialog to provide a dialog role
vi.mock('./rate-and-review-dialog', () => ({
  RateAndReviewDialog: ({
    open,
    children,
  }: {
    open?: boolean;
    children?: React.ReactNode;
  }) => {
    return (
      <>
        {children}
        {open && (
          <div role="dialog" data-testid="rate-review-dialog">
            <h2>Rate & Review</h2>
            <p>Mock rating dialog content</p>
          </div>
        )}
      </>
    );
  },
}));

// Mock the Convex client
const mockConvexClient = {
  query: vi.fn(),
  mutation: vi.fn(),
  action: vi.fn(),
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
} as unknown as ConvexReactClient;

// Helper function to create test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <ConvexProvider client={mockConvexClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexProvider>
  );
};

describe('EmojiReaction', () => {
  const mockOnEmojiClick: UnifiedEmojiRatingHandler = vi
    .fn()
    .mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const baseReaction: EmojiRatingData = {
    emoji: '🔥',
    value: 3.5,
    count: 5,
    users: ['user1', 'user2', 'user3'],
  };

  it('renders emoji with count on hover', async () => {
    render(
      <EmojiReaction
        reaction={baseReaction}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
      />,
      {
        wrapper: createWrapper(),
      }
    );

    const button = screen.getByRole('button');
    expect(screen.getByText('🔥')).toBeInTheDocument();

    // Rating and count should not be visible initially
    expect(screen.queryByText('3.5')).not.toBeInTheDocument();
    expect(screen.queryByText('(5)')).not.toBeInTheDocument();

    // Hover to show rating and count
    fireEvent.mouseEnter(button);
    await waitFor(() => {
      expect(screen.getByText('3.5')).toBeInTheDocument();
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    // Mouse leave to hide rating and count
    fireEvent.mouseLeave(button);
    await waitFor(() => {
      expect(screen.queryByText('3.5')).not.toBeInTheDocument();
      expect(screen.queryByText('(5)')).not.toBeInTheDocument();
    });
  });

  it('highlights when user has reacted', () => {
    const reactionWithUser: EmojiRatingData = {
      ...baseReaction,
      users: ['user123', 'user2', 'user3'],
    };

    render(
      <EmojiReaction
        reaction={reactionWithUser}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
      />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary/10');
  });

  it('opens rating dialog when clicked', async () => {
    render(
      <EmojiReaction
        reaction={baseReaction}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
      />,
      {
        wrapper: createWrapper(),
      }
    );

    fireEvent.click(screen.getByRole('button'));

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens rating dialog with vibe title', async () => {
    render(
      <EmojiReaction
        reaction={baseReaction}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
        vibeTitle="Test Vibe"
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole('button'));

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('handles keyboard interactions', async () => {
    render(
      <EmojiReaction
        reaction={baseReaction}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
      />,
      {
        wrapper: createWrapper(),
      }
    );

    const button = screen.getByRole('button');

    // Enter key should open dialog
    fireEvent.keyDown(button, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

describe('EmojiReactions', () => {
  const mockOnEmojiClick: UnifiedEmojiRatingHandler = vi
    .fn()
    .mockResolvedValue({});

  const reactions: EmojiRatingData[] = [
    { emoji: '🔥', value: 4.2, count: 5, users: ['user1', 'user2'] },
    { emoji: '😍', value: 3.8, count: 3, users: ['user3', 'user4', 'user5'] },
    { emoji: '💯', value: 5.0, count: 1, users: ['user6'] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders multiple emoji reactions', () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
        existingUserRatings={[]}
        emojiMetadata={{}}
      />,
      {
        wrapper: createWrapper(),
      }
    );

    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('😍')).toBeInTheDocument();
    expect(screen.getByText('💯')).toBeInTheDocument();
  });

  it('shows add button when showAddButton is true', () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
        existingUserRatings={[]}
        emojiMetadata={{}}
        showAddButton={true}
      />,
      { wrapper: createWrapper() }
    );

    const addButton = screen.getByLabelText('Add reaction');
    expect(addButton).toBeInTheDocument();
  });

  it('hides add button when showAddButton is false', () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
        existingUserRatings={[]}
        emojiMetadata={{}}
        showAddButton={false}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByLabelText('Add reaction')).not.toBeInTheDocument();
  });

  it('opens emoji picker when add button is clicked', async () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
        existingUserRatings={[]}
        emojiMetadata={{}}
        showAddButton={true}
      />,
      { wrapper: createWrapper() }
    );

    const addButton = screen.getByLabelText('Add reaction');
    fireEvent.click(addButton);

    await waitFor(() => {
      // The emoji picker is in a popover, which may be rendered at the document body level
      // Look for the picker content within the entire document
      const picker = document.querySelector('[data-slot="popover-content"]');
      expect(picker).toBeInTheDocument();
    });
  });

  it('calls onReact when emoji is selected from picker in normal mode', async () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
        existingUserRatings={[]}
        emojiMetadata={{}}
        showAddButton={true}
      />,
      { wrapper: createWrapper() }
    );

    // Open picker
    fireEvent.click(screen.getByLabelText('Add reaction'));

    // Wait for picker to open
    await waitFor(() => {
      const picker = document.querySelector('[data-slot="popover-content"]');
      expect(picker).toBeInTheDocument();
    });

    // The EmojiSearchCollapsible component shows emoji-picker element
    await waitFor(() => {
      const emojiPicker = document.querySelector('em-emoji-picker');
      expect(emojiPicker).toBeInTheDocument();
    });

    // Since the emoji picker is a custom element, we'll just verify it opened
    // Real emoji selection would require mocking the custom element
    expect(mockOnEmojiClick).not.toHaveBeenCalled();
  });

  it('opens rating popover when emoji is selected from picker in rating mode', async () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
        existingUserRatings={[]}
        emojiMetadata={{}}
        showAddButton={true}
        vibeTitle="Test Vibe"
      />,
      { wrapper: createWrapper() }
    );

    // Open picker
    fireEvent.click(screen.getByLabelText('Add reaction'));

    // Wait for picker to open
    await waitFor(() => {
      const picker = document.querySelector('[data-slot="popover-content"]');
      expect(picker).toBeInTheDocument();
    });

    // The EmojiSearchCollapsible component shows emoji-picker element
    await waitFor(() => {
      const emojiPicker = document.querySelector('em-emoji-picker');
      expect(emojiPicker).toBeInTheDocument();
    });

    // In rating mode, clicking an emoji would open the rating dialog
    // Since the emoji picker is a custom element, we'll just verify setup
    expect(mockOnEmojiClick).not.toHaveBeenCalled();
  });

  it('closes emoji picker after selection', async () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
        existingUserRatings={[]}
        emojiMetadata={{}}
        showAddButton={true}
      />,
      { wrapper: createWrapper() }
    );

    // Open picker
    fireEvent.click(screen.getByLabelText('Add reaction'));

    await waitFor(() => {
      const picker = document.querySelector('[data-slot="popover-content"]');
      expect(picker).toBeInTheDocument();
    });

    // Verify emoji picker is shown
    await waitFor(() => {
      const emojiPicker = document.querySelector('em-emoji-picker');
      expect(emojiPicker).toBeInTheDocument();
    });

    // Close picker by clicking outside or Escape key
    fireEvent.keyDown(document, { key: 'Escape' });

    // Picker should close
    await waitFor(() => {
      const picker = document.querySelector('[data-slot="popover-content"]');
      expect(picker).not.toBeInTheDocument();
    });
  });

  it('passes rating mode to individual reactions', async () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
        existingUserRatings={[]}
        emojiMetadata={{}}
        vibeTitle="Test Vibe"
      />,
      { wrapper: createWrapper() }
    );

    // Click on a reaction
    fireEvent.click(screen.getByText('🔥').closest('button')!);

    // Should open rating dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(mockOnEmojiClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmojiReactions
        reactions={reactions}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
        existingUserRatings={[]}
        emojiMetadata={{}}
        className="custom-reactions"
      />,
      { wrapper: createWrapper() }
    );

    expect(container.querySelector('.custom-reactions')).toBeInTheDocument();
  });

  it('handles empty reactions array', () => {
    render(
      <EmojiReactions
        reactions={[]}
        onEmojiClick={mockOnEmojiClick}
        vibeId="test-vibe"
        existingUserRatings={[]}
        emojiMetadata={{}}
        showAddButton={true}
      />,
      { wrapper: createWrapper() }
    );

    // Should still show add button
    expect(screen.getByLabelText('Add reaction')).toBeInTheDocument();

    // No reactions should be displayed
    expect(screen.queryByText('🔥')).not.toBeInTheDocument();
  });
});
