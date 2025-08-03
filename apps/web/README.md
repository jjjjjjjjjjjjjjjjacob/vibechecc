# viberatr Web App

> **Note:** For monorepo setup, scripts, and infrastructure, see the [root README.md](../../README.md).

A modern social web application built with TanStack Start where users can share "vibes" (life experiences, thoughts, situations), rate and react to others' vibes with emojis and stars, and discover trending content through advanced search and filtering.

## Quick Start

1. **Clone the repository** and install dependencies:

   ```bash
   git clone [repository-url]
   cd viberatr
   bun install
   ```

2. **Start the development environment**:

   ```bash
   bun run dev  # Starts both frontend and backend
   ```

3. **Run quality checks**:
   ```bash
   bun run quality  # TypeScript, linting, and formatting
   ```

## Tech Stack

- **Frontend**: TanStack Start, shadcn/ui, Tailwind CSS v4, TanStack Query/Router, Framer Motion
- **Backend**: Convex (real-time DB + serverless functions), Clerk (auth)
- **Infrastructure**: Cloudflare Workers, Terraform, ngrok (local webhooks)
- **Development**: Bun, Nx, Vitest, TypeScript, ESLint, Prettier

## Architecture Overview

### Frontend Architecture

The web app follows a **feature-based component organization**:

```
apps/web/src/
├── components/                 # Shared/general components
│   ├── ui/                    # shadcn/ui primitives ONLY
│   ├── skeletons/             # Loading state components
│   └── [general components]   # Header, forms, layouts
├── features/                  # Feature-specific components
│   ├── ratings/               # Emoji & star rating system
│   ├── theming/               # Theme provider & controls
│   ├── profiles/              # User profile management
│   ├── search/                # Search functionality
│   └── vibes/                 # Vibe creation & display
├── routes/                    # TanStack Router pages
├── utils/                     # App-specific utilities
└── __tests__/                 # Test utilities & mocks
```

## Development Commands

### Core Commands

```bash
bun run dev           # Start full dev environment (frontend + backend)
bun run dev:frontend  # Start frontend only
bun run dev:backend   # Start backend only
bun run build         # Build all projects
bun run test          # Run all tests
bun run typecheck     # Type check all projects
bun run lint          # Lint all projects
bun run seed          # Seed database with development data (20 users, 25 vibes)
bun run seed:clear    # Clear all database content
```

### Quality Checks

```bash
bun run quality       # Run typecheck + lint + format check
bun run quality:fix   # Run typecheck + lint fix + format
```

### Testing

- **Framework**: Vitest with Happy DOM
- **Frontend**: @testing-library/react for component testing
- **Backend**: convex-test for Convex function testing
- **Run single test**: `bun nx test web -- <test-file>`

## Development Workflow

### 1. Branch Strategy

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/[name]`**: Feature development
- **`fix/[name]`**: Bug fixes
- **`refactor/[name]`**: Code improvements

### 2. Making Changes

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow our coding standards** (see sections below)

3. **Write or update tests** for your changes

4. **Run quality checks**:

   ```bash
   bun run quality      # All checks
   bun run typecheck    # TypeScript only
   bun run lint         # ESLint only
   bun run format:check # Prettier only
   ```

5. **Test your changes**:
   ```bash
   bun run test         # All tests
   bun nx test web      # Frontend tests only
   bun nx test convex   # Backend tests only
   ```

### 3. Commit Standards

We use **conventional commits** for clear, semantic commit messages:

```bash
# Format: type(scope): description

# Types:
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style/formatting
refactor: Code refactoring
test:     Adding/updating tests
chore:    Build process, dependencies

# Examples:
feat(ratings): add emoji rating display component
fix(search): resolve search result pagination issue
docs(api): update authentication documentation
test(themes): add theme provider test coverage
refactor(components): organize components by feature
```

### 4. Pull Request Process

1. **Create a descriptive PR title**:

   ```
   feat(ratings): implement emoji rating system
   fix(search): resolve mobile search input focus issue
   ```

2. **Fill out the PR template** with:
   - Summary of changes
   - Testing done
   - Breaking changes (if any)
   - Screenshots (for UI changes)

3. **Ensure all checks pass**:
   - ✅ TypeScript compilation
   - ✅ ESLint passes
   - ✅ Prettier formatting
   - ✅ Tests pass
   - ✅ Build succeeds

4. **Request review** from maintainers

## Coding Standards

### File Naming

**Always use kebab-case for file names:**

```
✅ user-profile.tsx
✅ emoji-rating-display.tsx
✅ search-results-grid.tsx

