# Trello-like example using Convex DB

This is a TanStack Start demo using Convex as the database.
It is similar to the [start-trellaux](https://github.com/TanStack/router/tree/main/examples/react/start-trellaux) example but uses a cloud Convex deployment instead of an in-memory database.

To run this example:

```sh
pnpm install
pnpm dev
```

## Database Seeding

This project includes a comprehensive seed script that populates the database with sample data including users, vibes, ratings, and reactions.

### Running the Seed Script

```sh
# Option 1: Using the npm script
bun run seed

# Option 2: Using Convex CLI directly
bunx convex run seed:seed

# Option 3: Running the script directly
bun scripts/seed-db.js
```

### What Gets Seeded

The seed script creates:
- **5 Users**: Alex Johnson, Sofia Davis, Marcus Lee, Olivia Smith, Ethan Brown
- **4 Vibes**: Various relatable life situations with descriptions and tags
- **16 Ratings**: User ratings (1-5 stars) with detailed text reviews/comments
- **33 Reactions**: Emoji reactions from users to vibes (😂, 😭, 💯, 👀, 😱, 🚽, 🔦, 🤑, 💰, 🎉, 👖, 😬, 🙈, ⏱️)

### Important Notes

- The seed script will skip seeding if data already exists to prevent duplicates
- All sample data comes from `src/db/sample-data.ts`
- The script provides detailed logging of the seeding process
- Make sure your Convex deployment is running before seeding

# Convex

Convex is an open source Reactive backend made by [convex.dev](https://convex.dev/?utm_source=tanstack), a sponsor of TanStack Start.

This example uses Convex with TanStack Query and TanStack Start to provide

- Typesafe TanStack Query options factories like `convexQuery` for use with `useQuery`, `useSuspenseQuery` etc.
- Live-updating queries: updates come in over a WebSocket instead of requiring polling
- Automatic query invalidation: when a mutation succeeds all queries it affects update automatically
- Selective optimistic update rollback: when a mutation succeeds only its update will be rolled back, with other optimistic updates reapplied
- Consistent snapshot reads of database state: /messages will never return a foreign key for a /user that doesn't exist until the next fetch
