# vibechecc Infrastructure

This directory contains the Terraform configuration for the vibechecc application.

## Overview

The infrastructure is managed by Terraform and deployed to Cloudflare. The following resources are used:

- Cloudflare Workers for frontend hosting and API routing
- Cloudflare R2 for Terraform state storage
- Convex for backend and database (managed service)
- AWS Secrets Manager for secret storage (if needed)

## Architecture

The application uses a modern serverless architecture:

- **Frontend**: TanStack Start application deployed as Cloudflare Workers
- **Backend**: Convex provides real-time database and serverless functions
- **CDN**: Cloudflare's global network for fast content delivery
- **DNS**: Cloudflare DNS management

## Environments

There are three environments:

- `production`: The live environment at `vibechecc.app`
- `development`: The development environment at `dev.vibechecc.app`
- `ephemeral`: Temporary environments for pull requests at `pr-{number}.vibechecc.app`

## CI/CD

The CI/CD pipeline is managed by GitHub Actions with Blacksmith runners for faster execution. The following workflows are used:

- `static-checks.yml`: Performs linting, type-checking, and testing
- `terraform-plan.yml`: Creates a Terraform plan for pull requests
- `terraform-apply.yml`: Applies the Terraform configuration to the environments
- `deploy-convex.yml`: Deploys the Convex backend
- `deploy-cloudflare.yml`: Deploys the frontend to Cloudflare Workers
- `pr-environment.yml`: Creates an ephemeral environment for pull requests
- `pr-cleanup.yml`: Cleans up the ephemeral environment when the pull request is closed

---

## Infrastructure Management

### Monitoring

Our Terraform infrastructure is monitored to ensure the health and performance of our application. We use a combination of Cloudflare-native services and third-party tools to achieve comprehensive observability.

- **Key Monitoring Areas**:
  - **Cloudflare**: Analytics on web traffic, security events, and performance metrics.
  - **Convex**: Monitoring of function execution, database performance, and real-time connections.
  - **Workers**: Request metrics, error rates, and performance monitoring.
- **Dashboards**:
  - **Cloudflare Dashboard**: Provides an overview of website traffic, security threats, and caching performance.
  - **Convex Dashboard**: Offers real-time insights into database queries, function logs, and overall backend health.
- **Alerting**:
  - Alerts are configured to notify the team of critical issues like high error rates, latency spikes, and resource saturation.

### Optimization

We continuously optimize our Terraform-managed infrastructure to improve performance, reduce costs, and enhance scalability.

- **Cost Optimization**: We use Cloudflare's generous free tier and efficient resource allocation to manage costs effectively.
- **Performance Optimization**: We leverage Cloudflare's global CDN, edge computing capabilities, and optimized Workers runtime for enhanced performance.

### Security

Security is a top priority. We follow best practices to ensure our application and data are protected.

- **Principles**: We adhere to the principle of least privilege, and encrypt data at rest and in transit. Network security is managed through Cloudflare's security features.
- **Secret Management**: We use Cloudflare Workers secrets and environment variables for secure configuration management.
- **Auditing and Compliance**: Cloudflare provides comprehensive logging and we conduct regular security scans.

### Testing

We test our Terraform code to ensure it is reliable, secure, and functions as expected.

- **Static Analysis**: We use `terraform validate` and `tflint` for static code checks.
- **Plan and Apply**: We review `terraform plan` outputs before applying changes, with manual approvals for production.
- **End-to-End Testing**: We use ephemeral environments for pull requests to test infrastructure changes end-to-end with our application's test suite.