❌ UserProfile.tsx
❌ emojiRatingDisplay.tsx
❌ search_results_grid.tsx
```

### Naming Conventions

#### TypeScript/JavaScript

- **camelCase** for:
  - Variable names: `const userName = 'John'`
  - Function names (non-components): `function getUserData() {}`
  - Object properties: `{ firstName: 'John', lastName: 'Doe' }`
- **PascalCase** for:
  - React components: `function UserProfile() {}`
  - Classes: `class UserService {}`
  - Types/Interfaces: `type UserData = {}`, `interface UserProfile {}`
  - Enums: `enum UserRole {}`

- **UPPER_SNAKE_CASE** for:
  - Constants: `const MAX_RETRIES = 3`
  - Environment variables: `process.env.DATABASE_URL`

### UI Design Style

- **Lowercase text** throughout the UI (buttons, labels, headers)
  - Button: "save changes" NOT "Save Changes"
  - Headers: "user profile" NOT "User Profile"
  - Labels: "email address" NOT "Email Address"
- Exception: Proper nouns and user-generated content maintain their casing

## Component Guidelines

### 1. Component Organization

- **General components** → `src/components/`
  - Reusable across features
  - Layout, forms, utilities
- **Feature components** → `src/features/[domain]/components/`
  - Business domain specific
  - Ratings, theming, profiles, etc.

- **UI primitives** → `src/components/ui/`
  - **ONLY shadcn/ui components**
  - Never custom components

### 2. Component Structure

```typescript
// Example: emoji-rating-display.tsx
import React from 'react';
import { cn } from '@/utils/tailwind-utils';
import type { EmojiRating } from '@viberatr/types';

interface EmojiRatingDisplayProps {
  ratings: EmojiRating[];
  variant?: 'compact' | 'expanded';
  className?: string;
}

export function EmojiRatingDisplay({
  ratings,
  variant = 'compact',
  className,
}: EmojiRatingDisplayProps) {
  return (
    <div className={cn(
      'flex items-center gap-2',
      variant === 'expanded' && 'flex-col items-start',
      className
    )}>
      {/* Component content */}
    </div>
  );
}
```

### 3. Import Patterns

```typescript
// Feature components (use barrel exports)
import { EmojiRatingDisplay, StarRating } from '@/features/ratings/components';
import { ThemeProvider, useTheme } from '@/features/theming/components';

// General components (direct imports)
import { Header } from '@/components/header';
import { OptimizedImage } from '@/components/optimized-image';

// UI primitives
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// Types and utilities
import type { User, Vibe } from '@viberatr/types';
import { cn } from '@/utils/tailwind-utils';
import { computeUserDisplayName } from '@viberatr/utils';
```

### 4. Component with Variants

```typescript
// Use class-variance-authority for variants
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Button({ variant, size, className, children }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </button>
  );
}
```

### 5. Barrel Exports

#### Feature Index Files

```typescript
// features/ratings/components/index.ts
// Emoji Rating Components
export { EmojiRatingDisplay } from './emoji-rating-display';
export { EmojiRatingPopover } from './emoji-rating-popover';
export { EmojiReaction } from './emoji-reaction';

// Star Rating Components
export { StarRating } from './star-rating';
export { StarRatingWithPopover } from './star-rating-with-popover';

// Rating Utilities
export { RatingPopover } from './rating-popover';
export { RatingRangeSlider } from './rating-range-slider';
```

## Styling Guidelines

### Theme-Aware Colors

**Always use themed colors for maximum compatibility:**

```css
/* ✅ Use semantic colors */
bg-primary text-primary-foreground
bg-secondary text-secondary-foreground
bg-muted text-muted-foreground

