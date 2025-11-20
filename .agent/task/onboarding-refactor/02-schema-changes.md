# Database Schema Changes

**Related**: [Overview](./01-overview.md) | [MCP Tools](./03-mcp-tools.md) | [Implementation](./04-implementation-plan.md)

---

## Overview

This document specifies all database schema changes required for the onboarding refactor, including:
1. `OnboardingSession` model updates (explicit JSONB fields)
2. New `WorkflowTemplate` table (prompt storage)
3. Prisma migration scripts
4. Seed data updates (96 questions + prompt templates)

---

## 1. OnboardingSession Model Updates

### Current Schema (Sprint 8.7)

```prisma
model OnboardingSession {
  id        Int     @id @default(autoincrement())
  projectId Int
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  sessionNumber Int
  response      Json?     @db.JsonB  // ⚠️ Nested structure, hard to query
  status        String    @default("pending")
  startedAt     DateTime?
  completedAt   DateTime?

  documents Document[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([projectId, sessionNumber])
  @@index([projectId])
  @@index([projectId, status])
  @@map("onboarding_sessions")
}
```

### Refactored Schema

```prisma
model OnboardingSession {
  id        Int     @id @default(autoincrement())
  projectId Int
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  sessionNumber Int      // 1-3
  status        String   @default("pending") // 'pending' | 'in_progress' | 'complete' | 'failed'
  
  // ✨ NEW: Explicit top-level fields (replace nested response JSONB)
  planningAnswers    Json?  @db.JsonB // Session 1: {phase1: {...}, phase2: {...}, ...}
  projectContextJson Json?  @db.JsonB // Merged: {metadata, techStack, phases, executiveSummary}
  validationReport   Json?  @db.JsonB // Agent validation: {complete: true, gaps: []}
  metrics            Json?  @db.JsonB // {tokensUsed, phasesComplete, batchesComplete, duration}
  
  // DEPRECATED (backward compat - remove Sprint 10)
  response      Json?     @db.JsonB
  
  startedAt     DateTime?
  completedAt   DateTime?

  documents Document[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([projectId, sessionNumber])
  @@index([projectId])
  @@index([projectId, status])
  @@map("onboarding_sessions")
}
```

### Field Descriptions

#### `planningAnswers` (Session 1)
Stores phase-by-phase answers during Session 1 strategic planning.

**Structure**:
```json
{
  "phase1": {
    "phase1_q1": "SaaS developers building AI-powered tools",
    "phase1_q2": "Age 25-45, tech-savvy, pain: context switching",
    ...
  },
  "phase2": {
    "phase2_q1": ["Next.js", "PostgreSQL", "Prisma"],
    ...
  },
  ...
  "phase10": { ... }
}
```

**Usage**: Incrementally built via `savePhase()` MCP tool.

#### `projectContextJson` (All Sessions)
Merged context from all phases + executive summary. Used in Session 2/3 prompts.

**Structure**:
```json
{
  "metadata": {
    "projectName": "TaskFlow",
    "projectType": "web application",
    "createdAt": "2025-11-20T10:00:00Z"
  },
  "techStack": {
    "frontend": ["Next.js", "React", "TailwindCSS"],
    "backend": ["Node.js", "PostgreSQL", "Prisma"],
    "deployment": ["Docker", "AWS"]
  },
  "phases": {
    "phase1": { ... },
    "phase2": { ... },
    ...
  },
  "executiveSummary": "TaskFlow is a SaaS platform that..."
}
```

**Usage**: 
- Session 2: Injected into doc batch prompts
- Session 3: Tech stack detection for personas/skills

#### `validationReport` (All Sessions)
Agent-generated validation when completing a session.

**Structure**:
```json
{
  "complete": true,
  "gaps": [],
  "warnings": ["Consider adding E2E tests section to Testing.md"],
  "recommendations": ["Session 3: Create 7 personas (React, Node, DB, DevOps, Security, Testing, Product)"]
}
```

