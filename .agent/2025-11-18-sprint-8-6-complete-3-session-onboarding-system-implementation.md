# Sprint 8.6: Complete 3-Session Onboarding System - Implementation Spec

## Executive Summary

**Goal**: Implement the complete 3-session onboarding system as designed in the reference documentation.

**Sprint Points**: 40 points (4-5 days)  
**Priority**: CRITICAL - Multiple features depend on this (Roadmap UI, Agent AI Hub, Skills system, SOPs)

**What's Missing**:
1. Session 1: 10-phase questions system + executive summary generation (13 points)
2. Session 2: 15 industry documents generation with AI (15 points)
3. Session 3: Complete blueprint creation (sub-agents, skills, workflows, SOPs, CLAUDE.md/AGENTS.md) (12 points)

---

## Architecture Overview

### Data Flow

```
Session 1: Strategic Planning
├─ 10 phases × ~10 questions each = 98 questions
├─ Phase-by-phase answer collection
├─ AI executive summary generation
└─ Store in OnboardingSession.response.projectContextJson

Session 2: Documentation Generation  
├─ Fetch executive summary from Session 1
├─ AI generates 15 industry documents (~30K words total)
├─ Store documents in Document table
└─ Generate project-context.json (complete)

Session 3: AI Workflow Bootstrap
├─ Parse 13-Project-Plan.md → Materialize roadmap ✅ (DONE)
├─ Create 3-5 AgentPersona records (project-scoped)
├─ Create 5-10 Skill records (project-scoped)
├─ Create 2-3 WorkflowTemplate records (project-scoped)
├─ Create 3-5 SOP records (project-scoped)
├─ Create CurrentPlan record (initial plan)
├─ Create CurrentTodos record (initial todos)
├─ Write CLAUDE.md to user repo (file system)
└─ Write AGENTS.md to user repo (file system)
```

### Technology Stack

- **Backend**: Next.js 14 App Router API routes
- **Database**: PostgreSQL 16 with Prisma ORM
- **AI Integration**: ~~OpenAI GPT-4~~ **NONE** - Agent uses their own AI provider (privacy-first, zero-cost)
- **MCP Tools**: Custom tools for agent-driven onboarding
- **File System**: Node.js fs module for CLAUDE.md/AGENTS.md creation

### Architectural Decision (2025-11-19)

**IMPORTANT CHANGE**: The onboarding system has been redesigned to use **agent-side AI generation** instead of server-side AI.

**Why**: 
- Privacy: User data never leaves their AI provider
- Cost: $0 for us (vs $1.50/user with OpenAI)
- Context: Agent gets ALL 96 answers in one prompt (solves 200K context issue)
- Flexibility: Works with any AI provider (Claude, GPT, Gemini, etc.)

**How it works**:
1. Agent collects user answers and stores in our DB
2. Agent calls our API to get prompt template WITH all answers
3. Agent generates content with THEIR AI provider
4. Agent stores generated content in our DB

See `.agent/specs/2025-11-18-3-session-onboarding-redesign-agent-side-ai-generation-zero-in-house-llm.md` for full redesign spec.

---

## Phase 1: Session 1 - 10-Phase Questions System (13 points)

### Deliverables

1. **Questions Storage System** (3 points)
   - Seed database with 98 questions across 10 phases
   - Questions table OR JSON configuration file
   - Support for subsections and question metadata

2. **API Routes** (5 points) - **AGENT-SIDE AI**
   - `GET /api/onboarding/questions?projectId={id}&phase={1-10}` (unchanged)
   - `POST /api/onboarding/answers` (save phase answers) (unchanged)
   - ~~`POST /api/onboarding/executive-summary` (generate summary)~~ → CHANGED
   - `GET /api/onboarding/executive-summary-prompt` (NEW - return prompt template)
   - `POST /api/onboarding/executive-summary` (MODIFIED - store agent-generated summary)

3. **MCP Tools** (3 points) - **AGENT-SIDE AI**
   - `projectpulse.onboarding.getQuestions(phase)` (unchanged)
   - `projectpulse.onboarding.saveAnswers(phase, answers)` (unchanged)
   - ~~`projectpulse.onboarding.generateExecutiveSummary()`~~ → REMOVED
   - `projectpulse.onboarding.getExecutiveSummaryPrompt()` (NEW - get prompt with all 96 answers)
   - `projectpulse.onboarding.storeExecutiveSummary()` (NEW - store agent-generated summary)

4. **Executive Summary System** (2 points) - **AGENT-SIDE AI**
   - ~~OpenAI integration for summary synthesis~~ → REMOVED (privacy/cost)
   - Prompt template generation with ALL 96 Q&A pairs included
   - Agent generates ~500 words with their own AI provider
   - ProjectPulse stores result and generates project-context.json

### Implementation Details

#### 1.1 Questions Storage

**Option A: Database Table** (RECOMMENDED)
```prisma
model OnboardingQuestion {
  id        String @id @default(cuid())
  phase     Int    // 1-10
  subsection String // "1.1 User Personas", "1.2 Core Features", etc.
  questionNumber Int    // 1-N within subsection
  questionText String @db.Text
  placeholder String? @db.Text // Example answer
  validationType String? // "text", "number", "array", "url"
  isRequired Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([phase, subsection, questionNumber])
  @@index([phase])
}
```

**Seed script**: `apps/web/prisma/seeds/onboarding-questions.ts`
- Parse questions from reference doc
- Insert 98 questions with metadata
- Run as part of `prisma db seed`

**Option B: JSON Configuration File**
- `apps/web/config/onboarding-questions.json`
- Simpler, but less flexible for future updates
- No database queries needed

**DECISION: Use Database Table** (better for future features like custom questions per project type)

---

#### 1.2 API Route: GET /api/onboarding/questions

**File**: `apps/web/app/api/onboarding/questions/route.ts`

**Request**:
```
GET /api/onboarding/questions?projectId=1&phase=1
```

**Response**:
```json
{
  "phase": 1,
  "phaseName": "Product Manager - Foundation",
  "subsections": [
    {
      "id": "1.1",
      "name": "User Personas",
      "questions": [
        {
          "id": "phase1_q1",
          "questionNumber": 1,
          "text": "Who are the primary users of your product?",
          "placeholder": "e.g., Solo developers, small dev teams (2-5 people)",
          "isRequired": true
        },
        ...
      ]
    },
    ...
  ],
  "totalQuestions": 11
}
```

**Implementation**:
```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const phase = searchParams.get('phase');
  
  // Validation
  if (!projectId || !phase) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }
  
  const phaseNum = parseInt(phase, 10);
  if (isNaN(phaseNum) || phaseNum < 1 || phaseNum > 10) {
    return NextResponse.json({ error: 'Phase must be 1-10' }, { status: 400 });
  }
  
  // Fetch questions from database
  const questions = await prisma.onboardingQuestion.findMany({
    where: { phase: phaseNum },
    orderBy: [
      { subsection: 'asc' },
      { questionNumber: 'asc' }
    ]
  });
  
  // Group by subsection
  const subsections = groupBySubsection(questions);
  
  return NextResponse.json({
    phase: phaseNum,
    phaseName: getPhase Name(phaseNum),
    subsections,
    totalQuestions: questions.length
  });
}
```

---

#### 1.3 API Route: POST /api/onboarding/answers

**File**: `apps/web/app/api/onboarding/answers/route.ts`

**Request**:
```json
{
  "projectId": 1,
  "phase": 1,
  "answers": {
    "phase1_q1": "Solo developers and small dev teams (2-5 people)",
    "phase1_q2": "Ages 25-45, primarily male, technical background...",
    ...
  }
}
```

**Response**:
```json
{
  "success": true,
  "phase": 1,
  "answersStored": 11,
  "completedPhases": [1],
  "nextPhase": 2
}
```

**Implementation**:
```typescript
const answerSchema = z.object({
  projectId: z.number().int().positive(),
  phase: z.number().int().min(1).max(10),
  answers: z.record(z.string(), z.any())
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = answerSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  
  const { projectId, phase, answers } = validation.data;
  
  // Upsert OnboardingSession (Session 1)
  const session = await prisma.onboardingSession.upsert({
    where: {
      projectId_sessionNumber: { projectId, sessionNumber: 1 }
    },
    update: {
      response: {
        ...existingResponse,
        planningAnswers: {
          ...existingResponse.planningAnswers,
          [`phase${phase}`]: answers
        },
        completedPhases: [...new Set([...existingResponse.completedPhases || [], phase])],
        currentPhase: phase,
        lastUpdated: new Date().toISOString()
      }
    },
    create: {
      projectId,
      sessionNumber: 1,
      status: 'in_progress',
      response: {
        planningAnswers: { [`phase${phase}`]: answers },
        completedPhases: [phase],
        currentPhase: phase
      },
      startedAt: new Date()
    }
  });
  
  // Check if all 10 phases complete
  const completedPhases = session.response.completedPhases || [];
  const allComplete = completedPhases.length === 10;
  
  return NextResponse.json({
    success: true,
    phase,
    answersStored: Object.keys(answers).length,
    completedPhases,
    nextPhase: allComplete ? null : phase + 1,
    readyForExecutiveSummary: allComplete
  });
}
```

---

#### 1.4 API Route: GET /api/onboarding/executive-summary-prompt (NEW - Agent-Side)

**File**: `apps/web/app/api/onboarding/executive-summary-prompt/route.ts`

**Request**:
```
GET /api/onboarding/executive-summary-prompt?projectId=1
```

