# Discovery & Recommendations Implementation Plan

## Overview

This plan enhances the discovery experience and implements personalized recommendation algorithms for vibechecc with two major improvements:

1. **Discover Page Rework** - Remove featured collections until user base grows (via feature flag), fix "trending now" logic
2. **"For You" Algorithm Improvements** - Enhanced personalized recommendations based on user interests, interaction history, and emoji usage patterns

## Current System Analysis

### Discovery Page Architecture

**Current File**: `/Users/jacob/Developer/vibechecc/apps/web/src/routes/discover.tsx`

**Current Sections**:

- Featured Collections Grid (lines 232-245) - Currently shows 6 emoji-based collections
- New Section (lines 349-368) - Shows 15 newest vibes
- Trending Section (lines 372-394) - Filters vibes with ≥3 ratings, shows 12 vibes
- Fresh Arrivals (lines 397-427) - Shows vibes from last 7 days
- Needs Love (lines 430-454) - Shows unrated vibes
- Community Favorites (lines 457-475) - Top rated vibes
- Popular Tags (lines 478-522) - Vibes from most popular tag

**Issues Identified**:

1. Featured collections may be empty with low user count
2. Trending logic is simplistic (just rating count ≥3)
3. No engagement-based trending calculation
4. No user personalization in discover sections

### "For You" Feed System

**Current File**: `/Users/jacob/Developer/vibechecc/apps/web/src/components/for-you-empty-state.tsx`

**Current Logic**:

- Shows empty state for users with no follows
- Basic follow-based content filtering
- No interest-based recommendations
- No emoji interaction history consideration

## Implementation Steps

### Phase 1: Feature Flag Infrastructure for Featured Collections

#### 1.1 Feature Flag System Setup

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/lib/feature-flags.ts`

**Purpose**: Control feature visibility based on user metrics
**Features**:

- User count thresholds
- A/B testing capabilities
- Admin override controls

```typescript
interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  conditions?: FeatureCondition[];
  overrides?: Record<string, boolean>;
}

interface FeatureCondition {
  type: 'user_count' | 'percentage' | 'date_range';
  threshold?: number;
  startDate?: number;
  endDate?: number;
}

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();

  async checkFlag(flagId: string, context?: any): Promise<boolean> {
    const flag = this.flags.get(flagId);
    if (!flag) return false;

    // Check conditions
    if (flag.conditions) {
      for (const condition of flag.conditions) {
        if (condition.type === 'user_count' && context?.userCount) {
          return context.userCount >= (condition.threshold || 0);
        }
      }
    }

    return flag.enabled;
  }
}

// Feature flag definitions
export const FEATURE_FLAGS = {
  FEATURED_COLLECTIONS: 'featured_collections',
  ENHANCED_TRENDING: 'enhanced_trending',
  PERSONALIZED_DISCOVERY: 'personalized_discovery',
} as const;
```

#### 1.2 Update Discover Page with Feature Flags

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/routes/discover.tsx`

**Changes**:

- Add feature flag checks for featured collections
- Implement fallback content when collections are hidden
- Add user count tracking for threshold decisions

```typescript
// Add to imports
import { useFeatureFlag } from '@/lib/feature-flags';
import { useUserCount } from '@/queries';

function DiscoverPage() {
  const { data: userStats } = useUserCount();
  const showFeaturedCollections = useFeatureFlag(
    FEATURE_FLAGS.FEATURED_COLLECTIONS,
    { userCount: userStats?.totalUsers || 0 }
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header - Always show */}
      <DiscoverHeader />

      {/* Featured Collections - Conditional */}
      {showFeaturedCollections && (
        <FeaturedCollectionsSection />
      )}

      {/* Enhanced sections when collections are hidden */}
      {!showFeaturedCollections && (
        <ExpandedDiscoverySection />
      )}

      {/* Core sections - Always show */}
      <NewSection />
      <EnhancedTrendingSection />
      <RecentArrivalsSection />
      <UnratedSection />
      <CommunityFavoritesSection />
      <PopularTagsSection />
    </div>
  );
}
```

#### 1.3 Backend User Count Tracking

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/analytics/userMetrics.ts`

**Purpose**: Track user statistics for feature flag decisions
**Schema Addition**:

```typescript
// Add to schema.ts
userMetrics: defineTable({
  metric: v.string(), // 'total_users', 'active_users', 'content_creators'
  value: v.number(),
  timestamp: v.number(),
  metadata: v.optional(v.object({})),
})
  .index('byMetric', ['metric', 'timestamp'])
  .index('byTimestamp', ['timestamp']);