**Usage**: Stored via `completeSession()` MCP tool.

#### `metrics` (All Sessions)
Token usage and progress tracking.

**Structure**:
```json
{
  "tokensUsed": 58234,
  "phasesComplete": 10,        // Session 1
  "batchesComplete": 4,         // Session 2
  "duration": 5234,             // seconds
  "checkpoints": [
    {"phase": 1, "tokens": 5420, "timestamp": "2025-11-20T10:05:00Z"},
    {"phase": 2, "tokens": 11234, "timestamp": "2025-11-20T10:15:00Z"}
  ]
}
```

**Usage**: Updated via `checkTokenBudget()` and `logStep()` tools.

---

## 2. WorkflowTemplate Table (New)

### Schema

```prisma
model WorkflowTemplate {
  id             String  @id @default(cuid())
  projectId      Int?    // NULL = global template, Int = project-specific
  project        Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // Template identification
  name           String  // 'onboarding-session-1-phase-1', 'onboarding-session-2-batch-1'
  category       String  // 'onboarding' | 'development' | 'knowledge' | 'project-management'
  sessionNumber  Int?    // 1-3 for onboarding templates
  phase          Int?    // 1-10 for Session 1 phases
  batch          Int?    // 1-4 for Session 2 batches
  
  // Prompt content
  systemPrompt   String  @db.Text // AI system instructions
  userPrompt     String  @db.Text // User prompt template with variables: {projectId}, {context}, etc.
  
  // Template configuration
  variables      Json    @db.JsonB // {projectId: 'number', phase: 'number', context: 'object'}
  temperature    Float   @default(0.7)
  maxTokens      Int     @default(2000)
  
  // Metadata
  description    String? @db.Text // Human-readable description
  isActive       Boolean @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([name, isActive]) // Only one active template per name
  @@index([category])
  @@index([sessionNumber])
  @@index([projectId, category])
  @@map("workflow_templates")
}
```

### Example Records

#### Session 1 Phase Prompt
```json
{
  "name": "onboarding-session-1-phase-1",
  "category": "onboarding",
  "sessionNumber": 1,
  "phase": 1,
  "systemPrompt": "You are a Product Manager conducting strategic planning interviews.",
  "userPrompt": "Ask the user these Phase 1 questions conversationally:\n\n{questions}\n\nCollect answers in this format:\n{\n  \"phase1_q1\": \"answer\",\n  \"phase1_q2\": \"answer\"\n}\n\nAfter collecting all answers, call savePhase(projectId: {projectId}, phase: 1, answers: {...}).",
  "variables": {"projectId": "number", "questions": "array"},
  "temperature": 0.7,
  "maxTokens": 2000
}
```

#### Session 2 Batch Prompt
```json
{
  "name": "onboarding-session-2-batch-1",
  "category": "onboarding",
  "sessionNumber": 2,
  "batch": 1,
  "systemPrompt": "You are a Technical Writer generating industry-standard project documentation.",
  "userPrompt": "Generate these documents for Batch 1:\n\n**Documents**: 01-PRD.md, 02-SRS.md, 12-Backlog.md, 13-Project-Plan.md\n\n**Context**:\n{executiveSummary}\n{projectContextJson}\n\n**Instructions**:\n1. PRD: Product vision, features, user stories, success metrics (~2500 words)\n2. SRS: Functional/non-functional requirements, use cases (~3000 words)\n3. Backlog: Prioritized user stories with acceptance criteria (~1500 words)\n4. Project Plan: Phases, sprints, weeks, deliverables (~2000 words)\n\n**Ensure traceability**: SRS FRs trace to PRD features, Backlog traces to SRS",
  "variables": {"executiveSummary": "string", "projectContextJson": "object"},
  "temperature": 0.7,
  "maxTokens": 12000
}
```

---

## 3. Migration Script

