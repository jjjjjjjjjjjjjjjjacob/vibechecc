# CI/CD Rules

## Pipeline Rules

### GitHub Actions Architecture

- **MUST** use reusable workflows for common operations (static-checks, deploy, release)
- **MUST** use workflow_call for reusable workflows with proper input validation
- **SHOULD** use matrix strategies sparingly - prefer explicit job definitions for clarity
- **MUST** define clear job dependencies using `needs` to control execution order
- **SHOULD** use descriptive job and step names for easier debugging

### Workflow Structure Standards

- **MUST** follow this job dependency pattern:
  ```yaml
  static-checks -> deploy-terraform -> deploy-convex -> deploy-cloudflare
  ```
- **MUST** use ubuntu-latest for all jobs unless platform-specific requirements exist
- **SHOULD** set appropriate timeouts for long-running operations
- **MUST** use proper permissions declarations (minimal required permissions)

### Pipeline Triggers

- **MUST** use appropriate trigger events:
  - `pull_request` for validation workflows
  - `push` to main/dev for deployment workflows
  - `workflow_call` for reusable components
  - Manual `workflow_dispatch` for admin operations
- **SHOULD** use path filtering to optimize pipeline execution
- **MUST NOT** trigger deployments on draft pull requests

### Error Handling in Pipelines

- **MUST** use `set -e` in shell scripts for proper error propagation
- **SHOULD** provide descriptive error messages with context
- **MUST** validate prerequisites before executing operations
- **SHOULD** implement retry logic for transient failures (network, API rate limits)

## Environment Management Rules

### Environment Strategy

- **MUST** use these environment tiers:
  - `production` - main branch, stable releases
  - `development` - dev branch, continuous deployment
  - `ephemeral` - PR-based, temporary environments
- **MUST** use GitHub environments for access control and approval gates
- **SHOULD** use consistent naming: `main` env for prod, `dev` env for development

### Environment Variables and Secrets

- **MUST** store sensitive data in GitHub Secrets, not repository variables
- **MUST** use repository variables for non-sensitive configuration
- **SHOULD** prefix environment variables consistently:
  - `VITE_` for frontend build-time variables
  - `CLOUDFLARE_` for Cloudflare API credentials
  - `CLERK_` for authentication service secrets
- **MUST** validate required secrets exist before usage:
  ```yaml
  - name: Validate secrets
    run: |
      if [ -z "${{ secrets.REQUIRED_SECRET }}" ]; then
        echo "ERROR: REQUIRED_SECRET is missing"
        exit 1
      fi
  ```

### Ephemeral Environment Rules

- **MUST** create ephemeral environments for each pull request
- **MUST** use PR number in environment naming: `pr-123`
- **MUST** destroy ephemeral environments when PRs are closed/merged
- **SHOULD** limit ephemeral environment lifetime (auto-cleanup after inactivity)
- **MUST** isolate ephemeral environments (separate databases, domains)

## Deployment Rules

### Build Process Requirements

- **MUST** use Bun for all package management and execution
- **MUST** use frozen lockfile for reproducible builds: `bun install --frozen-lockfile`
- **MUST** leverage Nx caching with proper cache keys
- **SHOULD** use parallel builds where safe: `--parallel=true`
- **MUST** validate build outputs exist before deployment

### Deployment Strategy

- **MUST** follow this deployment sequence:
  1. Static checks (lint, test, typecheck)
  2. Build applications
  3. Deploy infrastructure (Terraform)
  4. Deploy backend (Convex)
  5. Deploy frontend (Cloudflare Workers)
- **MUST** use environment-specific configurations
- **SHOULD** implement blue-green deployment for production
- **MUST** validate deployments after completion

### Caching Strategy

- **MUST** implement multi-layer caching:

  ```yaml
  # Bun dependency cache
  - uses: actions/cache@v4
    with:
      path: ~/.bun/install/cache
      key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lock') }}

  # Nx computation cache
  - uses: actions/cache@v4
    with:
      path: .nx/cache
      key: ${{ runner.os }}-nx-${{ github.sha }}
      restore-keys: ${{ runner.os }}-nx-

  # Terraform plugin cache
  - uses: actions/cache@v4
    with:
      path: ~/.terraform.d/plugin-cache
      key: ${{ runner.os }}-terraform-${{ hashFiles('**/*.tf') }}
  ```

