# Day 13 — Testing strategy (unit/integration/E2E for agent workflows)

## Goals (what you should understand today)

By the end of Day 13, you should be able to explain:

1. How ProjectPulse uses a test pyramid (fast unit → integration → E2E).
2. The difference between testing the **human path** (UI ↔ API) and the **agent path** (Agent ↔ MCP ↔ API).
3. Which test frameworks exist in this repo, and exactly where they’re configured.
4. How CI runs tests (and what it assumes about DB state and env vars).
5. Common failure modes (DB, auth state, ports/base URLs) and how to debug them.

---

## The mental model: two “front doors” means two test surfaces

ProjectPulse has two primary entry points:

- **Human UI path**: Browser → Next.js routes/components → Next.js API routes → Prisma → Postgres
- **Agent MCP path**: Agent → MCP server (tools) → Next.js API routes → Prisma → Postgres

So the testing strategy should match the architecture:

- Unit tests: isolate logic (schemas, helpers, ranking functions, utility modules)
- Integration tests: test boundaries (API routes, DB interactions, auth middleware)
- E2E tests: test real workflows end-to-end (browser UI flows and MCP tool flows)

Interview wording:

- “We test the system at the same seams we design it: unit tests for pure logic, integration tests for API↔DB contracts, and E2E tests for the two entrypoints—UI and agent tools.”

---

## What actually exists in this repo (evidence-based)

### Test commands (scripts)

Repo root scripts (delegates to apps/web):

- `package.json`
  - `test`, `test:coverage`, `test:e2e`

Web app scripts:

- `apps/web/package.json`
  - `test`: Jest
  - `test:unit`: Jest filtered by path pattern
  - `test:integration`: Jest filtered by path pattern
  - `test:e2e`: Playwright

MCP server scripts:

- `apps/mcp-server/package.json`
  - `test`: uses `tsx --test` over `src/__tests__` and `src/tools/__tests__`

Note: the MCP repo also contains **Node.js test runner E2E tests** under `apps/mcp-server/tests/e2e/*.test.ts` (run via `node --test ...`), and a smoke test.

---

## Unit tests: “if this breaks, the system breaks”

### Web: Jest config + setup

- `apps/web/jest.config.js`
  - Uses `next/jest`
  - `testEnvironment: 'jest-environment-jsdom'`
  - Ignores E2E: `testPathIgnorePatterns: ['/tests/e2e/']`
  - Collects coverage from:
    - `app/**`, `components/**`, `lib/**`

- `apps/web/jest.setup.js`
  - Loads `.env.test` via `dotenv`
  - Mocks `next/cache` (`revalidatePath`, `revalidateTag`)
  - Mocks ESM-heavy `react-syntax-highlighter` imports
  - Provides browser-y globals for component tests (clipboard, localStorage)

What this tells you:

- Jest is aimed at **component + API logic** and expects a browser-like environment.
- The repo already anticipates “real world” friction (ESM issues, Next cache functions).

### MCP server: unit/integration-ish tests in `src/**/__tests__`

Examples:

- `apps/mcp-server/src/__tests__/bootstrap.test.ts`
  - Uses Node’s built-in runner (`node:test`) and `assert`
  - Tests config defaults and overrides

- `apps/mcp-server/src/tools/__tests__/skill-tools.test.ts`
- `apps/mcp-server/src/tools/__tests__/knowledge-tools.test.ts`

These tests:

- Use Jest globals (`@jest/globals`)
- Mock `global.fetch` to verify:
  - tool schema shape
  - correct API endpoint calls
  - response parsing and error behavior

Key takeaway:

- MCP tool tests are mostly **contract/integration tests against the Next.js API boundary**, but performed with fetch mocking to stay fast.

---

## Integration tests: “does the contract between modules hold?”

### Web integration tests live next to E2E folder

- `apps/web/tests/api/`
  - `sprint-12-features.test.ts`
  - `sprint-12-prisma-test.ts`
  - plus helpers like `create-test-token.ts`

The web app’s `package.json` uses:

- `test:integration`: `jest --testPathPattern=api`

So the intended integration test scope is:

- DB connectivity via Prisma
- API route behavior (or route-adjacent logic)
- “real” environment variables via `.env.test`

### CI integration job: real Postgres via GitHub Actions services

- `.github/workflows/ci.yml`

Notable CI behavior:

- Spins up `postgres:15` service
- Runs:
  - `npx prisma generate`
  - `npx prisma migrate deploy`
  - `npx prisma db seed`
  - then `pnpm test:unit` and `pnpm test:integration`

This is important interview-wise:

