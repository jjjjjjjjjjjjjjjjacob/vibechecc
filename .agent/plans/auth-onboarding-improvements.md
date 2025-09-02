# Auth & Onboarding Improvements Implementation Plan

## Overview

This plan enhances the authentication and onboarding experience for vibechecc with the following key improvements:

1. **Apple ID-Only Authentication** - Restrict sign-up to Apple IDs only to prevent botting
2. **Private Mode Token Carryover** - Persist user session data when transitioning from anonymous browsing
3. **Welcome Tagline A/B Testing** - Track which welcome messages perform best
4. **Placeholder Performance Tracking** - Monitor which input placeholders drive engagement
5. **Signup CTA for Unauthenticated Actions** - Prompt sign-in when users try rating/reacting without authentication

## Current System Analysis

### Authentication Architecture

- **Current Auth**: Clerk provides OAuth with multiple providers (Google, GitHub, email)
- **Authentication Flow**: `/apps/web/src/features/auth/components/auth-prompt-dialog.tsx` handles sign-in prompts
- **Onboarding Flow**: Multi-step process in `/apps/web/src/features/onboarding/components/`
- **User Schema**: `/apps/convex/convex/schema.ts` defines user fields and tracking

### Identified Gaps

1. No provider restrictions in authentication setup
2. No session persistence for anonymous users
3. No A/B testing infrastructure for messaging
4. No tracking for onboarding conversion metrics
5. Limited authentication prompts for specific user actions

## Implementation Steps

### Phase 1: Apple ID-Only Authentication

#### 1.1 Update Clerk Configuration

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/auth/components/auth-prompt-dialog.tsx`

**Changes**:

- Add Apple ID provider check
- Update messaging to indicate Apple ID requirement
- Add fallback for users without Apple ID

```typescript
// Add Apple ID verification
const ALLOWED_PROVIDERS = ['apple'] as const;

// Update dialog description
description =
  'sign in with your apple id to prevent spam and ensure quality interactions';

// Add provider restriction logic
const handleSignIn = () => {
  // Check if user has Apple ID available
  if (!clerk.isProviderEnabled('apple')) {
    // Show educational modal about Apple ID requirement
    setShowAppleIdRequired(true);
    return;
  }
  // Proceed with Apple ID sign-in
};
```

#### 1.2 Add Apple ID Education Modal

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/auth/components/apple-id-required-modal.tsx`

**Purpose**: Educate users about Apple ID requirement
**Features**:

- Explanation of anti-spam measures
- Instructions for Apple ID setup
- Alternative browsing options

#### 1.3 Update Backend User Creation

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/users.ts`

**Changes**:

- Add provider validation in user creation
- Track authentication method
- Log provider statistics for monitoring

```typescript
// Add to user schema
interface User {
  // ... existing fields
  authProvider: 'apple' | 'legacy'; // Track auth method
  antiSpamVerified: boolean; // Apple ID verified
}

// Add provider validation
export const createUser = mutation({
  handler: async (ctx, { userData }) => {
    // Validate Apple ID requirement for new users
    if (!userData.appleIdVerified && !userData.isLegacyUser) {
      throw new Error('Apple ID required for new accounts');
    }
    // ... rest of user creation
  },
});
```

### Phase 2: Private Mode Token Carryover

#### 2.1 Anonymous Session Storage

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/lib/anonymous-session.ts`

**Purpose**: Track anonymous user activity before authentication
**Features**:

- Local storage for anonymous session data
- Activity tracking (viewed vibes, searches, interactions)
- Preference storage (theme, interests)

```typescript
interface AnonymousSession {
  sessionId: string;
  startedAt: number;
  viewedVibes: string[];
  searchHistory: string[];
  interactionCount: number;
  preferredTheme?: string;
  interestedTags?: string[];
}

export class AnonymousSessionManager {
  private storageKey = 'vibechecc_anonymous_session';

  createSession(): AnonymousSession {
    const session: AnonymousSession = {
      sessionId: crypto.randomUUID(),
      startedAt: Date.now(),
      viewedVibes: [],
      searchHistory: [],
      interactionCount: 0,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    return session;
  }

  migrateToAuthenticatedUser(userId: string): void {
    const session = this.getSession();
    if (session) {
      // Sync anonymous data with authenticated user
      syncAnonymousData(userId, session);
      this.clearSession();
    }
  }
}
```

#### 2.2 Update Authentication Flow

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/auth/components/clerk-posthog-integration.tsx`

**Changes**:

- Hook into successful authentication
- Migrate anonymous session data
- Preserve user preferences and history

#### 2.3 Backend Anonymous Data Migration

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/users.ts`

**Add migration function**:

