/**
 * Seed: Onboarding Prompt Templates
 * Sprint 9 Refactor: Database-driven prompts for agent-side AI generation
 *
 * 16 templates total:
 * - 10 for Session 1 phases
 * - 1 for Session 1 executive summary
 * - 4 for Session 2 batches
 * - 1 for Session 3 bootstrap
 */

import { PrismaClient, Prisma } from '@prisma/client';

const templates: Prisma.OnboardingPromptTemplateCreateInput[] = [
  // ============================================================================
  // SESSION 1: PHASE PROMPTS (10 templates)
  // ============================================================================

  {
    name: 'onboarding-session-1-phase-1',
    category: 'onboarding',
    sessionNumber: 1,
    phase: 1,
    systemPrompt:
      'You are a Product Manager conducting strategic planning interviews with a project founder.',
    userPrompt: `**Phase 1: Product Manager - Foundation**

Ask the user these questions conversationally, one at a time:

{questions}

After collecting all answers for this phase, format them as JSON:
\`\`\`json
{
  "phase1_q1": "answer here",
  "phase1_q2": "answer here",
  ...
}
\`\`\`

Then call: \`savePhase(projectId: {projectId}, phase: 1, answers: {...})\`

**Guidelines:**
- Ask questions naturally, not like a form
- Provide examples if user seems stuck
- Validate answers before saving (e.g., tech stack should be array of strings)
- Stay under 20K tokens for this phase`,
    variables: {
      projectId: 'number',
      questions: 'array',
    },
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Phase 1: Product Manager - Foundation (11 questions)',
    isActive: true,
  },

  {
    name: 'onboarding-session-1-phase-2',
    category: 'onboarding',
    sessionNumber: 1,
    phase: 2,
    systemPrompt: 'You are a Strategic Planning consultant helping define tech stack and timeline.',
    userPrompt: `**Phase 2: Strategic Planning - Business & Tech**

Ask the user these questions conversationally:

{questions}

Format answers as JSON and call: \`savePhase(projectId: {projectId}, phase: 2, answers: {...})\`

**Focus areas:** Tech stack selection, cost analysis, timeline planning, risk assessment`,
    variables: {
      projectId: 'number',
      questions: 'array',
    },
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Phase 2: Strategic Planning (10 questions)',
    isActive: true,
  },

  // Phases 3-10: Similar structure (abbreviated for brevity - expand in production)
  {
    name: 'onboarding-session-1-phase-3',
    category: 'onboarding',
    sessionNumber: 1,
    phase: 3,
    systemPrompt: 'You are a UX/UI Designer gathering user experience requirements.',
    userPrompt: `**Phase 3: UX/UI Design**\n\n{questions}\n\nCall: \`savePhase(projectId: {projectId}, phase: 3, answers: {...})\``,
    variables: { projectId: 'number', questions: 'array' },
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Phase 3: UX/UI Design (9 questions)',
    isActive: true,
  },

  {
    name: 'onboarding-session-1-phase-4',
    category: 'onboarding',
    sessionNumber: 1,
    phase: 4,
    systemPrompt: 'You are a System Architect defining technical architecture.',
    userPrompt: `**Phase 4: System Architecture**\n\n{questions}\n\nCall: \`savePhase(projectId: {projectId}, phase: 4, answers: {...})\``,
    variables: { projectId: 'number', questions: 'array' },
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Phase 4: System Architecture (12 questions)',
    isActive: true,
  },

  {
    name: 'onboarding-session-1-phase-5',
    category: 'onboarding',
    sessionNumber: 1,
    phase: 5,
    systemPrompt: 'You are a DevOps Engineer planning local development and deployment.',
    userPrompt: `**Phase 5: DevOps & Local Development**\n\n{questions}\n\nCall: \`savePhase(projectId: {projectId}, phase: 5, answers: {...})\``,
    variables: { projectId: 'number', questions: 'array' },
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Phase 5: DevOps (9 questions)',
    isActive: true,
  },

  {
    name: 'onboarding-session-1-phase-6',
    category: 'onboarding',
    sessionNumber: 1,
    phase: 6,
    systemPrompt: 'You are a Backend Engineer defining API and data layer.',
    userPrompt: `**Phase 6: Backend Development**\n\n{questions}\n\nCall: \`savePhase(projectId: {projectId}, phase: 6, answers: {...})\``,
    variables: { projectId: 'number', questions: 'array' },
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Phase 6: Backend (10 questions)',
    isActive: true,
  },

  {
    name: 'onboarding-session-1-phase-7',
    category: 'onboarding',
    sessionNumber: 1,
    phase: 7,
    systemPrompt: 'You are a Frontend Engineer planning UI implementation.',
    userPrompt: `**Phase 7: Frontend Development**\n\n{questions}\n\nCall: \`savePhase(projectId: {projectId}, phase: 7, answers: {...})\``,
    variables: { projectId: 'number', questions: 'array' },
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Phase 7: Frontend (9 questions)',
    isActive: true,
  },

  {
    name: 'onboarding-session-1-phase-8',
    category: 'onboarding',
    sessionNumber: 1,
    phase: 8,
    systemPrompt: 'You are a QA Engineer defining testing strategy.',
    userPrompt: `**Phase 8: QA & Testing**\n\n{questions}\n\nCall: \`savePhase(projectId: {projectId}, phase: 8, answers: {...})\``,
    variables: { projectId: 'number', questions: 'array' },
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Phase 8: QA & Testing (8 questions)',
    isActive: true,
  },

  {
    name: 'onboarding-session-1-phase-9',
    category: 'onboarding',
    sessionNumber: 1,
    phase: 9,
    systemPrompt: 'You are a Production Engineer planning launch strategy.',
    userPrompt: `**Phase 9: Production Launch**\n\n{questions}\n\nCall: \`savePhase(projectId: {projectId}, phase: 9, answers: {...})\``,
    variables: { projectId: 'number', questions: 'array' },
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Phase 9: Production (9 questions)',
    isActive: true,
  },

  {
    name: 'onboarding-session-1-phase-10',
    category: 'onboarding',
    sessionNumber: 1,
    phase: 10,
    systemPrompt: 'You are a Security Engineer assessing security requirements.',
    userPrompt: `**Phase 10: Security & Compliance**\n\n{questions}\n\nCall: \`savePhase(projectId: {projectId}, phase: 10, answers: {...})\``,
    variables: { projectId: 'number', questions: 'array' },
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Phase 10: Security (9 questions)',
    isActive: true,
  },

  // ============================================================================
  // SESSION 1: EXECUTIVE SUMMARY
  // ============================================================================

  {
    name: 'onboarding-session-1-executive-summary',
    category: 'onboarding',
    sessionNumber: 1,
    systemPrompt: 'You are a Product Strategist synthesizing research into an executive summary.',
    userPrompt: `Based on the following 96 strategic planning answers across 10 phases, generate a **500-word executive summary** that captures:

1. **Product Vision & Goals** - What problem does this solve?
2. **Target Users** - Who are they and what do they need?
3. **Core Features** - What makes this product unique?
4. **Technical Architecture** - Key tech stack decisions
5. **Timeline & Resources** - When and how will this be built?
6. **Key Risks** - What could go wrong and how to mitigate?

---

**Phase 1: Product Manager - Foundation**
{phase1Answers}

**Phase 2: Strategic Planning - Business & Tech**
{phase2Answers}

**Phase 3: UX/UI Design - User Experience**
{phase3Answers}

**Phase 4: System Architecture - Technical Foundation**
{phase4Answers}

**Phase 5: DevOps & Local Development**
{phase5Answers}

**Phase 6: Backend Development**
{phase6Answers}

**Phase 7: Frontend Development**
{phase7Answers}

**Phase 8: QA & Testing**
{phase8Answers}

**Phase 9: Production Launch**
{phase9Answers}

**Phase 10: Security & Compliance**
{phase10Answers}

---

**Requirements:**
- 400-600 words (target: 500)
- Markdown format with clear headings
- Actionable for technical co-founders
- Highlight unique value proposition
- Mention key technical decisions and trade-offs

Generate the summary now.`,
    variables: {
      phase1Answers: 'object',
      phase2Answers: 'object',
      phase3Answers: 'object',
      phase4Answers: 'object',
      phase5Answers: 'object',
      phase6Answers: 'object',
      phase7Answers: 'object',
      phase8Answers: 'object',
      phase9Answers: 'object',
      phase10Answers: 'object',
    },
    temperature: 0.7,
    maxTokens: 1000,
    description: 'Session 1: Executive summary generation from all 96 Q&A pairs',
    isActive: true,
  },

  // ============================================================================
  // SESSION 2: DOCUMENT BATCH PROMPTS (4 templates)
  // ============================================================================

  {
    name: 'onboarding-session-2-batch-1',
    category: 'onboarding',
    sessionNumber: 2,
    batch: 1,
    systemPrompt:
      'You are a Technical Writer generating industry-standard project documentation with full traceability.',
    userPrompt: `Generate these **Planning Documents** for Batch 1:

**Documents to Generate:**
1. **01-PRD.md** (Product Requirements Document) - ~2500 words
2. **02-SRS.md** (Software Requirements Specification) - ~3000 words
3. **12-Backlog.md** (Product Backlog) - ~1500 words
4. **13-Project-Plan.md** (Project Plan) - ~2000 words

---

**Context:**

**Executive Summary:**
{executiveSummary}

**Full Project Context:**
{projectContextJson}

---

**Instructions:**

**01-PRD.md:**
- Product vision and goals
- User personas and stories
- Core features with priorities (number each section: 2.1, 2.2, etc.)
- Success metrics (KPIs)
- Out of scope (what we're NOT building)
- Use standard IEEE PRD template
- **IMPORTANT:** Use numbered sections (e.g., "2.3 User Authentication") for traceability

**02-SRS.md:**
- Functional requirements labeled **FR-001**, **FR-002**, etc.
- Non-functional requirements labeled **NFR-001**, **NFR-002**, etc.
- Use cases with actors and flows
- Data requirements
- Interface requirements
- **TRACEABILITY FORMAT (REQUIRED):** Each requirement MUST include:
  \`Traces to: PRD Section X.Y\` (e.g., "Traces to: PRD Section 2.3")
  
Example:
\`\`\`markdown
### FR-001: User Registration
Users must be able to create accounts with email and password.
Traces to: PRD Section 2.1
\`\`\`

**12-Backlog.md:**
- Epics labeled **EPIC-001**, **EPIC-002**, etc. (or "Epic 1:", "Epic 2:", etc.)
- User stories labeled **US-001**, **US-002**, etc. (or "Feature 1.1", "Feature 1.2", etc.)
- Acceptance criteria for each story
- Story point estimates
- **TRACEABILITY FORMAT (REQUIRED):** Each item MUST include:
  - \`Traces to: FR-###\` (required) - e.g., "Traces to: FR-001"
  - \`Traces to: NFR-###\` (optional) - e.g., "Traces to: NFR-002"
  - \`Sprint: N\` (required) - e.g., "Sprint: 1"

Example:
\`\`\`markdown
### US-001: User Registration Form
**Epic:** EPIC-001
**Story Points:** 3
**Sprint:** 1
Traces to: FR-001, FR-002
Traces to: NFR-001

As a new user, I want to register with my email...
\`\`\`

**13-Project-Plan.md:**
- Phases with sprints
- Week-by-week breakdown
- Deliverables per sprint
- Resource allocation
- Critical path analysis
- **SCOPE FORMAT (REQUIRED):** Each sprint section MUST include a backlog items list:

\`\`\`markdown
### Sprint 1: Foundation (Weeks 1-2)

**Goals:**
- Set up development environment
- Implement user authentication

**Scope (Backlog Items):**
- EPIC-001 / US-001 (FR-001, FR-002)
- US-002 (FR-003)
- US-003 (FR-004, NFR-001)

**Deliverables:**
- Working authentication system
- Database schema deployed
\`\`\`

Generate each document in order. Maintain consistency and full traceability across all 4 documents.`,
    variables: {
      executiveSummary: 'string',
      projectContextJson: 'object',
    },
    temperature: 0.7,
    maxTokens: 12000,
    description:
      'Session 2 Batch 1: Planning documents (PRD, SRS, Backlog, Project Plan) with traceability',
    isActive: true,
  },

  {
    name: 'onboarding-session-2-batch-2',
    category: 'onboarding',
    sessionNumber: 2,
    batch: 2,
    systemPrompt: 'You are a System Architect documenting technical architecture.',
    userPrompt: `Generate these **Architecture Documents** for Batch 2:

1. **03-Architecture.md** - System architecture (~2500 words)
2. **04-Data-Model.md** - Database schema (~2000 words)
3. **05-API-Spec.md** - API endpoints (~2500 words)

**Context:** {executiveSummary} | {projectContextJson}

**Instructions:** Follow industry standards (C4 model for architecture, ERD for data model, OpenAPI for API spec).`,
    variables: {
      executiveSummary: 'string',
      projectContextJson: 'object',
    },
    temperature: 0.7,
    maxTokens: 10000,
    description: 'Session 2 Batch 2: Architecture documents',
    isActive: true,
  },

  {
    name: 'onboarding-session-2-batch-3',
    category: 'onboarding',
    sessionNumber: 2,
    batch: 3,
    systemPrompt: 'You are a Senior Engineer documenting implementation details.',
    userPrompt: `Generate these **Implementation Documents** for Batch 3:

1. **06-UI-UX.md** - UI/UX guidelines (~2000 words)
2. **07-Security.md** - Security plan (~2500 words)
3. **08-Testing.md** - Testing strategy (~2000 words)

**Context:** {executiveSummary} | {projectContextJson}`,
    variables: {
      executiveSummary: 'string',
      projectContextJson: 'object',
    },
    temperature: 0.7,
    maxTokens: 10000,
    description: 'Session 2 Batch 3: Implementation documents',
    isActive: true,
  },

  {
    name: 'onboarding-session-2-batch-4',
    category: 'onboarding',
    sessionNumber: 2,
    batch: 4,
    systemPrompt: 'You are a DevOps Engineer and Technical Writer documenting operations.',
    userPrompt: `Generate these **Operations Documents** for Batch 4:

1. **09-Deployment.md** - Deployment guide (~1800 words)
2. **10-Observability.md** - Monitoring & logging (~1800 words)
3. **11-Performance.md** - Performance optimization (~1800 words)
4. **14-Team-Onboarding.md** - Team onboarding (~1500 words)
5. **15-Maintenance.md** - Maintenance plan (~1500 words)

**Context:** {executiveSummary} | {projectContextJson}`,
    variables: {
      executiveSummary: 'string',
      projectContextJson: 'object',
    },
    temperature: 0.7,
    maxTokens: 12000,
    description: 'Session 2 Batch 4: Operations documents',
    isActive: true,
  },

  // ============================================================================
  // SESSION 3: BOOTSTRAP PROMPT
  // ============================================================================

  {
    name: 'onboarding-session-3-bootstrap',
    category: 'onboarding',
    sessionNumber: 3,
    systemPrompt: 'You are a System Architect parsing project plans into structured data.',
    userPrompt: `**Session 3: AI Workflow Bootstrap**

Parse the **13-Project-Plan.md** document into JSON hierarchy for roadmap materialization.

---

**Project Plan Content:**
{projectPlanMarkdown}

---

**Required Output Format:**

\`\`\`json
{
  "phases": [
    {
      "title": "Phase A: Foundation",
      "order": 1,
      "sprints": [
        {
          "name": "Sprint 1",
          "weeks": "1-2",
          "points": 8,
          "goals": ["Setup PostgreSQL", "Implement Prisma"],
          "deliverables": ["Complete schema", "Migrations"]
        }
      ]
    }
  ]
}
\`\`\`

**Validation Rules:**
- Unique sprint names per phase
- Positive story points
- 5-7 weeks per sprint (typically)
- All required fields present (title, order, name, weeks, points, goals, deliverables)

**If parse <90% complete:**
- Call \`workflow.consultExpert()\` for help
- Provide specific error details

**Tech Stack** (use for generating personas/skills later):
{techStack}

After parsing, you'll use this JSON to:
1. Call \`roadmap.createHierarchy(hierarchyJson)\`
2. Generate agent personas based on tech stack
3. Generate skills library
4. Create workflow templates
5. Create SOPs

Output the parsed JSON now.`,
    variables: {
      projectPlanMarkdown: 'string',
      techStack: 'array',
    },
    temperature: 0.3, // Lower temperature for structured output
    maxTokens: 5000,
    description:
      'Session 3: Bootstrap prompt for parsing Project Plan to JSON with tech stack context',
    isActive: true,
  },
];

export async function seedOnboardingPromptTemplates(prisma: PrismaClient) {
  console.log('🌱 Seeding onboarding prompt templates...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const template of templates) {
    try {
      const existing = await prisma.onboardingPromptTemplate.findFirst({
        where: {
          name: template.name,
          isActive: true,
        },
      });

      if (existing) {
        await prisma.onboardingPromptTemplate.update({
          where: { id: existing.id },
          data: template,
        });
        updated++;
      } else {
        await prisma.onboardingPromptTemplate.create({
          data: template,
        });
        created++;
      }
    } catch (error) {
      console.error(`Failed to seed template ${template.name}:`, error);
      skipped++;
    }
  }

  console.log(`✅ Seeded ${templates.length} onboarding prompt templates`);
  console.log(`   - Created: ${created}`);
  console.log(`   - Updated: ${updated}`);
  console.log(`   - Skipped: ${skipped}`);
}
