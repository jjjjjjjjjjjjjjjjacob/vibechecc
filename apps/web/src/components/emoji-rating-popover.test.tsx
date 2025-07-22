/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmojiRatingPopover } from './emoji-rating-popover';

// Mock the UI components
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div data-testid="popover-trigger">{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}));

vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CommandInput: ({ placeholder }: { placeholder?: string }) => (
    <input data-testid="command-input" placeholder={placeholder} />
  ),
  CommandEmpty: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="command-empty">{children}</div>
  ),
  CommandGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="command-group">{children}</div>
  ),
  CommandItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
  }) => (
    <button onClick={onSelect} data-testid="command-item">
      {children}
    </button>
  ),
}));

describe('EmojiRatingPopover', () => {
  const mockOnSubmit = vi.fn();
  const mockEmojiMetadata = {
    '😍': {
      emoji: '😍',
      tags: ['love', 'amazing'],
      category: 'positive',
      sentiment: 'positive',
    },
    '🔥': {
      emoji: '🔥',
      tags: ['fire', 'hot', 'amazing'],
      category: 'intense',
      sentiment: 'positive',
    },
    '😱': {
      emoji: '😱',
      tags: ['shocked', 'surprise'],
      category: 'surprise',
      sentiment: 'mixed',
    },
    '💯': {
      emoji: '💯',
      tags: ['perfect', 'hundred'],
      category: 'achievement',
      sentiment: 'positive',
    },
  };

  const defaultProps = {
    onSubmit: mockOnSubmit,
    isSubmitting: false,
    vibeTitle: 'Test Vibe',
    emojiMetadata: mockEmojiMetadata,
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders trigger button', () => {
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate with Emoji</button>
      </EmojiRatingPopover>
    );

    expect(screen.getByText('Rate with Emoji')).toBeInTheDocument();
  });

  it('renders popover content with all sections', () => {
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    expect(screen.getByText('Rate "Test Vibe" with emoji')).toBeInTheDocument();
    expect(screen.getByText('1. Choose an emoji')).toBeInTheDocument();
    expect(screen.getByText('2. Select rating (1-5)')).toBeInTheDocument();
    expect(screen.getByText('3. Write your review')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit Emoji Rating' })
    ).toBeInTheDocument();
  });

  it('displays emoji search input', () => {
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    expect(screen.getByPlaceholderText('Search emojis...')).toBeInTheDocument();
  });

  it('displays emoji options', () => {
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    expect(screen.getByText('😍')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('😱')).toBeInTheDocument();
    expect(screen.getByText('💯')).toBeInTheDocument();
  });

  it('selects emoji and shows rating scale', async () => {
    const user = userEvent.setup();
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    // Click on an emoji
    const fireEmoji = screen.getByText('🔥');
    await user.click(fireEmoji.parentElement as HTMLElement);

    // Should show the selected emoji and rating scale
    await waitFor(() => {
      expect(screen.getByText('Selected: 🔥')).toBeInTheDocument();
      // Should show 5 rating buttons
      const ratingButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) =>
            btn.textContent &&
            ['1', '2', '3', '4', '5'].includes(btn.textContent)
        );
      expect(ratingButtons).toHaveLength(5);
    });
  });

  it('shows emoji scale when rating is selected', async () => {
    const user = userEvent.setup();
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    // Select emoji
    const loveEmoji = screen.getByText('😍');
    await user.click(loveEmoji.parentElement as HTMLElement);

    // Select rating
    await waitFor(async () => {
      const ratingButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) =>
            btn.textContent &&
            ['1', '2', '3', '4', '5'].includes(btn.textContent)
        );
      await user.click(ratingButtons[3]); // Click 4
    });

    // Should show emoji scale with 4 filled emojis
    await waitFor(() => {
      const emojis = screen.getAllByText('😍');
      expect(emojis.length).toBeGreaterThan(4); // Selected emoji + scale emojis
    });
  });

  it('displays tags for selected emoji', async () => {
    const user = userEvent.setup();
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    // Select emoji with tags
    const fireEmoji = screen.getByText('🔥');
    await user.click(fireEmoji.parentElement as HTMLElement);

    // Should show tags
    await waitFor(() => {
      expect(screen.getByText('fire')).toBeInTheDocument();
      expect(screen.getByText('hot')).toBeInTheDocument();
      expect(screen.getByText('amazing')).toBeInTheDocument();
    });
  });

  it('validates review length', async () => {
    const user = userEvent.setup();
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    // Select emoji and rating
    const emoji = screen.getByText('😍');
    await user.click(emoji.parentElement as HTMLElement);

    await waitFor(async () => {
      const ratingButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) =>
            btn.textContent &&
            ['1', '2', '3', '4', '5'].includes(btn.textContent)
        );
      await user.click(ratingButtons[2]); // 3 rating
    });

    // Type short review
    const textarea = screen.getByPlaceholderText(/Share your thoughts/);
    await user.type(textarea, 'Too short');

    // Try to submit
    const submitButton = screen.getByRole('button', {
      name: 'Submit Emoji Rating',
    });
    await user.click(submitButton);

    expect(
      screen.getByText('Review must be at least 50 characters')
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates emoji selection', async () => {
    const user = userEvent.setup();
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    // Type valid review without selecting emoji
    const textarea = screen.getByPlaceholderText(/Share your thoughts/);
    await user.type(
      textarea,
      'This is a valid review that meets the minimum character requirement'
    );

    // Try to submit
    const submitButton = screen.getByRole('button', {
      name: 'Submit Emoji Rating',
    });
    await user.click(submitButton);

    expect(screen.getByText('Please select an emoji')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates rating selection', async () => {
    const user = userEvent.setup();
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    // Select emoji but not rating
    const emoji = screen.getByText('💯');
    await user.click(emoji.parentElement as HTMLElement);

    // Type valid review
    const textarea = screen.getByPlaceholderText(/Share your thoughts/);
    await user.type(
      textarea,
      'This is a valid review that meets the minimum character requirement'
    );

    // Try to submit
    const submitButton = screen.getByRole('button', {
      name: 'Submit Emoji Rating',
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please select a rating value')
      ).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('submits valid emoji rating', async () => {
    const user = userEvent.setup();
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    // Select emoji
    const emoji = screen.getByText('🔥');
    await user.click(emoji.parentElement as HTMLElement);

    // Select rating
    await waitFor(async () => {
      const ratingButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) =>
            btn.textContent &&
            ['1', '2', '3', '4', '5'].includes(btn.textContent)
        );
      await user.click(ratingButtons[4]); // 5 rating
    });

    // Type valid review
    const textarea = screen.getByPlaceholderText(/Share your thoughts/);
    const validReview =
      'This vibe is absolutely fire! Love the energy and creativity shown here.';
    await user.type(textarea, validReview);

    // Submit
    const submitButton = screen.getByRole('button', {
      name: 'Submit Emoji Rating',
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        emoji: '🔥',
        value: 5,
        review: validReview,
        tags: ['fire', 'hot', 'amazing'],
      });
    });
  });

  it('shows character count', async () => {
    const user = userEvent.setup();
    render(
      <EmojiRatingPopover {...defaultProps}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    const textarea = screen.getByPlaceholderText(/Share your thoughts/);
    await user.type(textarea, 'Test review');

    expect(screen.getByText('11/50')).toBeInTheDocument();
  });

  it('disables submit when submitting', () => {
    render(
      <EmojiRatingPopover {...defaultProps} isSubmitting={true}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    const submitButton = screen.getByRole('button', { name: 'Submitting...' });
    expect(submitButton).toBeDisabled();
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <EmojiRatingPopover {...defaultProps} onSubmit={onSubmit}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    // Fill form
    const emoji = screen.getByText('😱');
    await user.click(emoji.parentElement as HTMLElement);

    await waitFor(async () => {
      const ratingButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) =>
            btn.textContent &&
            ['1', '2', '3', '4', '5'].includes(btn.textContent)
        );
      await user.click(ratingButtons[2]); // 3 rating
    });

    const textarea = screen.getByPlaceholderText(/Share your thoughts/);
    await user.type(
      textarea,
      'This vibe shocked me! Really unexpected content but in a good way.'
    );

    // Submit
    const submitButton = screen.getByRole('button', {
      name: 'Submit Emoji Rating',
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    // Form should be reset
    await waitFor(() => {
      expect(textarea).toHaveValue('');
      expect(screen.queryByText('Selected: 😱')).not.toBeInTheDocument();
    });
  });

  it('handles submission errors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));

    render(
      <EmojiRatingPopover {...defaultProps} onSubmit={onSubmit}>
        <button>Rate</button>
      </EmojiRatingPopover>
    );

    // Fill valid form
    const emoji = screen.getByText('💯');
    await user.click(emoji.parentElement as HTMLElement);

    await waitFor(async () => {
      const ratingButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) =>
            btn.textContent &&
            ['1', '2', '3', '4', '5'].includes(btn.textContent)
        );
      await user.click(ratingButtons[4]); // 5 rating
    });

    const textarea = screen.getByPlaceholderText(/Share your thoughts/);
    await user.type(
      textarea,
      'This is perfect! Absolutely worth a hundred percent emoji rating!'
    );

    // Submit
    const submitButton = screen.getByRole('button', {
      name: 'Submit Emoji Rating',
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to submit rating. Please try again.')
      ).toBeInTheDocument();
    });
  });
});
