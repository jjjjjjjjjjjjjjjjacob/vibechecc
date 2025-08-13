# @vibechecc/utils

Shared utility functions for the vibechecc workspace.

## Important: Separation of Concerns

This package should **only** contain utilities that are:

- Actually used by 2+ workspaces (not "might be used")
- Pure functions with no workspace-specific dependencies
- Working with shared types from `@vibechecc/types`

Workspace-specific utilities should remain in their respective workspaces:

- Tailwind utilities (`cn`) → Frontend only
- SEO utilities → Frontend only
- Convex helpers → Backend only

## Available Utilities

### Constants

```typescript
import { PAGINATION, CONTENT_LIMITS, RATING } from '@vibechecc/utils/constants';

// Pagination limits
PAGINATION.DEFAULT_PAGE_SIZE; // 20
PAGINATION.VIBES_DEFAULT; // 50

// Content limits
CONTENT_LIMITS.VIBE_TITLE_MAX; // 100
CONTENT_LIMITS.VIBE_DESCRIPTION_MAX; // 500

// Rating constraints
RATING.MIN; // 1
RATING.MAX; // 5
```

### Date Formatting

```typescript
import {
  formatDate,
  formatRelativeTime,
  toISOString,
} from '@vibechecc/utils/format';

// Format date for display
formatDate('2024-01-15'); // "Jan 15, 2024"

// Show relative time
formatRelativeTime(new Date()); // "just now"
formatRelativeTime('2024-01-15T10:30:00Z'); // "2 hours ago"

// Convert to ISO string for storage
toISOString(new Date()); // "2024-01-15T12:30:00.000Z"
```

## Usage

Install in your workspace:

```bash
# Already installed as part of the monorepo
```

Import what you need:

```typescript
// Import from main entry
import { PAGINATION, formatDate } from '@vibechecc/utils';

// Or use subpath imports for better tree-shaking
import { PAGINATION } from '@vibechecc/utils/constants';
import { formatDate } from '@vibechecc/utils/format';
```

## Adding New Utilities

Before adding new utilities, ask yourself:

1. Is this currently used by multiple workspaces?
2. Does it have workspace-specific dependencies?
3. Is it generic enough to be reusable?

If the answer to #1 is "no" or #2 is "yes", keep it in the workspace where it's used.
