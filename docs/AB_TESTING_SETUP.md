# A/B Testing Setup: vibechecc vs viberatr

## Overview

This repository is configured to support A/B testing between two app name variants:

- **vibechecc** (main branch) - Original name
- **viberatr** (main-alt branch) - Alternative name for testing

Both deployments share the same Convex backend database and functionality, allowing for direct comparison of user engagement metrics between the two brandings.

## Architecture

```
┌─────────────────┐           ┌─────────────────┐
│  vibechecc.com  │           │  viberatr.com   │
│   (main branch) │           │ (main-alt branch)│
└────────┬────────┘           └────────┬────────┘
         │                              │
         │     Cloudflare Workers       │
         │                              │
         └──────────┬───────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   Shared Convex DB   │
         │  (Production Deploy) │
         └──────────────────────┘
```

## Configuration

### Environment Variables

Each deployment uses different branding through environment variables:

**Main Branch (vibechecc):**

```bash
VITE_APP_NAME=vibechecc
VITE_APP_DOMAIN=vibechecc.com
VITE_APP_TWITTER_HANDLE=@vibechecc
```

**Main-Alt Branch (viberatr):**

```bash
VITE_APP_NAME=viberatr
VITE_APP_DOMAIN=viberatr.com
VITE_APP_TWITTER_HANDLE=@viberatr
```

### GitHub Actions Secrets

Both environments share most secrets but use separate GitHub environments:

- `main` environment - for vibechecc
- `main-alt` environment - for viberatr

**Shared Secrets (same values in both environments):**

- `CONVEX_DEPLOY_KEY` - Same deployment key
- `CONVEX_DEPLOYMENT_NAME` - Same production deployment
- `CONVEX_PROJECT_SLUG` - Same Convex project
- `VITE_CONVEX_URL` - Same backend URL
- `CLERK_*` - Same authentication configuration
- `CLOUDFLARE_*` - Same Cloudflare account
- `VITE_POSTHOG_*` - Same analytics (tracks both variants)

## Deployment Process

### Deploying vibechecc

```bash
git checkout main
git push origin main
```

### Deploying viberatr

```bash
git checkout main-alt
git merge main  # Keep code in sync
git push origin main-alt
```

## Tracking Metrics

PostHog analytics will track both variants with the same project ID. You can distinguish between them by:

1. **Domain tracking** - Events will include the source domain
2. **Custom properties** - The app name is included in analytics events
3. **User segments** - Create segments based on the domain/app variant

### Key Metrics to Compare

- User registration rates
- User engagement (vibes created, ratings given)
- Bounce rates
- Session duration
- Return visitor rates
- Social sharing rates

## Maintaining Code Sync

To ensure fair A/B testing, keep both branches in sync:

```bash
# Regular sync from main to main-alt
git checkout main-alt
git merge main
git push origin main-alt
```

Only the app name and branding should differ between deployments.

## Terraform Infrastructure

Both deployments use separate Terraform workspaces:

- `production` workspace - vibechecc infrastructure
- `production-alt` workspace - viberatr infrastructure

This provides separate:

- Cloudflare Workers
- DNS records
- Domain routing

While sharing:

- Convex backend
- Authentication (Clerk)
- Analytics (PostHog)

## Testing Locally

### Test as vibechecc (default)

```bash
bun run dev
```

### Test as viberatr

```bash
VITE_APP_NAME=viberatr VITE_APP_DOMAIN=viberatr.com bun run dev
```

## Monitoring

Monitor both deployments through:

- **Cloudflare Analytics** - Traffic and performance per domain
- **PostHog** - User behavior and conversion metrics
- **Convex Dashboard** - Shared database activity
- **GitHub Actions** - Deployment status for each branch

## Rolling Back

If one variant needs to be rolled back:

```bash
# For vibechecc
git checkout main
git revert HEAD
git push origin main

# For viberatr
git checkout main-alt
git revert HEAD
git push origin main-alt
```

## Conclusion

Once sufficient data is collected, analyze the metrics to determine which branding performs better. The infrastructure is designed to make it easy to:

1. Switch entirely to the winning variant
2. Continue running both if they serve different user segments
3. Test additional variants by creating more branches/environments

