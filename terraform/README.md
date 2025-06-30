# VibeChecc Infrastructure

This directory contains the Terraform configuration for the VibeChecc application.

## Overview

The infrastructure is managed by Terraform and is deployed to AWS. The following resources are used:
- AWS Amplify for frontend hosting
- Convex for backend and database
- AWS S3 for Terraform state storage
- AWS DynamoDB for Terraform state locking
- AWS Secrets Manager for secret storage

## Environments

There are three environments:
- `production`: The live environment
- `development`: The development environment
- `ephemeral`: Temporary environments for pull requests

## CI/CD

The CI/CD pipeline is managed by GitHub Actions. The following workflows are used:
- `static-checks.yml`: Performs static analysis on the codebase
- `terraform-plan.yml`: Creates a Terraform plan for pull requests
- `terraform-apply.yml`: Applies the Terraform configuration to the environments
- `deploy-convex.yml`: Deploys the Convex backend
- `deploy-amplify.yml`: Deploys the Amplify frontend
- `pr-environment.yml`: Creates an ephemeral environment for pull requests
- `pr-cleanup.yml`: Cleans up the ephemeral environment when the pull request is closed
