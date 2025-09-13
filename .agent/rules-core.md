# Core Rules (Always in Context)

These are the essential rules that must always be followed and should remain in AI assistant context.

## Critical File Naming Rules

### Frontend (apps/web/)

- **kebab-case**: `user-profile.tsx`, `search-utils.ts`, `vibe-card.tsx`
- Test files: `[name].test.ts` or `[name].test.tsx`

### Backend (apps/convex/)

- **camelCase**: `userProfile.ts`, `searchUtils.ts`, `emojiRatings.ts`
- **CRITICAL**: Hyphens break Convex codegen - cannot handle files with hyphens

### Other Workspaces

- **kebab-case**: for packages and other TypeScript files

## Import Restrictions

### shadcn/ui Components

**ONLY in `apps/web/` directory** - Reason: Only `apps/web/components.json` exists

```typescript
// Correct
import { Button } from '@/components/ui/button'; // Only in apps/web/

// NEVER in other workspaces
import { Button } from '@/components/ui/button'; // ❌ Breaks other workspaces
```

### Workspace Imports

```typescript
// Always use workspace imports
import { api } from '@vibechecc/convex';
import type { User, Vibe } from '@vibechecc/types';
import { computeUserDisplayName } from '@vibechecc/utils';
```

## Theme Color Mandate

**NEVER use hardcoded colors** - ALWAYS use semantic/theme colors:

```typescript
// ✅ Correct
className = 'bg-primary text-primary-foreground';
className = 'from-theme-primary to-theme-secondary';

// ❌ NEVER
className = 'bg-pink-500 text-white';
className = 'border-blue-400';
```

## Package Management

**Always use `bun`** - NEVER npm, yarn, or pnpm:

```bash
bun install     # ✅
bun run dev     # ✅
npm install     # ❌
```

## Convex Development Commands

**Run Convex functions from `apps/convex/` directory:**

```bash
cd apps/convex
bunx convex dev         # Start Convex development server
bunx convex codegen     # Generate API types
bunx convex run seed:seed    # Seed database
bunx convex run seed:clear   # Clear database
```

**Alternative via Nx from project root:**

```bash
bun run dev:backend     # nx dev @vibechecc/convex
```

## Required Workflow

1. **TodoWrite**: Use for ALL multi-step tasks
2. **Check Rules**: Always read relevant feature/stack rules before starting
3. **Update Learnings**: Document insights after completing tasks
4. **One Task**: Only one todo `in_progress` at a time

## UI Text Style

**Lowercase throughout UI**:

- Buttons: "save changes" NOT "Save Changes"
- Headers: "user profile" NOT "User Profile"
- Labels: "email address" NOT "Email Address"

## Code Style Essentials

- **No comments** unless explicitly requested
- **Indentation**: 2 spaces for TS/JS/JSON
- **camelCase**: variables, functions (non-components)
- **PascalCase**: React components, Types, Classes
- **UPPER_SNAKE_CASE**: constants

## Quality Gates

- Run `bun run quality` before completing tasks
- No skipped tests (they're considered failing)
- Full TypeScript coverage required
- No linter fixes unless explicitly requested

## Navigation to Organized Rules

For specific work, check:

- **Features**: `.agent/rules/features/` - auth, search, vibes, ratings, users, notifications
- **Stack**: `.agent/rules/stack/` - web app, convex backend, monorepo, local dev, CI/CD
- **Patterns**: `.agent/rules/patterns/` - imports, authentication, animations/performance
- **Learnings**: `.agent/docs/` - workspace-specific accumulated knowledge
