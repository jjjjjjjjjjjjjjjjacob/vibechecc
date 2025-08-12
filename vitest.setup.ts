/**
 * Global test setup for Vitest. We polyfill the DOM environment using
 * happy-dom and extend Jest matchers so component tests can assert on
 * DOM state in a browser-like environment.
 */
import '@testing-library/jest-dom/vitest';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Register the happy-dom globals (window, document, etc.) before tests run
GlobalRegistrator.register();
