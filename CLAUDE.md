# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: AI Assistant Rules

**ALWAYS check `.agent/` directory FIRST before starting any work:**

- `.agent/rules.md` - Project-specific rules that OVERRIDE default behavior
- `.agent/docs/*-learnings.md` - Workspace-specific insights and patterns

These files contain critical information about how to work with this codebase effectively.

## Project Overview

**vibechecc** is a modern social web application built as an Nx-powered monorepo. Users can share "vibes" (life experiences, thoughts, situations), rate and react to others' vibes with emojis and stars, and discover trending content through advanced search and filtering.

## Architecture

### Monorepo Structure

- `apps/web/` - React web app (TanStack Start)
- `apps/convex/` - Convex real-time backend
- `packages/types/` - Shared TypeScript interfaces (@vibechecc/types)
- `packages/utils/` - Shared utility functions (@vibechecc/utils)
- `terraform/` - Infrastructure as code
- `.github/workflows/` - CI/CD pipelines
- `.agent/` - AI assistant documentation and learnings

### Tech Stack

- **Frontend**: TanStack Start, shadcn/ui, Tailwind CSS v4, TanStack Query/Router, tw-animate-css
- **Backend**: Convex (real-time DB + serverless functions), Clerk (auth)
- **Infrastructure**: Cloudflare Workers, Terraform, ngrok (local webhooks)
- **Development**: Bun, Nx, Vitest, TypeScript, ESLint, Prettier

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

## Code Conventions & Style Guide

### File Naming

- **ALWAYS use `kebab-case`** for file names (e.g., `user-profile.tsx`, `search-utils.ts`)
- Test files: `[name].test.ts` or `[name].test.tsx`
- NO underscores, NO camelCase in file names

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

### Import Rules

- **shadcn/ui components** can ONLY be imported in `apps/web/` directory
  - Reason: Only `apps/web/components.json` exists
  - Example: `import { Button } from '@/components/ui/button'`
  - NEVER attempt to use shadcn imports in other workspaces

### Code Style

- **Indentation**: 2 spaces for TypeScript/JavaScript/JSON, 4 spaces for Python/Rust
- **No comments** unless explicitly requested
- Prefer existing utility functions over creating new ones

### Theme Color Usage

- **ALWAYS use themed & moded colors** for maximum compatibility across custom themes/modes
- **Priority**: semantic colors (`primary`, `background`, `muted`) > theme colors (`theme-primary`, `theme-secondary`) > mode-aware colors
- **NEVER use hardcoded colors**: No `bg-pink-500`, `text-blue-600`, hex values, or RGB/HSL
- **Exceptions**: Only for system status, brand logos, or documented third-party requirements
- See `.agent/rules/theme-colors.mdc` for complete guidelines

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
- Frontend at http://localhost:3000
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

## Recent Features

### Emoji Rating System

- **Emoji Reactions**: Circular buttons with hover states and animations
- **Emoji Ratings**: 1-5 scale ratings with required review text
- **Visual Display**: Compact and expanded modes with CSS animations
- **Backward Compatibility**: Falls back to star ratings when no emoji ratings exist
- **Database Schema**: Separate `emojiRatings` table with proper indexes

### Search System

- **Advanced Filters**: Date range, rating range, tags, and user filters
- **Instant Search**: Real-time search with debouncing
- **Search History**: Recent and trending searches
- **Mobile Optimized**: Responsive filter drawer for mobile devices

## AI Assistant Guidelines

### REQUIRED Reading Before Starting Work

1. **`.agent/rules.md`** - Contains MANDATORY rules that override all default AI behavior
2. **`.agent/docs/web-learnings.md`** - Frontend development patterns and gotchas
3. **`.agent/docs/convex-learnings.md`** - Backend development patterns and best practices
4. **`.agent/docs/*-learnings.md`** - Task-specific learnings for various features

### Workflow Requirements

- **Use TodoWrite**: Track ALL multi-step tasks with the todo system
- **Update Learnings**: Document insights in `.agent/docs/` after completing tasks
- **Follow Patterns**: NEVER introduce new patterns without explicit permission
- **Check First**: Always check existing code patterns before implementing
