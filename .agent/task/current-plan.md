# Sprint 7 Day 8-9: Health Scanner Foundation - Implementation Plan

**Created:** 2025-11-14 22:00
**Story Points:** 8 points (US-116: 5 points, US-117: 3 points)
**Tasks:** 5 tasks
**Status:** APPROVED - Ready for implementation

---

## Overview

**Goal:** Implement health monitoring foundation with Semgrep (security) and ESLint (quality) scanners

**Current Sprint Progress:** 13/30 points (43%) - Week 1 complete, Week 2 starting

---

## Success Criteria

### Phase 1: Database Foundation
- [ ] HealthScanner, HealthFinding, HealthScore models created in Prisma schema
- [ ] 4 enums created (ScannerType, FindingCategory, FindingSeverity, FindingStatus)
- [ ] Migration applied successfully on Mac mini
- [ ] Prisma client regenerated
- [ ] Database tables verified (health_scanners, health_findings, health_scores exist)

### Phase 2: Scanner Implementation
- [ ] Semgrep scanner executes CLI command successfully
- [ ] Semgrep parser converts JSON output → HealthFinding records
- [ ] ESLint scanner uses Node.js API successfully
- [ ] ESLint parser converts results → HealthFinding records
- [ ] Shared types module created (Scanner interface, ScanResult type)

### Phase 3: Testing
- [ ] 5+ Semgrep unit tests passing (valid parsing, malformed output, severity mapping, summary, edge cases)
- [ ] 5+ ESLint unit tests passing (valid parsing, malformed output, severity mapping, summary, edge cases)
- [ ] Test fixtures created (sample Semgrep JSON, sample ESLint results)
- [ ] TypeScript 0 errors (strict mode)

### Phase 4: Integration Validation
- [ ] Semgrep installed on Mac mini (`brew install semgrep`)
- [ ] Semgrep scan executed on ProjectPulse codebase
- [ ] ESLint scan executed on ProjectPulse codebase
- [ ] HealthFinding records created in database
- [ ] Scan summary accurate (count by severity)

---

## Implementation Steps

### Step 1: Consult Prisma Expert (Protocol Step 3) ✅ REQUIRED
**Invoke `prisma-expert` for:**
- Schema design for HealthScanner, HealthFinding, HealthScore models
- Index strategy recommendation (8 indexes on HealthFinding)
- Migration approach (enum creation + table creation)

**Expected Output:** Schema recommendations, index placement, migration strategy

### Step 2: Create Prisma Schema (Task 19)
**File:** `prisma/schema.prisma`

**Changes:**
1. Add 4 enums (ScannerType, FindingCategory, FindingSeverity, FindingStatus)
2. Add HealthScanner model (7 fields, 3 indexes, unique constraint)
3. Add HealthFinding model (16 fields, 8 indexes, 2 relations)
4. Add HealthScore model (9 fields, 2 indexes, 1 relation)

**Validation:**
- `npx prisma format` (auto-format schema)
- `pnpm type-check` (ensure TypeScript compatibility)

### Step 3: Create Migration (Task 20)
**Location:** Mac mini (192.168.1.15)

**Commands:**
```bash
# Pull latest code
git pull origin master

# Create migration
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
npx prisma migrate dev --name health_monitoring_foundation

# Regenerate Prisma client
npx prisma generate

# Restart Next.js server
docker-compose restart projectpulse-nextjs-cloud

# Verify migration
DATABASE_URL="..." \
psql -c "SELECT COUNT(*) FROM health_scanners;"
```

**Expected Output:** Migration applied, tables created, count returns 0

### Step 4: Implement Shared Types (Part of Task 21)
**File:** `apps/web/lib/health/scanners/types.ts` (~100 lines)

**Exports:**
- Scanner interface (scan method)
- ScanResult type (scannerId, category, findings, summary)
- FindingData type (ruleId, severity, message, filePath, lineNumber, codeSnippet)

### Step 5: Implement Semgrep Scanner (Task 21)
**File:** `apps/web/lib/health/scanners/semgrep.ts` (~250 lines)

