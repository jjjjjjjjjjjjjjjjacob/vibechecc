# Monorepo Rules

Comprehensive rules for monorepo management in vibechecc using Bun + Nx.

## Workspace Structure Rules

### Directory Organization

**MUST follow the established monorepo structure:**

```
vibechecc/
├── apps/
│   ├── web/           # TanStack Start React app
│   └── convex/        # Convex backend
├── packages/
│   ├── types/         # Shared TypeScript types (@vibechecc/types)
│   └── utils/         # Shared utility functions (@vibechecc/utils)
├── terraform/         # Infrastructure as code
├── .github/workflows/ # CI/CD pipelines
└── .agent/           # AI assistant documentation
```

### Workspace Boundaries

**MUST respect workspace boundaries:**

- **Apps**: Deployable applications, can depend on packages
- **Packages**: Shared libraries, should not depend on apps
- **Infrastructure**: Separate from application code

**MUST NOT create circular dependencies between workspaces**

### Package Naming

**MUST use consistent package naming:**

```json
{
  "name": "@vibechecc/workspace-name",
  "version": "0.1.0-beta.9"
}
```

## Package Management Rules

### Bun Usage

**MUST use Bun for all package management operations:**

```bash
# ✅ Correct - use bun
bun install
bun add package-name
bun remove package-name
bunx command

# ❌ Incorrect - don't use npm/yarn/pnpm
npm install
yarn add package-name
npx command
```

### Dependency Management

**MUST install dependencies at the correct level:**

```bash
# Root level - shared dev dependencies
bun add -D typescript eslint prettier

# Workspace level - workspace-specific dependencies
cd apps/web && bun add react @tanstack/react-start
cd packages/types && bun add -D tsup
```

### Version Consistency

**MUST maintain consistent versions across workspaces:**

- Use Nx release management for version bumping
- Keep shared dependencies at same versions
- Use `workspace:^` for internal dependencies

```json
{
  "dependencies": {
    "@vibechecc/types": "workspace:^",
    "@vibechecc/utils": "workspace:^"
  }
}
```

### Package Scripts

**MUST define scripts at the appropriate level:**

**Root level scripts (coordination):**

```json
{
  "scripts": {
    "dev": "nx run-many --target=dev --parallel=true",
    "build": "nx run-many --target=build --parallel=true",
    "test": "nx run-many --target=test --parallel=true",
    "quality": "bun run typecheck && bun run lint && bun run format:check"
  }
}
```

**Workspace level scripts (specific tasks):**

```json
{
  "scripts": {
    "dev": "vite --port 3000",
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  }
}
```

## Import Rules

### Workspace Import Patterns

**MUST use consistent import patterns:**

**From web app:**

```typescript
// Shared packages - use package names
import type { User, Vibe } from '@vibechecc/types';
import { computeUserDisplayName } from '@vibechecc/utils';
import { api } from '@vibechecc/convex';

// Local files - use relative paths or aliases
import { cn } from '@/utils/tailwind-utils';
import Button from '@/components/ui/button';
```

**From convex backend:**

```typescript
// Convex runtime - use generated paths
import { query, mutation } from './_generated/server';
import { api, internal } from './_generated/api';

// Shared packages - use package names
import type { User, Vibe } from '@vibechecc/types';

// Local files - use relative paths
import { getCurrentUser } from './users';
import { SecurityValidators } from './lib/validators';
```

**From packages:**

```typescript
// External dependencies only
import { z } from 'zod';
import { clsx } from 'clsx';

// NO imports from apps or other packages
```

### Import Restrictions

**MUST respect import restrictions:**

- **Packages MUST NOT import from apps**
- **Apps can import from packages**
- **shadcn/ui components ONLY in `apps/web/`**
- **No cross-app imports**

### Alias Configuration

**MUST use path aliases consistently:**

**Web app (`apps/web/tsconfig.json`):**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

**Convex backend uses relative paths only**

## Build Rules

### Nx Commands

**MUST use Nx for coordinated builds:**

```bash
# Run command for all projects
bun nx run-many --target=build

# Run command for specific project
bun nx build @vibechecc/web

# Run with dependencies
bun nx build @vibechecc/web --with-deps

# Show project info
bun nx show project @vibechecc/web
```

### Build Dependencies

**MUST define proper build dependencies:**

**In `nx.json`:**

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    }
  }
}
```

### Parallel Execution

**MUST use parallel execution for independent tasks:**

```bash
# Parallel builds (independent)
bun nx run-many --target=build --parallel=true

