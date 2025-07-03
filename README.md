# vibechecc

vibechecc is a social application where users can:

- Share "vibes" (life experiences, thoughts, situations) with the community
- Rate and react to other users' vibes with emojis and star ratings
- Discover trending vibes and connect with like-minded people
- Manage their profile and track their social interactions

## Tech Stack

### Frontend

- **Framework**: [TanStack Start](https://tanstack.com/start) - Full-stack React framework
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) - Radix UI + Tailwind CSS
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- **State Management**: [TanStack Query](https://tanstack.com/query) - Server state management
- **Routing**: [TanStack Router](https://tanstack.com/router) - Type-safe routing
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful icons
- **Animations**: [Framer Motion](https://framer.com/motion/) - Animation library

### Backend

- **Database**: [Convex](https://convex.dev/) - Real-time backend with TypeScript
- **Authentication**: [Clerk](https://clerk.com/) - Complete authentication solution
- **Real-time**: WebSocket connections via Convex for live updates

### Development Tools

- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager
- **Build Tool**: [Vinxi](https://vinxi.vercel.app/) - Full-stack build system
- **Testing**: [Vitest](https://vitest.dev/) - Fast unit testing framework
- **Type Checking**: [TypeScript](https://typescriptlang.org/) - Static type checking
- **Linting**: [ESLint](https://eslint.org/) - Code linting
- **Formatting**: [Prettier](https://prettier.io/) - Code formatting
- **Tunneling**: [ngrok](https://ngrok.com/) - Secure tunneling for webhooks

## Project Structure

A high-level overview of our project structure:

```
vibechecc/
├── convex/                 # Backend Convex functions (see convex/README.md)
├── public/                 # Static assets
├── src/                    # Frontend source code (see src/README.md)
├── scripts/                # Utility scripts
├── terraform/              # Terraform infrastructure as code (see terraform/README.md)
├── .github/                # GitHub Actions workflows
├── .cursor/                # Cursor IDE configuration
└── ...
```

For more detailed information on specific parts of the codebase, please refer to their respective READMEs:

- **[Frontend Documentation](./src/README.md)**
- **[Backend Documentation](./convex/README.md)**
- **[Infrastructure Documentation](./terraform/README.md)**

---

## Getting Started: Local Development

This guide provides instructions for setting up and running the vibechecc application on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

- **[Bun](https://bun.sh/)**: The JavaScript runtime and toolkit used for this project.
- **[Git](https://git-scm.com/)**: For version control.
- **[ngrok](https://ngrok.com/download)**: To expose your local server to the internet for Clerk webhooks.
- **A code editor**: We recommend [Visual Studio Code](https://code.visualstudio.com/).

### 1. Clone the Repository

First, clone the project repository to your local machine:

```bash
git clone https://github.com/your-username/vibechecc.git
cd vibechecc
```

### 2. Install Dependencies

Install the project dependencies using Bun:

```bash
bun install
```

### 3. Set Up Environment Variables

The application requires several environment variables to run correctly. These variables are used to connect to services like Convex and Clerk.

1.  **Create a `.env.local` file** in the root of the project by copying the example file:

    ```bash
    cp .env.local.example .env.local
    ```

2.  **Populate the variables**: Open `.env.local` and fill in the values for the following variables:

    - `VITE_CONVEX_URL`: The URL of your Convex deployment. You can get this from the [Convex dashboard](https://dashboard.convex.dev/).
    - `CONVEX_DEPLOYMENT`: The deployment name from your Convex project settings.
    - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key, found in the Clerk dashboard.
    - `CLERK_SECRET_KEY`: Your Clerk secret key, also from the Clerk dashboard.
    - `CLERK_WEBHOOK_SECRET`: The secret for your Clerk webhook endpoint.
    - `NGROK_AUTHTOKEN`: Your ngrok authentication token.

### 4. Run the Development Environment

The project is configured to run all necessary services for local development with a single command. This includes the frontend server, the Convex backend, database seeding, and the `ngrok` tunnel for Clerk webhooks.

1.  **Configure Clerk Webhook (One-Time Setup)**

    Before running the server for the first time, you need to configure a webhook in your Clerk dashboard to point to the local `ngrok` tunnel. The project uses a pre-configured `ngrok` domain.

    - Go to your Clerk dashboard and navigate to the "Webhooks" section.
    - Create a new endpoint with the URL: `https://teal-trusting-unicorn.ngrok-free.app/api/clerk`.
    - Select the events for `user.created`, `user.updated`, and `user.deleted`.
    - Save the endpoint.

2.  **Start the Services**

    In your terminal, run the main development script:

    ```bash
    bun run dev
    ```

    This command uses `concurrently` to:

    - Start the **Convex backend** and automatically **seed the database** (`dev:db`).
    - Start the **frontend development server** on `http://localhost:3030` (`dev:web`).
    - Start the **`ngrok` tunnel** (`ngrok`).

    You can now access the application in your browser at `http://localhost:3030`.

### Troubleshooting

- **"My Clerk webhooks aren't working."**:

  - Ensure the `bun run dev` command is running and the `ngrok` service started without errors.
  - Double-check that the webhook URL in your Clerk dashboard is set to `https://teal-trusting-unicorn.ngrok-free.app/api/clerk`.
  - Verify that your `CLERK_WEBHOOK_SECRET` is correctly set in `.env.local`.

- **"I'm getting Convex errors."**:

  - Make sure the `bun run dev` command is running and check its output for any errors from the Convex service.
  - Check that your `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT` variables are correct in `.env.local`.

- **"Bun is giving me issues."**:
  - Ensure you have the latest version of Bun installed (`bun upgrade`).
  - Try deleting `node_modules` and `bun.lockb` and running `bun install` again.

---

## Cloud Deployment

This section outlines the process for deploying the vibechecc application to our cloud environments: **Production**, **Development**, and **Ephemeral** (for pull requests). Our infrastructure is managed with Terraform, and deployments are automated via GitHub Actions.

### Environments

- **Production**: The live environment accessible to all users. Deployed from the `main` branch.
- **Development**: A staging environment for testing new features. Deployed from the `develop` branch.
- **Ephemeral**: Temporary environments created for each pull request to allow for isolated testing and review.

### CI/CD Pipeline Overview

Our deployment process is automated through a series of GitHub Actions workflows that handle infrastructure and application deployments.

- **Infrastructure (Terraform)**: `terraform-plan.yml` and `terraform-apply.yml` manage infrastructure changes. These workflows automatically run `bun run build` before Terraform operations to ensure the latest application code is deployed.
- **Application (Cloudflare Workers & Convex)**: `deploy-cloudflare.yml` and `deploy-convex.yml` handle application deployments.
- **Ephemeral Environments**: `pr-environment.yml` and `pr-cleanup.yml` manage temporary environments for pull requests.

### Manual Deployment and Rollbacks

- Workflows can be triggered manually from the "Actions" tab in GitHub.
- Production deployments require manual approval.
- Rollbacks can be performed through the Cloudflare and Convex dashboards.

---

## Terraform State Management

Our infrastructure is managed using Terraform, which requires careful coordination between the application build process and infrastructure deployment.

### Prerequisites for Terraform Operations

**⚠️ Important: You must build the frontend before applying any Terraform changes.**

Before running any `terraform plan` or `terraform apply` commands, ensure the application is built:

```bash
# Run from the project root
bun run build
```

This creates the necessary build artifacts at `.output/server/index.mjs` that Terraform references for the Cloudflare Worker deployment.

### Terraform Workflow

1. **Build the Application**:
   ```bash
   bun run build
   ```

2. **Navigate to Terraform Directory**:
   ```bash
   cd terraform
   ```

3. **Initialize Terraform** (first time only):
   ```bash
   terraform init
   ```

4. **Plan Changes**:
   ```bash
   terraform plan
   ```

5. **Apply Changes**:
   ```bash
   terraform apply
   ```

### State Management

- **Remote State**: Our Terraform state is stored remotely (configured in `terraform/backend.tf`)
- **Environment Isolation**: Each environment (production, development, ephemeral) has its own state file
- **Build Dependency**: The Cloudflare Worker script references the built application at `.output/server/index.mjs`

### Common Issues

- **File Not Found Error**: If you see errors about `.output/server/index.mjs` not being found, run `bun run build` first
- **Stale Build**: Always rebuild before infrastructure changes to ensure the latest code is deployed
- **State Lock**: If Terraform state is locked, check if another deployment is in progress

---

## Dependency Management

We use **Bun** for JavaScript dependencies and manage the integration between **Clerk** and **Convex**.

- User data is synced between Clerk and Convex via webhooks.
- Environment variables for Clerk and Convex are stored in `.env.local` for local development and managed as secrets in GitHub Actions for cloud environments.
- Use `bun add <package-name>` and `bun update` to manage dependencies.
- Terraform providers are version-pinned in `terraform/versions.tf`.

---

## Scripts and Automation

All project scripts are defined in `package.json` and run with `bun run <script-name>`.

- **`dev`**: Starts the local development server.
- **`build`**: Builds the application for production.
- **`test`**: Runs the test suite.
- **`lint`**: Lints the codebase.
- **`format`**: Formats the code.
- **`quality`**: Runs all quality checks.
- **`seed`**: Seeds the Convex database with initial data.

Our CI/CD pipeline in GitHub Actions automates static checks and deployments.

---

## Contributing

This document provides guidelines for contributing to the vibechecc application.

### Adding New Convex Queries and Mutations

When adding new Convex queries and mutations, please follow these guidelines:

- Create a new file in the `convex/` directory for each new feature.
- Use the `query` and `mutation` functions from `@convex-dev/server` to define your queries and mutations.
- Use the `v` object from `@convex-dev/values` to define the validation for your query and mutation arguments.
- Use the `internal` mutations/queries for sensitive operations and only expose them via actions where necessary.

### General Guidelines

1. Follow the existing code style and patterns.
2. Run quality checks before submitting: `bun run quality`.
3. Write tests for new functionality.
4. Update documentation as needed.

---

## License

[Add your license information here]
