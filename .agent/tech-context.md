# Technical Context

**Project**: ProjectPulse
**Last Updated**: 2025-11-06

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

**Application**: `http://localhost:3000`
**Database**: `localhost:5432`
**Future API**: `http://localhost:3001` (if needed)

**CRITICAL**: Always verify `pnpm dev` shows port 3000 (not 3002)

- See: `.agent/sops/port-troubleshooting.md`

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

### PostgreSQL Container

**Image**: `postgres:16-alpine`
**Ports**: `5432:5432`
**Volumes**: `postgres_data:/var/lib/postgresql/data`
**Env**:

- POSTGRES_USER=projectpulse
- POSTGRES_PASSWORD=devpassword
- POSTGRES_DB=projectpulse

### Future Containers

**MCP Server** (future):

- Port: 3001
- Protocol: stdio + HTTP

**Redis** (future - caching):

- Port: 6379
- Persistence: AOF

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

Last reviewed: 2025-11-06

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

// Register all 42 tools
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

**Location**: `~/.claude/mcp_settings.json` (user config)

```json
{
  "mcpServers": {
    "projectpulse": {
      "command": "node",
      "args": ["F:/Web_Projects/AI_HUB/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://projectpulse:devpassword@localhost:5432/projectpulse"
      }
    }
  }
}
```

**Testing Connection**:

```bash
# 1. Build MCP server
cd mcp-server
pnpm build

# 2. Test stdio communication
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js

# 3. Expected output: List of 42 tools
```

### MCP Tool Categories (42 Total)

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
- **Sprint 1-8 MVP**: 42 tools (baseline)
- **Sprint 9-13 Full**: 65 tools (enhancements)
- **Gap**: 23 tools deferred to post-MVP

**Tool Count Breakdown**:

**Sprint 1-8 MVP (42 tools)** ✅:
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

**Impact**: None - MVP functionality complete with 42 tools. Enhancement tools add value but aren't critical path.

---

Last updated: 2025-11-07
