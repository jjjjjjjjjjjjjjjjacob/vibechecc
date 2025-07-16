import { fuzzyScore } from './fuzzy_search';
import type { VibeSearchResult, UserSearchResult, TagSearchResult } from '@vibechecc/types';

/**
 * Advanced relevance scoring system for search results
 */

interface ScoringWeights {
  exactMatch: number;
  fuzzyMatch: number;
  titleMatch: number;
  descriptionMatch: number;
  tagMatch: number;
  usernameMatch: number;
  popularity: number;
  recency: number;
  rating: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  exactMatch: 100,
  fuzzyMatch: 50,
  titleMatch: 30,
  descriptionMatch: 20,
  tagMatch: 25,
  usernameMatch: 40,
  popularity: 15,
  recency: 10,
  rating: 20,
};

/**
 * Calculate relevance score for a vibe
 */
export function scoreVibe(
  vibe: {
    title: string;
    description: string;
    tags?: string[];
    createdAt: string;
    rating?: number;
    ratingCount?: number;
  },
  query: string,
  weights: Partial<ScoringWeights> = {}
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const normalizedQuery = query.toLowerCase().trim();
  let score = 0;
  
  // Title matching
  const titleScore = fuzzyScore(vibe.title, normalizedQuery);
  score += (titleScore / 100) * w.titleMatch;
  
  // Description matching
  const descScore = fuzzyScore(vibe.description, normalizedQuery);
  score += (descScore / 100) * w.descriptionMatch;
  
  // Tag matching
  if (vibe.tags && vibe.tags.length > 0) {
    const tagScores = vibe.tags.map(tag => fuzzyScore(tag, normalizedQuery));
    const maxTagScore = Math.max(...tagScores);
    score += (maxTagScore / 100) * w.tagMatch;
  }
  
  // Popularity boost (based on rating count)
  if (vibe.ratingCount) {
    const popularityScore = Math.min(vibe.ratingCount / 50, 1); // Normalize to 0-1
    score += popularityScore * w.popularity;
  }
  
  // Rating boost
  if (vibe.rating) {
    const ratingScore = vibe.rating / 5; // Normalize to 0-1
    score += ratingScore * w.rating;
  }
  
  // Recency boost
  const ageInDays = (Date.now() - new Date(vibe.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - ageInDays / 365); // Decay over a year
  score += recencyScore * w.recency;
  
  return score;
}

/**
 * Calculate relevance score for a user
 */
export function scoreUser(
  user: {
    username?: string;
    fullName?: string;
    bio?: string;
    vibeCount?: number;
  },
  query: string,
  weights: Partial<ScoringWeights> = {}
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const normalizedQuery = query.toLowerCase().trim();
  let score = 0;
  
  // Username matching (highest priority)
  if (user.username) {
    const usernameScore = fuzzyScore(user.username, normalizedQuery);
    score += (usernameScore / 100) * w.usernameMatch;
    
    // Exact username match bonus
    if (user.username.toLowerCase() === normalizedQuery) {
      score += w.exactMatch;
    }
  }
  
  // Full name matching
  if (user.fullName) {
    const nameScore = fuzzyScore(user.fullName, normalizedQuery);
    score += (nameScore / 100) * w.titleMatch;
  }
  
  // Bio matching
  if (user.bio) {
    const bioScore = fuzzyScore(user.bio, normalizedQuery);
    score += (bioScore / 100) * w.descriptionMatch * 0.5; // Lower weight for bio
  }
  
  // Activity boost
  if (user.vibeCount) {
    const activityScore = Math.min(user.vibeCount / 20, 1); // Normalize to 0-1
    score += activityScore * w.popularity;
  }
  
  return score;
}

/**
 * Calculate relevance score for a tag
 */
export function scoreTag(
  tag: {
    name: string;
    count: number;
  },
  query: string,
  weights: Partial<ScoringWeights> = {}
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const normalizedQuery = query.toLowerCase().trim();
  let score = 0;
  
  // Tag name matching
  const tagScore = fuzzyScore(tag.name, normalizedQuery);
  score += (tagScore / 100) * w.tagMatch;
  
  // Exact match bonus
  if (tag.name.toLowerCase() === normalizedQuery) {
    score += w.exactMatch;
  }
  
  // Popularity boost based on usage count
  const popularityScore = Math.min(tag.count / 100, 1); // Normalize to 0-1
  score += popularityScore * w.popularity;
  
  return score;
}

/**
 * Re-rank search results based on advanced scoring
 */
export function rerankResults<T extends { score?: number }>(
  results: T[],
  query: string
): T[] {
  const rescoredResults = results.map(result => {
    let newScore = result.score || 0;
    
    // Apply type-specific scoring
    if ('type' in result) {
      switch (result.type) {
        case 'vibe': {
          const vibeResult = result as VibeSearchResult;
          newScore = scoreVibe(
            {
              title: vibeResult.title,
              description: vibeResult.description || '',
              tags: vibeResult.tags,
              createdAt: new Date().toISOString(), // Would need actual date
              rating: vibeResult.rating,
              ratingCount: vibeResult.ratingCount,
            },
            query
          );
          break;
        }
        case 'user': {
          const userResult = result as UserSearchResult;
          newScore = scoreUser(
            {
              username: userResult.username,
              fullName: userResult.subtitle,
              vibeCount: userResult.vibeCount,
            },
            query
          );
          break;
        }
        case 'tag': {
          const tagResult = result as TagSearchResult;
          newScore = scoreTag(
            {
              name: tagResult.title,
              count: tagResult.count || 0,
            },
            query
          );
          break;
        }
      }
    }
    
    return { ...result, score: newScore };
  });
  
  // Sort by score descending
  return rescoredResults.sort((a, b) => (b.score || 0) - (a.score || 0));
}