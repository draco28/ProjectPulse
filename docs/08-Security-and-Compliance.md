# Security and Compliance

**Project:** ProjectPulse
**Version:** 2.0.0 (Agent-First Architecture)
**Created:** 2025-11-02
**Status:** Active
**Security Classification:** Internal Use Only

---

## Document Purpose

This document defines the complete security and compliance strategy for ProjectPulse, an agent-first project management platform. Security considerations are critical because AI agents (Claude Code, Cursor AI, Codex) execute operations autonomously via MCP, requiring robust safeguards against unintended actions, data corruption, and unauthorized access.

**Security Philosophy:**

1. **Defense in Depth:** Multiple layers of protection (autonomy levels, validation, audit trail, rollback)
2. **Least Privilege:** Agents start with minimal permissions (Level 0), escalate only as needed
3. **Audit Everything:** All agent actions logged with full traceability
4. **Local-First Security:** No external network access required, reduces attack surface
5. **Fail-Safe Defaults:** Operations require explicit approval by default

**Related Documents:**

- [02-SRS.md](02-SRS.md) - Security NFRs (NFR-013 to NFR-019)
- [03-Architecture.md](03-Architecture.md) - Security architecture
- [05-AgentOps-Plan.md](05-AgentOps-Plan.md) - Autonomy levels, error handling
- [09-Testing-and-QA.md](09-Testing-and-QA.md) - Security testing strategy

---

## Table of Contents

