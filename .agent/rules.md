# AI Assistant Rules Navigation

This file serves as the navigation index to the organized rule structure optimized for efficient AI assistant context consumption.

## Always Start Here

**Essential Rules**: `.agent/rules-core.md`  
Must always be in context - contains critical file naming, imports, colors, package management, and workflow requirements.

## Rule Organization

### Features (`/.agent/rules/features/`)

**When working on authentication:**

- `auth-rules.md` - Clerk integration, user flows, session management

**When working on search functionality:**

- `search-rules.md` - Filter patterns, search UI, performance optimization

**When working on vibes (posts):**

- `vibe-rules.md` - Creation, display, moderation, content patterns

**When working on ratings/reactions:**

- `rating-rules.md` - Emoji ratings, star ratings, aggregation patterns

**When working on user features:**

- `user-rules.md` - Profiles, preferences, privacy, data management

**When working on notifications:**

- `notification-rules.md` - Real-time updates, notification patterns

### Stack (`/.agent/rules/stack/`)

**When working on frontend (apps/web/):**

- `web-app-rules.md` - TanStack Start, shadcn/ui, routing, state management

**When working on backend (apps/convex/):**

- `convex-backend-rules.md` - Database patterns, function types, performance

**When working across the monorepo:**

- `monorepo-rules.md` - Workspace patterns, shared packages, imports

**When setting up local development:**

- `local-dev-rules.md` - Environment setup, debugging, testing

**When working on deployments/CI:**

- `cicd-rules.md` - GitHub Actions, deployment patterns, environment management

### Patterns (`/.agent/rules/patterns/`)

**When organizing imports or dependencies:**

- `import-patterns.md` - Workspace imports, shadcn restrictions, module organization

**When implementing auth flows:**

- `authentication-patterns.md` - Clerk patterns, protected routes, session handling

**When optimizing performance or animations:**

- `animation-performance-patterns.md` - CSS animations, performance optimization, transitions

## Accumulated Knowledge (`/.agent/docs/`)

**Always check relevant learnings before starting work:**

- `web-learnings.md` - Frontend development patterns and gotchas
- `convex-learnings.md` - Backend development insights and best practices
- `[feature]-learnings.md` - Feature-specific accumulated knowledge

## Task-Based Navigation

### Common Task Types

**Building new features:**

1. Read `rules-core.md` (always in context)
2. Check relevant `features/` rule file
3. Check relevant `stack/` rule files
4. Review `docs/*-learnings.md` for insights

**Fixing bugs or performance issues:**

1. Read `rules-core.md` (always in context)
2. Check `patterns/` for relevant optimization rules
3. Review workspace-specific learnings

**Setting up development environment:**

1. Read `rules-core.md` (always in context)
2. Check `stack/local-dev-rules.md`
3. Review `stack/monorepo-rules.md`

**Working on UI/UX improvements:**

1. Read `rules-core.md` (always in context)
2. Check `stack/web-app-rules.md`
3. Check `patterns/animation-performance-patterns.md`
4. Review `docs/web-learnings.md`

## Directory Structure

```
.agent/rules/
├── features/
│   ├── auth-rules.md
│   ├── search-rules.md
│   ├── vibe-rules.md
│   ├── rating-rules.md
│   ├── user-rules.md
│   └── notification-rules.md
├── stack/
│   ├── web-app-rules.md
│   ├── convex-backend-rules.md
│   ├── monorepo-rules.md
│   ├── local-dev-rules.md
│   └── cicd-rules.md
├── patterns/
│   ├── import-patterns.md
│   ├── authentication-patterns.md
│   └── animation-performance-patterns.md
├── rules-core.md (essential - always in context)
└── rules.md (this navigation file)
```

## Usage Workflow

1. **Before starting any task**: Read `rules-core.md` (should already be in context)
2. **Identify task type**: Use task-based navigation above
3. **Read relevant rule files**: Check 1-2 specific rule files for your task
4. **Check accumulated learnings**: Review relevant `docs/*-learnings.md`
5. **Use TodoWrite**: For multi-step tasks, create todo list
6. **Update learnings**: Document insights after completion

This organized structure provides comprehensive rule coverage while optimizing AI assistant context usage. Always start with the core rules and navigate to specific areas based on your current task.