export const getUserCount = query({
  handler: async (ctx) => {
    const totalUsers = await ctx.db.query('users').collect().length;
    const activeUsers = await ctx.db
      .query('users')
      .filter((q) =>
        q.gt(q.field('last_active_at'), Date.now() - 30 * 24 * 60 * 60 * 1000)
      )
      .collect().length;

    return {
      totalUsers,
      activeUsers,
      contentCreators: await getContentCreatorCount(ctx),
    };
  },
});
```

### Phase 2: Enhanced Trending Algorithm

#### 2.1 Trending Score Calculation

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/lib/trending-algorithm.ts`

**Purpose**: Sophisticated trending calculation based on multiple factors
**Algorithm Features**:

- Recency weighting (newer content scores higher)
- Engagement velocity (rapid interactions boost score)
- Quality signals (rating values, review length)
- Diversity factors (different emoji types, user variety)

```typescript
interface TrendingFactors {
  recencyScore: number; // 0-1 based on creation time
  engagementVelocity: number; // Interactions per hour since creation
  qualityScore: number; // Average rating weighted by review quality
  diversityScore: number; // Variety of emoji types and users
  totalEngagement: number; // Total interactions
}

export function calculateTrendingScore(
  vibe: any,
  timeWindow: number = 24
): number {
  const factors = analyzeTrendingFactors(vibe, timeWindow);

  // Weighted combination of factors
  const weights = {
    recency: 0.3,
    velocity: 0.35,
    quality: 0.2,
    diversity: 0.1,
    volume: 0.05,
  };

  return (
    factors.recencyScore * weights.recency +
    factors.engagementVelocity * weights.velocity +
    factors.qualityScore * weights.quality +
    factors.diversityScore * weights.diversity +
    Math.min(factors.totalEngagement / 10, 1) * weights.volume
  );
}

function analyzeTrendingFactors(
  vibe: any,
  timeWindow: number
): TrendingFactors {
  const now = Date.now();
  const createdAt = new Date(vibe.createdAt).getTime();
  const ageHours = (now - createdAt) / (1000 * 60 * 60);

  // Recency score - exponential decay
  const recencyScore = Math.exp(-ageHours / 12); // Half-life of 12 hours

  // Engagement velocity
  const recentInteractions =
    vibe.ratings?.filter(
      (r) => new Date(r.createdAt).getTime() > now - timeWindow * 60 * 60 * 1000
    ) || [];
  const engagementVelocity = recentInteractions.length / Math.max(ageHours, 1);

  // Quality score from ratings
  const avgRating =
    vibe.ratings?.reduce((sum, r) => sum + r.value, 0) /
    (vibe.ratings?.length || 1);
  const reviewQuality =
    vibe.ratings?.reduce(
      (sum, r) => sum + Math.min(r.review.length / 100, 1),
      0
    ) / (vibe.ratings?.length || 1);
  const qualityScore = (avgRating / 5) * 0.7 + reviewQuality * 0.3;

  // Diversity score
  const uniqueEmojis = new Set(vibe.ratings?.map((r) => r.emoji) || []).size;
  const uniqueUsers = new Set(vibe.ratings?.map((r) => r.userId) || []).size;
  const diversityScore = Math.min((uniqueEmojis + uniqueUsers) / 10, 1);

  return {
    recencyScore,
    engagementVelocity: Math.min(engagementVelocity, 1),
    qualityScore: Math.min(qualityScore, 1),
    diversityScore,
    totalEngagement: vibe.ratings?.length || 0,
  };
}
```

#### 2.2 Update Trending Section

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/routes/discover.tsx`

**Changes**:

- Replace simple rating count filter with trending score calculation
- Add time-based trending windows (1h, 6h, 24h)
- Implement trending momentum indicators

```typescript
function EnhancedTrendingSection() {
  const { data, isLoading, error } = useEnhancedTrendingVibes(24); // 24-hour window

  return (
    <DiscoverSectionWrapper
      title={
        <>
          <span className="font-sans">🔥</span> trending now
          <Badge variant="secondary" className="ml-2 text-xs">
            last 24h
          </Badge>
        </>
      }
      vibes={data as Vibe[]}
      isLoading={isLoading}
      error={error}
      priority
      ratingDisplayMode="trending" // New display mode showing trending indicators
    />
  );
}
```

#### 2.3 Backend Trending Query

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/vibes.ts`

**Add enhanced trending query**:

```typescript
export const getTrendingVibes = query({
  args: {
    timeWindowHours: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { timeWindowHours = 24, limit = 20 }) => {
    const cutoffTime = Date.now() - timeWindowHours * 60 * 60 * 1000;

    // Get vibes with recent activity
    const vibes = await ctx.db
      .query('vibes')
      .withIndex('byCreatedAt')
      .filter((q) =>
        q.gt(q.field('createdAt'), new Date(cutoffTime).toISOString())
      )
      .collect();

    // Calculate trending scores and sort
    const vibesWithScores = await Promise.all(
      vibes.map(async (vibe) => {
        const ratings = await ctx.db
          .query('ratings')
          .withIndex('vibe', (q) => q.eq('vibeId', vibe.id))
          .collect();

        const trendingScore = calculateTrendingScore(
          { ...vibe, ratings },
          timeWindowHours
        );

        return { vibe, trendingScore };
      })
    );

    return vibesWithScores
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map((item) => item.vibe);
  },
});
```

### Phase 3: "For You" Algorithm Improvements

#### 3.1 User Interest Tracking

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/lib/user-interests.ts`

**Purpose**: Track and analyze user interests for personalization
**Features**:

- Tag interaction tracking
- Emoji usage pattern analysis
- Content engagement scoring
- Interest evolution over time

```typescript
interface UserInterestProfile {
  userId: string;
  interests: InterestSignal[];
  emojiPreferences: EmojiPreference[];
  engagementPatterns: EngagementPattern[];
  lastUpdated: number;
}

interface InterestSignal {
  tag: string;
  strength: number; // 0-1 interest strength
  source: 'explicit' | 'implicit' | 'social'; // How interest was determined
  lastInteraction: number;
  interactionCount: number;
}