### File: `apps/web/prisma/migrations/XXXXXX_onboarding_refactor/migration.sql`

```sql
-- ============================================================================
-- Migration: Onboarding Refactor Schema Changes
-- Sprint: 9 (Phase E)
-- Date: 2025-11-20
-- ============================================================================

-- Step 1: Add new fields to OnboardingSession (nullable for backward compat)
ALTER TABLE "onboarding_sessions" 
ADD COLUMN IF NOT EXISTS "planning_answers" JSONB,
ADD COLUMN IF NOT EXISTS "project_context_json" JSONB,
ADD COLUMN IF NOT EXISTS "validation_report" JSONB,
ADD COLUMN IF NOT EXISTS "metrics" JSONB;

-- Step 2: Migrate existing data from response JSONB to new fields
UPDATE "onboarding_sessions"
SET 
  "planning_answers" = response->'planningAnswers',
  "project_context_json" = response->'projectContextJson',
  "metrics" = jsonb_build_object(
    'tokensUsed', COALESCE((response->'metrics'->>'tokensUsed')::int, 0),
    'phasesComplete', COALESCE((response->>'currentPhase')::int, 0)
  )
WHERE response IS NOT NULL;

-- Step 3: Add comment for future cleanup
COMMENT ON COLUMN "onboarding_sessions"."response" IS 
'DEPRECATED: Use planning_answers, project_context_json instead. Remove after Sprint 10.';

-- Step 4: Create WorkflowTemplate table
CREATE TABLE IF NOT EXISTS "workflow_templates" (
  "id" TEXT NOT NULL,
  "project_id" INTEGER,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "session_number" INTEGER,
  "phase" INTEGER,
  "batch" INTEGER,
  "system_prompt" TEXT NOT NULL,
  "user_prompt" TEXT NOT NULL,
  "variables" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
  "max_tokens" INTEGER NOT NULL DEFAULT 2000,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- Step 5: Add foreign key constraint
ALTER TABLE "workflow_templates" 
ADD CONSTRAINT "workflow_templates_project_id_fkey" 
FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "workflow_templates_name_is_active_key" 
ON "workflow_templates"("name", "is_active") WHERE "is_active" = true;

CREATE INDEX IF NOT EXISTS "workflow_templates_category_idx" 
ON "workflow_templates"("category");

CREATE INDEX IF NOT EXISTS "workflow_templates_session_number_idx" 
ON "workflow_templates"("session_number");

CREATE INDEX IF NOT EXISTS "workflow_templates_project_id_category_idx" 
ON "workflow_templates"("project_id", "category");

-- Step 7: Add updated_at trigger for WorkflowTemplate
CREATE OR REPLACE FUNCTION update_workflow_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_template_updated_at
BEFORE UPDATE ON "workflow_templates"
FOR EACH ROW
EXECUTE FUNCTION update_workflow_template_updated_at();
```

### Migration Commands

```bash
# Generate migration
cd apps/web
pnpm prisma migrate dev --name onboarding_refactor_schema

# Verify migration
pnpm prisma migrate status

# Apply to production (later)
pnpm prisma migrate deploy
```

---

## 4. Seed Data Updates

### 4.1 Update OnboardingQuestion Seed (96 Questions)

**File**: `apps/web/prisma/seeds/onboarding-questions.ts`

**Change**: Expand from current questions to full 96 questions across 10 phases.

