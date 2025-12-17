# Technical Context

**Project**: ProjectPulse
**Last Updated**: 2025-12-17
**Current Phase**: Production Hardening
**Sprint Completion**: 91% MVP complete (infrastructure finalized)

---

## Current Implementation Status

**What's Built** (MVP Complete - 91%):
- ✅ 5-level hierarchy (Phase → Week → Day → Task → Session)
- ✅ Progress roll-up system (auto-propagates to parents)
- ✅ Wiki system (versioning, full-text search, analytics)
- ✅ Onboarding system (3-session guided prompts)
- ✅ Workflow orchestration (12 predefined workflows)
- ✅ Issue/Ticket management (CRUD, bulk ops, auto-tagging)
- ✅ Knowledge graph (hybrid search, pgvector, 2-hop traversal)
- ✅ MCP server (HTTP transport, 73 tools operational)
- ✅ Skills system (lazy-loading, LRU cache, 92% token reduction)
- ✅ Infrastructure (Docker, PostgreSQL, Redis, Cloudflare Tunnel)

**Current Phase** (Production Hardening):
- 🔧 UI/UX refinement and polish
- 🔧 Testing and bug fixes
- 🔧 Performance optimization
- 🔧 Post-MVP feature planning

---

## Technology Stack

### Frontend

**Framework**: Next.js 14.1.0

- App Router (not Pages Router)
- React Server Components + Client Components
- TypeScript strict mode
- Hot Module Replacement (HMR)

**UI Library**: shadcn/ui + Tailwind CSS 3.4.1

- Utility-first CSS
- Custom Coral neumorphic theme
- Dark theme primary
- Responsive design (mobile-first)

**State Management**:

- React Context API (theme, global state)
- URL Search Params (filters, pagination)
- Server State via Server Components

**Forms & Validation**:

- react-hook-form 7.x
- Zod validation schemas
- Client + server-side validation

### Backend

**Runtime**: Node.js 18+

- Next.js API Routes
- Server Actions for mutations
- Middleware support

**Database**: PostgreSQL 16

- pgvector (semantic search)
- pg_trgm (full-text search)
- uuid-ossp (UUID generation)

**ORM**: Prisma 5.9.0

- Type-safe queries
- Automatic migrations
- Seed scripts
- Connection pooling

**Validation**: Zod

- Runtime type checking
- Schema validation
- Type inference

### Testing

**Unit Tests**: Jest 29

- Test utilities and business logic
- Component logic testing

**Component Tests**: React Testing Library

- User-centric testing
- Accessibility checks

**E2E Tests**: Playwright

- Browser automation via MCP
- Visual regression testing
- Cross-browser support

### DevOps

**Containerization**: Docker + Docker Compose

- PostgreSQL container
- Development environment
- Volume persistence

**Package Manager**: pnpm

- Fast, disk-efficient
- Strict peer dependencies
- Workspace support (future monorepo)

**Code Quality**:

- ESLint (Next.js config)
- Prettier (code formatting)
- TypeScript strict mode
- Husky (git hooks - optional)

---

## Runtime Environment

### Overview

All services run in Docker containers on Mac Mini. Development and production use different ports to allow simultaneous operation.

### Environment Summary

| Environment | Web App | MCP Server | PostgreSQL | Redis | Access Method |
|-------------|---------|------------|------------|-------|---------------|
| **Development** | localhost:3000 | localhost:3001 | localhost:5432 | localhost:6379 | Direct (localhost) |
| **Production** | localhost:8080 | localhost:8081 | localhost:5433 | localhost:6380 | Cloudflare Tunnel |

### Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.cloud.yml` | Daily development |
| `docker-compose.prod-local.yml` | Production on Mac Mini |
| `docker-compose.production.yml` | Future cloud/VPS deployment |
| `docker-compose.yml` | CI/automated testing |

### Quick Commands (Development)

