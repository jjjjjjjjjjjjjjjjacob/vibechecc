# viberater Frontend

> **Note:** For monorepo setup, scripts, and infrastructure, see the [root README.md](../../README.md).

This directory contains the source code for the viberater frontend application, built with the [TanStack Start](https://tanstack.com/start) framework.

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
│   ├── emoji-*.tsx     # Emoji rating system components
│   └── *.tsx           # Custom, reusable components
├── features/           # Feature-based modules
│   ├── auth/           # Authentication components and hooks
│   ├── onboarding/     # Onboarding flow components
│   ├── search/         # Search functionality with filters
│   └── vibes/          # Vibe-related components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and libraries
│   └── emoji-database.ts # Emoji metadata and categories
├── queries.ts          # Centralized data fetching hooks for Convex
├── routes/             # Application routes defined with TanStack Router
├── styles/             # Global styles and Tailwind CSS configuration
├── types.ts            # Core TypeScript types
└── router.tsx          # Router configuration
```

## Key Architectural Patterns

- **Full-Stack Type Safety**: End-to-end type safety from Convex backend to frontend.
- **Hook-Based Data Fetching**: `src/queries.ts` provides custom hooks (e.g., `useVibes`, `useCurrentUser`) built on TanStack Query for real-time, cached data.
- **Feature-Sliced Design**: Codebase is organized by features (e.g., `auth`, `onboarding`, `vibes`) for modularity and clear separation of concerns.

## Adding New Features

- **Shared Components**: Place in `src/components/` if reusable.
- **Feature-Specific Components**: Place in `src/features/<feature>/components/`.
- **UI Primitives**: Use or extend from `src/components/ui/` (shadcn/ui).
- **Routes**: Add new files in `src/routes/` (file-based routing).

## State Management

- **Server State**: Managed by TanStack Query via custom hooks in `src/queries.ts`.
- **Client State**: Use React's built-in hooks for local state.

## Testing

Frontend tests use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro).

- Test files are co-located with the code they test (e.g., `my-component.test.tsx`).
- Run tests with `bun run test` from the repo root.

## Key Components

### Emoji Rating System

The frontend includes a comprehensive emoji rating system:

#### Components

- **`emoji-rating-display.tsx`**: Displays emoji ratings with animations and hover effects
- **`emoji-rating-popover.tsx`**: Interactive popover for creating emoji ratings
- **`emoji-reaction.tsx`**: Circular emoji reaction buttons with hover states
- **`emoji-rating-selector.tsx`**: Rating scale selector (1-5) with visual feedback
- **`decimal-rating-selector.tsx`**: Precise rating input with decimal support
- **`top-emoji-ratings-accordion.tsx`**: Expandable list of emoji ratings

#### Features

- Smooth spring animations using framer-motion
- Theme-aware styling with Tailwind CSS
- Backward compatibility with star ratings
- Required review text for all ratings
- Tag-based categorization
- Responsive design for all screen sizes
