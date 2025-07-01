# vibechecc Frontend

This directory contains the source code for the vibechecc frontend application, built with the [TanStack Start](https://tanstack.com/start) framework.

## Overview

The frontend is a modern React application that provides a rich user experience for sharing and discovering "vibes." It is designed to be fast, type-safe, and highly interactive, with real-time updates from the Convex backend.

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://framer.com/motion/)

## Project Structure

```
src/
├── components/         # Shared UI components
│   ├── ui/             # Base components from shadcn/ui
│   └── *.tsx           # Custom, reusable components
├── features/           # Feature-based modules
│   ├── auth/           # Authentication components and hooks
│   ├── onboarding/     # Onboarding flow components
│   └── vibes/          # Vibe-related components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and libraries
├── queries.ts          # Centralized data fetching hooks for Convex
├── routes/             # Application routes defined with TanStack Router
├── styles/             # Global styles and Tailwind CSS configuration
├── types.ts            # Core TypeScript types
└── router.tsx          # Router configuration
```

## Key Architectural Patterns

- **Full-Stack Type Safety**: We leverage end-to-end type safety from our Convex backend to the frontend, ensuring that data models and APIs are consistent.
- **Hook-Based Data Fetching**: The `src/queries.ts` file provides custom hooks (e.g., `useVibes`, `useCurrentUser`) that serve as the primary way for components to interact with the backend. These hooks are built on top of TanStack Query and provide caching, refetching, and real-time updates.
- **Feature-Sliced Design**: The codebase is organized by features (e.g., `auth`, `onboarding`, `vibes`) to promote modularity and a clear separation of concerns. Each feature directory contains all the components, hooks, and types related to that specific feature.

## Adding New Features

### Creating a New Component

1.  **Shared Components**: If the component is reusable across multiple features, place it in `src/components/`.
2.  **Feature-Specific Components**: If the component is only used within a single feature, place it inside the corresponding `src/features/<feature-name>/components/` directory.
3.  **UI Primitives**: For low-level UI elements, consider using or extending components from `src/components/ui/` (shadcn/ui).

### Creating a New Route

1.  Add a new file in the `src/routes/` directory. TanStack Router uses a file-based routing system.
2.  Define the route component and any loaders or actions needed.
3.  The route will be automatically available in the application.

## State Management

- **Server State**: Managed by TanStack Query through the custom hooks in `src/queries.ts`. This handles all data fetching, caching, and synchronization with the Convex backend.
- **Client State**: For local component state, use React's built-in hooks like `useState` and `useReducer`. Avoid global client state managers unless absolutely necessary.

## Testing

Frontend tests are written with [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro).

- Test files are co-located with the code they are testing (e.g., `my-component.test.tsx` next to `my-component.tsx`).
- Run tests with `bun run test`.
