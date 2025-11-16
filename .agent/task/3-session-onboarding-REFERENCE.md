# 3-Session Onboarding System - REFERENCE

**Created**: 2025-11-16
**Purpose**: Reference for implementing Sprint 8.5 Phase 2 (Session 3 Blueprint View)
**Source**: `Starter_template/master-workflow-template/` (REFERENCE ONLY, not to integrate directly)

---

## Overview

End users' agents experience a **3-session onboarding system** that takes them from idea to fully configured AI development workflow:

```
Session 1: Strategic Planning (10 questions)
    ↓
Session 2: Documentation Generation (15 industry docs)
    ↓
Session 3: Bootstrap & Configuration (AI workflow setup)
```

**Key Data Structure**: All sessions read/write to `project-context.json` (single source of truth)

**Storage in ProjectPulse**: `OnboardingSession` model with `response` JSONB field containing session data

---

## Session 1: Strategic Planning (10-Phase Questions)

**Template Reference**: `master-workflow-template/.planning/questions.md` (863 lines) - FOR REFERENCE ONLY

**ProductPulse Implementation**: Questions stored in PostgreSQL database, fetched via MCP/API

**Purpose**: Agent asks 10 phases of strategic questions to understand the product vision

**Agent Role**: Product Manager, Strategic Planner, UX Designer, Architect, DevOps Engineer

### ProductPulse Data Flow (Session 1)

```
1. Agent calls MCP: projectpulse.onboarding.getQuestions(sessionType: "strategic-planning")
   ↓
2. ProjectPulse returns Phase 1 questions from DB
   ↓
3. Agent asks user Phase 1 questions (1.1 → 1.2 → 1.3 → 1.4)
   ↓
4. Agent calls MCP: projectpulse.onboarding.saveAnswers(phase: 1, answers: {...})
   ↓
5. ProjectPulse stores in OnboardingSession.response JSONB
   ↓
6. Repeat steps 2-5 for Phases 2-10
   ↓
7. After Phase 10 complete, agent calls MCP: projectpulse.onboarding.generateExecutiveSummary()
   ↓
8. ProjectPulse synthesizes all answers → Executive Summary
   ↓
9. ProjectPulse stores Executive Summary in OnboardingSession.response.executiveSummary
   ↓
✅ Session 1 Complete
```

**Database Storage**:
- **Table**: `OnboardingSession` (sessionType: "strategic-planning")
- **Field**: `response` (JSONB) containing:
  - `planningAnswers.strategic.*` (Q1-Q10 answers)
  - `planningAnswers.detailed.*` (Phase 1-10 answers)
  - `executiveSummary` (synthesized at end of Session 1)
  - `currentPhase` (1-10, tracks progress)
  - `completedQuestions` (array of completed question IDs)

**User's Repo**: CLEAN - No `.planning/` folder, no template files ✅

### 10-Phase Structure

#### **Phase 1: Product Manager - Foundation** (4 subsections, 11 questions)

**1.1 User Personas** (3 questions):
```
1. Who are the primary users of your product?
2. What are their demographics, behaviors, and pain points?
3. What would success look like for your users?
```

**1.2 Core Features & Scope** (3 questions):
```
1. What are the 3-5 core features of your product?
2. What features are explicitly OUT of scope for MVP?
3. What makes your product different from alternatives?
```

**1.3 MVP User Stories** (3 questions):
```
1. List 5-10 critical user stories for MVP (format: "As a [user], I want to [action] so that [benefit]")
2. Which user story is the most critical (North Star)?
3. What user stories can be deferred to v2?
```

**1.4 Roadmap Planning** (2 questions):
```
1. What are your top 3 priorities for MVP?
2. What features do you envision for post-MVP (6 months after launch)?
```

---

#### **Phase 2: Strategic Planning - Business & Tech** (4 subsections, 10 questions)

**2.1 Tech Stack Selection** (3 questions):
```
1. What tech stack are you considering? (e.g., Next.js + Supabase, T3 Stack, MERN)
2. Do you have any constraints? (e.g., must use PostgreSQL, must deploy to AWS)
3. Do you need real-time features? (WebSockets, Server-Sent Events, polling)
```

**2.2 Cost Analysis** (2 questions):
```
1. What is your estimated monthly active users (MAU) for MVP?
2. What is your budget for infrastructure costs during MVP phase?
```

**2.3 Timeline & Milestones** (3 questions):
```
1. When do you want to launch MVP?
2. Are you building solo or with a team?
3. How many hours per week can you dedicate to development?
```

**2.4 Risk Assessment** (2 questions):
```
1. What are the biggest technical risks for this project?
2. What dependencies or integrations are critical? (e.g., Stripe, OpenAI, SendGrid)
```

---

#### **Phase 3: UX/UI Design - User Experience** (3 subsections, 9 questions)

**3.1 User Flows** (3 questions):
```
1. Describe the primary user flow (from landing to value delivery)
2. What onboarding experience do you envision?
3. What is the "aha moment" for your users?
```

**3.2 Wireframes & Layout** (3 questions):
```
1. Do you have wireframes or mockups? (attach images or describe layouts)
2. What pages are essential for MVP? (e.g., landing, dashboard, settings)
3. What design system or component library do you prefer? (shadcn/ui, Material UI, custom)
```

**3.3 Component Library** (3 questions):
```
1. What UI components are needed? (tables, forms, modals, charts, etc.)
2. What accessibility standards must you meet? (WCAG 2.1 AA, Section 508)
3. What browsers/devices must you support? (Chrome-only MVP vs cross-browser)
```

---

#### **Phase 4: System Architecture - Technical Foundation** (4 subsections, 12 questions)

**4.1 Database Design** (3 questions):
```
1. What are your core data models? (e.g., User, Project, Task)
2. What are the key relationships? (one-to-many, many-to-many)
3. Do you need multi-tenancy? (workspaces, organizations)
```

**4.2 API Design** (3 questions):
```
1. Will you use REST, GraphQL, or tRPC?
2. What are the key API endpoints? (CRUD operations, custom actions)
3. Do you need webhooks or background jobs?
```

**4.3 Authentication & Authorization** (3 questions):
```
1. What auth methods do you need? (email/password, OAuth, magic links)
2. What user roles exist? (admin, member, viewer)
3. What permission model? (RBAC, ABAC, RLS)
```

**4.4 Caching & Performance** (3 questions):
```
1. What performance targets do you have? (e.g., <3s page load, <500ms API response)
2. Do you need caching? (Redis, in-memory, CDN)
3. What content is cacheable vs real-time?
```

---

#### **Phase 5: DevOps & Local Development** (3 subsections, 9 questions)

**5.1 Local Development Setup** (3 questions):
```
1. What development tools are you using? (VSCode, Cursor, Windsurf)
2. Do you prefer Docker for local dev or native setup?
3. What testing strategy? (unit, integration, E2E)
```

**5.2 CI/CD Pipeline** (3 questions):
```
1. What CI/CD platform? (GitHub Actions, Vercel, GitLab CI)
2. What checks must pass before deployment? (tests, linting, type-checking)
3. What deployment strategy? (blue-green, rolling, canary)
```

**5.3 Monitoring & Observability** (3 questions):
```
1. What monitoring tools? (Sentry, LogRocket, Vercel Analytics)
2. What alerts are critical? (error rate, downtime, budget thresholds)
3. What metrics to track? (MAU, API latency, error rates)
```

