# Day 14 — Deployment + runtime (Docker, dev vs prod ports, health checks)

## Goals (what you should understand today)

By the end of Day 14, you should be able to explain:

1. What “runtime” means for ProjectPulse (which processes/containers run where).
2. How development vs production stacks differ (compose files, ports, images).
3. How the system exposes health checks (web + MCP) and how Docker uses them.
4. How deployment is performed on the Mac mini (scripted, with smoke tests).
5. Common operational failure modes (ports, env vars, DB migrations, Redis/session store).

---

## The mental model: ProjectPulse is a small distributed system

Even though this is “one repo”, it runs as multiple cooperating services:

- **PostgreSQL** (state)
- **Redis** (sessions + cache)
- **Next.js web app** (UI + API routes)
- **MCP server** (agent gateway that calls the web app API)

The important design idea:

- The **database is the source of truth**.
- The MCP server does **not** talk directly to the DB in the intended architecture; it forwards tool calls to Next.js APIs (defense-in-depth).

Evidence:

- Dev stack compose: `docker-compose.cloud.yml`
- Production stack compose: `docker-compose.prod-local.yml`
- MCP server health endpoint: `apps/mcp-server/src/index-http.ts` (`GET /health`)
- Web app health endpoint: `apps/web/app/api/health/route.ts` (`GET /api/health`)

---

## Runtime environments in this repo

### A) “Cloud runtime” / daily development on Mac mini

Primary file:

- `docker-compose.cloud.yml`

Services:

- `postgres` (pgvector/pgvector:pg15) exposes `5432`
- `redis` (redis:7-alpine) exposes `6379` and requires a password
- `nextjs` (node:20 image, runs `pnpm dev`) exposes `3000`
- `mcp-server` (node:20 image, builds + runs `index-http`) exposes `3001`

Key runtime URLs (from another machine on LAN):

- Web: `http://192.168.1.15:3000`
- MCP: `http://192.168.1.15:3001`

Important deployment detail:

- In `docker-compose.cloud.yml`, the Next.js container runs a development command:
  - `pnpm dev --hostname 0.0.0.0`

So this stack is optimized for rapid iteration (volumes + hot reload).

### B) “Production local” stack on Mac mini (separate ports)

Primary file:

- `docker-compose.prod-local.yml`

This runs **side-by-side** with dev by using different host ports:

- Web: `8080 → 3000`
- MCP: `8081 → 3001`
- Postgres: `5433 → 5432`
- Redis: `6380 → 6379`

That separation prevents “prod testing” from clobbering your dev environment.

---

## Diagram-in-words: runtime request flow (two entry points)

### Human UI path

```
Browser
  ↓ (HTTP)
Next.js (apps/web)
  ↓ (server-side Prisma)
PostgreSQL
```

### Agent MCP path

```
Agent client
  ↓ (HTTP POST /mcp)
MCP server (apps/mcp-server)
  ↓ (HTTP to web API)
Next.js API routes (apps/web/app/api/*)
  ↓ (Prisma)
PostgreSQL
```

Evidence for MCP server endpoint:

- `apps/mcp-server/src/index-http.ts` exposes `POST /mcp`

---

## Health checks: what “healthy” means here

### Web health (`/api/health`)

File:

- `apps/web/app/api/health/route.ts`

What it checks:

- DB connectivity (`SELECT 1` via Prisma)
- Seed readiness:
  - counts `onboardingQuestion` and `onboardingPromptTemplate`
  - considers “ready” if questions ≥ 96 and templates ≥ 16
- Session store health (via `healthCheck` from `@/lib/mcp/session-manager`)

Response shape includes:

- `status: healthy | unhealthy`
- `database: connected | error`
- `seed: { ready, questions, templates }`
- `redis: boolean`
- `sessionStore: string`

Operational meaning:

- Docker / monitoring can treat **503** as “do not route traffic / restart container”.

### MCP health (`/health`)

File:

- `apps/mcp-server/src/index-http.ts`

What it returns:

- `status: healthy`
- `transport: http`
- `toolCount`
- `endpoint: /mcp`

Docker uses it as a healthcheck in dev compose:

- `docker-compose.cloud.yml` has a `healthcheck` for `mcp-server` that calls `http://localhost:3001/health`.

---

## Dev vs prod: ports and “what command runs”

### Dev-like stack (`docker-compose.cloud.yml`)

