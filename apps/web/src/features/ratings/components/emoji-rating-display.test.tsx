/// <reference lib="dom" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmojiRatingDisplay } from './emoji-rating-display';
import type { EmojiRating } from '@vibechecc/types';
import React from 'react';

// Mock Clerk
vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: () => ({
    user: null,
    isSignedIn: false,
    isLoaded: true,
  }),
  SignInButton: ({ children }: any) => <div>{children}</div>,
  SignUpButton: ({ children }: any) => <div>{children}</div>,
  SignedIn: ({ children }: any) => <div>{children}</div>,
  SignedOut: ({ children }: any) => <div>{children}</div>,
}));

// Mock auth components
vi.mock('@/features/auth', () => ({
  AuthPromptDialog: () => null,
}));

// Mock rating components that might be used
vi.mock('./rate-and-review-dialog', () => ({
  RateAndReviewDialog: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('./rating-scale', () => ({
  RatingScale: ({ emoji, value, onChange }: any) => (
    <div data-testid="rating-scale">
      <span>{emoji}</span>
      <span>{value}/5</span>
      <button onClick={() => onChange?.(value + 1)}>Rate</button>
    </div>
  ),
}));

// Mock convex-dev/react-query
vi.mock('@convex-dev/react-query', () => ({
  convexQuery: vi.fn(() => ({
    queryKey: ['convex', 'emojis.getByEmojis'],
    queryFn: () => Promise.resolve({}),
  })),
}));

// Mock @tanstack/react-query to return empty data
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: {},
      isLoading: false,
      error: null,
    })),
  };
});

describe('EmojiRatingDisplay', () => {
  const mockRating: EmojiRating = {
    emoji: '😍',
    value: 3.5,
    count: 10,
    tags: ['love', 'amazing'],
  };

  it('renders compact mode without scale by default', () => {
    render(
      <EmojiRatingDisplay
        rating={mockRating}
        vibeId="test-vibe-1"
        existingUserRatings={[]}
        emojiMetadata={{}}
      />
    );

    expect(screen.getByText('😍')).toBeInTheDocument();
    expect(screen.getAllByText(/3\.5/).length).toBeGreaterThan(0);
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });

  it('renders with scale when showScale is true', () => {
    render(
      <EmojiRatingDisplay
        rating={mockRating}
        vibeId="test-vibe-1"
        variant="scale"
        existingUserRatings={[]}
        emojiMetadata={{}}
      />
    );

    expect(screen.getAllByText(/3\.5/).length).toBeGreaterThan(0);
    expect(screen.getByText('(10)')).toBeInTheDocument();

    // Should render the emoji in the scale display
    expect(screen.getByText('😍')).toBeInTheDocument();
  });

  it('handles rating without count', () => {
    const ratingWithoutCount: EmojiRating = {
      emoji: '🔥',
      value: 5,
    };

    render(
      <EmojiRatingDisplay
        rating={ratingWithoutCount}
        vibeId="test-vibe-1"
        existingUserRatings={[]}
        emojiMetadata={{}}
      />
    );

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
        vibeId="test-vibe-1"
        variant="scale"
        existingUserRatings={[]}
        emojiMetadata={{}}
      />
    );

    // Should render the rating value and scale correctly
    expect(screen.getAllByText(/4/).length).toBeGreaterThan(0);
    // Check that there's a rate button
    expect(screen.getByRole('button', { name: 'Rate' })).toBeInTheDocument();
  });
});
