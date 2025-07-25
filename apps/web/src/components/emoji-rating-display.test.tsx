/// <reference lib="dom" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  EmojiRatingDisplay,
  TopEmojiRatings,
} from './emoji-rating-display';
import type { EmojiRating } from '@vibechecc/types';

describe('EmojiRatingDisplay', () => {
  const mockRating: EmojiRating = {
    emoji: '😍',
    value: 3.5,
    count: 10,
    tags: ['love', 'amazing'],
  };

  it('renders compact mode without scale by default', () => {
    render(<EmojiRatingDisplay rating={mockRating} />);

    expect(screen.getByText('😍')).toBeInTheDocument();
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });

  it('renders with scale when showScale is true', () => {
    render(
      <EmojiRatingDisplay rating={mockRating} showScale={true} />
    );

    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('10 ratings')).toBeInTheDocument();

    // Should render 3 filled emojis, 1 partial, and 1 unfilled
    const emojis = screen.getAllByText('😍');
    expect(emojis.length).toBeGreaterThan(3); // At least 4 emojis (3 filled + 1 partial + unfilled)
  });


  it('handles rating without count', () => {
    const ratingWithoutCount: EmojiRating = {
      emoji: '🔥',
      value: 5,
    };

    render(<EmojiRatingDisplay rating={ratingWithoutCount} />);

    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it('handles whole number ratings', () => {
    const wholeRating: EmojiRating = {
      emoji: '⭐',
      value: 4,
      count: 5,
    };

    render(
      <EmojiRatingDisplay
        rating={wholeRating}
        showScale={true}
      />
    );

    // Should render exactly 4 filled and 1 unfilled emoji
    const emojis = screen.getAllByText('⭐');
    expect(emojis.length).toBe(5); // 4 filled + 1 unfilled
  });
});

describe('TopEmojiRatings', () => {
  const mockRatings: EmojiRating[] = [
    { emoji: '😍', value: 4.5, count: 20 },
    { emoji: '🔥', value: 4.0, count: 15 },
    { emoji: '😱', value: 3.5, count: 10 },
    { emoji: '💯', value: 5.0, count: 8 },
    { emoji: '😂', value: 3.0, count: 5 },
  ];

  it('renders first 3 ratings by default', () => {
    render(<TopEmojiRatings emojiRatings={mockRatings} />);

    // Check that first 3 rating values are displayed
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
    expect(screen.getByText('3.5')).toBeInTheDocument();

    // Check that last 2 rating values are not displayed
    expect(screen.queryByText('5.0')).not.toBeInTheDocument();
    expect(screen.queryByText('3.0')).not.toBeInTheDocument();
  });

  it('renders all ratings when expanded', () => {
    render(<TopEmojiRatings emojiRatings={mockRatings} expanded={true} />);

    // Check that all rating values are displayed
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
    expect(screen.getByText('3.0')).toBeInTheDocument();

    // Check that all emojis are present (using getAllByText since they appear multiple times in scales)
    expect(screen.getAllByText('😍').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🔥').length).toBeGreaterThan(0);
    expect(screen.getAllByText('😱').length).toBeGreaterThan(0);
    expect(screen.getAllByText('💯').length).toBeGreaterThan(0);
    expect(screen.getAllByText('😂').length).toBeGreaterThan(0);
  });

  it('shows expand button when there are more than 3 ratings', () => {
    const onExpandToggle = vi.fn();
    render(
      <TopEmojiRatings
        emojiRatings={mockRatings}
        onExpandToggle={onExpandToggle}
      />
    );

    const expandButton = screen.getByText('show 2 more ratings');
    expect(expandButton).toBeInTheDocument();

    expandButton.click();
    expect(onExpandToggle).toHaveBeenCalledTimes(1);
  });

  it('shows collapse button when expanded', () => {
    const onExpandToggle = vi.fn();
    render(
      <TopEmojiRatings
        emojiRatings={mockRatings}
        expanded={true}
        onExpandToggle={onExpandToggle}
      />
    );

    const collapseButton = screen.getByText('show less');
    expect(collapseButton).toBeInTheDocument();

    collapseButton.click();
    expect(onExpandToggle).toHaveBeenCalledTimes(1);
  });

  it('handles empty ratings array', () => {
    render(<TopEmojiRatings emojiRatings={[]} />);

    // Should render without errors but with no content
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

