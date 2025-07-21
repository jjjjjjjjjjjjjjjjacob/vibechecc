/**
 * Fuzzy search utilities for typo tolerance
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param str1 First string
 * @param str2 Second string
 * @returns The minimum number of single-character edits required
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= len1; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j <= len2; j++) {
    dp[0][j] = j;
  }

  // Fill the dp table
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity ratio where 1 is identical and 0 is completely different
 */
export function similarityRatio(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Check if a string fuzzy matches a query with typo tolerance
 * @param text Text to search in
 * @param query Search query
 * @param threshold Minimum similarity ratio (default: 0.7)
 * @returns Whether the text fuzzy matches the query
 */
export function fuzzyMatch(
  text: string,
  query: string,
  threshold = 0.8
): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  // Exact match
  if (normalizedText === normalizedQuery) return true;

  // Contains exact query
  if (normalizedText.includes(normalizedQuery)) return true;

  // Check each word in the text
  const textWords = normalizedText.split(/\s+/);
  const queryWords = normalizedQuery.split(/\s+/);

  // Check if any word in text fuzzy matches any query word
  for (const textWord of textWords) {
    for (const queryWord of queryWords) {
      if (similarityRatio(textWord, queryWord) >= threshold) {
        return true;
      }
    }
  }

  // Check substring fuzzy matching for longer queries
  if (query.length >= 4) {
    // Sliding window approach
    const windowSize = query.length;
    for (let i = 0; i <= normalizedText.length - windowSize; i++) {
      const substring = normalizedText.substring(i, i + windowSize);
      if (similarityRatio(substring, normalizedQuery) >= threshold) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate fuzzy match score for ranking
 * @param text Text to score
 * @param query Search query
 * @returns Score (0-100) where higher is better
 */
export function fuzzyScore(text: string, query: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  let score = 0;

  // Exact match gets highest score
  if (normalizedText === normalizedQuery) {
    return 100;
  }

  // Contains exact phrase
  if (normalizedText.includes(normalizedQuery)) {
    score += 80;
  }

  // Word-level fuzzy matching
  const textWords = normalizedText.split(/\s+/);
  const queryWords = normalizedQuery.split(/\s+/);

  let wordMatchScore = 0;
  for (const queryWord of queryWords) {
    let bestWordScore = 0;
    for (const textWord of textWords) {
      const similarity = similarityRatio(textWord, queryWord);
      if (similarity > bestWordScore) {
        bestWordScore = similarity;
      }
    }
    wordMatchScore += bestWordScore * 20;
  }

  score += wordMatchScore / queryWords.length;

  // Boost score if query appears at start
  if (normalizedText.startsWith(normalizedQuery)) {
    score += 10;
  }

  // Penalty for length difference
  const lengthRatio =
    Math.min(normalizedQuery.length, normalizedText.length) /
    Math.max(normalizedQuery.length, normalizedText.length);
  score *= lengthRatio;

  return Math.min(100, Math.max(0, score));
}

/**
 * Common typo corrections map
 */
const COMMON_TYPOS: Record<string, string[]> = {
  recieve: ['receive'],
  teh: ['the'],
  waht: ['what'],
  taht: ['that'],
  wiht: ['with'],
  freind: ['friend'],
  becuase: ['because'],
  definately: ['definitely'],
  occured: ['occurred'],
  untill: ['until'],
};

/**
 * Get suggested corrections for a query
 * @param query Search query
 * @returns Array of suggested corrections
 */
export function getSuggestions(query: string): string[] {
  const suggestions = new Set<string>();
  const words = query.toLowerCase().split(/\s+/);

  for (const word of words) {
    // Check common typos
    if (COMMON_TYPOS[word]) {
      for (const correction of COMMON_TYPOS[word]) {
        suggestions.add(
          query.replace(new RegExp(`\\b${word}\\b`, 'gi'), correction)
        );
      }
    }
  }

  return Array.from(suggestions);
}
