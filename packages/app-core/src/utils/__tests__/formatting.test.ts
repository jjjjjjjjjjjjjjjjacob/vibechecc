import { describe, it, expect } from 'vitest';
import { dateUtils, numberUtils, textUtils, userUtils, colorUtils } from '../formatting';

describe('dateUtils', () => {
  describe('formatRelativeTime', () => {
    const now = new Date();

    it('should format recent times correctly', () => {
      const justNow = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
      expect(dateUtils.formatRelativeTime(justNow)).toBe('Just now');

      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      expect(dateUtils.formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      expect(dateUtils.formatRelativeTime(twoHoursAgo)).toBe('2h ago');

      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      expect(dateUtils.formatRelativeTime(threeDaysAgo)).toBe('3d ago');
    });

    it('should handle invalid dates', () => {
      expect(dateUtils.formatRelativeTime('invalid')).toBe('Invalid date');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = dateUtils.formatDate(date);
      expect(formatted).toMatch(/Jan 15, 2024/);
    });
  });

  describe('isToday', () => {
    it('should correctly identify today\'s date', () => {
      const today = new Date();
      expect(dateUtils.isToday(today)).toBe(true);

      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      expect(dateUtils.isToday(yesterday)).toBe(false);
    });
  });
});

describe('numberUtils', () => {
  describe('formatCount', () => {
    it('should format small numbers as-is', () => {
      expect(numberUtils.formatCount(42)).toBe('42');
      expect(numberUtils.formatCount(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(numberUtils.formatCount(1000)).toBe('1.0K');
      expect(numberUtils.formatCount(1500)).toBe('1.5K');
      expect(numberUtils.formatCount(999999)).toBe('999.9K');
    });

    it('should format millions with M suffix', () => {
      expect(numberUtils.formatCount(1000000)).toBe('1.0M');
      expect(numberUtils.formatCount(2500000)).toBe('2.5M');
    });

    it('should format billions with B suffix', () => {
      expect(numberUtils.formatCount(1000000000)).toBe('1.0B');
    });
  });

  describe('formatRating', () => {
    it('should format ratings correctly', () => {
      expect(numberUtils.formatRating(4.2)).toBe('4.2/5');
      expect(numberUtils.formatRating(3.0, 10)).toBe('3.0/10');
    });
  });

  describe('formatPercentage', () => {
    it('should calculate and format percentages', () => {
      expect(numberUtils.formatPercentage(25, 100)).toBe('25.0%');
      expect(numberUtils.formatPercentage(1, 3)).toBe('33.3%');
      expect(numberUtils.formatPercentage(0, 0)).toBe('0%');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(numberUtils.formatFileSize(0)).toBe('0 B');
      expect(numberUtils.formatFileSize(1024)).toBe('1.0 KB');
      expect(numberUtils.formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(numberUtils.formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format durations correctly', () => {
      expect(numberUtils.formatDuration(45)).toBe('45s');
      expect(numberUtils.formatDuration(90)).toBe('1m 30s');
      expect(numberUtils.formatDuration(3600)).toBe('1h 0m');
      expect(numberUtils.formatDuration(3660)).toBe('1h 1m');
    });
  });
});

describe('textUtils', () => {
  describe('truncate', () => {
    it('should truncate text longer than maxLength', () => {
      const text = 'This is a long piece of text';
      expect(textUtils.truncate(text, 10)).toBe('This is a...');
    });

    it('should return text as-is if shorter than maxLength', () => {
      const text = 'Short text';
      expect(textUtils.truncate(text, 20)).toBe('Short text');
    });
  });

  describe('truncateWords', () => {
    it('should truncate text by word count', () => {
      const text = 'This is a long piece of text';
      expect(textUtils.truncateWords(text, 3)).toBe('This is a...');
    });

    it('should return text as-is if word count is within limit', () => {
      const text = 'Short text';
      expect(textUtils.truncateWords(text, 5)).toBe('Short text');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(textUtils.capitalize('hello')).toBe('Hello');
      expect(textUtils.capitalize('HELLO')).toBe('HELLO');
      expect(textUtils.capitalize('')).toBe('');
    });
  });

  describe('titleCase', () => {
    it('should convert to title case', () => {
      expect(textUtils.titleCase('hello world')).toBe('Hello World');
      expect(textUtils.titleCase('HELLO WORLD')).toBe('Hello World');
    });
  });

  describe('extractHashtags', () => {
    it('should extract hashtags from text', () => {
      const text = 'This is #awesome and #cool text';
      expect(textUtils.extractHashtags(text)).toEqual(['awesome', 'cool']);
    });

    it('should return empty array if no hashtags', () => {
      expect(textUtils.extractHashtags('No hashtags here')).toEqual([]);
    });
  });

  describe('extractMentions', () => {
    it('should extract mentions from text', () => {
      const text = 'Hello @john and @jane!';
      expect(textUtils.extractMentions(text)).toEqual(['john', 'jane']);
    });

    it('should return empty array if no mentions', () => {
      expect(textUtils.extractMentions('No mentions here')).toEqual([]);
    });
  });

  describe('slugify', () => {
    it('should create valid slugs', () => {
      expect(textUtils.slugify('Hello World!')).toBe('hello-world');
      expect(textUtils.slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(textUtils.slugify('Special@#$Characters')).toBe('specialcharacters');
    });
  });

  describe('getReadingTime', () => {
    it('should estimate reading time', () => {
      const shortText = 'This is a short text.';
      expect(textUtils.getReadingTime(shortText)).toBe('1 min read');

      const longText = Array(1000).fill('word').join(' ');
      const result = textUtils.getReadingTime(longText);
      expect(result).toMatch(/\d+ min read/);
    });
  });
});

describe('userUtils', () => {
  describe('getDisplayName', () => {
    it('should return full name when available', () => {
      const user = { firstName: 'John', lastName: 'Doe' };
      expect(userUtils.getDisplayName(user)).toBe('John Doe');
    });

    it('should return username when no full name', () => {
      const user = { username: 'johndoe' };
      expect(userUtils.getDisplayName(user)).toBe('@johndoe');
    });

    it('should return email prefix when only email available', () => {
      const user = { email: 'john@example.com' };
      expect(userUtils.getDisplayName(user)).toBe('john');
    });

    it('should return fallback for empty user', () => {
      const user = {};
      expect(userUtils.getDisplayName(user)).toBe('Anonymous User');
    });
  });

  describe('getInitials', () => {
    it('should generate initials from full name', () => {
      const user = { firstName: 'John', lastName: 'Doe' };
      expect(userUtils.getInitials(user)).toBe('JD');
    });

    it('should generate initials from first name only', () => {
      const user = { firstName: 'John' };
      expect(userUtils.getInitials(user)).toBe('J');
    });

    it('should generate initials from username', () => {
      const user = { username: 'johndoe' };
      expect(userUtils.getInitials(user)).toBe('JO');
    });

    it('should generate initials from email', () => {
      const user = { email: 'john@example.com' };
      expect(userUtils.getInitials(user)).toBe('J');
    });

    it('should return fallback for empty user', () => {
      const user = {};
      expect(userUtils.getInitials(user)).toBe('U');
    });
  });

  describe('formatUsername', () => {
    it('should add @ prefix if not present', () => {
      expect(userUtils.formatUsername('johndoe')).toBe('@johndoe');
    });

    it('should not double @ prefix', () => {
      expect(userUtils.formatUsername('@johndoe')).toBe('@johndoe');
    });

    it('should handle empty username', () => {
      expect(userUtils.formatUsername('')).toBe('');
      expect(userUtils.formatUsername(undefined)).toBe('');
    });
  });

  describe('getAvatarUrl', () => {
    it('should return imageUrl when available', () => {
      const user = { imageUrl: 'https://example.com/avatar.jpg' };
      expect(userUtils.getAvatarUrl(user)).toBe('https://example.com/avatar.jpg');
    });

    it('should generate placeholder when no imageUrl', () => {
      const user = { firstName: 'John', lastName: 'Doe' };
      const avatarUrl = userUtils.getAvatarUrl(user);
      expect(avatarUrl).toContain('ui-avatars.com');
      expect(avatarUrl).toContain('name=JD');
    });
  });
});

describe('colorUtils', () => {
  describe('getColorForString', () => {
    it('should return consistent colors for same string', () => {
      const color1 = colorUtils.getColorForString('test');
      const color2 = colorUtils.getColorForString('test');
      expect(color1).toBe(color2);
    });

    it('should return different colors for different strings', () => {
      const color1 = colorUtils.getColorForString('test1');
      const color2 = colorUtils.getColorForString('test2');
      expect(color1).not.toBe(color2);
    });

    it('should return valid hex colors', () => {
      const color = colorUtils.getColorForString('test');
      expect(color).toMatch(/^#[A-Fa-f0-9]{6}$/);
    });
  });

  describe('hexToRgb', () => {
    it('should convert hex to RGB correctly', () => {
      expect(colorUtils.hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(colorUtils.hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(colorUtils.hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle hex without # prefix', () => {
      expect(colorUtils.hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should return null for invalid hex', () => {
      expect(colorUtils.hexToRgb('invalid')).toBeNull();
    });
  });

  describe('getContrastColor', () => {
    it('should return white for dark backgrounds', () => {
      expect(colorUtils.getContrastColor('#000000')).toBe('#FFFFFF');
    });

    it('should return black for light backgrounds', () => {
      expect(colorUtils.getContrastColor('#FFFFFF')).toBe('#000000');
    });

    it('should handle invalid colors', () => {
      expect(colorUtils.getContrastColor('invalid')).toBe('#000000');
    });
  });
});