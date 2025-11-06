# Validation Protocol for Implementation Checkpoints

**Version**: 1.0
**Purpose**: Validate implementation work against protocol compliance, code quality, and requirements traceability
**Usage**: Invoked via `/validate-work` slash command at checkpoints (Day completion, token milestones, sprint completion)

---

## Validation Scope

This protocol validates:
1. **Task Completion** - Work done matches planned tasks
2. **Code Quality** - Standards, security, architecture compliance
3. **Protocol Compliance** - MANDATORY_SESSION_PROTOCOL followed
4. **Requirements Traceability** - User stories and acceptance criteria met
5. **Quality Gates** - Tests, builds, linting pass

---

## Validation Inputs

**Required from user:**
- Checkpoint type: `day-X`, `token-XK`, `sprint-complete`
- Phase/sprint context: Current phase and sprint number
- Work summary: What was completed (from implementer)

**Files to validate:**
- `.agent/task/current-session-[timestamp].md` - Session log
- `.agent/task/current-todos.md` - Task tracking
- `.agent/task/current-plan.md` - Implementation plan
- Implementation files (code, tests, configs)
- Git status/diff (if applicable)

---

## Validation Checklist

### 1. Task Completion Validation

**Read files:**
- `.agent/task/current-todos.md` - Expected tasks
- `.agent/task/current-session-[timestamp].md` - Work log
- Git diff/status - Actual changes

**Verify:**
- [ ] Tasks marked complete in `current-todos.md` match actual work
- [ ] Progress percentage accurate (X/Y tasks = Z%)
- [ ] No tasks skipped or marked complete prematurely
- [ ] Files created/modified match plan specifications
- [ ] Deliverables exist and are functional

**Output:**
```
✅ Task Completion: [PASS/FAIL]
- Completed: X/Y tasks (Z% vs claimed Z%)
- Files created: [list matches plan: YES/NO]
- Deliverables: [list present: YES/NO]
- Issues: [any discrepancies]
```

---

### 2. Code Quality & Standards Validation

**Read files:**
- Implementation files (`.ts`, `.tsx`, `.prisma`, etc.)
- `tsconfig.json` - TypeScript config
- Configuration files (`.eslintrc`, `next.config.js`, etc.)

**Verify:**

**TypeScript Standards (R-TS-001):**
- [ ] `strict: true` in tsconfig
- [ ] No `any` types (except justified)
- [ ] Proper typing on all functions/components

**Next.js Standards (R-NEXT-001):**
- [ ] Server Components by default
- [ ] Client Components only when needed (`'use client'`)
- [ ] API logic in route handlers (`app/api/*/route.ts`)
- [ ] Service layer in `lib/services/`

**Security Standards (R-SEC-001):**
- [ ] No raw SQL with string interpolation
- [ ] Prisma parameterized queries only
- [ ] Input validation with Zod on all API routes
- [ ] Proper error handling (no sensitive data leaks)
- [ ] Environment variables used correctly (no hardcoded secrets)

**MCP Standards (R-MCP-001, if applicable):**
- [ ] Tools call Next.js API, not Prisma directly
- [ ] stdio transport implemented correctly
- [ ] Tool input/output contracts use Zod

**Privacy Standards (R-PRIVACY-001):**
- [ ] No cloud dependencies introduced
- [ ] Local-first architecture maintained
- [ ] No telemetry or external tracking

**Output:**
```
✅ Code Quality: [PASS/FAIL]
- TypeScript strict: [PASS/FAIL]
- Architecture patterns: [PASS/FAIL]
- Security: [PASS/FAIL - list any issues]
- Standards violations: [list any found]
```

---

### 3. Protocol Compliance Validation

**Read files:**
- `.agent/task/current-session-[timestamp].md`
- `.agent/task/current-todos.md`
- Implementer's checkpoint messages

**Verify:**

**Session Initialization (Step 1):**
- [ ] Session file created with timestamp
- [ ] Phase/sprint context documented
- [ ] Memory banks loaded (project-brief, system-patterns, tech-context, active-context, progress)
- [ ] Explicit confirmation provided