```bash
# Start all services
docker compose -f docker-compose.cloud.yml up -d

# Check health
curl http://localhost:3000/api/health

# View logs
docker compose -f docker-compose.cloud.yml logs -f web

# Restart specific service
docker compose -f docker-compose.cloud.yml restart web

# Stop all services
docker compose -f docker-compose.cloud.yml down
```

### Production Access

Production is exposed via **Cloudflare Tunnel** (no port forwarding needed):
- Web: `https://projectpulse.dracodev.dev`
- MCP: `https://projectpulsemcp.dracodev.dev`

This is unaffected by local network/WiFi IP changes.

### Database Connection

```bash
# Development
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev"

# Production (from host, for migrations)
source .env.prod-local
DATABASE_URL="postgresql://$PROD_POSTGRES_USER:$PROD_POSTGRES_PASSWORD@localhost:5433/$PROD_POSTGRES_DB"
```

### For Detailed Infrastructure Documentation
- `.agent/system/infrastructure-state.md` - Complete infrastructure state, Docker configs, Kubernetes plans
- `.agent/sops/mac-mini-cloud-architecture.md` - Mac Mini setup guide

---

## Development to Production Workflow

### Quick Reference (Daily Use)

| Step | Command |
|------|---------|
| 1. Test in dev | `docker compose -f docker-compose.cloud.yml up -d --build web` |
| 2. Verify dev | `curl http://localhost:3000/api/health` |
| 3. Commit | `git add -A && git commit -m "..."` |
| 4. Push | `git push origin <branch>` |
| 5. Deploy to prod | `./scripts/deploy-prod.sh` |

### Complete Workflow

**After Making Code Changes:**

1. **Rebuild dev containers** to pick up changes:
   ```bash
   docker compose -f docker-compose.cloud.yml up -d --build web
   # Or for both web and MCP:
   docker compose -f docker-compose.cloud.yml up -d --build web mcp-server
   ```

2. **Verify dev is healthy**:
   ```bash
   curl http://localhost:3000/api/health
   # Expected: {"status":"healthy","database":"connected"}
   ```

3. **Test your changes** in browser at http://localhost:3000

4. **Commit and push**:
   ```bash
   git add -A
   git commit -m "feat: your feature description"
   git push origin <branch>
   ```

5. **Deploy to production** (after PR merge or on master):
   ```bash
   # Full deployment (recommended for first-time or major changes)
   ./scripts/deploy-prod.sh

   # Quick restart (code-only, no Dockerfile changes)
   ./scripts/deploy-prod.sh --quick

   # Verify only (no changes)
   ./scripts/deploy-prod.sh --test
   ```

6. **Verify production**:
   ```bash
   curl https://projectpulse.dracodev.dev/api/health
   curl https://projectpulsemcp.dracodev.dev/health
   ```

### When to Use Which

| Scenario | Dev Command | Prod Command |
|----------|-------------|--------------|
| Code changes only | `up -d --build web` | `--quick` |
| Dockerfile changes | `up -d --build web` | Full deploy |
| Schema changes | Run `prisma migrate dev` first | Run `prisma migrate deploy` first, then full deploy |
| Just verify | `curl localhost:3000/api/health` | `--test` |

### Detailed Documentation

- **Full Production Deployment**: `.agent/sops/production-deployment.md`
- **Dev to Prod SOP**: `.agent/sops/dev-to-prod-deployment.md`
- **Database Migrations**: `.agent/sops/prisma-migration-workflow.md`

---

## Deployment & Schema Migrations

### Schema Changes Workflow

| Environment | Command | Auto-applies? |
|-------------|---------|---------------|
| **Development** | `pnpm prisma migrate dev --name your_migration` | ✅ Yes (on container start) |
| **Production** | `pnpm prisma migrate deploy` | ❌ No (manual before deploy) |

**Why manual in production?** pnpm's symlink structure in `node_modules/.pnpm/` is incompatible with Docker's COPY instruction, making auto-migration impossible in production containers.

### Development Workflow

```bash
# Create and apply migration (creates SQL file + applies)
cd apps/web
pnpm prisma migrate dev --name add_user_preferences

# Migration files created in: apps/web/prisma/migrations/
```