**Response**:
```json
{
  "systemPrompt": "You are a product strategist and technical writer...",
  "userPrompt": "Generate an executive summary for this software project:\n\n## Phase 1: Product Manager - Foundation\n\n**Q1: Who are the primary users?**\nA: Solo developers and small dev teams...\n\n[... ALL 96 Q&A pairs included ...]",
  "requiredSections": ["Product Vision", "Target Users", ...],
  "wordCountTarget": 500,
  "temperature": 0.7,
  "metadata": {
    "totalQuestions": 96,
    "completedPhases": 10,
    "userPromptCharacters": 15847
  }
}
```

**Implementation** (Agent-Side AI - No OpenAI):
```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = parseInt(searchParams.get('projectId'), 10);
  
  // Fetch Session 1 data
  const session = await prisma.onboardingSession.findUnique({
    where: {
      projectId_sessionNumber: { projectId, sessionNumber: 1 }
    }
  });
  
  if (!session || !session.response) {
    return NextResponse.json({ error: 'Session 1 not found' }, { status: 404 });
  }
  
  const sessionData = session.response as any;
  const planningAnswers = sessionData.planningAnswers || {};
  const completedPhases = sessionData.completedPhases || [];
  
  // Check if all 10 phases complete
  if (completedPhases.length < 10) {
    return NextResponse.json({
      error: 'All 10 phases must be complete',
      completedPhases: completedPhases.length,
      missingPhases: [...]
    }, { status: 400 });
  }
  
  // Fetch all questions to build Q&A format
  const allQuestions = await prisma.onboardingQuestion.findMany({
    orderBy: [{ phase: 'asc' }, { subsection: 'asc' }, { questionNumber: 'asc' }]
  });
  
  // Build user prompt with ALL 96 Q&A pairs
  let userPrompt = 'Generate an executive summary for this software project:\n\n';
  
  for (let phaseNum = 1; phaseNum <= 10; phaseNum++) {
    const phaseAnswers = planningAnswers[`phase${phaseNum}`] || {};
    const phaseQuestions = allQuestions.filter((q) => q.phase === phaseNum);
    
    userPrompt += `## Phase ${phaseNum}: ${PHASE_NAMES[phaseNum]}\n\n`;
    
    for (const question of phaseQuestions) {
      const answer = phaseAnswers[question.id] || '(Not answered)';
      userPrompt += `**Q${question.questionNumber}: ${question.questionText}**\n`;
      userPrompt += `A: ${answer}\n\n`;
    }
  }
  
  userPrompt += `---\n\nGenerate a ~500 word executive summary covering:\n`;
  userPrompt += `- Product name, type, and target users\n`;
  userPrompt += `- Core problem and solution\n`;
  userPrompt += `- Key features (3-5)\n`;
  userPrompt += `- Tech stack\n`;
  userPrompt += `- Timeline and budget\n`;
  userPrompt += `- Success metrics\n`;
  
  const systemPrompt = 'You are a product strategist and technical writer. Generate a concise executive summary (~500 words) synthesizing all planning answers into a cohesive project vision.';
  
  return NextResponse.json({
    systemPrompt,
    userPrompt,
    requiredSections: [...],
    wordCountTarget: 500,
    temperature: 0.7,
    allAnswers: planningAnswers,
    metadata: {
      totalQuestions: allQuestions.length,
      completedPhases: completedPhases.length,
      userPromptCharacters: userPrompt.length
    }
  });
}
```

---

#### 1.4.2 API Route: POST /api/onboarding/executive-summary (MODIFIED - Storage Only)

**File**: `apps/web/app/api/onboarding/executive-summary/route.ts`

**Request**:
```json
{
  "projectId": 1,
  "executiveSummary": "TaskFlow is an AI-powered task management platform...",
  "wordCount": 487
}
```

**Response**:
```json
{
  "success": true,
  "stored": true,
  "wordCount": 487,
  "projectContextJson": { /* complete project-context.json */ }
}
```

**Implementation** (Agent-Side AI - Storage Only):
```typescript
const requestSchema = z.object({
  projectId: z.number().int().positive(),
  executiveSummary: z.string().min(100).max(5000),
  wordCount: z.number().int().positive().optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = requestSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request', details: validation.error }, { status: 400 });
  }
  
  const { projectId, executiveSummary, wordCount: providedWordCount } = validation.data;
  
  // Fetch Session 1 data
  const session = await prisma.onboardingSession.findUnique({
    where: { projectId_sessionNumber: { projectId, sessionNumber: 1 } }
  });
  
  if (!session) {
    return NextResponse.json({ error: 'Session 1 not found' }, { status: 404 });
  }
  
  const sessionData = session.response as any;
  const planningAnswers = sessionData.planningAnswers || {};
  
  // Calculate word count if not provided
  const wordCount = providedWordCount || executiveSummary.split(/\s+/).length;
  
  // Generate project-context.json
  const projectContextJson = generateProjectContextJson(planningAnswers, executiveSummary);
  
  // Update session with agent-generated summary
  await prisma.onboardingSession.update({
    where: { id: session.id },
    data: {
      response: {
        ...sessionData,
        executiveSummary,
        executiveSummaryWordCount: wordCount,
        projectContextJson,
        generatedBy: 'agent' // Mark as agent-generated
      },
      status: 'complete',
      completedAt: new Date()
    }
  });
  
  return NextResponse.json({
    success: true,
    stored: true,
    wordCount,
    projectContextJson
  });
}

