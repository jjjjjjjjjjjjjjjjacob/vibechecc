# Authentication Rules - vibechecc

This document defines actionable authentication rules that MUST be followed throughout the vibechecc application. These rules ensure consistent security, user experience, and maintainability across all authentication-related functionality.

## 1. Frontend Authentication Rules

### Auth Guard Implementation Rules

**MUST implement auth guards for ALL interactive features:**

```typescript
// REQUIRED pattern for all user interactions
if (!user) {
  setShowAuthDialog(true);
  return; // MUST return early, never proceed without auth
}
```

**MUST apply to these features:**

- Emoji reactions
- Star ratings
- Following/unfollowing users
- Creating vibes
- Commenting/reviewing
- All user-generated content operations

**MUST NOT:**

- Allow any state changes without authentication check
- Proceed with API calls if user is not authenticated
- Rely solely on UI hiding - always check programmatically

### AuthPromptDialog Integration Rules

**MUST use standardized AuthPromptDialog for consistent UX:**

```typescript
// REQUIRED state management
const [showAuthDialog, setShowAuthDialog] = useState(false);

// REQUIRED dialog integration
<AuthPromptDialog
  open={showAuthDialog}
  onOpenChange={setShowAuthDialog}
  title="sign in required"
  description="you must sign in to use vibechecc"
/>
```

**MUST:**

- Use lowercase title and description text (following UI design patterns)
- Import from `apps/web/src/features/auth/components/auth-prompt-dialog.tsx`
- Include both state management and dialog component
- Use consistent styling with gradient buttons and backdrop blur

**MUST NOT:**

- Create custom auth dialogs
- Use different styling patterns
- Skip the dialog for any interactive feature

### User State Validation Rules

**MUST use consistent user state checking:**

```typescript
// REQUIRED pattern for user state validation
const { user } = useUser();

// MUST check user existence before any operation
if (!user) {
  // Handle unauthenticated state appropriately
  return false; // or setShowAuthDialog(true)
}
```

**MUST:**

- Check user state at the beginning of interactive functions
- Use early return pattern for unauthenticated users
- Handle both `null` and `undefined` user states
- Apply to all forms, buttons, and user-specific data fetching

### Authentication-Dependent Rendering Rules

**MUST implement conditional rendering based on auth status:**

```typescript
// REQUIRED pattern for auth-dependent UI
{user ? (
  <InteractiveButton onClick={handleInteraction} />
) : (
  <Button onClick={() => setShowAuthDialog(true)}>
    sign in to interact
  </Button>
)}
```

**MUST:**

- Provide clear indication when authentication is required
- Use consistent button text patterns (lowercase)
- Never show broken/non-functional UI to unauthenticated users
- Always offer a path to authentication

**MUST NOT:**

- Show interactive elements that don't work without auth
- Use inconsistent messaging or styling
- Hide all functionality - show what's available after sign-in

## 2. Backend Authentication Rules

### Authentication Context Usage Rules

**MUST use standardized authentication patterns:**

```typescript
// REQUIRED authentication check
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error('User not authenticated');
}
```

**MUST use helper functions from `convex/users.ts`:**

```typescript
// For operations that can work without auth
const user = await getCurrentUser(ctx);

// For operations requiring authentication
const user = await getCurrentUserOrThrow(ctx);
```

**MUST:**

- Always validate authentication context at function start
- Use helper functions instead of manual auth checks
- Include authentication validation in all mutations
- Consider authentication requirements for queries

### User Lookup Pattern Rules

**MUST follow external/internal ID mapping rules:**

```typescript
// REQUIRED pattern for user identification
const identity = await ctx.auth.getUserIdentity();
const externalId = identity.subject; // From auth provider (Clerk)

// REQUIRED pattern for database lookup
const user = await userByExternalId(ctx, externalId);
const internalId = user._id; // Convex database ID
```

**MUST:**

- Always use `identity.subject` as the external ID
- Look up internal database record using external ID
- Never hardcode user IDs or skip the lookup process
- Handle cases where user record doesn't exist

