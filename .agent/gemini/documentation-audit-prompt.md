# Documentation Audit for Workflow Automation Compatibility

**Task:** Audit all project documentation files to ensure they contain sufficient detail for the automated workflow system to function properly.

**Context:** The ProjectPulse project has implemented a sophisticated workflow automation system that relies on keyword-rich task descriptions to automatically:

- Load relevant skills (token-efficient patterns)
- Invoke sub-agents for research tasks
- Invoke expert agents for complex design decisions
- Use appropriate MCP tools

**Your Mission:** Review all documentation files and identify gaps where task descriptions lack the keywords, technical depth, or context details needed for automation to work.

---

## Part 1: Understanding the Workflow Automation System

### How Automation Works

The system has three layers of automation:

**Layer 1: Keyword-Based Skill Loading**

- Claude reads task descriptions in STATUS.md and DEVELOPMENT_PLAN.md
- Detects keywords that match skill triggers
- Automatically loads relevant skills (50-280 tokens each)
- Skills provide quick pattern reference during implementation

**Layer 2: Complexity-Based Sub-Agent Invocation**

- Claude detects when tasks require research/analysis
- Keywords like "analyze", "scan", "find patterns", "trace flow" trigger sub-agents
- Sub-agents work in isolated contexts (saving 20-30K tokens in main thread)
- Sub-agents save reports to `.agent/task/` files

**Layer 3: Design-Based Expert Invocation**

- Claude detects when tasks require deep technical expertise
- Keywords like "schema design", "App Router", "component architecture" trigger experts
- Experts create detailed implementation plans
- Experts save plans to `.agent/task/` files

### Why Rich Task Descriptions Matter

**Example of BAD task description:**

```markdown
**Day 4: Issue Detail Page**

1. Transform Issue Detail page layout
2. Create comment system UI
3. Add timeline/activity feed
```

**Problems:**

