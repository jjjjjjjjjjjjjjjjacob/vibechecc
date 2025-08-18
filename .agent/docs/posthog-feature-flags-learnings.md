# PostHog Feature Flags Implementation Learnings

## Context

Implemented PostHog feature flags for managing social media sharing transitions, specifically for sunsetting Facebook in favor of Instagram and enabling TikTok ShareKit.

## Key Learnings

### 1. Feature Flag Architecture

- **Created central configuration**: All feature flags defined in `/config/feature-flags.ts` with TypeScript enums for type safety
- **Default values are critical**: Always provide sensible defaults for when PostHog is unavailable or loading
- **Metadata helps documentation**: Including description, category, and rollout phase in flag metadata aids team understanding

### 2. Hook Implementation Patterns

- **Single flag hook**: `useFeatureFlag(flag)` for checking individual flags with proper loading states
- **Multiple flags hook**: `useMultipleFeatureFlags(flags[])` for batch fetching to reduce API calls
- **Domain-specific hooks**: `useSocialSharingFlags()` provides all social flags in one convenient hook

### 3. Modal Component Strategy

- **Separate modals for platforms**: Created dedicated `TikTokShareModal` and `InstagramShareModal` components
- **Feature flag integration**: Each modal checks its own flags and shows appropriate UI (coming soon vs manual)
- **Fallback patterns**: Always provide fallback behavior when features are disabled

### 4. Manual Sharing Implementation

- **Image generation with Canvas**: Using `VibeShareCanvas` component for creating shareable images
- **Platform-specific formats**:
  - Instagram: 1:1 (post) and 9:16 (story)
  - TikTok: 9:16 (optimized for mobile)
- **Download workflow**: Generate → Download → Copy Caption → Open App

### 5. Coming Soon Messaging

- **Clear communication**: "Coming soon" banners with gradient backgrounds make future features visible
- **Alternative paths**: Always provide manual sharing option when direct sharing isn't available
- **User education**: Step-by-step instructions in separate tabs help users understand the process

### 6. ShareKit Preparation

- **Progressive enhancement**: Start with manual sharing, add ShareKit when ready
- **Feature detection**: Check for ShareKit availability before showing direct share options
- **Graceful degradation**: Fall back to manual sharing if ShareKit fails to load

## Implementation Checklist for Future Features

When adding new social platform integrations:

1. **Define feature flags**:
   - Add to `FeatureFlags` enum
   - Set default values
   - Add metadata

2. **Create modal component**:
   - Check feature flags
   - Implement manual sharing
   - Add coming soon state
   - Include instructions

3. **Update share modal**:
   - Add platform button
   - Integrate feature flag checks
   - Handle modal transitions

4. **Document in PostHog**:
   - Create flags in dashboard
   - Set rollout percentages
   - Configure targeting rules

## Common Pitfalls to Avoid

1. **Don't forget loading states**: Feature flags are async, always handle loading
2. **Test all flag combinations**: Some users might have manual but not direct
3. **Provide migration paths**: When sunsetting features, guide users clearly
4. **Monitor performance**: Too many flag checks can slow down the app
5. **Clean up old flags**: Remove flags after 100% rollout to reduce complexity

## Useful Patterns

### Conditional Rendering with Flags

```typescript
const Component = () => {
  const flagEnabled = useFeatureFlag(FeatureFlags.SOME_FLAG);

  if (!flagEnabled) return <FallbackComponent />;
  return <NewFeatureComponent />;
};
```

### A/B Testing with Flags

```typescript
const ShareButton = () => {
  const v2Enabled = useFeatureFlag(FeatureFlags.SOCIAL_SHARING_V2);

  return v2Enabled ? <ShareModalV2 /> : <ShareModal />;
};
```

### Migration Messaging

```typescript
const MigrationNotice = () => {
  const migrationFlag = useFeatureFlag(FeatureFlags.SOCIAL_FB_TO_IG_MIGRATION);

  if (!migrationFlag) return null;

  return (
    <Alert>
      <AlertCircle />
      <span>Facebook sharing is being replaced with Instagram</span>
    </Alert>
  );
};
```

## Testing Strategy

1. **Mock flags in tests**: Use `mockFeatureFlags` utility
2. **Test both states**: Always test with flag on and off
3. **Test loading states**: Ensure UI handles async flag loading
4. **Integration tests**: Test complete user flows with different flag combinations

## Next Steps for ShareKit Integration

1. **Install ShareKit SDK**: `bun add @tiktok/sharekit`
2. **Create initialization wrapper**: Lazy load SDK only when flag enabled
3. **Implement share flow**: Generate content → Call ShareKit API → Handle callbacks
4. **Add analytics**: Track ShareKit success/failure rates
5. **Gradual rollout**: Start with 5% → 25% → 50% → 100%

## Monitoring Recommendations

- Track flag exposure rates in PostHog
- Monitor share completion rates by method (manual vs direct)
- Set up alerts for error spikes
- Create funnel analysis for share flow
- A/B test conversion rates between old and new modals
