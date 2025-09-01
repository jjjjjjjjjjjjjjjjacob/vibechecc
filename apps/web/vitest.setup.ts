/// <reference lib="dom" />
import { vi, afterEach } from 'vitest';
import React from 'react';

// Mock all external modules before anything else
vi.mock('lucide-react', () => {
  const MockIcon = React.forwardRef((props: any, ref: any) =>
    React.createElement('svg', { ...props, ref }, null)
  );
  MockIcon.displayName = 'MockIcon';

  // List of all icons used in the codebase
  const iconNames = [
    'AlertCircle',
    'AlertTriangle',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowUpDown',
    'Bell',
    'Calendar',
    'CalendarDays',
    'Camera',
    'Check',
    'CheckCircle',
    'CheckIcon',
    'ChevronDown',
    'ChevronDownIcon',
    'ChevronLeft',
    'ChevronRight',
    'ChevronUp',
    'ChevronUpIcon',
    'Circle',
    'CircleIcon',
    'Clock',
    'Copy',
    'Download',
    'Edit',
    'Edit2',
    'Eye',
    'Filter',
    'Flag',
    'Flame',
    'Hash',
    'Heart',
    'Home',
    'Image',
    'Instagram',
    'ImageIcon',
    'Info',
    'Laptop',
    'Layers',
    'LayoutGrid',
    'List',
    'Loader2',
    'LogIn',
    'LogOut',
    'MessageCircle',
    'MessageSquare',
    'Moon',
    'Maximize2',
    'Minimize2',
    'Monitor',
    'MoreHorizontal',
    'Music2',
    'Palette',
    'PanelLeftIcon',
    'Plus',
    'PlusCircle',
    'Search',
    'SearchIcon',
    'Settings',
    'Settings2',
    'Share',
    'Shield',
    'SlidersHorizontal',
    'Smartphone',
    'Sparkles',
    'Star',
    'Sun',
    'Tag',
    'Trash2',
    'TrendingUp',
    'Trophy',
    'Twitter',
    'Type',
    'User',
    'UserMinus',
    'UserPlus',
    'Users',
    'X',
    'XIcon',
    'Zap',
    'ZoomIn',
    'ZoomOut',
    'Minimize2',
  ];

  // Create exports object with all icon names mapped to MockIcon
  const mockExports: Record<string, any> = {};
  iconNames.forEach((iconName) => {
    mockExports[iconName] = MockIcon;
  });

  return mockExports;
});