- Next.js runs `pnpm dev` inside the container.
- MCP runs a built HTTP server (`node dist/index-http.js`) after installing deps.

This gives:

- fast reload
- “pet server” style logs
- less deterministic build output (because install/build happens at container start)

### Prod-like stack (`docker-compose.prod-local.yml`)

- Uses Dockerfiles:
  - `apps/web/Dockerfile.production`
  - `apps/mcp-server/Dockerfile.production`

This gives:

- reproducible images
- slower build, but predictable runtime
- separate port mapping so dev can keep running

---

## Deployment workflow: what the Mac mini actually does

Script:

- `scripts/deploy-prod.sh`

Modes:

- Full deploy: pull → build images → restart containers → smoke tests
- Quick deploy: restart web + mcp containers only
- Test-only: run smoke tests

Smoke tests performed by the script:

- `GET $PROD_URL/api/health` must succeed
- CSS asset is reachable (lightweight static check)
- `GET $MCP_URL/health` must succeed
- `database":"connected"` must appear in `/api/health` output
- `"redis":true` is checked but treated as a warning if missing

Note the “prod-local” defaults used by the script:

- `PROD_URL="http://localhost:8080"`
- `MCP_URL="http://localhost:8081"`

So production deployment is intentionally **scripted** and **verifiable**.

Interview wording:

- “We deploy using a repeatable script: build images, restart services, and run a small set of smoke tests that hit both the web health endpoint and the MCP health endpoint.”

---

## CI/CD tie-in (why this is production readiness)

CI pipeline:

- `.github/workflows/ci.yml`

What it proves:

- Lint/format/type-check gates
- Unit + integration tests run against a real Postgres service
- E2E tests run after:
  - migrations
  - seeding (`prisma/seed-e2e.ts`)
  - `next build`

So your deployment script is not your only safety net—CI prevents obviously broken changes from landing.

---

## Failure modes (and what to check first)

### Port conflicts

Symptoms:

- container won’t start
- “address already in use”

Root causes:

- dev stack uses 3000/3001
- prod-local stack uses 8080/8081

So verify you’re starting the right compose file.

### “Unhealthy” web health

Symptoms:

- `/api/health` returns 503

Root causes:

- DB unreachable (wrong `DATABASE_URL`)
- Seed data not present (questions/templates below thresholds)
- Session store unhealthy (Redis misconfigured or down)

Evidence:

- health logic: `apps/web/app/api/health/route.ts`

### MCP is healthy but tool calls fail

Symptoms:

- MCP `/health` returns 200
- `POST /mcp` tool calls error due to API failures

Root causes:

- MCP’s `PROJECTPULSE_API_URL` points to wrong place
  - dev compose sets it to `http://nextjs:3000`

Evidence:

- `docker-compose.cloud.yml` env for `mcp-server`
- forwarding behavior in MCP: `apps/mcp-server/src/httpClient.ts` (tool calls to web)

### Migration drift

Symptoms:

- runtime starts but endpoints error with missing tables/columns

Root causes:

- migrations not applied

Where it’s handled:

- dev compose `nextjs` command includes `pnpm prisma migrate deploy`
- CI also runs `prisma migrate deploy`
- prod deploy script relies on the prod docker image behavior + restart

---

## Exercises (do later)

### Exercise A: Explain “runtime” in 60 seconds

Constraints:

- you must mention:
  - two entry points
  - the four runtime services
  - at least two concrete ports
  - where health checks are implemented

### Exercise B: Prove the stack is healthy (mentally)

Using:

- `docker-compose.cloud.yml`
- `apps/web/app/api/health/route.ts`
- `apps/mcp-server/src/index-http.ts`

Write down:

- what URLs you would curl
- what you expect back
- what “unhealthy” would mean

### Exercise C: Map deployment → verification

Using `scripts/deploy-prod.sh`, write:

- the 5 smoke tests
- what each smoke test proves

---

## Completion checklist

- [ ] I can name the compose file for dev/runtime (`docker-compose.cloud.yml`).
- [ ] I can name the compose file for prod-local (`docker-compose.prod-local.yml`).
- [ ] I can explain why prod-local uses separate ports.
- [ ] I can explain what `/api/health` checks and why it can return 503.
- [ ] I can explain what `/health` on MCP checks.
- [ ] I can describe the deploy script steps and smoke tests.
