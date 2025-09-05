# Local Development Rules

## Environment Setup Rules

### Node.js and Package Manager

- **MUST** use Bun as the package manager and runtime: `bun@1.2.16`
- **MUST** use `nvm use` to select the correct Node.js version if nvm is available
- **MUST NOT** use npm, yarn, or pnpm commands - always use `bun` and `bunx`
- **MUST** use `bun install --frozen-lockfile` for dependency installation to ensure reproducible builds

### Environment Variables

- **MUST** copy `.env.local.example` to `.env.local` before starting development
- **MUST** configure these required variables in `.env.local`:
  - `VITE_CONVEX_URL` - Convex deployment URL from dashboard
  - `VITE_CLERK_PUBLISHABLE_KEY` - Clerk authentication keys
  - `CLERK_FRONTEND_API_URL` and `CLERK_SECRET_KEY` - Clerk server-side config
  - `CLERK_WEBHOOK_SECRET` - For Clerk webhook handling
  - `VITE_POSTHOG_API_KEY` and related PostHog analytics config
- **SHOULD** set `VITE_APP_SUBDOMAIN=dev` for local development to distinguish from production
- **MUST** never commit `.env.local` or expose secrets in version control

### Nx Configuration

- **MUST** use Nx TUI: Set `NX_TUI=true` in environment (contrary to example showing false)
- **MUST NOT** modify `nx.json` without understanding impact on caching and task dependencies
- **MUST** respect Nx input definitions for proper caching behavior
- **SHOULD** use Nx cache: Never disable unless debugging cache issues

## Development Commands Rules

### Core Development Scripts

- **MUST** use `bun run dev` to start both frontend and backend in parallel
- **MUST** use `bun run dev:frontend` or `bun run dev:backend` for single service development
- **MUST NOT** run `bun run dev` in CI/CD or automated environments (blocks terminal)
- **SHOULD** use specific Nx commands for individual project operations:
  ```bash
  bunx nx dev @vibechecc/web      # Frontend only
  bunx nx dev @vibechecc/convex   # Backend only
  bunx nx build @vibechecc/web    # Build frontend
  bunx nx test @vibechecc/convex  # Test specific project
  ```

### Safe Command Execution Patterns

- **MUST NOT** run indefinite commands without timeout:
  - ❌ `bun run dev` (blocks forever)
  - ❌ Any `watch` mode commands
  - ❌ Server commands that take over terminal
- **MUST** use timeouts for potentially long commands:
  ```bash
  timeout 300s bun run build  # 5 minute timeout
  timeout 30s bun run test    # 30 second timeout for tests
  ```
- **MUST** clean up background processes:
  ```bash
  bun run dev > /dev/null 2>&1 &
  SERVER_PID=$!
  # Do work
  kill $SERVER_PID 2>/dev/null || true
  ```

### Nx-Specific Commands

- **MUST** use `bun nx` prefix instead of `npx nx`
- **SHOULD** use `run-many` for multi-project operations:
  ```bash
  bunx nx run-many --target=test --parallel=true
  bunx nx run-many --target=build --projects=@vibechecc/web,@vibechecc/convex
  ```
- **MUST** understand Nx task dependencies: `build` depends on `^build` (dependencies built first)
- **SHOULD** use Nx cache reset if experiencing cache issues: `bunx nx reset`

## Debugging Rules

### Development Server Debugging

- **MUST** check compilation before assuming server issues:
  ```bash
  bun run build        # Verify build works
  bun run typecheck    # Check TypeScript errors
  ```
- **SHOULD** use temporary server checks for validation:
  ```bash
  timeout 10s bun run dev > /dev/null 2>&1 &
  SERVER_PID=$!
  sleep 3
  curl http://localhost:3000  # Quick health check
  kill $SERVER_PID 2>/dev/null || true
  ```
- **MUST** check ngrok setup for webhook debugging:
  ```bash
  bun run dev:webhooks  # Start webhook tunnel
  ```

### Error Handling Patterns

- **MUST** use `set -e` in bash scripts for proper error propagation
- **SHOULD** provide descriptive error messages with actionable information
- **MUST** validate prerequisites before executing commands:
  ```bash
  if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found. Copy .env.local.example first."
    exit 1
  fi
  ```

### Logging and Monitoring

- **SHOULD** use emoji indicators for easy scanning in logs:
  - ✅ Success indicators
  - ❌ Error indicators
  - ⚠️ Warning indicators
  - 🔄 In-progress indicators
- **MUST** include step-by-step status updates in complex operations
- **SHOULD** log environment context in debug scenarios

## Testing Rules

### Test Execution

- **MUST** use `bun run test` for running all tests
- **SHOULD** use Nx for project-specific tests: `bunx nx test @vibechecc/web`
- **MUST** use Happy DOM test environment (already configured)
- **MUST NOT** skip tests (`test.skip()`) - they're considered failing
- **SHOULD** use `bun run test:watch` for development iteration

### Test Structure Requirements

- **MUST** include `/// <reference lib="dom" />` in browser test files
- **MUST** use `@testing-library/react` for component testing
- **MUST** use `convex-test` for Convex function testing
- **MUST** clean up after tests with `afterEach(cleanup)`
- **SHOULD** use `describe` blocks for grouping related tests

### Test Coverage and Quality

- **SHOULD** test edge cases and error conditions
- **MUST** verify data integrity after mutations in backend tests
- **SHOULD** test component interactions, not implementation details
- **MUST** ensure tests can run in parallel (no shared state)

## Quality Checks Rules

### Automated Quality Pipeline