**MUST NOT:**

- Use internal IDs from authentication context
- Mix up external and internal ID usage
- Skip user record validation

### Query/Mutation Authentication Rules

**REQUIRED patterns for different function types:**

```typescript
// For mutations (MUST authenticate)
export const createVibe = mutation({
  args: {
    /* mutation args */
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    // Proceed with authenticated operation
  },
});

// For queries (authentication optional but recommended)
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

**MUST:**

- Use `getCurrentUserOrThrow()` for mutations requiring authentication
- Use `getCurrentUser()` for queries that can work without auth
- Handle unauthenticated cases appropriately in queries
- Never proceed with user-specific operations without user context

### Error Handling Rules

**MUST use consistent error messages and handling:**

```typescript
// REQUIRED error message for unauthenticated access
throw new Error('User not authenticated');

// REQUIRED pattern for permission checks
if (!user?.isAdmin) {
  throw new Error('Insufficient permissions');
}
```

**MUST:**

- Use exact error message: "User not authenticated"
- Throw errors immediately when authentication fails
- Include permission checks for sensitive operations
- Provide clear, actionable error messages

**MUST NOT:**

- Use inconsistent error messages
- Continue execution after authentication failure
- Expose sensitive information in error messages

## 3. Testing Authentication Rules

### Mock Identity Structure Rules

**MUST use consistent mock identity across all tests:**

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

**REQUIRED fields that MUST be included:**

- `subject`: Maps to User.externalId
- `email`, `givenName`, `familyName`, `nickname`: User profile data
- `pictureUrl`: User avatar URL
- `emailVerified`: Email verification status
- JWT fields: `aud`, `iss`, `iat`, `exp` for token validation

**MUST:**

- Use consistent field values across tests
- Include all required JWT fields
- Use realistic data that matches production patterns

### User Creation Before Testing Rules

**MUST create user in database before testing authenticated operations:**

```typescript
describe('authenticated operation', () => {
  test('should work with authenticated user', async () => {
    const mockIdentity = {
      /* mock identity */
    };

    // REQUIRED: Create user in database first
    await t.withIdentity(mockIdentity).mutation(api.users.create, {
      externalId: mockIdentity.subject,
      username: mockIdentity.nickname,
      // ... other required user fields
    });

    // Then test the authenticated operation
    const result = await t
      .withIdentity(mockIdentity)
      .mutation(api.someFunction, args);

    expect(result).toBeDefined();
  });
});
```

**MUST:**

- Create user record before testing authenticated functions
- Use consistent user creation pattern
- Map external ID correctly from mock identity
- Include all required user fields

### Authentication Context Setup Rules

**MUST use proper convex-test identity context:**

```typescript
// REQUIRED pattern for authenticated function testing
await t.withIdentity(mockIdentity).mutation(api.function, args);

