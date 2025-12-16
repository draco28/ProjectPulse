# CodeGuard + Git Integration - Implementation Phases

## Timeline Overview

**Total Duration:** 12-14 weeks (Production-Ready)

```
Week  1-2:  Phase 0 - Git Integration Foundation
Week  3-5:  Phase 1 - CodeGuard Core (Scanner, AST, Patterns)
Week  6-8:  Phase 2 - Context + Issues + Embeddings
Week  9-11: Phase 3 - Agent Workflow + Health UI Integration
Week 12-14: Phase 4 - Polish, Testing, Portfolio
```

---

## Phase 0: Git Integration (Weeks 1-2)

**Goal:** Enable ProjectPulse to clone and access GitHub repositories

### Week 1: GitHub App Setup

#### Day 1-2: GitHub App Creation
- [ ] Create GitHub App in GitHub Developer Settings
- [ ] Configure permissions: `contents: read`, `metadata: read`
- [ ] Configure webhook URL (via Cloudflare tunnel)
- [ ] Generate private key for API authentication
- [ ] Store credentials securely (env vars)

#### Day 3-4: Database Models
- [ ] Add GitHubInstallation model to Prisma schema
- [ ] Add Repository model to Prisma schema
- [ ] Create and run migration
- [ ] Verify with Prisma Studio

#### Day 5: OAuth Flow
- [ ] Create `app/api/github/install/route.ts` - Redirect to GitHub App install
- [ ] Create `app/api/github/callback/route.ts` - Handle OAuth callback
- [ ] Store installation record in database
- [ ] UI: "Connect GitHub" button on project settings

### Week 2: Repository Management

#### Day 1-2: Clone Service
- [ ] Create `apps/web/lib/git/clone.ts`
- [ ] Implement shallow clone (`git clone --depth 1`)
- [ ] Clone to `/var/repos/{installationId}/{repoName}`
- [ ] Handle authentication (GitHub App token)
- [ ] Implement fetch/pull for updates
- [ ] Error handling (network, permissions, disk space)

