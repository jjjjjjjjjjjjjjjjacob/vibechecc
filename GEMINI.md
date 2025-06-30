- Refer to the files in `@.cursor/**` for project-specific guidelines and rules.

---

## Project "VibeChecc" Overview

This is a full-stack web application that allows users to share, discover, rate, and react to "vibes."

### Core Technologies

- **Frontend**:
  - **Framework**: React with TanStack Router.
  - **UI**: `shadcn/ui` (Radix UI) and custom components.
  - **Styling**: Tailwind CSS.
  - **State Management**: TanStack Query integrated with Convex.
  - **Build Tool**: Vite.
  - **Package Manager**: Bun.

- **Backend**:
  - **Platform**: Convex (real-time database, serverless functions).
  - **Authentication**: Clerk, integrated via webhooks.

- **Testing**:
  - **Framework**: Vitest.
  - **Libraries**: `@testing-library/react` (frontend), `convex-test` (backend).

- **Analytics**: PostHog.

### Directory Structure & Key Files

- **`convex/`**: All backend logic.
  - `schema.ts`: Database schema (`users`, `vibes`, `ratings`, `reactions`).
  - `users.ts`, `vibes.ts`: Core business logic (queries, mutations).
  - `http.ts`: Clerk webhooks for user sync.
  - `auth.config.js`: Clerk auth provider configuration.

- **`src/`**: All frontend code.
  - `router.tsx`, `routes/`: Application routes via TanStack Router.
  - `queries.ts`: Centralized custom hooks for data fetching from Convex.
  - `components/ui/`: Base UI components from `shadcn/ui`.
  - `features/`: Feature-based modules (e.g., `auth`, `onboarding`, `vibes`).

### Key Architectural Patterns

- **Full-Stack Type Safety**: End-to-end type safety from Convex to the frontend.
- **Hook-Based Data Fetching**: `src/queries.ts` provides hooks like `useVibes` and `useCurrentUser` for components to interact with the backend.
- **Real-time Data Sync**: Frontend automatically updates when backend data changes via Convex's real-time capabilities.
- **Feature-Sliced Structure**: Code is organized by feature, promoting modularity and separation of concerns.