**Features:**
- Execute Semgrep CLI: `semgrep --config auto --json <projectPath>`
- Parse JSON output (structure: `{ results: [...] }`)
- Map Semgrep severity → FindingSeverity enum
- Return ScanResult with findings + summary

**Dependencies:**
- `child_process.exec` for CLI execution
- JSON parsing

### Step 6: Implement ESLint Scanner (Task 22)
**File:** `apps/web/lib/health/scanners/eslint.ts` (~200 lines)

**Features:**
- Use ESLint Node.js API: `new ESLint()`, `eslint.lintFiles()`
- Parse ESLint results
- Map ESLint severity → FindingSeverity enum
- Return ScanResult with findings + summary

**Dependencies:**
- `eslint` npm package (already installed)
- Existing `.eslintrc.json` configuration

### Step 7: Write Unit Tests (Task 23)
**Files:**
- `apps/web/lib/health/scanners/__tests__/semgrep.test.ts` (5+ tests)
- `apps/web/lib/health/scanners/__tests__/eslint.test.ts` (5+ tests)

**Test Coverage:**
1. Valid output parsing
2. Malformed output handling
3. Severity mapping
4. Summary aggregation
5. Edge cases (empty results, null snippets)

**Fixtures:**
- `__tests__/fixtures/semgrep-output.json`
- `__tests__/fixtures/eslint-results.json`

### Step 8: Integration Verification (Mac mini)
**Execute on Mac mini:**
1. Install Semgrep: `brew install semgrep`
2. Test Semgrep: `semgrep --config auto --json apps/web/`
3. Test ESLint via scanner implementation
4. Verify database records created

---

## Technical Decisions

### Decision 1: Scanner Execution
- **Semgrep:** CLI execution via `child_process.exec`
- **ESLint:** Programmatic via ESLint Node.js API
- **Rationale:** Semgrep is external binary, ESLint is npm package

### Decision 2: Database Schema
- **Why HealthFinding vs SecurityFinding?** Generic for all 4 scanner types
- **Why separate HealthScore table?** Historical trend tracking
- **Index strategy:** 8 indexes on HealthFinding for fast filtering

### Decision 3: Finding Deduplication
- **Uniqueness:** (scannerId, ruleId, filePath, lineNumber)
- **On rescan:** Update existing, mark missing as FIXED

### Decision 4: Issue Linking
- **HealthFinding.issueId:** Optional (reduces noise)
- **Agent creates Issue:** Via MCP tool (not automatic)

---

## Token Budget

**Phase 1 (Database):** ~15K tokens
**Phase 2 (Scanners):** ~25K tokens
**Phase 3 (Tests):** ~15K tokens
**Documentation:** ~10K tokens
**Checkpoints:** ~5K tokens

**Total Estimate:** ~70K tokens / 200K budget (35%)
**Buffer:** 130K tokens

---

## Risk Mitigation

**Risk 1: Semgrep Installation**
- **Mitigation:** Install on Mac mini during migration step
- **Fallback:** Manual installation guide

**Risk 2: Scanner Output Format**
- **Mitigation:** Robust parsers, comprehensive tests
- **Fallback:** Error handling, graceful degradation

**Risk 3: TypeScript Errors**
- **Mitigation:** Incremental type-checking after each file
- **Fallback:** Fix errors before proceeding

---

## Dependencies

**External:**
- ✅ ESLint package (installed)
- ❌ Semgrep binary (install on Mac mini)

**Internal:**
- ✅ Prisma setup (operational)
- ✅ Project model (exists)
- ✅ Issue model (Sprint 4 complete)

---

## Next Steps After Day 8-9

**Day 10:** Accessibility Scanners (axe-core + Lighthouse) - 3 points
**Day 11:** Health Score Calculation (weighted formula) - 5 points
**Day 12:** Health MCP Tools (3 tools) - 3 points
**Day 13:** Health Dashboard UI (4 components) - 3 points
**Day 14:** Integration Testing + Documentation - 0 points

---

**Plan Status:** APPROVED
**Ready to Execute:** YES
**Created:** 2025-11-14 22:00