---

#### **Phase 6: Backend Development** (3 subsections, 9 questions)

**6.1 Data Layer** (3 questions):
```
1. What ORM/query builder? (Prisma, Drizzle, raw SQL)
2. What migration strategy? (versioned migrations vs schema sync)
3. What seeding strategy for development data?
```

**6.2 Business Logic** (3 questions):
```
1. What are the core business rules? (e.g., max 5 projects per user on free plan)
2. What validation rules are critical? (email format, unique slugs, rate limits)
3. What background jobs are needed? (email sending, report generation, cleanup)
```

**6.3 Integrations** (3 questions):
```
1. What third-party APIs? (Stripe, OpenAI, SendGrid, etc.)
2. What data needs to sync? (calendar events, CRM records)
3. What webhooks to handle? (payment success, subscription cancelled)
```

---

#### **Phase 7: Frontend Development** (3 subsections, 9 questions)

**7.1 State Management** (3 questions):
```
1. What state management approach? (React Context, Zustand, Redux)
2. What data needs client-side state? (user preferences, form drafts, UI state)
3. What data should be server-driven? (user data, permissions, content)
```

**7.2 Data Fetching** (3 questions):
```
1. What data fetching pattern? (SWR, React Query, Server Components)
2. What data needs real-time updates? (notifications, chat messages, collaborative editing)
3. What optimistic UI updates are needed? (like buttons, status toggles)
```

**7.3 Forms & Validation** (3 questions):
```
1. What form library? (react-hook-form, Formik, native)
2. What validation approach? (Zod, Yup, custom)
3. What complex forms are needed? (multi-step wizards, conditional fields)
```

---

#### **Phase 8: QA & Testing** (3 subsections, 9 questions)

**8.1 Test Coverage** (3 questions):
```
1. What test coverage target? (70%+ business logic, 50%+ overall)
2. What testing frameworks? (Jest, Vitest, Playwright)
3. What features are critical to test end-to-end? (checkout flow, auth flow)
```

**8.2 Quality Gates** (3 questions):
```
1. What checks must pass for PR merge? (tests, linting, type-checking)
2. What manual QA is needed? (accessibility audit, cross-browser testing)
3. What performance budgets? (bundle size, lighthouse score)
```

**8.3 Bug Tracking** (3 questions):
```
1. What bug tracking system? (GitHub Issues, Linear, Jira)
2. What bug severity levels? (critical, high, medium, low)
3. What is your bug triage process?
```

---

#### **Phase 9: Production Deployment** (3 subsections, 9 questions)

**9.1 Hosting & Infrastructure** (3 questions):
```
1. What hosting platform? (Vercel, Railway, AWS, Render)
2. What environment setup? (staging, production, preview)
3. What database hosting? (Supabase, PlanetScale, RDS)
```

**9.2 Secrets Management** (3 questions):
```
1. How to manage secrets? (.env.local, Vercel Env Vars, AWS Secrets Manager)
2. What secrets are needed? (API keys, database URLs, JWT secrets)
3. What rotation strategy for secrets?
```

**9.3 Rollout Plan** (3 questions):
```
1. What is your launch plan? (public launch, private beta, waitlist)
2. What feature flags are needed? (beta features, A/B tests)
3. What rollback plan if launch fails?
```

---

#### **Phase 10: Security & Compliance** (3 subsections, 9 questions)

**10.1 Security Hardening** (3 questions):
```
1. What security measures are required? (HTTPS, CSP, CORS, rate limiting)
2. What authentication security? (password hashing, MFA, session management)
3. What input validation? (SQL injection, XSS, CSRF protection)
```

**10.2 Data Privacy** (3 questions):
```
1. What user data do you collect? (PII, usage data, analytics)
2. What privacy regulations apply? (GDPR, CCPA, HIPAA)
3. What data retention policy?
```

**10.3 Compliance** (3 questions):
```
1. What compliance requirements? (SOC 2, HIPAA, PCI-DSS)
2. What legal pages needed? (Privacy Policy, Terms of Service, Cookie Policy)
3. What user consent mechanisms? (cookie banners, data processing agreements)
```

---

### Session 1 Output Format (ProductPulse DB)

**MCP Tool**: `projectpulse.onboarding.saveAnswers(phase, answers)`

**Stored in**: `OnboardingSession.response` (JSONB field)

```json
{
  "sessionType": "strategic-planning",
  "currentPhase": 10,
  "currentQuestion": null,
  "completedQuestions": [
    "phase1_q1", "phase1_q2", "phase1_q3", // ... all 98 question IDs
  ],
  "planningAnswers": {
    "strategic": {
      "q1_product_definition": {
        "productName": "TaskFlow",
        "elevatorPitch": "AI-powered task management for developers",
        "problemSolved": "Developers waste time on manual task tracking",
        "targetAudience": "Solo developers and small dev teams",
        "differentiation": "AI agent integration for autonomous task updates"
      },
      "q2_users_use_cases": { /* ... */ },
      "q3_success_metrics": { /* ... */ },
      "q4_deployment": { /* ... */ },
      "q5_tech_stack": { /* ... */ },
      "q6_ai_strategy": { /* ... */ },
      "q7_security_compliance": { /* ... */ },
      "q8_auth_payments": { /* ... */ },
      "q9_scale_budget": { /* ... */ },
      "q10_timeline_team": { /* ... */ }
    },
    "detailed": {
      "phase1_product_manager": { /* 11 answers */ },
      "phase2_strategic_planning": { /* 10 answers */ },
      "phase3_ux_ui_design": { /* 9 answers */ },
      "phase4_system_architecture": { /* 12 answers */ },
      "phase5_devops_local_setup": { /* 9 answers */ },
      "phase6_backend_development": { /* 9 answers */ },
      "phase7_frontend_development": { /* 9 answers */ },
      "phase8_qa_testing": { /* 9 answers */ },
      "phase9_production_deployment": { /* 9 answers */ },
      "phase10_security_audit": { /* 9 answers */ }
    }
  },
  "executiveSummary": "TaskFlow is an AI-powered task management platform designed for solo developers and small dev teams. The core problem is that developers waste 10-15 hours per week on manual task tracking and status updates. TaskFlow solves this by integrating AI agents that autonomously update task status, estimate completion times, and generate progress reports. The MVP will launch in 10 weeks with a Next.js 15 + Supabase + Vercel stack, targeting 500 MAU in the first 3 months. Success will be measured by time saved per user (target: 8 hours/week) and agent adoption rate (target: 80% of users enable AI features).",
  "completedAt": "2025-11-16T10:45:00Z"
}
```

**MCP Tool**: `projectpulse.onboarding.getQuestions(sessionType, phase?)` - Returns questions for specific phase or all phases

**MCP Tool**: `projectpulse.onboarding.generateExecutiveSummary()` - Synthesizes all answers into Executive Summary

**Storage**: PostgreSQL `OnboardingSession` table, `response` JSONB column

---

## Session 2: Documentation Generation (15 Industry Docs)

**Template Reference**: `master-workflow-template/.planning/DOCS_GENERATION_PROMPT.md` (129 lines) - FOR REFERENCE ONLY

