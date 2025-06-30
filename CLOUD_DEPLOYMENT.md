# Cloud Deployment Guide

This document outlines the process for deploying the VibeChecc application to our cloud environments: **Production**, **Development**, and **Ephemeral** (for pull requests). Our infrastructure is managed with Terraform, and deployments are automated via GitHub Actions.

## Environments

-   **Production**: The live environment accessible to all users. Deployed from the `main` branch.
-   **Development**: A staging environment for testing new features. Deployed from the `develop` branch.
-   **Ephemeral**: Temporary environments created for each pull request to allow for isolated testing and review.

## CI/CD Pipeline Overview

Our deployment process is automated through a series of GitHub Actions workflows that handle infrastructure and application deployments.

### 1. Infrastructure (Terraform)

-   **`terraform-plan.yml`**: Runs on every pull request. Generates a Terraform plan to preview infrastructure changes.
-   **`terraform-apply.yml`**: Runs when code is merged into `main` or `develop`. Applies the Terraform changes to the corresponding environment.

### 2. Application (Cloudflare Workers & Convex)

-   **`deploy-cloudflare.yml`**: Deploys the frontend application to Cloudflare Workers.
-   **`deploy-convex.yml`**: Deploys backend functions to Convex.

### 3. Ephemeral Environments

-   **`pr-environment.yml`**: Creates a new, isolated environment when a pull request is opened.
-   **`pr-cleanup.yml`**: Destroys the ephemeral environment when a pull request is closed or merged.

## Manual Deployment Steps

While deployments are largely automated, manual intervention is sometimes necessary.

### Triggering a Manual Deployment

You can manually trigger a deployment workflow from the "Actions" tab in the GitHub repository:

1.  Go to the "Actions" tab.
2.  Select the workflow you want to run (e.g., `deploy-cloudflare`).
3.  Click "Run workflow" and select the appropriate branch.

### Production Deployment Approval

Deployments to the production environment require manual approval to prevent accidental changes:

1.  When a pull request is merged into `main`, the `terraform-apply` workflow will start.
2.  The workflow will pause and wait for an authorized user to approve the deployment.
3.  You can approve the deployment from the "Actions" tab in GitHub.

## Viewing Deployment Logs and Status

-   **GitHub Actions**: All deployment logs are available in the "Actions" tab of the repository. You can view the output of each job to diagnose failures.
-   **Cloudflare Dashboard**: Check the status of your Cloudflare Workers deployments and view logs.
-   **Convex Dashboard**: Monitor your Convex functions and view logs in the Convex dashboard.

## Rolling Back a Deployment

In case of a critical issue, you can roll back to a previous deployment:

-   **Cloudflare Workers**:
    1.  Go to your Cloudflare dashboard and select your Workers project.
    2.  Navigate to the "Deployments" tab.
    3.  Select a previous deployment and click "Rollback to this deployment."

-   **Convex**:
    -   Convex automatically retains previous versions of your functions. You can redeploy an older version from the "Deployments" tab in the Convex dashboard.

## Managing Ephemeral Environments

-   **Creation**: An ephemeral environment is automatically created when you open a pull request. The URL for the environment will be posted as a comment on the PR.
-   **Cleanup**: The environment is automatically destroyed when the PR is merged or closed.
-   **Manual Cleanup**: If an environment is not cleaned up properly, you can manually run the `pr-cleanup` workflow.