### Production Migration Workflow

```bash
# 1. Check pending migrations
source .env.prod-local
DATABASE_URL="postgresql://$PROD_POSTGRES_USER:$PROD_POSTGRES_PASSWORD@localhost:5433/$PROD_POSTGRES_DB" \
  pnpm exec prisma migrate status

# 2. Apply migrations (BEFORE deployment)
DATABASE_URL="postgresql://$PROD_POSTGRES_USER:$PROD_POSTGRES_PASSWORD@localhost:5433/$PROD_POSTGRES_DB" \
  pnpm exec prisma migrate deploy

# 3. Then deploy
./scripts/deploy-prod.sh
```

### Deployment Process

| Mode | Command | What it does |
|------|---------|--------------|
| **Full deploy** | `./scripts/deploy-prod.sh` | Git pull → Build images → Restart → Smoke tests |
| **Quick restart** | `./scripts/deploy-prod.sh --quick` | Restart containers only (no rebuild) |
| **Test only** | `./scripts/deploy-prod.sh --test` | Run smoke tests only |

### Detailed Documentation
- **Migration Guide**: `.agent/sops/prisma-migration-workflow.md`
- **Production Migrations**: `.agent/sops/prisma-migration-prod.md`
- **Deployment Process**: `.agent/sops/production-deployment.md`
- **Dev→Prod Workflow**: `.agent/sops/dev-to-prod-deployment.md`

---

## Dependencies

### Core Dependencies

```json
{
  "next": "14.1.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@prisma/client": "^5.9.0",
  "typescript": "^5",
  "tailwindcss": "^3.4.1",
  "zod": "^3.22.4"
}
```

### UI Dependencies

```json
{
  "@radix-ui/react-*": "^1.0.0", // shadcn/ui primitives
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.1",
  "lucide-react": "^0.309.0",
  "date-fns": "^3.0.0"
}
```

### Form Dependencies

```json
{
  "react-hook-form": "^7.49.3",
  "@hookform/resolvers": "^3.3.4"
}
```

### Development Dependencies

```json
{
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "eslint": "^8",
  "eslint-config-next": "14.1.0",
  "prettier": "^3.2.4",
  "prisma": "^5.9.0",
  "@playwright/test": "^1.40.1",
  "jest": "^29.7.0",
  "@testing-library/react": "^14.1.2",
  "@testing-library/jest-dom": "^6.1.5"
}
```

---

## Environment Configuration

### Environment Variables

**Required** (.env):

```bash
# Database
DATABASE_URL="postgresql://projectpulse:devpassword@localhost:5432/projectpulse"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Future
# AUTH_SECRET="..."
# OPENAI_API_KEY="..."
```

**Example** (.env.example):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Port Configuration

**Development**:
- Web App: `http://localhost:3000`
- MCP Server: `http://localhost:3001`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

**Production** (Mac Mini):
- Web App: `localhost:8080` (internal) → `https://projectpulse.dracodev.dev` (external)
- MCP Server: `localhost:8081` (internal) → `https://projectpulsemcp.dracodev.dev` (external)
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6380`

**Note**: Dev and prod use different ports so both can run simultaneously.

---

## Database Schema

### PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Trigram matching (full-text)
CREATE EXTENSION IF NOT EXISTS "vector";         -- pgvector (semantic search)
```

### Prisma Schema Structure

**17 Models**:

- User, UserPreference, Team
- Project, Issue, IssueLabel, IssueComment, IssueHistory, IssueAttachment
- KnowledgeArticle, KnowledgeCategory
- WikiPage
- SecurityVulnerability, SecurityScan
- AgentPersona, Notification
- SearchIndex

**Relationships**:

- One-to-Many: User → Issues, Project → Issues
- Many-to-Many: Issue → Labels (implicit join table)
- Self-Referencing: WikiPage → related pages

**Indexes**:

- Full-text search on Issue title/description
- Vector index on embeddings (pgvector)
- Foreign key indexes

---

## Development Setup

