/// <reference lib="dom" />
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import {
  renderWithAuth,
  renderWithoutAuth,
  TestUserDisplay,
  mockIntersectionObserver,
  mockResizeObserver,
  mockMatchMedia,
  createMockEvent,
  createMockTouchEvent,
  assertAccessibility,
} from './test-utils';
import { mockUsers } from './mock-data';

describe('Test Utils', () => {
  describe('renderWithAuth', () => {
    it('should render components with authenticated user context', () => {
      renderWithAuth(<TestUserDisplay />);

      expect(screen.getByTestId('is-signed-in')).toHaveTextContent('true');
      expect(screen.getByTestId('is-loaded')).toHaveTextContent('true');
      expect(screen.getByTestId('user-id')).toHaveTextContent(
        mockUsers.alice._id || ''
      );
      expect(screen.getByTestId('username')).toHaveTextContent(
        mockUsers.alice.username || ''
      );
    });

    it('should render with custom user', () => {
      renderWithAuth(<TestUserDisplay />, { user: mockUsers.bob });

      expect(screen.getByTestId('user-id')).toHaveTextContent(
        mockUsers.bob._id || ''
      );
      expect(screen.getByTestId('username')).toHaveTextContent(
        mockUsers.bob.username || ''
      );
    });
  });

  describe('renderWithoutAuth', () => {
    it('should render components with unauthenticated user context', () => {
      renderWithoutAuth(<TestUserDisplay />);

      expect(screen.getByTestId('is-signed-in')).toHaveTextContent('false');
      expect(screen.getByTestId('is-loaded')).toHaveTextContent('true');
      expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
    });
  });

  describe('Mock utilities', () => {
    it('should mock IntersectionObserver', () => {
      mockIntersectionObserver();
      expect(window.IntersectionObserver).toBeDefined();

      const observer = new window.IntersectionObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.unobserve).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });

    it('should mock ResizeObserver', () => {
      mockResizeObserver();
      expect(window.ResizeObserver).toBeDefined();

      const observer = new window.ResizeObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.unobserve).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });

    it('should mock matchMedia', () => {
      mockMatchMedia(true);
      expect(window.matchMedia).toBeDefined();

      const mediaQuery = window.matchMedia('(min-width: 768px)');
      expect(mediaQuery.matches).toBe(true);
    });

    it('should create mock events', () => {
      const event = createMockEvent('click');
      expect(event.type).toBe('click');
      expect(event.bubbles).toBe(true);
      expect(event.cancelable).toBe(true);
    });

    it('should create mock touch events', () => {
      const touches = [{ clientX: 100, clientY: 200 }];
      const event = createMockTouchEvent('touchstart', touches) as Event & {
        touches: Touch[];
      };

      expect(event.type).toBe('touchstart');
      expect(event.touches.length).toBe(1);
      expect(event.touches[0].clientX).toBe(100);
      expect(event.touches[0].clientY).toBe(200);
    });
  });

  describe('assertAccessibility', () => {
    it('should check accessibility attributes', () => {
      // Create test elements
      const elementWithRole = document.createElement('button');
      elementWithRole.setAttribute('role', 'button');

      const elementWithAriaLabel = document.createElement('div');
      elementWithAriaLabel.setAttribute('aria-label', 'Test label');

      const elementWithoutA11y = document.createElement('div');

      const roleResult = assertAccessibility(elementWithRole);
      const ariaResult = assertAccessibility(elementWithAriaLabel);
      const noA11yResult = assertAccessibility(elementWithoutA11y);

      expect(roleResult.hasRole).toBe(true);
      expect(roleResult.isAccessible).toBe(true);

      expect(ariaResult.hasAriaLabel).toBe(true);
      expect(ariaResult.isAccessible).toBe(true);

      expect(noA11yResult.isAccessible).toBe(false);
    });
  });
});
