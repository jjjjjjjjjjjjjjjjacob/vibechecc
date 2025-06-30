# Local Development Guide

This guide provides instructions for setting up and running the VibeChecc application in a local development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Bun](https://bun.sh/)
*   [ngrok](https://ngrok.com/download)
*   [Convex CLI](https://docs.convex.dev/getting-started/installation)

## Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-repo/vibechecc.git
    cd vibechecc
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add the following environment variables. You can get these values from the Convex and Clerk dashboards.

    ```
    # Convex
    CONVEX_URL=your_convex_url
    VITE_CONVEX_URL=your_convex_url

    # Clerk
    CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    CLERK_SECRET_KEY=your_clerk_secret_key
    VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

    # Clerk Webhook
    CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
    ```

4.  **Set up ngrok:**

    To allow Clerk webhooks to reach your local development server, you need to expose your local server to the internet using ngrok.

    Authenticate ngrok (you only need to do this once):
    ```bash
    ngrok config add-authtoken <your_auth_token>
    ```

## Running the Application

To start the development server, run the following command:

```bash
bun run dev
```

This command will:

1.  Start the Convex development server.
2.  Seed the database with initial data.
3.  Start the Vite development server for the frontend application on port `3030`.
4.  Start an ngrok tunnel to expose the Clerk webhook endpoint (`:3211`) to the internet.

Once the `dev` script is running, you can access the application at `http://localhost:3030`.

## Webhooks

The application uses Clerk webhooks to sync user data with the Convex database. The `bun run dev` command automatically starts an ngrok tunnel and a webhook listener.

You will need to configure the webhook endpoint in your Clerk dashboard to point to the ngrok URL provided in the terminal output. The webhook endpoint is `/webhooks/clerk`.

## Troubleshooting

*   **`ngrok` command not found:** Ensure that you have installed ngrok and that it is available in your system's `PATH`.
*   **Clerk webhooks not working:** Double-check that the ngrok tunnel is running and that the webhook URL in your Clerk dashboard is correctly configured.
*   **Convex errors:** Make sure your `CONVEX_URL` and `VITE_CONVEX_URL` environment variables are correctly set in your `.env.local` file.