```typescript
import { PrismaClient, Prisma } from '@prisma/client';

const questions: Prisma.OnboardingQuestionCreateInput[] = [
  // Phase 1: Product Manager - Foundation (11 questions)
  {
    phase: 1,
    subsection: '1.1 User Personas',
    questionNumber: 1,
    questionText: 'Who are the primary users of your product?',
    placeholder: 'e.g., SaaS developers, small business owners, students',
    helpText: 'Describe 2-3 specific user types',
    validationType: 'text',
    isRequired: true,
    minLength: 10,
    maxLength: 500
  },
  {
    phase: 1,
    subsection: '1.1 User Personas',
    questionNumber: 2,
    questionText: 'What are their demographics, behaviors, and pain points?',
    placeholder: 'Age, tech expertise, current workflow challenges',
    validationType: 'text',
    isRequired: true,
    minLength: 20,
    maxLength: 1000
  },
  // ... 9 more Phase 1 questions
  
  // Phase 2: Strategic Planning (10 questions)
  {
    phase: 2,
    subsection: '2.1 Tech Stack Selection',
    questionNumber: 1,
    questionText: 'What tech stack are you considering?',
    placeholder: 'Next.js + Supabase, T3 Stack, MERN',
    validationType: 'array',
    isRequired: true
  },
  // ... 9 more Phase 2 questions
  
  // Phases 3-10: ~9-10 questions each (total 96)
  // ... full list
];

export async function seedOnboardingQuestions(prisma: PrismaClient) {
  console.log('🌱 Seeding 96 onboarding questions...');
  
  for (const question of questions) {
    await prisma.onboardingQuestion.upsert({
      where: {
        phase_subsection_questionNumber: {
          phase: question.phase,
          subsection: question.subsection,
          questionNumber: question.questionNumber
        }
      },
      update: question,
      create: question
    });
  }
  
  console.log('✅ Seeded 96 onboarding questions');
}
```

**TODO**: Full 96-question list to be finalized from spec Section 1.

### 4.2 Create WorkflowTemplate Seed

**File**: `apps/web/prisma/seeds/workflow-templates.ts` (NEW)

```typescript
import { PrismaClient, Prisma } from '@prisma/client';

const onboardingTemplates: Prisma.WorkflowTemplateCreateInput[] = [
  // Session 1: 10 Phase Prompts
  {
    name: 'onboarding-session-1-phase-1',
    category: 'onboarding',
    sessionNumber: 1,
    phase: 1,
    systemPrompt: 'You are a Product Manager conducting strategic planning interviews.',
    userPrompt: `Ask the user these Phase 1 questions conversationally:

{questions}

Collect answers in this format:
{
  "phase1_q1": "answer",
  "phase1_q2": "answer",
  ...
}

After collecting all answers, call savePhase(projectId: {projectId}, phase: 1, answers: {...}).`,
    variables: { projectId: 'number', questions: 'array' },
    temperature: 0.7,
    maxTokens: 2000,
    description: 'Phase 1: Product Manager - Foundation questions',
    isActive: true
  },
  // ... Phases 2-10 (similar structure)
  
  // Session 1: Executive Summary
  {
    name: 'onboarding-session-1-executive-summary',
    category: 'onboarding',
    sessionNumber: 1,
    systemPrompt: 'You are a Product Strategist synthesizing research into an executive summary.',
    userPrompt: `Based on these 96 strategic planning answers, generate a 500-word executive summary:

**Phase 1: Product Manager - Foundation**
{phase1Answers}

**Phase 2: Strategic Planning**
{phase2Answers}

... [Phases 3-10]

**Requirements**:
- 400-600 words
- Cover: vision, users, features, tech, timeline, risks
- Actionable for technical co-founders`,
    variables: { 
      phase1Answers: 'object',
      phase2Answers: 'object',
      // ... phase3-10
    },
    temperature: 0.7,
    maxTokens: 1000,
    description: 'Session 1: Executive summary generation',
    isActive: true
  },
  
  // Session 2: 4 Batch Prompts
  {
    name: 'onboarding-session-2-batch-1',
    category: 'onboarding',
    sessionNumber: 2,
    batch: 1,
    systemPrompt: 'You are a Technical Writer generating industry-standard project documentation.',
    userPrompt: `Generate these documents for Batch 1:

**Documents**: 01-PRD.md, 02-SRS.md, 12-Backlog.md, 13-Project-Plan.md

