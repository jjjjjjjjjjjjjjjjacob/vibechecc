import { describe, it, expect } from 'vitest';
import { validators, contentValidation, profileValidation, formValidators } from '../validation';

describe('validators', () => {
  describe('required', () => {
    it('should pass for non-empty values', () => {
      expect(validators.required('test', 'Field').isValid).toBe(true);
      expect(validators.required(0, 'Field').isValid).toBe(true);
      expect(validators.required(false, 'Field').isValid).toBe(true);
    });

    it('should fail for empty values', () => {
      expect(validators.required('', 'Field').isValid).toBe(false);
      expect(validators.required(null, 'Field').isValid).toBe(false);
      expect(validators.required(undefined, 'Field').isValid).toBe(false);
    });

    it('should return appropriate error messages', () => {
      const result = validators.required('', 'Username');
      expect(result.errors).toContain('Username is required');
    });
  });

  describe('minLength', () => {
    it('should pass for strings meeting minimum length', () => {
      expect(validators.minLength('hello', 3, 'Field').isValid).toBe(true);
      expect(validators.minLength('hello', 5, 'Field').isValid).toBe(true);
    });

    it('should fail for strings below minimum length', () => {
      expect(validators.minLength('hi', 3, 'Field').isValid).toBe(false);
      expect(validators.minLength('', 1, 'Field').isValid).toBe(false);
    });
  });

  describe('email', () => {
    it('should pass for valid email addresses', () => {
      expect(validators.email('test@example.com').isValid).toBe(true);
      expect(validators.email('user.name@domain.co.uk').isValid).toBe(true);
      expect(validators.email('').isValid).toBe(true); // Optional field
    });

    it('should fail for invalid email addresses', () => {
      expect(validators.email('invalid-email').isValid).toBe(false);
      expect(validators.email('test@').isValid).toBe(false);
      expect(validators.email('@example.com').isValid).toBe(false);
    });
  });

  describe('username', () => {
    it('should pass for valid usernames', () => {
      expect(validators.username('user123').isValid).toBe(true);
      expect(validators.username('test_user').isValid).toBe(true);
      expect(validators.username('user-name').isValid).toBe(true);
    });

    it('should fail for invalid usernames', () => {
      expect(validators.username('').isValid).toBe(false);
      expect(validators.username('ab').isValid).toBe(false); // Too short
      expect(validators.username('user@name').isValid).toBe(false); // Invalid character
      expect(validators.username('admin').isValid).toBe(false); // Reserved word
    });
  });

  describe('range', () => {
    it('should pass for values within range', () => {
      expect(validators.range(3, 1, 5, 'Rating').isValid).toBe(true);
      expect(validators.range(1, 1, 5, 'Rating').isValid).toBe(true);
      expect(validators.range(5, 1, 5, 'Rating').isValid).toBe(true);
    });

    it('should fail for values outside range', () => {
      expect(validators.range(0, 1, 5, 'Rating').isValid).toBe(false);
      expect(validators.range(6, 1, 5, 'Rating').isValid).toBe(false);
    });
  });
});

