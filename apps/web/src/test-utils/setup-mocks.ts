import { vi } from 'vitest';
import React from 'react';

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const MockIcon = React.forwardRef((props: any, ref: any) =>
    React.createElement('svg', { ...props, ref }, null)
  );
  MockIcon.displayName = 'MockIcon';

  return {
    Plus: MockIcon,
    Search: MockIcon,
    Menu: MockIcon,
    X: MockIcon,
    Bell: MockIcon,
    Home: MockIcon,
    User: MockIcon,
    Settings: MockIcon,
    LogOut: MockIcon,
    LogIn: MockIcon,
    ChevronDown: MockIcon,
    ChevronUp: MockIcon,
    ChevronLeft: MockIcon,
    ChevronRight: MockIcon,
    ArrowLeft: MockIcon,
    ArrowRight: MockIcon,
    Check: MockIcon,
    Star: MockIcon,
    Heart: MockIcon,
    MessageCircle: MockIcon,
    Share: MockIcon,
    MoreVertical: MockIcon,
    MoreHorizontal: MockIcon,
    Edit: MockIcon,
    Trash: MockIcon,
    Copy: MockIcon,
    Download: MockIcon,
    Upload: MockIcon,
    Filter: MockIcon,
    Calendar: MockIcon,
    Clock: MockIcon,
    AlertCircle: MockIcon,
    Info: MockIcon,
    CheckCircle: MockIcon,
    XCircle: MockIcon,
    Loader2: MockIcon,
    RefreshCw: MockIcon,
    Zap: MockIcon,
    TrendingUp: MockIcon,
    Users: MockIcon,
    UserPlus: MockIcon,
    UserMinus: MockIcon,
    UserCheck: MockIcon,
    PlusCircle: MockIcon,
    MinusCircle: MockIcon,
    Circle: MockIcon,
    Square: MockIcon,
    Moon: MockIcon,
    Sun: MockIcon,
    Sparkles: MockIcon,
    Hash: MockIcon,
    AtSign: MockIcon,
    Link: MockIcon,
    ExternalLink: MockIcon,
    Eye: MockIcon,
    EyeOff: MockIcon,
    Camera: MockIcon,
    Image: MockIcon,
    Video: MockIcon,
    Music: MockIcon,
    Mic: MockIcon,
    Volume2: MockIcon,
    VolumeX: MockIcon,
    Wifi: MockIcon,
    WifiOff: MockIcon,
    Battery: MockIcon,
    BatteryCharging: MockIcon,
    Bluetooth: MockIcon,
    Globe: MockIcon,
    Map: MockIcon,
    MapPin: MockIcon,
    Navigation: MockIcon,
    Compass: MockIcon,
    Activity: MockIcon,
    Award: MockIcon,
    Badge: MockIcon,
    Flag: MockIcon,
    Gift: MockIcon,
    Package: MockIcon,
    ShoppingCart: MockIcon,
    ShoppingBag: MockIcon,
    Tag: MockIcon,
    Bookmark: MockIcon,
    Save: MockIcon,
    Folder: MockIcon,
    FolderOpen: MockIcon,
    File: MockIcon,
    FileText: MockIcon,
    Paperclip: MockIcon,
    Inbox: MockIcon,
    Send: MockIcon,
    Archive: MockIcon,
    Trash2: MockIcon,
    Move: MockIcon,
    Maximize: MockIcon,
    Minimize: MockIcon,
    Expand: MockIcon,
    Shrink: MockIcon,
    Command: MockIcon,
    Cloud: MockIcon,
    Database: MockIcon,
    Server: MockIcon,
    Monitor: MockIcon,
    Smartphone: MockIcon,
    Tablet: MockIcon,
    Laptop: MockIcon,
    Cpu: MockIcon,
    HardDrive: MockIcon,
    Printer: MockIcon,
    Mouse: MockIcon,
    Keyboard: MockIcon,
    Headphones: MockIcon,
    Watch: MockIcon,
    Tv: MockIcon,
    Radio: MockIcon,
    Cast: MockIcon,
    Airplay: MockIcon,
    Anchor: MockIcon,
    Aperture: MockIcon,
    BarChart: MockIcon,
    BarChart2: MockIcon,
    PieChart: MockIcon,
    TrendingDown: MockIcon,
    Code: MockIcon,
    Terminal: MockIcon,
    Codepen: MockIcon,
    Codesandbox: MockIcon,
    Coffee: MockIcon,
    Columns: MockIcon,
    Grid: MockIcon,
    Layout: MockIcon,
    Layers: MockIcon,
    LifeBuoy: MockIcon,
    List: MockIcon,
    Lock: MockIcon,
    Unlock: MockIcon,
    Shield: MockIcon,
    ShieldCheck: MockIcon,
    ShieldX: MockIcon,
    Key: MockIcon,
    CreditCard: MockIcon,
    DollarSign: MockIcon,
    Percent: MockIcon,
    Calculator: MockIcon,
    Briefcase: MockIcon,
    Building: MockIcon,
    Clipboard: MockIcon,
    FileCheck: MockIcon,
    FilePlus: MockIcon,
    FileMinus: MockIcon,
    FileX: MockIcon,
    GitBranch: MockIcon,
    GitCommit: MockIcon,
    GitMerge: MockIcon,
    GitPullRequest: MockIcon,
    Github: MockIcon,
    Gitlab: MockIcon,
    HelpCircle: MockIcon,
    MessageSquare: MockIcon,
    MessagesSquare: MockIcon,
    Palette: MockIcon,
    Pencil: MockIcon,
    PenTool: MockIcon,
    Phone: MockIcon,
    PhoneCall: MockIcon,
    PhoneIncoming: MockIcon,
    PhoneOutgoing: MockIcon,
    PhoneOff: MockIcon,
    Play: MockIcon,
    Pause: MockIcon,
    PlayCircle: MockIcon,
    PauseCircle: MockIcon,
    SkipBack: MockIcon,
    SkipForward: MockIcon,
    Rewind: MockIcon,
    FastForward: MockIcon,
    RotateCcw: MockIcon,
    RotateCw: MockIcon,
    Repeat: MockIcon,
    Repeat1: MockIcon,
    Shuffle: MockIcon,
    Sliders: MockIcon,
    Settings2: MockIcon,
    Tool: MockIcon,
    Type: MockIcon,
    Underline: MockIcon,
    Italic: MockIcon,
    Bold: MockIcon,
    AlignLeft: MockIcon,
    AlignCenter: MockIcon,
    AlignRight: MockIcon,
    AlignJustify: MockIcon,
    ZoomIn: MockIcon,
    ZoomOut: MockIcon,
  };
});

