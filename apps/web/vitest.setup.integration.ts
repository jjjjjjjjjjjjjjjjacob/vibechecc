/// <reference lib="dom" />
import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Set up environment variables for testing
process.env.VITE_CONVEX_URL =
  process.env.VITE_CONVEX_URL || 'https://test.convex.cloud';
process.env.VITE_CLERK_PUBLISHABLE_KEY =
  process.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Setup before all tests
beforeAll(() => {
  // Any global setup needed for integration tests
  console.log(
    'Running integration tests with Convex backend:',
    process.env.VITE_CONVEX_URL
  );
});

// Cleanup after all tests
afterAll(() => {
  // Any global cleanup needed
});

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock HTMLElement methods
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => {};
  HTMLElement.prototype.releasePointerCapture = () => {};
}
