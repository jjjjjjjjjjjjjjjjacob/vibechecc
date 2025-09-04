/// <reference lib="dom" />
import * as React from 'react';
import { cleanup, render, type RenderOptions } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import {
  MockAuthenticatedProvider,
  MockUnauthenticatedProvider,
  MockAppProvider,
  useMockUser,
} from './mock-providers';
import { mockUsers } from './mock-data';

/**
 * Enhanced testing utilities with custom render functions for different auth states
 */

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});

// Custom render function for authenticated users
export function renderWithAuth(
  ui: React.ReactElement,
  options: RenderOptions & {
    user?: typeof mockUsers.alice;
  } = {}
) {
  const { user = mockUsers.alice, ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MockAuthenticatedProvider user={user}>
        {children}
      </MockAuthenticatedProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Custom render function for unauthenticated users
export function renderWithoutAuth(
  ui: React.ReactElement,
  options: RenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MockUnauthenticatedProvider>{children}</MockUnauthenticatedProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Custom render function with full app context (including routing)
export function renderWithApp(
  ui: React.ReactElement,
  options: RenderOptions & {
    initialRoute?: string;
    user?: typeof mockUsers.alice;
    isSignedIn?: boolean;
  } = {}
) {
  const {
    initialRoute = '/',
    user = mockUsers.alice,
    isSignedIn = true,
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MockAppProvider
        initialRoute={initialRoute}
        user={user}
        isSignedIn={isSignedIn}
      >
        {children}
      </MockAppProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Utility to create a test component that displays mock user data
export function TestUserDisplay() {
  const { user, isSignedIn, isLoaded } = useMockUser();

  return (
    <div data-testid="test-user-display">
      <div data-testid="is-signed-in">{isSignedIn ? 'true' : 'false'}</div>
      <div data-testid="is-loaded">{isLoaded ? 'true' : 'false'}</div>
      {user && (
        <div data-testid="user-info">
          <div data-testid="user-id">{user._id}</div>
          <div data-testid="username">{user.username}</div>
          <div data-testid="full-name">{user.full_name}</div>
        </div>
      )}
    </div>
  );
}

// Wait for async operations in tests
export function waitForLoadingToFinish() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

// Mock intersection observer for tests that use it
export function mockIntersectionObserver() {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

// Mock ResizeObserver for tests that use it
export function mockResizeObserver() {
  window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

// Mock window.matchMedia for responsive tests
export function mockMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock performance.now() for performance tests
export function mockPerformanceNow(mockTime = 1000) {
  global.performance = global.performance || {};
  global.performance.now = vi.fn(() => mockTime);
}

// Mock console methods to avoid noise in tests
export function mockConsole() {
  const originalConsole = { ...console };

  const enableMocking = () => {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  };

  const restoreMocking = () => {
    Object.assign(console, originalConsole);
  };

  return { enableMocking, restoreMocking };
}

// Create a mock event for testing event handlers
export function createMockEvent(
  type: string,
  options: Partial<Event> = {}
): Event {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  });
  return event;
}

// Create mock touch event for mobile testing
export function createMockTouchEvent(
  type: string,
  touches: Array<{ clientX: number; clientY: number }> = [
    { clientX: 0, clientY: 0 },
  ]
): Event {
  // Create a simple mock event that can be used for testing touch interactions
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as Event & {
    touches: Touch[];
    targetTouches: Touch[];
    changedTouches: Touch[];
  };

  const mockTouches = touches.map(
    (touch, index) =>
      ({
        identifier: index,
        target: document.body,
        clientX: touch.clientX,
        clientY: touch.clientY,
        pageX: touch.clientX,
        pageY: touch.clientY,
        screenX: touch.clientX,
        screenY: touch.clientY,
        force: 1,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
      }) as Touch
  );

  event.touches = mockTouches;
  event.targetTouches = mockTouches;
  event.changedTouches = mockTouches;

  return event;
}

// Assert that an element has specific accessibility attributes
export function assertAccessibility(element: HTMLElement) {
  const checks = {
    hasRole: !!element.getAttribute('role'),
    hasAriaLabel: !!element.getAttribute('aria-label'),
    hasAriaLabelledBy: !!element.getAttribute('aria-labelledby'),
    hasTabIndex: element.getAttribute('tabindex') !== null,
  };

  return {
    ...checks,
    isAccessible: Object.values(checks).some(Boolean),
  };
}

// Re-export everything from testing-library for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
