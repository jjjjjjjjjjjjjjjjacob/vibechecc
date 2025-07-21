/**
 * Search utilities for parsing queries and operators
 */

export interface ParsedQuery {
  terms: string[];
  exactPhrases: string[];
  excludedTerms: string[];
  tags: string[];
  filters: {
    user?: string;
    minRating?: number;
    maxRating?: number;
    dateAfter?: string;
    dateBefore?: string;
  };
  originalQuery: string;
}

/**
 * Parse a search query with operators
 * Supports:
 * - "exact phrase" for exact matching
 * - -term for exclusion
 * - #tag for tag filtering
 * - @username for user filtering
 * - rating:>4 for rating filters
 * - date:>2024-01-01 for date filters
 */
export function parseSearchQuery(query: string): ParsedQuery {
  const result: ParsedQuery = {
    terms: [],
    exactPhrases: [],
    excludedTerms: [],
    tags: [],
    filters: {},
    originalQuery: query,
  };

  // Extract exact phrases (quoted strings)
  const exactPhraseRegex = /"([^"]+)"/g;
  let match;
  while ((match = exactPhraseRegex.exec(query)) !== null) {
    result.exactPhrases.push(match[1]);
  }

  // Remove exact phrases from query for further processing
  let processedQuery = query.replace(exactPhraseRegex, '');

  // Extract filters
  // User filter: @username
  const userRegex = /@(\w+)/g;
  while ((match = userRegex.exec(processedQuery)) !== null) {
    result.filters.user = match[1];
  }
  processedQuery = processedQuery.replace(userRegex, '');

  // Tag filter: #tag
  const tagRegex = /#(\w+)/g;
  while ((match = tagRegex.exec(processedQuery)) !== null) {
    result.tags.push(match[1]);
  }
  processedQuery = processedQuery.replace(tagRegex, '');

  // Rating filters: rating:>4, rating:<3, rating:3-5
  const ratingRegex = /rating:([<>]?)(\d+(?:\.\d+)?)-?(\d+(?:\.\d+)?)?/g;
  while ((match = ratingRegex.exec(processedQuery)) !== null) {
    const operator = match[1];
    const value1 = parseFloat(match[2]);
    const value2 = match[3] ? parseFloat(match[3]) : undefined;

    if (value2) {
      // Range: rating:3-5
      result.filters.minRating = value1;
      result.filters.maxRating = value2;
    } else if (operator === '>') {
      result.filters.minRating = value1;
    } else if (operator === '<') {
      result.filters.maxRating = value1;
    } else {
      // Exact: rating:4
      result.filters.minRating = value1;
      result.filters.maxRating = value1;
    }
  }
  processedQuery = processedQuery.replace(ratingRegex, '');

  // Date filters: date:>2024-01-01, date:<2024-12-31
  const dateRegex = /date:([<>])(\d{4}-\d{2}-\d{2})/g;
  while ((match = dateRegex.exec(processedQuery)) !== null) {
    const operator = match[1];
    const date = match[2];

    if (operator === '>') {
      result.filters.dateAfter = date;
    } else if (operator === '<') {
      result.filters.dateBefore = date;
    }
  }
  processedQuery = processedQuery.replace(dateRegex, '');

  // Split remaining query into terms
  const terms = processedQuery
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  // Process terms for exclusions
  for (const term of terms) {
    if (term.startsWith('-') && term.length > 1) {
      result.excludedTerms.push(term.substring(1));
    } else {
      result.terms.push(term);
    }
  }

  return result;
}

/**
 * Check if text matches parsed query criteria
 */
export function matchesParsedQuery(
  text: string,
  parsedQuery: ParsedQuery,
  options: {
    tags?: string[];
    username?: string;
    rating?: number;
    date?: string;
  } = {}
): boolean {
  const normalizedText = text.toLowerCase();

  // Check exact phrases
  for (const phrase of parsedQuery.exactPhrases) {
    if (!normalizedText.includes(phrase.toLowerCase())) {
      return false;
    }
  }

  // Check excluded terms
  for (const excluded of parsedQuery.excludedTerms) {
    if (normalizedText.includes(excluded.toLowerCase())) {
      return false;
    }
  }

  // Check regular terms (at least one must match)
  if (parsedQuery.terms.length > 0) {
    const hasMatch = parsedQuery.terms.some((term) =>
      normalizedText.includes(term.toLowerCase())
    );
    if (!hasMatch) {
      return false;
    }
  }

  // Check tag filters
  if (parsedQuery.tags.length > 0 && options.tags) {
    const hasTagMatch = parsedQuery.tags.some((tag) =>
      options.tags!.some((t) => t.toLowerCase() === tag.toLowerCase())
    );
    if (!hasTagMatch) {
      return false;
    }
  }

  // Check user filter
  if (parsedQuery.filters.user && options.username) {
    if (
      options.username.toLowerCase() !== parsedQuery.filters.user.toLowerCase()
    ) {
      return false;
    }
  }

  // Check rating filters
  if (options.rating !== undefined) {
    if (
      parsedQuery.filters.minRating &&
      options.rating < parsedQuery.filters.minRating
    ) {
      return false;
    }
    if (
      parsedQuery.filters.maxRating &&
      options.rating > parsedQuery.filters.maxRating
    ) {
      return false;
    }
  }

  // Check date filters
  if (options.date) {
    const itemDate = new Date(options.date);
    if (parsedQuery.filters.dateAfter) {
      const afterDate = new Date(parsedQuery.filters.dateAfter);
      if (itemDate < afterDate) {
        return false;
      }
    }
    if (parsedQuery.filters.dateBefore) {
      const beforeDate = new Date(parsedQuery.filters.dateBefore);
      if (itemDate > beforeDate) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Build a human-readable description of the search
 */
export function describeSearch(parsedQuery: ParsedQuery): string {
  const parts: string[] = [];

  if (parsedQuery.terms.length > 0) {
    parts.push(`containing: ${parsedQuery.terms.join(' ')}`);
  }

  if (parsedQuery.exactPhrases.length > 0) {
    parts.push(`exact: "${parsedQuery.exactPhrases.join('", "')}"`);
  }

  if (parsedQuery.excludedTerms.length > 0) {
    parts.push(`excluding: ${parsedQuery.excludedTerms.join(', ')}`);
  }

  if (parsedQuery.tags.length > 0) {
    parts.push(`tags: ${parsedQuery.tags.map((t) => `#${t}`).join(', ')}`);
  }

  if (parsedQuery.filters.user) {
    parts.push(`by @${parsedQuery.filters.user}`);
  }

  if (parsedQuery.filters.minRating || parsedQuery.filters.maxRating) {
    if (parsedQuery.filters.minRating && parsedQuery.filters.maxRating) {
      parts.push(
        `rating: ${parsedQuery.filters.minRating}-${parsedQuery.filters.maxRating}`
      );
    } else if (parsedQuery.filters.minRating) {
      parts.push(`rating > ${parsedQuery.filters.minRating}`);
    } else if (parsedQuery.filters.maxRating) {
      parts.push(`rating < ${parsedQuery.filters.maxRating}`);
    }
  }

  if (parsedQuery.filters.dateAfter) {
    parts.push(`after ${parsedQuery.filters.dateAfter}`);
  }

  if (parsedQuery.filters.dateBefore) {
    parts.push(`before ${parsedQuery.filters.dateBefore}`);
  }

  return parts.join(', ');
}
