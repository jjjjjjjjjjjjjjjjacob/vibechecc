/// <reference lib="dom" />
import React from 'react';
import { vi, beforeEach } from 'vitest';

// Mock Clerk authentication
export const createMockClerkProvider = (isSignedIn = true, user = null) => {
  const mockUser = user || {
    id: 'user_123',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    imageUrl: 'https://example.com/avatar.jpg',
  };

  return {
    ClerkProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="clerk-provider">{children}</div>
    ),
    SignedIn: ({ children }: { children: React.ReactNode }) =>
      isSignedIn ? <div data-testid="signed-in">{children}</div> : null,
    SignedOut: ({ children }: { children: React.ReactNode }) =>
      !isSignedIn ? <div data-testid="signed-out">{children}</div> : null,
    UserButton: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="user-button">{children}</div>
    ),
    SignInButton: ({
      children,
      mode,
    }: {
      children: React.ReactNode;
      mode?: string;
    }) => (
      <div data-testid="sign-in-button" data-mode={mode}>
        {children}
      </div>
    ),
    useUser: () => ({
      user: isSignedIn ? mockUser : null,
      isLoaded: true,
      isSignedIn,
    }),
    useAuth: () => ({
      isLoaded: true,
      isSignedIn,
      signOut: vi.fn(),
    }),
  };
};

// Mock TanStack Router
export const createMockRouter = (pathname = '/', matches = []) => ({
  Link: ({
    children,
    to,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    to: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <a
      href={to}
      className={className}
      onClick={onClick}
      data-testid={`link-${to.replace('/', '') || 'home'}`}
    >
      {children}
    </a>
  ),
  useRouterState: () => ({
    location: { pathname },
    matches:
      matches.length > 0
        ? matches
        : pathname === '/vibes/123'
          ? [{ routeId: '/vibes/$vibeId' }]
          : [],
  }),
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    navigate: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
});

// Mock Theme Provider
export const createMockThemeProvider = (
  theme = 'light',
  colorTheme = 'purple-primary',
  secondaryColorTheme = 'blue-secondary'
) => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider" data-theme={theme}>
      {children}
    </div>
  ),
  useTheme: () => ({
    theme: 'system' as const,
    setTheme: vi.fn(),
    resolvedTheme: theme as 'light' | 'dark',
    colorTheme: colorTheme as any,
    secondaryColorTheme: secondaryColorTheme as any,
    setColorTheme: vi.fn(),
    setSecondaryColorTheme: vi.fn(),
  }),
  ThemeToggle: () => <button data-testid="theme-toggle">Toggle Theme</button>,
});

// Mock Search Components and Hooks
export const createMockSearchProviders = () => ({
  SearchAccordion: ({
    open,
    onOpenChange,
    triggerRef: _triggerRef,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    triggerRef?: React.RefObject<HTMLButtonElement>;
  }) => (
    <div data-testid="search-accordion" data-open={open}>
      <button onClick={() => onOpenChange(!open)}>
        {open ? 'Close Search' : 'Open Search'}
      </button>
    </div>
  ),
  useSearchShortcuts: vi.fn(),
  useSearchResults: () => ({
    results: [],
    isLoading: false,
    error: null,
    hasMore: false,
    loadMore: vi.fn(),
  }),
  useInstantSearch: () => ({
    query: '',
    setQuery: vi.fn(),
    results: [],
    isLoading: false,
  }),
});

// Mock Convex Queries
export const createMockConvexQueries = (mockData: any = {}) => ({
  useCurrentUser: () => ({
    data: mockData.currentUser || {
      _id: 'user_123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      primaryColor: 'purple',
      secondaryColor: 'blue',
    },
    isLoading: false,
    error: null,
  }),
  useVibes: () => ({
    data: (mockData as any).vibes || [],
    isLoading: false,
    error: null,
  }),
  useEmojiRatings: () => ({
    data: (mockData as any).emojiRatings || [],
    isLoading: false,
    error: null,
  }),
});

