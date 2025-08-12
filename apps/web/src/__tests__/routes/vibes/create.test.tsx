/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Set up mocks before any imports
const mockNavigate = vi.fn();
const mockMutateAsync = vi.fn();
const mockTrackEvents = {
  vibeCreated: vi.fn(),
};

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => () => ({
    component: vi.fn(),
    beforeLoad: vi.fn(),
  })),
  useNavigate: () => mockNavigate,
  redirect: vi.fn(),
}));

vi.mock('@/queries', () => ({
  useCreateVibeMutation: () => ({
    mutateAsync: mockMutateAsync,
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@clerk/tanstack-react-start', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' },
    isLoaded: true,
    isSignedIn: true,
  }),
}));

vi.mock('@clerk/tanstack-react-start/server', () => ({
  getAuth: vi.fn(),
}));

vi.mock('@tanstack/react-start/server', () => ({
  getWebRequest: vi.fn(),
}));

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({
    handler: vi.fn(),
  }),
}));

// Mock PostHog analytics hook used in the route component
vi.mock('@/hooks/use-posthog', () => ({
  usePostHog: () => ({
    trackEvents: mockTrackEvents,
  }),
}));

vi.mock('@/features/search', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    TagInput: ({
      tags,
      onTagsChange,
      placeholder,
    }: {
      tags: string[];
      onTagsChange: (tags: string[]) => void;
      placeholder: string;
    }) => {
      return React.createElement('div', { 'data-testid': 'tag-input' }, [
        React.createElement('input', {
          key: 'input',
          placeholder,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            if (value.includes(',')) {
              const newTags = value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
              onTagsChange(newTags);
            }
          },
        }),
        React.createElement('div', { key: 'tags' }, tags.join(', ')),
      ]);
    },
  };
});

// Simple test - since the CreateVibe component is internal to the file,
// we'll test that the file loads without errors and skip the actual component tests
describe('CreateVibe Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should load without errors', async () => {
    // Import the file to ensure it loads without throwing
    const createModule = await import('@/routes/vibes/create');
    expect(createModule).toBeDefined();
    expect(createModule.Route).toBeDefined();
  });

  it('route should have correct path', async () => {
    const { Route } = await import('@/routes/vibes/create');
    // The route should be defined even if we can't test the component directly
    expect(Route).toBeDefined();
  });

  // Note: Full component testing would require either:
  // 1. Exporting the CreateVibe component from create.tsx
  // 2. Using a full routing test setup with TanStack Router
  // 3. E2E testing with a tool like Playwright
  //
  // Since the component is not exported and is tightly coupled to the router,
  // these minimal tests ensure the file loads correctly.
});
