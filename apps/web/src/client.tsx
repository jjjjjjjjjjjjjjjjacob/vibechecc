// hydrateRoot attaches React event handlers to server-rendered markup
import { hydrateRoot } from 'react-dom/client';
// StartClient bootstraps the TanStack Start runtime in the browser
import { StartClient } from '@tanstack/react-start';
// local factory that wires up the router, Convex, and React Query
import { createRouter } from './router';

/**
 * Entry point for the client bundle.
 *
 * Creates the router configured with Convex and React Query and hydrates the
 * server-rendered DOM so the app becomes interactive.
 */
const router = createRouter();

// mount the app by hydrating existing markup with the router-enabled client
hydrateRoot(document, <StartClient router={router} />);