- **SHOULD** use cache versioning for breaking changes
- **MUST** clear cache when dependencies change significantly

### Rollback Procedures

- **MUST** implement automated rollback triggers for critical failures
- **SHOULD** maintain rollback capability for at least 3 previous versions
- **MUST** document rollback procedures for manual intervention
- **SHOULD** test rollback procedures regularly

## Security Rules

### Secrets Management

- **MUST** use GitHub Secrets for sensitive data
- **MUST** rotate secrets regularly (quarterly minimum)
- **MUST NOT** log or expose secrets in workflow output
- **SHOULD** use separate secrets for different environments
- **MUST** audit secret access regularly

### OIDC Integration

- **MUST** use GitHub OIDC for AWS/cloud provider authentication when possible
- **SHOULD** avoid long-lived credentials in favor of OIDC tokens
- **MUST** configure proper trust policies for OIDC roles
- **SHOULD** use minimal required permissions for OIDC roles

### Access Controls

- **MUST** use environment protection rules for production deployments
- **SHOULD** require code review approval for production deployments
- **MUST** restrict who can manage GitHub environments and secrets
- **SHOULD** use branch protection rules with required status checks

### Security Scanning

- **SHOULD** implement automated security scanning in pipelines
- **MUST** scan for secrets in code before deployment
- **SHOULD** monitor dependencies for known vulnerabilities
- **MUST** fail builds on critical security issues

## Quality Gates Rules

### Pre-deployment Validation

- **MUST** require all quality checks to pass before deployment:
  - TypeScript compilation (`bun run typecheck`)
  - Linting (`bun run lint`)
  - Testing (`bun run test`)
  - Format validation (`bun run format:check`)
- **MUST** require successful build before deployment attempt
- **SHOULD** run security scans and dependency audits

### Testing Requirements

- **MUST** achieve minimum test coverage thresholds
- **MUST** run tests in parallel for faster feedback
- **SHOULD** fail fast on test failures to save resources
- **MUST** use proper test isolation (no shared state)
- **SHOULD** include integration tests for critical paths

### Code Quality Standards

- **MUST** enforce consistent code formatting (Prettier)
- **MUST** pass all linting rules (ESLint)
- **MUST** maintain TypeScript strict mode compliance
- **SHOULD** monitor code quality metrics over time

### Approval Processes

- **MUST** require manual approval for production deployments
- **SHOULD** require technical lead approval for infrastructure changes
- **MUST** use automated approval for development environment deployments
- **SHOULD** implement approval bypasses for emergency deployments

## Infrastructure Rules

### Terraform Management

- **MUST** use Terraform for all infrastructure as code
- **MUST** use remote state backend (Cloudflare R2)
- **MUST** use workspace isolation for different environments
- **SHOULD** validate Terraform plans before apply in production

### Terraform Workflow

- **MUST** follow this Terraform sequence:
  1. Generate backend configuration
  2. Initialize with backend config
  3. Create or select workspace
  4. Import existing resources (if needed)
  5. Plan changes (implicit in apply)
  6. Apply changes with auto-approve (in automation)

### State Management

- **MUST** use remote state for team collaboration
- **MUST** lock state during operations
- **SHOULD** backup state regularly
- **MUST** handle state conflicts gracefully

### Resource Management

- **MUST** tag all cloud resources with environment and project identifiers
- **SHOULD** implement cost monitoring and alerting
- **MUST** clean up unused resources (especially ephemeral environments)
- **SHOULD** use least-privilege access for all resources

### AWS/Cloudflare Integration

- **MUST** use Cloudflare R2 for Terraform state storage
- **MUST** configure proper IAM roles and policies
- **SHOULD** use Cloudflare Workers for frontend deployment
- **MUST** implement proper DNS management through Cloudflare

## Release Management Rules

### Version Management

