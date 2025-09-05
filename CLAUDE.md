# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: AI Assistant Rules

**ALWAYS check hierarchical rule structure FIRST:**

1. **`.agent/rules-core.md`** - Essential rules that must always be followed (Level 1)
2. **`.agent/rules-detailed.md`** - Detailed guides referenced when needed (Level 2)
3. **`.agent/rules-implementation.md`** - Code templates and examples (Level 3)
4. **`.agent/docs/*-learnings.md`** - Workspace-specific insights and patterns

These files contain critical information organized for efficient AI assistant consumption.

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

## Essential Development Rules

**See `.agent/rules-core.md` for complete Level 1 rules. Key essentials:**

### Critical File Naming

- **Frontend (apps/web/)**: kebab-case (`user-profile.tsx`)
- **Backend (apps/convex/)**: camelCase (`userProfile.ts`) - CRITICAL: Hyphens break Convex
- **Other workspaces**: kebab-case

### Import Restrictions

- **shadcn/ui**: ONLY in `apps/web/` directory
- **Workspace imports**: Always use `@vibechecc/types`, `@vibechecc/utils`, etc.

### Theme Colors

- **MANDATORY**: Always use semantic colors (`bg-primary`, `text-foreground`)
- **NEVER**: Hardcoded colors (`bg-pink-500`, `text-blue-600`)

### Package Management

- **Always use `bun`** - NEVER npm, yarn, or pnpm

**For detailed patterns, code templates, and implementation guides, reference the hierarchical rule structure above.**

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

**For complete component and function templates, see `.agent/rules-implementation.md`**

## Backend Development

**Key principles**:

- Prefer Convex indexes over filters for performance
- Include proper authentication checks
- Use camelCase file names (hyphens break codegen)

**For complete function templates, database patterns, and optimization guides, see `.agent/rules-implementation.md`**

## Testing Guidelines

**Essential rules**:

- No skipped tests (they're considered failing)
- Use `@testing-library/react` for frontend, `convex-test` for backend
- Co-locate test files with source code

**For complete test templates and patterns, see `.agent/rules-implementation.md`**

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

## AI Assistant Workflow

### REQUIRED Reading Order

1. **`.agent/rules-core.md`** - Essential rules (Level 1)
2. **`.agent/rules-detailed.md`** - Detailed guides when needed (Level 2)
3. **`.agent/rules-implementation.md`** - Code templates and examples (Level 3)
4. **`.agent/docs/*-learnings.md`** - Workspace-specific insights

### Mandatory Workflow

- **TodoWrite**: Use for ALL multi-step tasks
- **One task at a time**: Only one todo `in_progress`
- **Update learnings**: Document insights after completing tasks
- **Quality checks**: Run `bun run quality` before task completion

**The hierarchical rule structure optimizes context consumption while maintaining comprehensive coverage.**
