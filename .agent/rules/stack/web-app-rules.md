# Web Application Stack Rules - vibechecc Frontend

This document defines the definitive rules and patterns for frontend development in the vibechecc web application.

## 1. TanStack Start Rules

### File-Based Routing

**MUST follow TanStack Router conventions:**

```typescript
// ✅ CORRECT - Route parameter files
$vibeId.tsx; // Dynamic route parameter
$username.tsx / // Dynamic route parameter
  // ✅ CORRECT - Nested routes
  vibes /
  $vibeId /
  index.tsx / // /vibes/:vibeId
  users /
  $username /
  index.tsx; // /users/:username

// ❌ INCORRECT - Don't rename route parameter files
vibeId.tsx; // Wrong - missing $ prefix
```

**Navigation Patterns:**

```typescript
// ✅ CORRECT - Use router hooks for navigation
import { useRouter } from '@tanstack/react-router';

const router = useRouter();
router.navigate({ to: '/vibes/$vibeId', params: { vibeId: id } });

// ✅ CORRECT - Link component usage
<Link to="/vibes/$vibeId" params={{ vibeId: vibe._id }}>
  View Vibe
</Link>
```

### Server-Side Rendering (SSR)

**MUST use proper data loading patterns:**

```typescript
// ✅ CORRECT - beforeLoad for data-driven redirects
beforeLoad: async ({ params, context }) => {
  const data = await context.convexClient.query(api.something.get, { id });

  if (!data?.expectedField) {
    throw redirect({ to: '/', search: { error: 'Not found' } });
  }

  throw redirect({ to: `/somewhere/${data.id}` });
};

// ❌ INCORRECT - Never wrap redirects in try-catch
beforeLoad: async ({ params, context }) => {
  try {
    const data = await context.convexClient.query(api.something.get, { id });
    throw redirect({ to: `/somewhere/${data.id}` }); // Gets caught!
  } catch (error) {
    throw redirect({ to: '/' }); // Redirect ends up here
  }
};
```

**Route Component Requirements:**

- Route components MUST be default exports
- Nested routes inherit parent layouts automatically
- Use file-based routing in `src/routes/`

## 2. React Component Rules

### Component Structure Template

**MUST follow this component structure:**

```typescript
// Component imports
import React from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@vibechecc/types';
import { api } from '@vibechecc/convex';
import { cn } from '@/utils/tailwind-utils';

// Props interface with JSDoc
interface ComponentProps {
  /** User data from Convex */
  user: User;
  /** Optional className for styling */
  className?: string;
  /** Callback for user interactions */
  onAction?: (userId: string) => void;
}

// Component implementation
export function ComponentName({ user, className, onAction }: ComponentProps) {
  // Hooks at top
  const [isLoading, setIsLoading] = React.useState(false);

  // Event handlers
  const handleClick = React.useCallback(() => {
    if (onAction) {
      onAction(user._id);
    }
  }, [onAction, user._id]);

  // Render
  return (
    <div className={cn('default-classes', className)}>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Action'}
      </Button>
    </div>
  );
}
```

### Props Patterns

**MUST use TypeScript interfaces for props:**

```typescript
// ✅ CORRECT - Descriptive interface with JSDoc
interface EmojiRatingDisplayProps {
  /** Rating data from Convex query */
  rating: EmojiRating;
  /** Whether to show the 5-emoji visual scale */
  showScale?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ❌ INCORRECT - Inline prop types
export function Component({ rating }: { rating: any }) {
  // ...
}
```

### Hook Usage Patterns

**MUST follow React hook rules:**

```typescript
// ✅ CORRECT - Hooks at component top
export function Component() {
  const [state, setState] = React.useState(false);
  const query = useQuery({ ...convexQuery(api.data.get, {}) });
  const mutation = useMutation(api.data.update);

  // Event handlers after hooks
  const handleAction = React.useCallback(() => {
    mutation.mutate({ id: 'test' });
  }, [mutation]);

  // Conditional logic after hooks
  if (query.isLoading) return <div>Loading...</div>;

  return <div>{/* component */}</div>;
}
```

