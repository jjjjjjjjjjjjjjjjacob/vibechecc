/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './tag-input';

// Simple mock that always returns empty arrays
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@convex-dev/react-query', () => ({
  convexQuery: () => ({}),
}));

vi.mock('@vibechecc/convex', () => ({
  api: {
    tags: {
      search: vi.fn(),
      getPopular: vi.fn(),
    },
  },
}));

describe('TagInput', () => {
  const mockOnTagsChange = vi.fn();
  const defaultProps = {
    tags: [],
    onTagsChange: mockOnTagsChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders with placeholder text', () => {
    render(<TagInput {...defaultProps} placeholder="Custom placeholder" />);

    expect(
      screen.getByPlaceholderText('Custom placeholder')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'start typing to search existing tags or create new ones'
      )
    ).toBeInTheDocument();
  });

  it('displays existing tags', () => {
    render(
      <TagInput {...defaultProps} tags={['react', 'testing', 'vitest']} />
    );

    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
    expect(screen.getByText('vitest')).toBeInTheDocument();
  });

  it('removes tag when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} tags={['react', 'testing']} />);

    const removeButtons = screen.getAllByRole('button');
    // Click the first remove button (for 'react' tag)
    await user.click(removeButtons[0]);

    expect(mockOnTagsChange).toHaveBeenCalledWith(['testing']);
  });

  it('adds new tag when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);

    const input = screen.getByPlaceholderText('search or create tags...');
    await user.type(input, 'newtag{Enter}');

    expect(mockOnTagsChange).toHaveBeenCalledWith(['newtag']);
  });

  it('normalizes tags to lowercase', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);

    const input = screen.getByPlaceholderText('search or create tags...');
    await user.type(input, 'TestTag{Enter}');

    expect(mockOnTagsChange).toHaveBeenCalledWith(['testtag']);
  });

  it('prevents duplicate tags', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} tags={['existing']} />);

    const input = screen.getByPlaceholderText('search or create tags...');
    await user.type(input, 'existing{Enter}');

    expect(mockOnTagsChange).not.toHaveBeenCalled();
  });

  it('removes last tag on backspace with empty input', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} tags={['first', 'second', 'third']} />);

    const input = screen.getByPlaceholderText('search or create tags...');
    await user.click(input);
    await user.keyboard('{Backspace}');

    expect(mockOnTagsChange).toHaveBeenCalledWith(['first', 'second']);
  });

  it('shows create option when typing', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);

    const input = screen.getByPlaceholderText('search or create tags...');
    await user.click(input);
    await user.type(input, 'newuniquetag');

    await waitFor(() => {
      expect(screen.getByText('create "newuniquetag"')).toBeInTheDocument();
    });
  });

  it('creates tag when clicking on create option', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);

    const input = screen.getByPlaceholderText('search or create tags...');
    await user.click(input);
    await user.type(input, 'brandnew');

    await waitFor(async () => {
      const createOption = screen.getByText('create "brandnew"');
      await user.click(createOption.closest('div')!);
    });

    expect(mockOnTagsChange).toHaveBeenCalledWith(['brandnew']);
  });

  it('clears input after adding a tag', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      'search or create tags...'
    ) as HTMLInputElement;
    await user.type(input, 'clearedtag{Enter}');

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('handles empty or whitespace-only input', async () => {
    const user = userEvent.setup();
    render(<TagInput {...defaultProps} />);

    const input = screen.getByPlaceholderText('search or create tags...');
    await user.type(input, '   {Enter}');

    expect(mockOnTagsChange).not.toHaveBeenCalled();
  });
});