// generateProjectContextJson() helper (same as before, extracts structured data)
```

---

#### 1.5 MCP Tools (Agent-Side AI)

**File**: `apps/mcp-server/src/tools/onboarding/getQuestionsTool.ts` (UNCHANGED)

```typescript
export const getQuestionsTool: ToolDefinition = {
  name: 'projectpulse.onboarding.getQuestions',
  description: 'Get onboarding questions for a specific phase (1-10)',
  schema: z.object({
    projectId: z.number().int().positive(),
    phase: z.number().int().min(1).max(10)
  }),
  
  async execute(params, context) {
    const response = await context.httpClient.get(
      `/api/onboarding/questions?projectId=${params.projectId}&phase=${params.phase}`
    );
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

**File**: `apps/mcp-server/src/tools/onboarding/saveAnswersTool.ts` (UNCHANGED)

```typescript
export const saveAnswersTool: ToolDefinition = {
  name: 'projectpulse.onboarding.saveAnswers',
  description: 'Save answers for a specific phase',
  schema: z.object({
    projectId: z.number().int().positive(),
    phase: z.number().int().min(1).max(10),
    answers: z.record(z.string(), z.any())
  }),
  
  async execute(params, context) {
    const response = await context.httpClient.post('/api/onboarding/answers', params);
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

**File**: `apps/mcp-server/src/tools/onboarding/getExecutiveSummaryPromptTool.ts` (NEW - Agent-Side)

```typescript
export const getExecutiveSummaryPromptTool: ToolDefinition = {
  name: 'projectpulse.onboarding.getExecutiveSummaryPrompt',
  description: 'Get prompt template with ALL 96 answers for generating executive summary with agent\'s own AI provider. Returns a prompt for the agent to use with their LLM.',
  schema: z.object({
    projectId: z.number().int().positive()
  }),
  
  async execute(params, context) {
    context.logger.info('Fetching executive summary prompt template', { projectId: params.projectId });
    
    const response = await context.httpClient.get(
      `/api/onboarding/executive-summary-prompt?projectId=${params.projectId}`
    );
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

**File**: `apps/mcp-server/src/tools/onboarding/storeExecutiveSummaryTool.ts` (NEW - Agent-Side)

```typescript
export const storeExecutiveSummaryTool: ToolDefinition = {
  name: 'projectpulse.onboarding.storeExecutiveSummary',
  description: 'Store agent-generated executive summary (after agent generated it with their own AI). Completes Session 1 and generates project-context.json.',
  schema: z.object({
    projectId: z.number().int().positive(),
    executiveSummary: z.string().min(100).max(5000),
    wordCount: z.number().int().positive().optional()
  }),
  
  async execute(params, context) {
    context.logger.info('Storing agent-generated executive summary', {
      projectId: params.projectId,
      wordCount: params.wordCount || 'auto-calculate'
    });
    
    const response = await context.httpClient.post('/api/onboarding/executive-summary', {
      projectId: params.projectId,
      executiveSummary: params.executiveSummary,
      wordCount: params.wordCount
    });
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

~~**File**: `apps/mcp-server/src/tools/onboarding/generateExecutiveSummaryTool.ts` (DELETED)~~

**Registration**: `apps/mcp-server/src/tools/index.ts`

```typescript
import { getQuestionsTool } from './onboarding/getQuestionsTool.js';
import { saveAnswersTool } from './onboarding/saveAnswersTool.js';
import { getExecutiveSummaryPromptTool } from './onboarding/getExecutiveSummaryPromptTool.js'; // NEW
import { storeExecutiveSummaryTool } from './onboarding/storeExecutiveSummaryTool.js'; // NEW

const loadTools = (): ToolDefinition[] => [
  // ... existing tools
  getQuestionsTool,
  saveAnswersTool,
  getExecutiveSummaryPromptTool, // NEW - Agent gets prompt
  storeExecutiveSummaryTool, // NEW - Agent stores result
  // generateExecutiveSummaryTool, // REMOVED - Old server-side generation
];
```

**Agent Workflow (Agent-Side AI)**:
```typescript
// Step 1-10: Complete all phases (unchanged)
for (let phase = 1; phase <= 10; phase++) {
  const questions = await mcp.call('projectpulse.onboarding.getQuestions', { projectId: 1, phase });
  const answers = await collectAnswers(questions);
  await mcp.call('projectpulse.onboarding.saveAnswers', { projectId: 1, phase, answers });
}

// Step 11: Get prompt template WITH all answers
const promptData = await mcp.call('projectpulse.onboarding.getExecutiveSummaryPrompt', { projectId: 1 });

// Step 12: Agent generates summary with THEIR AI (Claude, GPT, Gemini, etc.)
const executiveSummary = await myAI.generate({
  system: promptData.systemPrompt,
  user: promptData.userPrompt,
  temperature: promptData.temperature
});

// Step 13: Store agent-generated summary
await mcp.call('projectpulse.onboarding.storeExecutiveSummary', {
  projectId: 1,
  executiveSummary: executiveSummary,
  wordCount: executiveSummary.split(/\s+/).length
});
// Session 1 now complete! ✅
```

---

### Testing Phase 1 (Agent-Side AI)

**Unit Tests**:
```bash
# Test questions API (unchanged)
GET /api/onboarding/questions?projectId=1&phase=1
# Expect: 10 questions in 3 subsections

# Test answers API (unchanged)
POST /api/onboarding/answers
{
  "projectId": 1,
  "phase": 1,
  "answers": { "phase1_q1": "Answer 1", ... }
}
# Expect: Success, nextPhase: 2

# Test prompt template generation (NEW)
GET /api/onboarding/executive-summary-prompt?projectId=1
# Expect: 400 (not all phases complete yet)

# Complete all 10 phases, then:
GET /api/onboarding/executive-summary-prompt?projectId=1
# Expect: 200 with systemPrompt, userPrompt (with ALL 96 Q&A pairs), metadata

# Test storage endpoint (NEW)
POST /api/onboarding/executive-summary
{
  "projectId": 1,
  "executiveSummary": "TaskFlow is an AI-powered task management platform...",
  "wordCount": 487
}
# Expect: 200 with success: true, stored: true, projectContextJson
```

**MCP Integration Test (Agent-Side AI)**:
```typescript
// Step 1-10: Complete all phases (unchanged)
for (let phase = 1; phase <= 10; phase++) {
  const questions = await mcp.call('projectpulse.onboarding.getQuestions', {
    projectId: 1,
    phase
  });
  console.log(questions.subsections.length); // Verify questions returned
  
  await mcp.call('projectpulse.onboarding.saveAnswers', {
    projectId: 1,
    phase,
    answers: { /* ... */ }
  });
}

// Step 11: Get prompt template (NEW)
const promptData = await mcp.call('projectpulse.onboarding.getExecutiveSummaryPrompt', {
  projectId: 1
});
console.log(promptData.metadata.totalQuestions); // Should be 96
console.log(promptData.userPrompt.length); // Should be ~15000 chars

// Step 12: Agent generates with their own AI (NOT our backend!)
const executiveSummary = await claude.generate({ // Or GPT, Gemini, etc.
  system: promptData.systemPrompt,
  user: promptData.userPrompt
});

// Step 13: Store agent-generated summary (NEW)
const result = await mcp.call('projectpulse.onboarding.storeExecutiveSummary', {
  projectId: 1,
  executiveSummary: executiveSummary,
  wordCount: executiveSummary.split(/\s+/).length
});
console.log(result.success); // Should be true
console.log(result.projectContextJson); // Should have complete context
```

**Verification**:
```sql
-- Check Session 1 complete with agent-generated summary
SELECT 
  status, 
  (response->>'executiveSummary')::text AS summary,
  (response->>'executiveSummaryWordCount')::int AS word_count,
  (response->>'generatedBy')::text AS generated_by
FROM onboarding_sessions
WHERE project_id = 1 AND session_number = 1;

-- Expected:
-- status: 'complete'
-- summary: ~500 words
-- word_count: ~500
-- generated_by: 'agent' (NEW - proves agent-side generation)
```

---

## Phase 2: Session 2 - 15 Industry Documents Generation (15 points) - AGENT-SIDE AI

**IMPORTANT**: Session 2 uses the SAME agent-side AI pattern as Session 1:
- Agent gets prompt templates for each document
- Agent generates documents with THEIR AI provider
- Agent stores generated documents in our DB
- NO server-side AI generation (privacy-first, zero-cost)

### Deliverables

1. **Document Generation Prompt System** (3 points)
   - Prompt templates for each of 15 documents
   - Context extraction from Session 1 answers
   - Document metadata (category, word count targets)

2. **API Routes** (5 points) - **AGENT-SIDE AI**
   - ~~`POST /api/onboarding/generate-documents`~~ → REMOVED (was server-side)
   - `GET /api/onboarding/document-prompts?projectId={id}` (NEW - returns all 15 prompts)
   - `POST /api/onboarding/documents` (NEW - stores agent-generated docs)
   - `GET /api/onboarding/documents?projectId={id}` (list stored docs)

3. **MCP Tools** (2 points) - **AGENT-SIDE AI**
   - ~~`projectpulse.onboarding.generateDocuments()`~~ → REMOVED (was server-side)
   - `projectpulse.onboarding.getDocumentPrompts()` (NEW - get prompts for agent)
   - `projectpulse.onboarding.storeDocuments()` (NEW - store agent-generated docs)
   - `projectpulse.onboarding.listDocuments()` (list stored docs)

4. **Agent-Side Document Generation** (5 points)
   - ~~OpenAI integration~~ → REMOVED (privacy/cost)
   - Prompt template library for 15 document types
   - Agent generates with their own AI provider
   - ~30K words total across 15 documents

### Implementation Details

**NOTE**: Section 2 implementation details below show the prompt template library (Section 2.1), which is STILL USED but now for agent-side generation instead of server-side. Sections 2.2+ need to be updated to show the NEW agent-side API routes (GET prompts, POST storage) instead of the OLD server-side generation routes.

#### 2.1 Document Generation Prompt Templates (UNCHANGED - Still Used for Agent-Side)

**File**: `apps/web/lib/onboarding/document-prompts.ts`

```typescript
export interface DocumentPrompt {
  filename: string;
  title: string;
  category: 'planning' | 'architecture' | 'implementation' | 'operations';
  wordCountTarget: number;
  systemPrompt: string;
  userPromptTemplate: (projectContext: any) => string;
}

export const DOCUMENT_PROMPTS: DocumentPrompt[] = [
  {
    filename: '01-PRD.md',
    title: 'Product Requirements Document',
    category: 'planning',
    wordCountTarget: 2000,
    systemPrompt: 'You are a product manager writing a comprehensive PRD following industry best practices.',
    userPromptTemplate: (ctx) => `
Generate a Product Requirements Document for ${ctx.metadata.projectName}.

# Project Context
${ctx.executiveSummary}

# Required Sections
1. Product Vision and Goals
2. Target Users and Personas
3. Core Features (from: ${JSON.stringify(ctx.features)})
4. User Stories (MVP)
5. Success Metrics and KPIs
6. Out of Scope Items
7. Assumptions and Constraints

Generate ~2000 words in markdown format with clear headings and bullet points.
    `.trim()
  },
  
  {
    filename: '02-SRS.md',
    title: 'Software Requirements Specification',
    category: 'planning',
    wordCountTarget: 2500,
    systemPrompt: 'You are a software architect writing an SRS document following IEEE 830 standards.',
    userPromptTemplate: (ctx) => `
Generate a Software Requirements Specification for ${ctx.metadata.projectName}.

# Project Context
${ctx.executiveSummary}
Tech Stack: ${JSON.stringify(ctx.techStack)}

# Required Sections
1. Functional Requirements (detailed user flows)
2. Non-Functional Requirements (performance, security, usability)
3. System Constraints
4. Acceptance Criteria per feature
5. Data Requirements
6. External Interfaces

Generate ~2500 words in markdown format.
    `.trim()
  },
  
  {
    filename: '03-Architecture.md',
    title: 'System Architecture',
    category: 'architecture',
    wordCountTarget: 1800,
    systemPrompt: 'You are a solutions architect documenting system architecture.',
    userPromptTemplate: (ctx) => `
Generate a System Architecture document for ${ctx.metadata.projectName}.

# Tech Stack
${JSON.stringify(ctx.techStack, null, 2)}

# Required Sections
1. Architecture Overview (component diagram description)
2. Frontend Architecture (${ctx.techStack.frontend})
3. Backend Architecture (${ctx.techStack.backend})
4. Database Design (${ctx.techStack.database})
5. Authentication & Authorization
6. API Design Pattern
7. Deployment Architecture (${ctx.techStack.hosting})
8. Integration Points

Generate ~1800 words in markdown with mermaid diagrams where appropriate.
    `.trim()
  },
  
  // ... Continue for all 15 documents
  
  {
    filename: '13-Project-Plan.md',
    title: 'Project Implementation Plan',
    category: 'planning',
    wordCountTarget: 2000,
    systemPrompt: 'You are a project manager creating a detailed implementation roadmap.',
    userPromptTemplate: (ctx) => `
Generate a Project Implementation Plan for ${ctx.metadata.projectName}.

# Timeline
Start: ${ctx.timeline.startDate}
Duration: ${ctx.timeline.estimatedDuration}
Launch: ${ctx.timeline.targetLaunch}

# Phases
${JSON.stringify(ctx.phases, null, 2)}

# Required Format (CRITICAL for Session 3 parsing)
Use this exact markdown structure:

## Phase 1: Foundation (Weeks 1-4)

**Duration**: 4 weeks
**Points**: 20 points

### Sprint 1 (Weeks 1-2): Database Setup - 8 points

**Goals**:
- Set up database schema
- Implement user authentication

**Weeks**:
- Week 1: Database models
- Week 2: Authentication

### Sprint 2 (Weeks 3-4): API Development - 12 points

**Goals**:
- Build REST API
- Add validation

Generate ~2000 words with 2-4 phases, 2-4 sprints per phase.
    `.trim()
  }
];
```

---

#### 2.2 API Routes (AGENT-SIDE AI - TO BE IMPLEMENTED)

**CRITICAL**: The section below (2.2-2.4) shows the OLD server-side OpenAI generation approach. This needs to be REPLACED with agent-side implementation following the same pattern as Session 1:

**NEW Agent-Side Pattern (To Be Implemented)**:
1. `GET /api/onboarding/document-prompts` - Returns all 15 prompt templates
2. `POST /api/onboarding/documents` - Stores agent-generated documents
3. `GET /api/onboarding/documents` - Lists stored documents

**Agent Workflow** (To Be Implemented):
```typescript
// Step 1: Get all document prompts
const prompts = await mcp.call('projectpulse.onboarding.getDocumentPrompts', { projectId: 1 });
// Returns: Array of 15 prompts with systemPrompt, userPrompt, metadata

// Step 2: Agent generates each document with THEIR AI
for (const prompt of prompts.documentPrompts) {
  const document = await myAI.generate({
    system: prompt.systemPrompt,
    user: prompt.userPrompt
  });
  
  // Step 3: Store each generated document
  await mcp.call('projectpulse.onboarding.storeDocument', {
    projectId: 1,
    filename: prompt.filename,
    content: document,
    category: prompt.category,
    wordCount: document.split(/\s+/).length
  });
}
```

---

**OLD Implementation (To Be Replaced)**:

#### 2.2 API Route: POST /api/onboarding/generate-documents (OLD - Server-Side)

**File**: `apps/web/app/api/onboarding/generate-documents/route.ts`

**Request**:
```json
{
  "projectId": 1
}
```

**Response**:
```json
{
  "success": true,
  "documentsGenerated": 15,
  "totalWordCount": 29847,
  "documents": [
    {
      "filename": "01-PRD.md",
      "wordCount": 2043,
      "category": "planning"
    },
    ...
  ]
}
```

**Implementation**:
```typescript
import { OpenAI } from 'openai';
import { DOCUMENT_PROMPTS } from '@/lib/onboarding/document-prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  const { projectId } = await request.json();
  
  // Fetch Session 1 (must be complete)
  const session1 = await prisma.onboardingSession.findUnique({
    where: {
      projectId_sessionNumber: { projectId, sessionNumber: 1 }
    }
  });
  
  if (!session1 || session1.status !== 'complete') {
    return NextResponse.json({ 
      error: 'Session 1 must be complete before generating documents' 
    }, { status: 400 });
  }
  
  const projectContext = session1.response.projectContextJson;
  
  // Generate all 15 documents in parallel (with rate limiting)
  const generatedDocs = [];
  
  for (const promptDef of DOCUMENT_PROMPTS) {
    try {
      const content = await generateDocument(promptDef, projectContext);
      
      // Create Document record
      const doc = await prisma.document.create({
        data: {
          onboardingSessionId: session1.id,
          filename: promptDef.filename,
          content,
          wordCount: content.split(/\s+/).length,
          category: promptDef.category,
          tags: ['onboarding', 'session-2', promptDef.category]
        }
      });
      
      generatedDocs.push({
        filename: doc.filename,
        wordCount: doc.wordCount,
        category: doc.category
      });
      
      console.log(`[Session 2] Generated ${promptDef.filename} (${doc.wordCount} words)`);
      
    } catch (error) {
      console.error(`[Session 2] Failed to generate ${promptDef.filename}:`, error);
      // Continue with other documents
    }
  }
  
  // Update Session 2 status
  await prisma.onboardingSession.upsert({
    where: {
      projectId_sessionNumber: { projectId, sessionNumber: 2 }
    },
    update: {
      response: {
        documentsGenerated: generatedDocs,
        totalWordCount: generatedDocs.reduce((sum, doc) => sum + doc.wordCount, 0),
        completedAt: new Date().toISOString()
      },
      status: 'complete',
      completedAt: new Date()
    },
    create: {
      projectId,
      sessionNumber: 2,
      status: 'complete',
      response: {
        documentsGenerated: generatedDocs,
        totalWordCount: generatedDocs.reduce((sum, doc) => sum + doc.wordCount, 0)
      },
      startedAt: new Date(),
      completedAt: new Date()
    }
  });
  
  return NextResponse.json({
    success: true,
    documentsGenerated: generatedDocs.length,
    totalWordCount: generatedDocs.reduce((sum, doc) => sum + doc.wordCount, 0),
    documents: generatedDocs
  });
}

async function generateDocument(
  promptDef: DocumentPrompt,
  projectContext: any
): Promise<string> {
  const userPrompt = promptDef.userPromptTemplate(projectContext);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: promptDef.systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    temperature: 0.7,
    max_tokens: promptDef.wordCountTarget * 2 // ~1.5 tokens per word
  });
  
  return completion.choices[0].message.content || '';
}
```

---

#### 2.3 API Route: GET /api/onboarding/documents

**File**: `apps/web/app/api/onboarding/documents/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }
  
  // Fetch all documents for this project's Session 2
  const session2 = await prisma.onboardingSession.findUnique({
    where: {
      projectId_sessionNumber: {
        projectId: parseInt(projectId, 10),
        sessionNumber: 2
      }
    },
    include: {
      documents: {
        select: {
          id: true,
          filename: true,
          wordCount: true,
          category: true,
          tags: true,
          generatedAt: true
        },
        orderBy: {
          filename: 'asc'
        }
      }
    }
  });
  
  if (!session2) {
    return NextResponse.json({ 
      error: 'Session 2 not found' 
    }, { status: 404 });
  }
  
  return NextResponse.json({
    documents: session2.documents,
    totalDocuments: session2.documents.length,
    totalWordCount: session2.documents.reduce((sum, doc) => sum + doc.wordCount, 0),
    status: session2.status
  });
}
```

---

#### 2.4 MCP Tools

**File**: `apps/mcp-server/src/tools/onboarding/generateDocumentsTool.ts`

```typescript
export const generateDocumentsTool: ToolDefinition = {
  name: 'projectpulse.onboarding.generateDocuments',
  description: 'Generate all 15 industry documents for Session 2',
  schema: z.object({
    projectId: z.number().int().positive()
  }),
  
  async execute(params, context) {
    context.logger.info('Generating 15 industry documents', { projectId: params.projectId });
    
    const response = await context.httpClient.post(
      '/api/onboarding/generate-documents',
      params
    );
    
    context.logger.info('Documents generated', { 
      count: response.documentsGenerated,
      totalWords: response.totalWordCount
    });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };
  }
};
```

**File**: `apps/mcp-server/src/tools/onboarding/listDocumentsTool.ts`

```typescript
export const listDocumentsTool: ToolDefinition = {
  name: 'projectpulse.onboarding.listDocuments',
  description: 'List all generated documents from Session 2',
  schema: z.object({
    projectId: z.number().int().positive()
  }),
  
  async execute(params, context) {
    const response = await context.httpClient.get(
      `/api/onboarding/documents?projectId=${params.projectId}`
    );
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };
  }
};
```

---

### Testing Phase 2

**Unit Tests**:
```bash
# Generate all 15 documents
POST /api/onboarding/generate-documents
{ "projectId": 1 }
# Expect: 15 documents created (~30K words total)
# Time: ~3-5 minutes (OpenAI API calls)