**ProductPulse Implementation**: Prompt stored in DB, docs generated and stored in DB

**Purpose**: Agent generates 15 industry-grade documentation files from Session 1 answers

**Agent Role**: Technical Writer, Architect, Product Manager (synthesizing planning data)

### ProductPulse Data Flow (Session 2)

```
1. Agent calls MCP: projectpulse.onboarding.getDocGenerationPrompt()
   ↓
2. ProjectPulse returns prompt template from DB
   ↓
3. Agent calls MCP: projectpulse.onboarding.getExecutiveSummary()
   ↓
4. ProjectPulse returns Executive Summary (from Session 1)
   ↓
5. Agent processes prompt + Executive Summary → Generates 15 docs
   ↓
6. Agent calls MCP: projectpulse.onboarding.saveDocument(filename: "01-PRD.md", content: "...", wordCount: 2500)
   ↓
7. ProjectPulse stores doc in DB (Document table or OnboardingSession.response.documentsGenerated[])
   ↓
8. Repeat step 6 for all 15 docs (01-PRD.md → 13-Project-Plan.md)
   ↓
9. Agent calls MCP: projectpulse.onboarding.finalizeDocumentation()
   ↓
10. ProjectPulse populates project-context.json from all answers + docs
    ↓
11. ProjectPulse stores project-context.json in OnboardingSession.response.projectContextJson
    ↓
✅ Session 2 Complete
```

**Database Storage**:
- **Table**: `OnboardingSession` (sessionType: "documentation-generation")
- **Field**: `response` (JSONB) containing:
  - `documentsGenerated[]` array with:
    - `filename`, `content`, `wordCount`, `generatedAt` for each doc
  - `projectContextJson` (complete project-context.json object)
  - `executiveSummary` (from Session 1)
  - `totalWordCount` (sum of all docs)

**✅ DECISION: Use Document table** (docs are large, frequently accessed):

```prisma
model Document {
  id                  String            @id @default(cuid())
  onboardingSessionId String
  onboardingSession   OnboardingSession @relation(fields: [onboardingSessionId], references: [id], onDelete: Cascade)

  filename            String            // "01-PRD.md", "13-Project-Plan.md"
  content             String            @db.Text // Full markdown content
  wordCount           Int
  generatedAt         DateTime          @default(now())

  // For wiki integration and categorization
  category            String?           // "planning" | "architecture" | "implementation" | "operations"
  tags                String[]          @default([])

  @@index([onboardingSessionId])
  @@index([filename])
  @@unique([onboardingSessionId, filename])
}
```

**Why separate table:**
- ✅ Wiki integration: Fetch individual docs efficiently
- ✅ Session 3 usage: Different parts fetch different docs
- ✅ Roadmap integration: `13-Project-Plan.md` fetched frequently
- ✅ Future features: Full-text search, doc editing, versioning

**User's Repo**: CLEAN - No `docs/` folder with generated files ✅

### Process

**Agent Prompt Template**:
```
You are a technical documentation specialist. I will provide you with an Executive Summary of a software project. Your task is to generate 15 industry-grade documentation files following best practices.

# Executive Summary

[Agent synthesizes Session 1 answers into Executive Summary format]:

**Project Name**: [from q1]
**Type**: [from q1]
**Target Users**: [from q2]
**Core Problem**: [from q1]
**Solution**: [from q1]
**Tech Stack**: [from q5]
**Timeline**: [from q10]
**Budget**: [from q9]
**Key Features**: [from 1.2]
**Success Metrics**: [from q3]

# Output Instructions

Generate the following 15 documentation files in markdown format:

1. **01-PRD.md** (Product Requirements Document)
   - Product vision and goals
   - Target users and personas
   - Core features and user stories
   - Success metrics and KPIs
   - Out of scope items
   - Assumptions and constraints

2. **02-SRS.md** (Software Requirements Specification)
   - Functional requirements
   - Non-functional requirements (performance, security, usability)
   - System constraints
   - Acceptance criteria

3. **03-Architecture.md**
   - System architecture overview
   - Component diagrams
   - Data flow diagrams
   - Technology stack details
   - Integration points
   - Deployment architecture

4. **architecture/ADRs/ADR-001.md** (Architectural Decision Record: Tech Stack)
   - Context: Why we need to choose a tech stack
   - Decision: [Tech stack from q5]
   - Rationale: Why this stack?
   - Alternatives considered
   - Consequences: Benefits and drawbacks

5. **architecture/ADRs/ADR-002.md** (ADR: Database Design)
   - Context: Data modeling needs
   - Decision: Database choice and schema design
   - Rationale: Why this approach?
   - Alternatives
   - Consequences

6. **architecture/ADRs/ADR-003.md** (ADR: Authentication Strategy)
   - Context: Auth requirements
   - Decision: Auth method and providers
   - Rationale
   - Alternatives
   - Consequences

7. **04-Data-and-Model-Spec.md**
   - Database schema (tables, columns, types)
   - Entity relationships (ERD)
   - Data validation rules
   - Migration strategy

8. **05-MLOps-Plan.md** (if AI features)
   - Model selection
   - Training pipeline
   - Deployment strategy
   - Monitoring and retraining
   - Cost management

9. **06-API/openapi.yaml**
   - OpenAPI 3.0 specification
   - All endpoints documented
   - Request/response schemas
   - Authentication requirements
   - Error responses

10. **07-UI-UX.md**
    - Design system and component library
    - User flows and wireframes
    - Accessibility standards
    - Responsive design strategy
    - Theming and branding

11. **08-Security-and-Compliance.md**
    - Security measures (HTTPS, CSP, CORS)
    - Authentication and authorization
    - Data encryption
    - Privacy compliance (GDPR, CCPA)
    - Security audit checklist

12. **09-Testing-and-QA.md**
    - Testing strategy (unit, integration, E2E)
    - Test coverage targets
    - QA process and checklist
    - Performance testing
    - Accessibility testing

13. **10-Observability-and-SRE.md**
    - Monitoring strategy (logs, metrics, traces)
    - Alerting rules
    - SLOs and SLIs
    - Incident response plan
    - On-call rotation

14. **11-Infrastructure-and-Deployment.md**
    - Hosting platform and services
    - CI/CD pipeline
    - Environment setup (dev, staging, prod)
    - Secrets management
    - Backup and disaster recovery

15. **12-Backlog.md**
    - Backlog of user stories
    - Prioritized by MoSCoW (Must, Should, Could, Won't)
    - Story points estimates
    - Sprint planning suggestions

16. **13-Project-Plan.md**
    - Development phases and sprints
    - Timeline and milestones
    - Team roles and responsibilities
    - Risk mitigation plan
    - Success criteria
```

### Session 2 Output Format (ProductPulse DB)

**MCP Tool**: `projectpulse.onboarding.saveDocument(filename, content, wordCount)`

**Stored in**: `Document` table (separate rows for each doc)

