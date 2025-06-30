# VibeChecc

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

## Documentation

For detailed information about the project, please refer to the following documents:

- **[Local Development Guide](./LOCAL_DEVELOPMENT.md)**: Instructions for setting up and running the project locally.
- **[Cloud Deployment Guide](./CLOUD_DEPLOYMENT.md)**: Information on our CI/CD pipeline and how to deploy the application.
- **[Dependency Management Guide](./DEPENDENCY_MANAGEMENT.md)**: Details on how we manage dependencies, including the Clerk and Convex integration.
- **[Scripts and Automation Guide](./SCRIPTS_AND_AUTOMATION.md)**: An overview of the scripts and automation available in the project.

## Getting Started

To get started with local development, please see the **[Local Development Guide](./LOCAL_DEVELOPMENT.md)**.

## Project Structure

A high-level overview of our project structure:

```
vibechecc/
├── convex/                 # Backend Convex functions
├── public/                 # Static assets
├── src/                    # Frontend source code
├── scripts/                # Utility scripts
├── terraform/              # Terraform infrastructure as code
├── .github/                # GitHub Actions workflows
├── .cursor/                # Cursor IDE configuration
└── ...
```

## Contributing

1. Follow the existing code style and patterns.
2. Run quality checks before submitting: `bun run quality`.
3. Write tests for new functionality.
4. Update documentation as needed.

## License

[Add your license information here]