# List generated documents
GET /api/onboarding/documents?projectId=1
# Expect: 15 documents with metadata
```

**MCP Integration Test**:
```typescript
const result = await mcp.call('projectpulse.onboarding.generateDocuments', {
  projectId: 1
});
console.log(result.documentsGenerated); // Should be 15

const docs = await mcp.call('projectpulse.onboarding.listDocuments', {
  projectId: 1
});
console.log(docs.documents.length); // Should be 15
```

**Verification**:
```sql
-- Check documents created
SELECT filename, word_count, category FROM documents 
WHERE onboarding_session_id = (
  SELECT id FROM onboarding_sessions 
  WHERE project_id = 1 AND session_number = 2
);
-- Expect: 15 rows

-- Verify 13-Project-Plan.md exists (Session 3 dependency)
SELECT content FROM documents 
WHERE filename = '13-Project-Plan.md';
-- Expect: Full roadmap markdown with phases and sprints
```

---

## Phase 3: Session 3 - Complete AI Workflow Bootstrap (12 points)

### Deliverables

1. **Sub-Agents Creation** (2 points)
   - Create 3-5 AgentPersona records based on tech stack
   - System prompts for each persona
   - Skills and tools assignment

2. **Skills Creation** (2 points)
   - Create 5-10 Skill records based on project type
   - Markdown content for each skill
   - Categorization by framework/pattern

3. **Workflows & SOPs Creation** (2 points)
   - Create 2-3 WorkflowTemplate records
   - Create 3-5 SOP records
   - Link to agent personas

4. **CurrentPlan & CurrentTodos Creation** (1 point)
   - Initialize CurrentPlan for Week 1, Day 1
   - Initialize CurrentTodos with first 5 tasks
   - Link to materialized roadmap

5. **CLAUDE.md & AGENTS.md Generation** (3 points)
   - Generate CLAUDE.md with ProjectPulse DB instructions
   - Generate AGENTS.md with agent personas list
   - **Write to user's repository** (file system)

6. **API Routes** (2 points)
   - `POST /api/onboarding/bootstrap` (create all Session 3 entities)
   - `GET /api/onboarding/bootstrap-status?projectId={id}`

### Implementation Details

#### 3.1 Sub-Agents Creation Logic

**File**: `apps/web/lib/onboarding/create-sub-agents.ts`

```typescript
interface AgentPersonaDefinition {
  name: string;
  slug: string;
  icon: string;
  description: string;
  systemPrompt: string;
  skills: string[];
  tools: string[];
  autoActivate: boolean;
  activationTriggers: string[];
}