**Plan Creation (Step 2):**
- [ ] `current-plan.md` exists and complete
- [ ] `current-todos.md` exists with all tasks
- [ ] Explicit confirmation provided

**Expert Consultation (Step 3):**
- [ ] Appropriate experts consulted (react-expert, next-js-expert, prisma-expert, etc.)
- [ ] Expert recommendations documented
- [ ] Recommendations followed in implementation
- [ ] Explicit confirmations provided

**Progress Checkpoints (Step 4):**
- [ ] Session file updated at token milestones (15K, 30K, 45K, 60K)
- [ ] Todos file updated with progress
- [ ] Explicit checkpoint confirmations provided
- [ ] Token budget tracking maintained

**Post-Completion (Step 5, if applicable):**
- [ ] Documentation updated (docs/13-Project-Plan.md, docs/12-Backlog.md)
- [ ] Memory banks updated (.agent/active-context.md, progress.md, etc.)
- [ ] Optional: Completion doc created
- [ ] Optional: synthesize-docs/map-system invoked if patterns created
- [ ] Commits follow workflow: docs first, then code
- [ ] Explicit confirmation provided

**Token Budget:**
- [ ] Current usage within estimates
- [ ] Session total under 200K limit

**Output:**
```
✅ Protocol Compliance: [PASS/FAIL]
- Step 1 (Init): [PASS/FAIL]
- Step 2 (Plan): [PASS/FAIL]
- Step 3 (Experts): [PASS/FAIL - list which consulted]
- Step 4 (Checkpoints): [PASS/FAIL - XK tokens used]
- Step 5 (Post): [PASS/FAIL or N/A]
- Issues: [any protocol violations]
```

---

### 4. Requirements Traceability Validation

**Read files:**
- `docs/12-Backlog.md` - User stories
- `docs/13-Project-Plan.md` - Sprint plan
- `docs/03-Architecture.md` - Architecture spec
- `docs/04-Data-and-Model-Spec.md` - Data models
- Implementation files

**Verify:**

**User Stories Coverage:**
- [ ] Identify which user stories (US-XXX) addressed
- [ ] Check acceptance criteria met for each story
- [ ] Verify story status reflects completion

**Architecture Alignment:**
- [ ] Implementation matches architecture documentation
- [ ] Data models match specs
- [ ] API contracts match OpenAPI spec (if applicable)

**Plan Adherence:**
- [ ] Deliverables created as specified in plan
- [ ] Day-by-day breakdown followed (if applicable)
- [ ] Success criteria achievable/met

**Output:**
```
✅ Requirements Traceability: [PASS/FAIL]
- User stories addressed: [US-XXX, US-YYY, ...]
- Acceptance criteria met: [list per story]
- Architecture alignment: [PASS/FAIL - any drift noted]
- Plan adherence: [PASS/FAIL - any deviations]
```

---

### 5. Quality Gates Validation

**Run commands:**
```bash
pnpm lint
pnpm type-check
pnpm build
pnpm test
```

**Verify:**
- [ ] `pnpm lint` passes (zero errors, warnings acceptable)
- [ ] `pnpm type-check` passes (zero TypeScript errors)
- [ ] `pnpm build` succeeds (all apps compile)
- [ ] `pnpm test` passes (all tests green)
- [ ] Test coverage ≥80% for new code (if measurable)

**Test Existence:**
- [ ] Unit tests exist for core logic
- [ ] Integration tests exist for API routes (if applicable)
- [ ] E2E/smoke tests exist for critical flows (if applicable)

**Output:**
```
✅ Quality Gates: [PASS/FAIL]
- Lint: [PASS/FAIL - X errors]
- Type-check: [PASS/FAIL - X errors]
- Build: [PASS/FAIL - build output]
- Tests: [PASS/FAIL - X/Y passing, Z% coverage]
- Test gaps: [any missing tests]
```

---

## Validation Report Format

**Header:**
```
# [Checkpoint Type] Validation Report
**Phase**: [Phase name]
**Sprint**: [Sprint number]
**Checkpoint**: [Day X / XK tokens / Sprint Complete]
**Validator**: Claude (via validation-protocol.md)
**Timestamp**: [YYYY-MM-DD HH:MM:SS]
```

