# Authentication Patterns

This document formally defines the consistent authentication patterns used throughout the vibechecc codebase. These patterns ensure security and consistency across frontend and backend implementations.

## Frontend Authentication Patterns

### 1. Auth Guard Pattern

**Pattern**: Check user authentication status before allowing interactive features

```typescript
// Standard auth guard pattern
if (!user) {
  setShowAuthDialog(true);
  return;
}
```

**Usage Examples**:

- Emoji reactions (`apps/web/src/features/ratings/components/emoji-reaction.tsx`)
- Vibe interactions (`apps/web/src/routes/vibes/$vibeId.tsx`)
- Following/unfollowing users

**Security Note**: Always check authentication **before** performing any state changes or API calls.

### 2. AuthPromptDialog Integration

**Pattern**: Use the standardized auth dialog for consistent user experience

```typescript
// State management for auth dialog
const [showAuthDialog, setShowAuthDialog] = useState(false);

// Dialog component integration
<AuthPromptDialog
  open={showAuthDialog}
  onOpenChange={setShowAuthDialog}
  title="sign in required"
  description="you must sign in to use vibechecc"
/>
```

**Implementation Details**:

- Located at `apps/web/src/features/auth/components/auth-prompt-dialog.tsx`
- Uses Clerk's `SignInButton` and `SignUpButton` components
- Consistent styling with gradient buttons and backdrop blur
- Title and description are lowercase following UI design patterns

### 3. User State Checking Conventions

**Pattern**: Consistent user state validation across components

```typescript
// Check user existence and authentication
const { user } = useUser();

// Early return pattern for unauthenticated users
if (!user) {
  // Handle unauthenticated state
  return false; // or setShowAuthDialog(true)
}
```

**Common Locations**:

- Interactive buttons (reactions, ratings, follows)
- Form submissions
- User-specific data fetching

### 4. Authentication-Dependent Rendering

**Pattern**: Conditional rendering based on authentication status

```typescript
// Render different UI based on auth status
{user ? (
  <InteractiveButton onClick={handleInteraction} />
) : (
  <Button onClick={() => setShowAuthDialog(true)}>
    Sign in to interact
  </Button>
)}
```

## Backend Authentication Patterns

### 1. Authentication Context Usage

**Pattern**: Standard authentication flow using Convex context

```typescript
// Standard authentication check
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error('User not authenticated');
}
```

**Helper Functions**: Use standardized helper functions from `convex/users.ts`:

```typescript
// Get current user (returns null if not authenticated)
const user = await getCurrentUser(ctx);

// Get current user or throw error
const user = await getCurrentUserOrThrow(ctx);
```

### 2. User Lookup Patterns

**Pattern**: External ID vs Internal ID handling

```typescript
// External ID (from Clerk/auth provider)
const identity = await ctx.auth.getUserIdentity();
const externalId = identity.subject;

// Internal ID (Convex database ID)
const user = await userByExternalId(ctx, externalId);
const internalId = user._id;
```

**Security Note**: Always use external ID (`identity.subject`) for user identification from auth context, then lookup internal database record.

### 3. Authentication Checks in Queries/Mutations

**Pattern**: Consistent authentication validation

```typescript
// For mutations (data modification)
export const createVibe = mutation({
  args: {
    /* mutation args */
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    // Proceed with authenticated operation
  },
});

// For queries (data reading)
export const getUserData = query({
  args: {
    /* query args */
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null; // or throw error if auth required
    }
    // Return user-specific data
  },
});
```

### 4. Error Handling for Unauthenticated Requests

**Pattern**: Consistent error messages and handling

```typescript
// Standard error message
throw new Error('User not authenticated');

// For operations requiring specific permissions
if (!user?.isAdmin) {
  throw new Error('Insufficient permissions');
}
```

## Testing Authentication Patterns

### 1. Mock Identity Structure

**Pattern**: Consistent mock identity across all tests

```typescript
const mockIdentity = {
  subject: 'user_test_123', // External user ID
  tokenIdentifier: 'test_token_identifier',
  email: 'test@example.com',
  givenName: 'Test',
  familyName: 'User',
  nickname: 'testuser',
  pictureUrl: 'https://example.com/avatar.jpg',
  emailVerified: true,
  aud: 'test-audience',
  iss: 'https://clerk.example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};
```