```typescript
export const migrateAnonymousSession = mutation({
  args: {
    userId: v.string(),
    anonymousData: v.object({
      viewedVibes: v.array(v.string()),
      searchHistory: v.array(v.string()),
      interactionCount: v.number(),
      preferredTheme: v.optional(v.string()),
      interestedTags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, { userId, anonymousData }) => {
    // Merge anonymous data with user profile
    const user = await ctx.db
      .query('users')
      .withIndex('byExternalId', (q) => q.eq('externalId', userId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        // Merge interests
        interests: [
          ...(user.interests || []),
          ...(anonymousData.interestedTags || []),
        ],
        // Set theme if not already set
        themeColor: user.themeColor || anonymousData.preferredTheme,
        // Track anonymous activity
        anonymousActivityCount: anonymousData.interactionCount,
      });
    }
  },
});
```

### Phase 3: Welcome Tagline A/B Testing

#### 3.1 A/B Testing Infrastructure

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/lib/ab-testing.ts`

**Purpose**: Framework for running A/B tests on messaging
**Features**:

- Variant selection and tracking
- Conversion measurement
- Statistical significance calculation

```typescript
interface ABTest {
  id: string;
  name: string;
  variants: ABVariant[];
  startDate: number;
  endDate?: number;
  trafficAllocation: number; // 0-1
}

interface ABVariant {
  id: string;
  name: string;
  content: string;
  weight: number; // 0-1
}

export class ABTestManager {
  async getVariant(testId: string, userId?: string): Promise<ABVariant> {
    // Consistent assignment based on user ID or session
    const seed = userId || this.getSessionId();
    return this.assignVariant(testId, seed);
  }

  async trackConversion(
    testId: string,
    variantId: string,
    event: string
  ): Promise<void> {
    // Track conversion events for analysis
    await analytics.track('ab_test_conversion', {
      testId,
      variantId,
      event,
      timestamp: Date.now(),
    });
  }
}
```

#### 3.2 Welcome Tagline Variants

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/onboarding/components/onboarding-welcome-step.tsx`

**Changes**:

- Implement A/B testing for welcome messages
- Track which variants convert better
- Measure engagement through onboarding completion

```typescript
// Welcome message variants
const WELCOME_TAGLINES = {
  control: "a place to discover, share, and connect through vibes that matter to you",
  personal: "your personal space to share life's moments and discover what resonates",
  community: "join a community where every experience matters and every story counts",
  discovery: "discover authentic experiences and share the moments that define you",
  authentic: "where real experiences meet genuine connections"
};

export function OnboardingWelcomeStep({ onNext }: OnboardingWelcomeStepProps) {
  const { getVariant, trackConversion } = useABTesting();
  const [taglineVariant, setTaglineVariant] = useState<string>('');

  useEffect(() => {
    getVariant('welcome_tagline_test').then(variant => {
      setTaglineVariant(variant.content);
      // Track view
      trackConversion('welcome_tagline_test', variant.id, 'view');
    });
  }, []);

  const handleNext = () => {
    // Track conversion
    trackConversion('welcome_tagline_test', taglineVariant, 'continue');
    onNext();
  };

  return (
    <div className="space-y-6">
      <h1>welcome to vibechecc</h1>
      <p>{taglineVariant}</p>
      <Button onClick={handleNext}>get started</Button>
    </div>
  );
}
```

#### 3.3 Tagline Performance Tracking

**File**: `/Users/jacob/Developer/vibechecc/apps/convex/convex/analytics/abTesting.ts`

**Purpose**: Store and analyze A/B test results
**Schema Addition**:

```typescript
// Add to schema.ts
abTests: defineTable({
  testId: v.string(),
  variantId: v.string(),
  userId: v.optional(v.string()),
  sessionId: v.optional(v.string()),
  event: v.string(), // 'view', 'click', 'conversion'
  timestamp: v.number(),
  metadata: v.optional(v.object({})),
})
  .index('byTest', ['testId', 'timestamp'])
  .index('byVariant', ['variantId', 'timestamp'])
  .index('byUser', ['userId', 'timestamp']);
```

### Phase 4: Placeholder Performance Tracking

#### 4.1 Input Placeholder Variants

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/components/tag-input.tsx`

**Changes**:

- A/B test different placeholder texts
- Track engagement metrics
- Optimize for tag selection rates

```typescript
const TAG_PLACEHOLDERS = {
  control: "add tags to describe your vibe...",
  action: "tag this moment (e.g., weekend, coffee, adventure)...",
  emotional: "what mood does this capture? (e.g., peaceful, exciting)...",
  category: "choose categories that fit (e.g., food, travel, family)...",
  discovery: "help others discover this vibe..."
};

export function TagInput({ onTagAdd }: TagInputProps) {
  const { getVariant, trackConversion } = useABTesting();
  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    getVariant('tag_placeholder_test').then(variant => {
      setPlaceholder(variant.content);
      trackConversion('tag_placeholder_test', variant.id, 'view');
    });
  }, []);

  const handleTagAdd = (tag: string) => {
    trackConversion('tag_placeholder_test', placeholder, 'tag_added');
    onTagAdd(tag);
  };

  return (
    <Input
      placeholder={placeholder}
      onSubmit={handleTagAdd}
    />
  );
}
```

#### 4.2 Vibe Creation Placeholders

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/routes/vibes/create.tsx`

