# AGENTS.md

Operational guide for AI coding assistants (Claude, GPT, Cursor, Codeium, etc.) working in this repository.

## Read This First

- Always check `.agent/` before starting any work:
  - `.agent/rules.md` — Canonical rules that override default behavior
  - `.agent/docs/*-learnings.md` — Workspace- and feature-specific learnings
- Skim `CLAUDE.md` for architecture, commands, and conventions used across the repo.
- Prefer additive, pattern-preserving changes. Do not introduce new patterns without explicit approval.

## Repo Overview

- Monorepo (Nx) with shared packages and app workspaces:
  - `apps/web` — React app (TanStack Start, shadcn/ui, Tailwind v4)
  - `apps/convex` — Convex backend (queries, mutations, actions, HTTP actions)
  - `packages/types` — `@vibechecc/types` shared interfaces
  - `packages/utils` — `@vibechecc/utils` shared utilities
  - `terraform` — Cloudflare/Convex infra as code

## Commands (run from repo root with Bun)

```bash
bun run dev           # Frontend + backend + ngrok
bun run dev:frontend  # Frontend only
bun run dev:backend   # Backend only
bun run build         # Build all projects
bun run test          # Run all tests
bun run typecheck     # Type check all projects
bun run lint          # Lint all projects
bun run seed          # Seed development data
bun run seed:clear    # Clear database content

# Nx helpers
bun nx show projects
bun nx show project <project>
bun nx <task> <project>
bun nx run-many --target=<task>
bun nx reset

# Quality bundles
bun run quality       # typecheck + lint + format check
bun run quality:fix   # typecheck + lint --fix + format
```

Use Bun exclusively. Do not use npm, yarn, or pnpm. Run commands from the repository root.

## Agent Workflow

- Plan before editing. Track multi-step work with your agent’s TODO/plan tool:
  - Keep exactly one task `in_progress` at a time
  - Update statuses as you progress; mark items `completed` promptly
- Read relevant READMEs and `.agent/docs/*-learnings.md` for the area you are touching.
- Preserve existing patterns; extend instead of replacing. If you must change a pattern, propose it first.
- Prefer additive “v(n+1)” versions rather than mutating existing exports and signatures.
- After changes, run `bun run quality` and relevant tests for the affected workspace.
- When you discover new insights, add them under `.agent/docs/` (if requested by the task).

## Coding Conventions

- File names: kebab-case only (`user-profile.tsx`, `search-utils.ts`). Tests: `[name].test.ts[x]`.
- TypeScript/JS naming:
  - camelCase: variables, functions, object properties
  - PascalCase: React components, classes, types/interfaces, enums
  - UPPER_SNAKE_CASE: constants and environment variables
- UI text style: lowercase for buttons, labels, and headers (proper nouns and user content keep their case).
- No hardcoded colors. Use theme/semantic colors. See `.agent/rules/theme-colors.mdc`.
- Import rules:
  - shadcn/ui is allowed only in `apps/web/`
  - Prefer workspace imports: `@vibechecc/types`, `@vibechecc/utils`, `@vibechecc/convex`
- Code style: 2-space indentation for TS/JS/JSON. Avoid comments unless explicitly requested. Favor existing utilities over new ones.

## Frontend (apps/web)

- Framework: TanStack Start; components via shadcn/ui; styling via Tailwind v4.
- Place feature code under `src/features/` where applicable.
- Use existing query hooks and utilities; follow local import patterns.
- Keep components small and focused. Example structure:

```ts
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface UserCardProps { /* ... */ }

export function UserCard(props: UserCardProps) {
  return <div>{/* ... */}</div>
}
```

## Backend (apps/convex)

- Prefer indexes over filters for queries for performance:

```ts
// Good
const rows = await ctx.db
  .query('messages')
  .withIndex('by_channel', (q) => q.eq('channel', channel))
  .collect();

// Avoid
const rows = await ctx.db
  .query('messages')
  .filter((q) => q.eq(q.field('channel'), channel))
  .collect();
```

- Organize by function type: queries (read), mutations (write), actions (external), HTTP actions.
- Check auth where appropriate; mirror existing patterns.
- API paths follow file structure: `convex/foo/bar.ts` → `api.foo.bar.fnName`.

## Testing

- Frontend: Vitest + Testing Library. Include `/// <reference lib="dom" />` where needed.
- Backend: `convex-test` for Convex functions.
- General: no skipped tests; group with `describe`; test edge cases and errors.
- Run specific tests via Nx: `bun nx test <project> -- <file>`.

## Quality & Safety

- Type safety: full TypeScript coverage for your changes.
- Linting/formatting: follow ESLint + Prettier. Do not mass-fix unrelated issues unless asked.
- Security: never commit secrets; validate inputs; follow existing auth/permission checks.
- Backward compatibility: prefer additive changes; document any breaking changes and get approval first.

## Environment & Setup

- Prereqs: Bun, ngrok, Convex CLI, Git.
- Copy `.env.local.example` → `.env.local` and configure Convex, Clerk, ngrok.
- `bun run dev` starts Convex (with seeding), the web app at `http://localhost:3000`, and an ngrok tunnel.

## Reference Files

- `CLAUDE.md` — Architecture, commands, conventions, and assistant workflow highlights
- `.agent/rules.md` — Project-wide rules that override defaults
- `.agent/docs/web-learnings.md` — Frontend insights and patterns
- `.agent/rules/convex-learnings.md` — Backend/Convex insights and patterns
- Additional `.agent/rules/*.md[c]` — Feature- and subsystem-specific learnings (search, seeding, emoji ratings, theme colors, etc.)

## When In Doubt

1. Check `.agent/` files for an existing pattern
2. Mirror the closest neighbor implementation
3. Prefer additive changes and propose deltas before refactors
4. Confirm with maintainers for deviations from established patterns