### Component Complexity Limits

**MUST NOT exceed these limits:**

- **300 lines maximum** per component file
- **5 useState hooks maximum** per component
- **Split large components** into smaller, focused components

**Example of component that needs splitting:**

```typescript
// ❌ INCORRECT - Too complex (810 lines)
export function VibeCard() {
  // Contains 5+ variants, complex state, embedded components
  // MUST split into: VibeCardBase, VibeCardCompact, VibeCardList
}

// ✅ CORRECT - Split into focused components
export function VibeCardBase({ variant, ...props }: VibeCardProps) {
  switch (variant) {
    case 'compact': return <VibeCardCompact {...props} />;
    case 'list': return <VibeCardList {...props} />;
    default: return <VibeCardDefault {...props} />;
  }
}
```

## 3. Styling Rules

### Theme Color Usage

**MUST use themed colors only:**

```typescript
// ✅ CORRECT - Themed colors
className = 'bg-theme-primary text-primary-foreground';
className = 'bg-secondary hover:bg-secondary/80';
className = 'text-muted-foreground border-muted';

// ❌ INCORRECT - Hardcoded colors
className = 'bg-pink-500 text-blue-600';
className = 'border-purple-500';
```

**Color Priority System:**

1. **Semantic colors** (highest priority): `primary`, `background`, `muted`
2. **Theme colors**: `theme-primary`, `theme-secondary`
3. **Mode-aware colors**: `text-foreground`, `bg-background`
4. **Never hardcoded colors**: No `bg-pink-500`, hex values, RGB/HSL

### Responsive Design Rules

**MUST use mobile-first approach:**

```typescript
// ✅ CORRECT - Mobile-first responsive classes
className="p-3 sm:p-4 lg:p-6"           // 12px → 16px → 24px
className="text-sm sm:text-base lg:text-lg"  // Progressive text sizing
className="gap-2 sm:gap-3 lg:gap-4"         // Progressive spacing

// ✅ CORRECT - Responsive layout
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

### Animation Performance Rules

**MUST optimize for 60fps performance:**

```typescript
// ✅ CORRECT - Performance-optimized animations
className =
  'transition-transform duration-200 will-change-transform hover:scale-[1.02]';
className = 'transition-shadow duration-150 hover:shadow-md';
className = 'transition-colors duration-200';

// ❌ INCORRECT - Performance-heavy animations
className = 'transition-all duration-300 hover:scale-105'; // Expensive
```

**Mobile animation optimizations:**

```css
/* MUST include mobile-specific optimizations */
@media (max-width: 768px) {
  .hover\:scale-\[1\.02\]:hover {
    transform: scale(1.01) !important;
  }

  @media (max-width: 480px) {
    .hover\:scale-\[1\.02\]:hover {
      transform: none !important;
    }
  }
}
```

### File Naming Rules

**MUST use kebab-case for all files:**

```bash
# ✅ CORRECT
user-profile.tsx
emoji-rating-display.tsx
use-follow-stats.ts

# ❌ INCORRECT
UserProfile.tsx           # PascalCase
emoji_rating_display.tsx  # snake_case
useFollowStats.ts         # camelCase
```

## 4. State Management Rules

### TanStack Query with Convex

**MUST spread convexQuery results:**

```typescript
// ✅ CORRECT - Spread convexQuery result
const result = useQuery({
  ...convexQuery(api.emojis.search, { searchTerm }),
  enabled: !!searchTerm,
});

// CRITICAL: Always pass empty object for queries with no parameters
const result = useQuery({
  ...convexQuery(api.users.list, {}), // NOT undefined!
});

// ❌ INCORRECT - Direct usage causes TypeError
const result = useQuery(convexQuery(api.emojis.search, { searchTerm }));
```

### Infinite Queries Pattern

**MUST use proper infinite query structure:**

```typescript
// ✅ CORRECT - Infinite query setup
const notificationQuery = useInfiniteQuery({
  ...convexInfiniteQuery(api.notifications.list, {
    type: filter === 'all' ? undefined : filter,
  }),
  getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
  enabled: open, // Only run when needed
});