- **MUST** use semantic versioning (semver) with conventional commits
- **MUST** use Nx release for automated version management
- **SHOULD** separate stable releases (main) from prereleases (dev)
- **MUST** generate changelogs automatically from commit history

### Release Process

- **MUST** follow this release sequence:
  1. Run Nx release (version bump, changelog)
  2. Commit and tag changes
  3. Push changes with tags
  4. Create GitHub release with generated notes
  5. Monitor deployment status
- **MUST** use GitHub App tokens for release automation to bypass branch protection
- **SHOULD** implement release approval for production releases

### Conventional Commits

- **MUST** use conventional commit format for automated version detection
- **MUST** use these commit types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- **SHOULD** include breaking change indicators (`BREAKING CHANGE:` or `!`)
- **MUST** skip CI for release commits: `[skip ci]`

### Release Validation

- **MUST** validate tag existence before creating GitHub releases
- **MUST** check for duplicate releases before creation
- **SHOULD** verify deployment success post-release
- **MUST** implement release rollback procedures

### Release Notes Generation

- **MUST** use GitHub CLI for consistent release note generation
- **SHOULD** include comparison to previous release
- **MUST** mark prereleases appropriately
- **SHOULD** include deployment and breaking change information

## Monitoring and Alerting Rules

### Pipeline Monitoring

- **SHOULD** monitor pipeline success/failure rates
- **SHOULD** track deployment frequency and lead time
- **MUST** alert on repeated failures
- **SHOULD** monitor pipeline execution duration

### Deployment Monitoring

- **MUST** implement post-deployment health checks
- **SHOULD** monitor application metrics after deployment
- **MUST** alert on deployment failures
- **SHOULD** track deployment rollback frequency

### Infrastructure Monitoring

- **SHOULD** monitor cloud resource usage and costs
- **MUST** alert on security policy violations
- **SHOULD** track infrastructure drift from Terraform state
- **MUST** monitor certificate expiration and DNS health

### Quality Metrics

- **SHOULD** track test coverage trends
- **SHOULD** monitor code quality metrics
- **MUST** alert on security vulnerability discoveries
- **SHOULD** track technical debt accumulation

## Performance Optimization Rules

### Pipeline Performance

- **SHOULD** optimize cache hit rates for faster builds
- **MUST** use parallel execution where safe
- **SHOULD** minimize redundant operations across jobs
- **SHOULD** profile pipeline execution to identify bottlenecks

### Build Optimization

- **SHOULD** use incremental builds where possible
- **MUST** leverage Nx task dependencies for efficient execution
- **SHOULD** optimize Docker image layers (if using containers)
- **SHOULD** minimize build artifact size

### Resource Optimization

- **SHOULD** use appropriate runner sizes for workload requirements
- **MUST** clean up temporary resources after use
- **SHOULD** implement resource pooling for expensive operations
- **SHOULD** monitor resource utilization and optimize allocation

## Troubleshooting and Debugging Rules

### Common Pipeline Issues

- **Problem**: Release workflow conflicts
  **Solution**: Ensure only GitHub CLI creates releases, disable Nx release creation
- **Problem**: Cache misses causing slow builds
  **Solution**: Verify cache key patterns, check for cache invalidation issues
- **Problem**: Deployment failures due to state locks
  **Solution**: Implement proper Terraform state management and cleanup

### Debugging Procedures

- **MUST** provide comprehensive logging with clear status indicators
- **SHOULD** use emoji indicators for easy log scanning (✅❌⚠️🔄)
- **MUST** include environment context in debug output
- **SHOULD** implement debug modes for detailed troubleshooting

### Recovery Procedures

- **MUST** document recovery procedures for common failure scenarios
- **SHOULD** implement automated recovery where safe
- **MUST** maintain emergency contact procedures for critical issues
- **SHOULD** conduct post-incident reviews and documentation updates

### Pipeline Health

- **SHOULD** implement pipeline health checks and monitoring
- **MUST** maintain pipeline documentation and runbooks
- **SHOULD** conduct regular pipeline performance reviews
- **MUST** keep pipeline dependencies updated and secure