interface EmojiPreference {
  emoji: string;
  usageCount: number;
  averageRating: number;
  recentUsage: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export class UserInterestAnalyzer {
  async analyzeUserInterests(userId: string): Promise<UserInterestProfile> {
    // Analyze user's explicit interests (onboarding selections)
    const explicitInterests = await this.getExplicitInterests(userId);

    // Analyze implicit interests from interactions
    const implicitInterests = await this.analyzeImplicitInterests(userId);

    // Analyze emoji usage patterns
    const emojiPreferences = await this.analyzeEmojiUsage(userId);

    // Combine and weight interests
    return this.combineInterestSignals(
      explicitInterests,
      implicitInterests,
      emojiPreferences
    );
  }

  private async analyzeImplicitInterests(
    userId: string
  ): Promise<InterestSignal[]> {
    // Get user's rating history
    const ratings = await db
      .query('ratings')
      .withIndex('user', (q) => q.eq('userId', userId))
      .collect();

    // Extract tags from highly-rated vibes
    const tagInteractions = new Map<
      string,
      { count: number; totalRating: number }
    >();

    for (const rating of ratings) {
      const vibe = await db.get(rating.vibeId);
      if (vibe?.tags && rating.value >= 4) {
        // High rating indicates interest
        for (const tag of vibe.tags) {
          const current = tagInteractions.get(tag) || {
            count: 0,
            totalRating: 0,
          };
          tagInteractions.set(tag, {
            count: current.count + 1,
            totalRating: current.totalRating + rating.value,
          });
        }
      }
    }

    // Convert to interest signals
    return Array.from(tagInteractions.entries()).map(([tag, data]) => ({
      tag,
      strength:
        Math.min(data.count / 10, 1) * (data.totalRating / data.count / 5),
      source: 'implicit' as const,
      lastInteraction: Date.now(),
      interactionCount: data.count,
    }));
  }
}
```

#### 3.2 Enhanced "For You" Algorithm

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/lib/for-you-algorithm.ts`

**Purpose**: Generate personalized content recommendations
**Algorithm Components**:

- Interest-based filtering
- Social signals (from followed users)
- Emoji affinity matching
- Content diversity optimization
- Recency balancing

```typescript
interface RecommendationContext {
  user: User;
  interests: UserInterestProfile;
  followedUsers: string[];
  recentInteractions: any[];
  timeOfDay: number;
  deviceType: 'mobile' | 'desktop';
}

export class ForYouAlgorithm {
  async generateRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<Vibe[]> {
    const context = await this.buildRecommendationContext(userId);

    // Get candidate vibes from multiple sources
    const candidates = await this.getCandidateVibes(context);

    // Score each candidate
    const scoredVibes = await this.scoreVibes(candidates, context);

    // Apply diversity and recency filters
    const diversifiedVibes = this.diversifyRecommendations(
      scoredVibes,
      context
    );

    return diversifiedVibes.slice(0, limit);
  }

  private async getCandidateVibes(
    context: RecommendationContext
  ): Promise<Vibe[]> {
    const candidates: Vibe[] = [];

    // 1. Interest-based vibes (40% weight)
    const interestVibes = await this.getVibesByInterests(
      context.interests.interests.slice(0, 5), // Top 5 interests
      Math.ceil(context.limit * 0.6)
    );
    candidates.push(...interestVibes);

    // 2. Social vibes (30% weight) - from followed users
    const socialVibes = await this.getSocialVibes(
      context.followedUsers,
      Math.ceil(context.limit * 0.5)
    );
    candidates.push(...socialVibes);

    // 3. Emoji affinity vibes (20% weight)
    const emojiVibes = await this.getVibesByEmojiAffinity(
      context.interests.emojiPreferences.slice(0, 3),
      Math.ceil(context.limit * 0.4)
    );
    candidates.push(...emojiVibes);

    // 4. Discovery vibes (10% weight) - trending, new
    const discoveryVibes = await this.getDiscoveryVibes(
      Math.ceil(context.limit * 0.3)
    );
    candidates.push(...discoveryVibes);

    // Remove duplicates
    return this.deduplicateVibes(candidates);
  }

  private async scoreVibes(
    vibes: Vibe[],
    context: RecommendationContext
  ): Promise<{ vibe: Vibe; score: number }[]> {
    return Promise.all(
      vibes.map(async (vibe) => {
        const score = await this.calculateRecommendationScore(vibe, context);
        return { vibe, score };
      })
    );
  }

  private async calculateRecommendationScore(
    vibe: Vibe,
    context: RecommendationContext
  ): Promise<number> {
    let score = 0;

    // Interest alignment (0-40 points)
    const interestScore = this.calculateInterestAlignment(
      vibe,
      context.interests
    );
    score += interestScore * 40;

    // Social signals (0-30 points)
    const socialScore = this.calculateSocialScore(vibe, context);
    score += socialScore * 30;

    // Quality signals (0-20 points)
    const qualityScore = this.calculateQualityScore(vibe);
    score += qualityScore * 20;

    // Freshness (0-10 points)
    const freshnessScore = this.calculateFreshnessScore(vibe);
    score += freshnessScore * 10;

    return Math.min(score, 100); // Cap at 100
  }

  private calculateInterestAlignment(
    vibe: Vibe,
    interests: UserInterestProfile
  ): number {
    if (!vibe.tags?.length) return 0;

    let alignment = 0;
    let maxPossible = 0;

    for (const tag of vibe.tags) {
      const interest = interests.interests.find((i) => i.tag === tag);
      if (interest) {
        alignment += interest.strength;
      }
      maxPossible += 1;
    }

    return maxPossible > 0 ? alignment / maxPossible : 0;
  }

  private diversifyRecommendations(
    scoredVibes: { vibe: Vibe; score: number }[],
    context: RecommendationContext
  ): Vibe[] {
    // Sort by score first
    scoredVibes.sort((a, b) => b.score - a.score);

    const result: Vibe[] = [];
    const usedTags = new Set<string>();
    const usedAuthors = new Set<string>();

    for (const { vibe } of scoredVibes) {
      // Diversity checks
      const tagOverlap = vibe.tags?.some((tag) => usedTags.has(tag)) || false;
      const authorRepeat = usedAuthors.has(vibe.createdById);

      // Allow some overlap but prefer diversity
      if (
        result.length < 5 ||
        (!tagOverlap && !authorRepeat) ||
        result.length < context.limit * 0.3
      ) {
        result.push(vibe);
        vibe.tags?.forEach((tag) => usedTags.add(tag));
        usedAuthors.add(vibe.createdById);
      }

      if (result.length >= context.limit) break;
    }

    return result;
  }
}
```

#### 3.3 Update "For You" Feed Component

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/components/home-feed.tsx`

**Changes**:

- Integrate enhanced recommendation algorithm
- Add loading states for personalization
- Implement fallback for insufficient data

```typescript
function ForYouTab() {
  const { user } = useUser();
  const { data: recommendations, isLoading } = useForYouRecommendations(user?.id);
  const { data: followStats } = useCurrentUserFollowStats();

  // Show empty state if no follows and no interests
  if (!isLoading && (!recommendations?.length || followStats.following === 0)) {
    return <ForYouEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Personalization indicator */}
      {recommendations?.length > 0 && (
        <div className="bg-theme-primary/10 border-theme-primary/20 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-theme-primary h-4 w-4" />
            <span className="text-theme-primary text-sm font-medium">
              personalized for you based on your interests and activity
            </span>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <VibeFeed
        vibes={recommendations || []}
        loading={isLoading}
        variant="masonry"
        ratingDisplayMode="most-rated"
      />
    </div>
  );
}
```

#### 3.4 Backend Recommendation Queries

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/recommendations.ts`

**New file for recommendation logic**:

```typescript
export const getForYouRecommendations = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20 }) => {
    // Get user profile and interests
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', userId))
      .first();

    if (!user) return [];

    // Get user's interest profile
    const interests = await analyzeUserInterests(ctx, userId);

    // Get followed users
    const follows = await ctx.db
      .query('follows')
      .withIndex('byFollower', (q) => q.eq('followerId', user._id))
      .collect();

    const followedUserIds = follows.map((f) => f.followingId);

    // Generate recommendations using the algorithm
    const algorithm = new ForYouAlgorithm();
    return algorithm.generateRecommendations(userId, limit);
  },
});

export const getVibesByInterests = query({
  args: {
    interests: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { interests, limit = 10 }) => {
    // Get vibes that match user interests
    const vibes = await ctx.db
      .query('vibes')
      .withIndex('byVisibility', (q) => q.eq('visibility', 'public'))
      .filter((q) => {
        return q.and(
          ...interests.map((interest) =>
            q.or(
              q.field('tags').contains(interest),
              q.field('title').includes(interest),
              q.field('description').includes(interest)
            )
          )
        );
      })
      .order('desc')
      .take(limit);

    return vibes;
  },
});
```

### Phase 4: Testing & Optimization

#### 4.1 A/B Testing for Algorithm Variations

- Test different scoring weights in recommendation algorithm
- Compare engagement metrics between old and new "For You" feed
- Measure user retention and session duration improvements

#### 4.2 Performance Optimization

- Cache recommendation results with appropriate TTL
- Implement background recommendation pre-computation
- Optimize database queries for interest analysis

#### 4.3 User Feedback Integration

- Add "not interested" feedback mechanism
- Track engagement metrics per recommendation source
- Implement recommendation explanation feature

## Testing Requirements

### 4.1 Functional Testing

- Test feature flag behavior with different user counts
- Verify trending algorithm produces reasonable results
- Test recommendation algorithm with various user profiles
- Validate fallback behavior when insufficient data

### 4.2 Performance Testing

- Measure recommendation generation time
- Test trending calculation performance with large datasets
- Validate caching effectiveness
- Test database query optimization

### 4.3 User Experience Testing

- Test discovery page responsiveness with/without featured collections
- Verify "For You" feed loading states and empty states
- Test recommendation quality with real user interactions
- Validate mobile experience for all new features

## Implementation Order/Phases

### Phase 1: Infrastructure (Week 1)

1. Feature flag system implementation
2. Enhanced trending algorithm
3. User interest tracking foundation

### Phase 2: Recommendation Engine (Week 2)

1. "For You" algorithm implementation
2. Interest analysis system
3. Recommendation query optimization

### Phase 3: UI Integration (Week 3)

1. Discover page feature flag integration
2. Enhanced "For You" feed components
3. Performance optimizations

### Phase 4: Testing & Refinement (Week 4)

1. A/B testing setup and execution
2. Algorithm tuning based on metrics
3. User feedback integration

## Risk Assessment

### High Risk

- **Recommendation algorithm complexity** may impact performance
- **Feature flag logic** could hide content inappropriately
- **Interest tracking privacy** concerns

### Medium Risk

- **Trending algorithm changes** may alter user expectations
- **Empty state handling** for new users with no data
- **Database query performance** with complex recommendation logic

### Low Risk

- **Feature flag infrastructure** is well-isolated
- **UI component updates** are largely additive
- **User interest analysis** operates on existing data

## Success Metrics

### Discovery Metrics

- Trending section engagement: +25%
- Time spent on discover page: +20%
- Feature flag effectiveness: >90% correct decisions

### Recommendation Metrics

- "For You" feed engagement: +40%
- User session duration: +30%
- Recommendation click-through rate: >15%
- User return rate to "For You" tab: +35%

### Quality Metrics

- User satisfaction surveys: >4.2/5
- Recommendation relevance scores: >75%
- Algorithm performance: <500ms response time

## Dependencies

### Data Requirements

- User interaction history
- Tag popularity metrics
- Emoji usage statistics
- Follow graph data

### Technical Dependencies

- Convex database performance optimization
- Analytics event tracking system
- A/B testing framework
- Caching infrastructure

### External Dependencies

- User behavior analytics (PostHog)
- Performance monitoring tools
- Feature flag management system

---

**Total Estimated Effort**: 4 weeks
**Team Requirements**: 2 backend developers, 1 frontend developer, 1 data analyst
**Success Criteria**: Improved user engagement, better content discovery, personalized experience