vi.mock('@clerk/tanstack-react-start', () => ({
  ClerkProvider: ({ children }: any) => children,
  useUser: () => ({
    user: {
      id: 'test-user-123',
      username: 'testuser',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
    isSignedIn: true,
    isLoaded: true,
  }),
  useAuth: () => ({
    isSignedIn: true,
    isLoaded: true,
    userId: 'test-user-123',
    sessionId: 'test-session',
    getToken: vi.fn().mockResolvedValue('test-token'),
  }),
  SignedIn: ({ children }: any) => children,
  SignedOut: ({ children: _children }: any) => null, // Return null for signed out state in tests
  SignInButton: ({ children }: any) =>
    React.createElement('div', null, children),
  SignUpButton: ({ children }: any) =>
    React.createElement('div', null, children),
  SignOutButton: ({ children }: any) =>
    React.createElement('div', null, children),
  UserButton: () => React.createElement('div', null, 'User Button'),
}));

// Create a simpler API mock structure
const api = {
  emojis: {
    getPopular: 'emojis.getPopular',
    search: 'emojis.search',
    getCategories: 'emojis.getCategories',
  },
  users: {
    current: 'users.current',
    getAll: 'users.getAll',
    getById: 'users.getById',
    create: 'users.create',
    update: 'users.update',
  },
  vibes: {
    getAll: 'vibes.getAll',
    getAllSimple: 'vibes.getAllSimple',
    getById: 'vibes.getById',
    create: 'vibes.create',
    update: 'vibes.update',
    quickReact: 'vibes.quickReact',
  },
  notifications: {
    getNotifications: 'notifications.getNotifications',
    markAsRead: 'notifications.markAsRead',
  },
  emojiRatings: {
    createOrUpdateEmojiRating: 'emojiRatings.createOrUpdateEmojiRating',
  },
  files: {
    getUrl: 'files.getUrl',
  },
  social: {
    connections: {
      getSocialConnections: 'social.connections.getSocialConnections',
    },
  },
};

vi.mock('@vibechecc/convex', () => ({
  api,
}));

vi.mock('@convex-dev/react-query', () => ({
  convexQuery: (query: any, args: any) => ({
    queryKey: ['convexQuery', String(query), args],
    queryFn: async () => {
      const queryString = String(query);

      // Mock emoji queries
      if (queryString.includes('getPopular')) {
        return [
          { _id: '1', emoji: '🔥', category: 'popular', description: 'Fire' },
          {
            _id: '2',
            emoji: '😍',
            category: 'popular',
            description: 'Heart Eyes',
          },
          {
            _id: '3',
            emoji: '💯',
            category: 'popular',
            description: 'Hundred',
          },
        ];
      }

      if (queryString.includes('search')) {
        if (args?.searchTerm === 'fire') {
          return {
            emojis: [
              {
                _id: '1',
                emoji: '🔥',
                category: 'objects',
                description: 'Fire',
              },
              {
                _id: '4',
                emoji: '🔴',
                category: 'symbols',
                description: 'Red Circle',
              },
            ],
            hasMore: false,
          };
        }
        if (args?.searchTerm === 'xyzabc123notfound') {
          return {
            emojis: [],
            hasMore: false,
          };
        }
        return {
          emojis: [
            {
              _id: '5',
              emoji: '😀',
              category: 'smileys',
              description: 'Grinning Face',
            },
            {
              _id: '10',
              emoji: '😃',
              category: 'smileys',
              description: 'Grinning Face with Big Eyes',
            },
            {
              _id: '6',
              emoji: '👋',
              category: 'hands',
              description: 'Waving Hand',
            },
            {
              _id: '7',
              emoji: '👍',
              category: 'hands',
              description: 'Thumbs Up',
            },
            { _id: '8', emoji: '👨', category: 'people', description: 'Man' },
            { _id: '9', emoji: '👩', category: 'people', description: 'Woman' },
          ],
          hasMore: false,
        };
      }

      if (queryString.includes('getCategories')) {
        return ['popular', 'smileys', 'people', 'hands', 'objects', 'symbols'];
      }

      // Mock user queries
      if (queryString.includes('current')) {
        return {
          id: 'test-user-123',
          username: 'testuser',
          emailAddresses: [{ emailAddress: 'test@example.com' }],
        };
      }

      // Mock vibes queries
      if (queryString.includes('vibes')) {
        return {
          vibes: [],
          continueCursor: null,
          hasMore: false,
        };
      }

      // Mock notifications
      if (queryString.includes('notifications')) {
        return {
          notifications: [],
          hasMore: false,
          nextCursor: null,
        };
      }

      return undefined;
    },
  }),
  useConvexQuery: (query: any, _args: any) => {
    const queryString = String(query);

    if (queryString.includes('emojis')) {
      return {
        data: [],
        isLoading: false,
        error: null,
      };
    }

    if (queryString.includes('getSocialConnections')) {
      return [];
    }

    return {
      data: undefined,
      isLoading: false,
      error: null,
    };
  },
  useConvexMutation: () => vi.fn(),
  useConvexAction: () => vi.fn(),
}));

vi.mock('@/features/theming/components/theme-provider', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    theme: 'light',
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: any) => children,
}));

