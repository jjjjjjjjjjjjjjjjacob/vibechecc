/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingPopover } from './rating-popover';

// Mock the Popover components
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

describe('RatingPopover', () => {
  const mockOnSubmit = vi.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders trigger button', () => {
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>
    );

    expect(screen.getByText('Rate')).toBeInTheDocument();
  });

  it('renders popover content with all elements', () => {
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>
    );

    expect(screen.getByText('Rate this vibe')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Share your thoughts about this vibe...')
    ).toBeInTheDocument();
    expect(screen.getByText('Include emoji rating')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit Rating' })
    ).toBeInTheDocument();
  });

  it('displays star rating selector', () => {
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>
    );

    // Should have 5 star buttons
    const stars = screen
      .getAllByRole('button')
      .filter((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-star')
      );
    expect(stars).toHaveLength(5);
  });

  it('updates rating when clicking stars', async () => {
    const user = userEvent.setup();
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>
    );

    const stars = screen
      .getAllByRole('button')
      .filter((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-star')
      );

    // Click the 4th star
    await user.click(stars[3]);

    // Should show rating text
    expect(screen.getByText('4 out of 5')).toBeInTheDocument();
  });

  it('updates review text and shows character count', async () => {
    const user = userEvent.setup();
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>
    );

    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this vibe...'
    );

    await user.type(textarea, 'This is a great vibe!');

    expect(textarea).toHaveValue('This is a great vibe!');
    expect(screen.getByText('21/50')).toBeInTheDocument();
  });

  it('shows error when review is too short', async () => {
    const user = userEvent.setup();
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>
    );

    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this vibe...'
    );
    const submitButton = screen.getByRole('button', { name: 'Submit Rating' });

    // Select a rating
    const stars = screen
      .getAllByRole('button')
      .filter((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-star')
      );
    await user.click(stars[2]); // 3 stars

    // Type a short review
    await user.type(textarea, 'Too short');

    // Try to submit
    await user.click(submitButton);

    expect(
      screen.getByText('Review must be at least 50 characters')
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows error when no rating is selected', async () => {
    const user = userEvent.setup();
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>
    );

    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this vibe...'
    );
    const submitButton = screen.getByRole('button', { name: 'Submit Rating' });

    // Type a valid review without selecting rating
    await user.type(
      textarea,
      'This is a sufficiently long review that meets the character requirement'
    );

    // Try to submit
    await user.click(submitButton);

    expect(screen.getByText('Please select a rating')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>
    );

    // Select rating
    const stars = screen
      .getAllByRole('button')
      .filter((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-star')
      );
    await user.click(stars[4]); // 5 stars

    // Type review
    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this vibe...'
    );
    const validReview =
      'This is an amazing vibe! I really enjoyed the content and would definitely recommend it.';
    await user.type(textarea, validReview);

    // Check emoji rating checkbox
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit Rating' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        rating: 5,
        review: validReview,
        useEmojiRating: true,
      });
    });
  });

  it('disables submit button when submitting', () => {
    render(
      <RatingPopover {...defaultProps} isSubmitting={true}>
        <button>Rate</button>
      </RatingPopover>
    );

    const submitButton = screen.getByRole('button', { name: 'Submitting...' });
    expect(submitButton).toBeDisabled();
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <RatingPopover onSubmit={onSubmit} isSubmitting={false}>
        <button>Rate</button>
      </RatingPopover>
    );

    // Fill form
    const stars = screen
      .getAllByRole('button')
      .filter((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-star')
      );
    await user.click(stars[3]); // 4 stars

    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this vibe...'
    );
    await user.type(
      textarea,
      'This is a great vibe that I really enjoyed watching and experiencing!'
    );

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit Rating' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    // Form should be reset
    await waitFor(() => {
      expect(textarea).toHaveValue('');
      expect(screen.queryByText('4 out of 5')).not.toBeInTheDocument();
    });
  });

  it('shows error state when submission fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));

    render(
      <RatingPopover onSubmit={onSubmit} isSubmitting={false}>
        <button>Rate</button>
      </RatingPopover>
    );

    // Fill form
    const stars = screen
      .getAllByRole('button')
      .filter((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-star')
      );
    await user.click(stars[2]); // 3 stars

    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this vibe...'
    );
    await user.type(
      textarea,
      'This is a valid review that meets all the requirements for submission'
    );

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit Rating' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to submit rating. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('handles character count properly', async () => {
    const user = userEvent.setup();
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>
    );

    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this vibe...'
    );

    // Type exactly 50 characters
    const exactText = 'a'.repeat(50);
    await user.type(textarea, exactText);

    expect(screen.getByText('50/50')).toBeInTheDocument();
    expect(
      screen.queryByText('Review must be at least 50 characters')
    ).not.toBeInTheDocument();
  });
});
