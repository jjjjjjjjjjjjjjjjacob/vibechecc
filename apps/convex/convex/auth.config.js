/**
 * Authentication configuration consumed by Convex's backend.
 * Each entry in `providers` tells Convex which external identity
 * providers it should trust when validating requests.
 */
export default {
  // List of authentication providers accepted by Convex
  providers: [
    {
      // Domain from Clerk that issues session tokens for the frontend
      domain: process.env.CLERK_FRONTEND_API_URL,
      // Identifier configured in Clerk that matches this Convex deployment
      applicationID: 'convex',
    },
  ],
};