### Prerequisites

```bash
# Node.js 18+
node --version  # v18.x or higher

# pnpm
npm install -g pnpm

# Docker
docker --version
docker-compose --version
```

### Initial Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker-compose up -d postgres

# 3. Run migrations
pnpm prisma migrate dev

# 4. Seed database
pnpm prisma db seed

# 5. Start dev server
pnpm dev
```

### Development Workflow

```bash
# Start dev server (with HMR)
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Run tests
pnpm test          # All tests
pnpm test:unit     # Unit tests only
pnpm test:e2e      # E2E tests only

# Database operations
pnpm prisma studio           # GUI for database
pnpm prisma migrate dev      # Create migration
pnpm prisma db push          # Push schema (dev only)
pnpm prisma db seed          # Seed data
pnpm prisma generate         # Regenerate client

# Build for production
pnpm build
pnpm start  # Production server
```

---

## Constraints & Limitations

### Technical Constraints

**Must Use**:

- Next.js 14 App Router (not Pages Router)
- PostgreSQL (not MySQL, SQLite, etc.)
- Prisma ORM (not TypeORM, Drizzle, etc.)
- TypeScript strict mode (no JavaScript)

**Cannot Use**:

- Class components (React - use functional only)
- any type (TypeScript - must be properly typed)
- CSS-in-JS (use Tailwind only)
- Global CSS modules (use Tailwind + globals.css)

### Design Constraints

**Theme**:

- Must follow Coral neumorphic theme
- Dark theme only (no light mode)
- Must match provided mockups pixel-perfect
- Responsive mobile-first

**Styling**:

- Tailwind utility classes only
- No inline styles
- Use CSS variables for theming
- Follow neumorphic design patterns

### Performance Constraints

**Core Web Vitals**:

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**Bundle Size**:

- Client JS: < 200KB (gzipped)
- CSS: < 50KB (gzipped)

**Database**:

- Queries: < 100ms average
- Connection pool: 10 connections max (dev)

---

## Browser Support

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Unsupported

- IE 11 (no support)
- Opera Mini (no support)
- UC Browser (no support)

---

## Docker Configuration

### Current Services (All Running)

| Service | Image | Dev Port | Prod Port |
|---------|-------|----------|-----------|
| PostgreSQL | pgvector/pgvector:pg15 | 5432 | 5433 |
| Redis | redis:7-alpine | 6379 | 6380 |
| Next.js | Custom (multi-stage build) | 3000 | 8080 |
| MCP Server | Custom (Node 20) | 3001 | 8081 |
| Cloudflare Tunnel | cloudflare/cloudflared | - | (prod only) |

### PostgreSQL Extensions
- `pgvector` - Vector similarity search (384 dimensions)
- `pg_trgm` - Trigram indexing for full-text search
- `uuid-ossp` - UUID generation

### Health Checks
All services have health checks configured:
- PostgreSQL: `pg_isready` (10s interval)
- Redis: `redis-cli ping` (10s interval)
- Next.js: `curl /api/health` (30s interval)
- MCP Server: `fetch /health` (30s interval)

### Volumes (Persistent Data)
- `postgres_data` / `prod_postgres_data` - Database files
- `redis_data` / `prod_redis_data` - Redis persistence (AOF)
- `uploads` - User-uploaded files

---

## MCP Integration

### Available MCP Tools

**Filesystem**: Read/write/search files
**Git**: Branch, commit, diff, status
**GitKraken**: Issues, PRs, workspaces
**Postgres**: Read-only SQL queries
**Playwright**: Browser automation and testing
**Docker-DevHub**: Container management
**Memory**: Knowledge graph for context
**Sequential-Thinking**: Complex reasoning

**See**: `.agent/system/mcp-tools-guide.md` for usage

---

## CI/CD (Future)

### GitHub Actions (Planned)

**On Pull Request**:

- Type checking
- Linting
- Unit tests
- E2E tests
- Build verification

**On Merge to Main**:

- Deploy to staging
- Run smoke tests
- Deploy to production (manual approval)

**On Tag**:

- Create release
- Generate changelog
- Deploy to production

---

## Security Considerations

### Dependency Security

```bash
# Audit dependencies
pnpm audit