**OnboardingSession.response JSONB structure**:
```json
{
  "sessionType": "documentation-generation",
  "documentsGeneratedCount": 15,
  "totalWordCount": 35000,
  "executiveSummary": "TaskFlow is an AI-powered task management platform...",
  "projectContextJson": {
    "metadata": {
      "projectName": "TaskFlow",
      "projectType": "SaaS",
      "domain": "Developer Tools",
      "targetUsers": ["Solo developers", "Small dev teams"],
      "valueProposition": "AI-powered task tracking for developers",
      "version": "1.0.0",
      "lastUpdated": "2025-11-16",
      "createdBy": "session-2-detailed"
    },
    "techStack": { /* ... */ },
    "architecture": { /* ... */ },
    "phases": [ /* ... */ ],
    "features": [ /* ... */ ],
    "architecturalDecisions": [ /* ... */ ],
    "planningAnswers": { /* from Session 1 */ },
    "timeline": { /* ... */ },
    "team": { /* ... */ },
    "budget": { /* ... */ }
  },
  "completedAt": "2025-11-16T11:30:00Z"
}
```

**Note**: Docs stored in separate `Document` table (not in JSONB) for efficient querying

**MCP Tools for Session 2**:
- `projectpulse.onboarding.getDocGenerationPrompt()` - Returns prompt template
- `projectpulse.onboarding.getDocument(filename)` - Returns specific doc content from Document table
- `projectpulse.onboarding.finalizeDocumentation()` - Generates project-context.json from all data

**Storage Summary**:
- **Documents**: `Document` table (15 rows, one per doc)
- **Metadata**: `OnboardingSession.response.projectContextJson` (JSONB)
- **User's Repo**: CLEAN ✅

---

## Session 3: Bootstrap & Configuration (AI Workflow Setup)

**Template Reference**: `master-workflow-template/.claude/agents/orchestrators/bootstrap-orchestrator.md` (952 lines) - FOR REFERENCE ONLY

**ProductPulse Implementation**: Agent configures ProjectPulse DB + generates CLAUDE.md/AGENTS.md for repo

**Purpose**: Agent reads `project-context.json` (from Session 2) and configures ProductPulse with Memory Bank, Agents, Skills, SOPs

**Agent Role**: DevOps Engineer, Setup Specialist

### ProductPulse Data Flow (Session 3)

```
1. Agent calls MCP: projectpulse.onboarding.getProjectContext()
   ↓
2. ProjectPulse returns OnboardingSession.response.projectContextJson
   ↓
3. Agent verifies prerequisites (metadata, techStack, phases populated)
   ↓
4. Agent creates Memory Bank records in DB (5 files)
   ↓
5. Agent generates CLAUDE.md + AGENTS.md for user's repo (with ProjectPulse instructions)
   ↓
6. Agent creates AgentPersona records in DB (based on techStack)
   ↓
7. Agent creates Skill records in DB (based on projectType)
   ↓
8. Agent creates SOP records in DB (based on project needs)
   ↓
9. Agent creates Roadmap record from 13-Project-Plan.md
   ↓
10. Agent creates DevelopmentSession record (Session 1+2+3 summary)
    ↓
11. Agent reports: "Project onboarding completed"
    ↓
✅ Session 3 Complete
```

**Database Tables Created/Populated**:
- `MemoryBank` (5 records: project-brief, system-patterns, tech-context, active-context, progress)
- `AgentPersona` (N records: nextjs-expert, prisma-expert, react-expert, etc.)
- `Skill` (N records: api-patterns, component-patterns, testing-patterns, etc.)
- `SOP` (N records: security-checklist, git-workflow, etc.)
- `Roadmap` (1 record: phases from project-context.json)
- `DevelopmentSession` (1 record: onboarding session summary)

**Files Created in User's Repo**:
- `CLAUDE.md` (integration guide with ProjectPulse DB instructions)
- `AGENTS.md` (agent personas list)

**User's Repo**: CLEAN - Only 2 instruction files, NO `.agent/` folder ✅

### Process Overview

**Total Steps**: 8 steps (modified from template)
**Estimated Time**: 2-3 minutes (automated)
**Output**: ProjectPulse DB configured + CLAUDE.md/AGENTS.md in repo

### Data Structure: project-context.json

**Single Source of Truth** for all 3 sessions:

```json
{
  "metadata": {
    "projectName": "Example SaaS",
    "projectType": "SaaS",
    "domain": "Project Management",
    "targetUsers": ["Freelancers", "Small teams"],
    "valueProposition": "Simplify project tracking for small teams",
    "version": "1.0.0",
    "lastUpdated": "2025-11-16",
    "createdBy": "session-2-detailed"
  },
  "techStack": {
    "frontend": "Next.js 15 + React 19 + Tailwind CSS + shadcn/ui",
    "backend": "Next.js API Routes",
    "database": "Supabase (PostgreSQL)",
    "auth": "Supabase Auth",
    "ai": "OpenAI GPT-4",
    "payments": "Stripe",
    "storage": "Supabase Storage",
    "caching": "Upstash Redis",
    "hosting": "Vercel",
    "other": ["SendGrid", "Sentry"]
  },
  "architecture": {
    "type": "Monolithic Next.js",
    "dataAccess": "RLS (Row Level Security)",
    "caching": "Redis",
    "realtime": "Supabase Realtime"
  },
  "phases": [
    {
      "id": 1,
      "name": "Foundation & Authentication",
      "duration": "2 weeks",
      "goals": [
        "Set up development environment",
        "Implement authentication system",
        "Create basic UI structure",
        "Set up database schema"
      ],
      "deliverables": [
        "User authentication (sign up, login, logout)",
        "Protected routes",
        "Basic layout and navigation",
        "Database tables and RLS policies"
      ],
      "status": "pending"
    }
    // ... more phases
  ],
  "features": [
    {
      "id": 1,
      "name": "User Authentication",
      "description": "Secure user registration and login",
      "priority": "P0",
      "phase": 1,
      "status": "planned"
    }
    // ... more features
  ],
  "architecturalDecisions": [
    {
      "id": "ADR-001",
      "title": "Tech Stack Selection",
      "decision": "Next.js 15 + Supabase + Vercel",
      "rationale": "Modern, scalable, cost-effective for SaaS MVP",
      "alternatives": ["Next.js + Prisma + AWS", "Remix + Supabase"],
      "consequences": [
        "Fast development with Supabase's built-in features",
        "Lower infrastructure costs during MVP phase"
      ]
    }
    // ... more ADRs
  ],
  "planningAnswers": {
    "strategic": { /* Session 1 Q1-Q10 answers */ },
    "detailed": { /* Session 1 Phase 1-10 answers */ }
  },
  "timeline": {
    "startDate": "2025-11-20",
    "estimatedDuration": "10 weeks",
    "targetLaunch": "2026-01-29"
  },
  "team": {
    "size": "Solo",
    "roles": ["Full-stack developer"],
    "skillGaps": []
  },
  "budget": {
    "development": "$0 (solo developer)",
    "monthly_operating": "$200-400 (Vercel Pro + Supabase Pro + Stripe + SendGrid)",
    "infrastructure": "Pay-as-you-go"
  }
}
```

### ProductPulse Bootstrap Steps

#### **Step 1: Verify Prerequisites**

**MCP Tool**: `projectpulse.onboarding.getProjectContext()`

**Agent fetches**: `OnboardingSession.response.projectContextJson` from ProjectPulse DB

**Validation Checks**:
- ✅ `metadata.projectName` populated (not `"[PROJECT_NAME]"`)
- ✅ `techStack` complete (frontend, backend, database, hosting)
- ✅ `phases[]` array has ≥2 phases
- ✅ `features[]` array has ≥1 feature
- ✅ `architecturalDecisions[]` populated (at least ADR-001)

