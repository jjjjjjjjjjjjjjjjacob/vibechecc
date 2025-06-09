# Clerk ↔ Convex Bidirectional Sync Implementation

## Overview

This implementation provides seamless bidirectional synchronization between Clerk (authentication) and Convex (database) for user metadata updates. When users update their profile during onboarding or in their profile settings, changes are synced to both systems **in parallel using the frontend Clerk SDK and Promise.all()** for optimal performance.

## Architecture

```
Frontend (React)
        ↓
Promise.all([
  Convex Actions (updateProfile, updateOnboardingData, completeOnboarding),
  Clerk Frontend SDK (user.update(), user.setProfileImage())
])
        ↓
1. Convex Database Updated ✓
2. Clerk API Updated ✓ (in parallel)
        ↓
Clerk Webhook → Convex (eventual consistency)
        ↓
Final Sync Complete ✓
```

## Key Features

✅ **Frontend Clerk SDK Integration** - Uses [`user.update()`](https://clerk.com/docs/references/javascript/user#update) and [`user.setProfileImage()`](https://clerk.com/docs/references/javascript/user#set-profile-image) from frontend  
✅ **Parallel Execution** - Promise.all() runs Convex and Clerk updates simultaneously  
✅ **Type Safety** - Full TypeScript support with proper error handling  
✅ **Bidirectional Sync** - Updates flow from frontend → both systems → webhook reconciliation  
✅ **Avatar Sync** - Profile images uploaded via Clerk's `setProfileImage()` method  
✅ **Graceful Failure** - Independent error handling for Convex vs Clerk operations  
✅ **Automatic Creation** - Users auto-created in Convex when they sign up  

## Key Files Modified

### 1. `convex/users.ts`
- **Simplified actions**: Removed Clerk SDK calls, actions now only update Convex
- **Faster execution**: No sequential API calls, just local database updates
- **Cleaner code**: Single responsibility - backend handles only backend data

```typescript
// Simplified backend actions (Convex only)
export const updateProfile = action({
  args: { username: v.optional(v.string()), ... },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    // Update Convex only - Clerk updated from frontend
    return await ctx.runMutation(internal.users.updateProfileInternal, {
      externalId: identity.subject,
      ...args,
    });
  },
});
```

### 2. Frontend Components
- **Parallel updates**: Use Promise.all() to update Clerk and Convex simultaneously
- **Direct Clerk API**: Use frontend SDK methods like `user.update()` and `user.setProfileImage()`
- **Better UX**: Faster response times with parallel execution

```typescript
// Frontend: Parallel updates with Promise.all()
const promises: Promise<any>[] = [];

// Add Convex update
promises.push(updateProfileMutation.mutateAsync(convexUpdates));

// Add Clerk user update
if (Object.keys(clerkUpdates).length > 0) {
  promises.push(user.update(clerkUpdates));
}

// Add Clerk avatar update
if (uploadedImageFile) {
  promises.push(user.setProfileImage({ file: uploadedImageFile }));
}

// Execute all updates in parallel
await Promise.all(promises);
```

### 3. `src/components/avatar-picker.tsx`
- **File object passing**: Now passes both URL and File object to parent components
- **Optimized for Clerk**: Direct file upload to Clerk's `setProfileImage()` method

## Environment Variables Required

### Convex Environment Variables
Set these in your Convex dashboard:

```bash
# Clerk Secret Key (for SDK API calls to Clerk)
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key_here

# Clerk Webhook Signing Secret (for verifying webhook payloads)
CLERK_WEBHOOK_SIGNING_SECRET=whsec_your_webhook_signing_secret_here
```

### Frontend Environment Variables
Set these in your `.env.local` file:

```bash
# Clerk Publishable Key (for frontend authentication)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key_here

# Convex URL (for connecting to your Convex deployment)
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

## How It Works

### User Profile Updates Flow

1. **User interacts with UI** (onboarding, profile settings)
2. **Frontend calls Convex action** (`updateProfile`, `updateOnboardingData`, etc.)
3. **Convex action updates local database** via internal mutation
4. **Convex action calls Clerk SDK** to update Clerk user data
5. **Clerk webhook fires** (user.updated event)
6. **Webhook updates Convex** to ensure final consistency

### Data Consistency

- **Primary source**: Updates initiated from frontend
- **Parallel execution**: Convex and Clerk updated simultaneously with Promise.all()
- **Independent operations**: Each system updated directly (no interdependence)  
- **Webhook reconciliation**: Final sync ensures both systems match

### Synced User Fields

| Frontend Field | Convex Field | Clerk Field | Sync Method |
|---------------|--------------|-------------|-------------|
| `username` | `username` | `username` | Frontend `user.update()` |
| `first_name` | `first_name` | `firstName` | Frontend `user.update()` |
| `last_name` | `last_name` | `lastName` | Frontend `user.update()` |
| `image_url` | `image_url` | `imageUrl` | Frontend `user.setProfileImage()` |
| `interests` | `interests` | - | Convex only |

### Error Handling

- If **Convex update fails**: Error thrown, user sees failure message
- If **Clerk update fails**: Error thrown, user sees failure message  
- If **both fail**: User sees combined error message
- If **webhook fails**: Background reconciliation may be needed

## Testing the Integration

### 1. Profile Updates
```typescript
// Test parallel updates
const promises = [
  updateProfileMutation.mutateAsync({
    username: "newusername",
    first_name: "John", 
    last_name: "Doe",
    image_url: "data:image/jpeg;base64,..."
  }),
  user.update({
    username: "newusername",
    firstName: "John",
    lastName: "Doe"
  }),
  user.setProfileImage({ file: avatarFile })
];

await Promise.all(promises);
```

### 2. Onboarding Flow
```typescript
// Test onboarding completion with parallel updates
const promises = [
  completeOnboardingMutation.mutateAsync({
    username: "newuser",
    interests: ["tech", "music"]
  }),
  user.update({ username: "newuser" }),
  user.setProfileImage({ file: avatarFile })
];

await Promise.all(promises);
```

### 3. Avatar Updates Only
```typescript
// Test avatar-only update
await user.setProfileImage({ file: selectedFile });
// Convex will sync via webhook automatically
```

### 4. Verification
- Check Convex dashboard for user data updates
- Check Clerk dashboard for user profile changes
- Monitor webhook logs for reconciliation events

## Benefits of Frontend SDK + Promise.all() Approach

1. **Performance**: Parallel execution instead of sequential API calls
2. **Simplicity**: Frontend directly calls Clerk APIs (no backend proxy)
3. **Type Safety**: Direct access to Clerk's TypeScript interfaces
4. **Error Handling**: Independent error handling for each system
5. **Reduced Latency**: No backend → Clerk API delay
6. **Better UX**: Faster response times for user interactions
7. **Cleaner Architecture**: Single responsibility per system

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure `CLERK_SECRET_KEY` is set in Convex environment
   - Ensure `VITE_CLERK_PUBLISHABLE_KEY` is set in frontend

2. **Webhook Not Firing**
   - Check webhook URL in Clerk dashboard
   - Verify `CLERK_WEBHOOK_SIGNING_SECRET` matches

3. **SDK Errors**
   - Check Clerk secret key permissions
   - Verify user exists in Clerk before updates

### Debug Commands

```bash
# Regenerate Convex types
bun run convex codegen

# Check build
bun run build

# Deploy to test environment
bun run convex:deploy
```

## Data Flow Examples

### Profile Update During Onboarding
1. User fills out onboarding form with avatar, name, username
2. `updateOnboardingData` action called
3. Convex database updated immediately
4. Clerk API called to sync username/firstName/lastName
5. Clerk webhook triggers back to Convex
6. Final sync ensures consistency

### Avatar Upload
1. User selects image file in avatar picker
2. File converted to base64 data URL
3. `updateProfile` action called with image_url
4. Convex stores image_url and profile_image_url
5. Image displayed immediately in UI

## Benefits

- **Real-time sync**: Changes appear immediately in UI
- **Data consistency**: Both systems stay synchronized
- **Error resilience**: Convex updates succeed even if Clerk API fails
- **Source of truth**: Clerk remains authoritative for auth data
- **Performance**: No waiting for webhook roundtrip for UI updates

## Testing

The implementation includes:
- **Debug components**: `debug-auth.tsx` for monitoring auth state
- **Error logging**: Comprehensive console logging for troubleshooting
- **Graceful degradation**: UI works even if sync fails

## Future Enhancements

- [ ] Add retry logic for failed Clerk API calls
- [ ] Implement conflict resolution for concurrent updates
- [ ] Add image upload to cloud storage (vs base64)
- [ ] Batch webhook processing for high-volume updates 