- No keywords to trigger `component-patterns` skill
- No indication of database queries (won't load `database-patterns`)
- No mention of React architecture (won't invoke `react-expert`)
- No MCP tool mentions (Playwright for testing?)

**Example of GOOD task description:**

```markdown
**Day 4: Issue Detail Page** (React Server Components + Client Components)

**Implementation Requirements:**

1. Transform Issue Detail page layout using neumorphic design patterns
2. Create comment system UI with real-time updates (React Server Components)
3. Add timeline/activity feed with Prisma queries and optimistic updates
4. Implement status change controls with server actions
5. Add E2E tests using Playwright MCP tool

**Database Queries:**

- Fetch issue with all relations (comments, attachments, history)
- Optimize query with selective field loading

**Component Architecture:**

- Server Component for issue details (data fetching)
- Client Components for comment input and real-time updates
- Custom hooks for optimistic UI updates

**Testing:**

- Playwright E2E test for complete issue detail workflow
- Test comment submission and status changes

**Expected Skills Auto-Load:**

- component-patterns (280 tokens)
- database-patterns (200 tokens)
- testing-patterns (240 tokens)

**Expected Agent Invocations:**

- react-expert (for complex component architecture)
- Sub-agent: explore-codebase (find existing comment patterns)
```

**Why This Is Better:**

- ✅ "React Server Components" → triggers `component-patterns` skill
- ✅ "Prisma queries" → triggers `database-patterns` skill
- ✅ "E2E tests" + "Playwright" → triggers `testing-patterns` skill + MCP tool
- ✅ "Component architecture" → may invoke `react-expert` for guidance
- ✅ "Find existing patterns" → may invoke `explore-codebase` sub-agent
- ✅ Clear deliverables for context file workflow

---

## Part 2: Skills Catalog and Triggers

### Skill 1: api-patterns (220 tokens)

**Purpose:** Zod validation, error handling, response formatting for API endpoints

**Trigger Keywords:**

- "API endpoint"
- "route handler"
- "request validation"
- "API response"
- "REST API"
- "POST /api/"
- "GET /api/"

**What It Provides:**

- Zod schema validation patterns
- Error handling with proper status codes
- Response formatting conventions
- TypeScript types for requests/responses

**When It Should Load:**
Any task involving creating or modifying API routes

---

### Skill 2: component-patterns (280 tokens)

**Purpose:** React component architecture, Server vs Client Components, shadcn/ui usage

**Trigger Keywords:**

- "React component"
- "UI component"
- "form component"
- "client component"
- "server component"
- "shadcn/ui"
- "component architecture"
- "custom hook"

**What It Provides:**

- Server Component vs Client Component decision guidelines
- shadcn/ui component usage patterns
- Component composition patterns
- Hook patterns (useState, useEffect, custom hooks)

**When It Should Load:**
Any task involving React component creation or modification

---

### Skill 3: database-patterns (200 tokens)

**Purpose:** Prisma query optimization, relations, transactions

**Trigger Keywords:**

- "database query"
- "Prisma"
- "schema"
- "migration"
- "SQL"
- "query optimization"
- "database relations"
- "transaction"

**What It Provides:**

- Prisma query patterns (findMany, include, select)
- Relation loading best practices
- Transaction patterns
- Query optimization techniques

**When It Should Load:**
Any task involving database queries or schema modifications

---

### Skill 4: testing-patterns (240 tokens)

**Purpose:** Jest, React Testing Library, Playwright patterns

**Trigger Keywords:**

- "test"
- "unit test"
- "E2E test"
- "integration test"
- "Playwright"
- "React Testing Library"
- "Jest"

**What It Provides:**

- Jest test structure
- React Testing Library patterns
- Playwright E2E patterns
- Test data generation

**When It Should Load:**
Any task involving writing tests

---

### Skill 5: git-workflow (180 tokens)

**Purpose:** Branch naming, conventional commits, PR workflow

**Trigger Keywords:**

- "commit"
- "branch"
- "merge"
- "PR"
- "pull request"
- "git"

**What It Provides:**

- Conventional commit message format
- Branch naming conventions
- PR creation workflow

**When It Should Load:**
Any task involving git operations (usually auto-loads at end of features)

---

### Skill 6: port-config (150 tokens)

**Purpose:** Fix dev server port issues (3000 vs 3002)

**Trigger Keywords:**

- "port 3000"
- "port 3002"
- "localhost not working"
- "default next page"

**What It Provides:**

- Quick fix for port configuration issues
- Steps to verify correct port

**When It Should Load:**
Any troubleshooting task related to dev server ports

---

### Skill 7: database-connection (180 tokens)

**Purpose:** Fix Prisma and PostgreSQL connection issues

**Trigger Keywords:**

- "prisma error"
- "database connection"
- "ECONNREFUSED"
- "can't connect to database"

**What It Provides:**

- Quick fixes for common connection issues
- DATABASE_URL troubleshooting
- Prisma client generation steps

**When It Should Load:**
Any troubleshooting task related to database connectivity

---

## Part 3: Sub-Agent Invocation Criteria

### Sub-Agent 1: explore-codebase

**Purpose:** Repository scanning, pattern detection, finding existing implementations

**Invocation Triggers:**

- "Find all [X]"
- "Scan codebase for [Y]"
- "Search for existing patterns"
- "How is [X] implemented?"
- "Find similar implementations"
- "Detect patterns across files"

**What It Does:**

- Scans entire repository for patterns
- Returns concise summary (not file dumps)
- Identifies 3-5 consistent patterns
- Notes frequency and variations

**Output:** `.agent/task/explore-[topic]-[timestamp].md`

**When It Should Be Invoked:**
Tasks requiring understanding of existing codebase patterns before implementation

---

### Sub-Agent 2: analyze-architecture

**Purpose:** System flow analysis, tracing data flow, understanding integrations

**Invocation Triggers:**

- "How does [X] work?"
- "Trace the data flow"
- "Analyze the architecture"
- "Understand the integration"
- "Map the dependencies"

**What It Does:**

- Traces data flow from UI → API → Database
- Maps dependencies between modules
- Analyzes integration points
- Returns architectural insights

**Output:** `.agent/task/analyze-[topic]-[timestamp].md`

**When It Should Be Invoked:**
Tasks requiring deep understanding of system flows before modification

---

### Sub-Agent 3: synthesize-docs

**Purpose:** Generate SOPs and skills from implementations

**Invocation Triggers:**

- `/update-doc after-feature` (manual command)
- `/update-doc skill [topic]` (manual command)
- "Create documentation for this pattern"
- "Generate SOP from this implementation"

**What It Does:**

- Reviews recent implementations
- Extracts procedures and patterns
- Creates SOP (2-3K tokens) or skill (50-280 tokens)
- Updates documentation indexes

**Output:** `.agent/sops/[topic].md` or `.claude/skills/projectpulse/[topic].md`

**When It Should Be Invoked:**
After completing major features with reusable patterns

---

### Sub-Agent 4: map-system

**Purpose:** Update system documentation (database schema, API catalog, component patterns)

**Invocation Triggers:**

- `/update-doc refresh-system` (manual command)
- "Update system documentation"
- "Refresh API catalog"
- "Update database schema docs"

**What It Does:**

- Scans Prisma schema for database docs
- Maps all API endpoints
- Documents React component patterns
- Updates `.agent/system/` files

**Output:** `.agent/system/[system-aspect].md`

**When It Should Be Invoked:**
After significant system changes (new models, APIs, components)

---

## Part 4: Expert Agent Invocation Criteria

### Expert 1: next-js-expert

**Purpose:** App Router architecture, Server/Client Components, data fetching patterns

**Invocation Triggers:**

- "App Router"
- "Server Components"
- "Client Components"
- "Server Actions"
- "data fetching strategy"
- "Next.js routing"
- "middleware"

**What It Provides:**

- Implementation plans for Next.js features
- Server vs Client Component decisions
- Data fetching patterns (fetch, cache, revalidate)
- Routing strategy guidance

**Output:** `.agent/task/nextjs-design-[timestamp].md`

**When It Should Be Invoked:**
Complex Next.js architecture decisions requiring deep expertise

---

### Expert 2: prisma-expert

**Purpose:** Schema design, relations, query optimization, PostgreSQL features

**Invocation Triggers:**

- "schema design"
- "database relations"
- "query optimization"
- "Prisma schema"
- "database architecture"
- "migration strategy"

**What It Provides:**

- Database schema design plans
- Relation structure recommendations
- Query optimization strategies
- Migration approaches

**Output:** `.agent/task/prisma-design-[timestamp].md`

**When It Should Be Invoked:**
Complex database schema design or major query optimization needs

---

### Expert 3: react-expert

**Purpose:** Component architecture, hooks, performance optimization, state management

**Invocation Triggers:**

- "component architecture"
- "custom hooks"
- "performance optimization"
- "state management"
- "React patterns"
- "memoization"

**What It Provides:**

- Component architecture recommendations
- Hook design patterns
- Performance optimization strategies
- State management approaches

**Output:** `.agent/task/react-design-[timestamp].md`

**When It Should Be Invoked:**
Complex React component architecture or performance optimization needs

---

## Part 5: MCP Tools Reference

### Available MCP Tools

**memory** - Knowledge graph

- Use for: Persistent cross-session context

**filesystem** - File operations

- Use for: Reading/writing files (handled by built-in tools mostly)

**git** - Version control

- Use for: Git operations (status, diff, commit, branch)

**postgres** - Database queries

- Use for: Direct SQL queries for debugging

**playwright** - Browser automation

- Use for: E2E testing, UI testing

**docker-devhub** - Container management

- Use for: Checking container status, logs, restart

**sequential-thinking** - Complex reasoning

- Use for: Multi-step problem solving

### When Tasks Should Mention MCP Tools

**Explicit Mentions Needed:**

- "Use Playwright for E2E testing" → Ensures testing-patterns skill loads + Playwright MCP considered
- "Check Docker container status" → Ensures docker-devhub MCP used
- "Run direct SQL query" → Ensures postgres MCP considered
- "Git branch management" → Ensures git MCP used

**Not Required (Automatic):**

- File reading/writing (built-in tools)
- Memory updates (automatic after task completion)

---

## Part 6: Context File Workflow Expectations

### Session Context File

**What It Is:** `.agent/task/current-session-[timestamp].md`

**Created:** Automatically at session start

**Contains:**

- Current phase from STATUS.md
- Goals from DEVELOPMENT_PLAN.md
- Requirements and acceptance criteria
- Progress notes throughout session

**Why Task Descriptions Should Support This:**
Tasks should clearly state:

- **Goals:** What are we trying to achieve?
- **Requirements:** What are the constraints?
- **Deliverables:** What files/features will exist when done?
- **Acceptance Criteria:** How do we know it's complete?

---

### Sub-Agent Report Files

**What They Are:** `.agent/task/[agent]-[topic]-[timestamp].md`

**Created:** When sub-agents complete research

**Contains:**

- Research findings
- Pattern analysis
- Implementation recommendations
- Links to relevant files

**Why Task Descriptions Should Support This:**
Tasks needing research should indicate:

- **What to research:** "Find existing comment patterns in codebase"
- **Why research is needed:** "To follow established conventions"
- **What decision will be informed:** "Component architecture design"

---

## Part 7: Files to Review

### Primary Files (Must Review)

1. **STATUS.md** - Current phase description
   - Path: `STATUS.md`
   - What to check: Current Phase section, task descriptions

2. **DEVELOPMENT_PLAN.md** - Complete development plan
   - Path: `docs/DEVELOPMENT_PLAN.md`
   - What to check: All phase descriptions, task lists

3. **UI_TRANSFORMATION_PLAN.md** - UI-specific plan
   - Path: `docs/UI_TRANSFORMATION_PLAN.md`
   - What to check: All transformation phases and tasks

### Secondary Files (Review If Referenced)

4. **WORKFLOW_ARCHITECTURE.md** - Git workflow
   - Path: `docs/WORKFLOW_ARCHITECTURE.md`
   - What to check: Branch strategy, commit patterns

5. **01-ARCHITECTURE.md** - System architecture
   - Path: `docs/01-ARCHITECTURE.md`
   - What to check: Architecture decisions, technical approaches

6. **02-DATABASE-SCHEMA.md** - Database design
   - Path: `docs/02-DATABASE-SCHEMA.md`
   - What to check: Schema details, query patterns

7. **04-UI-ARCHITECTURE.md** - UI architecture
   - Path: `docs/04-UI-ARCHITECTURE.md`
   - What to check: Component patterns, UI conventions

8. **03-MCP-SPECIFICATION.md** - MCP tool specs
   - Path: `docs/03-MCP-SPECIFICATION.md`
   - What to check: MCP tool usage patterns

### Reference Files (For Context Only)

9. **.agent/README.md** - Agent documentation index
   - Path: `.agent/README.md`
   - What to check: Workflow expectations

10. **CLAUDE.md** - Integration guide
    - Path: `CLAUDE.md`
    - What to check: Workflow patterns, automation expectations

---

## Part 8: Review Methodology

### For Each Task/Phase, Check:

#### 1. Skill Loading Keywords

**Question:** Does the task description contain keywords that would trigger relevant skills?

**Check For:**

- API work → "API endpoint", "route handler", "validation"
- UI work → "React component", "Client Component", "shadcn/ui"
- Database → "Prisma query", "schema", "database relations"
- Testing → "test", "E2E", "Playwright"

**If Missing:** Mark as gap with recommended keywords to add

---

#### 2. Sub-Agent Invocation Indicators

**Question:** Does the task require research that would benefit from sub-agent?

**Check For:**

- "Find existing patterns" → Should trigger explore-codebase
- "Analyze how [X] works" → Should trigger analyze-architecture
- Complexity that requires understanding existing code

**If Missing:** Mark as gap with recommended research needs to add

---

#### 3. Expert Invocation Indicators

**Question:** Does the task require deep technical design?

**Check For:**

- "Schema design" → Should trigger prisma-expert
- "App Router architecture" → Should trigger next-js-expert
- "Component architecture" → Should trigger react-expert
- Complex design decisions requiring expert guidance

**If Missing:** Mark as gap with recommended design indicators to add

---

#### 4. MCP Tool Mentions

**Question:** Does the task explicitly need specific MCP tools?

**Check For:**

- Testing → "Playwright" mentioned?
- Database debugging → "postgres MCP" or "direct SQL"?
- Container issues → "Docker" or "container"?

**If Missing:** Mark as gap with recommended tool mentions

---

#### 5. Context Workflow Support

**Question:** Does the task have clear goals, requirements, and deliverables?

**Check For:**

- **Goals:** What are we achieving?
- **Requirements:** What are the constraints?
- **Deliverables:** What will exist when done?
- **Acceptance Criteria:** How do we know it's complete?

**If Missing:** Mark as gap with recommended clarity improvements

---

## Part 9: Output Format

### Structure Your Audit Report As Follows:

````markdown
# Documentation Audit for Workflow Automation

**Audit Date:** [Date]
**Files Reviewed:** [Count]
**Total Tasks Analyzed:** [Count]

---

## Executive Summary

### Overall Automation Readiness

**Score:** [X]% ready for automation

**Breakdown:**

- ✅ Skill loading triggers: [X]% present
- ⚠️ Sub-agent invocation indicators: [X]% present
- ❌ Expert invocation indicators: [X]% present
- ⚠️ MCP tool mentions: [X]% present
- ✅ Context workflow support: [X]% present

### Gap Summary

**Critical Gaps:** [X] (blocks automation)
**Important Gaps:** [X] (reduces automation effectiveness)
**Nice-to-Have Gaps:** [X] (optional improvements)

### Immediate Action Required

Top 3 critical gaps to fix first:

1. [Gap description]
2. [Gap description]
3. [Gap description]

---

## Phase-by-Phase Analysis

### [Phase Name] (e.g., Week 1.5 Phase 3: Page Transformation)

#### Current Description

```markdown
[Quote exact text from documentation]
```
````

#### Automation Analysis

**Skill Loading Triggers:**

- ✅ Present: "React component" → component-patterns skill
- ❌ Missing: "API endpoint" → api-patterns skill won't load
- ❌ Missing: "Prisma query" → database-patterns skill won't load

**Sub-Agent Invocation:**

- ✅ Present: "Find existing patterns" → explore-codebase will invoke
- ❌ Missing: No research indicators for architecture analysis

**Expert Invocation:**

- ❌ Missing: No "component architecture" → react-expert won't invoke
- ❌ Missing: No "schema design" → prisma-expert won't invoke

**MCP Tools:**

- ❌ Missing: No "Playwright" mention for testing
- ✅ Present: Git operations implied (will use git MCP)

**Context Workflow:**

- ⚠️ Partial: Goals stated but requirements unclear
- ❌ Missing: No acceptance criteria
- ❌ Missing: Deliverables not explicitly listed

#### Gaps Identified

##### Gap 1: Missing API Endpoint Keywords

**Priority:** CRITICAL
**Impact:** api-patterns skill won't auto-load (220 tokens of guidance missing)
**Current Text:** "Transform Issues List page layout"
**Recommended Addition:**

```markdown
Transform Issues List page layout with API endpoints for filtering and pagination:

- Create GET /api/issues endpoint with query params
- Implement Zod validation for filter parameters
- Add response pagination with metadata
```

**Why This Helps:**

- "API endpoint" triggers api-patterns skill
- "Zod validation" reinforces api-patterns loading
- Clear technical requirements for context file

---

##### Gap 2: Missing Component Architecture Indicators

**Priority:** IMPORTANT
**Impact:** react-expert won't invoke for complex component design
**Current Text:** "Create FilterBar component with neumorphic styling"
**Recommended Addition:**

```markdown
Create FilterBar component with neumorphic styling and complex state management:

- Component architecture: Server Component wrapper + Client Component filters
- State management: URL search params for filter persistence
- Custom hooks: useDebounce for search optimization
- Consider invoking react-expert for architecture guidance
```

**Why This Helps:**

- "Component architecture" may trigger react-expert
- "State management" indicates complexity
- Clear technical depth for better automation decisions

---

[... Continue for each gap in this phase ...]

---

[... Repeat for each phase in the documentation ...]

---

## Cross-File Consistency Analysis

### Inconsistencies Found

#### Inconsistency 1: STATUS.md vs DEVELOPMENT_PLAN.md

**Issue:** STATUS.md says "Skills: None" but DEVELOPMENT_PLAN.md describes tasks requiring skills

**Files Affected:**

- STATUS.md line [X]
- DEVELOPMENT_PLAN.md line [Y]

**Impact:** Confusing directive - Claude may not load skills even when needed

**Recommendation:**
Update STATUS.md to:

```markdown
**Skills Expected:**

- component-patterns (UI components)
- database-patterns (Prisma queries)
- testing-patterns (E2E tests)
```

---

[... Continue for other inconsistencies ...]

---

## Pattern Detection Across Documentation

### Positive Patterns (Keep These)

1. **Clear Phase Structure**
   - Documentation consistently uses phase/day structure
   - Easy to navigate and understand progress

2. **Mockup References**
   - UI tasks clearly reference mockup files
   - Good for visual verification

### Negative Patterns (Need Improvement)

1. **Lack of Technical Keywords**
   - Across 15+ tasks: Only 3 mention "API endpoint"
   - Most UI tasks don't mention "React component"
   - Database tasks rarely mention "Prisma" or "query"

2. **Generic Task Descriptions**
   - Many tasks like "Transform page X" without technical details
   - Missing implementation approach hints
   - No mention of tools or patterns to use

3. **Missing Research Indicators**
   - No tasks explicitly mention "find existing patterns"
   - No tasks say "analyze current implementation"
   - Sub-agents won't be invoked proactively

---

## Recommendations by Priority

### CRITICAL (Must Fix - Blocks Core Automation)

#### Recommendation 1: Add Skill-Triggering Keywords to All Tasks

**Affected Files:**

- STATUS.md (Current Phase section)
- DEVELOPMENT_PLAN.md (All phases)
- UI_TRANSFORMATION_PLAN.md (All transformation tasks)

**Specific Changes:**

**STATUS.md Line [X]:**

```diff
- **Day 4: Issue Detail Page**
+ **Day 4: Issue Detail Page** (React Server Components + API Endpoints)

**Implementation:**
+ - Create GET /api/issues/[id] endpoint with Zod validation
+ - Build Issue Detail React component (Server Component for data)
+ - Add comment system with Client Component for interactivity
+ - Implement Prisma queries with relation loading optimization
+ - Write Playwright E2E test for complete workflow
```

**Expected Impact:**

- api-patterns skill will auto-load (220 tokens guidance)
- component-patterns skill will auto-load (280 tokens guidance)
- database-patterns skill will auto-load (200 tokens guidance)
- testing-patterns skill will auto-load (240 tokens guidance)
- Total: 940 tokens of automatic guidance vs 0 currently

---

[... Continue with more CRITICAL recommendations ...]

---

### IMPORTANT (Should Fix - Significantly Improves Automation)

[... Similar format for IMPORTANT recommendations ...]

---

### NICE-TO-HAVE (Optional - Marginal Improvements)

[... Similar format for NICE-TO-HAVE recommendations ...]

---

## Implementation Checklist

Use this checklist to track gap fixes:

### STATUS.md Updates

- [ ] Add keyword-rich Current Phase description
- [ ] Update "Skills: None" to expected skills list
- [ ] Add MCP tool mentions where relevant
- [ ] Add acceptance criteria to phase goals

### DEVELOPMENT_PLAN.md Updates

- [ ] Add technical keywords to all task descriptions
- [ ] Add research indicators where sub-agents needed
- [ ] Add design complexity markers for expert invocation
- [ ] Add clear deliverables to each phase
- [ ] Add acceptance criteria to each phase

### UI_TRANSFORMATION_PLAN.md Updates

- [ ] Add React component keywords to UI tasks
- [ ] Add API endpoint mentions to data-fetching tasks
- [ ] Add Prisma query mentions to database tasks
- [ ] Add Playwright mentions to testing tasks
- [ ] Add component architecture details to complex UI tasks

### Cross-File Consistency

- [ ] Ensure STATUS.md matches DEVELOPMENT_PLAN.md
- [ ] Ensure task numbering is consistent
- [ ] Ensure terminology is consistent (e.g., "phase" vs "day")

### Validation

- [ ] Read updated docs and verify keywords present
- [ ] Test automation with updated docs
- [ ] Verify skills load automatically
- [ ] Verify sub-agents invoke when appropriate
- [ ] Verify context files created with proper details

---

## Appendix A: Examples of "Good" Task Descriptions

### Example 1: API Development Task

**BAD:**

```markdown
**Task:** Create issues endpoint
```

**GOOD:**

```markdown
**Task:** Create Issues API Endpoints with Validation and Filtering

**Implementation:**

1. Create GET /api/issues endpoint with query param validation
   - Use Zod schema for filter params (status, priority, module)
   - Implement pagination with page and limit params
   - Return issues with total count and pagination metadata

2. Create POST /api/issues endpoint with issue creation
   - Zod validation for issue creation payload
   - Prisma transaction for creating issue + initial history entry
   - Return created issue with all relations

3. Optimize Prisma queries for performance
   - Use selective field loading (select vs include)
   - Add database indexes for filter columns
   - Implement query result caching

**Testing:**

- Jest unit tests for validation schemas
- Supertest integration tests for endpoints
- Playwright E2E test for complete issue creation flow

**Expected Skills Auto-Load:**

- api-patterns (Zod validation, error handling)
- database-patterns (Prisma queries, transactions)
- testing-patterns (Jest, Supertest patterns)

**Expected Agent Invocations:**

- explore-codebase: Find existing API endpoint patterns
- prisma-expert: Review query optimization strategy (if complex)

**Deliverables:**

- apps/web/app/api/issues/route.ts
- apps/web/app/api/issues/[id]/route.ts
- apps/web/lib/validations/issue.ts (Zod schemas)
- apps/web/**tests**/api/issues.test.ts
```

**Why This Is Good:**

- ✅ Multiple skill-triggering keywords (API endpoint, Zod, Prisma, Playwright)
- ✅ Research indicator ("Find existing patterns")
- ✅ Expert invocation hint (query optimization review)
- ✅ Clear deliverables for context file
- ✅ Testing requirements explicitly stated
- ✅ Expected automation clearly documented

---

### Example 2: UI Component Task

**BAD:**

```markdown
**Task:** Create filter component
```

**GOOD:**

````markdown
**Task:** Create FilterSidebar Component with URL State Management

**Component Architecture:**

- Server Component wrapper for initial filter data
- Client Component for interactive filter UI
- Custom hooks: useFilterState (URL search params sync)
- shadcn/ui components: Checkbox, RadioGroup, Button

**Implementation:**

1. Create FilterSidebar React component (Client Component)
   - Filter by status (Open, In Progress, Closed) with counts
   - Filter by priority (Critical, High, Medium, Low) with colored dots
   - Filter by module (Combat, Animation, Core, UI)
   - "Clear All" button to reset filters

2. Implement URL-based state management
   - useSearchParams for reading URL state
   - useRouter for updating URL on filter change
   - Preserve filters across page reloads

3. Fetch filter counts from API
   - GET /api/issues/counts endpoint with current filters
   - Update counts dynamically as filters change
   - Loading states and error handling

**Component Composition:**

```tsx
<FilterSidebar>
  <FilterSection title="Status">
    <FilterCheckbox value="open" count={12} />
    <FilterCheckbox value="in_progress" count={5} />
  </FilterSection>
</FilterSidebar>
```
````

**Testing:**

- React Testing Library for filter interactions
- Playwright E2E for complete filtering workflow
- Test URL state persistence

**Expected Skills Auto-Load:**

- component-patterns (React Server/Client Components, hooks)
- api-patterns (if creating counts endpoint)
- testing-patterns (React Testing Library, Playwright)

**Expected Agent Invocations:**

- react-expert: Review component architecture (if complex state)
- explore-codebase: Find existing filter component patterns

**Deliverables:**

- apps/web/components/FilterSidebar.tsx
- apps/web/hooks/useFilterState.ts
- apps/web/app/api/issues/counts/route.ts (if needed)
- apps/web/**tests**/components/FilterSidebar.test.tsx

````

**Why This Is Good:**
- ✅ Clear component architecture (Server vs Client)
- ✅ Custom hooks mentioned (React patterns)
- ✅ shadcn/ui mentioned (component-patterns trigger)
- ✅ URL state management technical detail
- ✅ Testing explicitly defined with tools
- ✅ Expected automation documented
- ✅ Code example shows technical depth

---

### Example 3: Database Schema Task

**BAD:**
```markdown
**Task:** Add issue attachments to schema
````

**GOOD:**

````markdown
**Task:** Design and Implement Issue Attachments Schema with Relations

**Schema Design Requirements:**

1. Create Attachment model with proper relations
   - One-to-many relation with Issue
   - Foreign key: issueId
   - Cascade delete when issue deleted
   - Track uploaded_by user and timestamp

2. Support multiple file types
   - Images (png, jpg, gif)
   - Documents (pdf, docx, txt)
   - Archives (zip)
   - Validate file types and sizes

3. Optimize query performance
   - Index on issueId for fast lookups
   - Selective loading (don't always include attachments)
   - Implement signed URLs for secure access

**Prisma Schema:**

```prisma
model Attachment {
  id          String   @id @default(cuid())
  filename    String
  filesize    Int
  mimetype    String
  url         String
  issueId     String
  issue       Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  uploadedBy  String
  user        User     @relation(fields: [uploadedBy], references: [id])
  createdAt   DateTime @default(now())

  @@index([issueId])
  @@index([uploadedBy])
}

model Issue {
  // ... existing fields
  attachments Attachment[]
}
```
````

**Migration Strategy:**

- Create migration with prisma migrate dev
- Seed test attachments for development
- Update existing queries to handle attachments

**Expected Skills Auto-Load:**

- database-patterns (Prisma schema, relations, migrations)
- api-patterns (if creating upload endpoint)

**Expected Agent Invocations:**

- prisma-expert: Review schema design for relations strategy
- explore-codebase: Find existing attachment/upload patterns

**Deliverables:**

- prisma/schema.prisma (updated)
- prisma/migrations/[timestamp]\_add_attachments.sql
- apps/web/lib/attachments.ts (helper functions)
- prisma/seed-attachments.ts (test data)

````

**Why This Is Good:**
- ✅ "Schema design" triggers prisma-expert consideration
- ✅ "Prisma" and "relations" trigger database-patterns skill
- ✅ Technical details (indexes, cascade, foreign keys)
- ✅ Schema code example shows complexity
- ✅ Migration strategy clarified
- ✅ Expected automation documented
- ✅ Clear deliverables

---

## Appendix B: Automation Trigger Reference

### Quick Reference: What Keywords Trigger What

| Keyword | Triggers | Token Load |
|---------|----------|-----------|
| "API endpoint" | api-patterns skill | +220 tokens |
| "Zod validation" | api-patterns skill | +220 tokens |
| "React component" | component-patterns skill | +280 tokens |
| "Server Component" | component-patterns skill | +280 tokens |
| "Client Component" | component-patterns skill | +280 tokens |
| "Prisma query" | database-patterns skill | +200 tokens |
| "schema design" | database-patterns skill + prisma-expert | +200 + 5,800 tokens |
| "E2E test" | testing-patterns skill | +240 tokens |
| "Playwright" | testing-patterns skill | +240 tokens |
| "component architecture" | component-patterns + react-expert | +280 + 5,200 tokens |
| "Find existing patterns" | explore-codebase sub-agent | Isolated context |
| "Analyze how [X] works" | analyze-architecture sub-agent | Isolated context |

### Compound Triggers (Multiple Keywords in One Task)

**Example:**
"Create Issue Detail React component with Prisma queries and Playwright E2E tests"

**Triggers:**
- "React component" → component-patterns (+280 tokens)
- "Prisma queries" → database-patterns (+200 tokens)
- "Playwright E2E tests" → testing-patterns (+240 tokens)
- **Total:** +720 tokens of automatic guidance

---

## Appendix C: Context File Workflow Examples

### Example: Good Session Context File

`.agent/task/current-session-20251026-1430.md`:

```markdown
# Session Context: Week 1.5 Phase 3 - Issues List Page

**Started:** 2025-10-26 14:30
**Phase:** Week 1.5 Phase 3 Day 3
**Branch:** ui/theme-foundation

## Goals

Transform Issues List page to match mockup 02-issues-dark-neumorphic-coral.html with:
- FilterSidebar component (status, priority, module filters)
- SearchSortBar component (search + sort + view toggles)
- IssueListCard components (glass-dark cards with badges)
- Pagination component
- Full database integration

## Requirements

1. Pixel-perfect match to mockup
2. Server Components for data fetching
3. Client Components for interactivity
4. URL-based filter state (persistence across reloads)
5. Debounced search (300ms)
6. Zero TypeScript errors
7. Zero lint warnings

## Technical Approach

**Skills Loaded:**
- component-patterns (280 tokens) - React architecture guidance
- database-patterns (200 tokens) - Prisma query patterns
- testing-patterns (240 tokens) - E2E test patterns

**Prisma Queries:**
- findMany with where clause for filters
- orderBy for sorting
- skip/take for pagination
- count for pagination metadata

**Component Architecture:**
- Server Component: app/issues/page.tsx (data fetching)
- Client Components: FilterSidebar, SearchSortBar, Pagination

## Progress

### 14:35 - Started Implementation
- Created app/issues/page.tsx (Server Component)
- Created components/FilterSidebar.tsx (Client Component)
- Created useDebounce hook for search

### 15:10 - Database Integration Complete
- Prisma queries working with filters
- Pagination metadata correct
- Performance optimized (selective field loading)

### 15:45 - UI Components Complete
- FilterSidebar matching mockup exactly
- SearchSortBar with debounced search
- IssueListCard with priority badges
- Pagination controls working

### 16:00 - Testing Complete
- Zero TypeScript errors
- Zero lint warnings
- Manual testing: All filters working
- Search debouncing working
- Pagination correct

## Deliverables

Created:
- apps/web/app/issues/page.tsx (Server Component)
- apps/web/components/FilterSidebar.tsx (Client Component)
- apps/web/components/SearchSortBar.tsx (Client Component)
- apps/web/components/IssueListCard.tsx (Client Component)
- apps/web/components/Pagination.tsx (Client Component)
- apps/web/hooks/useDebounce.ts (custom hook)

Modified:
- None

## Next Steps

1. Commit changes with conventional commit message
2. Update STATUS.md with completion
3. Move to Day 4: Issue Detail Page (waiting for mockup)
````

**Why This Is Good:**

- ✅ Clear goals and requirements
- ✅ Documents skills loaded (proves automation worked)
- ✅ Technical approach details
- ✅ Progress timestamps
- ✅ Deliverables list
- ✅ Next steps

---

## Your Task: Complete Audit

Now that you understand:

1. How automation works
2. What keywords trigger what
3. When sub-agents and experts should be invoked
4. What makes a "good" task description
5. What output format to use

**Please:**

1. Read all files listed in Part 7
2. Analyze each task/phase using methodology from Part 8
3. Generate comprehensive audit report following format in Part 9
4. Include specific, actionable recommendations for each gap
5. Prioritize gaps (CRITICAL, IMPORTANT, NICE-TO-HAVE)
6. Provide example text additions for top 10 gaps

**Focus On:**

- Identifying missing skill-triggering keywords
- Finding tasks that need sub-agent research but don't indicate it
- Locating complex design tasks that should invoke experts
- Spotting missing MCP tool mentions
- Noting unclear goals/requirements/deliverables

**Your audit should be thorough, specific, and actionable.**

Thank you!