1. [Threat Model (STRIDE Analysis)](#1-threat-model-stride-analysis)
2. [Autonomy Levels & Approval Workflows](#2-autonomy-levels--approval-workflows)
3. [Security Controls](#3-security-controls)
4. [Secrets Management & Data Protection](#4-secrets-management--data-protection)
5. [Audit Trail & Logging](#5-audit-trail--logging)
6. [Privacy Compliance (GDPR)](#6-privacy-compliance-gdpr)
7. [Security Testing Strategy](#7-security-testing-strategy)
8. [Incident Response](#8-incident-response)
9. [Security Requirements Traceability](#9-security-requirements-traceability)

---

## 1. Threat Model (STRIDE Analysis)

### 1.1 Overview

ProjectPulse uses the **STRIDE threat modeling framework** to identify and mitigate security threats:

- **S**poofing Identity
- **T**ampering with Data
- **R**epudiation
- **I**nformation Disclosure
- **D**enial of Service
- **E**levation of Privilege

### 1.2 Threat Analysis

#### 1.2.1 Spoofing Identity

| Threat                             | Description                                  | Likelihood | Impact | Mitigation                                       | Status       |
| ---------------------------------- | -------------------------------------------- | ---------- | ------ | ------------------------------------------------ | ------------ |
| **T-001: MCP Impersonation**       | Malicious process spoofs MCP server identity | Low        | High   | stdio transport (local process only, no network) | ✅ Mitigated |
| **T-002: Agent Identity Spoofing** | Rogue agent masquerades as legitimate agent  | Low        | Medium | AgentAction.agentType field tracks origin        | ✅ Mitigated |
| **T-003: Session Hijacking**       | Attacker intercepts agent session            | Very Low   | Medium | Local-only (no network), single-user system      | ✅ Mitigated |

**Key Mitigations:**

- **stdio Transport:** MCP server communicates via standard input/output (not network sockets), preventing remote attacks
- **Local-Only Deployment:** No external network access required, eliminates remote spoofing vectors
- **Agent Type Tracking:** Every action logs `agentType` field (e.g., "Claude Code", "Cursor AI")

**Requirements:** NFR-013 (MCP Security)

---

#### 1.2.2 Tampering with Data

| Threat                           | Description                                                           | Likelihood | Impact   | Mitigation                                                        | Status       |
| -------------------------------- | --------------------------------------------------------------------- | ---------- | -------- | ----------------------------------------------------------------- | ------------ |
| **T-004: Database Corruption**   | Agent or human corrupts database via invalid operations               | Medium     | Critical | Prisma ORM with strict validation, Zod schemas                    | ✅ Mitigated |
| **T-005: Markdown Injection**    | Agent or human injects malicious content into auto-generated markdown | Low        | Medium   | Git pre-commit hooks validate markdown, read-only files           | ✅ Mitigated |
| **T-006: Progress Rollback**     | Agent accidentally decreases progress percentage                      | Low        | Low      | Progress validation: only allow increases (except admin override) | ✅ Mitigated |
| **T-007: Foreign Key Violation** | Agent creates orphaned records (Week without Phase)                   | Low        | Medium   | Database foreign key constraints enforced                         | ✅ Mitigated |
| **T-008: SQL Injection**         | Attacker injects SQL via MCP tool parameters                          | Very Low   | Critical | Prisma ORM (parameterized queries), no raw SQL                    | ✅ Mitigated |

**Key Mitigations:**

- **Prisma ORM:** All database access via Prisma (parameterized queries), prevents SQL injection
- **Zod Validation:** All MCP tool inputs validated with Zod schemas before database access
- **Database as Source of Truth:** Markdown files auto-generated from database, preventing inconsistencies (see [ADR-002](architecture/ADRs/ADR-002-database-as-source-of-truth.md))
- **Git Hooks:** Pre-commit validation prevents manual edits to protected markdown files
- **Foreign Key Constraints:** PostgreSQL enforces referential integrity

**Requirements:** NFR-014 (Input Validation), NFR-019 (Git Hook Enforcement)

---

#### 1.2.3 Repudiation

| Threat                         | Description                                   | Likelihood | Impact | Mitigation                                            | Status       |
| ------------------------------ | --------------------------------------------- | ---------- | ------ | ----------------------------------------------------- | ------------ |
| **T-009: Agent Denies Action** | Agent denies performing destructive operation | Low        | Medium | AgentAction table logs all operations with timestamps | ✅ Mitigated |
| **T-010: Missing Audit Trail** | Critical action not logged                    | Low        | High   | All MCP tools log to AgentAction before executing     | ✅ Mitigated |
| **T-011: Audit Log Tampering** | Attacker modifies audit logs                  | Very Low   | High   | AgentAction table append-only (no UPDATE or DELETE)   | ✅ Mitigated |

**Key Mitigations:**

- **Comprehensive Audit Trail:** All agent actions logged to `AgentAction` table with:
  - `actionType` (e.g., "issues.create", "sprint.updateProgress")
  - `feature` (e.g., "issues", "sprint")
  - `entityId` (affected record ID)
  - `payload` (input parameters, JSON)
  - `result` (output data, JSON)
  - `success` (boolean)
  - `timestamp` (ISO 8601)
  - `agentType` (e.g., "Claude Code")
  - `autonomyLevel` (0-4)

- **Append-Only Logs:** AgentAction table has no UPDATE or DELETE operations (only INSERT)
- **Database Transactions:** All operations atomic, either fully logged or fully rolled back

**Requirements:** NFR-017 (Audit Trail)

---

#### 1.2.4 Information Disclosure

| Threat                                         | Description                                          | Likelihood | Impact   | Mitigation                                                 | Status       |
| ---------------------------------------------- | ---------------------------------------------------- | ---------- | -------- | ---------------------------------------------------------- | ------------ |
| **T-012: Sensitive Data in Logs**              | Secrets, passwords, API keys logged to AgentAction   | Medium     | High     | Redaction filter removes sensitive fields before logging   | ✅ Mitigated |
| **T-013: Database Connection String Exposure** | DATABASE_URL leaked in error messages or logs        | Low        | Critical | Environment variables only, never logged or exposed in UI  | ✅ Mitigated |
| **T-014: Embedding API Key Leak**              | OpenAI API key exposed                               | Low        | Medium   | Environment variables, optional (can use local embeddings) | ✅ Mitigated |
| **T-015: Markdown File Disclosure**            | Sensitive project details in auto-generated markdown | Low        | Low      | Local-only deployment, no public access                    | ✅ Mitigated |

**Key Mitigations:**

- **Secrets Management:** All sensitive data in environment variables (.env file, never committed to git)
- **Redaction Filtering:** Before logging to AgentAction, redact fields:
  - `password`, `apiKey`, `secret`, `token`, `connectionString`, `databaseUrl`
  - Replace with: `"[REDACTED]"`

- **Error Message Sanitization:** Error messages never include secrets or stack traces in production
- **Local-Only Deployment:** No public network access, reduces disclosure risk

**Requirements:** NFR-015 (Secrets Management)

---

#### 1.2.5 Denial of Service

| Threat                                    | Description                                                    | Likelihood | Impact | Mitigation                                                                     | Status       |
| ----------------------------------------- | -------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------ | ------------ |
| **T-016: MCP Tool Flood**                 | Agent calls 1000+ MCP tools simultaneously, exhausts resources | Low        | Medium | Queue limit: 50 concurrent MCP calls, throttle excess                          | ✅ Mitigated |
| **T-017: Database Connection Exhaustion** | Too many queries, PostgreSQL connections exhausted             | Low        | Medium | Prisma connection pooling (default 10 connections)                             | ✅ Mitigated |
| **T-018: Embedding API Rate Limit**       | Too many embedding requests, OpenAI throttles API              | Medium     | Low    | Debounce embedding generation (max 1 per second), fallback to full-text search | ✅ Mitigated |
| **T-019: Markdown Sync Storm**            | 100+ progress updates trigger 100+ markdown syncs              | Low        | Low    | Debounce sync (max 1 sync per 5 seconds), batch updates                        | ✅ Mitigated |
| **T-020: Recursive Knowledge Query**      | Agent queries knowledge graph in infinite loop                 | Very Low   | Medium | Max depth 2 hops enforced in knowledge.query()                                 | ✅ Mitigated |

**Key Mitigations:**

- **MCP Tool Queue:** Limit 50 concurrent tool calls, queue excess (FIFO)
- **Prisma Connection Pooling:** Default 10 connections, prevents exhaustion
- **Debouncing:**
  - Markdown sync: max 1 sync per 5 seconds
  - Embedding generation: max 1 per second
- **Timeouts:**
  - MCP tool execution: 10s timeout
  - Database query: 5s timeout
  - Embedding API: 10s timeout
- **Rate Limiting:** (Future enhancement for multi-user)

**Requirements:** NFR-021 (Data Volume Targets)

---

#### 1.2.6 Elevation of Privilege

| Threat                            | Description                                                          | Likelihood | Impact | Mitigation                                                                    | Status       |
| --------------------------------- | -------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------- | ------------ |
| **T-021: Autonomy Level Bypass**  | Agent bypasses autonomy level check, executes unauthorized operation | Low        | High   | All MCP tools check `requiredLevel` vs `agent.autonomyLevel` before execution | ✅ Mitigated |
| **T-022: Approval Workflow Skip** | Agent executes Level 2 operation without human approval              | Low        | High   | Approval token required for Level 2 operations, validated server-side         | ✅ Mitigated |
| **T-023: Admin Override Abuse**   | Agent or human abuses `--no-verify` git hook override                | Low        | Medium | Override logged to AgentAction, requires manual command-line flag             | ✅ Mitigated |
| **T-024: Prototype Pollution**    | Agent injects `__proto__` into JSON payloads                         | Very Low   | Medium | TypeScript strict mode, Zod validation blocks prototype pollution             | ✅ Mitigated |

**Key Mitigations:**

- **Autonomy Level Enforcement:** All MCP tools check `agent.autonomyLevel` before executing
- **Approval Workflow:** Level 2 operations require human approval token (generated via UI)
- **TypeScript Strict Mode:** Prevents prototype pollution attacks
- **Zod Validation:** All inputs validated, rejects `__proto__`, `constructor`, `prototype` keys
- **Git Hook Logging:** All `--no-verify` overrides logged to AgentAction

**Requirements:** NFR-016 (Autonomy Levels)

---

### 1.3 Threat Summary

| Category               | Total Threats | Mitigated | Accepted Risk | Open  |
| ---------------------- | ------------- | --------- | ------------- | ----- |
| Spoofing               | 3             | 3         | 0             | 0     |
| Tampering              | 5             | 5         | 0             | 0     |
| Repudiation            | 3             | 3         | 0             | 0     |
| Information Disclosure | 4             | 4         | 0             | 0     |
| Denial of Service      | 5             | 5         | 0             | 0     |
| Elevation of Privilege | 4             | 4         | 0             | 0     |
| **Total**              | **24**        | **24**    | **0**         | **0** |

**Risk Acceptance:** No threats accepted. All threats mitigated to acceptable levels for local-first, single-user deployment.

---

## 2. Autonomy Levels & Approval Workflows

### 2.1 Overview

ProjectPulse implements a **5-level autonomy system** (L0-L4) to control agent permissions. Agents start at **Level 0 (Read-Only)** by default and escalate permissions only as needed.

**Design Goals:**

1. **Least Privilege:** Agents have minimal permissions by default
2. **Explicit Approval:** Destructive operations require human approval
3. **Traceability:** All autonomy level changes logged
4. **Fail-Safe:** Operations fail closed (deny by default)

### 2.2 Autonomy Level Definitions

#### Level 0: Read-Only (Default)

**Permissions:**

- Read all data (issues, knowledge, wiki, sprint progress)
- List resources (projects, phases, workflows)
- Query knowledge graph (semantic + full-text search)
- Generate reports (health reports, dashboard metrics)

**Prohibited:**

- Create, update, or delete any records
- Execute workflows
- Modify schema or configuration

**MCP Tools (Level 0):**

- `issues.list({ filters })`
- `issues.get({ issueId })`
- `knowledge.query({ query })`
- `sprint.getProgress({ phaseId })`
- `dashboard.metrics()`
- `health.getReport({ reportId })`

**Use Cases:**

- Initial agent exploration of project state
- Read-only analysis and reporting
- Dashboard monitoring

**Agent Type:** All agents start at Level 0 by default

---

#### Level 1: Safe Writes (Standard Operations)

**Permissions:**

- All Level 0 permissions
- Create issues (single or bulk)
- Update issue status (open → in_progress → done)
- Add knowledge items
- Create wiki pages
- Update progress percentages
- Execute standard workflows (checkpoint, issue creation)

**Prohibited:**

- Delete any records
- Modify schema or database structure
- Execute infrastructure operations
- Override validation rules

**MCP Tools (Level 1):**

- `issues.create({ title, description })`
- `issues.bulkCreate({ issues[] })`
- `issues.update({ issueId, updates })`
- `knowledge.add({ content, tags })`
- `sprint.updateProgress({ taskId, progress })`
- `workflow.start({ workflowType })`
- `wiki.createPage({ title, content })`

**Use Cases:**

- Standard agent workflows (5-step protocol)
- Issue tracking and management
- Knowledge graph population
- Progress updates

**Agent Type:** Agents with proven reliability, after human verification of initial Level 0 exploration

---

#### Level 2: Approval Required (Destructive Operations)

**Permissions:**

- All Level 1 permissions
- Delete issues, knowledge items, wiki pages (with approval)
- Modify database schema (with approval)
- Bulk delete operations (with approval)
- Execute advanced workflows (with approval)

**Prohibited:**

- Infrastructure changes (deployment, migrations)
- Production database modifications
- Git force push, hard reset

**Approval Workflow:**

1. Agent attempts Level 2 operation → System returns `PERMISSION_DENIED` error
2. Agent requests human approval via UI:
   ```json
   {
     "error": "PERMISSION_DENIED",
     "message": "Operation requires Level 2 approval",
     "requiredLevel": 2,
     "currentLevel": 1,
     "approvalUrl": "http://localhost:3000/approve?action=issues.delete&issueId=123"
   }
   ```
3. Human reviews operation in UI → Approves or denies
4. If approved → System generates approval token (JWT, expires in 5 minutes)
5. Agent retries operation with approval token → Success

**MCP Tools (Level 2):**

- `issues.delete({ issueId, approvalToken })`
- `issues.bulkDelete({ issueIds[], approvalToken })`
- `knowledge.delete({ itemId, approvalToken })`
- `wiki.deletePage({ pageId, approvalToken })`
- `sprint.archivePhase({ phaseId, approvalToken })`

**Use Cases:**

- Cleanup operations (delete obsolete issues)
- Schema refactoring (add/modify database fields)
- Bulk operations (archive completed phases)

**Agent Type:** Trusted agents with extensive history of successful operations

---

#### Level 3: Infrastructure (Advanced Operations)

**Permissions:**

- All Level 2 permissions
- Deploy application (production or staging)
- Run database migrations
- Modify PostgreSQL schema directly
- Execute git operations (commit, push, merge)
- Modify environment variables

**Prohibited:**

- Destructive operations without approval
- Git force push to main branch
- Drop database tables

**Approval Workflow:**

- Same as Level 2, but with additional confirmation step:
  1. Agent requests approval
  2. Human reviews operation in UI
  3. Human confirms via CLI command: `pnpm devhub:approve <token>`
  4. Agent retries operation with approval token

**MCP Tools (Level 3):**

- `deploy.production({ version, approvalToken })`
- `database.migrate({ migrationFile, approvalToken })`
- `git.commit({ message, files[], approvalToken })`
- `git.push({ branch, approvalToken })`

**Use Cases:**

- Continuous deployment (agent-driven releases)
- Database migrations (agent-generated schema changes)
- Git automation (agent commits documentation updates)

**Agent Type:** Reserved for future advanced agent capabilities (not implemented in MVP)

---

#### Level 4: Full Autonomy (Future)

**Permissions:**

- All Level 3 permissions
- Full autonomy (no approval required)
- Self-modification (agent can update its own behavior)
- Complete project lifecycle (planning → development → deployment → monitoring)

**Approval Workflow:**

- None (full trust)

**MCP Tools (Level 4):**

- All tools available without approval

**Use Cases:**

- Future vision: Agent completes entire features autonomously
- Self-healing systems (agent detects and fixes issues)
- Continuous improvement (agent optimizes its own workflows)

**Agent Type:** Reserved for future research (not implemented in MVP)

**Note:** Level 4 is aspirational. Current MVP focuses on Levels 0-2.

---

### 2.3 Autonomy Level Enforcement

#### 2.3.1 MCP Tool Validation

Every MCP tool checks autonomy level before executing:

```typescript
// Example: issues.delete() tool implementation
async function issuesDelete({ issueId, approvalToken }, agent) {
  // Step 1: Check autonomy level
  const requiredLevel = 2;
  if (agent.autonomyLevel < requiredLevel) {
    return {
      error: 'PERMISSION_DENIED',
      message: `Operation requires Level ${requiredLevel}, agent has Level ${agent.autonomyLevel}`,
      requiredLevel,
      currentLevel: agent.autonomyLevel,
      approvalUrl: `/approve?action=issues.delete&issueId=${issueId}`,
    };
  }

  // Step 2: Validate approval token (if Level 2)
  if (requiredLevel === 2) {
    const isValid = await validateApprovalToken(approvalToken, 'issues.delete', issueId);
    if (!isValid) {
      return {
        error: 'INVALID_APPROVAL_TOKEN',
        message: 'Approval token missing, invalid, or expired',
      };
    }
  }

  // Step 3: Log action to audit trail (before executing)
  await logAgentAction({
    actionType: 'issues.delete',
    feature: 'issues',
    entityId: issueId,
    payload: { issueId, approvalToken: '[REDACTED]' },
    agentType: agent.type,
    autonomyLevel: agent.autonomyLevel,
    timestamp: new Date(),
  });

  // Step 4: Execute operation
  const deletedIssue = await prisma.issue.delete({ where: { id: issueId } });

  // Step 5: Log result
  await logAgentAction({
    actionType: 'issues.delete',
    feature: 'issues',
    entityId: issueId,
    payload: { issueId },
    result: deletedIssue,
    success: true,
    agentType: agent.type,
    autonomyLevel: agent.autonomyLevel,
    timestamp: new Date(),
  });

  return { success: true, deletedIssue };
}
```

#### 2.3.2 Approval Token Generation

Human approves operation via UI → System generates JWT token:

```typescript
import jwt from 'jsonwebtoken';

function generateApprovalToken(action, entityId, userId) {
  const payload = {
    action, // e.g., "issues.delete"
    entityId, // e.g., 123
    userId, // Human approver ID
    timestamp: Date.now(),
  };

  // Expires in 5 minutes
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5m' });
}

function validateApprovalToken(token, expectedAction, expectedEntityId) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check action matches
    if (decoded.action !== expectedAction) return false;

    // Check entity ID matches
    if (decoded.entityId !== expectedEntityId) return false;

    // Token valid and not expired
    return true;
  } catch (error) {
    // Token invalid or expired
    return false;
  }
}
```

#### 2.3.3 Autonomy Level Upgrade

Agents can request autonomy level upgrades (manual process, not automated):

1. Agent demonstrates reliability at current level (e.g., 100+ successful Level 0 operations)
2. Human reviews agent's audit log (success rate, error types)
3. Human approves upgrade via CLI: `pnpm devhub:upgrade-agent <agentId> <newLevel>`
4. System updates agent's `autonomyLevel` in database
5. All future operations use new autonomy level

**Upgrade Criteria:**

- **L0 → L1:** 100+ successful read operations, 0 errors
- **L1 → L2:** 500+ successful write operations, <1% error rate
- **L2 → L3:** 1000+ operations, <0.1% error rate, 6+ months history (future)

---

### 2.4 Rollback System (Level 1 Operations)

Level 1 operations are **reversible** via the Rollback system.

#### 2.4.1 Rollback Table Schema

```typescript
model Rollback {
  id            Int      @id @default(autoincrement())
  actionId      Int      @unique // Foreign key to AgentAction
  beforeState   Json     // State before operation (full record)
  afterState    Json     // State after operation (full record)
  rolledBack    Boolean  @default(false)
  rolledBackAt  DateTime?
  rolledBackBy  String?  // Human user who initiated rollback
  createdAt     DateTime @default(now())
}
```

#### 2.4.2 Rollback Workflow

1. Agent executes Level 1 operation (e.g., `issues.update()`)
2. System captures `beforeState` (issue before update)
3. System executes operation → Captures `afterState` (issue after update)
4. System stores Rollback record
5. Human detects issue → Reviews audit log → Initiates rollback via UI
6. System restores `beforeState` → Marks rollback complete

**Example:**

```typescript
// Agent updates issue priority: low → high
await mcp.call('issues.update', {
  issueId: 123,
  updates: { priority: 'high' }
});

// System stores rollback:
{
  actionId: 456,
  beforeState: { id: 123, priority: 'low', ... },
  afterState: { id: 123, priority: 'high', ... },
  rolledBack: false
}

// Human realizes mistake → Initiates rollback via UI
await rollbackAction(456);

// System restores issue to beforeState:
await prisma.issue.update({
  where: { id: 123 },
  data: { priority: 'low', ... }
});
```

#### 2.4.3 Rollback Limitations

- **Level 0:** No rollback (read-only operations)
- **Level 1:** Full rollback support
- **Level 2:** Rollback requires approval (destructive operations)
- **Level 3:** No rollback (infrastructure changes irreversible)
- **Level 4:** No rollback (future)

**Requirements:** NFR-018 (Rollback Capability)

---

## 3. Security Controls

### 3.1 Input Validation

#### 3.1.1 Zod Validation Schemas

All MCP tool inputs validated with Zod schemas:

```typescript
import { z } from 'zod';

// Example: issues.create() input schema
const IssueCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  labels: z.array(z.string()).max(10).optional(),
  assignee: z.string().email().optional(),
  dueDate: z.string().datetime().optional(),
});

// Validate input before processing
const issueData = IssueCreateSchema.parse(input);
```

**Validation Rules:**

- **Title:** 1-500 characters
- **Description:** 1-5000 characters
- **Priority:** Enum (low, medium, high, critical)
- **Labels:** Max 10 labels per issue
- **Email:** RFC 5322 compliant
- **Datetime:** ISO 8601 format

**Error Handling:**

```typescript
try {
  const issueData = IssueCreateSchema.parse(input);
} catch (error) {
  return {
    error: 'VALIDATION_ERROR',
    message: error.errors[0].message,
    field: error.errors[0].path,
    code: 400,
  };
}
```

**Requirements:** NFR-014 (Input Validation)

---

#### 3.1.2 SQL Injection Prevention

**Mitigation:** Prisma ORM (parameterized queries)

All database access via Prisma → No raw SQL → SQL injection impossible.

**Example (Safe):**

```typescript
// Safe: Prisma generates parameterized query
await prisma.issue.findMany({
  where: { title: { contains: userInput } },
});

// Generated SQL (parameterized):
// SELECT * FROM "Issue" WHERE "title" LIKE $1
// Parameters: ['%userInput%']
```

**Example (Unsafe - Prohibited):**

```typescript
// PROHIBITED: Raw SQL with string interpolation
await prisma.$queryRaw`SELECT * FROM "Issue" WHERE title LIKE '%${userInput}%'`;
// ❌ Never use this pattern
```

**Requirements:** NFR-013 (SQL Injection Prevention)

---

### 3.2 Output Encoding

#### 3.2.1 XSS Prevention (React)

React auto-escapes all values by default:

```tsx
// Safe: React escapes userContent
<div>{issue.description}</div>

// Generated HTML:
// <div>&lt;script&gt;alert('XSS')&lt;/script&gt;</div>
```

**Dangerous Patterns (Prohibited):**

```tsx
// ❌ PROHIBITED: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />;

// ❌ PROHIBITED: eval()
eval(userInput);

// ❌ PROHIBITED: new Function()
new Function(userInput)();
```

**Requirements:** NFR-014 (XSS Prevention)

---

#### 3.2.2 Content Security Policy (CSP)

Next.js middleware enforces Content Security Policy:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Next.js requires unsafe-inline
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  return response;
}
```

**Requirements:** NFR-014 (XSS Prevention)

---

### 3.3 CSRF Protection

#### 3.3.1 SameSite Cookies

All cookies use `SameSite=Strict`:

```typescript
// Example: Approval token cookie
response.cookies.set('approvalToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 300, // 5 minutes
});
```

**Requirements:** NFR-014 (CSRF Protection)

---

### 3.4 Prototype Pollution Prevention

#### 3.4.1 TypeScript Strict Mode

`tsconfig.json` enforces strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

#### 3.4.2 Zod Validation (Object Keys)

Zod schemas reject dangerous keys:

```typescript
const SafeObjectSchema = z
  .object({
    title: z.string(),
    description: z.string(),
  })
  .strict(); // Reject unknown keys

// Rejects input with __proto__, constructor, prototype
const result = SafeObjectSchema.safeParse({
  title: 'Issue',
  __proto__: { isAdmin: true }, // ❌ Rejected
});
```

**Requirements:** NFR-014 (Input Validation)

---

## 4. Secrets Management & Data Protection

### 4.1 Environment Variables

All secrets stored in `.env` file (never committed to git):

```bash
# .env (example)
DATABASE_URL="postgresql://user:password@localhost:5432/moksha_devhub"
OPENAI_API_KEY="sk-..."
JWT_SECRET="random-256-bit-secret"
```

**Best Practices:**

- **Never commit `.env`:** Add to `.gitignore`
- **Rotate secrets regularly:** Every 90 days
- **Use strong secrets:** 256-bit random values for JWT_SECRET
- **Limit secret scope:** Separate dev/staging/production secrets

**Requirements:** NFR-015 (Secrets Management)

---

### 4.2 Secrets Redaction (Audit Logs)

Before logging to AgentAction, redact sensitive fields:

```typescript
function redactSecrets(payload: any): any {
  const sensitiveKeys = [
    'password',
    'apiKey',
    'secret',
    'token',
    'connectionString',
    'databaseUrl',
    'jwt',
  ];

  const redacted = { ...payload };

  for (const key of Object.keys(redacted)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      redacted[key] = '[REDACTED]';
    }
  }

  return redacted;
}

// Example usage
await logAgentAction({
  actionType: 'issues.create',
  payload: redactSecrets({ title: 'Issue', apiKey: 'sk-123' }),
  // Logged as: { title: "Issue", apiKey: "[REDACTED]" }
});
```

**Requirements:** NFR-015 (Secrets Management)

---

### 4.3 Data Encryption

#### 4.3.1 Data at Rest

PostgreSQL data encryption:

- **Local Development:** No encryption (acceptable for local-only deployment)
- **Production (Future):** PostgreSQL Transparent Data Encryption (TDE) or full-disk encryption

#### 4.3.2 Data in Transit

- **MCP Communication:** stdio transport (no network, no encryption needed)
- **HTTP Communication:** HTTPS in production (localhost uses HTTP in development)
- **Database Communication:** PostgreSQL SSL/TLS in production

**Requirements:** NFR-015 (Data Protection)

---

## 5. Audit Trail & Logging

### 5.1 AgentAction Table

All agent operations logged to `AgentAction` table:

```typescript
model AgentAction {
  id            Int      @id @default(autoincrement())
  actionType    String   // e.g., "issues.create", "sprint.updateProgress"
  feature       String   // e.g., "issues", "sprint", "knowledge"
  entityId      Int?     // Affected record ID (e.g., issueId, phaseId)
  payload       Json     // Input parameters (redacted)
  result        Json?    // Output data (redacted)
  success       Boolean  // Operation succeeded?
  errorMessage  String?  // Error message if failed
  agentType     String   // e.g., "Claude Code", "Cursor AI", "Codex"
  autonomyLevel Int      // 0-4
  timestamp     DateTime @default(now())
}
```

**Logged Actions:**

- All MCP tool calls (100% coverage)
- Autonomy level checks
- Approval workflows
- Rollback operations
- Git hook overrides

**Requirements:** NFR-017 (Audit Trail)

---

### 5.2 Audit Log Queries

#### 5.2.1 View All Actions by Agent

```typescript
const actions = await prisma.agentAction.findMany({
  where: { agentType: 'Claude Code' },
  orderBy: { timestamp: 'desc' },
  take: 100,
});
```

#### 5.2.2 View Failed Operations

```typescript
const failures = await prisma.agentAction.findMany({
  where: { success: false },
  orderBy: { timestamp: 'desc' },
});
```

#### 5.2.3 View Actions Requiring Approval

```typescript
const approvals = await prisma.agentAction.findMany({
  where: {
    autonomyLevel: 2,
    actionType: { in: ['issues.delete', 'knowledge.delete'] },
  },
});
```

---

### 5.3 Log Retention

- **Retention Period:** Unlimited (local database, no storage cost)
- **Archive Strategy:** (Future) Export logs to JSON after 1 year
- **Deletion Policy:** Manual deletion only (no automatic purge)

**Requirements:** NFR-017 (Audit Trail)

---

## 6. Privacy Compliance (GDPR)

### 6.1 Overview

ProjectPulse is **local-first** (no cloud storage), which simplifies GDPR compliance. However, privacy best practices are still followed.

### 6.2 GDPR Principles

| Principle                              | Implementation                                                      | Status       |
| -------------------------------------- | ------------------------------------------------------------------- | ------------ |
| **Lawfulness, Fairness, Transparency** | Solo developer (no external users), clear documentation             | ✅ Compliant |
| **Purpose Limitation**                 | Data used only for project management, no secondary use             | ✅ Compliant |
| **Data Minimization**                  | Collect only necessary data (issue titles, descriptions, progress)  | ✅ Compliant |
| **Accuracy**                           | Agents and humans can update data, rollback system ensures accuracy | ✅ Compliant |
| **Storage Limitation**                 | Unlimited retention (local database, user controls deletion)        | ✅ Compliant |
| **Integrity & Confidentiality**        | Local-only deployment, no external access, audit trail              | ✅ Compliant |
| **Accountability**                     | Audit trail (AgentAction), rollback system, clear ownership         | ✅ Compliant |

---

### 6.3 Data Subject Rights

| Right                            | Implementation                                              | Status       |
| -------------------------------- | ----------------------------------------------------------- | ------------ |
| **Right to Access**              | Human can query database directly or via UI                 | ✅ Compliant |
| **Right to Rectification**       | Agents and humans can update records via MCP tools or UI    | ✅ Compliant |
| **Right to Erasure**             | Human can delete records via UI (requires Level 2 approval) | ✅ Compliant |
| **Right to Restrict Processing** | Human can pause agent operations via UI                     | ✅ Compliant |
| **Right to Data Portability**    | Export database to JSON/CSV via UI                          | ⚠️ Future    |
| **Right to Object**              | Human can override agent decisions via UI                   | ✅ Compliant |

---

### 6.4 Personal Data Handling

**Personal Data Stored:**

- Developer name (optional, in git commits)
- Email address (optional, for issue assignees)
- Agent type (e.g., "Claude Code")

**No Personal Data Collected:**

- No user authentication (solo developer)
- No cookies (except approval tokens, expires in 5 minutes)
- No tracking or analytics
- No third-party integrations (except optional OpenAI embeddings)

**Data Sharing:**

- **Internal:** No data shared (local-only deployment)
- **External:** Optional OpenAI API (embeddings only, no personal data)

---

### 6.5 Data Breach Notification

**Risk:** Very low (local-only deployment, no external access)

**Procedure (if breach occurs):**

1. Identify scope of breach (which data exposed?)
2. Contain breach (disconnect network, stop services)
3. Assess impact (personal data affected?)
4. If personal data affected → Notify affected individuals within 72 hours (GDPR Article 33)
5. Document breach in incident log
6. Implement preventive measures

**Requirements:** NFR-015 (Data Protection)

---

## 7. Security Testing Strategy

### 7.1 Security Test Categories

| Category                     | Frequency            | Tools                    | Coverage           |
| ---------------------------- | -------------------- | ------------------------ | ------------------ |
| **Static Analysis**          | Every commit (CI/CD) | ESLint, TypeScript, Zod  | 100% codebase      |
| **Dependency Scanning**      | Daily                | npm audit, Snyk          | All dependencies   |
| **Input Validation Testing** | Every release        | Jest + custom test suite | All MCP tools      |
| **Autonomy Level Testing**   | Every release        | Jest + E2E tests         | All levels (L0-L2) |
| **Penetration Testing**      | Quarterly            | Manual testing           | Critical paths     |

---

### 7.2 Static Analysis

#### 7.2.1 ESLint Security Rules

`.eslintrc.json` includes security rules:

```json
{
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-object-injection": "error",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-eval-with-expression": "error"
  }
}
```

#### 7.2.2 TypeScript Strict Mode

All code compiled with `strict: true` → Prevents common vulnerabilities.

---

### 7.3 Dependency Scanning

#### 7.3.1 npm audit

Run daily in CI/CD:

```bash
npm audit --audit-level=moderate
```

**Action Threshold:**

- **Critical vulnerabilities:** Block deployment
- **High vulnerabilities:** Review and patch within 7 days
- **Moderate/Low:** Review and patch within 30 days

#### 7.3.2 Snyk Scanning

Optional: Integrate Snyk for advanced dependency scanning.

---

### 7.4 Input Validation Testing

Test all MCP tools with invalid inputs:

```typescript
// Test: issues.create() with invalid input
describe('issues.create - input validation', () => {
  it('should reject title longer than 500 characters', async () => {
    const result = await mcp.call('issues.create', {
      title: 'x'.repeat(501),
      description: 'Test',
    });

    expect(result.error).toBe('VALIDATION_ERROR');
    expect(result.message).toContain('title');
  });

  it('should reject SQL injection in title', async () => {
    const result = await mcp.call('issues.create', {
      title: "'; DROP TABLE Issue; --",
      description: 'Test',
    });

    // Should succeed (Prisma escapes input)
    expect(result.success).toBe(true);

    // Verify database not corrupted
    const issues = await prisma.issue.findMany();
    expect(issues.length).toBeGreaterThan(0);
  });
});
```

---

### 7.5 Autonomy Level Testing

Test that autonomy levels are enforced:

```typescript
describe('Autonomy Level Enforcement', () => {
  it('should deny Level 2 operation for Level 1 agent', async () => {
    const agent = { autonomyLevel: 1, type: 'Claude Code' };

    const result = await mcp.call(
      'issues.delete',
      {
        issueId: 123,
      },
      agent
    );

    expect(result.error).toBe('PERMISSION_DENIED');
    expect(result.requiredLevel).toBe(2);
    expect(result.currentLevel).toBe(1);
  });

  it('should allow Level 2 operation with valid approval token', async () => {
    const agent = { autonomyLevel: 1, type: 'Claude Code' };
    const approvalToken = generateApprovalToken('issues.delete', 123, 'user1');

    const result = await mcp.call(
      'issues.delete',
      {
        issueId: 123,
        approvalToken,
      },
      agent
    );

    expect(result.success).toBe(true);
  });
});
```

---

### 7.6 Penetration Testing

Manual penetration testing quarterly:

**Test Scenarios:**

1. **SQL Injection:** Attempt SQL injection in all MCP tool inputs
2. **XSS:** Attempt XSS in issue titles, descriptions, knowledge content
3. **CSRF:** Attempt CSRF attacks on approval workflow
4. **Prototype Pollution:** Attempt prototype pollution in JSON payloads
5. **Autonomy Bypass:** Attempt to bypass autonomy level checks
6. **Approval Token Forgery:** Attempt to forge approval tokens

**Expected Results:** All attacks mitigated (no successful exploits)

---

## 8. Incident Response

### 8.1 Incident Classification

| Severity     | Definition                                        | Response Time   | Example                                          |
| ------------ | ------------------------------------------------- | --------------- | ------------------------------------------------ |
| **Critical** | Data loss, corruption, or unauthorized access     | Immediate       | Database corruption, agent deletes all issues    |
| **High**     | Security vulnerability exploited                  | Within 1 hour   | SQL injection exploit, autonomy bypass           |
| **Medium**   | Performance degradation, minor data inconsistency | Within 4 hours  | MCP tool queue exhaustion, markdown sync failure |
| **Low**      | Cosmetic issue, no data impact                    | Within 24 hours | UI bug, minor logging error                      |

---

### 8.2 Incident Response Procedure

#### 8.2.1 Detection

**Methods:**

- Audit log monitoring (AgentAction table)
- Error log monitoring (application logs)
- User reports (developer notices issue)

#### 8.2.2 Containment

1. Stop agent operations (pause MCP server)
2. Disconnect network (if external attack suspected)
3. Create database backup (PostgreSQL dump)
4. Preserve evidence (copy logs, AgentAction table)

#### 8.2.3 Investigation

1. Review AgentAction table (identify malicious actions)
2. Review error logs (identify vulnerability)
3. Identify affected records (issues, knowledge items, etc.)
4. Determine root cause (code bug, configuration error, attack)

#### 8.2.4 Remediation

1. Fix vulnerability (patch code, update dependencies)
2. Rollback malicious operations (use Rollback table)
3. Restore affected records (from database backup)
4. Deploy fix (git commit, restart services)

#### 8.2.5 Post-Incident

1. Document incident (incident report)
2. Update security controls (prevent recurrence)
3. Notify affected parties (if personal data breached)
4. Update incident response procedure (lessons learned)

---

### 8.3 Incident Response Contacts

| Role                       | Contact        | Responsibility                    |
| -------------------------- | -------------- | --------------------------------- |
| **Incident Commander**     | Solo Developer | Overall response coordination     |
| **Security Lead**          | Solo Developer | Security analysis and remediation |
| **Database Administrator** | Solo Developer | Database backup and restoration   |

---

## 9. Security Requirements Traceability

### 9.1 Security NFRs

| NFR-ID      | Requirement                    | Implementation                               | Status      |
| ----------- | ------------------------------ | -------------------------------------------- | ----------- |
| **NFR-013** | MCP Security (stdio transport) | MCP server uses stdio (no network)           | ✅ Complete |
| **NFR-014** | Input Validation (Zod)         | All MCP tools use Zod schemas                | ✅ Complete |
| **NFR-015** | Secrets Management (.env)      | All secrets in environment variables         | ✅ Complete |
| **NFR-016** | Autonomy Levels (L0-L4)        | All MCP tools enforce autonomy levels        | ✅ Complete |
| **NFR-017** | Audit Trail (AgentAction)      | All actions logged to AgentAction table      | ✅ Complete |
| **NFR-018** | Rollback Capability (Level 1)  | Rollback table stores beforeState/afterState | ✅ Complete |
| **NFR-019** | Git Hook Enforcement           | Pre-commit hook validates markdown files     | ✅ Complete |

---

### 9.2 Security Test Coverage

| Test Category        | Coverage              | Tests                             | Status         |
| -------------------- | --------------------- | --------------------------------- | -------------- |
| **Input Validation** | 100% MCP tools        | 42 tests (1 per tool)             | ⚠️ In Progress |
| **Autonomy Levels**  | 100% levels (L0-L2)   | 15 tests (5 per level)            | ⚠️ In Progress |
| **SQL Injection**    | 100% database queries | 10 tests (critical paths)         | ⚠️ In Progress |
| **XSS Prevention**   | 100% React components | 20 tests (user-generated content) | ⚠️ In Progress |
| **CSRF Protection**  | 100% forms            | 5 tests (approval workflow)       | ⚠️ In Progress |

---

### 9.3 Security Architecture Decisions

| ADR-ID      | Decision                    | Security Impact                                  |
| ----------- | --------------------------- | ------------------------------------------------ |
| **ADR-001** | Agent-First Architecture    | Requires autonomy levels, audit trail            |
| **ADR-002** | Database as Source of Truth | Prevents markdown injection, ensures consistency |
| **ADR-003** | Hybrid Knowledge Graph      | Reduces token exposure risk                      |
| **ADR-004** | Single MCP Server           | Simplifies security model (one attack surface)   |

---

## 10. Security Roadmap

### 10.1 MVP Security (Phase A - Week 4)

- [x] Autonomy Levels L0-L1 implemented
- [x] Zod validation for all MCP tools
- [x] AgentAction audit trail
- [x] Git hook enforcement
- [ ] Input validation tests (42 tests)
- [ ] Autonomy level tests (15 tests)

### 10.2 Post-MVP Security (Phase B+)

- [ ] Autonomy Level L2 (approval workflow) - Phase B Week 8
- [ ] Rollback system - Phase B Week 9
- [ ] Penetration testing - Phase C Week 12
- [ ] Autonomy Level L3 (infrastructure) - Phase D Week 15
- [ ] Data export (GDPR compliance) - Phase E Week 16

---

## 11. Glossary

| Term               | Definition                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Autonomy Level** | Permission level for agent operations (L0-L4)                                                                                   |
| **Approval Token** | JWT token granting permission for Level 2 operations                                                                            |
| **Rollback**       | Reversing an operation to its previous state                                                                                    |
| **AgentAction**    | Audit log entry for agent operation                                                                                             |
| **Redaction**      | Removing sensitive data before logging                                                                                          |
| **STRIDE**         | Threat modeling framework (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-02
**Next Review:** 2025-11-16 (Phase B Week 8 - Approval Workflow Implementation)

---

**END OF DOCUMENT**
