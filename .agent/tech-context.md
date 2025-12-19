# Technical Context

**Project**: ProjectPulse
**Updated**: 2025-12-19

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14.1.0 (App Router only, no Pages Router)
- **UI**: shadcn/ui + Tailwind CSS 3.4.1 (Coral neumorphic, dark theme)
- **State**: React Context + URL params + Server Components
- **Forms**: react-hook-form 7.x + Zod validation

### Backend
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL 16 (pgvector, pg_trgm, uuid-ossp)
- **ORM**: Prisma 5.9.0 (strict types, connection pooling)
- **Validation**: Zod (runtime type checking)

### Testing
- **Unit**: Jest 29
- **Component**: React Testing Library
- **E2E**: Playwright (browser automation)

### DevOps
- **Containers**: Docker + Docker Compose
- **Package Manager**: pnpm (workspaces)
- **Code Quality**: ESLint, Prettier, TypeScript strict

---

## Runtime Environment

| Environment | Web | MCP | PostgreSQL | Redis |
|-------------|-----|-----|------------|-------|
| **Development** | localhost:3000 | localhost:3001 | localhost:5432 | localhost:6379 |
| **Production** | localhost:8080 | localhost:8081 | localhost:5433 | localhost:6380 |

**Production URLs** (Cloudflare Tunnel):
- Web: `https://projectpulse.dracodev.dev`
- MCP: `https://projectpulsemcp.dracodev.dev`

### Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.cloud.yml` | Daily development |
| `docker-compose.prod-local.yml` | Production on Mac Mini |
| `docker-compose.yml` | CI/automated testing |

### Quick Commands

```bash
# Start dev services
docker compose -f docker-compose.cloud.yml up -d

# Check health
curl http://localhost:3000/api/health

# View logs
docker compose -f docker-compose.cloud.yml logs -f web

# Restart service
docker compose -f docker-compose.cloud.yml restart web
```

---

## Database Connection

```bash
# Development
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/projectpulse_dev"

# Production (from host)
source .env.prod-local
DATABASE_URL="postgresql://$PROD_POSTGRES_USER:$PROD_POSTGRES_PASSWORD@localhost:5433/$PROD_POSTGRES_DB"
```

### PostgreSQL Extensions
- `pgvector` - Semantic search (384 dimensions)
- `pg_trgm` - Full-text search
- `uuid-ossp` - UUID generation

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 14.1.0 | Framework |
| react | ^18.2.0 | UI Library |
| @prisma/client | ^5.9.0 | Database ORM |
| tailwindcss | ^3.4.1 | Styling |
| zod | ^3.22.4 | Validation |
| @radix-ui/* | ^1.0.0 | shadcn/ui primitives |
| lucide-react | ^0.309.0 | Icons |

---

## Constraints

**Must Use**:
- Next.js App Router (not Pages Router)
- PostgreSQL (not MySQL/SQLite)
- Prisma ORM (not TypeORM/Drizzle)
- TypeScript strict (no `any`)
- Tailwind (no CSS-in-JS)

**Performance Targets**:
- LCP < 2.5s, FID < 100ms, CLS < 0.1
- Queries < 100ms average
- Client JS < 200KB gzipped

**Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## MCP Server

**Transport**: HTTP (development) / HTTPS via Cloudflare Tunnel (production)
**Tools**: 80+ operational (wiki, tickets, context, knowledge, sessions, roadmap)
**Auth**: Bearer token per project

```bash
# Test MCP health
curl http://localhost:3001/health

# Test tool list (requires token)
curl -X POST http://localhost:3001/mcp \
  -H "Authorization: Bearer <token>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## SOPs (Detailed Procedures)

- **Deployment**: `.agent/sops/production-deployment.md`
- **Migrations**: `.agent/sops/prisma-migration-workflow.md`
- **Git Workflow**: `.agent/sops/git-workflow.md`
- **Port Issues**: `.agent/sops/port-troubleshooting.md`
- **Infrastructure**: `.agent/sops/mac-mini-cloud-architecture.md`

---

*See system-patterns.md for coding patterns and conventions.*
