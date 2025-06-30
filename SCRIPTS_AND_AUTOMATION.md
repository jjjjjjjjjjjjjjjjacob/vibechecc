# Scripts and Automation Guide

This document provides an overview of the scripts and automation available in the VibeChecc project. These tools are designed to streamline development, testing, and deployment processes.

## `package.json` Scripts

All project scripts are defined in the `package.json` file and are run using `bun run <script-name>`.

### Core Scripts

-   **`dev`**: Starts the local development server with hot-reloading.
    -   **Usage**: `bun run dev`
    -   **What it does**: Runs the Vite development server, allowing you to work on the frontend with live updates.

-   **`build`**: Builds the application for production.
    -   **Usage**: `bun run build`
    -   **What it does**: Compiles the frontend and server code into an optimized format for deployment.

-   **`test`**: Runs the test suite using Vitest.
    -   **Usage**: `bun run test`
    -   **What it does**: Executes all `.test.ts` and `.test.tsx` files in the project.

-   **`lint`**: Lints the codebase using ESLint.
    -   **Usage**: `bun run lint`
    -   **What it does**: Checks the code for style and syntax errors.

-   **`format`**: Formats the code using Prettier.
    -   **Usage**: `bun run format`
    -   **What it does**: Automatically formats all files in the project to maintain a consistent code style.

### Quality Assurance Scripts

-   **`quality`**: Runs all quality checks simultaneously.
    -   **Usage**: `bun run quality`
    -   **What it does**: Executes `lint`, `test`, and `typecheck` in parallel.

-   **`quality:fix`**: Fixes all fixable quality issues.
    -   **Usage**: `bun run quality:fix`
    -   **What it does**: Runs `lint --fix` and `format`.

### Database Scripts

-   **`seed`**: Seeds the Convex database with initial data.
    -   **Usage**: `bun run seed`
    -   **What it does**: Executes the `convex/seed.ts` script to populate the database. This is useful for setting up a fresh development environment.

## Adding New Scripts

To add a new script to the project:

1.  Open the `package.json` file.
2.  Add a new entry to the `"scripts"` object.
3.  Document the new script in this file, explaining what it does and how to use it.

## CI/CD Automation

Our project uses GitHub Actions for continuous integration and deployment. These workflows automate many of the tasks that would otherwise need to be done manually.

-   **Static Checks**: Every push to a pull request triggers a workflow that runs `lint`, `test`, and `typecheck`.
-   **Deployments**: Merging a pull request triggers a deployment to the appropriate environment.

For more details on our CI/CD pipeline, refer to the `CLOUD_DEPLOYMENT.md` guide.