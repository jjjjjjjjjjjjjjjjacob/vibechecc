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
import { ClerkProvider } from '@clerk/tanstack-react-start';
import { EmojiReaction, EmojiReactions } from './emoji-reaction';
import type { EmojiReaction as EmojiReactionType } from '../types';

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
    <ClerkProvider publishableKey="test-key">
      <ConvexProvider client={mockConvexClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ConvexProvider>
    </ClerkProvider>
  );
};

describe('EmojiReaction', () => {
  const mockOnReact = vi.fn();
  const mockOnRatingSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const baseReaction: EmojiReactionType = {
    emoji: '🔥',
    count: 5,
    users: ['user1', 'user2', 'user3'],
  };

  it('renders emoji with count on hover', async () => {
    render(<EmojiReaction reaction={baseReaction} onReact={mockOnReact} />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button');
    expect(screen.getByText('🔥')).toBeInTheDocument();

    // Count should not be visible initially
    expect(screen.queryByText('5')).not.toBeInTheDocument();

    // Hover to show count
    fireEvent.mouseEnter(button);
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    // Mouse leave to hide count
    fireEvent.mouseLeave(button);
    await waitFor(() => {
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });
  });

  it('highlights when user has reacted', () => {
    const reactionWithUser: EmojiReactionType = {
      ...baseReaction,
      users: ['user123', 'user2', 'user3'],
    };

    render(
      <EmojiReaction reaction={reactionWithUser} onReact={mockOnReact} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary/10');
  });

  it('calls onReact when clicked in normal mode', () => {
    render(<EmojiReaction reaction={baseReaction} onReact={mockOnReact} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole('button'));
    expect(mockOnReact).toHaveBeenCalledWith('🔥');
    expect(mockOnRatingSubmit).not.toHaveBeenCalled();
  });

  it('opens rating popover when clicked in rating mode', () => {
    render(
      <EmojiReaction
        reaction={baseReaction}
        onReact={mockOnReact}
        ratingMode={true}
        onRatingSubmit={mockOnRatingSubmit}
        vibeTitle="Test Vibe"
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole('button'));
    // The rating popover should open (we can check by looking for the dialog)
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mockOnReact).not.toHaveBeenCalled();
  });

  it('handles keyboard interactions', () => {
    render(<EmojiReaction reaction={baseReaction} onReact={mockOnReact} />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button');

    // Enter key
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(mockOnReact).toHaveBeenCalledWith('🔥');

    // Space key
    fireEvent.keyDown(button, { key: ' ' });
    expect(mockOnReact).toHaveBeenCalledTimes(2);

    // Other keys should not trigger
    fireEvent.keyDown(button, { key: 'a' });
    expect(mockOnReact).toHaveBeenCalledTimes(2);
  });
});

describe('EmojiReactions', () => {
  const mockOnReact = vi.fn();
  const mockOnRatingSubmit = vi.fn();

  const reactions: EmojiReactionType[] = [
    { emoji: '🔥', count: 5, users: ['user1', 'user2'] },
    { emoji: '😍', count: 3, users: ['user3', 'user4', 'user5'] },
    { emoji: '💯', count: 1, users: ['user6'] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders multiple emoji reactions', () => {
    render(<EmojiReactions reactions={reactions} onReact={mockOnReact} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('😍')).toBeInTheDocument();
    expect(screen.getByText('💯')).toBeInTheDocument();
  });

  it('shows add button when showAddButton is true', () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onReact={mockOnReact}
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
        onReact={mockOnReact}
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
        onReact={mockOnReact}
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
        onReact={mockOnReact}
        showAddButton={true}
        ratingMode={false}
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

    // The picker starts in horizontal mode - we need to click the chevron to get full picker
    const showFullPickerButton = screen.getByLabelText(
      'Show full emoji picker'
    );
    fireEvent.click(showFullPickerButton);

    // Wait for the full picker to load with emojis
    await waitFor(() => {
      const picker = document.querySelector('[data-slot="popover-content"]');
      const emojiButtons = picker?.querySelectorAll('[cmdk-item]');
      expect(emojiButtons?.length).toBeGreaterThan(0);
    });

    // Click the first emoji from the picker
    const picker = document.querySelector('[data-slot="popover-content"]');
    const firstEmojiButton = picker?.querySelector('[cmdk-item]');

    if (firstEmojiButton) {
      fireEvent.click(firstEmojiButton);

      // Get the emoji text from the clicked button
      const emojiText =
        firstEmojiButton.querySelector('.font-noto-color')?.textContent;
      expect(mockOnReact).toHaveBeenCalledWith(emojiText);
    } else {
      // If no emoji button found, fail the test
      expect(firstEmojiButton).toBeTruthy();
    }
  });

  it('opens rating popover when emoji is selected from picker in rating mode', async () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onReact={mockOnReact}
        showAddButton={true}
        ratingMode={true}
        onRatingSubmit={mockOnRatingSubmit}
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

    // The picker starts in horizontal mode - we need to click the chevron to get full picker
    const showFullPickerButton = screen.getByLabelText(
      'Show full emoji picker'
    );
    fireEvent.click(showFullPickerButton);

    // Wait for the full picker to load with emojis
    await waitFor(() => {
      const picker = document.querySelector('[data-slot="popover-content"]');
      const emojiButtons = picker?.querySelectorAll('[cmdk-item]');
      expect(emojiButtons?.length).toBeGreaterThan(0);
    });

    // Click the first emoji from the picker
    const picker = document.querySelector('[data-slot="popover-content"]');
    const firstEmojiButton = picker?.querySelector('[cmdk-item]');

    if (firstEmojiButton) {
      fireEvent.click(firstEmojiButton);

      // Should open rating popover instead of calling onReact
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      expect(mockOnReact).not.toHaveBeenCalled();
    } else {
      // If no emoji button found, fail the test
      expect(firstEmojiButton).toBeTruthy();
    }
  });

  it('closes emoji picker after selection', async () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onReact={mockOnReact}
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

    // Click the chevron to show full picker
    const showFullPickerButton = screen.getByLabelText(
      'Show full emoji picker'
    );
    fireEvent.click(showFullPickerButton);

    // Wait for emojis to load
    await waitFor(() => {
      const picker = document.querySelector('[data-slot="popover-content"]');
      const emojiButtons = picker?.querySelectorAll('[cmdk-item]');
      expect(emojiButtons?.length).toBeGreaterThan(0);
    });

    // Click an emoji
    const picker = document.querySelector('[data-slot="popover-content"]');
    const firstEmojiButton = picker?.querySelector('[cmdk-item]');

    if (firstEmojiButton) {
      fireEvent.click(firstEmojiButton);
    }

    // Picker should close
    await waitFor(() => {
      const picker = document.querySelector('[data-slot="popover-content"]');
      expect(picker).not.toBeInTheDocument();
    });
  });

  it('passes rating mode to individual reactions', () => {
    render(
      <EmojiReactions
        reactions={reactions}
        onReact={mockOnReact}
        ratingMode={true}
        onRatingSubmit={mockOnRatingSubmit}
        vibeTitle="Test Vibe"
      />,
      { wrapper: createWrapper() }
    );

    // Click on a reaction
    fireEvent.click(screen.getByText('🔥').closest('button')!);

    // Should open rating popover, not call onReact
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mockOnReact).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmojiReactions
        reactions={reactions}
        onReact={mockOnReact}
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
        onReact={mockOnReact}
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