**Body:**
```
## Summary
- Overall Status: [✅ PASS / ⚠️ PASS WITH ISSUES / 🚨 FAIL]
- Tasks Completed: X/Y (Z%)
- Token Usage: XK/200K
- Code Quality: [PASS/FAIL]
- Protocol Compliance: [PASS/FAIL]
- Requirements Traceability: [PASS/FAIL]
- Quality Gates: [PASS/FAIL]

## Detailed Findings

### ✅ Task Completion
[Results from checklist section 1]

### ✅ Code Quality & Standards
[Results from checklist section 2]

### ✅ Protocol Compliance
[Results from checklist section 3]

### ✅ Requirements Traceability
[Results from checklist section 4]

### ✅ Quality Gates
[Results from checklist section 5]

## 🚨 Issues Found
[List all violations, risks, concerns with severity]
- 🔴 CRITICAL: [must fix before proceeding]
- 🟡 WARNING: [should fix, but can proceed]
- 🔵 INFO: [note for future improvement]

## ✅ Recommendations
[Actionable suggestions for next checkpoint or corrections needed]

## 🎯 Overall Grade
[A+ / A / A- / B+ / B / B- / C+ / C / F]

**Reasoning**: [Brief explanation of grade]

## Next Steps
[What should happen next based on validation results]
```

---

## Grade Rubric

| Grade | Criteria |
|-------|----------|
| **A+** | All 5 categories PASS, zero issues, exemplary quality |
| **A**  | All 5 categories PASS, minor info-level notes only |
| **A-** | All 5 categories PASS, 1-2 warnings that should be addressed |
| **B+** | 4/5 categories PASS, 1 category has fixable issues |
| **B**  | 4/5 categories PASS, multiple warnings across categories |
| **B-** | 3/5 categories PASS, some critical issues found |
| **C+** | 3/5 categories PASS, multiple critical issues |
| **C**  | 2/5 categories PASS, significant work needed |
| **F**  | <2 categories PASS, major protocol violations or broken code |

---

## Special Validation Scenarios

### Day 1 Validation (Setup & Planning)
- Focus on: Environment setup, configuration files, documentation
- Code quality: Configs only (tsconfig, eslint, docker-compose)
- Quality gates: May not apply (no code to test yet)

### Mid-Sprint Validation (Days 2-9)
- Focus on: Incremental progress, code quality, test coverage
- Protocol: Checkpoint updates, token budget
- Traceability: User stories being addressed

### Sprint Complete Validation (Day 10)
- Focus on: ALL 5 categories equally
- Quality gates: MUST pass all
- Protocol Step 5: MUST be complete
- Deliverables: MUST match sprint plan

### Token Milestone Validation (15K, 30K, etc.)
- Focus on: Protocol Step 4 compliance
- Quick check: Session/todos updated, progress accurate
- Light validation: Don't deep-dive code unless issues suspected

---

## Validation Workflow

**User triggers validation:**
```
/validate-work day-1
/validate-work token-30K
/validate-work sprint-complete
```

**Validator agent:**
1. Reads validation-protocol.md (this file)
2. Identifies checkpoint type
3. Reads relevant files from "Validation Inputs" section
4. Executes checklist sections 1-5
5. Generates validation report
6. Saves report to `.agent/task/validation-[checkpoint]-[timestamp].md`
7. Returns summary to user

**User reviews report:**
- ✅ PASS: Continue to next checkpoint
- ⚠️ PASS WITH ISSUES: Address warnings, then continue
- 🚨 FAIL: Fix critical issues before proceeding

---

## Maintenance

**Update this protocol when:**
- New requirements categories added (R-XXX-YYY)
- New quality gates introduced
- Protocol steps modified in MANDATORY_SESSION_PROTOCOL.md
- New validation scenarios needed

**Version history:**
- v1.0 (2025-11-06): Initial protocol for Sprint 1+ validation

---

**End of Validation Protocol**
