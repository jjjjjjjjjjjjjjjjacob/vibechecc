# vibechecc

vibechecc is a modern social application where users can:

- Share "vibes" (life experiences, thoughts, situations) with the community
- Rate and react to other users' vibes with emojis and star ratings
- Discover trending vibes and connect with like-minded people
- Manage their profile and track their social interactions

---

## Monorepo Structure

This project is an Nx-powered monorepo, enabling code sharing between multiple frontend applications and a Convex backend.

```
vibechecc/
├── apps/
│   ├── web/              # React web application (TanStack Start)
│   └── convex/           # Convex backend (real-time DB, auth, webhooks)
├── packages/
│   ├── types/            # @vibechecc/types - Shared TypeScript interfaces
│   └── utils/            # @vibechecc/utils - Shared utility functions
├── terraform/            # Infrastructure as code (Cloudflare, Convex, etc.)
├── .github/              # GitHub Actions workflows
├── nx.json               # Nx workspace configuration
├── package.json          # Root workspace package.json
└── ...
```

- **Frontend details:** See [`apps/web/README.md`](./apps/web/README.md)
- **Backend details:** See [`apps/convex/README.md`](./apps/convex/README.md)
- **Infrastructure:** See [`terraform/README.md`](./terraform/README.md)

---

## Tech Stack

### Frontend

