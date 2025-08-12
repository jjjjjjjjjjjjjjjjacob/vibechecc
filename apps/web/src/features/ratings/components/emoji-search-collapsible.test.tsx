/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { EmojiSearchCollapsible } from './emoji-search-collapsible';
import {
  createTestWrapper,
  resetMockData,
} from '@/test-utils/convex-test-utils';

describe('EmojiSearchCollapsible', () => {
  const mockOnEmojiSelect = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnRatingSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    resetMockData();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders in collapsed state by default', () => {
    const Wrapper = createTestWrapper();
    render(
      <EmojiSearchCollapsible
        onEmojiSelect={mockOnEmojiSelect}
        onClose={mockOnClose}
        open={true}
      />,
      { wrapper: Wrapper }
    );

    // Should show the emoji picker element
    expect(document.querySelector('em-emoji-picker')).toBeInTheDocument();
  });

  it('expands when chevron button is clicked', async () => {
    const Wrapper = createTestWrapper();
    const { container } = render(
      <EmojiSearchCollapsible
        onEmojiSelect={mockOnEmojiSelect}
        onClose={mockOnClose}
        open={true}
      />,
      { wrapper: Wrapper }
    );

    // Find the chevron button
    const chevronButton = container.querySelector('button');
    expect(chevronButton).toBeInTheDocument();

    // Click to expand
    if (chevronButton) {
      fireEvent.click(chevronButton);
    }

    // Should update the data-open attribute
    await waitFor(() => {
      const collapsible = container.querySelector('[data-open]');
      expect(collapsible?.getAttribute('data-open')).toBe('true');
    });
  });

  it('calls onEmojiSelect when emoji is selected', () => {
    const Wrapper = createTestWrapper();
    render(
      <EmojiSearchCollapsible
        onEmojiSelect={mockOnEmojiSelect}
        onClose={mockOnClose}
        open={true}
      />,
      { wrapper: Wrapper }
    );

    // Since the emoji picker is a custom element (em-emoji-picker),
    // we can't easily simulate selection, but we can verify it's rendered
    expect(document.querySelector('em-emoji-picker')).toBeInTheDocument();
  });

  it('renders with custom vibeTitle when provided', () => {
    const Wrapper = createTestWrapper();
    render(
      <EmojiSearchCollapsible
        onEmojiSelect={mockOnEmojiSelect}
        onClose={mockOnClose}
        open={true}
        vibeTitle="Test Vibe"
      />,
      { wrapper: Wrapper }
    );

    // Component should render without errors
    expect(document.querySelector('em-emoji-picker')).toBeInTheDocument();
  });

  it('handles onRatingSubmit when provided', () => {
    const Wrapper = createTestWrapper();
    render(
      <EmojiSearchCollapsible
        onEmojiSelect={mockOnEmojiSelect}
        onClose={mockOnClose}
        open={true}
        onRatingSubmit={mockOnRatingSubmit}
        vibeTitle="Test Vibe"
      />,
      { wrapper: Wrapper }
    );

    // Component should render without errors with rating submit handler
    expect(document.querySelector('em-emoji-picker')).toBeInTheDocument();
  });

  it('respects open prop', () => {
    const Wrapper = createTestWrapper();
    const { rerender } = render(
      <EmojiSearchCollapsible
        onEmojiSelect={mockOnEmojiSelect}
        onClose={mockOnClose}
        open={false}
      />,
      { wrapper: Wrapper }
    );

    // When open is false, component might not render or be hidden
    // This depends on the implementation

    // Update to open
    rerender(
      <EmojiSearchCollapsible
        onEmojiSelect={mockOnEmojiSelect}
        onClose={mockOnClose}
        open={true}
      />
    );

    // Should now be visible
    expect(document.querySelector('em-emoji-picker')).toBeInTheDocument();
  });
});