// REQUIRED pattern for testing unauthenticated access
await expect(t.mutation(api.authenticatedFunction, args)).rejects.toThrow(
  'User not authenticated'
);
```

**MUST:**

- Use `.withIdentity()` for authenticated tests
- Test without identity for unauthenticated scenarios
- Verify exact error messages in rejection tests

### Test Authentication Flow Rules

**MUST test both authenticated and unauthenticated scenarios:**

```typescript
describe('authentication flow', () => {
  test('should allow authenticated users', async () => {
    // REQUIRED: Test with authentication
    const result = await t
      .withIdentity(mockIdentity)
      .mutation(api.function, args);
    expect(result).toBeDefined();
  });

  test('should reject unauthenticated users', async () => {
    // REQUIRED: Test without authentication
    await expect(t.mutation(api.function, args)).rejects.toThrow(
      'User not authenticated'
    );
  });
});
```

**MUST:**

- Include both positive and negative test cases
- Verify successful execution with authentication
- Verify proper error handling without authentication
- Use consistent test structure and naming

## 4. Clerk Integration Rules

### Configuration Requirements

**MUST configure Clerk properly:**

- Frontend: Use `@clerk/tanstack-react-start` components
- Backend: Convex automatically validates Clerk JWT tokens
- Environment variables: Set up Clerk keys in all environments
- Webhooks: Configure user synchronization webhooks

### User Synchronization Rules

**MUST maintain user sync between Clerk and Convex:**

```typescript
// REQUIRED webhook pattern for user creation/updates
export const clerkWebhook = httpAction(async (ctx, request) => {
  // MUST verify webhook signature
  const payload = await request.text();
  const verified = verifyWebhookSignature(payload, headers);

  if (!verified) {
    throw new Error('Invalid webhook signature');
  }

  // Process user events
});
```

**MUST:**

- Verify all webhook signatures
- Handle user creation, updates, and deletion events
- Keep user data synchronized between systems
- Log webhook processing for debugging

### Environment Setup Rules

**MUST configure authentication in all environments:**

- Development: Local Clerk configuration with ngrok webhooks
- Staging: Separate Clerk instance for testing
- Production: Production Clerk instance with proper domain setup
- Testing: Mock authentication with consistent patterns

## 5. Security Requirements

### Authentication Bypass Prevention

**MUST implement defense-in-depth:**

- Never trust client-side authentication state
- Always validate on backend
- Use proper error boundaries for auth failures
- Implement session timeout handling

### Token Handling Standards

**MUST follow secure token practices:**

- Never store sensitive tokens in localStorage
- Use secure, httpOnly cookies when possible
- Implement proper token refresh patterns
- Handle token expiration gracefully

### Session Management Rules

**MUST implement proper session handling:**

- Validate session state on navigation
- Clear sensitive data on logout
- Handle concurrent sessions appropriately
- Implement proper session timeout

### Security Audit Requirements

**MUST regularly audit authentication:**

- Review authentication flows for vulnerabilities
- Test for common auth bypass techniques
- Verify proper error handling
- Check for information disclosure in errors

## Common Mistakes to Avoid

1. **Skipping auth guards** - Always check authentication before interactive features
2. **Inconsistent error messages** - Use standard "User not authenticated" message
3. **Missing test scenarios** - Always test both authenticated and unauthenticated cases
4. **Direct database queries** - Use helper functions instead of manual user lookups
5. **Frontend-only validation** - Always verify authentication on the backend
6. **Hardcoded user references** - Always use dynamic user context, never hardcode user IDs
7. **Mixed ID usage** - Never confuse external and internal user IDs
8. **Incomplete mock data** - Always include all required fields in test mock identities
9. **Skipping user creation in tests** - Always create user records before testing auth operations
10. **Inconsistent UI patterns** - Always use AuthPromptDialog and consistent styling

## Implementation Checklist

When implementing authentication features, verify:

### Frontend Checklist

- [ ] Auth guard implemented before any user interaction
- [ ] AuthPromptDialog integrated with proper state management
- [ ] User state validation using `useUser()` hook
- [ ] Conditional rendering based on authentication status
- [ ] Consistent error handling and user feedback
- [ ] Lowercase UI text following design patterns

### Backend Checklist

- [ ] Authentication context validated using helper functions
- [ ] Proper external/internal ID mapping
- [ ] Consistent error messages and handling
- [ ] Permission checks for sensitive operations
- [ ] User lookup patterns implemented correctly

### Testing Checklist

- [ ] Mock identity includes all required fields
- [ ] User created in database before authenticated tests
- [ ] Both authenticated and unauthenticated scenarios tested
- [ ] Proper error message verification in tests
- [ ] Consistent test structure and patterns

### Security Checklist

- [ ] No authentication bypass possible
- [ ] Proper token handling implemented
- [ ] Session management working correctly
- [ ] All webhooks properly verified
- [ ] Error messages don't expose sensitive information

This document serves as the definitive guide for authentication implementation in vibechecc. All authentication-related code MUST follow these rules to ensure consistency, security, and maintainability.
