# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**vibechecc** is a modern social web application built as an Nx-powered monorepo. Users can share "vibes" (life experiences, thoughts, situations), rate and react to others' vibes, and discover trending content.

## Architecture

### Monorepo Structure

- `apps/web/` - React web app (TanStack Start)
- `apps/convex/` - Convex real-time backend
- `packages/types/` - Shared TypeScript interfaces (@vibechecc/types)
- `packages/utils/` - Shared utility functions (@vibechecc/utils)
- `terraform/` - Infrastructure as code
- `.github/workflows/` - CI/CD pipelines

### Tech Stack

- **Frontend**: TanStack Start, shadcn/ui, Tailwind CSS v4, TanStack Query/Router
- **Backend**: Convex (real-time DB + serverless functions), Clerk (auth)
- **Infrastructure**: Cloudflare Workers, Terraform
- **Development**: Bun, Nx, Vitest, TypeScript

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
bun run seed          # Seed database with basic sample data (5 users, 4 vibes)
bun run seed:enhanced # Seed database with comprehensive data (30 users, 20 vibes)
bun run seed:clear    # Clear all database content
```

### Quality Checks

```bash
bun run quality       # Run typecheck + lint + format check
bun run quality:fix   # Run typecheck + lint fix + format
```

### Nx Commands

```bash
bun nx show projects                    # List all projects
bun nx show project <project>           # Show project details
bun nx <task> <project>                 # Run task for specific project
bun nx run-many --target=<task>         # Run task for all projects
bun nx reset                            # Clear Nx cache
```

### Testing

- **Framework**: Vitest with Happy DOM
- **Frontend**: @testing-library/react for component testing
- **Backend**: convex-test for Convex function testing
- **Run single test**: `bun nx test <project> -- <test-file>`

## Code Conventions

### File Naming

- Use `kebab-case` for file names (e.g., `user-profile.tsx`)
- Test files: `[name].test.ts` or `[name].test.tsx`

### Code Style

- **Classes/Components/Types**: `PascalCase` (e.g., `UserProfile`)
- **Variables/Functions**: `camelCase` (e.g., `isSignedIn`, `userProfileSignIn()`)
- **Indentation**: 2 spaces for most files, 4 spaces for Python/Rust

### Import Patterns

```typescript
// From web app
import { api } from '@vibechecc/convex';
import type { User, Vibe, Rating } from '@vibechecc/types';
import { computeUserDisplayName, getUserAvatarUrl } from '@vibechecc/utils';
import { cn } from '@/utils/tailwind-utils';

// From backend
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type { User } from '@vibechecc/types';
```

## Convex Backend Development

### Database Queries

Prefer Convex indexes over filters for performance:

```typescript
// Good - using index
const messages = await ctx.db
  .query('messages')
  .withIndex('by_channel', (q) => q.eq('channel', channel))
  .collect();

// Avoid - using filter
const messages = await ctx.db
  .query('messages')
  .filter((q) => q.eq(q.field('channel'), channel))
  .collect();
```

### Function Types

- **Queries**: Read-only data fetching
- **Mutations**: Data modifications
- **Actions**: External API calls, can call mutations
- **HTTP Actions**: REST endpoints

### File Organization

- Functions in `convex/` directory
- API path: `convex/foo/bar.ts` → `api.foo.bar.functionName`
- Schema in `convex/schema.ts`

## Testing Guidelines

### Frontend Components

- Use `@testing-library/react` for component testing
- Include `/// <reference lib="dom" />` in test files
- Use `screen` queries and Jest-DOM matchers
- Clean up with `afterEach(cleanup)`

### Backend Functions

- Use `convex-test` for testing Convex functions
- Initialize with `convexTest(schema, modules)`
- Test mutations and queries with proper assertions
- Verify data integrity after operations

### General Rules

- No skipped tests - they're considered failing
- Use `describe` blocks for grouping related tests
- Test edge cases and error conditions

## Development Environment

### Prerequisites

- Bun (runtime and package manager)
- ngrok (webhook tunneling)
- Convex CLI
- Git

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

- Convex deployment settings
- Clerk authentication keys
- ngrok auth token

### Local Development

Run `bun run dev` to start:

- Convex backend with DB seeding
- Frontend at http://localhost:3030
- ngrok tunnel for webhooks

## Package Management

- **Use Bun**: Always use `bun` instead of `npm`, `yarn`, or `npx`. Use `bunx` for package execution.
- **Workspaces**: Configured for monorepo structure
- **Dependencies**: Add to appropriate workspace (root, app, or package)

## Infrastructure

### Deployment

- **Production**: `main` branch
- **Development**: `develop` branch
- **Ephemeral**: Per-PR environments

### Terraform

- All infrastructure as code in `terraform/`
- Uses Cloudflare Workers, R2, and Convex
- Requires backend configuration and workspace selection

## Quality Standards

- **Type Safety**: Full TypeScript coverage required
- **Linting**: ESLint with TypeScript rules
- **Testing**: Comprehensive test coverage
- **Formatting**: Prettier with Tailwind plugin
- **No Linter Fixes**: Don't fix linter errors unless explicitly requested

Run `bun run quality` before submitting PRs to ensure all checks pass.