/* ✅ Use theme-aware colors */
bg-theme-primary text-white
bg-theme-secondary text-white

/* ✅ Use mode-aware colors */
bg-background text-foreground
border-border

/* ❌ Never use hardcoded colors */
bg-pink-500 text-blue-600     /* Bad */
bg-red-400 hover:bg-red-500   /* Bad */
```

### Component Styling

```typescript
import { cn } from '@/utils/tailwind-utils';

export function Component({ isActive, className }: Props) {
  return (
    <div className={cn(
      // Base styles
      'flex items-center p-4 rounded-md transition-colors',
      // Conditional styles
      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted',
      // Custom styles
      className
    )}>
      Content
    </div>
  );
}
```

## Testing Guidelines

### Component Tests

Every component should have basic tests:

```typescript
// component-name.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentName } from './component-name';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle props correctly', () => {
    render(<ComponentName variant="secondary" />);
    expect(screen.getByRole('button')).toHaveClass('secondary');
  });
});
```

### Test Coverage

- **Target**: 70% overall coverage
- **Critical components**: 80%+ coverage
- **Focus on**: User interactions, business logic, accessibility

### Test Utilities

Use shared test utilities for consistency:

```typescript
import {
  renderWithProviders,
  mockUser,
  createMockVibe,
  testComponentExports
} from '@/__tests__/utils';

describe('MyComponent', () => {
  testComponentExports(MyComponent, 'MyComponent');

  it('should work with providers', () => {
    renderWithProviders(<MyComponent />, {
      withThemeProvider: true
    });
  });
});
```

## Feature Development

### Adding New Components

1. **Determine placement**:
   - Is it reusable? → `src/components/`
   - Feature-specific? → `src/features/[domain]/components/`

2. **Create the component**:

   ```bash
   # Example: Adding a new rating component
   touch src/features/ratings/components/rating-summary.tsx
   ```

3. **Add to barrel exports**:

   ```typescript
   // src/features/ratings/components/index.ts
   export { RatingSummary } from './rating-summary';
   ```

4. **Write tests**:

   ```bash
   touch src/features/ratings/components/rating-summary.test.tsx
   ```

5. **Update documentation** if needed

### Adding New Features

1. **Create feature directory**:

   ```bash
   mkdir src/features/new-feature
   mkdir src/features/new-feature/components
   mkdir src/features/new-feature/hooks      # If needed
   mkdir src/features/new-feature/services   # If needed
   ```

2. **Add barrel exports**:

   ```typescript
   // src/features/new-feature/components/index.ts
   export { NewFeatureComponent } from './new-feature-component';
   ```

3. **Create comprehensive tests**

4. **Document the feature** in relevant docs

## Performance Guidelines

### Component Optimization

```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo<Props>(({ data }) => {
  const processedData = useMemo(() =>
    expensiveProcessing(data), [data]
  );

  return <div>{processedData}</div>;
});

// Use callback hooks for stable references
export function Parent() {
  const handleClick = useCallback((id: string) => {
    // Handle click
  }, []);

  return <Child onClick={handleClick} />;
}
```

### Bundle Optimization

```typescript
// Use dynamic imports for code splitting
const LazyComponent = React.lazy(() => import('./expensive-component'));

// Conditional imports
const ConditionalFeature = isEnabled
  ? React.lazy(() => import('./conditional-feature'))
  : null;
```

## Accessibility Requirements

### Semantic HTML

Always use appropriate semantic elements:

```typescript
export function Article() {
  return (
    <article>
      <header>
        <h1>Article Title</h1>
      </header>
      <main>
        <p>Article content...</p>
      </main>
      <footer>
        <button type="button">Share</button>
      </footer>
    </article>
  );
}
```

### ARIA Labels

Provide appropriate labels for interactive elements:

```typescript
export function ToggleButton({ isExpanded }: Props) {
  return (
    <button
      type="button"
      aria-expanded={isExpanded}
      aria-label="Toggle expanded view"
      aria-describedby="help-text"
    >
      <span className="sr-only">Screen reader text</span>
      <Icon aria-hidden="true" />
    </button>
  );
}
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```typescript
export function InteractiveComponent() {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleAction();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleAction}
    >
      Interactive content
    </div>
  );
}
```