// ✅ CORRECT - Data flattening
const notifications = React.useMemo(() => {
  if (!notificationQuery.data?.pages) return [];
  return notificationQuery.data.pages.flatMap(
    (page: any) => page?.notifications || []
  );
}, [notificationQuery.data]);
```

### Form State Management

**MUST use React Hook Form with zod:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(1, 'Title required'),
  content: z.string().min(1, 'Content required'),
});

type FormData = z.infer<typeof formSchema>;

export function FormComponent() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', content: '' },
  });

  const mutation = useMutation(api.vibes.create);

  const onSubmit = async (data: FormData) => {
    try {
      await mutation.mutateAsync(data);
      form.reset();
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Real-time Updates

**MUST use Convex subscriptions:**

```typescript
// ✅ CORRECT - Automatic real-time updates
const { data: vibes } = useQuery({
  ...convexQuery(api.vibes.list, {}),
  // Convex handles real-time subscriptions automatically
});

// ❌ INCORRECT - Manual WebSocket management not needed
// Don't manually manage WebSocket connections with Convex
```

## 5. Performance Rules

### Code Splitting

**MUST implement lazy loading for routes:**

```typescript
// ✅ CORRECT - Lazy route loading
import { lazy } from 'react';

const UserProfile = lazy(() => import('@/features/users/user-profile'));
const VibeFeed = lazy(() => import('@/features/vibes/vibe-feed'));

// Use with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <UserProfile />
</Suspense>
```

### List Rendering Optimization

**MUST virtualize large lists:**

```typescript
// ✅ CORRECT - Virtualization for 50+ items
import { FixedSizeList as List } from 'react-window';

export function LargeList({ items }: { items: any[] }) {
  if (items.length > 50) {
    return (
      <List
        height={600}
        itemCount={items.length}
        itemSize={100}
      >
        {({ index, style }) => (
          <div style={style}>
            <ListItem item={items[index]} />
          </div>
        )}
      </List>
    );
  }

  // Regular rendering for small lists
  return (
    <div>
      {items.map(item => <ListItem key={item.id} item={item} />)}
    </div>
  );
}
```

### Image Optimization

**MUST implement proper image loading:**

```typescript
// ✅ CORRECT - Optimized image loading
<img
  src={imageUrl}
  alt={altText}
  loading="lazy"
  width={150}
  height={150}
  className="aspect-square object-cover"
/>

// ✅ CORRECT - Progressive loading with placeholder
<div className="bg-muted animate-pulse aspect-square">
  {imageLoaded && (
    <img
      src={imageUrl}
      alt={altText}
      onLoad={() => setImageLoaded(true)}
      className="aspect-square object-cover"
    />
  )}
</div>
```

### Memoization Rules

**MUST use memoization strategically:**

```typescript
// ✅ CORRECT - Memoize expensive calculations
const expensiveValue = React.useMemo(() => {
  return items.reduce((acc, item) => acc + item.value, 0);
}, [items]);

// ✅ CORRECT - Memoize callback functions
const handleClick = React.useCallback(
  (id: string) => {
    onItemClick?.(id);
  },
  [onItemClick]
);

// ❌ INCORRECT - Over-memoization
const simpleValue = React.useMemo(() => user.name, [user.name]); // Unnecessary
```

## 6. UI Component Rules

### shadcn/ui Component Usage

**MUST import shadcn components correctly:**

```typescript
// ✅ CORRECT - shadcn/ui imports (ONLY in apps/web)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

// ❌ INCORRECT - shadcn imports in other workspaces
// Never attempt shadcn imports outside apps/web/
```

### Custom Component Patterns

**MUST follow compound component pattern:**

```typescript
// ✅ CORRECT - Compound component
export function EmojiRatingDisplay({ children, ...props }: EmojiRatingDisplayProps) {
  return (
    <div className="emoji-rating" {...props}>
      {children}
    </div>
  );
}

