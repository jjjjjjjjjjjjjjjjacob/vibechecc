# Dependency Management Guide

This guide provides an overview of the key dependencies in the VibeChecc application, with a focus on the integration between Clerk and Convex.

## Core Dependencies

*   **[Clerk](https://clerk.com/):** Used for user authentication and management.
*   **[Convex](https://www.convex.dev/):** The backend platform, providing the database and serverless functions.
*   **[TanStack Start](https://tanstack.com/start/v1):** The full-stack React framework.

## Clerk & Convex Integration

The integration between Clerk and Convex is essential for ensuring that user data is synchronized between the two services.

### Bidirectional Sync

A bidirectional sync is achieved using Clerk webhooks and Convex HTTP actions.

1.  **Clerk to Convex:** When a user signs up or updates their profile in Clerk, Clerk sends a webhook to a Convex HTTP action. This action then creates or updates the user's record in the Convex database.
2.  **Convex to Clerk:** While direct updates from Convex to Clerk are less common, any user data that needs to be reflected in Clerk can be updated via the Clerk API, triggered from a Convex action.

### Webhook Setup

The Clerk webhook is configured in the Clerk dashboard. The endpoint for the webhook is `/webhooks/clerk`. In the local development environment, this endpoint is exposed to the internet using ngrok. In the cloud environments, the endpoint is publicly accessible.

The webhook is secured using a secret, which is stored as the `CLERK_WEBHOOK_SECRET` environment variable.

### Managing Secrets

The secrets for Clerk and Convex are managed using environment variables. For local development, these are stored in the `.env.local` file. For the cloud environments, they are configured as secrets in the Cloudflare dashboard and the GitHub repository settings.

## Updating Dependencies

To update the dependencies, you can use the `bun update` command. It is recommended to update dependencies one at a time and test thoroughly to ensure that the application continues to function as expected.

For major version updates, refer to the official documentation for each dependency to understand the breaking changes and the required migration steps.