/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingPopover } from './rating-popover';
import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';

// Wrapper for tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider defaultTheme="light" storageKey="test-theme">
    {children}
  </ThemeProvider>
);

// Mock the Popover components
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverTrigger: ({
    children,
    asChild: _asChild,
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
      </RatingPopover>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('Rate')).toBeInTheDocument();
  });

  it('renders popover content with all elements', () => {
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>,
      { wrapper: TestWrapper }
    );

    expect(screen.getByText('Rate This Vibe')).toBeInTheDocument();
    expect(screen.getByText('Your Rating')).toBeInTheDocument();
    // Check for the label with required text
    const reviewLabel = screen.getByText(/your review/i);
    expect(reviewLabel).toBeInTheDocument();
    expect(screen.getByText('(required, min 50 chars)')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Share your thoughts about this vibe...')
    ).toBeInTheDocument();
    expect(screen.getByText('Simple')).toBeInTheDocument();
    expect(screen.getByText('Precise')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit Rating' })
    ).toBeInTheDocument();
  });

  it('displays circle rating selector', () => {
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>,
      { wrapper: TestWrapper }
    );

    // Should have 5 circle buttons (radio buttons within the StarRating component)
    const circles = screen.getAllByRole('radio');
    expect(circles).toHaveLength(5);
  });

  it('updates rating when clicking circles', async () => {
    const user = userEvent.setup();
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>,
      { wrapper: TestWrapper }
    );

    const circles = screen.getAllByRole('radio');

    // Click the 4th circle
    await user.click(circles[3]);

    // Should show rating text
    await waitFor(() => {
      expect(screen.getByText('4 circles')).toBeInTheDocument();
    });
  });

  it('updates review text and shows character count', async () => {
    const user = userEvent.setup();
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>,
      { wrapper: TestWrapper }
    );

    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this vibe...'
    );

    await user.type(textarea, 'This is a great vibe!');

    expect(textarea).toHaveValue('This is a great vibe!');
    expect(screen.getByText(/21 \/ 50 characters/)).toBeInTheDocument();
  });

  it('shows error when review is too short', async () => {
    const user = userEvent.setup();
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>,
      { wrapper: TestWrapper }
    );

    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this vibe...'
    );
    const submitButton = screen.getByRole('button', { name: 'Submit Rating' });

    // Select a rating
    const circles = screen.getAllByRole('radio');
    await user.click(circles[2]); // 3 circles

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
      </RatingPopover>,
      { wrapper: TestWrapper }
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

    // The submit button should be disabled when no rating is selected
    expect(submitButton).toBeDisabled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(
      <RatingPopover {...defaultProps}>
        <button>Rate</button>
      </RatingPopover>,
      { wrapper: TestWrapper }
    );

    // Select rating
    const circles = screen.getAllByRole('radio');
    await user.click(circles[4]); // 5 circles

    // Type review
    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this vibe...'
    );
    const validReview =
      'This is an amazing vibe! I really enjoyed the content and would definitely recommend it.';
    await user.type(textarea, validReview);

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit Rating' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        rating: 5,
        review: validReview,
        useEmojiRating: false,
      });
    });
  });

  it('disables submit button when submitting', () => {
    render(
      <RatingPopover {...defaultProps} isSubmitting={true}>
        <button>Rate</button>
      </RatingPopover>,
      { wrapper: TestWrapper }
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
      </RatingPopover>,
      { wrapper: TestWrapper }
    );

    // Fill form
    const circles = screen.getAllByRole('radio');
    await user.click(circles[3]); // 4 circles

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
      expect(screen.queryByText('4 circles')).not.toBeInTheDocument();
    });
  });

  it('shows error state when submission fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));

    render(
      <RatingPopover onSubmit={onSubmit} isSubmitting={false}>
        <button>Rate</button>
      </RatingPopover>,
      { wrapper: TestWrapper }
    );

    // Fill form
    const circles = screen.getAllByRole('radio');
    await user.click(circles[2]); // 3 circles

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
      </RatingPopover>,
      { wrapper: TestWrapper }
    );

    const textarea = screen.getByPlaceholderText(
      'Share your thoughts about this vibe...'
    );

    // Type exactly 50 characters
    const exactText = 'a'.repeat(50);
    await user.type(textarea, exactText);

    // Check for the character count text - it should show "50 / 50 characters"
    // The component shows this in the format: {characterCount} / {MIN_REVIEW_LENGTH} characters
    const characterCountDivs = screen.getAllByText((content, element) => {
      return element?.textContent === '50 / 50 characters✓';
    });
    expect(characterCountDivs.length).toBeGreaterThan(0);
  });
});