export function getAgentPersonasForTechStack(techStack: any): AgentPersonaDefinition[] {
  const personas: AgentPersonaDefinition[] = [];
  
  // Always include core agents
  personas.push({
    name: 'React Expert',
    slug: 'react-expert',
    icon: '⚛️',
    description: 'React 18+ patterns and optimization specialist',
    systemPrompt: `You are a React expert specializing in modern React patterns, hooks, performance optimization, and component architecture. You provide detailed implementation guidance following React best practices.`,
    skills: ['component-patterns', 'custom-hooks', 'performance-optimization'],
    tools: ['create_issue', 'search_knowledge', 'wiki_generate'],
    autoActivate: false,
    activationTriggers: ['component design', 'hooks', 'react performance']
  });
  
  // Tech stack-specific agents
  if (techStack.frontend?.includes('Next.js')) {
    personas.push({
      name: 'Next.js Expert',
      slug: 'nextjs-expert',
      icon: '▲',
      description: 'Next.js 14 App Router specialist',
      systemPrompt: `You are a Next.js expert specializing in App Router, Server Components, data fetching, and deployment optimization. You guide implementation decisions for Next.js applications.`,
      skills: ['nextjs-patterns', 'server-components', 'api-routes'],
      tools: ['create_issue', 'search_knowledge'],
      autoActivate: false,
      activationTriggers: ['next.js', 'app router', 'server components']
    });
  }
  
  if (techStack.database?.includes('Prisma')) {
    personas.push({
      name: 'Prisma Expert',
      slug: 'prisma-expert',
      icon: '🔷',
      description: 'Database design and Prisma ORM specialist',
      systemPrompt: `You are a Prisma expert specializing in schema design, migrations, query optimization, and PostgreSQL integration. You provide guidance on database architecture and Prisma best practices.`,
      skills: ['database-patterns', 'prisma-optimization', 'migrations'],
      tools: ['create_issue', 'search_knowledge'],
      autoActivate: false,
      activationTriggers: ['database', 'prisma', 'schema design']
    });
  }
  
  // Add more conditional agents based on tech stack...
  
  return personas;
}

export async function createAgentPersonas(
  projectId: number,
  techStack: any
): Promise<number> {
  const personaDefs = getAgentPersonasForTechStack(techStack);
  
  let created = 0;
  for (const def of personaDefs) {
    await prisma.agentPersona.create({
      data: {
        projectId,
        name: def.name,
        slug: def.slug,
        icon: def.icon,
        description: def.description,
        systemPrompt: def.systemPrompt,
        skills: def.skills,
        tools: def.tools,
        autoActivate: def.autoActivate,
        activationTriggers: def.activationTriggers
      }
    });
    created++;
  }
  
  return created;
}
```

---

#### 3.2 Skills Creation Logic

**File**: `apps/web/lib/onboarding/create-skills.ts`

```typescript
interface SkillDefinition {
  slug: string;
  title: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
  frameworks: string[];
}

export function getSkillsForProjectType(projectType: string, techStack: any): SkillDefinition[] {
  const skills: SkillDefinition[] = [];
  
  // Core skills (always included)
  skills.push({
    slug: 'api-patterns',
    title: 'API Design Patterns',
    category: 'backend',
    description: 'REST API design patterns, validation, and error handling',
    content: `
# API Design Patterns

## Overview
Best practices for designing REST APIs with proper validation and error handling.

## Patterns

### 1. Request Validation
Use Zod for input validation:
\`\`\`typescript
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100)
});
\`\`\`

### 2. Error Handling
Standardized error responses:
\`\`\`typescript
return NextResponse.json(
  { error: 'Validation failed', details: errors },
  { status: 400 }
);
\`\`\`

[... more patterns ...]
    `.trim(),
    tags: ['api', 'validation', 'error-handling'],
    frameworks: ['Next.js', 'Express', 'Fastify']
  });
  
  // Tech stack-specific skills
  if (techStack.frontend?.includes('Next.js')) {
    skills.push({
      slug: 'nextjs-server-components',
      title: 'Next.js Server Components',
      category: 'frontend',
      description: 'Server Component patterns, data fetching, and streaming',
      content: `
# Next.js Server Components

## Overview
Use Server Components by default for better performance and DX.

## Patterns

### 1. Server Component by Default
\`\`\`typescript
// app/page.tsx (Server Component - no "use client")
export default async function Page() {
  const data = await fetchData(); // Direct DB/API call
  return <div>{data.title}</div>;
}
\`\`\`

[... more patterns ...]
      `.trim(),
      tags: ['nextjs', 'server-components', 'react'],
      frameworks: ['Next.js', 'React']
    });
  }
  
  // Add more skills...
  
  return skills;
}

export async function createSkills(
  projectId: number,
  projectType: string,
  techStack: any
): Promise<number> {
  const skillDefs = getSkillsForProjectType(projectType, techStack);
  
  let created = 0;
  for (const def of skillDefs) {
    await prisma.skill.create({
      data: {
        projectId,
        slug: def.slug,
        title: def.title,
        category: def.category,
        description: def.description,
        content: def.content,
        tags: def.tags,
        frameworks: def.frameworks
      }
    });
    created++;
  }
  
  return created;
}
```

---

#### 3.3 Workflows & SOPs Creation

**File**: `apps/web/lib/onboarding/create-workflows-sops.ts`

```typescript
export async function createWorkflowsAndSOPs(
  projectId: number
): Promise<{ workflows: number; sops: number }> {
  
  // Create workflow templates
  const workflows = [
    {
      name: 'Feature Development',
      description: 'End-to-end feature development workflow',
      category: 'development',
      steps: [
        { name: 'Create plan', action: 'session.create' },
        { name: 'Consult experts', action: 'agent.invoke' },
        { name: 'Implement', action: 'file.edit' },
        { name: 'Test', action: 'test.run' },
        { name: 'Commit', action: 'git.commit' }
      ]
    },
    {
      name: 'Bug Fix',
      description: 'Investigate and fix bugs',
      category: 'debugging',
      steps: [
        { name: 'Reproduce', action: 'test.reproduce' },
        { name: 'Root cause analysis', action: 'search.code' },
        { name: 'Fix', action: 'file.edit' },
        { name: 'Regression test', action: 'test.create' },
        { name: 'Commit', action: 'git.commit' }
      ]
    }
  ];
  
  let workflowsCreated = 0;
  for (const workflow of workflows) {
    await prisma.workflowTemplate.create({
      data: {
        projectId,
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        steps: workflow.steps
      }
    });
    workflowsCreated++;
  }
  
  // Create SOPs
  const sops = [
    {
      title: 'Git Workflow',
      slug: 'git-workflow',
      description: 'Branch management and commit conventions',
      category: 'Development',
      tags: ['git', 'workflow', 'branching'],
      content: `
# Git Workflow

## Branching Strategy
- \`master\`: Production-ready code
- \`feature/*\`: New features
- \`fix/*\`: Bug fixes
- \`hotfix/*\`: Emergency fixes

## Commit Conventions
Use conventional commits:
- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation
- \`test:\` Tests
- \`refactor:\` Code refactoring

## Workflow
1. Create branch: \`git checkout -b feature/my-feature\`
2. Commit: \`git commit -m "feat: add new feature"\`
3. Push: \`git push origin feature/my-feature\`
4. Create PR
5. Merge after review
      `.trim()
    },
    {
      title: 'Security Checklist',
      slug: 'security-checklist',
      description: 'Pre-deployment security validation',
      category: 'Security',
      tags: ['security', 'checklist', 'deployment'],
      content: `
# Security Checklist

## Pre-Deployment Validation

### Input Validation
- [ ] All user inputs validated with Zod
- [ ] SQL injection prevented (Prisma parameterized queries)
- [ ] XSS prevented (React escapes by default)
- [ ] CSRF tokens implemented

### Authentication & Authorization
- [ ] Passwords hashed (bcrypt)
- [ ] JWT secrets secure
- [ ] Authorization checked on all routes
- [ ] Session management secure

### Data Protection
- [ ] HTTPS enforced
- [ ] Sensitive data encrypted at rest
- [ ] API keys in environment variables
- [ ] No secrets in git

### Dependencies
- [ ] \`npm audit\` passes
- [ ] Dependencies up to date
- [ ] No known vulnerabilities
      `.trim()
    },
    // Add more SOPs...
  ];
  
  let sopsCreated = 0;
  for (const sop of sops) {
    await prisma.sOP.create({
      data: {
        projectId,
        title: sop.title,
        slug: sop.slug,
        description: sop.description,
        category: sop.category,
        tags: sop.tags,
        content: sop.content
      }
    });
    sopsCreated++;
  }
  
  return { workflows: workflowsCreated, sops: sopsCreated };
}
```

---

#### 3.4 CurrentPlan & CurrentTodos Creation

**File**: `apps/web/lib/onboarding/create-current-work.ts`

```typescript
export async function createInitialCurrentWork(
  projectId: number,
  roadmapId: string
): Promise<void> {
  // Find first week and first day from materialized roadmap
  const firstWeek = await prisma.week.findFirst({
    where: {
      sprint: {
        phase: {
          roadmapId
        }
      }
    },
    include: {
      days: {
        orderBy: { title: 'asc' },
        take: 1
      }
    },
    orderBy: { startDate: 'asc' }
  });
  
  if (!firstWeek || !firstWeek.days[0]) {
    throw new Error('Roadmap not materialized correctly');
  }
  
  const firstDay = firstWeek.days[0];
  
  // Create CurrentPlan
  await prisma.currentPlan.create({
    data: {
      projectId,
      weekId: firstWeek.id,
      dayId: firstDay.id,
      content: `
# ${firstWeek.title} - ${firstDay.title}

## Goals
- Review generated documentation
- Verify roadmap structure
- Set up development environment
- Begin Phase 1 implementation

## Focus
Starting ${firstDay.title} of ${firstWeek.title}. Review all onboarding artifacts and prepare for first development sprint.
      `.trim(),
      goals: [
        'Review generated documentation',
        'Verify roadmap structure',
        'Set up development environment',
        'Begin Phase 1 implementation'
      ]
    }
  });
  
  // Create CurrentTodos
  await prisma.currentTodos.create({
    data: {
      projectId,
      weekId: firstWeek.id,
      dayId: firstDay.id,
      todos: [
        {
          content: 'Review all 15 generated documents',
          status: 'pending',
          priority: 'high',
          createdAt: new Date().toISOString()
        },
        {
          content: 'Verify roadmap structure at /roadmap',
          status: 'pending',
          priority: 'high',
          createdAt: new Date().toISOString()
        },
        {
          content: 'Check agent personas at /agents',
          status: 'pending',
          priority: 'medium',
          createdAt: new Date().toISOString()
        },
        {
          content: 'Review skills library at /agents (Skills tab)',
          status: 'pending',
          priority: 'medium',
          createdAt: new Date().toISOString()
        },
        {
          content: 'Begin first development phase',
          status: 'pending',
          priority: 'medium',
          createdAt: new Date().toISOString()
        }
      ]
    }
  });
}
```

---

#### 3.5 CLAUDE.md & AGENTS.md Generation

**File**: `apps/web/lib/onboarding/generate-repo-files.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';

