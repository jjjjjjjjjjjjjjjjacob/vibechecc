// Form validation schemas and utilities for vibechecc app

import type { User, Vibe, Rating, EmojiRating } from '@vibechecc/types';

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}

// Individual field validation result
export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Base validation utility functions
export const validators = {
  // String validators
  required: (value: any, fieldName: string = 'Field'): FieldValidationResult => {
    const isValid = value !== undefined && value !== null && value !== '';
    return {
      isValid,
      errors: isValid ? [] : [`${fieldName} is required`],
    };
  },

  minLength: (value: string, min: number, fieldName: string = 'Field'): FieldValidationResult => {
    const length = value?.length || 0;
    const isValid = length >= min;
    return {
      isValid,
      errors: isValid ? [] : [`${fieldName} must be at least ${min} characters`],
    };
  },

  maxLength: (value: string, max: number, fieldName: string = 'Field'): FieldValidationResult => {
    const length = value?.length || 0;
    const isValid = length <= max;
    return {
      isValid,
      errors: isValid ? [] : [`${fieldName} must be no more than ${max} characters`],
    };
  },

  email: (value: string): FieldValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = !value || emailRegex.test(value);
    return {
      isValid,
      errors: isValid ? [] : ['Please enter a valid email address'],
    };
  },

  username: (value: string): FieldValidationResult => {
    const errors: string[] = [];

    if (!value) {
      return { isValid: false, errors: ['Username is required'] };
    }

    // Check length
    if (value.length < 3) {
      errors.push('Username must be at least 3 characters');
    }
    if (value.length > 30) {
      errors.push('Username must be no more than 30 characters');
    }

    // Check format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(value)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }

    // Check for reserved words
    const reservedWords = ['admin', 'root', 'api', 'www', 'app', 'support'];
    if (reservedWords.includes(value.toLowerCase())) {
      errors.push('This username is reserved');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  url: (value: string): FieldValidationResult => {
    if (!value) return { isValid: true, errors: [] };

    try {
      new URL(value);
      return { isValid: true, errors: [] };
    } catch {
      return {
        isValid: false,
        errors: ['Please enter a valid URL'],
      };
    }
  },

  // Number validators
  min: (value: number, min: number, fieldName: string = 'Value'): FieldValidationResult => {
    const isValid = value >= min;
    return {
      isValid,
      errors: isValid ? [] : [`${fieldName} must be at least ${min}`],
    };
  },

  max: (value: number, max: number, fieldName: string = 'Value'): FieldValidationResult => {
    const isValid = value <= max;
    return {
      isValid,
      errors: isValid ? [] : [`${fieldName} must be no more than ${max}`],
    };
  },

  range: (value: number, min: number, max: number, fieldName: string = 'Value'): FieldValidationResult => {
    const isValid = value >= min && value <= max;
    return {
      isValid,
      errors: isValid ? [] : [`${fieldName} must be between ${min} and ${max}`],
    };
  },

  // Array validators
  arrayMinLength: (value: any[], min: number, fieldName: string = 'Items'): FieldValidationResult => {
    const length = value?.length || 0;
    const isValid = length >= min;
    return {
      isValid,
      errors: isValid ? [] : [`Must select at least ${min} ${fieldName.toLowerCase()}`],
    };
  },

  arrayMaxLength: (value: any[], max: number, fieldName: string = 'Items'): FieldValidationResult => {
    const length = value?.length || 0;
    const isValid = length <= max;
    return {
      isValid,
      errors: isValid ? [] : [`Cannot select more than ${max} ${fieldName.toLowerCase()}`],
    };
  },
};

// Content validation
export const contentValidation = {
  vibeTitle: (title: string): FieldValidationResult => {
    const results = [
      validators.required(title, 'Title'),
      validators.minLength(title, 1, 'Title'),
      validators.maxLength(title, 100, 'Title'),
    ];

    const errors = results.flatMap(r => r.errors);
    const warnings: string[] = [];

    // Add warnings for better titles
    if (title && title.length < 10) {
      warnings.push('Consider adding more detail to your title');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  vibeContent: (content: string): FieldValidationResult => {
    const results = [
      validators.minLength(content, 10, 'Content'),
      validators.maxLength(content, 2000, 'Content'),
    ];

    const errors = results.flatMap(r => r.errors);
    const warnings: string[] = [];

    // Add warnings for better content
    if (content && content.length < 50) {
      warnings.push('Consider adding more detail to help others understand your vibe');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  vibeHashtags: (hashtags: string[]): FieldValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate array length
    if (hashtags.length > 10) {
      errors.push('Cannot have more than 10 hashtags');
    }

    // Validate individual hashtags
    hashtags.forEach((tag, index) => {
      if (!tag.match(/^[a-zA-Z0-9_]+$/)) {
        errors.push(`Hashtag ${index + 1} can only contain letters, numbers, and underscores`);
      }
      if (tag.length > 30) {
        errors.push(`Hashtag ${index + 1} cannot be longer than 30 characters`);
      }
    });

    // Warnings
    if (hashtags.length === 0) {
      warnings.push('Adding hashtags helps others discover your vibe');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  ratingValue: (value: number): FieldValidationResult => {
    return validators.range(value, 1, 5, 'Rating');
  },

  ratingReview: (review: string): FieldValidationResult => {
    const results = [
      validators.required(review, 'Review'),
      validators.minLength(review, 10, 'Review'),
      validators.maxLength(review, 500, 'Review'),
    ];

    const errors = results.flatMap(r => r.errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Profile validation
export const profileValidation = {
  displayName: (name: string): FieldValidationResult => {
    const results = [
      validators.maxLength(name, 50, 'Display name'),
    ];

    return {
      isValid: results.every(r => r.isValid),
      errors: results.flatMap(r => r.errors),
    };
  },

  bio: (bio: string): FieldValidationResult => {
    const results = [
      validators.maxLength(bio, 300, 'Bio'),
    ];

    const warnings: string[] = [];
    if (bio && bio.length < 20) {
      warnings.push('Consider adding more information to help others learn about you');
    }

    return {
      isValid: results.every(r => r.isValid),
      errors: results.flatMap(r => r.errors),
      warnings,
    };
  },

  website: (website: string): FieldValidationResult => {
    if (!website) return { isValid: true, errors: [] };
    return validators.url(website);
  },

  interests: (interests: string[]): FieldValidationResult => {
    const results = [
      validators.arrayMaxLength(interests, 20, 'Interests'),
    ];

    return {
      isValid: results.every(r => r.isValid),
      errors: results.flatMap(r => r.errors),
    };
  },
};

// Search validation
export const searchValidation = {
  query: (query: string): FieldValidationResult => {
    const results = [
      validators.maxLength(query, 100, 'Search query'),
    ];

    const warnings: string[] = [];
    if (query && query.length < 2) {
      warnings.push('Search queries should be at least 2 characters for better results');
    }

    return {
      isValid: results.every(r => r.isValid),
      errors: results.flatMap(r => r.errors),
      warnings,
    };
  },

  tags: (tags: string[]): FieldValidationResult => {
    return validators.arrayMaxLength(tags, 10, 'Tags');
  },
};

// Form validation utilities
export function validateForm<T extends Record<string, any>>(
  data: T,
  validationRules: Record<keyof T, (value: any) => FieldValidationResult>
): ValidationResult {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  let isValid = true;

  Object.entries(validationRules).forEach(([field, validator]) => {
    const result = validator(data[field]);

    if (!result.isValid) {
      isValid = false;
      errors[field] = result.errors;
    }

    if (result.warnings && result.warnings.length > 0) {
      warnings[field] = result.warnings;
    }
  });

  return {
    isValid,
    errors,
    warnings: Object.keys(warnings).length > 0 ? warnings : undefined,
  };
}

// Specific form validators
export const formValidators = {
  createVibe: (data: {
    title: string;
    content: string;
    hashtags: string[];
  }): ValidationResult => {
    return validateForm(data, {
      title: contentValidation.vibeTitle,
      content: contentValidation.vibeContent,
      hashtags: contentValidation.vibeHashtags,
    });
  },

  updateProfile: (data: {
    displayName: string;
    bio: string;
    website: string;
    interests: string[];
  }): ValidationResult => {
    return validateForm(data, {
      displayName: profileValidation.displayName,
      bio: profileValidation.bio,
      website: profileValidation.website,
      interests: profileValidation.interests,
    });
  },

  createRating: (data: {
    value: number;
    review: string;
  }): ValidationResult => {
    return validateForm(data, {
      value: contentValidation.ratingValue,
      review: contentValidation.ratingReview,
    });
  },

  search: (data: {
    query: string;
    tags: string[];
  }): ValidationResult => {
    return validateForm(data, {
      query: searchValidation.query,
      tags: searchValidation.tags,
    });
  },
};

// Utility functions
export const validationUtils = {
  // Get first error message for a field
  getFirstError: (errors: Record<string, string[]>, field: string): string | null => {
    const fieldErrors = errors[field];
    return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : null;
  },

  // Check if form has any errors
  hasErrors: (errors: Record<string, string[]>): boolean => {
    return Object.values(errors).some(fieldErrors => fieldErrors.length > 0);
  },

  // Get total error count
  getErrorCount: (errors: Record<string, string[]>): number => {
    return Object.values(errors).reduce((total, fieldErrors) => total + fieldErrors.length, 0);
  },

  // Combine validation results
  combineResults: (...results: FieldValidationResult[]): FieldValidationResult => {
    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings || []);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    };
  },

  // Clean and prepare data before validation
  sanitizeInput: (input: string): string => {
    return input?.trim().replace(/\s+/g, ' ') || '';
  },

  // Check if string contains profanity (basic implementation)
  containsProfanity: (text: string): boolean => {
    const profanityWords = ['spam', 'fake']; // Add actual profanity filter
    const lowerText = text.toLowerCase();
    return profanityWords.some(word => lowerText.includes(word));
  },
};