**If incomplete**:
```
❌ **Prerequisites Not Met**

project-context.json is missing required fields:
- metadata.projectName: [✅/❌]
- techStack.frontend: [✅/❌]
- phases array: [✅/❌] ([N] phases found)

Please complete Sessions 1+2 first.
Cannot bootstrap without planning data.
```

**If complete**:
```
✅ **Prerequisites Met**

Found complete project-context.json:
- Project: [PROJECT_NAME]
- Type: [PROJECT_TYPE]
- Tech Stack: [FRONTEND] + [DATABASE] + [HOSTING]
- Phases: [N] phases, [DURATION] total
- Features: [N] features

Ready to configure ProjectPulse! Starting automated setup...
```

---

#### **Step 2: Create Memory Bank Records (ProjectPulse DB)**

**MCP Tool**: `projectpulse.memory.create(type, content)`

**Agent creates 5 MemoryBank records** (NOT files in repo):

**2.1 Memory Bank: project-brief** (~1.5K tokens)
- **Source**: `project-context.json.metadata`, `features`, `timeline`
- **Content**: Project overview, key features, success metrics, timeline
- **MCP Call**: `projectpulse.memory.create("project-brief", content)`

**2.2 Memory Bank: system-patterns** (~2K tokens)
- **Source**: `project-context.json.architecture`, `techStack`
- **Content**: Architecture patterns, component patterns, API patterns, testing strategy
- **MCP Call**: `projectpulse.memory.create("system-patterns", content)`

**2.3 Memory Bank: tech-context** (~1.8K tokens)
- **Source**: `project-context.json.techStack`
- **Content**: Tech stack summary, setup instructions, environment variables, dependencies
- **MCP Call**: `projectpulse.memory.create("tech-context", content)`

**2.4 Memory Bank: active-context** (~1.2K tokens)
- **Source**: `project-context.json.phases[0]` (first phase)
- **Content**: Current phase, current sprint, recent completions, active work
- **MCP Call**: `projectpulse.memory.create("active-context", content)`

**2.5 Memory Bank: progress** (~1.5K tokens)
- **Source**: `project-context.json.timeline`, `phases`
- **Content**: Timeline, phase progress, milestone tracker, velocity tracking
- **MCP Call**: `projectpulse.memory.create("progress", content)`

**Total**: ~8K tokens (5 DB records)

**Visible in**: Agent AI Hub UI → Memory Bank tab

---

#### **Step 3: Generate CLAUDE.md + AGENTS.md (User's Repo)**

**🚨 CRITICAL**: Agent generates CLAUDE.md with **ProjectPulse DB instructions**, NOT template `.agent/` folder instructions

**3.1 Generate `CLAUDE.md` for user's repo**

**Template**: `claude-md-template-PRODUCTPULSE.md` (see file for full template)

**Key sections in generated CLAUDE.md**:
1. **Pre-work Checklist**: Check ProjectPulse connection (via `projectpulse.health.check()`)
2. **Memory Bank**: Read from DB (via `projectpulse.memory.read(type)`)
3. **5-Step Protocol** (ProjectPulse-modified):
   - Step 1: `projectpulse.session.create()` + `projectpulse.memory.read()`
   - Step 2: `projectpulse.session.savePlan()` + `projectpulse.session.saveTodos()`
   - Step 3: `projectpulse.agent.get()` (fetch expert agents)
   - Step 4: `projectpulse.session.updateProgress()` (at 15K token checkpoints)
   - Step 5: `projectpulse.memory.update()` + `projectpulse.session.complete()`
4. **Documentation**: Read from DB (via `projectpulse.docs.read(filename)`)
5. **Agent Personas**: Access via `projectpulse.agent.list()` and `.get()`
6. **Roadmap**: Track via `projectpulse.roadmap.getCurrent()`
7. **Best Practices**: Emphasizes DB-first, clean repo (NO `.agent/` folder)

**Critical warnings in CLAUDE.md**:
- ❌ "DO NOT read `.agent/active-context.md` - use `projectpulse.memory.read()`"
- ❌ "DO NOT write `current-plan.md` - use `projectpulse.session.savePlan()`"
- ❌ "DO NOT look for `docs/` folder - use `projectpulse.docs.read()`"

**Full template**: [`.agent/task/claude-md-template-PRODUCTPULSE.md`](.agent/task/claude-md-template-PRODUCTPULSE.md)

**3.2 Generate `AGENTS.md` for user's repo**

**Content**: List of available agent personas from ProjectPulse DB

```markdown
# Available Agent Personas

This project uses **ProjectPulse** for agent management. All agent personas are stored in the ProjectPulse database.

## Accessing Agents

Use MCP tools to interact with agents:
```
projectpulse.agent.list()  # List all available agents
projectpulse.agent.get("nextjs-expert")  # Get specific agent prompt
```

## Agent Personas

[Generated from AgentPersona records created in Step 4]

### Next.js Expert
- **Name**: `nextjs-expert`
- **Specialization**: Next.js 14 App Router, Server Components, Server Actions
- **When to use**: Page structure, routing, data fetching decisions

### Prisma Expert
- **Name**: `prisma-expert`
- **Specialization**: Database design, Prisma ORM, query optimization
- **When to use**: Schema design, migrations, complex queries

[... more agents based on techStack ...]
```

**Files created in user's repo**:
- ✅ `CLAUDE.md` (ProductPulse-specific instructions)
- ✅ `AGENTS.md` (agent personas list)