- **MUST** run quality checks before commits: `bun run quality`
- **MUST** use comprehensive quality script:
  ```bash
  bun run quality      # typecheck + test + format:check + lint
  bun run quality:fix  # typecheck + lint:fix + format
  ```
- **SHOULD** set up git hooks for pre-commit quality checks

### Linting and Formatting

- **MUST** use ESLint with TypeScript configuration (already set up)
- **MUST** use Prettier with Tailwind plugin for formatting
- **MUST NOT** fix linter errors unless explicitly requested by human
- **SHOULD** use `bun run lint:fix` and `bun run format` to auto-fix issues
- **MUST** respect existing code formatting patterns

### Type Checking

- **MUST** run `bun run typecheck` before major commits
- **MUST** ensure all TypeScript files have proper type annotations
- **SHOULD** use strict TypeScript configuration
- **MUST NOT** use `any` types without explicit justification

### Cache Management

- **SHOULD** respect Nx cache settings defined in `nx.json`
- **MUST** understand cache inputs: `default`, `production`, `sharedGlobals`
- **SHOULD** use `--skip-nx-cache` flag only for debugging cache issues
- **MUST** clear cache (`bunx nx reset`) if experiencing inconsistent results

## Database Management Rules

### Convex Local Development

- **MUST** run `bunx convex dev` in `apps/convex` directory for backend development
- **SHOULD** use Nx command: `bunx nx dev @vibechecc/convex` for consistency
- **MUST** ensure Convex authentication is configured before starting development
- **SHOULD** monitor Convex dashboard for real-time database changes

### Database Seeding

- **MUST** use provided seed commands for consistent test data:
  ```bash
  bun run seed        # Add 20 users, 25 vibes
  bun run seed:clear  # Clear all database content
  ```
- **SHOULD** seed database after major schema changes
- **MUST** use seed data for testing, not production data in development

### Schema Management

- **MUST** run `bunx convex codegen` (via `bun nx build @vibechecc/convex`) after schema changes
- **MUST** commit generated TypeScript files from Convex codegen
- **SHOULD** understand Convex indexes and prefer them over filters for performance
- **MUST** validate database schema changes against existing data

### Webhook Development

- **MUST** use ngrok for local webhook development: `bun run dev:webhooks`
- **SHOULD** configure webhook URL in Clerk dashboard to point to ngrok tunnel
- **MUST** validate webhook signatures and proper request handling
- **SHOULD** test webhook scenarios locally before deploying

## File Management Rules

### Monorepo Structure

- **MUST** respect workspace boundaries:
  - `apps/web/` - Frontend React application
  - `apps/convex/` - Backend Convex functions and schema
  - `packages/types/` - Shared TypeScript interfaces
  - `packages/utils/` - Shared utility functions
- **MUST NOT** import across workspace boundaries incorrectly
- **SHOULD** use workspace imports: `@vibechecc/types`, `@vibechecc/utils`

### File Naming Conventions

- **MUST** use `kebab-case` for all file names
- **MUST NOT** use underscores or camelCase in file names
- **SHOULD** use descriptive names that reflect file purpose
- **MUST** follow test file naming: `[name].test.ts` or `[name].test.tsx`

### Import Guidelines

- **MUST** use absolute imports in web app: `@/components/ui/button`
- **MUST** use workspace imports for shared packages
- **MUST NOT** import shadcn/ui components outside `apps/web/`
- **SHOULD** group imports logically: external libs, workspace packages, relative imports

## Performance and Optimization Rules

### Build Optimization

- **SHOULD** monitor build times and cache hit rates
- **MUST** use production builds for performance testing
- **SHOULD** understand Nx task dependencies to optimize build order
- **MUST** use parallel execution where safe: `--parallel=true`

### Development Performance

- **SHOULD** use incremental TypeScript compilation
- **SHOULD** leverage Nx caching for faster rebuilds
- **MUST** avoid unnecessary file watching in production-like environments
- **SHOULD** monitor memory usage during long development sessions

### Resource Management

- **MUST** clean up background processes when switching contexts
- **SHOULD** use resource limits for long-running operations
- **MUST** monitor disk space usage (Nx cache, node_modules, build outputs)
- **SHOULD** periodically clean up: `bunx nx reset`, `bun install` fresh

## Troubleshooting Common Issues

### Environment Issues

- **Problem**: "Command not found" errors
  **Solution**: Ensure `bun` is properly installed and in PATH
- **Problem**: Environment variables not loaded
  **Solution**: Check `.env.local` exists and has required variables
- **Problem**: Port conflicts
  **Solution**: Check for running processes on ports 3000, 3210, 3211

### Build Issues

- **Problem**: TypeScript errors during build
  **Solution**: Run `bun run typecheck` to identify and fix type issues
- **Problem**: Cache-related build failures
  **Solution**: Clear Nx cache with `bunx nx reset`
- **Problem**: Dependency resolution issues
  **Solution**: Remove `node_modules`, run `bun install --frozen-lockfile`

### Database Issues

- **Problem**: Convex connection issues
  **Solution**: Verify `VITE_CONVEX_URL` in `.env.local`, check Convex dashboard
- **Problem**: Webhook not receiving events
  **Solution**: Check ngrok tunnel, verify webhook URL in Clerk dashboard
- **Problem**: Seed data not appearing
  **Solution**: Ensure Convex functions are deployed, check database dashboard

### Performance Issues

- **Problem**: Slow build times
  **Solution**: Check Nx cache configuration, use `--parallel` where appropriate
- **Problem**: High memory usage
  **Solution**: Restart development servers, check for memory leaks in code
- **Problem**: Slow tests
  **Solution**: Review test structure, ensure proper cleanup, check for async issues