describe('contentValidation', () => {
  describe('vibeTitle', () => {
    it('should pass for valid titles', () => {
      expect(contentValidation.vibeTitle('My awesome vibe').isValid).toBe(true);
    });

    it('should fail for empty titles', () => {
      expect(contentValidation.vibeTitle('').isValid).toBe(false);
    });

    it('should fail for overly long titles', () => {
      const longTitle = 'a'.repeat(101);
      expect(contentValidation.vibeTitle(longTitle).isValid).toBe(false);
    });

    it('should provide warnings for short titles', () => {
      const result = contentValidation.vibeTitle('Short');
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });
  });

  describe('vibeContent', () => {
    it('should pass for valid content', () => {
      const validContent = 'This is a longer piece of content that meets the minimum requirements';
      expect(contentValidation.vibeContent(validContent).isValid).toBe(true);
    });

    it('should fail for too short content', () => {
      expect(contentValidation.vibeContent('Short').isValid).toBe(false);
    });

    it('should fail for too long content', () => {
      const longContent = 'a'.repeat(2001);
      expect(contentValidation.vibeContent(longContent).isValid).toBe(false);
    });
  });

  describe('vibeHashtags', () => {
    it('should pass for valid hashtags', () => {
      expect(contentValidation.vibeHashtags(['fun', 'awesome', 'cool']).isValid).toBe(true);
    });

    it('should fail for too many hashtags', () => {
      const manyTags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
      expect(contentValidation.vibeHashtags(manyTags).isValid).toBe(false);
    });

    it('should fail for invalid hashtag format', () => {
      expect(contentValidation.vibeHashtags(['valid', 'invalid@tag']).isValid).toBe(false);
    });

    it('should provide warnings for no hashtags', () => {
      const result = contentValidation.vibeHashtags([]);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });
  });

  describe('ratingValue', () => {
    it('should pass for valid ratings', () => {
      [1, 2, 3, 4, 5].forEach(rating => {
        expect(contentValidation.ratingValue(rating).isValid).toBe(true);
      });
    });

    it('should fail for invalid ratings', () => {
      [0, 6, -1].forEach(rating => {
        expect(contentValidation.ratingValue(rating).isValid).toBe(false);
      });
    });
  });
});

describe('profileValidation', () => {
  describe('displayName', () => {
    it('should pass for valid display names', () => {
      expect(profileValidation.displayName('John Doe').isValid).toBe(true);
      expect(profileValidation.displayName('').isValid).toBe(true); // Optional
    });

    it('should fail for overly long display names', () => {
      const longName = 'a'.repeat(51);
      expect(profileValidation.displayName(longName).isValid).toBe(false);
    });
  });

  describe('bio', () => {
    it('should pass for valid bios', () => {
      expect(profileValidation.bio('I love coding and vibes!').isValid).toBe(true);
      expect(profileValidation.bio('').isValid).toBe(true); // Optional
    });

    it('should fail for overly long bios', () => {
      const longBio = 'a'.repeat(301);
      expect(profileValidation.bio(longBio).isValid).toBe(false);
    });
  });

  describe('website', () => {
    it('should pass for valid URLs', () => {
      expect(profileValidation.website('https://example.com').isValid).toBe(true);
      expect(profileValidation.website('').isValid).toBe(true); // Optional
    });

    it('should fail for invalid URLs', () => {
      expect(profileValidation.website('not-a-url').isValid).toBe(false);
    });
  });
});

describe('formValidators', () => {
  describe('createVibe', () => {
    it('should pass for valid vibe data', () => {
      const validData = {
        title: 'My awesome vibe',
        content: 'This is a longer description of my vibe that meets all requirements',
        hashtags: ['fun', 'awesome']
      };

      const result = formValidators.createVibe(validData);
      expect(result.isValid).toBe(true);
    });

    it('should fail for invalid vibe data', () => {
      const invalidData = {
        title: '',
        content: 'Short',
        hashtags: ['fun', 'awesome', 'invalid@tag']
      };

      const result = formValidators.createVibe(invalidData);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });
  });

  describe('updateProfile', () => {
    it('should pass for valid profile data', () => {
      const validData = {
        displayName: 'John Doe',
        bio: 'I am a developer who loves creating vibes',
        website: 'https://johndoe.com',
        interests: ['coding', 'music']
      };

      const result = formValidators.updateProfile(validData);
      expect(result.isValid).toBe(true);
    });
  });

  describe('createRating', () => {
    it('should pass for valid rating data', () => {
      const validData = {
        value: 4,
        review: 'This is a great vibe that I really enjoyed!'
      };

      const result = formValidators.createRating(validData);
      expect(result.isValid).toBe(true);
    });

    it('should fail for invalid rating data', () => {
      const invalidData = {
        value: 6, // Out of range
        review: 'Short' // Too short
      };

      const result = formValidators.createRating(invalidData);
      expect(result.isValid).toBe(false);
    });
  });
});