# Cloud Deployment Guide

This guide explains the cloud deployment process for the VibeChecc application.

## Environments

The application is deployed to three distinct environments:

*   **Production:** The live environment, accessible to all users.
*   **Development:** A staging environment for testing new features before they are released to production.
*   **Ephemeral:** A temporary environment created for each pull request to test changes in isolation.

## CI/CD Pipeline

The CI/CD pipeline is managed by GitHub Actions. The workflows are defined in the `.github/workflows` directory.

### Infrastructure (Terraform)

The cloud infrastructure is managed using Terraform. The Terraform workflows are responsible for creating, updating, and destroying the cloud resources required by the application.

*   **`terraform-plan.yml`:** This workflow runs on every pull request and generates a Terraform plan to show the infrastructure changes that will be applied if the PR is merged.
*   **`terraform-apply.yml`:** This workflow runs when a pull request is merged into the `main` or `develop` branch. It applies the Terraform plan to the corresponding environment.

### Application (Cloudflare & Convex)

The application is deployed to Cloudflare Workers and Convex.

*   **`deploy-cloudflare.yml`:** This workflow deploys the frontend application to Cloudflare Workers when a pull request is merged into the `main` or `develop` branch.
*   **`deploy-convex.yml`:** This workflow deploys the backend functions to Convex when a pull request is merged into the `main` or `develop` branch.
*   **`pr-environment.yml`:** This workflow creates an ephemeral environment for each pull request. It runs both the Terraform and application deployment workflows to create a fully functional, isolated environment for testing. When the PR is closed, this workflow automatically destroys the ephemeral environment.

## Manual Deployments

While the CI/CD pipeline is fully automated, you can manually trigger a deployment by re-running a workflow in the GitHub Actions tab of the repository.

## Rollbacks

To roll back a deployment, you can revert the merge commit that triggered the deployment. This will trigger the CI/CD pipeline to redeploy the previous version of the application.