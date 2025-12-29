# Contributing to ProjectPulse

First off, thank you for considering contributing to ProjectPulse! It's people like you that make ProjectPulse such a great tool for AI-assisted development.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by the [ProjectPulse Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

ProjectPulse is a monorepo containing:

- `apps/web` - Next.js 14 web application
- `apps/mcp-server` - MCP (Model Context Protocol) server with 86+ tools
- `apps/mcp-docker` - Docker-based MCP server variant

### Prerequisites

- **Node.js** 18.x or later
- **pnpm** 8.x or later
- **Docker** and **Docker Compose** (for database)
- **PostgreSQL** 16 with pgvector extension

## Development Setup

1. **Fork the repository** and clone your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/ProjectPulse.git
   cd ProjectPulse
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start the database**:

   ```bash
   docker compose -f docker-compose.cloud.yml up -d
   ```

4. **Set up environment variables**:

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit .env.local with your database connection
   ```

5. **Run database migrations**:

   ```bash
   pnpm --filter web prisma migrate dev
   ```

6. **Start the development server**:

   ```bash
   pnpm dev
   ```

7. **Verify the setup**:

   ```bash
   curl http://localhost:3000/api/health
   # Should return: {"status":"healthy","database":"connected"}
   ```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, error messages)
- **Describe the behavior you observed and what you expected**
- **Include screenshots** if applicable
- **Note your environment** (OS, Node version, browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the proposed enhancement
- **Explain why this enhancement would be useful**
- **List any similar features in other tools** if applicable

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues for newcomers
- `help wanted` - Issues that need attention
- `documentation` - Documentation improvements

### Development Workflow

1. **Create a feature branch** from `master`:

   ```bash
   git checkout master
   git pull origin master
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our [style guidelines](#style-guidelines)

3. **Write or update tests** as needed

4. **Run the test suite**:

   ```bash
   pnpm test
   pnpm type-check
   ```

5. **Commit your changes** using [Conventional Commits](https://www.conventionalcommits.org/):

   ```bash
   git commit -m "feat: add new MCP tool for session management"
   git commit -m "fix: resolve token calculation error"
   git commit -m "docs: update API reference"
   ```

6. **Push to your fork** and create a Pull Request

## Pull Request Process

1. **Ensure your PR**:
   - Has a clear title and description
   - References any related issues
   - Includes tests for new functionality
   - Passes all CI checks
   - Updates documentation if needed

2. **PR Title Format** (Conventional Commits):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation only
   - `style:` - Code style (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

3. **Review Process**:
   - A maintainer will review your PR
   - Address any requested changes
   - Once approved, a maintainer will merge your PR

## Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Prefer `interface` over `type` for object shapes
- Use meaningful variable and function names

### Code Formatting

We use ESLint and Prettier for consistent code style:

```bash
pnpm lint        # Check for linting errors
pnpm lint:fix    # Auto-fix linting errors
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
```
feat(mcp): add ticket hierarchy tool
fix(api): resolve pagination offset error
docs: update contributing guidelines
```

### Testing

- Write unit tests for utilities and business logic
- Write integration tests for API endpoints
- Write E2E tests for critical user flows
- Aim for meaningful coverage, not just high numbers

## Project Structure

```
ProjectPulse/
├── apps/
│   ├── web/                # Next.js web application
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   └── prisma/        # Database schema
│   │
│   ├── mcp-server/        # MCP Server
│   │   └── src/tools/     # MCP tool implementations
│   │
│   └── mcp-docker/        # Docker MCP variant
│
├── docs/                   # Documentation
│   ├── features/          # Feature guides
│   └── architecture/      # ADRs and design docs
│
└── mockups/               # UI mockups
```

## Community

- **Issues**: [GitHub Issues](https://github.com/ProjectPulse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ProjectPulse/discussions)

## Recognition

Contributors who make significant contributions will be:
- Listed in our README
- Mentioned in release notes
- Invited to our contributors community

---

Thank you for contributing to ProjectPulse! Your efforts help make AI-assisted development better for everyone.
