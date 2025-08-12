/**
 * @viberatr/utils - Shared utilities for the viberatr workspace
 *
 * This package contains only truly shared utilities that are used
 * across multiple workspaces (frontend, backend, etc.).
 *
 * Workspace-specific utilities should remain in their respective workspaces.
 */

// Constants
// expose limit constants so apps can enforce shared bounds
export * from './constants/limits';

// Date formatting utilities
// re-export date helpers for unified imports
export * from './format/date';