export async function generateCLAUDEmd(
  projectName: string,
  agentPersonas: any[]
): Promise<string> {
  return `# ${projectName} - Claude Code Integration Guide

**Version**: 1.0 (ProjectPulse)
**Last Updated**: ${new Date().toISOString().split('T')[0]}

---

## Quick Start

Just chat naturally with me (Claude Code):

\`\`\`
"Implement POST /api/users endpoint"
"Write tests for the search API"
"Debug the authentication flow"
\`\`\`

---

## 🚨 CRITICAL: Pre-Work Checklist

**BEFORE starting ANY coding work:**

### 1. ProjectPulse Connection

**CRITICAL**: All project data is stored in ProjectPulse database, NOT in local files.

\`\`\`bash
# Check ProjectPulse connection
curl http://192.168.1.15:3000/api/health
# ✅ MUST return: {"status":"healthy","database":"connected"}
\`\`\`

**If connection down:**
- Tell user to start ProjectPulse services
- Or use Git communication to tell server: "Start ProjectPulse services"

**See**: INFRASTRUCTURE.md for setup details

### 2. Memory Bank (ProjectPulse DB)

**DO NOT create \`.agent/\` folder** - All context stored in ProjectPulse database.

**Access Memory Bank**:
\`\`\`typescript
// Read project context from ProjectPulse DB
const projectBrief = await mcp.call('projectpulse.memory.read', { type: 'project-brief' });
const systemPatterns = await mcp.call('projectpulse.memory.read', { type: 'system-patterns' });
const techContext = await mcp.call('projectpulse.memory.read', { type: 'tech-context' });
\`\`\`

**Available Memory Bank types**:
- \`project-brief\`: Project overview, features, success metrics
- \`system-patterns\`: Architecture patterns, conventions
- \`tech-context\`: Tech stack, dependencies, setup
- \`active-context\`: Current work focus
- \`progress\`: Progress tracking, metrics

### 3. Git Branch

\`\`\`bash
git branch
# ✅ MUST be on feature branch (NOT master!)
# If on master:
git checkout master && git pull origin master
git checkout -b feature/your-feature
\`\`\`

---

## 🚨 MANDATORY: 5-Step Protocol (ProjectPulse)

**EVERY session MUST follow this protocol:**

### Step 1: Initialize Session

\`\`\`typescript
// Create session in ProjectPulse DB
await mcp.call('projectpulse.session.create', {
  projectId: 1,
  phase: 'Phase 1: Foundation',
  goals: ['Implement user authentication', 'Set up database']
});

// Load Memory Bank
const projectBrief = await mcp.call('projectpulse.memory.read', { type: 'project-brief' });
const systemPatterns = await mcp.call('projectpulse.memory.read', { type: 'system-patterns' });
\`\`\`

**Confirm:** "✅ STEP 1 COMPLETE: Session initialized in ProjectPulse DB"

### Step 2: Save Plan & Todos

\`\`\`typescript
// Save plan to ProjectPulse DB (NOT to local file)
await mcp.call('projectpulse.session.savePlan', {
  projectId: 1,
  plan: "Implementation plan here..."
});

// Save todos to ProjectPulse DB
await mcp.call('projectpulse.session.saveTodos', {
  projectId: 1,
  todos: [
    { content: 'Task 1', status: 'pending', priority: 'high' },
    { content: 'Task 2', status: 'pending', priority: 'medium' }
  ]
});
\`\`\`

**Confirm:** "✅ STEP 2 COMPLETE: Plan and todos saved to ProjectPulse DB"

### Step 3: Consult Expert Agents

**Available Agents** (from ProjectPulse DB):
${agentPersonas.map(a => `- **${a.name}** (\`${a.slug}\`): ${a.description}`).join('\n')}

\`\`\`typescript
// Invoke expert agent from ProjectPulse
const expertise = await mcp.call('projectpulse.agent.invoke', {
  agentSlug: 'nextjs-expert',
  question: 'How should I structure the API routes?'
});
\`\`\`

**Confirm:** "✅ STEP 3 COMPLETE: Consulted [agent-name] for [decision-topic]"

### Step 4: Progress Checkpoints

**At 15K, 30K, 45K, 60K, 75K, 90K tokens**:

\`\`\`typescript
// Update session progress in ProjectPulse DB
await mcp.call('projectpulse.session.updateProgress', {
  projectId: 1,
  progress: "Completed authentication module, starting API routes"
});
\`\`\`

**Confirm:** "✅ CHECKPOINT at [X]K tokens: Progress saved to ProjectPulse DB"

### Step 5: Post-Completion

\`\`\`typescript
// Update Memory Bank in ProjectPulse DB
await mcp.call('projectpulse.memory.update', {
  type: 'active-context',
  content: "Completed Phase 1, moving to Phase 2"
});

// Complete session
await mcp.call('projectpulse.session.complete', {
  projectId: 1,
  status: 'completed'
});
\`\`\`

**Confirm:** "✅ STEP 5 COMPLETE: Memory Bank updated, session completed"

---

## Documentation Access (ProjectPulse DB)

**DO NOT look for \`docs/\` folder** - All docs stored in ProjectPulse database.

\`\`\`typescript
// List available documents
const docs = await mcp.call('projectpulse.docs.list', { projectId: 1 });

// Read specific document
const prd = await mcp.call('projectpulse.docs.read', { 
  projectId: 1,
  filename: '01-PRD.md'
});
\`\`\`

**Available documents** (15 total from Session 2):
- 01-PRD.md
- 02-SRS.md
- 03-Architecture.md
- ... (13 more)

---

## Roadmap Tracking (ProjectPulse DB)

\`\`\`typescript
// Get current position in roadmap
const position = await mcp.call('projectpulse.roadmap.getCurrentPosition', {
  projectId: 1
});
// Returns: Phase → Sprint → Week → Day → Task

// Update current plan
await mcp.call('projectpulse.roadmap.updateCurrentPlan', {
  projectId: 1,
  weekId: 'week_id',
  dayId: 'day_id',
  plan: 'Working on authentication module'
});

// Update current todos
await mcp.call('projectpulse.roadmap.updateCurrentTodos', {
  projectId: 1,
  todos: [
    { content: 'Task 1', status: 'completed', priority: 'high' },
    { content: 'Task 2', status: 'in_progress', priority: 'high' }
  ]
});
\`\`\`

---

## ❌ What NOT to Do

- ❌ **DO NOT create \`.agent/\` folder**
- ❌ **DO NOT create local \`.agent/task/current-session.md\` files**
- ❌ **DO NOT create local \`.agent/task/current-plan.md\` files**
- ❌ **DO NOT create local \`.agent/task/current-todos.md\` files**
- ❌ **DO NOT look for \`docs/\` folder** - use \`projectpulse.docs.read()\`
- ❌ **DO NOT read \`.agent/active-context.md\`** - use \`projectpulse.memory.read()\`

**Your repo should stay CLEAN** - Only code files, NO agent tracking files!

---

## Best Practices

### ✅ Do:
- Use ProjectPulse DB for all context and tracking
- Call MCP tools for memory, sessions, roadmap
- Keep repo clean (only code files)
- Follow 5-step protocol
- Consult expert agents before technical decisions

### ❌ Don't:
- Create local agent files
- Skip protocol steps
- Hardcode values
- Skip testing
- Bypass security validation

---

## Getting Help

**Project Documentation** (ProjectPulse DB):
- Use \`projectpulse.docs.list()\` and \`.read()\`

**Agent Personas** (ProjectPulse DB):
- Use \`projectpulse.agent.list()\` and \`.invoke()\`

**Roadmap** (ProjectPulse DB):
- Use \`projectpulse.roadmap.getCurrentPosition()\`

**Memory Bank** (ProjectPulse DB):
- Use \`projectpulse.memory.read(type)\`

---

**Ready to code!** 🚀
  `.trim();
}

export async function generateAGENTSmd(
  projectName: string,
  agentPersonas: any[]
): Promise<string> {
  return `# ${projectName} - Available Agent Personas

**Last Updated**: ${new Date().toISOString().split('T')[0]}

This project uses **ProjectPulse** for agent management. All agent personas are stored in the ProjectPulse database.

---

## Accessing Agents

\`\`\`typescript
// List all available agents
const agents = await mcp.call('projectpulse.agent.list', { projectId: 1 });

// Invoke specific agent
const response = await mcp.call('projectpulse.agent.invoke', {
  agentSlug: 'nextjs-expert',
  question: 'How should I structure API routes?'
});
\`\`\`

---

## Available Agents

${agentPersonas.map(agent => `
### ${agent.name}

- **Slug**: \`${agent.slug}\`
- **Icon**: ${agent.icon}
- **Specialization**: ${agent.description}
- **Skills**: ${agent.skills.join(', ')}
- **Tools**: ${agent.tools.join(', ')}

**When to use**: ${agent.activationTriggers.join(', ')}
`).join('\n')}