**Required Fields**:

- `subject`: External user ID (maps to User.externalId)
- `email`, `givenName`, `familyName`, `nickname`: User profile data
- `pictureUrl`: User avatar URL
- `emailVerified`: Boolean for email verification status
- JWT fields: `aud`, `iss`, `iat`, `exp` for token validation

### 2. User Creation Before Authenticated Function Tests

**Pattern**: Create user in database before testing authenticated operations

```typescript
describe('authenticated operation', () => {
  test('should work with authenticated user', async () => {
    const mockIdentity = {
      /* mock identity */
    };

    // First create user in database
    await t.withIdentity(mockIdentity).mutation(api.users.create, {
      externalId: mockIdentity.subject,
      username: mockIdentity.nickname,
      // ... other user fields
    });

    // Then test the authenticated operation
    const result = await t
      .withIdentity(mockIdentity)
      .mutation(api.someFunction, args);

    expect(result).toBeDefined();
  });
});
```

### 3. Authentication Context Setup in Tests

**Pattern**: Use `convex-test` with identity context

```typescript
// Testing authenticated functions
await t.withIdentity(mockIdentity).mutation(api.function, args);

// Testing unauthenticated access (should throw)
await expect(t.mutation(api.authenticatedFunction, args)).rejects.toThrow(
  'User not authenticated'
);
```

### 4. Test Authentication Flow Patterns

**Pattern**: Test both authenticated and unauthenticated scenarios

```typescript
describe('authentication flow', () => {
  test('should allow authenticated users', async () => {
    // Test with authentication
    const result = await t
      .withIdentity(mockIdentity)
      .mutation(api.function, args);
    expect(result).toBeDefined();
  });

  test('should reject unauthenticated users', async () => {
    // Test without authentication
    await expect(t.mutation(api.function, args)).rejects.toThrow(
      'User not authenticated'
    );
  });
});
```

## Security Considerations

### 1. Frontend Security

- **Never trust client-side authentication state** - always verify on backend
- **Use auth guards consistently** - check authentication before any interactive feature
- **Implement proper error boundaries** - handle authentication failures gracefully
- **Secure sensitive routes** - redirect unauthenticated users appropriately

### 2. Backend Security

- **Always validate authentication context** - use `ctx.auth.getUserIdentity()`
- **Use helper functions** - prefer `getCurrentUser()` and `getCurrentUserOrThrow()`
- **Validate user permissions** - check user roles/permissions for sensitive operations
- **Consistent error handling** - use standard error messages

### 3. Testing Security

- **Test both scenarios** - authenticated and unauthenticated access
- **Verify error conditions** - ensure proper errors are thrown
- **Use consistent mock data** - follow the standard mock identity structure
- **Test permission boundaries** - verify role-based access controls

## Integration with Clerk Authentication

The vibechecc application uses Clerk as the authentication provider:

- **Frontend**: Uses `@clerk/tanstack-react-start` components
- **Backend**: Convex automatically validates Clerk JWT tokens
- **User Management**: External ID from Clerk maps to internal user records
- **Testing**: Mock identities follow Clerk's JWT token structure

## Common Mistakes to Avoid

1. **Skipping auth guards** - Always check authentication before interactive features
2. **Inconsistent error messages** - Use standard "User not authenticated" message
3. **Missing test scenarios** - Always test both authenticated and unauthenticated cases
4. **Direct database queries** - Use helper functions instead of manual user lookups
5. **Frontend-only validation** - Always verify authentication on the backend
6. **Hardcoded user references** - Always use dynamic user context, never hardcode user IDs

## Best Practices Summary

1. **Frontend**: Use auth guard pattern + AuthPromptDialog integration
2. **Backend**: Use helper functions + consistent error handling
3. **Testing**: Use standard mock identity + test both auth scenarios
4. **Security**: Validate on backend + use proper error boundaries
5. **Consistency**: Follow established patterns + use standard error messages

This documentation should be referenced when implementing any authentication-related functionality to ensure consistency and security across the vibechecc codebase.
