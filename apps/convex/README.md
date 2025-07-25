# vibechecc Convex Backend

> **Note:** For monorepo setup, scripts, and infrastructure, see the [root README.md](../../README.md).

This directory contains the Convex backend functions for the vibechecc application.

## Overview

The Convex backend provides:

- **Real-time database** with automatic syncing to frontend
- **Type-safe functions** for queries, mutations, and actions
- **Authentication integration** with Clerk
- **Webhook handling** for external service synchronization
- **Database seeding** for development and testing

## File Structure

```
convex/
├── schema.ts              # Database schema definitions
├── users.ts               # User management functions
├── vibes.ts              # Vibe-related functions (CRUD, reactions, ratings)
├── seed.ts               # Database seeding functions
├── auth.config.js        # Clerk authentication configuration
├── http.ts               # HTTP endpoints for webhooks
├── tsconfig.json         # TypeScript configuration
├── vibes.test.ts         # Backend function tests
└── _generated/           # Auto-generated Convex files
    ├── api.d.ts         # API type definitions
    ├── server.d.ts      # Server type definitions
    └── dataModel.d.ts   # Data model types
```

## Database Schema

### Tables

#### Users

- `external_id`: Clerk user ID
- `username`: Unique username
- `first_name`, `last_name`: User's name
- `image_url`: Profile picture URL
- `interests`: Array of user interests
- `is_onboarded`: Onboarding completion status
- Timestamps: `created_at`, `updated_at`

#### Vibes

- `title`: Vibe title/headline
- `description`: Detailed description
- `tags`: Array of categorization tags
- `author_id`: Reference to Users table
- `is_public`: Visibility setting
- Timestamps: `created_at`, `updated_at`

#### Ratings

- `vibe_id`: Reference to Vibes table
- `user_id`: Reference to Users table
- `rating`: Number (1-5 stars)
- `comment`: Optional text review
- Timestamps: `created_at`, `updated_at`

#### Reactions

- `vibe_id`: Reference to Vibes table
- `user_id`: Reference to Users table
- `emoji`: Emoji character (😂, 😭, 💯, etc.)
- Timestamps: `created_at`, `updated_at`

#### EmojiRatings

- `vibe_id`: Reference to Vibes table
- `user_id`: Reference to Users table
- `emoji`: Emoji character used for rating
- `rating`: Number (1-5, supports decimals)
- `comment`: Required review text
- `tags`: Optional array of descriptive tags
- Timestamps: `created_at`, `updated_at`

## Function Types

### Queries (Read-only)

Queries are reactive and automatically update the frontend when data changes.

**User Queries:**

- `getCurrentUser()` - Get current authenticated user
- `getUserByUsername(username)` - Find user by username
- `getUserById(userId)` - Get user by ID

**Vibe Queries:**

- `getVibes()` - Get all public vibes with pagination
- `getVibeById(vibeId)` - Get single vibe with details
- `getVibesByUser(userId)` - Get user's vibes
- `getVibeStats(vibeId)` - Get rating/reaction statistics

**Rating/Reaction Queries:**

- `getVibeRatings(vibeId)` - Get all ratings for a vibe
- `getVibeReactions(vibeId)` - Get all reactions for a vibe
- `getUserRating(vibeId, userId)` - Get specific user's rating
- `getEmojiRatings(vibeId)` - Get emoji ratings with aggregated stats
- `getUserEmojiRating(vibeId, userId)` - Get specific user's emoji rating

### Mutations (Write operations)

Mutations modify database state and trigger reactive updates.

**User Mutations:**

- `createUser(userData)` - Create new user account
- `updateProfile(profileData)` - Update user profile
- `completeOnboarding(onboardingData)` - Complete user onboarding

**Vibe Mutations:**

- `createVibe(vibeData)` - Create new vibe
- `updateVibe(vibeId, updates)` - Update existing vibe
- `deleteVibe(vibeId)` - Delete vibe

**Rating/Reaction Mutations:**

- `addRating(vibeId, rating, comment)` - Add/update rating
- `removeRating(vibeId)` - Remove user's rating
- `addReaction(vibeId, emoji)` - Add/toggle emoji reaction
- `removeReaction(vibeId, emoji)` - Remove emoji reaction
- `addEmojiRating(vibeId, emoji, rating, comment, tags)` - Add emoji-based rating
- `updateEmojiRating(ratingId, updates)` - Update existing emoji rating
- `removeEmojiRating(ratingId)` - Remove emoji rating

### Actions (External integrations)

Actions can call external APIs and perform complex operations.

**User Actions:**

- `updateProfile(profileData)` - Update profile in both Convex and Clerk
- `completeOnboarding(data)` - Complete onboarding with external sync

**Webhook Actions:**

- `handleClerkWebhook(payload)` - Process Clerk user events

