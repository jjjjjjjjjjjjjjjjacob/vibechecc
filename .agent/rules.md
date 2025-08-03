# AI Assistant Rules for viberatr

These rules override default AI behavior when working on this codebase.

## Core Principles

1. **Additive Changes Preferred**
   - Always extend existing patterns rather than modifying them
   - Never change existing function signatures without explicit permission
   - Create v(n+1) versions when replacing code
   - Document breaking changes and request permission

2. **Pattern Preservation**
   - Follow existing codebase patterns exactly
   - Do not introduce new patterns without explicit request
   - When unsure about a pattern, ask for clarification

3. **Monorepo Awareness**
   - Always use workspace imports (`@viberatr/types`, `@viberatr/utils`, etc.)
   - Run commands from the repository root
   - Use `bun` exclusively (never npm, yarn, or pnpm)

## Development Workflow

### Before Making Changes

1. Read relevant README files in affected directories
2. Check `.agent/docs/*-learnings.md` for workspace-specific insights
3. Understand existing patterns by examining neighboring code
4. Use the TodoWrite tool for any multi-step tasks

### During Development

1. Mark todos as in_progress before starting work
2. Only have one todo in_progress at a time
3. Complete current tasks before starting new ones
4. Update task status in real-time

### After Completing Tasks

1. Mark todos as completed immediately
2. Update relevant learnings in `.agent/docs/`
3. Run quality checks (`bun run quality`)
4. Document any new patterns discovered

## Code Style Rules

### Naming Conventions

#### File Names

- **kebab-case** for all file names: `user-profile.tsx`, `search-utils.ts`, `vibe-card.tsx`
- Test files: `[name].test.ts` or `[name].test.tsx`
- NO underscores, NO camelCase in file names

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

### General

- NO COMMENTS unless explicitly requested
- Prefer existing utility functions over creating new ones
- Match indentation of surrounding code (2 spaces for TS/JS/JSON)

### Frontend (apps/web)

- Use shadcn/ui components when available
- Follow TanStack Start routing conventions
- Place feature-specific code in `src/features/`
- Use Convex hooks from `src/queries.ts`
- Component structure:

  ```typescript
  // Imports first
  import { useState } from 'react'
  import { Button } from '@/components/ui/button'

  // Types/interfaces
  interface UserCardProps {
    user: User
  }

  // Component definition
  export function UserCard({ user }: UserCardProps) {
    return <div>...</div>
  }
  ```

### Backend (apps/convex)

- Prefer indexes over filters for queries
- Include proper authentication checks
- Follow Convex function naming patterns
- Keep functions focused and single-purpose
- Function organization:

  ```typescript
  // Queries
  export const getUser = query({...})

  // Mutations
  export const updateUser = mutation({...})

  // Actions
  export const syncUser = action({...})

  // Internal mutations
  export const internalUpdateUser = internalMutation({...})
  ```

## Testing Rules

1. Never skip tests - they're considered failing
2. Co-locate test files with source code
3. Use existing test patterns and utilities
4. Run tests before marking tasks complete

## Documentation Rules

1. Only create documentation when explicitly requested
2. Update existing docs rather than creating new ones
3. Keep README files focused on their specific scope
4. Don't duplicate information across README files

## Security Rules

1. Never commit secrets or API keys
2. Always validate user input
3. Use proper authentication checks
4. Follow existing security patterns

## Quality Standards

1. Full TypeScript coverage required
2. No linter errors (unless fixing is explicitly requested)
3. Run `bun run quality` before completing tasks
4. Ensure backward compatibility