# Update dependencies
pnpm update
```

### Environment Variables

- Never commit `.env` file
- Use `.env.example` as template
- Rotate secrets regularly
- Use different secrets per environment

### Database Security

- Use connection pooling (Prisma)
- Parameterized queries only (Prisma prevents SQL injection)
- Read replicas for analytics (future)
- Regular backups (future)

---

## Performance Optimization

### Frontend

**Code Splitting**:

- Automatic via Next.js dynamic imports
- Route-based splitting
- Component lazy loading

**Image Optimization**:

- Next.js Image component
- WebP format
- Responsive images
- Lazy loading

**Caching**:

- Static assets: 1 year
- API responses: varies by endpoint
- Browser cache via headers

### Backend

**Database**:

- Connection pooling (Prisma)
- Query optimization (select only needed fields)
- Indexes on frequently queried fields
- Pagination for large datasets

**API Routes**:

- Response compression (gzip)
- Edge caching (future - Vercel Edge)
- Rate limiting (future)

---

## Monitoring (Future)

### Application Monitoring

- Error tracking: Sentry (planned)
- Performance: Vercel Analytics (planned)
- Uptime: UptimeRobot (planned)

### Database Monitoring

- Query performance: pg_stat_statements
- Connection pooling: Prisma Studio
- Slow query log: PostgreSQL logs

---

## Troubleshooting

### Common Issues

**Port 3002 instead of 3000**:

- See: `.agent/sops/port-troubleshooting.md`
- Fix: Update package.json, restart server

**Database connection failed**:

- Check Docker: `docker ps`
- Check DATABASE_URL in .env
- Restart container: `docker-compose restart postgres`

**Build errors**:

- Clear cache: `pnpm clean` (if command exists) or `rm -rf .next`
- Reinstall: `rm -rf node_modules && pnpm install`
- Check TypeScript: `pnpm type-check`

**Prisma errors**:

- Regenerate client: `pnpm prisma generate`
- Reset database: `pnpm prisma migrate reset`
- Check schema: `pnpm prisma validate`

---

## Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Project Documentation

- [Architecture](../docs/03-Architecture.md)
- [Database Schema](../docs/02-DATABASE-SCHEMA.md)
- [Developer Guide](../docs/02-DEVELOPER_GUIDE.md)

### Tools

- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Postman](https://www.postman.com/) - API testing
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

**This file documents technical stack, dependencies, and environment setup.**

---

Last reviewed: 2025-12-08

---

## MCP Integration

### MCP Server Setup

**Package**: @modelcontextprotocol/sdk
**Version**: ^1.0.0 (latest stable)
**Transport**: stdio (standard input/output)
**Language**: TypeScript (Node.js runtime)

**Installation**:

```bash
pnpm add @modelcontextprotocol/sdk
pnpm add -D @types/node
```

**Project Structure**:

```
mcp-server/
├── src/
│   ├── index.ts              # Server initialization
│   ├── tools/
│   │   ├── sprint/           # Sprint tracking tools (7 tools)
│   │   ├── workflow/         # Workflow orchestration (5 tools)
│   │   ├── issues/           # Issue management (5 tools)
│   │   ├── knowledge/        # Knowledge graph (5 tools)
│   │   ├── skills/           # Skills system (4 tools)
│   │   ├── wiki/             # Wiki documentation (5 tools)
│   │   ├── health/           # Project health (4 tools)
│   │   └── personas/         # Agent personas (4 tools)
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── validation.ts     # Zod schemas
│   │   └── markdown.ts       # Markdown generation
│   └── types/
│       └── tools.ts          # Tool type definitions
├── package.json
└── tsconfig.json
```

**Server Initialization**:

```typescript
// mcp-server/src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';

const server = new McpServer({
  name: 'projectpulse-mcp',
  version: '1.0.0',
});