**Context**:
{executiveSummary}
{projectContextJson}

**Instructions**:
1. PRD: Product vision, features, user stories, success metrics (~2500 words)
2. SRS: Functional/non-functional requirements, use cases (~3000 words)
3. Backlog: Prioritized user stories with acceptance criteria (~1500 words)
4. Project Plan: Phases, sprints, weeks, deliverables (~2000 words)

**Ensure traceability**: SRS FRs trace to PRD features, Backlog traces to SRS`,
    variables: { executiveSummary: 'string', projectContextJson: 'object' },
    temperature: 0.7,
    maxTokens: 12000,
    description: 'Session 2 Batch 1: Planning documents (PRD, SRS, Backlog, Project Plan)',
    isActive: true
  },
  // ... Batches 2-4 (similar structure)
  
  // Session 3: Bootstrap
  {
    name: 'onboarding-session-3-bootstrap',
    category: 'onboarding',
    sessionNumber: 3,
    systemPrompt: 'You are a System Architect parsing project plans into structured data.',
    userPrompt: `Parse this 13-Project-Plan.md into JSON:

{projectPlanMarkdown}

**Output Schema**:
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

**Validation**:
- Unique sprint names per phase
- Positive story points
- 5-7 weeks per sprint
- If parse <90% complete, call workflow.consultExpert()

**Tech Stack** (use for personas/skills): {techStack}`,
    variables: { projectPlanMarkdown: 'string', techStack: 'array' },
    temperature: 0.3,
    maxTokens: 5000,
    description: 'Session 3: Bootstrap prompt for parsing Project Plan to JSON',
    isActive: true
  }
];

export async function seedWorkflowTemplates(prisma: PrismaClient) {
  console.log('🌱 Seeding workflow templates...');
  
  for (const template of onboardingTemplates) {
    await prisma.workflowTemplate.upsert({
      where: {
        name_isActive: {
          name: template.name,
          isActive: true
        }
      },
      update: template,
      create: template
    });
  }
  
  console.log(`✅ Seeded ${onboardingTemplates.length} workflow templates`);
}
```

### 4.3 Update Main Seed Script

**File**: `apps/web/prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { seedOnboardingQuestions } from './seeds/onboarding-questions';
import { seedWorkflowTemplates } from './seeds/workflow-templates';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Existing seeds
  // ...
  
  // Onboarding seeds
  await seedOnboardingQuestions(prisma);
  await seedWorkflowTemplates(prisma);
  
  console.log('✅ Seeding complete');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 5. Verification Steps

### After Migration

```bash
# Verify schema
pnpm prisma db pull
pnpm prisma format

# Check migration applied
pnpm prisma migrate status

# Verify seed data
psql -h 192.168.1.15 -U postgres -d projectpulse_dev
> SELECT COUNT(*) FROM onboarding_questions; -- Should be 96
> SELECT COUNT(*) FROM workflow_templates WHERE category='onboarding'; -- Should be ~16
> SELECT name, session_number FROM workflow_templates ORDER BY session_number, phase;
> \q
```

### Test Schema Queries

```typescript
// Test querying new fields
const session = await prisma.onboardingSession.findUnique({
  where: { projectId_sessionNumber: { projectId: 1, sessionNumber: 1 } },
  select: {
    planningAnswers: true,
    projectContextJson: true,
    metrics: true
  }
});

// Test WorkflowTemplate lookup
const template = await prisma.workflowTemplate.findUnique({
  where: { name_isActive: { name: 'onboarding-session-1-phase-1', isActive: true } }
});
```

---

## Next Steps

After schema changes are complete:
1. **Update MCP Tools** → [MCP Tools Spec](./03-mcp-tools.md)
2. **Update API Routes** → Use new schema fields
3. **Follow Implementation Plan** → [Implementation](./04-implementation-plan.md)
4. **Test Migration** → [Migration & Testing](./05-migration-testing.md)
