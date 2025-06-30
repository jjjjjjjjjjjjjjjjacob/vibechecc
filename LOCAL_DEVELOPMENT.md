# Local Development Guide

This guide provides instructions for setting up and running the VibeChecc application on your local machine. Following these steps will enable you to contribute to the development of the frontend and backend services.

## Prerequisites

Before you begin, ensure you have the following installed:

- **[Bun](https://bun.sh/)**: The JavaScript runtime and toolkit used for this project.
- **[Git](https://git-scm.com/)**: For version control.
- **[ngrok](https://ngrok.com/download)**: To expose your local server to the internet for Clerk webhooks.
- **A code editor**: We recommend [Visual Studio Code](https://code.visualstudio.com/).

## 1. Clone the Repository

First, clone the project repository to your local machine:

```bash
git clone https://github.com/your-username/vibechecc.git
cd vibechecc
```

## 2. Install Dependencies

Install the project dependencies using Bun:

```bash
bun install
```

## 3. Set Up Environment Variables

The application requires several environment variables to run correctly. These variables are used to connect to services like Convex and Clerk.

1.  **Create a `.env.local` file** in the root of the project by copying the example file:

    ```bash
    cp .env.local.example .env.local
    ```

2.  **Populate the variables**: Open `.env.local` and fill in the values for the following variables:

    -   `VITE_CONVEX_URL`: The URL of your Convex deployment. You can get this from the [Convex dashboard](https://dashboard.convex.dev/).
    -   `CONVEX_DEPLOYMENT`: The deployment name from your Convex project settings.
    -   `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key, found in the Clerk dashboard.
    -   `CLERK_SECRET_KEY`: Your Clerk secret key, also from the Clerk dashboard.
    -   `CLERK_WEBHOOK_SECRET`: The secret for your Clerk webhook endpoint.
    -   `NGROK_AUTHTOKEN`: Your ngrok authentication token.

## 4. Configure Convex

Our backend is powered by Convex. To get it running locally, follow these steps:

1.  **Start the Convex development server**:

    ```bash
    npx convex dev
    ```

    This command will watch for changes in the `convex/` directory and automatically update your backend.

2.  **Seed the database** (optional but recommended):

    In a separate terminal, run the seed script to populate your database with initial data:

    ```bash
    bun run seed
    ```

## 5. Set Up Clerk Webhooks with ngrok

Clerk uses webhooks to sync user data with our Convex backend. We'll use ngrok to create a secure tunnel to our local server.

1.  **Start ngrok**:

    ```bash
    ngrok http 3000
    ```

    This will give you a public URL (e.g., `https://random-string.ngrok.io`).

2.  **Configure Clerk Webhook**:
    -   Go to your Clerk dashboard and navigate to the "Webhooks" section.
    -   Create a new endpoint and paste the ngrok URL, appending `/api/clerk`. For example: `https://random-string.ngrok.io/api/clerk`.
    -   Select the events for `user.created`, `user.updated`, and `user.deleted`.
    -   Save the endpoint.

## 6. Run the Development Server

Finally, start the frontend development server:

```bash
bun run dev
```

This will start the application on `http://localhost:3000`. You can now access the application in your browser and start developing.

## Troubleshooting

-   **"My Clerk webhooks aren't working."**:
    -   Ensure your ngrok tunnel is running.
    -   Double-check the webhook URL in your Clerk dashboard.
    -   Verify that your `CLERK_WEBHOOK_SECRET` is correctly set in `.env.local`.

-   **"I'm getting Convex errors."**:
    -   Make sure the Convex dev server is running (`npx convex dev`).
    -   Check that your `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT` variables are correct.

-   **"Bun is giving me issues."**:
    -   Ensure you have the latest version of Bun installed (`bun upgrade`).
    -   Try deleting `node_modules` and `bun.lockb` and running `bun install` again.
