import { describe, it, expect } from 'vitest';
import { computeUserDisplayName, getUserInitials } from './user-utils';
import type { User } from '../types';

describe('User Utils', () => {
  describe('computeUserDisplayName', () => {
    it('should prioritize username over other fields', () => {
      const user: User = {
        externalId: '123',
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
      };

      expect(computeUserDisplayName(user)).toBe('johndoe');
    });

    it('should use first_name + last_name when username is not available', () => {
      const user: User = {
        externalId: '123',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Smith',
      };

      expect(computeUserDisplayName(user)).toBe('John Doe');
    });

    it('should use only first_name if last_name is missing', () => {
      const user: User = {
        externalId: '123',
        first_name: 'John',
        full_name: 'John Smith',
      };

      expect(computeUserDisplayName(user)).toBe('John');
    });

    it('should use legacy name field when Clerk fields are not available', () => {
      const user: User = {
        externalId: '123',
        full_name: 'John Smith',
      };

      expect(computeUserDisplayName(user)).toBe('John Smith');
    });

    it('should return Unknown User as fallback when no fields are available', () => {
      const user: User = {
        externalId: '123',
      };

      expect(computeUserDisplayName(user)).toBe('Unknown User');
    });

    it('should handle null user', () => {
      expect(computeUserDisplayName(null)).toBe('Unknown User');
    });

    it('should trim whitespace from fields', () => {
      const user: User = {
        externalId: '123',
        first_name: '  John  ',
        last_name: '  Doe  ',
      };

      expect(computeUserDisplayName(user)).toBe('John Doe');
    });
  });

  describe('getUserInitials', () => {
    it('should return initials from first and last name', () => {
      const user: User = {
        externalId: '123',
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
      };

      expect(getUserInitials(user)).toBe('JO');
    });

    it('should handle single names', () => {
      const user: User = {
        externalId: '123',
        username: 'johndoe',
      };

      expect(getUserInitials(user)).toBe('JO');
    });

    it('should handle short names', () => {
      const user: User = {
        externalId: '123',
        username: 'x',
      };

      expect(getUserInitials(user)).toBe('X');
    });

    it('should handle null user', () => {
      expect(getUserInitials(null)).toBe('UU'); // "Unknown User" -> "UU"
    });
  });
});