// Mock @clerk/tanstack-react-start
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
  SignInButton: ({ children }: any) =>
    React.createElement('div', null, children),
  SignUpButton: ({ children }: any) =>
    React.createElement('div', null, children),
  SignOutButton: ({ children }: any) =>
    React.createElement('div', null, children),
  UserButton: () => React.createElement('div', null, 'User Button'),
}));

// Mock @convex-dev/react-query
vi.mock('@convex-dev/react-query', () => ({
  convexQuery: (query: any, args: any) => ({
    queryKey: ['convexQuery', query?.toString() || '', args],
    queryFn: async () => {
      const queryString = query?.toString() || '';

      // Mock emoji queries
      if (queryString.includes('emojis.getPopular')) {
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

      if (queryString.includes('emojis.search')) {
        if (args?.searchTerm === 'fire') {
          return [
            { _id: '1', emoji: '🔥', category: 'objects', description: 'Fire' },
            {
              _id: '4',
              emoji: '🔴',
              category: 'symbols',
              description: 'Red Circle',
            },
          ];
        }
        if (args?.searchTerm === 'xyzabc123notfound') {
          return [];
        }
        return [
          {
            _id: '5',
            emoji: '😀',
            category: 'smileys',
            description: 'Grinning Face',
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
        ];
      }

      if (queryString.includes('emojis.getCategories')) {
        return ['popular', 'smileys', 'hands', 'objects', 'symbols'];
      }

      // Mock user queries
      if (queryString.includes('users.current')) {
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
    const queryString = query?.toString() || '';

    if (queryString.includes('emojis')) {
      return {
        data: [],
        isLoading: false,
        error: null,
      };
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

// Mock theme provider
vi.mock('@/features/theming/components/theme-provider', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    theme: 'light',
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: any) => children,
}));

// Mock theme store
vi.mock('@/stores/theme-store', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useSearch: () => ({}),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
  }),
  Link: ({ children, ...props }: any) =>
    React.createElement('a', props, children),
  Outlet: () => null,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) =>
      React.createElement('div', props, children),
    span: ({ children, ...props }: any) =>
      React.createElement('span', props, children),
    button: ({ children, ...props }: any) =>
      React.createElement('button', props, children),
    a: ({ children, ...props }: any) =>
      React.createElement('a', props, children),
  },
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({
    start: vi.fn(),
    set: vi.fn(),
    stop: vi.fn(),
    mount: vi.fn(),
  }),
  useMotionValue: () => ({
    get: () => 0,
    set: vi.fn(),
  }),
  useTransform: () => 0,
  useSpring: () => 0,
  useScroll: () => ({
    scrollY: { get: () => 0 },
    scrollX: { get: () => 0 },
    scrollYProgress: { get: () => 0 },
    scrollXProgress: { get: () => 0 },
  }),
  useInView: () => true,
}));

// Mock posthog
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
}));

// Mock convex/react
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