// Mock UI Components
export const createMockUIComponents = () => ({
  Button: ({
    children,
    onClick,
    className,
    variant,
    size,
    asChild,
    ...props
  }: any) => {
    const Tag = asChild ? 'div' : 'button';
    return (
      <Tag
        onClick={onClick}
        className={className}
        data-variant={variant}
        data-size={size}
        data-testid="ui-button"
        {...props}
      >
        {children}
      </Tag>
    );
  },
  Input: ({
    className,
    type = 'text',
    placeholder,
    value,
    onChange,
    ...props
  }: any) => (
    <input
      type={type}
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      data-testid="ui-input"
      {...props}
    />
  ),
  Dialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ui-dialog">{children}</div>
  ),
  DialogTrigger: ({
    children,
    asChild: _asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div data-testid="ui-dialog-trigger">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ui-dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ui-dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="ui-dialog-title">{children}</h2>
  ),
  Skeleton: ({ className }: { className?: string }) => (
    <div className={className} data-testid="ui-skeleton">
      Loading...
    </div>
  ),
});

// Mock Lucide Icons
export const createMockIcons = () => ({
  Search: (props: any) => (
    <span data-testid="search-icon" {...props}>
      🔍
    </span>
  ),
  Menu: (props: any) => (
    <span data-testid="menu-icon" {...props}>
      ☰
    </span>
  ),
  ChevronUp: (props: any) => (
    <span data-testid="chevron-up-icon" {...props}>
      ⌃
    </span>
  ),
  ChevronDown: (props: any) => (
    <span data-testid="chevron-down-icon" {...props}>
      ⌄
    </span>
  ),
  Star: (props: any) => (
    <span data-testid="star-icon" {...props}>
      ⭐
    </span>
  ),
  Heart: (props: any) => (
    <span data-testid="heart-icon" {...props}>
      ❤️
    </span>
  ),
  User: (props: any) => (
    <span data-testid="user-icon" {...props}>
      👤
    </span>
  ),
  Settings: (props: any) => (
    <span data-testid="settings-icon" {...props}>
      ⚙️
    </span>
  ),
  Plus: (props: any) => (
    <span data-testid="plus-icon" {...props}>
      ➕
    </span>
  ),
  X: (props: any) => (
    <span data-testid="x-icon" {...props}>
      ❌
    </span>
  ),
});

// Combined mock setup for complex components
export const setupComprehensiveMocks = (options = {}) => {
  const {
    isSignedIn = true,
    pathname = '/',
    theme = 'light',
    mockData = {},
  } = options as any;

  return {
    ...createMockClerkProvider(isSignedIn),
    ...createMockRouter(pathname),
    ...createMockThemeProvider(theme),
    ...createMockSearchProviders(),
    ...createMockConvexQueries(mockData),
    ...createMockUIComponents(),
    ...createMockIcons(),
  };
};

// Test wrapper component that includes all common providers
export const TestWrapper = ({
  children,
  isSignedIn = true,
  pathname = '/',
  theme = 'light',
  mockData = {},
}: {
  children: React.ReactNode;
  isSignedIn?: boolean;
  pathname?: string;
  theme?: string;
  mockData?: any;
}) => {
  const mocks = setupComprehensiveMocks({
    isSignedIn,
    pathname,
    theme,
    mockData,
  });

  return (
    <mocks.ClerkProvider>
      <mocks.ThemeProvider>
        <div data-testid="test-wrapper">{children}</div>
      </mocks.ThemeProvider>
    </mocks.ClerkProvider>
  );
};

// Hook for setting up mocks in tests
export const useMockSetup = (options = {}) => {
  const mocks = setupComprehensiveMocks(options);

  beforeEach(() => {
    // Apply mocks to vi.mock calls
    Object.entries(mocks).forEach(([key, value]) => {
      (global as any)[`mock${key}`] = value;
    });
  });

  return mocks;
};
