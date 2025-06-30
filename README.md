# Vibechek


VibeChecc is a social application where users can:
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

```
vibechecc/
├── src/                          # Frontend source code
│   ├── components/              # Reusable React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── header.tsx          # Main navigation header
│   │   ├── emoji-reaction.tsx  # Emoji reaction system
│   │   └── star-rating.tsx     # Star rating component
│   ├── routes/                 # TanStack Router pages
│   │   ├── __root.tsx         # Root layout
│   │   ├── index.tsx          # Home page
│   │   ├── profile.tsx        # User profile page
│   │   ├── onboarding.tsx     # User onboarding flow
│   │   └── vibes/             # Vibe-related pages
│   │       ├── index.tsx      # Vibes listing
│   │       ├── create.tsx     # Create new vibe
│   │       ├── my-vibes.tsx   # User's vibes
│   │       └── $vibeId.tsx    # Individual vibe page
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   ├── utils/                 # Helper functions
│   ├── types.ts              # TypeScript type definitions
│   ├── queries.ts            # TanStack Query configurations
│   └── router.tsx            # Router configuration
├── convex/                      # Backend Convex functions
│   ├── schema.ts              # Database schema definitions
│   ├── users.ts               # User-related functions
│   ├── vibes.ts               # Vibe-related functions
│   ├── seed.ts                # Database seeding functions
│   ├── auth.config.js         # Clerk authentication config
│   └── _generated/            # Auto-generated Convex files
├── scripts/                     # Utility scripts
│   └── seed-db.js             # Database seeding script
├── public/                      # Static assets
├── .cursor/                     # Cursor IDE configuration
├── package.json                 # Dependencies and scripts
├── app.config.ts               # TanStack Start configuration
├── tsconfig.json               # TypeScript configuration
├── components.json             # shadcn/ui configuration
├── vitest.config.ts            # Testing configuration
├── eslint.config.js            # ESLint configuration
├── .prettierrc                 # Prettier configuration
└── CLERK_CONVEX_SYNC.md        # Authentication sync documentation
```

## Prerequisites

Before running this project, ensure you have the following installed:

### Required CLIs and Tools

