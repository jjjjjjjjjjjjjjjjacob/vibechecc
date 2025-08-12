# AGENTS

## naming
- use kebab-case for file names throughout the repo.
- exceptions:
  - Convex-generated `_generated` files and TanStack Start's `routeTree.gen.ts`
  - route segments with variables (e.g. `routes/vibes/$vibeId.tsx`)
  - the root component (`__root.tsx`)

## comments
- include thorough comments to explain intent and reasoning for almost every line.
- document functions and modules in TypeScript/JavaScript using JSDoc 3 style blocks.

## ui text
- keep UI copy lowercase and avoid `uppercase` utility classes.

## convex
- follow [Convex best practices](https://docs.convex.dev/understanding/best-practices/)
  - favor indexed queries over full scans; add indexes when filtering or ordering
  - validate arguments with schema helpers before performing writes
  - keep queries and mutations small and focused

## web
- follow [TanStack Start patterns](https://tanstack.com/start/latest/docs/framework/react/overview)
  - use `createFileRoute` for routing and colocate loaders/actions with components
  - prefer redirects without surrounding `try/catch` blocks
  - keep file names in kebab-case as noted above

## clerk
- consult [Clerk docs](https://clerk.com/docs) for authentication usage
  - use `ClerkProvider` at the app root and `useUser`/`getAuth` helpers
  - never expose secret keys or tokens to the client

## workflow
- keep tests co-located with source and avoid skipped tests
- run `bun run lint` and `bun run test` before committing.