## Authentication

Authentication is handled through Clerk integration:

```typescript
// In any function, get the current user
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error('Not authenticated');
}

// Get user from database
const user = await ctx.db
  .query('users')
  .withIndex('by_external_id', (q) => q.eq('external_id', identity.subject))
  .unique();
```

## Usage Examples

### Frontend Query Usage

```typescript
import { api } from '@/convex/_generated/api';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';

// Get current user
const { data: user } = useQuery(convexQuery(api.users.getCurrentUser, {}));

// Get vibes with real-time updates
const { data: vibes } = useQuery(
  convexQuery(api.vibes.getVibes, { limit: 20 })
);
```

### Frontend Mutation Usage

```typescript
import { api } from '@/convex/_generated/api';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';

// Create vibe mutation
const createVibeMutation = useConvexMutation(api.vibes.createVibe);

// Usage in component
const handleCreateVibe = async (vibeData) => {
  try {
    const result = await createVibeMutation.mutateAsync(vibeData);
    toast.success('Vibe created successfully!');
  } catch (error) {
    toast.error('Failed to create vibe');
  }
};
```

## Development Commands

```bash
# Start Convex development server
bunx convex dev

# Deploy functions to production
bunx convex deploy

# Open Convex dashboard
bunx convex dashboard

# Run database seed
bunx convex run seed:seed

# View function logs
bunx convex logs

# Set environment variables
bunx convex env set CLERK_SECRET_KEY your_key_here

# List environment variables
bunx convex env list
```

## Environment Variables

Set these in your Convex dashboard:

```bash
# Required for Clerk integration
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key

# Required for webhook verification
CLERK_WEBHOOK_SIGNING_SECRET=whsec_your_webhook_secret
```

## Database Seeding

The seed scripts provide multiple options for populating test data:

### Basic Seed (`seed:seed`)
- **5 Users**: Diverse user profiles with different interests
- **4 Vibes**: Various life experiences and situations
- **20 Ratings**: User ratings with required comments
- **40 Reactions**: Emoji reactions from users
- **Emoji Ratings**: Each rating now includes emoji-based ratings

### Enhanced Seed (`seed:enhancedSeed`)
- **30 Users**: Comprehensive user base
- **20 Vibes**: Wide variety of content
- **100+ Ratings**: Extensive rating coverage
- **200+ Reactions**: Large-scale testing
- **Emoji Metadata**: Pre-populated emoji categories and tags

### Clear Database (`seed:clearDatabase`)
- Removes all data from all tables
- Useful for clean slate testing

Run seeding:

```bash
# Via npm script
bun run seed

# Direct Convex command
bunx convex run seed:seed

# Via script file
bun scripts/seed-db.js
```

## Testing

Backend functions are tested using Convex's testing framework:

```bash
# Run backend tests
bunx convex test

# Run specific test file
bunx convex test vibes.test.ts
```

Tests cover:

- Function input validation
- Authentication requirements
- Database operations
- Error handling
- Business logic

## Webhooks

The backend handles webhooks from external services:

### Clerk Webhooks

- **Endpoint**: `/webhooks/clerk`
- **Events**: `user.created`, `user.updated`, `user.deleted`
- **Purpose**: Keep Convex user data in sync with Clerk

Configure webhook URL in Clerk dashboard:

```
https://your-ngrok-url.ngrok-free.app/webhooks/clerk
```

## Performance Considerations

- **Indexes**: Proper database indexes for efficient queries
- **Pagination**: Large result sets use cursor-based pagination
- **Caching**: Convex automatically caches and invalidates queries
- **Real-time**: WebSocket connections for live updates

## Security

- **Authentication**: All functions require proper authentication
- **Authorization**: Users can only modify their own data
- **Validation**: Input validation using Convex validators
- **Sanitization**: User input is properly sanitized

## Troubleshooting

### Common Issues

1. **Authentication errors**

   ```bash
   # Check Clerk configuration
   bunx convex env list
   ```

2. **Function deployment issues**

   ```bash
   # Redeploy functions
   bunx convex deploy --debug
   ```

3. **Database connection issues**

   ```bash
   # Restart development server
   bunx convex dev --once
   ```

4. **Webhook verification failures**
   - Verify webhook signing secret
   - Check ngrok tunnel is active
   - Validate webhook URL in Clerk dashboard

### Debugging

- Use `console.log()` in functions for debugging
- Check function logs: `bunx convex logs`
- Use Convex dashboard for data inspection
- Test functions directly in dashboard

## Learn More

- [Convex Documentation](https://docs.convex.dev/)
- [Convex React Integration](https://docs.convex.dev/client/react)
- [Convex Authentication](https://docs.convex.dev/auth)
- [Convex Testing](https://docs.convex.dev/functions/testing)