EmojiRatingDisplay.Scale = function Scale({ ratings }: { ratings: EmojiRating[] }) {
  return (
    <div className="flex gap-1">
      {ratings.map(rating => (
        <span key={rating.emoji}>{rating.emoji}</span>
      ))}
    </div>
  );
};

// Usage
<EmojiRatingDisplay rating={rating}>
  <EmojiRatingDisplay.Scale ratings={ratings} />
</EmojiRatingDisplay>
```

### Accordion Pattern for Long Lists

**MUST use accordion for 3+ items:**

```typescript
// ✅ CORRECT - Accordion pattern implementation
export function LongList({ items }: { items: any[] }) {
  const visibleItems = items.slice(0, 3);
  const hiddenItems = items.slice(3);

  return (
    <div>
      {visibleItems.map(item => (
        <ListItem key={item.id} item={item} />
      ))}

      {hiddenItems.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="more">
            <AccordionTrigger className="text-xs text-muted-foreground">
              {hiddenItems.length} more
            </AccordionTrigger>
            <AccordionContent>
              {hiddenItems.map(item => (
                <ListItem key={item.id} item={item} />
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
```

### Accessibility Requirements

**MUST implement WCAG 2.1 AA compliance:**

```typescript
// ✅ CORRECT - Accessible button
<Button
  aria-label="Follow user"
  aria-pressed={isFollowing}
  onClick={handleFollow}
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <Loader className="mr-2 h-4 w-4 animate-spin" />
      <span className="sr-only">Loading...</span>
    </>
  ) : (
    isFollowing ? 'Following' : 'Follow'
  )}
</Button>

// ✅ CORRECT - Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  onClick={handleClick}
>
  Interactive content
</div>
```

## 7. Mobile Responsiveness Rules

### Touch Target Requirements

**MUST ensure minimum 44px touch targets:**

```typescript
// ✅ CORRECT - Adequate touch targets
<Button className="h-11 min-w-[44px] sm:h-12">
  Action
</Button>

// ✅ CORRECT - Touch-friendly interactive areas
<div className="p-4 -m-2 cursor-pointer"> {/* Extends touch area */}
  <div className="text-sm">Small text content</div>
</div>
```

### Responsive Breakpoint System

**MUST use consistent breakpoints:**

```typescript
// Breakpoint system (Tailwind defaults)
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px

// ✅ CORRECT - Progressive enhancement
className = 'text-sm sm:text-base md:text-lg'; // Text sizing
className = 'p-3 sm:p-4 md:p-6 lg:p-8'; // Spacing
className = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'; // Layout
```

### Mobile-First Animation Rules

**MUST respect reduced motion preferences:**

```typescript
// ✅ CORRECT - Respect user preferences
className = 'motion-reduce:transition-none motion-reduce:animate-none';

// ✅ CORRECT - Mobile-optimized animations
className =
  'transition-transform duration-200 hover:scale-[1.02] motion-reduce:hover:scale-100';
```

### Mobile Navigation Patterns

**MUST implement mobile-specific navigation:**

```typescript
// ✅ CORRECT - Mobile drawer pattern
export function MobileNavigation() {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="h-[80vh]">
          <NavigationContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuContent className="w-96">
        <NavigationContent />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## 8. Build & Development Rules

### Import Organization

**MUST follow import order:**

```typescript
// 1. React and external libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 3. Feature components
import { UserProfile } from '@/features/users/user-profile';

// 4. Workspace packages
import type { User, Vibe } from '@vibechecc/types';
import { api } from '@vibechecc/convex';
import { computeUserDisplayName } from '@vibechecc/utils';

// 5. Local utilities
import { cn } from '@/utils/tailwind-utils';
import { formatDate } from '@/utils/date-utils';

// 6. Types (if not already imported)
import type { ComponentProps } from './types';
```

### Workspace Import Rules

**MUST use correct workspace imports:**

```typescript
// ✅ CORRECT - Workspace imports
import type { User, Vibe, Rating } from '@vibechecc/types';
import { api } from '@vibechecc/convex';
import { computeUserDisplayName } from '@vibechecc/utils';

// ❌ INCORRECT - Local imports for workspace packages
import type { User } from '@/types'; // Non-existent directory
import { api } from '../convex'; // Incorrect relative import
```

### Development Commands

**MUST use correct development commands:**

```bash
# Development
bun run dev                    # Full stack development
bun run dev:frontend          # Frontend only
bun run dev:backend           # Backend only

# Quality checks
bun run quality              # TypeScript + lint + format check
bun run quality:fix          # Fix linting and formatting
bun run typecheck           # TypeScript only

# Testing
bun run test                # All tests
bun nx test web            # Frontend tests only
```

### TypeScript Configuration

**MUST maintain strict TypeScript settings:**

```typescript
// ✅ CORRECT - Strict TypeScript usage
interface Props {
  user: User; // Explicit types
  onAction?: (id: string) => void; // Optional with clear signature
}

// ✅ CORRECT - Type guards
function isValidUser(user: unknown): user is User {
  return typeof user === 'object' && user !== null && '_id' in user;
}

// ❌ INCORRECT - Any usage
const user: any = data; // Avoid any types
function handler(data: any) {} // Explicit types required
```

## Testing Requirements

### Component Testing Standards

**MUST include reference in test files:**

```typescript
/// <reference lib="dom" />

import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { UserProfile } from './user-profile';

afterEach(cleanup);

describe('UserProfile', () => {
  test('renders user information correctly', () => {
    const mockUser = {
      _id: 'user123',
      name: 'John Doe',
      email: 'john@example.com'
    };

    render(<UserProfile user={mockUser} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

### Testing Coverage Requirements

**MUST achieve minimum test coverage:**

- **70% statement coverage** minimum
- **All critical components** must have tests
- **User interaction flows** must be tested
- **Error boundaries** must be tested

### Convex Integration Testing

**MUST mock Convex hooks in tests:**

```typescript
import { vi } from 'vitest';

// Mock Convex hooks
vi.mock('@/queries', () => ({
  useUserQuery: vi.fn(() => ({
    data: mockUser,
    isLoading: false,
    error: null,
  })),
}));
```

## Error Handling Patterns

### Boundary Implementation

**MUST implement error boundaries:**

```typescript
// ✅ CORRECT - Error boundary component
export class ComponentErrorBoundary extends React.Component {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <p className="text-destructive">Something went wrong</p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Loading and Error States

**MUST implement proper loading states:**

```typescript
// ✅ CORRECT - Comprehensive state handling
export function DataComponent() {
  const { data, isLoading, error, refetch } = useQuery({
    ...convexQuery(api.data.get, {}),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-2">Failed to load data</p>
        <Button onClick={() => refetch()} variant="outline">
          Try again
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div>
      {data.map(item => (
        <DataItem key={item.id} item={item} />
      ))}
    </div>
  );
}
```

## Performance Monitoring

### Core Web Vitals Requirements

**MUST optimize for Core Web Vitals:**

- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1

### Bundle Size Limits

**MUST maintain bundle size limits:**

- **Main bundle**: < 250kb gzipped
- **Route chunks**: < 100kb gzipped each
- **Use bundle analyzer** to monitor size

### Image Optimization Requirements

**MUST optimize all images:**

```typescript
// ✅ CORRECT - Optimized image loading
<img
  src={optimizedImageUrl}
  alt={descriptiveAlt}
  width={width}
  height={height}
  loading="lazy"
  decoding="async"
  className="aspect-square object-cover"
/>
```

This comprehensive guide defines the standards for building high-quality, performant, and maintainable frontend applications in the vibechecc project. All development must adhere to these rules to ensure consistency, quality, and optimal user experience across all devices and use cases.