1. **[Bun](https://bun.sh/)** - JavaScript runtime and package manager
   ```bash
   # Install Bun
   curl -fsSL https://bun.sh/install | bash
   ```

2. **[ngrok](https://ngrok.com/)** - Secure tunneling for webhooks
   ```bash
   # Install ngrok (macOS)
   brew install ngrok/ngrok/ngrok
   
   # Or download from https://ngrok.com/download
   ```

3. **[Convex CLI](https://docs.convex.dev/cli)** - Convex development tools
   ```bash
   # Installed automatically with bun install
   # Or install globally: bun install -g convex
   ```

### External Services

1. **[Convex Account](https://convex.dev/)** - Backend database and functions
2. **[Clerk Account](https://clerk.com/)** - Authentication service
3. **[ngrok Account](https://ngrok.com/)** - For webhook tunneling (optional for basic development)

## Local Development

### 1. Clone and Install

```bash
git clone <repository-url>
cd vibechecc
bun install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# Convex Configuration
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Webhook Configuration (for Clerk-Convex sync)
CLERK_WEBHOOK_SIGNING_SECRET=whsec_your_webhook_signing_secret
```

### 3. Setup Convex

```bash
# Initialize Convex (first time only)
bunx convex dev --once

# This will:
# - Create a new Convex project (if needed)
# - Generate the deployment URL
# - Set up the database schema
```

### 4. Setup ngrok (for webhooks)

```bash
# Get your ngrok auth token from https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN

# The dev script will automatically start ngrok on the correct port
```

### 5. Run Development Server

```bash
# Start all development services
bun dev

# This command runs:
# - Frontend dev server (http://localhost:3030)
# - Convex backend with live reload
# - ngrok tunnel for webhooks
# - Database seeding (if needed)
```

The development script runs multiple processes:
- **Frontend**: http://localhost:3030
- **Convex Dashboard**: Check terminal output for URL
- **ngrok Tunnel**: Check terminal output for public URL

### 6. Seed the Database (Optional)

```bash
# Seed with sample data
bun run seed

# Or seed via Convex CLI
bunx convex run seed:seed
```

## Available Scripts

```bash
# Development
bun dev              # Start all dev services (web + db + ngrok)
bun dev:web          # Frontend only (port 3030)
bun dev:db           # Convex backend with seeding
bun dev:webhooks     # Clerk webhook listener

# Database
bun seed             # Seed database with sample data

# Testing
bun test             # Run test suite
bun test:watch       # Run tests in watch mode

# Code Quality
bun lint             # Run ESLint
bun lint:fix         # Fix ESLint issues
bun format           # Format code with Prettier
bun format:check     # Check code formatting
bun typecheck        # Run TypeScript checks
bun quality          # Run all quality checks
bun quality:fix      # Fix all quality issues

# Build & Deploy
bun build            # Build for production
bun start            # Start production server
```

## Dependency Management

### Package Manager
- **Primary**: [Bun](https://bun.sh/) - Fast package manager and runtime
- **Lock File**: `bun.lock` - Bun's lock file for reproducible installs

### Key Dependencies

#### Frontend Dependencies
- `@tanstack/react-start` - Full-stack React framework
- `@tanstack/react-query` - Server state management
- `@tanstack/react-router` - Type-safe routing
- `@clerk/tanstack-react-start` - Clerk authentication
- `@convex-dev/react-query` - Convex-TanStack Query integration
- `@radix-ui/*` - Headless UI components
- `tailwindcss` - CSS framework
- `framer-motion` - Animations
- `lucide-react` - Icons

#### Backend Dependencies
- `convex` - Backend database and functions
- `@clerk/backend` - Clerk backend SDK
- `svix` - Webhook handling

#### Development Dependencies
- `vitest` - Testing framework
- `@testing-library/react` - React testing utilities
- `eslint` - Code linting
- `prettier` - Code formatting
- `typescript` - Type checking

### Managing External Services

#### Convex (Database & Backend)
- **Dashboard**: https://dashboard.convex.dev/
- **Documentation**: https://docs.convex.dev/
- **Management**:
  ```bash
  bunx convex dashboard    # Open dashboard
  bunx convex deploy       # Deploy to production
  bunx convex env set      # Set environment variables
  bunx convex logs         # View function logs
  ```

#### Clerk (Authentication)
- **Dashboard**: https://dashboard.clerk.com/
- **Documentation**: https://clerk.com/docs
- **Management**:
  - User management via Clerk dashboard
  - Webhook configuration for user sync
  - API key management
  - Authentication flow customization

#### ngrok (Tunneling)
- **Dashboard**: https://dashboard.ngrok.com/
- **Documentation**: https://ngrok.com/docs
- **Management**:
  ```bash
  ngrok config check       # Verify configuration
  ngrok tunnel list        # List active tunnels
  ngrok http 3030         # Manual tunnel creation
  ```

## Database Schema

The application uses the following main data models:

- **Users**: User profiles with authentication data
- **Vibes**: User-generated content/experiences
- **Ratings**: Star ratings on vibes (1-5 stars)
- **Reactions**: Emoji reactions to vibes
- **Tags**: Categorization system for vibes

See `convex/schema.ts` for detailed schema definitions.

## Authentication Flow

The app uses Clerk for authentication with Convex integration:

1. **Sign Up/In**: Users authenticate via Clerk
2. **User Creation**: Automatic user creation in Convex database
3. **Onboarding**: New users complete profile setup
4. **Sync**: Bidirectional sync between Clerk and Convex
5. **Webhooks**: Real-time user updates via Clerk webhooks

See `CLERK_CONVEX_SYNC.md` for detailed authentication documentation.

## Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test --coverage
```

Tests are located alongside source files and use Vitest with React Testing Library.

## Deployment

### Production Build
```bash
bun build
```

### Environment Variables for Production
Set the following in your production environment:
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk production publishable key
- `VITE_CONVEX_URL` - Convex production deployment URL
- `CLERK_SECRET_KEY` - Clerk production secret key
- `CLERK_WEBHOOK_SIGNING_SECRET` - Production webhook secret

## Contributing

1. Follow the existing code style and patterns
2. Run quality checks before submitting: `bun quality`
3. Write tests for new functionality
4. Update documentation as needed

## Troubleshooting

### Common Issues

1. **Convex connection issues**
   ```bash
   bunx convex dev --once  # Reinitialize connection
   ```

2. **ngrok tunnel issues**
   ```bash
   ngrok config check      # Verify ngrok setup
   ```

3. **Authentication issues**
   - Check Clerk dashboard for API keys
   - Verify webhook URLs in Clerk settings
   - Check environment variables

4. **Build issues**
   ```bash
   rm -rf node_modules bun.lock
   bun install
   ```

### Getting Help

- **Convex**: https://docs.convex.dev/
- **Clerk**: https://clerk.com/docs
- **TanStack Start**: https://tanstack.com/start
- **Bun**: https://bun.sh/docs

## License

[Add your license information here]