**❌ NOT created**:
- `DEVELOPMENT_PLAN.md` (replaced by Roadmap UI)
- `STATUS.md` (replaced by Memory Bank: active-context)
- `.agent/` folder (doesn't exist in ProductPulse workflow)

---

#### **Step 4: Create AgentPersona Records (ProjectPulse DB)**

**MCP Tool**: `projectpulse.agent.create(name, description, prompt, skills, tools)`

**Always create** (12 generic agents):
- `code-reviewer` - Code quality review
- `api-expert` - RESTful API design patterns
- `security-expert` - Security audit and vulnerability scanning
- `performance-optimizer` - Performance profiling and optimization
- `accessibility-expert` - WCAG 2.1 AA compliance
- `testing-expert` - Test strategy and implementation
- `devops-expert` - CI/CD and deployment
- `documentation-expert` - Technical documentation generation
- `refactoring-expert` - Code refactoring strategies
- `debugger` - Bug diagnosis and fixing
- `architect` - System architecture decisions
- `database-expert` - Database design and optimization

**Tech-specific agents** (conditional based on `techStack`):
- If `techStack.frontend` includes "Next.js" → `nextjs-expert`
- If `techStack.database` includes "Prisma" → `prisma-expert`
- If `techStack.frontend` includes "React" → `react-expert`
- If `techStack.database` includes "Supabase" → `supabase-expert`
- If `techStack.ai` != "None" → `ai-ml-expert`

**Example MCP call**:
```
projectpulse.agent.create(
  name: "nextjs-expert",
  description: "Next.js 14 App Router specialist",
  prompt: "[Full agent prompt from template]",
  skills: ["routing", "server-components", "data-fetching"],
  tools: ["next-js-patterns", "server-actions"]
)
```

**Total agents created**: 12-18 (depending on tech stack)

**Visible in**: Agent AI Hub UI → Agents tab

---

#### **Step 5: Create Skill Records (ProjectPulse DB)**

**MCP Tool**: `projectpulse.skill.create(name, category, content)`

**Always create** (7 generic skills):
- `api-patterns` - REST API design patterns
- `component-patterns` - React component architecture
- `database-patterns` - Database design and queries
- `testing-patterns` - Unit, integration, E2E testing
- `security-patterns` - Security best practices
- `performance-patterns` - Performance optimization
- `git-workflow` - Git branching and commits

**Project-type-specific skills**:
- If `projectType` == "SaaS" → `saas-patterns`, `multi-tenancy`, `subscription-management`
- If `projectType` == "E-commerce" → `ecommerce-patterns`, `cart-management`, `payment-processing`
- If `techStack.ai` != "None" → `ai-integration-patterns`, `prompt-engineering`

**Example MCP call**:
```
projectpulse.skill.create(
  name: "api-patterns",
  category: "generic",
  content: "[Markdown content from template skill file]"
)
```

**Total skills created**: 7-15 (depending on project type)

**Visible in**: Agent AI Hub UI → Skills tab

---

#### **Step 6: Create SOP Records (ProjectPulse DB)**

**MCP Tool**: `projectpulse.sop.create(name, category, content)`

**Always create**:
- `security-checklist` - Pre-deployment security audit checklist
- `git-workflow` - Branch management and commit conventions
- `code-review-checklist` - Code review guidelines

**Project-specific SOPs**:
- If SaaS with payments → `stripe-integration-sop`, `subscription-lifecycle-sop`
- If using Docker → `docker-setup-sop`, `container-debugging-sop`
- If multi-region → `deployment-rollout-sop`

**Example MCP call**:
```
projectpulse.sop.create(
  name: "security-checklist",
  category: "generic",
  content: "[Markdown checklist from template]"
)
```

**Total SOPs created**: 3-8 (depending on project needs)

**Visible in**: Agent AI Hub UI → SOPs tab

---

#### **Step 7: Create Roadmap Record (ProjectPulse DB)**

**MCP Tool**: `projectpulse.roadmap.create(phases, currentPhase)`

**Source**: `13-Project-Plan.md` document (from Session 2) + `project-context.json.phases[]`

**Roadmap structure**:
```json
{
  "phases": [
    {
      "id": 1,
      "name": "Foundation & Authentication",
      "duration": "2 weeks",
      "goals": ["Set up environment", "Implement auth", "Create UI structure"],
      "deliverables": ["User auth", "Protected routes", "Basic layout"],
      "status": "pending"
    }
    // ... more phases from project-context.json
  ],
  "currentPhase": "Phase 1: Foundation & Authentication",
  "currentSprint": null,
  "currentDay": null
}
```

**MCP Call**:
```
projectpulse.roadmap.create(phases, "Phase 1: Foundation & Authentication")
```

**Visible in**: Roadmap UI page (`/roadmap`)

**Dynamic updates**: When agents start work, they call:
- `projectpulse.roadmap.updateCurrentPhase()`
- `projectpulse.roadmap.updateCurrentSprint()`
- `projectpulse.roadmap.updateCurrentDay()`

---

#### **Step 8: Create DevelopmentSession Record (Onboarding Summary)**

**MCP Tool**: `projectpulse.session.create(phase, goals, plan, status)`

**Session details**:
```json
{
  "phase": "Session 3: Project Bootstrap",
  "goals": [
    "Configure ProjectPulse database",
    "Generate CLAUDE.md and AGENTS.md",
    "Create Memory Bank records",
    "Set up agent personas and skills",
    "Initialize roadmap"
  ],
  "plan": "Session 1: Answered 98 strategic questions\nSession 2: Generated 15 industry docs (35K words)\nSession 3: Configured ProjectPulse with Memory Bank, Agents, Skills, SOPs, Roadmap",
  "progress": "Onboarding completed successfully:\n- Memory Bank: 5 records created\n- Agents: [N] personas configured\n- Skills: [N] patterns added\n- SOPs: [N] procedures documented\n- Roadmap: [N] phases loaded\n- Files in repo: CLAUDE.md, AGENTS.md",
  "status": "completed"
}
```

**MCP Call**:
```
projectpulse.session.create(
  phase: "Session 3: Project Bootstrap",
  goals: [...],
  plan: "...",
  status: "completed"
)
```

**Visible in**: Agent AI Hub UI → Sessions tab

---

#### **Step 9: Validation & Report**

**Validation Checklist**:
- ✅ Memory Bank: 5 records created (project-brief, system-patterns, tech-context, active-context, progress)
- ✅ CLAUDE.md: Generated with ProjectPulse instructions
- ✅ AGENTS.md: Generated with agent personas list
- ✅ AgentPersona: [N] records created
- ✅ Skill: [N] records created
- ✅ SOP: [N] records created
- ✅ Roadmap: 1 record created with [N] phases
- ✅ DevelopmentSession: Onboarding session record created

**Report to User**:
```markdown
✅ **ProjectPulse Onboarding Complete!**

## Summary
Your project **[PROJECT_NAME]** is now ready for AI-native development with ProjectPulse.

## What Was Created

### ProjectPulse Database
- ✅ Memory Bank: 5 records (~8K tokens)
  - project-brief, system-patterns, tech-context, active-context, progress
- ✅ Agent Personas: [N] agents configured
  - nextjs-expert, prisma-expert, react-expert, [...]
- ✅ Skills: [N] patterns documented
  - api-patterns, component-patterns, testing-patterns, [...]
- ✅ SOPs: [N] procedures created
  - security-checklist, git-workflow, [...]
- ✅ Roadmap: [N] phases loaded from Project Plan
- ✅ Session: Onboarding record created

### Your Repository
- ✅ CLAUDE.md: Integration guide (ProjectPulse-specific)
- ✅ AGENTS.md: Available agent personas

**Your repo is CLEAN** - No `.agent/` folder, no `docs/` clutter ✅

## Next Steps: Start Development

You're ready to build! To start your first development session:

1. **Verify ProjectPulse connection**:
   ```bash
   # Your agent will call this automatically
   projectpulse.health.check()
   ```

2. **Tell your agent**: "Let's start Phase 1 development following the 5-step protocol"

3. **Your agent will**:
   - ✅ Read Memory Bank from ProjectPulse DB
   - ✅ Create plan and save to ProjectPulse DB
   - ✅ Consult expert agents (nextjs-expert, prisma-expert, etc.)
   - ✅ Implement with checkpoints (saved to ProjectPulse DB)
   - ✅ Update progress in ProjectPulse DB

## Where to Find Everything

- **Memory Bank**: Agent AI Hub → Memory Bank tab
- **Agents**: Agent AI Hub → Agents tab
- **Skills**: Agent AI Hub → Skills tab
- **SOPs**: Agent AI Hub → SOPs tab
- **Roadmap**: Roadmap UI (`/roadmap` page)
- **Docs**: Wiki page (15 industry docs from Session 2)
- **Blueprint**: Agent AI Hub → Blueprint View (Session 3 config)

---

**Ready to code!** 🚀

**Your first task suggestion**:
Start with Phase 1 goals from your roadmap:
[List first 3 goals from Phase 1]
```

---

### Session 3 Output Format (ProductPulse DB)

**MCP Tools Used**:
- `projectpulse.onboarding.getProjectContext()` - Fetch project-context.json
- `projectpulse.memory.create(type, content)` - Create Memory Bank records
- `projectpulse.agent.create(name, ...)` - Create AgentPersona records
- `projectpulse.skill.create(name, ...)` - Create Skill records
- `projectpulse.sop.create(name, ...)` - Create SOP records
- `projectpulse.roadmap.create(phases, currentPhase)` - Create Roadmap
- `projectpulse.session.create(...)` - Create onboarding session summary

**Database Records Created**:

```json
{
  "sessionType": "bootstrap",
  "memoryBankRecords": 5,
  "agentPersonas": 15,
  "skills": 10,
  "sops": 5,
  "roadmapCreated": true,
  "filesGenerated": {
    "CLAUDE.md": true,
    "AGENTS.md": true
  },
  "completedAt": "2025-11-16T12:00:00Z"
}
```

**Storage**:
- **OnboardingSession.response**: Metadata (counts, status, timestamp)
- **MemoryBank table**: 5 records (project-brief, system-patterns, tech-context, active-context, progress)
- **AgentPersona table**: 12-18 records (nextjs-expert, prisma-expert, etc.)
- **Skill table**: 7-15 records (api-patterns, component-patterns, etc.)
- **SOP table**: 3-8 records (security-checklist, git-workflow, etc.)
- **Roadmap table**: 1 record (phases from project-context.json)
- **DevelopmentSession table**: 1 record (onboarding summary)

**Files in User's Repo**:
- `CLAUDE.md` (ProductPulse-specific integration guide)
- `AGENTS.md` (agent personas list)

**User's Repo Status**: ✅ CLEAN (only 2 instruction files, NO `.agent/` folder)

---

## Database Schema (ProductPulse Session 3)

**Tables created/populated during Session 3**:

```prisma
model MemoryBank {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  type      String   // "project-brief" | "system-patterns" | "tech-context" | "active-context" | "progress"
  content   String   @db.Text // Markdown content (~1.5-2K tokens each)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, type]) // Each user has one of each type
  @@index([userId])
}

model AgentPersona {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name        String   // "nextjs-expert", "prisma-expert", etc.
  description String?  @db.Text
  prompt      String   @db.Text // Full agent prompt
  skills      String[] @default([])
  tools       String[] @default([])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, name])
  @@index([userId])
}

model Skill {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name        String   // "api-patterns", "component-patterns", etc.
  category    String?  // "generic" | "saas" | "ecommerce"
  content     String   @db.Text // Markdown skill content

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, name])
  @@index([userId])
}

model SOP {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name        String   // "security-checklist", "git-workflow", etc.
  category    String?  // "generic" | "saas" | "security"
  content     String   @db.Text // Markdown checklist/procedure

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, name])
  @@index([userId])
}

model Roadmap {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Static data from project-context.json
  phases        Json     // Array of phases with goals, deliverables, duration

  // Dynamic updates from agents during implementation
  currentPhase  String?  // "Phase 1: Foundation & Authentication"
  currentSprint String?  // "Sprint 1: User Auth"
  currentDay    String?  // "Day 3: OAuth Integration"

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId])
}

model DevelopmentSession {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  phase       String   // "Phase 1: Foundation", "Session 3: Bootstrap"
  goals       String[] @default([])
  plan        String?  @db.Text // Implementation plan
  todos       Json?    // Current todos {content, status, activeForm}[]
  progress    String?  @db.Text // Progress log

  status      String   // "in_progress" | "completed"

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  completedAt DateTime?

  @@index([userId, status])
  @@index([userId, createdAt])
}
```

---

## Complete MCP Tool Reference (Sessions 1-3)

### Session 1: Strategic Planning
```
projectpulse.onboarding.getQuestions(sessionType, phase?)
projectpulse.onboarding.saveAnswers(phase, answers)
projectpulse.onboarding.generateExecutiveSummary()
```

### Session 2: Documentation Generation
```
projectpulse.onboarding.getDocGenerationPrompt()
projectpulse.onboarding.getExecutiveSummary()
projectpulse.onboarding.saveDocument(filename, content, wordCount)
projectpulse.onboarding.getDocument(filename)
projectpulse.onboarding.finalizeDocumentation()
```

### Session 3: Bootstrap & Configuration
```
projectpulse.onboarding.getProjectContext()

projectpulse.memory.create(type, content)
projectpulse.memory.read(type)
projectpulse.memory.update(type, content)

projectpulse.agent.create(name, description, prompt, skills, tools)
projectpulse.agent.get(name)
projectpulse.agent.list()

projectpulse.skill.create(name, category, content)
projectpulse.skill.read(name)

projectpulse.sop.create(name, category, content)
projectpulse.sop.read(name)

projectpulse.roadmap.create(phases, currentPhase)
projectpulse.roadmap.getCurrent()
projectpulse.roadmap.updateCurrentPhase(phase)
projectpulse.roadmap.updateCurrentSprint(sprint)
projectpulse.roadmap.updateCurrentDay(day)

projectpulse.session.create(phase, goals, plan, status)
projectpulse.session.savePlan(sessionId, plan)
projectpulse.session.saveTodos(sessionId, todos)
projectpulse.session.updateProgress(sessionId, progress)
projectpulse.session.complete(sessionId, summary)

projectpulse.docs.read(filename)

projectpulse.health.check()
```

---

## Session 3 vs Template Bootstrap: Key Differences

| Aspect | Template Bootstrap | ProductPulse Bootstrap |
|--------|-------------------|------------------------|
| **Memory Bank** | 5 files in `.agent/` folder | 5 records in `MemoryBank` table |
| **CLAUDE.md** | Standard template | ProductPulse-specific (DB instructions) |
| **DEVELOPMENT_PLAN.md** | Generated file | ❌ Replaced by Roadmap UI |
| **STATUS.md** | Generated file | ❌ Replaced by Memory Bank: active-context |
| **Agent Personas** | Files in `.claude/agents/` | Records in `AgentPersona` table |
| **Skills** | Files in `.claude/skills/` | Records in `Skill` table |
| **SOPs** | Files in `.agent/sops/` | Records in `SOP` table |
| **Project Init** | `npm install`, `git init` | ❌ NOT in scope (handled by user) |
| **Session Tracking** | File: `current-session.md` | Record in `DevelopmentSession` table |
| **Repo Cleanliness** | Cluttered with 50+ files | ✅ CLEAN (only CLAUDE.md + AGENTS.md) |

---

### Session 3 Output Format

**Agent saves to**:
```json
{
  "sessionId": "session-3-[timestamp]",
  "sessionType": "bootstrap",
  "memoryBankFiles": [
    {
      "filename": "project-brief.md",
      "path": ".agent/project-brief.md",
      "tokenCount": 1500
    },
    // ... 4 more
  ],
  "totalMemoryBankTokens": 8000,
  "agentsCopied": 14,
  "skillsCopied": 10,
  "sopsCopied": 3,
  "environmentConfigured": true,
  "gitInitialized": true,
  "npmInstallSuccess": true,
  "completedAt": "[timestamp]"
}
```

**Stored in**: `OnboardingSession.response` (JSONB field)

---

## Data Flow: Session 1 → 2 → 3

```
Session 1: Strategic Planning
    ↓
[Agent asks 10 phases of questions]
    ↓
[Saves answers to planningAnswers JSONB]
    ↓
[Synthesizes into Executive Summary]
    ↓
Session 2: Documentation Generation
    ↓
[Agent generates 15 docs from Executive Summary]
    ↓
[Populates project-context.json with metadata, phases, features]
    ↓
[Saves doc metadata to documentsGenerated array]
    ↓
Session 3: Bootstrap & Configuration
    ↓
[Agent reads project-context.json]
    ↓
[Creates 5 Memory Bank files from project-context.json]
    ↓
[Customizes CLAUDE.md, DEVELOPMENT_PLAN.md, STATUS.md]
    ↓
[Copies agents/skills/SOPs based on techStack]
    ↓
[Initializes project infrastructure (npm, git, .env)]
    ↓
[Creates first session file]
    ↓
✅ AI Development Workflow Ready
```

---

## Storage in ProjectPulse Database

**Table**: `OnboardingSession`

**Schema**:
```prisma
model OnboardingSession {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  sessionType String   // "strategic-planning" | "documentation-generation" | "bootstrap"
  step        Int      // Current step (1-10 for Session 1, 1-15 for Session 2, 1-8 for Session 3)
  status      String   // "in_progress" | "completed" | "abandoned"

  response    Json     // JSONB field storing session-specific data

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  completedAt DateTime?

  @@index([userId, sessionType])
}
```

**Session 1 Storage**:
```json
{
  "sessionType": "strategic-planning",
  "response": {
    "planningAnswers": {
      "strategic": { /* Q1-Q10 */ },
      "detailed": { /* Phase 1-10 */ }
    },
    "currentPhase": 7,
    "currentQuestion": 2,
    "completedQuestions": [/* question IDs */]
  }
}
```

**Session 2 Storage**:
```json
{
  "sessionType": "documentation-generation",
  "response": {
    "documentsGenerated": [
      {
        "filename": "01-PRD.md",
        "path": "docs/01-PRD.md",
        "wordCount": 2500,
        "generatedAt": "2025-11-16T10:30:00Z"
      }
      // ... 14 more
    ],
    "totalWordCount": 35000,
    "executiveSummary": "..." // Full text of Executive Summary
  }
}
```

**Session 3 Storage**:
```json
{
  "sessionType": "bootstrap",
  "response": {
    "memoryBankFiles": [
      { "filename": "project-brief.md", "tokenCount": 1500 }
      // ... 4 more
    ],
    "totalMemoryBankTokens": 8000,
    "agentsCopied": 14,
    "skillsCopied": 10,
    "sopsCopied": 3,
    "environmentConfigured": true,
    "gitInitialized": true,
    "npmInstallSuccess": true,
    "projectContextJson": { /* Full project-context.json */ }
  }
}
```

---

## Implementation Notes for Sprint 8.5 Phase 2

**Goal**: Create Session 3 Blueprint View UI in ProjectPulse

**Requirements**:
1. **MCP Tool**: `projectpulse.blueprint.get` - Reads `OnboardingSession` where `sessionType="bootstrap"`
2. **API Route**: `GET /api/onboarding/blueprint` - Returns Session 3 data
3. **Component**: `BlueprintView.tsx` - Displays project-context.json data in readable format
4. **Integration**: Add "View Blueprint" button to `/agents` page

**Data to Display**:
- Metadata (project name, type, domain, target users)
- Tech Stack (frontend, backend, database, auth, hosting)
- Architecture (type, data access, caching)
- Phases (id, name, duration, goals, deliverables, status)
- Features (name, description, priority, phase)
- Architectural Decisions (ADRs)
- Timeline (start date, duration, target launch)
- Team (size, roles)
- Budget (development, monthly operating)

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Blueprint: [Project Name]                           │
├─────────────────────────────────────────────────────┤
│ Metadata                                            │
│ • Type: SaaS                                        │
│ • Domain: Project Management                        │
│ • Target Users: Freelancers, Small teams           │
├─────────────────────────────────────────────────────┤
│ Tech Stack                                          │
│ • Frontend: Next.js 15 + React 19                   │
│ • Database: Supabase (PostgreSQL)                   │
│ • Auth: Supabase Auth                               │
│ • Hosting: Vercel                                   │
├─────────────────────────────────────────────────────┤
│ Phases                                              │
│ Phase 1: Foundation & Authentication (2 weeks)      │
│ • Goals: [list]                                     │
│ • Deliverables: [list]                              │
│ • Status: pending                                   │
├─────────────────────────────────────────────────────┤
│ Architectural Decisions                             │
│ ADR-001: Tech Stack Selection                       │
│ • Decision: Next.js 15 + Supabase + Vercel          │
│ • Rationale: Modern, scalable, cost-effective       │
└─────────────────────────────────────────────────────┘
```

---

## Key Insights for Implementation

### What Makes This Agent-First

**Human's Role**: Answers 10 phases of questions in Session 1, provides API keys in Session 3

**Agent's Role**:
- Session 1: Asks questions, collects answers, synthesizes into Executive Summary
- Session 2: Generates 15 industry docs from Executive Summary (FULLY AUTOMATED)
- Session 3: Reads project-context.json, sets up entire AI workflow (FULLY AUTOMATED)

**End Result**: Human spends 30-60 minutes answering questions. Agent generates 35,000 words of documentation + fully configured development environment.

### Why This Works

**Single Source of Truth**: `project-context.json` (155 lines) contains ALL planning data

**Token Efficiency**:
- Questions: ~8K tokens (10 phases × ~800 tokens each)
- Answers: ~10K tokens (user responses)
- Docs generated: 35K+ words → but stored in database, not in context
- Memory Bank: 8K tokens (5 files)

**Progressive Enhancement**:
- Session 1: Strategic → Detailed planning (10 phases)
- Session 2: Planning → Documentation (15 docs)
- Session 3: Documentation → Working codebase (automated setup)

---

## Reference Files Summary

**Session 1**: `master-workflow-template/.planning/questions.md` (863 lines)
- 10 phases of strategic questions
- 98 total questions
- Covers Product, Tech, UX, Architecture, DevOps, Backend, Frontend, QA, Deployment, Security

**Session 2**: `master-workflow-template/.planning/DOCS_GENERATION_PROMPT.md` (129 lines)
- AI prompt template for generating 15 docs
- Inputs: Executive Summary (synthesized from Session 1)
- Outputs: 01-PRD.md through 13-Project-Plan.md (35K+ words)

**Session 3**: `master-workflow-template/.claude/agents/orchestrators/bootstrap-orchestrator.md` (952 lines)
- 8-step automated setup process
- Reads: project-context.json (populated by Sessions 1+2)
- Creates: 5 Memory Bank files, copies agents/skills/SOPs, initializes project infrastructure

**Data Structure**: `master-workflow-template/project-context.json` (155 lines)
- Single source of truth for all 3 sessions
- Stores metadata, tech stack, architecture, phases, features, ADRs, planning answers, timeline, team, budget

---

**Status**: ✅ Complete reference scan of 3-session onboarding system
**Next Step**: Use this reference to implement Sprint 8.5 Phase 2 (Session 3 Blueprint View)