- [TanStack Start](https://tanstack.com/start) (React framework)
- [shadcn/ui](https://ui.shadcn.com/) (UI components)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query) (server state)
- [TanStack Router](https://tanstack.com/router)
- [Lucide React](https://lucide.dev/) (icons)
- [tw-animate-css](https://github.com/unocss/unocss) (animations)

### Backend

- [Convex](https://convex.dev/) (real-time DB, serverless functions)
- [Clerk](https://clerk.com/) (authentication)

### Infrastructure

- [Cloudflare Workers](https://workers.cloudflare.com/) (frontend hosting)
- [Cloudflare R2](https://developers.cloudflare.com/r2/) (state storage)
- [Terraform](https://www.terraform.io/) (infra as code)
- [ngrok](https://ngrok.com/) (webhook tunneling)

### Development Tools

- [Bun](https://bun.sh/) (runtime, package manager)
- [Vinxi](https://vinxi.vercel.app/) (build system)
- [Vitest](https://vitest.dev/) (testing)
- [TypeScript](https://typescriptlang.org/) (type checking)
- [ESLint](https://eslint.org/) (linting)
- [Prettier](https://prettier.io/) (formatting)
- [Nx](https://nx.dev/) (monorepo orchestration)

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/)
- [Git](https://git-scm.com/)
- [ngrok](https://ngrok.com/download)
- [Convex CLI](https://docs.convex.dev/cli/install)
- A code editor (e.g., [VS Code](https://code.visualstudio.com/))

### Installation

```bash
git clone https://github.com/your-username/vibechecc.git
cd vibechecc
bun install
```

### Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Fill in values for:
   - `VITE_CONVEX_URL`, `CONVEX_DEPLOYMENT` (Convex dashboard)
   - `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` (Clerk dashboard)
   - `NGROK_AUTHTOKEN`

### Running Locally

```bash
bun run dev
```

- Starts Convex backend, seeds DB, launches frontend (http://localhost:3000), and ngrok tunnel.
- See [apps/web/README.md](./apps/web/README.md) and [apps/convex/README.md](./apps/convex/README.md) for app-specific dev info.

### Troubleshooting

- Clerk webhooks: Ensure ngrok is running and webhook URL is set in Clerk dashboard.
- Convex errors: Check Convex CLI output and env vars.
- Bun issues: Upgrade Bun, clear node_modules, reinstall.

---

## Development & Scripts

All scripts are run from the root with Bun:

| Command                 | Description                           |
| ----------------------- | ------------------------------------- |
| `bun run dev`           | Start full dev environment            |
| `bun run dev:frontend`  | Start frontend only                   |
| `bun run dev:backend`   | Start backend only                    |
| `bun run build`         | Build all projects                    |
| `bun run test`          | Run all tests                         |
| `bun run typecheck`     | Type check all projects               |
| `bun run lint`          | Lint all projects                     |
| `bun run seed`          | Seed database with basic data         |
| `bun run seed:enhanced` | Seed database with comprehensive data |
| `bun run seed:clear`    | Clear all database content            |

#### Nx Usage

- List projects: `bun nx show projects`
- Project details: `bun nx show project <project>`
- Run task: `bun nx <task> <project>` (e.g., `bun nx build @vibechecc/web`)
- Run for all: `bun nx run-many --target=<task>`
- Clear cache: `bun nx reset`

#### Adding New Apps

- Add a new app in `apps/` (see Nx docs for generators)
- Add to `package.json` workspaces and `nx.json` if needed
- See [Import Patterns](#import-patterns) for shared code usage

---

## CI/CD & Deployment

- **Environments:**
  - Production (`main` branch)
  - Development (`develop` branch)
  - Ephemeral (per PR)
- **Workflows:** Automated via GitHub Actions:
  - Lint, typecheck, test, build, deploy (see `.github/workflows/`)
  - Terraform manages infra, Convex and Cloudflare deploys
- **Manual Deploys/Rollbacks:**
  - Trigger from GitHub Actions tab
  - Rollback via Cloudflare/Convex dashboards

---

## Infrastructure (Terraform)

- All infra as code in [`terraform/`](./terraform)
- Cloudflare Workers for frontend, R2 for state, Convex for backend
- Three environments: production, development, ephemeral (PR)
- State stored remotely (Cloudflare R2)
- **Build before Terraform:**
  ```bash
  bun run build
  cd terraform
  # (see below for workspace/env setup)
  terraform init
  terraform plan
  terraform apply
  ```
- See [`terraform/README.md`](./terraform/README.md) for details on monitoring, security, optimization, and troubleshooting.

### Local Terraform Usage

To manage infrastructure locally, you must configure environment variables for Terraform and the backend state bucket. This is automated using [direnv](https://direnv.net/) and a `.envrc` file in the `terraform/` directory.

#### 1. Install direnv (if not already)

```bash
brew install direnv # macOS
# or see https://direnv.net/docs/installation.html for other OS
```

#### 2. Allow the .envrc

```bash
cd terraform
# Review the .envrc file, then allow it:
direnv allow
```

This will export all required variables for Terraform, including Cloudflare and R2 credentials.

#### 3. Generate backend.tfvars

Before running `terraform init`, generate the backend config:

```bash
chmod +x generate-backend-config.sh
./generate-backend-config.sh
```

This creates `backend.tfvars` with the correct R2 bucket and credentials for remote state.

#### 4. Select/Create a Workspace

Terraform uses workspaces to isolate environments:

- `production` → main site
- `development` → dev site
- `pr-<number>` → ephemeral/PR preview

To select or create a workspace:

```bash
terraform workspace select <workspace> || terraform workspace new <workspace>
```

For ephemeral/PR environments, set `TF_VAR_environment=ephemeral` and `TF_VAR_pr_number=<pr_number>` in your `.envrc`.

#### 5. Usual Terraform Workflow

```bash
terraform init -backend-config=backend.tfvars
terraform plan
terraform apply
```

---

## Import Patterns

### From Browser App

```typescript
import { api } from '@vibechecc/convex';
import type { User, Vibe, Rating } from '@vibechecc/types';
import { computeUserDisplayName, getUserAvatarUrl } from '@vibechecc/utils';
import { seo } from '@vibechecc/utils';
import { cn } from '@vibechecc/utils/tailwind';
```

### From Backend Package

```typescript
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type { User, Vibe, Rating } from '@vibechecc/types';
import { computeUserDisplayName } from '@vibechecc/utils';
```

### From Shared Packages

```typescript
// @vibechecc/types
export interface User { id: string; name: string; email: string; }
// @vibechecc/utils
export function computeUserDisplayName(user: User): string { ... }
// @vibechecc/utils/tailwind
export function cn(...classes: string[]): string { ... }
```

---

## Contributing

- Follow existing code style and patterns
- Run `bun run quality` before PRs
- Write tests for new features
- Update docs as needed
- See app/infra READMEs for deep dives

---

## Recent Feature Updates

### Emoji Rating System

The application now includes a comprehensive emoji rating system that enhances user engagement:

#### Emoji Reactions UI

- **Circular buttons**: Changed from pill-shaped to perfect circles (48x48px) for better visual consistency
- **Theme-aware styling**: Using secondary colors with hover states for better UX
- **Interactive behavior**: Clicking emoji reactions opens the rating popover with that emoji pre-selected
- **Review requirement**: All ratings now require written reviews to encourage meaningful feedback

#### Emoji Rating Display

- **Compact mode**: Shows emoji with rating value and count in vibe cards
- **Expanded mode**: Shows emoji with "out of 5" text, scale visualization, and tags
- **Smooth animations**: Using CSS animations for hover effects and transitions
- **Partial ratings support**: Visual representation of partial ratings (e.g., 3.5 out of 5)

#### Integration Points

- **VIbeCard Component**: Displays emoji ratings when reactions exist, falls back to stars
- **Vibe Detail Page**: Prominent emoji rating display with "Top Emoji Ratings" section
- **Review Cards**: Show emoji ratings alongside traditional star ratings
- **Backward Compatibility**: Maintains support for existing star rating system

## Testing

### Unit Testing

- Frontend: Vitest + React Testing Library for component tests
- Backend: convex-test for Convex function testing
- Run all tests: `bun run test`
- Run specific project: `bun nx test <project>`

### E2E Testing

- No E2E framework currently configured
- Manual testing via local development environment

### Test Coverage

- Component tests for UI elements
- Function tests for backend logic
- Integration tests for critical workflows

## License

[Add your license information here]