// Register all 41 tools (current scope)
import './tools/sprint';
import './tools/workflow';
import './tools/issues';
// ... etc

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.log('MCP server running on stdio');
```

### Claude Code Configuration

**Location**: `~/.claude/settings.json` (user config)

**Development** (localhost on Mac mini):
```json
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "http://localhost:3001/mcp",
      "headers": {
        "Authorization": "Bearer <your-dev-agent-token>"
      }
    }
  }
}
```

**Production** (public HTTPS via Cloudflare Tunnel):
```json
{
  "mcpServers": {
    "projectpulse": {
      "type": "http",
      "url": "https://projectpulsemcp.dracodev.dev/mcp",
      "headers": {
        "Authorization": "Bearer <your-prod-agent-token>"
      }
    }
  }
}
```

**Production URLs**:
- Web App: `https://projectpulse.dracodev.dev`
- MCP Server: `https://projectpulsemcp.dracodev.dev`
- MCP Endpoint: `https://projectpulsemcp.dracodev.dev/mcp`

**Testing Connection**:

```bash
# Check MCP server health
curl https://projectpulsemcp.dracodev.dev/health

# Expected output:
# {"status":"healthy","version":"0.1.0","transport":"http","toolCount":73,"endpoint":"/mcp"}

# Test MCP endpoint (requires auth token)
curl -X POST https://projectpulsemcp.dracodev.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### MCP Tool Categories (41 Total)

**1. Sprint/Phase Tracking (7 tools)**:

- `sprint.phase.create` - Create phase
- `sprint.week.create` - Create week within phase
- `sprint.day.create` - Create day within week
- `sprint.task.create` - Create task within day
- `sprint.session.create` - Create session within task
- `sprint.getCurrentTask` - Get active task
- `sprint.checkpoint` - Create progress checkpoint

**2. Workflow Orchestration (5 tools)**:

- `workflow.start` - Start workflow execution
- `workflow.getCurrentStep` - Get current step
- `workflow.completeStep` - Mark step complete
- `workflow.status` - Get workflow status
- `workflow.recover` - Recover from failure

**3. Issues Management (5 tools)**:

- `issues.create` - Create single issue
- `issues.createBulk` - Create 10-50 issues at once
- `issues.update` - Update issue
- `issues.query` - Search issues
- `issues.link` - Link issue to task

**4. Knowledge Graph (5 tools)**:

- `knowledge.add` - Add knowledge item
- `knowledge.query` - Hybrid search (semantic + full-text)
- `knowledge.relate` - Create relationship
- `knowledge.traverse` - 2-hop graph traversal
- `knowledge.semanticSearch` - Semantic search only

**5. Skills System (4 tools)**:

- `skills.list` - List skills (frontmatter only, ~50 tokens)
- `skills.load` - Load full skill content (~180 tokens)
- `skills.search` - Search skills by keyword
- `skills.create` - Create new skill

**6. Wiki Documentation (5 tools)**:

- `wiki.create` - Create wiki page
- `wiki.update` - Update wiki page
- `wiki.read` - Read wiki page
- `wiki.search` - Search wiki
- `wiki.autoGenerate` - Auto-generate from code

**7. Project Health (4 tools)**:

- `health.scan` - Run scanner (Semgrep, ESLint, etc.)
- `health.findings` - Get findings by severity
- `health.score` - Calculate health score
- `health.remediate` - Mark finding resolved

**8. Agent Personas (4 tools)**:

- `personas.create` - Create persona
- `personas.list` - List personas
- `personas.activate` - Activate persona
- `personas.deactivate` - Deactivate persona

**9. Dashboard (3 tools)** - Cross-cutting:

- `dashboard.getStats` - Get dashboard statistics
- `dashboard.getActivity` - Get recent activity
- `dashboard.getProgress` - Get phase/sprint progress

### Development Workflow

**Local Development**:

```bash
# Terminal 1: Run Next.js app
pnpm dev

# Terminal 2: Run MCP server in watch mode
cd mcp-server
pnpm dev  # Uses ts-node-dev for auto-reload