## Common Patterns

### Loading States

```typescript
export function ComponentWithLoading({ data, isLoading }: Props) {
  if (isLoading) {
    return <ComponentSkeleton />;
  }

  if (!data) {
    return <EmptyState />;
  }

  return <ComponentContent data={data} />;
}
```

### Error Boundaries

```typescript
export function ComponentWithError({ error, retry }: Props) {
  if (error) {
    return (
      <div className="text-destructive">
        <p>Something went wrong</p>
        <Button onClick={retry}>Try Again</Button>
      </div>
    );
  }

  return <ComponentContent />;
}
```

### Responsive Design

```typescript
export function ResponsiveComponent() {
  return (
    <div className={cn(
      // Mobile first
      'flex flex-col p-4',
      // Tablet
      'md:flex-row md:p-6',
      // Desktop
      'lg:p-8 lg:max-w-6xl lg:mx-auto'
    )}>
      <aside className="md:w-1/3 lg:w-1/4">Sidebar</aside>
      <main className="md:w-2/3 lg:w-3/4">Content</main>
    </div>
  );
}
```

## Migration Guide

### Moving Components to Features

When moving a component from `components/` to `features/`:

1. **Identify the feature domain** (ratings, theming, profiles, etc.)
2. **Move the component file** to the appropriate feature directory
3. **Update all imports** that reference the old location
4. **Add to barrel exports** in the feature's index.ts
5. **Update tests** if they reference the old path
6. **Test thoroughly** to ensure no broken imports

### Example Migration

```bash
# Before
src/components/emoji-rating-display.tsx

# After
src/features/ratings/components/emoji-rating-display.tsx

# Update imports from:
import { EmojiRatingDisplay } from '@/components/emoji-rating-display';

# To:
import { EmojiRatingDisplay } from '@/features/ratings/components';
```

## Common Issues and Solutions

### Import Errors

**Problem**: Cannot find module after component reorganization

**Solution**:

1. Check if the file moved to a feature directory
2. Use barrel exports from feature directories
3. Update import path from `@/components/` to `@/features/[domain]/components`

### TypeScript Errors

**Problem**: Type errors after adding new props

**Solution**:

1. Run `bun run typecheck` to see all errors
2. Update component interfaces
3. Update tests that use the component
4. Consider backward compatibility

### Styling Issues

**Problem**: Component doesn't match theme/design system

**Solution**:

1. Use themed colors instead of hardcoded values
2. Check component organization patterns
3. Test in both light and dark themes
4. Verify responsive behavior

### Test Failures

**Problem**: Tests failing after component changes

**Solution**:

1. Update test snapshots if needed
2. Use shared test utilities for mocking
3. Check if component structure changed
4. Verify all imports are correct

## Best Practices Summary

1. **Use kebab-case** for all file names
2. **Use PascalCase** for component names
3. **Use themed colors** instead of hardcoded values
4. **Create barrel exports** for features
5. **Test components** with proper utilities
6. **Follow semantic HTML** and accessibility guidelines
7. **Optimize for performance** with memoization
8. **Keep UI primitives** separate from custom components
9. **Organize by feature** for scalability
10. **Document complex components** with JSDoc

## Recent Features

### Emoji Rating System

- **Emoji Reactions**: Circular buttons with hover states and animations
- **Emoji Ratings**: 1-5 scale ratings with required review text
- **Visual Display**: Compact and expanded modes with framer-motion animations
- **Backward Compatibility**: Falls back to star ratings when no emoji ratings exist
- **Database Schema**: Separate `emojiRatings` table with proper indexes

### Search System

- **Advanced Filters**: Date range, rating range, tags, and user filters
- **Instant Search**: Real-time search with debouncing
- **Search History**: Recent and trending searches
- **Mobile Optimized**: Responsive filter drawer for mobile devices

## Resources

- [TanStack Start Documentation](https://tanstack.com/start)
- [Convex Documentation](https://docs.convex.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vitest Testing](https://vitest.dev)

Thank you for contributing to viberatr! 🎉