- “Our CI reproduces production-ish conditions: we run migrations + seed before tests so integration tests are executed against a real schema.”

---

## E2E tests: “prove the system works as a user / as an agent”

### Browser E2E (Playwright)

Config:

- `apps/web/playwright.config.ts`
  - `testDir: './tests/e2e'`
  - `globalSetup`: `./tests/setup/global-setup.ts`
  - `storageState: '.auth/user.json'`
  - `baseURL`: `process.env.BASE_URL || 'http://192.168.1.15:3000'`

Test suite documentation:

- `apps/web/tests/README.md`
  - Explains folder structure
  - Shows how auth state is created and debugged

What this design means:

- E2E tests assume you can login once, save cookies, then reuse session cookies across tests.
- E2E tests are Docker-first and can target the Mac mini runtime by default.

### MCP tool E2E (Node.js test runner)

- `apps/mcp-server/tests/e2e/tools/health-check.test.ts`
  - Uses `node:test`
  - Uses a custom `MCPTestClient`
  - Runs `projectpulse_health_check` tool and asserts `healthy` + `database: connected`

This is “agent workflow E2E”:

- It tests the actual MCP handshake/tool call flow, not just a single function.

### MCP smoke tests

- `apps/mcp-server/tests/README.md`
- `apps/mcp-server/tests/smoke-test.js`

Smoke tests validate:

- server starts
- JSON-RPC initialize handshake
- tool listing
- (optional) integration with Next.js API when available

---

## Diagram-in-words: how CI proves quality

```
Push/PR
  ↓
GitHub Actions: .github/workflows/ci.yml
  ↓
1) Lint + format + type-check
  ↓
2) Unit + integration tests
   - Start postgres service
   - prisma generate
   - prisma migrate deploy
   - prisma db seed
   - jest unit
   - jest integration
  ↓
3) E2E tests
   - Start postgres service
   - prisma generate
   - prisma migrate deploy
   - seed-e2e
   - next build
   - playwright test
  ↓
4) Build check
```

---

## Failure modes (and how to debug them)

### Playwright failures

- **Auth failures (401 / redirected to login)**
  - Root cause: missing or stale `.auth/user.json`
  - Reference: `apps/web/tests/README.md`

- **Wrong base URL / target origin**
  - Root cause: `BASE_URL` not set correctly
  - Reference: `apps/web/playwright.config.ts`

- **Flaky UI selectors**
  - Fix strategy:
    - add `data-testid`
    - wait for `networkidle`
    - prefer stable roles/text

### Jest failures

- **ESM import problems**
  - The repo already works around this in `apps/web/jest.setup.js` by mocking syntax highlighter modules.

- **Missing environment variables**
  - Root cause: `.env.test` missing or not loaded
  - Reference: `apps/web/jest.setup.js` loads `.env.test`

### DB failures (local or CI)

- **Prisma can’t connect**
  - Root cause: Postgres not reachable / wrong `DATABASE_URL`
  - CI proof: `.github/workflows/ci.yml` uses `localhost:5432` service DB URLs

### MCP E2E failures

- **MCP server not running**
  - You’ll see connection errors from `MCPTestClient`
  - Reference: `apps/mcp-server/tests/e2e/tools/health-check.test.ts`

- **Web API not reachable from MCP server**
  - Root cause: MCP config points at wrong `PROJECTPULSE_API_URL`
  - Reference: `docker-compose.cloud.yml` sets `PROJECTPULSE_API_URL=http://nextjs:3000`

---

## Exercises (do later)

### Exercise A: Write your own “test pyramid” explanation

Write 8–10 sentences answering:

- What do unit tests cover in ProjectPulse?
- What’s an integration test boundary?
- What makes an E2E test “worth it” in an agent-first system?

Constraints:

- include at least 3 file path references.

### Exercise B: Trace one E2E test end-to-end

Pick one:

- Browser: `apps/web/tests/e2e/*`
- MCP: `apps/mcp-server/tests/e2e/tools/health-check.test.ts`

Then write:

- “what request goes over the wire?”
- “what is the asserted output?”
- “what are the dependencies (DB, auth, baseURL)?”

### Exercise C: Explain CI like an interviewer

Using `.github/workflows/ci.yml`, describe:

- what runs first
- what blocks merges
- what guarantees the DB schema is correct

---

## Completion checklist

- [ ] I can explain why ProjectPulse needs both browser E2E and MCP tool E2E.
- [ ] I can point to Jest + Playwright configs.
- [ ] I can explain how CI seeds databases before tests.
- [ ] I can debug the top 3 failures: DB, auth state, base URL.