---

## Agent Workflow

1. **Identify need**: "I need help with [topic]"
2. **Find agent**: Check list above or use \`projectpulse.agent.list()\`
3. **Invoke agent**: Call \`projectpulse.agent.invoke()\` with agent slug
4. **Apply guidance**: Follow agent's implementation recommendations

---

**All agents configured in ProjectPulse database** - No local agent files needed!
  `.trim();
}

export async function writeRepoFiles(
  repoPath: string,
  projectName: string,
  agentPersonas: any[]
): Promise<{ claudeMd: boolean; agentsMd: boolean }> {
  try {
    const claudeContent = await generateCLAUDEmd(projectName, agentPersonas);
    const agentsContent = await generateAGENTSmd(projectName, agentPersonas);
    
    // Write CLAUDE.md
    await fs.writeFile(
      path.join(repoPath, 'CLAUDE.md'),
      claudeContent,
      'utf-8'
    );
    
    // Write AGENTS.md
    await fs.writeFile(
      path.join(repoPath, 'AGENTS.md'),
      agentsContent,
      'utf-8'
    );
    
    return { claudeMd: true, agentsMd: true };
    
  } catch (error) {
    console.error('[Session 3] Failed to write repo files:', error);
    return { claudeMd: false, agentsMd: false };
  }
}
```

---

#### 3.6 API Route: POST /api/onboarding/bootstrap

**File**: `apps/web/app/api/onboarding/bootstrap/route.ts`

**This is the main Session 3 orchestration endpoint.**

```typescript
import { createAgentPersonas } from '@/lib/onboarding/create-sub-agents';
import { createSkills } from '@/lib/onboarding/create-skills';
import { createWorkflowsAndSOPs } from '@/lib/onboarding/create-workflows-sops';
import { createInitialCurrentWork } from '@/lib/onboarding/create-current-work';
import { writeRepoFiles } from '@/lib/onboarding/generate-repo-files';
import { parseProjectPlan, materializeRoadmap } from '@projectpulse/roadmap-tools';

export async function POST(request: NextRequest) {
  const { projectId, repoPath } = await request.json();
  
  // Fetch Session 1 & 2 (must be complete)
  const session1 = await prisma.onboardingSession.findUnique({
    where: { projectId_sessionNumber: { projectId, sessionNumber: 1 } }
  });
  
  const session2 = await prisma.onboardingSession.findUnique({
    where: { projectId_sessionNumber: { projectId, sessionNumber: 2 } }
  });
  
  if (!session1 || session1.status !== 'complete') {
    return NextResponse.json({ error: 'Session 1 must be complete' }, { status: 400 });
  }
  
  if (!session2 || session2.status !== 'complete') {
    return NextResponse.json({ error: 'Session 2 must be complete' }, { status: 400 });
  }
  
  const projectContext = session1.response.projectContextJson;
  
  // Step 1: Create agent personas
  const agentPersonasCount = await createAgentPersonas(
    projectId,
    projectContext.techStack
  );
  
  // Step 2: Create skills
  const skillsCount = await createSkills(
    projectId,
    projectContext.metadata.projectType,
    projectContext.techStack
  );
  
  // Step 3: Create workflows & SOPs
  const { workflows, sops } = await createWorkflowsAndSOPs(projectId);
  
  // Step 4: Materialize roadmap (if not already done)
  let roadmapId: string;
  const existingRoadmap = await prisma.roadmap.findUnique({
    where: { projectId }
  });
  
  if (existingRoadmap) {
    roadmapId = existingRoadmap.id;
  } else {
    // Find 13-Project-Plan.md
    const projectPlanDoc = await prisma.document.findFirst({
      where: {
        onboardingSessionId: session2.id,
        filename: { contains: '13-Project-Plan' }
      }
    });
    
    if (!projectPlanDoc) {
      return NextResponse.json({ 
        error: '13-Project-Plan.md not found in Session 2' 
      }, { status: 400 });
    }
    
    // Parse and materialize
    const parsedRoadmap = await parseProjectPlan(projectPlanDoc.id);
    const roadmap = await prisma.roadmap.create({
      data: { projectId, phases: parsedRoadmap as any }
    });
    await materializeRoadmap(roadmap.id);
    roadmapId = roadmap.id;
  }
  
  // Step 5: Create CurrentPlan & CurrentTodos
  await createInitialCurrentWork(projectId, roadmapId);
  
  // Step 6: Fetch created agent personas
  const agentPersonas = await prisma.agentPersona.findMany({
    where: { projectId },
    select: {
      name: true,
      slug: true,
      icon: true,
      description: true,
      skills: true,
      tools: true,
      activationTriggers: true
    }
  });
  
  // Step 7: Write CLAUDE.md & AGENTS.md to user repo
  const filesWritten = await writeRepoFiles(
    repoPath,
    projectContext.metadata.projectName,
    agentPersonas
  );
  
  // Step 8: Update Session 3 status
  await prisma.onboardingSession.upsert({
    where: {
      projectId_sessionNumber: { projectId, sessionNumber: 3 }
    },
    update: {
      response: {
        agentPersonas: agentPersonasCount,
        skills: skillsCount,
        workflows,
        sops,
        roadmapId,
        filesWritten,
        completedAt: new Date().toISOString()
      },
      status: 'complete',
      completedAt: new Date()
    },
    create: {
      projectId,
      sessionNumber: 3,
      status: 'complete',
      response: {
        agentPersonas: agentPersonasCount,
        skills: skillsCount,
        workflows,
        sops,
        roadmapId,
        filesWritten
      },
      startedAt: new Date(),
      completedAt: new Date()
    }
  });
  
  return NextResponse.json({
    success: true,
    agentPersonas: agentPersonasCount,
    skills: skillsCount,
    workflows,
    sops,
    roadmapId,
    filesWritten
  });
}
```

---

#### 3.7 MCP Tool: projectpulse.onboarding.bootstrap

**File**: `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts`

```typescript
export const bootstrapTool: ToolDefinition = {
  name: 'projectpulse.onboarding.bootstrap',
  description: 'Complete Session 3 bootstrap: create sub-agents, skills, workflows, SOPs, and generate CLAUDE.md/AGENTS.md',
  schema: z.object({
    projectId: z.number().int().positive(),
    repoPath: z.string().describe('Absolute path to user repository')
  }),
  
  async execute(params, context) {
    context.logger.info('Starting Session 3 bootstrap', { 
      projectId: params.projectId,
      repoPath: params.repoPath 
    });
    
    const response = await context.httpClient.post(
      '/api/onboarding/bootstrap',
      params
    );
    
    context.logger.info('Bootstrap complete', { 
      agentPersonas: response.agentPersonas,
      skills: response.skills,
      workflows: response.workflows,
      sops: response.sops,
      filesWritten: response.filesWritten
    });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };
  }
};
```

---

### Testing Phase 3

**Unit Tests**:
```bash
# Bootstrap complete Session 3
POST /api/onboarding/bootstrap
{
  "projectId": 1,
  "repoPath": "/Users/user/projects/my-project"
}
# Expect: Sub-agents, skills, workflows, SOPs created
# Expect: CLAUDE.md and AGENTS.md written to repo

# Verify database records
SELECT COUNT(*) FROM agent_personas WHERE project_id = 1;
# Expect: 3-5

SELECT COUNT(*) FROM skills WHERE project_id = 1;
# Expect: 5-10

SELECT COUNT(*) FROM workflow_templates WHERE project_id = 1;
# Expect: 2-3

SELECT COUNT(*) FROM sops WHERE project_id = 1;
# Expect: 3-5

SELECT * FROM current_plans WHERE project_id = 1;
# Expect: 1 record with Week 1, Day 1

SELECT * FROM current_todos WHERE project_id = 1;
# Expect: 1 record with 5 todos
```

**File System Verification**:
```bash
# Check CLAUDE.md created
ls -la /Users/user/projects/my-project/CLAUDE.md
# Expect: File exists

cat /Users/user/projects/my-project/CLAUDE.md | head -20
# Expect: "# MyProject - Claude Code Integration Guide"

# Check AGENTS.md created
ls -la /Users/user/projects/my-project/AGENTS.md
# Expect: File exists
```

**MCP Integration Test**:
```typescript
const result = await mcp.call('projectpulse.onboarding.bootstrap', {
  projectId: 1,
  repoPath: '/Users/user/projects/my-project'
});