vi.mock('@/stores/theme-store', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    theme: 'light',
    setTheme: vi.fn(),
  }),
  useThemeStore: (selector: any) => {
    const mockStore = {
      theme: 'light',
      mode: 'light',
      primaryColor: 'blue',
      accentColor: 'purple',
      setPrimaryColor: vi.fn(),
      setAccentColor: vi.fn(),
      setTheme: vi.fn(),
      setMode: vi.fn(),
      resolvedTheme: 'light',
      initializeTheme: vi.fn(),
      colorTheme: 'blue',
      secondaryColorTheme: 'purple',
      setColorTheme: vi.fn(),
      setSecondaryColorTheme: vi.fn(),
    };
    return selector ? selector(mockStore) : mockStore;
  },
}));

// Create a mock for route search params that can be customized per test
let mockSearchParams = {};
let mockRouteParams = {};

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => mockRouteParams,
  useSearch: () => mockSearchParams,
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
  }),
  useRouter: () => ({
    navigate: vi.fn(),
    history: {
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    },
  }),
  Link: ({ children, ...props }: any) =>
    React.createElement('a', props, children),
  Outlet: () => null,
  RouterProvider: ({ children }: any) => children,
  createFileRoute: (_path: string) => {
    // Return a function that accepts route options and returns the Route object
    return (options: any = {}) => ({
      useSearch: () => mockSearchParams,
      useParams: () => mockRouteParams,
      useNavigate: () => vi.fn(),
      component: options.component,
      options: {
        component: options.component,
      },
    });
  },
  createRootRoute: () => ({
    options: {
      component: vi.fn(),
    },
    addChildren: vi.fn().mockReturnValue({}),
  }),
  createRoute: vi.fn().mockReturnValue({
    options: {
      component: vi.fn(),
    },
  }),
  createRouter: vi.fn().mockReturnValue({
    navigate: vi.fn(),
    history: {
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    },
  }),
}));

// Export function to set mock search params for tests
(globalThis as any).setMockSearchParams = (params: any) => {
  mockSearchParams = params;
};

// Export function to set mock route params for tests
(globalThis as any).setMockRouteParams = (params: any) => {
  mockRouteParams = params;
};

vi.mock('@/lib/posthog', () => ({
  trackEvents: {
    pageViewed: vi.fn(),
    emojiReactionClicked: vi.fn(),
    emojiRatingOpened: vi.fn(),
    emojiPopoverOpened: vi.fn(),
    emojiPopoverClosed: vi.fn(),
    searchPerformed: vi.fn(),
    filterApplied: vi.fn(),
    vibeCreated: vi.fn(),
    vibeDeleted: vi.fn(),
    userFollowed: vi.fn(),
    userUnfollowed: vi.fn(),
  },
  posthog: {
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
  analytics: {
    init: vi.fn(),
    capturePageView: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    capture: vi.fn(),
    setPersonProperties: vi.fn(),
    isInitialized: vi.fn().mockReturnValue(true),
  },
}));

vi.mock('convex/react', () => ({
  ConvexProvider: ({ children }: any) => children,
  ConvexReactClient: class {
    constructor() {}
    setAuth() {}
    clearAuth() {}
  },
  useConvex: () => ({
    query: vi.fn(),
    mutation: vi.fn(),
    action: vi.fn(),
  }),
}));

vi.mock('vaul', () => ({
  Drawer: {
    Root: ({ children }: any) => children,
    Trigger: ({ children }: any) =>
      React.createElement('button', null, children),
    Portal: ({ children }: any) => children,
    Overlay: ({ children }: any) => React.createElement('div', null, children),
    Content: ({ children }: any) => React.createElement('div', null, children),
    Handle: () => React.createElement('div', null),
    Title: ({ children }: any) => React.createElement('h2', null, children),
    Description: ({ children }: any) =>
      React.createElement('p', null, children),
  },
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/use-tablet', () => ({
  useIsTablet: () => false,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
  },
  Toaster: () => null,
}));

// Now import jest-dom and cleanup
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLElement.prototype methods that might be missing
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
}