**Changes**:

- Test different description placeholders
- Track completion rates
- Optimize for quality content creation

```typescript
const DESCRIPTION_PLACEHOLDERS = {
  control: 'describe your vibe...',
  story: 'tell the story behind this moment...',
  emotion: 'what made this experience special?...',
  detail: 'paint the picture - what was happening?...',
  relatable: 'share what others might relate to...',
};
```

### Phase 5: Signup CTA for Unauthenticated Actions

#### 5.1 Rating Interaction Prompts

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/ratings/components/emoji-reaction.tsx`

**Changes**:

- Detect unauthenticated rating attempts
- Show targeted signup prompts
- Track conversion from prompt to signup

```typescript
export function EmojiReaction({ vibe, emoji }: EmojiReactionProps) {
  const { user } = useUser();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const handleReactionClick = () => {
    if (!user) {
      // Track unauthenticated interaction attempt
      analytics.track('auth_prompt_triggered', {
        action: 'emoji_reaction',
        vibeId: vibe.id,
        emoji,
        source: 'rating_interaction'
      });

      setShowAuthPrompt(true);
      return;
    }

    // Proceed with authenticated reaction
    handleRating(emoji);
  };

  return (
    <>
      <Button onClick={handleReactionClick}>
        {emoji} React
      </Button>

      {showAuthPrompt && (
        <AuthPromptDialog
          open={showAuthPrompt}
          onOpenChange={setShowAuthPrompt}
          title="join the conversation"
          description="sign in with your apple id to rate vibes and share your thoughts"
          actionText="rating this vibe"
        />
      )}
    </>
  );
}
```

#### 5.2 Follow Button Auth Prompts

**File**: `/Users/jacob/Developer/vibechecc/apps/web/src/features/follows/components/follow-button.tsx`

**Changes**:

- Prompt authentication for follow attempts
- Track follow-intent conversions
- Personalize messaging based on context

#### 5.3 Comment/Share Auth Prompts

**Files**: Various interaction components

**Changes**:

- Consistent auth prompting across all user actions
- Context-aware messaging
- Conversion tracking and optimization

## Testing Requirements

### 5.1 Authentication Testing

- Test Apple ID restriction enforcement
- Verify provider validation works correctly
- Test graceful fallback for unsupported providers
- Validate anonymous session migration

### 5.2 A/B Testing Validation

- Verify variant assignment consistency
- Test conversion tracking accuracy
- Validate statistical significance calculations
- Test performance impact of A/B framework

### 5.3 UX Flow Testing

- Test auth prompt timing and context
- Verify session persistence across browser sessions
- Test onboarding completion rates
- Validate anonymous-to-authenticated transition

### 5.4 Performance Testing

- Measure impact of anonymous session tracking
- Test A/B testing overhead
- Validate auth prompt responsiveness
- Test mobile experience optimizations

## Implementation Order/Phases

### Phase 1: Foundation (Week 1)

1. Apple ID-only authentication setup
2. Anonymous session infrastructure
3. Basic A/B testing framework

### Phase 2: Tracking Implementation (Week 2)

1. Welcome tagline A/B testing
2. Placeholder performance tracking
3. Auth prompt integration

### Phase 3: Optimization (Week 3)

1. Data analysis and optimization
2. Performance improvements
3. UX refinements based on metrics

### Phase 4: Rollout (Week 4)

1. Gradual feature rollout
2. Monitoring and adjustments
3. Full deployment

## Risk Assessment

### High Risk

- **Apple ID restriction** may reduce signup rates initially
- **A/B testing overhead** could impact performance
- **Anonymous session data** privacy concerns

### Medium Risk

- **User confusion** about Apple ID requirement
- **Data migration complexity** for existing users
- **Cross-browser session handling**

### Low Risk

- **A/B testing infrastructure** is additive
- **Auth prompt messaging** can be refined post-launch
- **Placeholder variations** have minimal impact

## Success Metrics

### Authentication Metrics

- Apple ID signup completion rate: >80%
- Anonymous session migration rate: >90%
- Auth prompt conversion rate: >15%

### A/B Testing Metrics

- Welcome tagline engagement lift: >10%
- Placeholder interaction improvement: >20%
- Overall onboarding completion: >60%

### Quality Metrics

- Bot/spam account reduction: >90%
- User engagement post-auth: +25%
- Session duration improvement: +15%

## Dependencies

### External Services

- Clerk Apple ID provider configuration
- Analytics platform integration (PostHog)
- A/B testing statistical tools

### Internal Systems

- User schema updates
- Analytics event tracking
- Performance monitoring
- Database migration tools

### Development Tools

- TypeScript type definitions
- Testing frameworks for A/B tests
- Analytics dashboard setup
- User feedback collection system

---

**Total Estimated Effort**: 3-4 weeks
**Team Requirements**: 2 frontend developers, 1 backend developer
**Success Criteria**: Increased auth conversion, reduced spam, improved onboarding metrics
