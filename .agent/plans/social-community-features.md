# Social and Community Features Implementation Plan

## Overview

This plan implements comprehensive social and community features for the vibechecc monorepo, including social media integration, rating like system, leaderboards, and trophy achievements. The implementation follows established monorepo patterns and integrates seamlessly with the existing Convex backend and TanStack Start frontend.

## 1. Social Media Integration

### 1.1 Database Schema Updates

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/schema.ts`

**Changes**:

- No schema changes needed - existing `socialConnections` table supports Discord, Twitter, Instagram, TikTok
- Extend `platform` union type to include Discord

```typescript
platform: v.union(
  v.literal('twitter'),
  v.literal('instagram'),
  v.literal('tiktok'),
  v.literal('discord') // Add Discord support
),
```

### 1.2 Create Community Page

**New File**: `/Users/jacob/Developer/vibechecc/apps/web/src/routes/community.tsx`

**Purpose**: Dedicated community page with all social links and engagement metrics
**Features**:

- Social media platform cards with follower counts
- Community stats (total users, vibes, ratings)
- Featured community content
- Social media feeds integration

### 1.3 Update Header Component

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/components/header.tsx`

**Changes**:

- Add community link to desktop navigation
- Add social media icons to header (desktop only)

### 1.4 Update Footer Component

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/components/footer.tsx`

**Changes**:

- Add social media links section
- Include Discord, Twitter, Instagram, TikTok icons
- Add community page link

## 2. Rating Like System

### 2.1 Database Schema Updates

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/schema.ts`

**New Table**:

```typescript
ratingLikes: defineTable({
  ratingId: v.string(), // ID of the rating being liked
  userId: v.string(), // External ID of user who liked
  createdAt: v.number(), // Timestamp
})
  .index('byRating', ['ratingId'])
  .index('byUser', ['userId'])
  .index('byRatingAndUser', ['ratingId', 'userId']),
```

**Update Existing Tables**:

```typescript
// Add to ratings table
likeCount: v.optional(v.number()), // Cache like count for performance
```

### 2.2 Backend Functions

**New File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/rating-likes.ts`

**Functions**:

- `likeRating` - Toggle like on rating
- `getRatingLikes` - Get likes for specific rating
- `getUserRatingLikes` - Get ratings user has liked
- `updateRatingLikeCount` - Update cached like counts

### 2.3 Frontend Components

**New File**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/ratings/components/rating-like-button.tsx`

**Features**:

- Heart icon with like count
- Optimistic updates
- Loading states
- Authentication checks

### 2.4 Type Definitions

**File**: `/Users/jacob/Developer/vibechecc/packages/types/src/index.ts`

**New Types**:

```typescript
export interface RatingLike {
  _id?: string;
  ratingId: string;
  userId: string;
  createdAt: number;
  _creationTime?: number;
}

// Update Rating interface
export interface Rating {
  // ... existing fields
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
}
```

## 3. Leaderboard & Trophy System

### 3.1 Database Schema Updates

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/schema.ts`

**New Tables**:

```typescript
userScores: defineTable({
  userId: v.string(), // External ID
  totalScore: v.number(), // Combined score from all activities
  vibeScore: v.number(), // Points from creating vibes
  ratingScore: v.number(), // Points from rating vibes
  likeScore: v.number(), // Points from receiving likes on ratings
  socialScore: v.number(), // Points from follows, social engagement
  lastUpdated: v.number(), // Timestamp of last score update
  level: v.number(), // User level based on total score
  rank: v.optional(v.number()), // Global rank (updated periodically)
})
  .index('byUser', ['userId'])
  .index('byTotalScore', ['totalScore'])
  .index('byLevel', ['level'])
  .index('byRank', ['rank']),

userTrophies: defineTable({
  userId: v.string(), // External ID
  trophyId: v.string(), // Trophy identifier
  trophyName: v.string(), // Human readable name
  trophyDescription: v.string(), // Description
  awardedAt: v.number(), // Timestamp
  metadata: v.optional(v.any()), // Additional trophy data
})
  .index('byUser', ['userId'])
  .index('byTrophy', ['trophyId'])
  .index('byUserAndTrophy', ['userId', 'trophyId']),

leaderboards: defineTable({
  type: v.union(
    v.literal('global'),
    v.literal('weekly'),
    v.literal('monthly'),
    v.literal('vibes'),
    v.literal('ratings'),
    v.literal('social')
  ),
  userId: v.string(),
  username: v.string(), // Cached for performance
  score: v.number(),
  rank: v.number(),
  period: v.string(), // '2024-08-21' or 'all-time'
  lastUpdated: v.number(),
})
  .index('byType', ['type', 'rank'])
  .index('byTypeAndPeriod', ['type', 'period', 'rank'])
  .index('byUser', ['userId']),