# Sequential builds (with dependencies)
bun nx run-many --target=build --parallel=false
```

### Build Outputs

**MUST configure build outputs properly:**

```json
{
  "targets": {
    "build": {
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

## Development Workflow Rules

### Environment Setup

**MUST start development environment properly:**

```bash
# Start full dev environment
bun run dev  # Starts web + convex in parallel

# Start individual services
bun run dev:frontend  # Web app only
bun run dev:backend   # Convex only
```

### File Naming Conventions

**MUST use kebab-case for all files:**

```
✅ Correct:
- user-profile.tsx
- search-utils.ts
- api-client.ts

❌ Incorrect:
- userProfile.tsx
- searchUtils.ts
- APIClient.ts
```

### Code Style

**MUST follow consistent code style:**

- **2 spaces** for TypeScript/JavaScript/JSON
- **4 spaces** for Python/Rust
- **camelCase** for variables/functions
- **PascalCase** for components/classes/types
- **UPPER_SNAKE_CASE** for constants

### Quality Checks

**MUST run quality checks before commits:**

```bash
# Run all checks
bun run quality

# Individual checks
bun run typecheck  # TypeScript checking
bun run lint       # ESLint
bun run test       # Vitest tests
bun run format:check # Prettier formatting
```

### Testing Strategy

**MUST write tests for all workspaces:**

- **Frontend**: Component tests with @testing-library/react
- **Backend**: Function tests with convex-test
- **Packages**: Unit tests with Vitest
- **No skipped tests allowed**

## Type Sharing Rules

### Package Organization

**MUST centralize types in `@vibechecc/types`:**

```typescript
// packages/types/src/index.ts
export interface User {
  _id: Id<'users'>;
  externalId: string;
  username?: string;
  // ...
}

export interface Vibe {
  _id: Id<'vibes'>;
  id: string;
  title: string;
  // ...
}
```

### Type Import Patterns

**MUST use type-only imports:**

```typescript
// ✅ Correct - type-only import
import type { User, Vibe, Rating } from '@vibechecc/types';

// ❌ Incorrect - runtime import for types
import { User, Vibe, Rating } from '@vibechecc/types';
```

### Generated Types

**MUST use Convex generated types appropriately:**

```typescript
// In convex backend - use generated types
import { Doc, Id } from './_generated/dataModel';

// In other workspaces - use shared types
import type { User, Vibe } from '@vibechecc/types';
```

### Type Consistency

**MUST maintain type consistency across workspaces:**

- **Database types**: Generated from Convex schema
- **Shared types**: Maintained in `@vibechecc/types`
- **Domain types**: Specific to each workspace
- **Utility types**: Generic helpers in `@vibechecc/utils`

## Configuration Rules

### TypeScript Configuration

**MUST extend from root tsconfig.json:**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

### ESLint Configuration

**MUST use consistent ESLint config:**

```javascript
// Root eslint.config.js
export default [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Shared rules
    },
  },
];
```

### Prettier Configuration

**MUST use shared Prettier config:**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## CI/CD Rules

### GitHub Actions

**MUST use efficient CI/CD pipelines:**

```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: bun install --frozen-lockfile

- name: Build all projects
  run: bun nx run-many --target=build --parallel=true

- name: Test all projects
  run: bun nx run-many --target=test --parallel=true

- name: Type check
  run: bun run typecheck

- name: Lint
  run: bun run lint
```

### Caching Strategy

**MUST use Nx caching effectively:**

```json
{
  "targetDefaults": {
    "build": { "cache": true },
    "test": { "cache": true },
    "lint": { "cache": true },
    "typecheck": { "cache": true }
  }
}
```

## Deployment Rules

### Environment Management

**MUST use proper environment strategies:**

- **Production**: `main` branch
- **Development**: `develop` branch
- **Ephemeral**: Per-PR environments

### Build Process

**MUST build in dependency order:**

```bash
# Types first (no dependencies)
bun nx build @vibechecc/types

# Utils second (depends on types)
bun nx build @vibechecc/utils

# Apps last (depend on packages)
bun nx build @vibechecc/web
bun nx build @vibechecc/convex
```

### Asset Management

**MUST handle assets properly:**

- **Web assets**: Optimized and versioned
- **Convex functions**: Deployed via CLI
- **Types package**: Built to CommonJS + ESM

## Performance Rules

### Bundle Optimization

**MUST optimize bundles:**

```bash
# Analyze bundle size
bun run bundle:analyze

# Code splitting analysis
bun run bundle:analyze:splitting

# Icon import optimization
bun run bundle:optimize:icons
```

### Development Performance

**MUST optimize development workflow:**

- Use Nx caching for builds/tests
- Run parallel tasks when possible
- Use `--parallel=true` for independent operations
- Watch mode for iterative development

### Build Performance

**MUST optimize build times:**

- Cache Nx operations
- Use incremental builds
- Parallel execution where safe
- Skip unnecessary rebuilds

## Error Handling Rules

### Workspace Errors

**MUST handle workspace errors gracefully:**

```bash
# Check workspace health
bun nx show projects

# Reset Nx cache if needed
bun nx reset

# Verify dependencies
bun nx graph
```

### Common Issues

**MUST avoid common monorepo pitfalls:**

- Circular dependencies between packages
- Inconsistent dependency versions
- Missing build dependencies
- Incorrect import paths
- Mixed package managers

### Debugging

**MUST use proper debugging techniques:**

```bash
# Show dependency graph
bun nx graph

# Show affected projects
bun nx show projects --affected

# Verbose output for debugging
bun nx build @vibechecc/web --verbose
```