#### Day 3-4: Webhook Handler
- [ ] Create `app/api/github/webhook/route.ts`
- [ ] Verify webhook signature (security)
- [ ] Handle `push` event → trigger repo update + scan
- [ ] Handle `installation` events (app installed/uninstalled)
- [ ] Queue scan jobs (don't block webhook response)

#### Day 5: Cleanup Service
- [ ] Create `apps/web/lib/git/cleanup.ts`
- [ ] Implement storage monitoring
- [ ] Delete repos not scanned in 7 days
- [ ] Delete oldest repos when approaching 50GB limit
- [ ] Scheduled job (daily cron)

### Phase 0 Deliverables
- [ ] GitHub App configured and working
- [ ] User can install app on their GitHub account
- [ ] Repos are cloned to Mac mini on connection
- [ ] Webhooks trigger on push
- [ ] Cleanup keeps storage under budget

---

## Phase 1: CodeGuard Core (Weeks 3-5)

**Goal:** File scanning, AST parsing, pattern matching

### Week 3: Scanner Foundation

#### Day 1-2: Database Models (CodeGuard)
- [ ] Add CodeScan model to Prisma schema
- [ ] Add CodeIssue model to Prisma schema
- [ ] Add enums: ScanStatus, ScanTrigger, IssueCategory, IssueSeverity, IssueStatus
- [ ] Create and run migration

#### Day 3-4: File Scanner Service
- [ ] Create `apps/mcp-server/src/services/codeguard/scanner.ts`
- [ ] Traverse repo from cloned path
- [ ] Parse `.gitignore` for exclusions
- [ ] Filter by file type (ts, tsx, js, jsx)
- [ ] Chunk large files for processing
- [ ] Return file list with metadata

#### Day 5: MCP Tool - scan_repository
- [ ] Create `apps/mcp-server/src/tools/codeguard/scanRepository.ts`
- [ ] Input: `{ projectId, branch?, commitSha? }`
- [ ] Trigger scan job
- [ ] Return scan ID for status tracking
- [ ] Integration test

### Week 4: AST Parser

#### Day 1-2: Parser Service
- [ ] Install `@typescript-eslint/parser`
- [ ] Create `apps/mcp-server/src/services/codeguard/parser.ts`
- [ ] Parse TypeScript/JavaScript files
- [ ] Extract: functions, classes, interfaces, types
- [ ] Extract: imports, exports
- [ ] Handle parse errors gracefully

#### Day 3-4: Symbol Extraction
- [ ] Create `apps/mcp-server/src/services/codeguard/symbols.ts`
- [ ] Map symbols across files
- [ ] Build import graph
- [ ] Calculate complexity (cyclomatic, cognitive)
- [ ] Store symbols in database (optional, for performance)

#### Day 5: MCP Tool - analyze_file
- [ ] Create `apps/mcp-server/src/tools/codeguard/analyzeFile.ts`
- [ ] Input: `{ projectId, filePath, includeAST?, includeImports? }`
- [ ] Return symbols, complexity, imports/exports
- [ ] Integration test

### Week 5: Pattern Matching

#### Day 1-2: Pattern Matcher Service
- [ ] Create `apps/mcp-server/src/services/codeguard/patterns.ts`
- [ ] Implement regex-based patterns
- [ ] Implement AST-based patterns
- [ ] Pattern rule configuration format

#### Day 3-4: Built-in Patterns
- [ ] Security patterns:
  - Hardcoded secrets (API keys, passwords)
  - SQL injection patterns
  - XSS patterns
  - eval() usage
  - Unsafe regex (ReDoS)
- [ ] Quality patterns:
  - Unused variables
  - Console.log statements
  - TODO/FIXME comments
  - Missing error handling
  - Unhandled promises

#### Day 5: MCP Tool - check_patterns
- [ ] Create `apps/mcp-server/src/tools/codeguard/checkPatterns.ts`
- [ ] Run patterns on scan
- [ ] Store findings as CodeIssue records
- [ ] Return findings with severity breakdown
- [ ] Integration test

### Phase 1 Deliverables
- [ ] Can scan cloned repository
- [ ] Can parse and analyze TypeScript/JavaScript
- [ ] Detects 15+ pattern-based issues
- [ ] Core MCP tools: scan_repository, analyze_file, check_patterns

---

## Phase 2: Context + Issues + Embeddings (Weeks 6-8)

**Goal:** Agent-friendly context, issue management, semantic search

### Week 6: Context Aggregator

#### Day 1-3: Context Selection
- [ ] Create `apps/mcp-server/src/services/codeguard/context.ts`
- [ ] Trace imports (configurable depth)
- [ ] Score file relevance to target
- [ ] Token-aware chunking (stay under LLM limits)
- [ ] Generate "suggested focus" hints

#### Day 4-5: MCP Tool - get_analysis_context
- [ ] Create `apps/mcp-server/src/tools/codeguard/getAnalysisContext.ts`
- [ ] Input: `{ projectId, targetFile, maxTokens?, depth? }`
- [ ] Return bundled context optimized for LLM analysis
- [ ] Integration test

### Week 7: Issue Management

#### Day 1-2: Issue Service
- [ ] Create `apps/mcp-server/src/services/codeguard/issues.ts`
- [ ] Create issues from scan findings
- [ ] Deduplication (same file/line/rule)
- [ ] Status tracking (open, fixed, wontfix, false-positive)

#### Day 3: Auto-Ticket Creation
- [ ] Link to existing ticket service
- [ ] Auto-create ticket for CRITICAL/HIGH issues
- [ ] Map issue fields to ticket fields
- [ ] Two-way status sync

#### Day 4-5: MCP Tools - Issue Management
- [ ] `codeguard_report_issue` - Agent reports semantic issue
- [ ] `codeguard_get_issues` - List issues for project/scan
- [ ] `codeguard_update_issue` - Update status
- [ ] Integration tests

### Week 8: Code Embeddings

#### Day 1-2: Embedding Service
- [ ] Create `apps/mcp-server/src/services/codeguard/embeddings.ts`
- [ ] Integrate with existing Ollama setup
- [ ] Chunk code into meaningful units (functions, classes)
- [ ] Generate embeddings for each chunk
- [ ] Store in database with pgvector

#### Day 3-4: Similarity Search
- [ ] Create pgvector index (HNSW)
- [ ] Implement similarity query
- [ ] Return similar code patterns

#### Day 5: MCP Tool - find_similar_code
- [ ] Create `apps/mcp-server/src/tools/codeguard/findSimilarCode.ts`
- [ ] Input: `{ projectId, codeSnippet, limit? }`
- [ ] Return similar code with similarity scores
- [ ] Integration test

### Phase 2 Deliverables
- [ ] Context aggregation respects token limits
- [ ] Issues auto-create tickets
- [ ] Similar code search works
- [ ] MCP tools: get_analysis_context, report_issue, get_issues, find_similar_code

---

## Phase 3: Agent Workflow + Health UI (Weeks 9-11)

**Goal:** Complete agent workflow, integrate with Health page

### Week 9: Health Page Integration

#### Day 1-2: Connect CodeGuard to Health Scoring
- [ ] Update `lib/health/scoring/calculator.ts`
- [ ] Map CodeIssue categories to Health categories:
  - SECURITY → securityScore (40% weight)
  - QUALITY → qualityScore (30% weight)
  - (Future: ACCESSIBILITY, PERFORMANCE)
- [ ] Keep existing grade/trend logic

#### Day 3-4: Update Health Page Data Fetching
- [ ] Modify `app/health/page.tsx`
- [ ] Fetch from CodeScan/CodeIssue instead of HealthScanner/HealthFinding
- [ ] Update data types for new schema
- [ ] Preserve all existing UI components

#### Day 5: Remove Health Mock Code
- [ ] Delete `lib/health/scanners/` (Semgrep, ESLint, axe-core, Lighthouse)
- [ ] Keep `lib/health/scoring/` (reuse scoring logic)
- [ ] Update Health API endpoint

### Week 10: Agent Workflow

#### Day 1-2: Scan Workflow
- [ ] Agent calls `scan_repository` → gets scanId
- [ ] Agent calls `get_scan_status` → polls until complete
- [ ] Agent calls `get_issues` → gets findings
- [ ] Document recommended workflow

#### Day 3-4: Analysis Workflow
- [ ] Agent calls `get_analysis_context` → gets bundled code
- [ ] Agent's LLM reasons about code
- [ ] Agent calls `report_issue` → saves semantic findings
- [ ] Document with examples

#### Day 5: Fix Workflow (Basic)
- [ ] Create `codeguard_suggest_fix` tool
- [ ] Agent's LLM generates fix
- [ ] Agent uses standard Edit tool to apply
- [ ] Document workflow

### Week 11: Analytics & History

#### Day 1-2: Scan History
- [ ] Create scan comparison logic
- [ ] New issues vs fixed issues
- [ ] Regression detection (issue returns)

#### Day 3-4: Trend Tracking
- [ ] Track score over time
- [ ] Update HealthScore table from CodeGuard
- [ ] TrendGraph component uses existing logic

#### Day 5: Dashboard Enhancements
- [ ] Recent scans list
- [ ] Scan trigger (manual) button
- [ ] Connected repos list

### Phase 3 Deliverables
- [ ] Health page shows CodeGuard data
- [ ] Complete agent workflow documented
- [ ] Trend tracking works
- [ ] Manual scan trigger from UI

---

## Phase 4: Polish & Production (Weeks 12-14)

### Week 12: Performance & Reliability

- [ ] Implement scan result caching
- [ ] Incremental scanning (only changed files via git diff)
- [ ] Parallel file processing
- [ ] Error recovery and retry logic
- [ ] Rate limiting for GitHub API

### Week 13: Testing & Documentation

- [ ] E2E tests: GitHub connect → Clone → Scan → View results
- [ ] MCP tool integration tests
- [ ] Agent workflow integration tests
- [ ] User documentation (connect repo, view health)
- [ ] Developer documentation (architecture, extending)

### Week 14: Security & Release

- [ ] Security audit (token storage, webhook verification)
- [ ] Input validation review
- [ ] Access control (user can only scan own repos)
- [ ] Performance benchmarks
- [ ] Portfolio materials (demo video, README)

### Phase 4 Deliverables
- [ ] All tests passing (>80% coverage)
- [ ] Documentation complete
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Portfolio-ready

---

## Success Criteria Summary

| Phase | Key Metrics |
|-------|-------------|
| **Phase 0** | GitHub App works, repos clone, webhooks fire |
| **Phase 1** | Scan TS/JS, detect 15+ patterns, MCP tools work |
| **Phase 2** | Context bundling, auto-tickets, similarity search |
| **Phase 3** | Health page live, agent workflow documented |
| **Phase 4** | Tests pass, security audit, portfolio ready |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| GitHub API rate limits | Use installation tokens, implement caching |
| Storage exceeds 50GB | Aggressive cleanup, shallow clones, monitoring |
| Webhook delivery failures | Implement retry logic, manual scan fallback |
| AST parsing errors | Graceful degradation, skip unparseable files |
| Large repos take too long | Timeout limits, incremental scanning |
| Token exposure | Encrypt at rest, rotate regularly |