```

### 3.2 Scoring System

**New File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/scoring/scoring-engine.ts`

**Scoring Rules**:

- Create vibe: +10 points
- Rate vibe: +2 points
- Receive rating like: +1 point
- Get followed: +5 points
- Daily login streak: +1 point/day

**Functions**:

- `updateUserScore` - Update user's total score
- `awardTrophy` - Award trophy to user
- `calculateUserLevel` - Determine user level from score
- `checkTrophyConditions` - Check if user earned new trophies

### 3.3 Trophy System

**New File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/scoring/trophy-definitions.ts`

**Trophy Definitions**:

```typescript
export const TROPHIES = {
  vibe_slut: {
    id: 'vibe_slut',
    name: 'vibe slut',
    description: 'rated many vibes >4.5 stars',
    condition: (userData) => userData.highRatingsCount >= 50,
    icon: '💖',
  },
  vibe_snob: {
    id: 'vibe_snob',
    name: 'vibe snob',
    description: 'rated many vibes <3 stars',
    condition: (userData) => userData.lowRatingsCount >= 30,
    icon: '😤',
  },
  vibe_connoisseur: {
    id: 'vibe_connoisseur',
    name: 'vibe connoisseur',
    description: 'reviewed with many different emojis',
    condition: (userData) => userData.uniqueEmojisUsed >= 25,
    icon: '🎭',
  },
  baby_viber: {
    id: 'baby_viber',
    name: 'baby viber',
    description: 'new to the vibe scene',
    condition: (userData) => userData.totalInteractions < 5,
    icon: '👶',
  },
  vibesetter: {
    id: 'vibesetter',
    name: 'vibesetter',
    description: 'early adopter of vibechecc',
    condition: (userData) => userData.createdAt < LAUNCH_DATE,
    icon: '🌟',
  },
  stealth_viber: {
    id: 'stealth_viber',
    name: 'stealth viber',
    description: 'interacts with many without following',
    condition: (userData) => userData.interactionToFollowRatio > 10,
    icon: '🥷',
  },
};
```

### 3.4 Leaderboard Components

**New Files**:

- `/Users/jacob/Developer/vibechecc/apps/web/src/features/leaderboards/components/leaderboard-table.tsx`
- `/Users/jacob/Developer/vibechecc/apps/web/src/features/leaderboards/components/user-rank-card.tsx`
- `/Users/jacob/Developer/vibechecc/apps/web/src/features/leaderboards/components/trophy-showcase.tsx`

**New Page**: `/Users/jacob/Developer/vibechecc/apps/web/src/routes/leaderboards.tsx`

### 3.5 Real-time Updates

**Implementation**: Use Convex subscriptions for live leaderboard updates
**Caching Strategy**:

- Cache leaderboard data in memory for 5 minutes
- Update user scores asynchronously
- Rebuild leaderboards daily via scheduled function

## 4. State Management & Caching

### 4.1 Frontend Hooks

**New Files**:

- `/Users/jacob/Developer/vibechecc/apps/web/src/features/leaderboards/hooks/use-leaderboard.ts`
- `/Users/jacob/Developer/vibechecc/apps/web/src/features/leaderboards/hooks/use-user-score.ts`
- `/Users/jacob/Developer/vibechecc/apps/web/src/features/leaderboards/hooks/use-user-trophies.ts`

### 4.2 Query Optimization

**Strategy**:

- Use Convex indexes for efficient leaderboard queries
- Paginate leaderboard results (50 users per page)
- Cache user score data with React Query
- Implement optimistic updates for score changes

## 5. API Endpoints & Real-time Features

### 5.1 Backend Functions

**Files**:

- `/Users/jacob/Developer/vibechecc/apps/convex/convex/leaderboards.ts`
- `/Users/jacob/Developer/vibechecc/apps/convex/convex/user-scores.ts`
- `/Users/jacob/Developer/vibechecc/apps/convex/convex/trophies.ts`

**Functions**:

- `getGlobalLeaderboard` - Paginated global rankings
- `getUserRank` - Get specific user's rank
- `getUserTrophies` - Get user's earned trophies
- `updateLeaderboard` - Scheduled function to rebuild rankings

### 5.2 Real-time Subscriptions

**Implementation**:

- Subscribe to leaderboard changes
- Live score updates for current user
- Real-time trophy notifications
- Social activity feed updates

## 6. Testing Strategy

### 6.1 Backend Testing

**Files**:

- `/Users/jacob/Developer/vibechecc/apps/convex/convex/__tests__/scoring.test.ts`
- `/Users/jacob/Developer/vibechecc/apps/convex/convex/__tests__/leaderboards.test.ts`
- `/Users/jacob/Developer/vibechecc/apps/convex/convex/__tests__/rating-likes.test.ts`

**Test Coverage**:

- Scoring algorithm accuracy
- Trophy condition validation
- Leaderboard ranking logic
- Rating like functionality

### 6.2 Frontend Testing

**Files**:

- `/Users/jacob/Developer/vibechecc/apps/web/src/features/leaderboards/__tests__/leaderboard-table.test.tsx`
- `/Users/jacob/Developer/vibechecc/apps/web/src/features/ratings/__tests__/rating-like-button.test.tsx`

**Test Coverage**:

- Component rendering with various data states
- User interactions and state changes
- Optimistic updates behavior
- Error handling scenarios

## 7. Performance Considerations

### 7.1 Database Optimization

**Strategies**:

- Denormalize like counts in ratings table
- Use compound indexes for leaderboard queries
- Batch score updates to reduce write operations
- Implement read replicas for leaderboard data

### 7.2 Frontend Optimization

**Strategies**:

- Virtual scrolling for long leaderboards
- Lazy load trophy images and animations
- Debounce like button clicks
- Cache frequently accessed leaderboard data

## 8. Deployment Strategy

### 8.1 Database Migration

**Files**:

- `/Users/jacob/Developer/vibechecc/apps/convex/convex/migrations/add-social-features.ts`

**Migration Steps**:

1. Add new tables (ratingLikes, userScores, userTrophies, leaderboards)
2. Migrate existing data to populate initial scores
3. Update existing functions to award points
4. Build initial leaderboards

### 8.2 Feature Rollout

**Phases**:

1. **Phase 1**: Rating likes system (low risk)
2. **Phase 2**: Basic scoring and trophies (medium risk)
3. **Phase 3**: Leaderboards and community features (high risk)

**Monitoring**:

- Track database performance metrics
- Monitor API response times
- Watch for scoring calculation errors
- Ensure real-time updates are working

## 9. Implementation Timeline

### Week 1: Foundation

- Database schema updates
- Basic scoring system
- Rating likes functionality

### Week 2: Core Features

- Trophy system implementation
- Basic leaderboards
- User score tracking

### Week 3: UI/UX

- Leaderboard components
- Trophy showcase
- Social media integration

### Week 4: Polish & Testing

- Performance optimization
- Comprehensive testing
- Community page completion

## 10. Success Metrics

### Engagement Metrics

- Increase in rating activity (+25%)
- User session duration (+15%)
- Return user rate (+20%)

### Social Metrics

- Follow relationships growth (+30%)
- Social media referrals (+40%)
- Community page engagement

### Technical Metrics

- API response times (<200ms)
- Real-time update latency (<1s)
- Database query performance

## 11. Risk Assessment

### Low Risk

- Rating likes implementation
- Social media links addition
- Basic trophy awards

### Medium Risk

- Leaderboard real-time updates
- Complex scoring calculations
- Performance with large datasets

### High Risk

- Database migration for existing users
- Real-time scoring system accuracy
- Leaderboard performance at scale

## 12. File Structure Summary

**New Backend Files**:

```
apps/convex/convex/
├── rating-likes.ts
├── leaderboards.ts
├── user-scores.ts
├── trophies.ts
├── scoring/
│   ├── scoring-engine.ts
│   └── trophy-definitions.ts
└── migrations/
    └── add-social-features.ts
```

**New Frontend Files**:

```
apps/web/src/
├── routes/
│   ├── community.tsx
│   └── leaderboards.tsx
├── features/
│   ├── leaderboards/
│   │   ├── components/
│   │   │   ├── leaderboard-table.tsx
│   │   │   ├── user-rank-card.tsx
│   │   │   └── trophy-showcase.tsx
│   │   └── hooks/
│   │       ├── use-leaderboard.ts
│   │       ├── use-user-score.ts
│   │       └── use-user-trophies.ts
│   └── ratings/components/
│       └── rating-like-button.tsx
```

**Updated Files**:

```
├── apps/convex/convex/schema.ts
├── apps/web/src/components/header.tsx
├── apps/web/src/components/footer.tsx
└── packages/types/src/index.ts
```

---

**Total Estimated Effort**: 4-5 weeks (160-200 hours)
**Team Size**: 2-3 developers (1 backend, 1-2 frontend)
**Priority**: High impact on user engagement and community building

This comprehensive plan provides a robust foundation for social and community features while maintaining the established architectural patterns and ensuring scalability for future growth.