console.log(result.agentPersonas); // Should be 3-5
console.log(result.skills); // Should be 5-10
console.log(result.filesWritten); // Should be { claudeMd: true, agentsMd: true }
```

---

## Testing Strategy

### E2E Test: Complete 3-Session Onboarding

**Test Script**: `tests/e2e/complete-onboarding.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test('Complete 3-session onboarding', async ({ request }) => {
  const projectId = 1;
  
  // ========== SESSION 1 ==========
  
  // Phase 1-10: Answer questions
  for (let phase = 1; phase <= 10; phase++) {
    // Get questions
    const questionsResp = await request.get(
      `/api/onboarding/questions?projectId=${projectId}&phase=${phase}`
    );
    expect(questionsResp.ok()).toBeTruthy();
    const questions = await questionsResp.json();
    
    // Save answers
    const answersResp = await request.post('/api/onboarding/answers', {
      data: {
        projectId,
        phase,
        answers: generateMockAnswers(questions)
      }
    });
    expect(answersResp.ok()).toBeTruthy();
  }
  
  // Generate executive summary
  const summaryResp = await request.post('/api/onboarding/executive-summary', {
    data: { projectId }
  });
  expect(summaryResp.ok()).toBeTruthy();
  const summary = await summaryResp.json();
  expect(summary.executiveSummary).toContain('project');
  expect(summary.wordCount).toBeGreaterThan(400);
  
  // ========== SESSION 2 ==========
  
  // Generate all 15 documents
  const docsResp = await request.post('/api/onboarding/generate-documents', {
    data: { projectId }
  });
  expect(docsResp.ok()).toBeTruthy();
  const docs = await docsResp.json();
  expect(docs.documentsGenerated).toBe(15);
  expect(docs.totalWordCount).toBeGreaterThan(25000);
  
  // Verify documents created
  const listDocsResp = await request.get(
    `/api/onboarding/documents?projectId=${projectId}`
  );
  expect(listDocsResp.ok()).toBeTruthy();
  const docsList = await listDocsResp.json();
  expect(docsList.documents.length).toBe(15);
  
  // ========== SESSION 3 ==========
  
  // Bootstrap AI workflow
  const bootstrapResp = await request.post('/api/onboarding/bootstrap', {
    data: {
      projectId,
      repoPath: '/tmp/test-project'
    }
  });
  expect(bootstrapResp.ok()).toBeTruthy();
  const bootstrap = await bootstrapResp.json();
  
  expect(bootstrap.agentPersonas).toBeGreaterThanOrEqual(3);
  expect(bootstrap.skills).toBeGreaterThanOrEqual(5);
  expect(bootstrap.workflows).toBeGreaterThanOrEqual(2);
  expect(bootstrap.sops).toBeGreaterThanOrEqual(3);
  expect(bootstrap.filesWritten.claudeMd).toBe(true);
  expect(bootstrap.filesWritten.agentsMd).toBe(true);
  
  // Verify database records created
  // (Use direct Prisma queries in test)
});

function generateMockAnswers(questions: any) {
  // Generate realistic mock answers for testing
  const answers = {};
  questions.subsections.forEach((subsection: any) => {
    subsection.questions.forEach((q: any) => {
      answers[q.id] = `Mock answer for ${q.text}`;
    });
  });
  return answers;
}
```

---

## Implementation Timeline

### Week 1 (Phase 1 - Session 1)

**Day 1-2** (13 points):
- Seed database with 98 questions
- Implement questions API route
- Implement answers API route
- Implement executive summary API route with OpenAI integration

**Day 3**:
- Implement MCP tools (getQuestions, saveAnswers, generateExecutiveSummary)
- Unit tests for all routes
- MCP integration tests

---

### Week 2 (Phase 2 - Session 2)

**Day 4-5** (15 points):
- Create document prompt templates (15 documents)
- Implement generate-documents API route with OpenAI integration
- Implement list-documents API route

**Day 6**:
- Implement MCP tools (generateDocuments, listDocuments)
- Unit tests for all routes
- Verify all 15 documents generated correctly

---

### Week 3 (Phase 3 - Session 3)

**Day 7-8** (12 points):
- Implement sub-agents creation logic
- Implement skills creation logic
- Implement workflows & SOPs creation logic
- Implement CurrentPlan & CurrentTodos creation logic

**Day 9**:
- Implement CLAUDE.md & AGENTS.md generation
- Implement file system writes
- Implement bootstrap API route

**Day 10**:
- Implement MCP tool (bootstrap)
- E2E test: Complete 3-session onboarding
- Fix any issues
- Documentation

---

## Success Criteria

### Phase 1 Complete When:
- [x] 98 questions seeded in database
- [x] All 10 phases of questions accessible via API
- [x] Phase-by-phase answer storage working
- [x] Executive summary generation with OpenAI working (~500 words)
- [x] project-context.json generated correctly
- [x] MCP tools working
- [x] Unit tests passing

### Phase 2 Complete When:
- [x] All 15 document prompts created
- [x] Document generation with OpenAI working
- [x] All 15 documents created (~30K words total)
- [x] 13-Project-Plan.md has correct format for Session 3 parsing
- [x] Documents stored in Document table
- [x] MCP tools working
- [x] Unit tests passing

### Phase 3 Complete When:
- [x] 3-5 AgentPersona records created (project-scoped)
- [x] 5-10 Skill records created (project-scoped)
- [x] 2-3 WorkflowTemplate records created
- [x] 3-5 SOP records created
- [x] CurrentPlan record created (Week 1, Day 1)
- [x] CurrentTodos record created (5 todos)
- [x] Roadmap materialized (if not already)
- [x] CLAUDE.md written to user repo
- [x] AGENTS.md written to user repo
- [x] MCP tool working
- [x] E2E test passing

---

## Dependencies & Prerequisites

### External Dependencies (AGENT-SIDE AI)

**Already Installed**:
- ~~❌ OpenAI SDK (`openai`)~~ → **REMOVED** (agent-side AI, not server-side)
- ✅ Prisma ORM
- ✅ Next.js 14
- ✅ Zod validation

**No AI SDKs Required**:
- ✅ **Agent uses their own AI provider** (Claude, GPT, Gemini, etc.)
- ✅ **Zero cost for us** (no OpenAI API key needed)
- ✅ **Privacy-first** (user data never sent to our LLM providers)

### Internal Dependencies

**Phase 1 Depends On**:
- ✅ OnboardingSession model (exists)
- ✅ Database connection

**Phase 2 Depends On**:
- ✅ Document model (exists)
- ✅ Session 1 complete (projectContextJson)

**Phase 3 Depends On**:
- ✅ AgentPersona model (exists)
- ✅ Skill model (exists)
- ✅ WorkflowTemplate model (exists)
- ✅ SOP model (exists)
- ✅ CurrentPlan model (exists)
- ✅ CurrentTodos model (exists)
- ✅ Session 1 & 2 complete
- ✅ Roadmap materialization logic (exists from Phase 1)

---

## Environment Variables (AGENT-SIDE AI)

```bash
# .env
# OPENAI_API_KEY=sk-...  # REMOVED - Not needed (agent-side AI)
DATABASE_URL=postgresql://...  # Existing
NEXT_PUBLIC_MCP_URL=http://192.168.1.15:3001  # Existing
```

**Note**: No AI API keys required in our environment. Agent uses their own AI provider credentials.

---

## Risks & Mitigation (AGENT-SIDE AI)

### Risk 1: Agent May Generate Inconsistent Content
**Impact**: Different agents (Claude, GPT, Gemini) may produce varying quality/formats  
**Mitigation**: 
- Provide VERY detailed prompt templates with explicit format requirements
- Include markdown structure examples in prompts
- Validate stored content structure server-side
- Provide regeneration capability if format incorrect

### Risk 2: Agent-Generated Content Quality
**Impact**: Agent may not follow prompt instructions accurately  
**Mitigation**:
- Test prompt templates with multiple AI providers
- Include specific section headings and examples
- Provide word count targets in prompts
- Allow regeneration with refined prompts
- Add validation rules (min/max word count, required sections)

### Risk 3: File System Writes
**Impact**: CLAUDE.md/AGENTS.md writes may fail (permissions)  
**Mitigation**:
- Validate repoPath before writing
- Check write permissions
- Provide clear error messages
- Make file writes optional (fallback to manual creation)

### Risk 4: Large Data Volume
**Impact**: 15 documents (~30K words) may slow down Session 2  
**Mitigation**:
- Show progress indicator
- Generate in batches
- Stream results
- Cache generated content

---

## Monitoring & Observability

### Metrics to Track

1. **Session 1 Metrics**:
   - Average time per phase (questions)
   - Executive summary generation time
   - Executive summary word count

2. **Session 2 Metrics**:
   - Total generation time (all 15 documents)
   - Average document word count
   - OpenAI API calls (count, latency, cost)

3. **Session 3 Metrics**:
   - Bootstrap time (total)
   - Agent personas created
   - Skills created
   - File write success rate

### Logging

```typescript
console.log('[Session 1] Phase 3 complete, 9/98 questions answered');
console.log('[Session 1] Executive summary generated: 487 words');
console.log('[Session 2] Generating 01-PRD.md... (2043 words)');
console.log('[Session 2] All 15 documents generated: 29,847 words total');
console.log('[Session 3] Created 5 agent personas');
console.log('[Session 3] Bootstrap complete');
```

---

## Next Steps After Implementation

1. **Update Documentation**:
   - Update README with onboarding instructions
   - Update INFRASTRUCTURE.md with OpenAI requirements
   - Update .agent/progress.md

2. **User Testing**:
   - Test with 2-3 real projects
   - Validate document quality
   - Gather feedback on agent personas

3. **Performance Optimization**:
   - Cache frequently accessed documents
   - Optimize database queries
   - Add Redis caching for expensive operations

4. **Feature Enhancements** (Future):
   - Custom questions per project type
   - Document regeneration
   - Agent persona customization
   - Skills library expansion

---

## Conclusion

This spec provides a complete implementation plan for the 3-session onboarding system as designed in the reference documentation. With 40 points and 4-5 days of focused work, we can deliver:

✅ **Session 1**: 10-phase questions + AI executive summary  
✅ **Session 2**: 15 industry documents (~30K words) with AI  
✅ **Session 3**: Complete AI workflow (sub-agents, skills, workflows, SOPs, CLAUDE.md/AGENTS.md)

**Total Impact**: Enables full agent-driven development workflow with ProjectPulse as designed.

**Ready to proceed?** Let's start with Sprint 8.6 Day 1: Session 1 Questions System!