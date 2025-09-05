# Import Patterns Guide

This document provides authoritative guidance on import patterns across the vibechecc monorepo. Following these patterns ensures consistency, maintainability, and proper module resolution.

## Overview

The vibechecc project uses a multi-workspace structure with specific import patterns for different types of modules:

- **Local aliases (`@/`)**: For same-workspace imports in apps/web only
- **Workspace packages (`@vibechecc/`)**: For cross-workspace shared modules
- **Relative imports**: For internal module references within workspace
- **External libraries**: Framework and third-party imports
- **Generated imports**: Convex auto-generated modules

## Frontend (apps/web) Import Patterns

### 1. Local Aliases (`@/`)

**ONLY available in apps/web** - configured in `apps/web/tsconfig.json`:

```typescript
// UI Components (shadcn/ui)
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft } from '@/components/ui/icons';

// Utilities (web-specific)
import toast from '@/utils/toast';
import { cn } from '@/utils/tailwind-utils';
import { seo } from '@/utils/seo';
import { APP_NAME, APP_DOMAIN, APP_CONFIG } from '@/utils/bindings';

// Features
import { OnboardingFlow } from '@/features/onboarding/components/onboarding-flow';
import { DualThemeColorPicker } from '@/features/theming/components/dual-theme-color-picker';

// Stores
import { useThemeStore } from '@/stores/theme-store';

// Queries
import { useCurrentUser, useUpdateProfileMutation } from '@/queries';

// Layouts
import { BaseLayout } from '@/components/layouts/base-layout';
```

### 2. Workspace Package Imports

```typescript
// Convex API
import { api } from '@vibechecc/convex';

// Shared types
import type { User, Vibe, Rating } from '@vibechecc/types';

// Shared utilities (rare - most utils are workspace-specific)
import { PAGINATION, CONTENT_LIMITS } from '@vibechecc/utils/constants';
import { formatDate } from '@vibechecc/utils';
```

### 3. External Library Imports

```typescript
// React ecosystem
import * as React from 'react';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Authentication
import { useUser } from '@clerk/tanstack-react-start';
import { getAuth } from '@clerk/tanstack-react-start/server';

// Convex
import { useConvex } from 'convex/react';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
```

## Backend (apps/convex) Import Patterns

### 1. Generated Imports (Convex-specific)

```typescript
// Server functions
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
  action,
  internalAction,
  type QueryCtx,
  type MutationCtx,
} from './_generated/server';

// API references
import { internal } from './_generated/api';

// Data model types
import type { Doc, Id } from './_generated/dataModel';
```

### 2. Relative Imports (same workspace)

```typescript
// Internal utilities
import { SecurityValidators, AuthUtils } from './lib/securityValidators';

// Schema and validation
import { v, Validator } from 'convex/values';
```

### 3. Workspace Package Imports

```typescript
// Shared types (backend can import from shared packages)
import type { User, Vibe, Rating } from '@vibechecc/types';

// Note: Backend rarely imports from @vibechecc/utils
// Most backend utilities are internal to apps/convex
```

### 4. External Library Imports

```typescript
// Convex framework
import { v } from 'convex/values';
import { SchedulableFunctionReference } from 'convex/server';

// Third-party libraries
import type { UserJSON } from '@clerk/backend';
```

## Shared Packages Import Patterns

### packages/types

```typescript
// Internal exports (within package)
export type { User, Vibe, Rating } from './types/user';
export type { SearchFilters } from './types/search';

// No external dependencies typically
// Pure TypeScript interfaces and types
```

### packages/utils

```typescript
// Internal structure
export * from './constants/limits';
export * from './format/date';
export * from './social-sharing';

// Minimal external dependencies
// Utilities that work across all workspaces
```

## Import Order Conventions

Follow this order for cleaner, more readable imports:

```typescript
// 1. External libraries (React, frameworks)
import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';

// 2. Workspace packages (@vibechecc/*)
import { api } from '@vibechecc/convex';
import type { User, Vibe } from '@vibechecc/types';

// 3. Local aliases (@/* - web only)
import { Button } from '@/components/ui/button';
import toast from '@/utils/toast';

// 4. Relative imports (same workspace)
import { SecurityValidators } from './lib/securityValidators';

// 5. Generated imports (Convex _generated)
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
```

## Workspace-Specific Rules

### apps/web ONLY

- **Can use `@/` aliases** - configured path mapping
- **Can import shadcn/ui components** - only workspace with components.json
- **Has access to web-specific utilities** (toast, SEO, etc.)

```typescript
// ✅ VALID - only in apps/web
import { Button } from '@/components/ui/button';
import toast from '@/utils/toast';
```

### apps/convex ONLY

- **No `@/` aliases available** - use relative imports
- **Cannot import shadcn/ui** - no components.json
- **Use generated imports** for Convex internals

```typescript
// ✅ VALID - backend patterns
import { query } from './_generated/server';
import { SecurityValidators } from './lib/securityValidators';

// ❌ INVALID - no @/ aliases in backend
import { something } from '@/some-module';
```

### Shared packages (packages/\*)

- **No workspace-specific imports** - must be pure/shared
- **Minimal external dependencies**
- **Export-focused** for consumption by other workspaces

## Common Mistakes to Avoid

### ❌ Wrong: Using @/ in backend

```typescript
// apps/convex/convex/users.ts
import { SecurityValidators } from '@/lib/securityValidators'; // NO @/ in backend
```

### ✅ Correct: Use relative imports in backend

```typescript
// apps/convex/convex/users.ts
import { SecurityValidators } from './lib/securityValidators';
```

### ❌ Wrong: shadcn imports in backend

```typescript
// apps/convex/convex/vibes.ts
import { Button } from '@/components/ui/button'; // shadcn only in web
```

### ❌ Wrong: Workspace-specific utils in shared packages

```typescript
// packages/utils/src/index.ts
import toast from '@/utils/toast'; // web-specific, can't be in shared
```

### ❌ Wrong: Inconsistent workspace imports

```typescript
// Choose one pattern consistently
import { api } from '@vibechecc/convex';
import { User } from '../../../packages/types/src'; // Use @vibechecc/types instead
```

### ✅ Correct: Consistent workspace imports

```typescript
import { api } from '@vibechecc/convex';
import type { User } from '@vibechecc/types';
```

## TypeScript Configuration

### Root tsconfig.json path mappings

```json
{
  "paths": {
    "@vibechecc/convex": ["./apps/convex"],
    "@vibechecc/convex/*": ["./apps/convex/*"],
    "@vibechecc/types": ["./packages/types/src"],
    "@vibechecc/types/*": ["./packages/types/src/*"],
    "@vibechecc/utils": ["./packages/utils/src"],
    "@vibechecc/utils/*": ["./packages/utils/src/*"],
    "@vibechecc/web": ["./apps/web"],
    "@vibechecc/web/*": ["./apps/web/*"]
  }
}
```

### apps/web tsconfig.json (local aliases)

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@vibechecc/convex": ["../convex"],
    "@vibechecc/convex/*": ["../convex/*"]
  }
}
```

### apps/convex tsconfig.json (no local aliases)

```json
{
  "baseUrl": "."
  // No @/* path mappings - use relative imports
}
```

## Summary

- **Frontend (`apps/web`)**: Use `@/` for local, `@vibechecc/` for workspace packages
- **Backend (`apps/convex`)**: Use relative imports for local, `@vibechecc/` for workspace packages
- **Shared packages**: Export-only with `@vibechecc/` imports between packages
- **Import order**: External → Workspace → Local → Relative → Generated
- **Consistency**: Stick to the patterns, avoid mixing approaches

This guide ensures clean, maintainable import patterns across the entire vibechecc monorepo.
