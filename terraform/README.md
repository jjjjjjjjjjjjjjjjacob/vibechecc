# vibechecc Infrastructure

> **Note:** For monorepo setup, scripts, and app details, see the [root README.md](../README.md).

This directory contains the Terraform configuration for the vibechecc application.

## Overview

Infrastructure is managed by Terraform and deployed to Cloudflare. Key resources:

- Cloudflare Workers (frontend hosting, API routing)
- Cloudflare R2 (Terraform state storage)
- Convex (backend, database)
- AWS Secrets Manager (if needed)

## Architecture

- **Frontend**: TanStack Start app deployed as Cloudflare Workers
- **Backend**: Convex for real-time DB and serverless functions
- **CDN**: Cloudflare global network
- **DNS**: Cloudflare DNS

## Environments

- `production`: vibechecc.io
- `development`: dev.vibechecc.io
- `ephemeral`: pr-{number}.vibechecc.io (PR previews)

---

## Local Development & Usage

To manage infrastructure locally, follow these steps:

### 1. Install direnv (if not already)

```bash
brew install direnv # macOS
# or see https://direnv.net/docs/installation.html for other OS
```

### 2. Allow the .envrc

```bash
cd terraform
# Review the .envrc file, then allow it:
direnv allow
```

This will export all required variables for Terraform, including Cloudflare and R2 credentials.

### 3. Generate backend.tfvars

Before running `terraform init`, generate the backend config:

```bash
chmod +x generate-backend-config.sh
./generate-backend-config.sh
```

This creates `backend.tfvars` with the correct R2 bucket and credentials for remote state.

### 4. Select/Create a Workspace

Terraform uses workspaces to isolate environments:

- `production` → main site
- `development` → dev site
- `pr-<number>` → ephemeral/PR preview

To select or create a workspace:

```bash
terraform workspace select <workspace> || terraform workspace new <workspace>
```

For ephemeral/PR environments, set `TF_VAR_environment=ephemeral` and `TF_VAR_pr_number=<pr_number>` in your `.envrc`.

### 5. Usual Terraform Workflow

```bash
terraform init -backend-config=backend.tfvars
terraform plan
terraform apply
```

## CI/CD

- Managed by GitHub Actions (see `.github/workflows/`)
- Workflows: static checks, terraform plan/apply, deploy-convex, deploy-cloudflare, PR ephemeral envs

## Infrastructure Management

### Monitoring

- Cloudflare: traffic, security, performance analytics
- Convex: function/database monitoring
- Workers: request/error metrics
- Dashboards: Cloudflare, Convex
- Alerts for critical issues

### Optimization

- Cost: Cloudflare free tier, efficient resource allocation
- Performance: CDN, edge compute, optimized Workers

### Security

- Least privilege, encryption at rest/in transit
- Cloudflare security features
- Secrets via Workers env vars
- Auditing and compliance

### Testing

- `terraform validate`, `tflint` for static checks
- PR ephemeral envs for end-to-end testing
- Manual approval for production applies

---

For monorepo-wide build, deploy, and environment setup, see the [root README.md](../README.md).
