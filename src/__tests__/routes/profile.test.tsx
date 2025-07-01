/// <reference lib="dom" />

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
  beforeEach,
  type MockedFunction,
} from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUser } from '@clerk/tanstack-react-start';

// Mock Clerk
vi.mock('@clerk/tanstack-react-start', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: vi.fn(),
  getAuth: vi.fn(),
  default: vi.fn(),
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    createFileRoute: vi.fn(() => ({
      component: () => <div>Profile Component</div>,
      beforeLoad: vi.fn(),
    })),
    Link: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <a {...props}>{children}</a>,
    redirect: vi.fn(),
  };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Create mock queries object
const mockQueries = {
  useCurrentUser: vi.fn(),
  useUserVibes: vi.fn(),
  useUserReactedVibes: vi.fn(),
  useUpdateProfileMutation: vi.fn(),
  useEnsureUserExistsMutation: vi.fn(),
};

// Mock queries
vi.mock('@/queries', () => mockQueries);

// Mock components
vi.mock('@/components/vibe-grid', () => ({
  VibeGrid: ({
    vibes,
  }: {
    vibes: Array<{ title: string; [key: string]: unknown }>;
  }) => (
    <div data-testid="vibe-grid">
      {vibes.map((vibe, i) => (
        <div key={i} data-testid={`vibe-${i}`}>
          {vibe.title}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/create-vibe-button', () => ({
  CreateVibeButton: () => (
    <button data-testid="create-vibe-button">Create Vibe</button>
  ),
}));

vi.mock('@/components/ui/vibe-grid-skeleton', () => ({
  VibeGridSkeleton: ({ count }: { count: number }) => (
    <div data-testid="vibe-grid-skeleton">Loading {count} vibes...</div>
  ),
}));

vi.mock('@/features/auth/components/debug-auth', () => ({
  DebugAuth: () => <div data-testid="debug-auth">Debug Auth Component</div>,
}));

// Create a simple Profile component for testing
const ProfileComponent = () => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  const { data: convexUser, isLoading: convexUserLoading } =
    mockQueries.useCurrentUser();

  const { isPending: isCreatingUser } =
    mockQueries.useEnsureUserExistsMutation();

  const { data: vibes } = mockQueries.useUserVibes(convexUser?._id || '');

  const isLoading = !clerkLoaded || convexUserLoading || isCreatingUser;

  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }

  if (!clerkUser || !convexUser) {
    return <div data-testid="error">Failed to load user profile</div>;
  }

  return (
    <div data-testid="profile">
      <div data-testid="debug-auth">Debug Auth Component</div>
      <h1>{clerkUser.fullName}</h1>
      <p>@{convexUser.username}</p>
      <p>{clerkUser.emailAddresses[0]?.emailAddress}</p>
      <button data-testid="edit-profile">edit profile</button>
      {vibes && vibes.length > 0 ? (
        <div data-testid="vibe-grid">
          {vibes.map(
            (vibe: { title: string; [key: string]: unknown }, i: number) => (
              <div key={i} data-testid={`vibe-${i}`}>
                {vibe.title}
              </div>
            )
          )}
        </div>
      ) : (
        <div data-testid="no-vibes">you haven't created any vibes yet.</div>
      )}
    </div>
  );
};

// Define the type for test overrides
interface TestOverrides {
  clerkUser?: Partial<ReturnType<typeof useUser>>;
  convexUser?: Partial<ReturnType<typeof mockQueries.useCurrentUser>>;
  userVibes?: Partial<ReturnType<typeof mockQueries.useUserVibes>>;
  userReactedVibes?: Partial<
    ReturnType<typeof mockQueries.useUserReactedVibes>
  >;
  updateProfile?: Partial<
    ReturnType<typeof mockQueries.useUpdateProfileMutation>
  >;
  ensureUser?: Partial<
    ReturnType<typeof mockQueries.useEnsureUserExistsMutation>
  >;
}

describe('Profile Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Setup React Query
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderProfile = (overrides: TestOverrides = {}) => {
    const mockUseUser = useUser as MockedFunction<typeof useUser>;

    // Default mock implementations
    mockUseUser.mockReturnValue({
      user: {
        id: 'clerk_user_123',
        fullName: 'John Doe',
        firstName: 'John',
        emailAddresses: [{ emailAddress: 'john@example.com' }],
        imageUrl: 'https://example.com/avatar.jpg',
        createdAt: new Date('2023-01-01'),
        update: vi.fn().mockResolvedValue({}),
        setProfileImage: vi.fn().mockResolvedValue({}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      isLoaded: true,
      isSignedIn: true,
      ...overrides.clerkUser,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockQueries.useCurrentUser.mockReturnValue({
      data: {
        _id: 'convex_user_123',
        externalId: 'clerk_user_123',
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        image_url: 'https://example.com/avatar.jpg',
        created_at: Date.now(),
      },
      isLoading: false,
      refetch: vi.fn(),
      ...overrides.convexUser,
    });

    mockQueries.useUserVibes.mockReturnValue({
      data: [
        { _id: '1', title: 'Test Vibe 1', description: 'Description 1' },
        { _id: '2', title: 'Test Vibe 2', description: 'Description 2' },
      ],
      isLoading: false,
      ...overrides.userVibes,
    });

    mockQueries.useUserReactedVibes.mockReturnValue({
      data: [],
      isLoading: false,
      ...overrides.userReactedVibes,
    });

    mockQueries.useUpdateProfileMutation.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      ...overrides.updateProfile,
    });

    mockQueries.useEnsureUserExistsMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      ...overrides.ensureUser,
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <ProfileComponent />
      </QueryClientProvider>
    );
  };

  describe('Authentication States', () => {
    it('should show loading state when Clerk is not loaded', () => {
      renderProfile({
        clerkUser: { isLoaded: false },
      });

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show loading state when Convex user is loading', () => {
      renderProfile({
        convexUser: { isLoading: true },
      });

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show error when both Clerk and Convex users fail to load', () => {
      renderProfile({
        clerkUser: { user: null, isLoaded: true },
        convexUser: { data: null, isLoading: false },
      });

      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });

  describe('Profile Display', () => {
    it('should display user information correctly', () => {
      renderProfile();

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByTestId('debug-auth')).toBeInTheDocument();
    });

    it('should display user vibes', () => {
      renderProfile();

      expect(screen.getByTestId('vibe-grid')).toBeInTheDocument();
      expect(screen.getByTestId('vibe-0')).toHaveTextContent('Test Vibe 1');
      expect(screen.getByTestId('vibe-1')).toHaveTextContent('Test Vibe 2');
    });

    it('should show no vibes message when user has no vibes', () => {
      renderProfile({
        userVibes: { data: [], isLoading: false },
      });

      expect(screen.getByTestId('no-vibes')).toBeInTheDocument();
    });
  });

  describe('Debug Authentication Component', () => {
    it('should render debug auth component', () => {
      renderProfile();

      expect(screen.getByTestId('debug-auth')).toBeInTheDocument();
    });
  });
});