# Terminal 3: Test MCP tools
pnpm test:mcp
```

**Testing MCP Tools**:

```bash
# Unit tests (Jest)
pnpm test mcp-server/src/tools/**/*.test.ts

# Integration tests (invoke tools via stdio)
pnpm test:integration mcp-server/tests/integration/**/*.test.ts
```

### Dependencies Added for Sprint 1

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "ts-node-dev": "^2.0.0"
  }
}
```

---

**This section documents MCP integration setup. See system-patterns.md for MCP tool implementation patterns.**

### MCP Tool Roadmap

**Current Status** (as of 2025-11-07):
- **Sprint 1-8 MVP**: 41 tools (baseline)
- **Sprint 9-13 Full**: 65 tools (enhancements)
- **Gap**: 23 tools deferred to post-MVP

**Tool Count Breakdown**:

**Sprint 1-8 MVP (41 tools)** ✅:
1. Sprint Hierarchy (9 tools) - EPIC-001
2. Progress Tracking (4 tools) - EPIC-002
3. AI Agent Integration (5 tools) - EPIC-003
4. Context Management (4 tools) - EPIC-004
5. Issue Tracking (6 tools) - EPIC-005
6. Knowledge Base (5 tools) - EPIC-006
7. Hybrid Search (3 tools) - EPIC-007
8. Health & Monitoring (3 tools) - EPIC-008
9. Documentation (3 tools) - EPIC-009

**Sprint 9+ Enhancements (23 tools)** 🔄:
1. Advanced Analytics (8 tools) - EPIC-010
2. Collaboration Tools (5 tools) - EPIC-011
3. Template System (5 tools) - EPIC-012
4. Integration Hooks (5 tools) - EPIC-013

**See**: `.agent/tech-debt/mcp-tool-gap-23-tools.md` for detailed breakdown

**Impact**: None - MVP functionality complete with 41 tools. Enhancement tools add value but aren't critical path.

---
### Code Execution with MCP (Planned for Sprint 2)

**Traditional MCP (current usage):**
- All tool definitions loaded upfront in each session
- Results pass through the model context window
- Token cost scales with tool count

**Code Execution MCP (planned enhancement):**
- On-demand tool discovery via filesystem exploration (e.g., `./servers/projectpulse/...`)
- Local data processing before returning to the model
- Token savings: up to 98.7% reduction on tool operations
- Scales without context bloat (41 tools current scope; expandable)
- Privacy via auto-tokenization (mask sensitive data prior to model exposure)

**Benefits for ProjectPulse:**
- Efficient search/filter operations (processing happens locally)
- Complex workflows with loops/conditionals are feasible
- Stronger privacy posture through automatic tokenization

**Timeline:**
- Sprint 2 Week 5: Design + Traditional POC (3 tools: create-issue, search-issues, filter-issues)
  - Capability detection design and stubs (PP_MCP_MODE + probe)
  - Shared services interface definitions
  - Privacy tokenization specification (document)
  - Sandbox specification (document)
  - Multi-client test harness design (mock traditional client + CLI)
  - Token usage baseline (traditional mode)
- Sprint 2 Weeks 6-7: Refine specs; optimize traditional mode (pagination, compression, timeouts); document dual-mode patterns; prep Sprint 3
- Sprint 3: Implement on-demand discovery and local filtering (code execution wrappers), sandbox, and full dual-mode infrastructure
- Future: Evaluate wrapping existing servers where large payloads benefit from local processing

**Reference:** Code Execution with MCP – https://www.anthropic.com/engineering/code-execution-with-mcp

### Client Capability Detection (Hybrid Strategy)

- Negotiation attempt during handshake (if supported): server `capabilities: { tools: true, codeExecution: true }`, client `supports: { codeExecution: boolean }`
- Fallback via env var: `PP_MCP_MODE=traditional|code-exec|auto` (default: `auto`)
- Probe verification on first call; cache per session; safe default is traditional mode

Last updated: 2025-11-07
