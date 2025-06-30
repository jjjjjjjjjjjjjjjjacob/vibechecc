# Dependency Management Guide

This guide explains how we manage dependencies in the VibeChecc project, with a focus on the integration between **Clerk** for authentication and **Convex** for the backend.

## Core Technologies

-   **Runtime**: [Bun](https://bun.sh/) is our primary JavaScript runtime and package manager.
-   **Authentication**: [Clerk](https://clerk.com/) provides user authentication and management.
-   **Backend**: [Convex](https://convex.dev/) is our real-time backend and database.

## Clerk & Convex Integration

We have a bidirectional synchronization mechanism between Clerk and Convex to ensure that user data is consistent across both services.

### How It Works

1.  **User Sign-Up**: When a new user signs up with Clerk, a new user record is created in our Convex database.
2.  **Webhook Sync**: Clerk is configured to send webhooks to our Convex backend on user-related events (`user.created`, `user.updated`, `user.deleted`).
3.  **Convex Functions**: Our Convex backend has an HTTP endpoint that listens for these webhooks and processes them to keep our user data in sync.

### Webhook Setup

-   **Endpoint**: The webhook endpoint is defined in `convex/http.ts`.
-   **Local Development**: For local development, we use `ngrok` to expose our local server to the internet so Clerk can send webhooks to it. See the `LOCAL_DEVELOPMENT.md` guide for setup instructions.
-   **Production**: In production, the webhook points to our deployed Convex HTTP endpoint.

## Managing Secrets and Environment Variables

Both Clerk and Convex require API keys and other secrets to function. These are managed through environment variables.

-   **Local**: In local development, these are stored in a `.env.local` file.
-   **Cloud**: In our cloud environments, these are managed as secrets in GitHub Actions and passed to Terraform and Cloudflare Workers at build time.

**Required Variables**:

-   `VITE_CONVEX_URL`
-   `CONVEX_DEPLOYMENT`
-   `VITE_CLERK_PUBLISHABLE_KEY`
-   `CLERK_SECRET_KEY`
-   `CLERK_WEBHOOK_SECRET`

Refer to `LOCAL_DEVELOPMENT.md` for details on how to obtain these values.

## Updating Dependencies

To keep our application secure and up-to-date, it's important to regularly update our dependencies.

### Bun

Use Bun to manage all JavaScript dependencies:

-   **To add a new dependency**:
    ```bash
    bun add <package-name>
    ```

-   **To update all dependencies**:
    ```bash
    bun update
    ```

-   **To check for outdated dependencies**:
    ```bash
    bun pm outdated
    ```

### Terraform

Our Terraform modules and providers are version-pinned in `terraform/versions.tf`. To update them:

1.  Change the version constraint in the `versions.tf` file.
2.  Run `terraform init -upgrade` to update the providers.

### Testing after Updates

After updating any dependencies, it is crucial to run all tests to ensure that the changes have not introduced any regressions:

```bash
bun test
```

For infrastructure changes, a `terraform plan` should be generated and reviewed before applying.
