# MCP Tools Specification

**Related**: [Overview](./01-overview.md) | [Schema Changes](./02-schema-changes.md) | [Implementation](./04-implementation-plan.md)

---

## Overview

This document specifies all 17 MCP tools for the refactored onboarding system:
- **8 New Tools**: checkTokenBudget, finalizeSummary, getDocBatchPrompt, getBootstrapPrompt, createBatch tools (×4), repo.writeMinimal, logStep, completeSession
- **5 Refactored Tools**: Renamed or extended (getPhasedQuestions, savePhase, storeBatch)
- **4 Kept Unchanged**: storeExecutiveSummary, listDocuments, roadmap.createHierarchy, blueprint.get

---

## Tool Catalog Summary

| Tool Name | Session | Type | Input | Output | Description |
|-----------|---------|------|-------|--------|-------------|
| `getPhasedQuestions` | 1 | 🔄 Rename | projectId, phase | questions array | Get questions for phase 1-10 |
| `savePhase` | 1 | 🔄 Rename | projectId, phase, answers | progress | Save phase answers to planningAnswers |
| `finalizeSummary` | 1 | ✨ NEW | projectId | prompt template | Get prompt with all 96 Q&A pairs |
| `storeExecutiveSummary` | 1 | ✅ Keep | projectId, summary | success | Store agent-generated summary |
| `checkTokenBudget` | All | ✨ NEW | projectId, estimatedTokens | safe, remaining | Check if under 200K limit |
| `getDocBatchPrompt` | 2 | ✨ NEW | projectId, batch | doc prompts | Get prompts for batch 1-4 |
| `storeBatch` | 2 | 🔄 Extend | projectId, documents[] | created count | Bulk store documents |
| `listDocuments` | 2 | ✅ Keep | projectId | documents | List stored documents |
| `getBootstrapPrompt` | 3 | ✨ NEW | projectId | parse instructions | Get prompt for parsing Project Plan |
| `agentPersona.createBatch` | 3 | ✨ NEW | projectId, personas[] | created count | Bulk create agent personas |
| `skill.createBatch` | 3 | ✨ NEW | projectId, skills[] | created count | Bulk create skills |
| `workflowTemplate.createBatch` | 3 | ✨ NEW | projectId, workflows[] | created count | Bulk create workflow templates |
| `sop.createBatch` | 3 | ✨ NEW | projectId, sops[] | created count | Bulk create SOPs |
| `repo.writeMinimal` | 3 | ✨ NEW | projectId, repoPath | files written | Optional write claude.md, agents.md |
| `logStep` | All | ✨ NEW | projectId, step, metrics | success | Log progress to AgentAction |
| `completeSession` | All | ✨ NEW | projectId, session, report | success | Mark session complete with validation |
| `roadmap.createHierarchy` | 3 | ✅ Keep | projectId, hierarchyJson | hierarchy | Materialize Phase→Sprint→Week→Day→Task |

---

## Session 1 Tools: Strategic Planning

### 1.1 `getPhasedQuestions` (Renamed from `getQuestions`)

**Purpose**: Get questions for a specific phase (1-10) of strategic planning.

**Input Schema**:
```typescript
{
  projectId: number;  // Required
  phase: number;      // 1-10
}
```

**Output Schema**:
```typescript
{
  projectId: number;
  phase: number;
  phaseName: string;                    // "Phase 1: Product Manager - Foundation"
  totalPhases: number;                  // 10
  totalQuestions: number;               // 9-12 questions for this phase
  subsections: Array<{
    subsection: string;                 // "1.1 User Personas"
    questions: Array<{
      id: string;                       // "phase1_q1"
      questionNumber: number;           // 1
      questionText: string;             // "Who are the primary users?"
      placeholder?: string;             // Example answer
      helpText?: string;                // Additional guidance
      validationType: string;           // "text" | "number" | "array" | "url"
      isRequired: boolean;
      minLength?: number;
      maxLength?: number;
    }>;
  }>;
  guidance: string;                     // Agent instructions from WorkflowTemplate
  estimatedTokens: number;              // 15000-20000 per phase
}
```

**Implementation**:
```typescript
// apps/mcp-server/src/tools/onboarding/getPhasedQuestionsTool.ts

import { z } from 'zod';
import type { ToolDefinition, ToolContext } from '../types.js';

const schema = z.object({
  projectId: z.number().int().positive(),
  phase: z.number().int().min(1).max(10)
});

export const getPhasedQuestionsTool: ToolDefinition = {
  name: 'projectpulse_onboarding_getPhasedQuestions',
  description: 'Get questions for a specific phase (1-10) of Session 1: Strategic Planning. Agent asks conversationally, collects answers, then calls savePhase.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number', description: 'Project ID' },
      phase: { type: 'number', description: 'Phase number (1-10): 1=Product Manager, 2=Strategic Planning, 3=UX/UI, 4=Architecture, 5=DevOps, 6=Backend, 7=Frontend, 8=QA, 9=Production, 10=Security' }
    },
    required: ['projectId', 'phase']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const { projectId, phase } = schema.parse(params);
    
    const response = await context.httpClient.get(
      `/api/onboarding/questions?projectId=${projectId}&phase=${phase}`
    );
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

### 1.2 `savePhase` (Renamed from `saveAnswers`)

**Purpose**: Save answers for a phase and merge into projectContextJson.

**Input Schema**:
```typescript
{
  projectId: number;
  phase: number;           // 1-10
  answers: Record<string, string | number | string[]>; // Zod-validated per phase
}
```

**Output Schema**:
```typescript
{
  success: boolean;
  projectId: number;
  phase: number;
  phasesComplete: number;  // 1-10
  progress: number;        // 0-100 (10% per phase)
  nextPhase: number | null;
  message: string;         // "Phase 1 saved ✅. Proceed to Phase 2."
}
```

**Validation**: Zod schemas per phase (96 questions total).

**Implementation**:
```typescript
// apps/mcp-server/src/tools/onboarding/savePhaseTool.ts

const schema = z.object({
  projectId: z.number().int().positive(),
  phase: z.number().int().min(1).max(10),
  answers: z.record(z.union([z.string(), z.number(), z.array(z.string())]))
});

export const savePhaseTool: ToolDefinition = {
  name: 'projectpulse_onboarding_savePhase',
  description: 'Save phase answers to OnboardingSession.planningAnswers and merge to projectContextJson.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number' },
      phase: { type: 'number' },
      answers: { type: 'object', description: 'Answers keyed by question ID' }
    },
    required: ['projectId', 'phase', 'answers']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    const response = await context.httpClient.post('/api/onboarding/phase', validated);
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

### 1.3 `finalizeSummary` (NEW)

**Purpose**: Get prompt template to generate executive summary from all 96 Q&A pairs.

**Input Schema**:
```typescript
{
  projectId: number;
}
```

**Output Schema**:
```typescript
{
  projectId: number;
  systemPrompt: string;    // Instructions for AI
  userPrompt: string;      // Full context with 96 Q&A pairs injected
  metadata: {
    totalQuestions: number;           // 96
    totalPhases: number;              // 10
    userPromptCharacters: number;     // ~8000-12000 chars
    estimatedTokens: number;          // ~3000-4000 tokens
  };
  wordCountTarget: number;            // 400-600 words
  temperature: number;                // 0.7
  guidance: string;                   // "Generate 500-word summary..."
}
```

**Implementation**:
```typescript
// apps/mcp-server/src/tools/onboarding/finalizeSummaryTool.ts

const schema = z.object({
  projectId: z.number().int().positive()
});

export const finalizeSummaryTool: ToolDefinition = {
  name: 'projectpulse_onboarding_finalizeSummary',
  description: 'Get prompt template to generate executive summary from all 96 Q&A pairs. Agent generates summary with THEIR AI provider, then calls storeExecutiveSummary.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number' }
    },
    required: ['projectId']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const { projectId } = schema.parse(params);
    
    const response = await context.httpClient.get(
      `/api/onboarding/summary-prompt?projectId=${projectId}`
    );
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

### 1.4 `checkTokenBudget` (NEW - All Sessions)

**Purpose**: Check if estimated token usage is within 200K session limit.

**Input Schema**:
```typescript
{
  projectId: number;
  estimatedTokens: number;  // Agent's estimate for next operation
}
```

**Output Schema**:
```typescript
{
  projectId: number;
  sessionNumber: number;       // 1-3
  tokensUsed: number;          // Total so far
  estimatedTokens: number;     // Requested amount
  totalEstimated: number;      // tokensUsed + estimatedTokens
  budgetLimit: number;         // 200000
  remaining: number;           // budgetLimit - totalEstimated
  safe: boolean;               // totalEstimated < budgetLimit
  recommendation: string;      // "Proceed" or "Defer remaining docs to next session"
}
```

**Implementation**:
```typescript
// apps/mcp-server/src/tools/onboarding/checkTokenBudgetTool.ts

const schema = z.object({
  projectId: z.number().int().positive(),
  estimatedTokens: z.number().int().positive()
});

export const checkTokenBudgetTool: ToolDefinition = {
  name: 'projectpulse_onboarding_checkTokenBudget',
  description: 'Check if estimated token usage is within 200K session limit. Call before generating large content (doc batches, summary).',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number' },
      estimatedTokens: { type: 'number', description: 'Estimated tokens for next operation' }
    },
    required: ['projectId', 'estimatedTokens']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    const response = await context.httpClient.post(
      '/api/onboarding/token-budget',
      validated
    );
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

---

## Session 2 Tools: Documentation

### 2.1 `getDocBatchPrompt` (NEW - Replaces `getDocumentPrompts`)

**Purpose**: Get prompts for a batch of 4-5 documents (waterfall generation).

**Input Schema**:
```typescript
{
  projectId: number;
  batch: number;  // 1-4
}
```

**Output Schema**:
```typescript
{
  projectId: number;
  batchNumber: number;
  totalBatches: number; // 4
  documents: Array<{
    filename: string;             // "01-PRD.md"
    category: string;             // "planning"
    systemPrompt: string;         // From WorkflowTemplate
    userPrompt: string;           // With projectContextJson + priorDocs context
    wordCountTarget: number;      // 2000-3000
    estimatedTokens: number;      // 5000-8000
    dependencies: string[];       // ["executive-summary.md"]
  }>;
  estimatedTotalTokens: number;   // 40000-50000 per batch
  guidance: string;               // "Generate in order: PRD → SRS → Backlog → Project Plan"
}
```

**Batches**:
- Batch 1: 01-PRD.md, 02-SRS.md, 12-Backlog.md, 13-Project-Plan.md (4 docs, planning)
- Batch 2: 03-Architecture.md, 04-Data-Model.md, 05-API-Spec.md (3 docs, architecture)
- Batch 3: 06-UI-UX.md, 07-Security.md, 08-Testing.md (3 docs, implementation)
- Batch 4: 09-Deployment.md, 10-Observability.md, 11-Performance.md, 14-Team-Onboarding.md, 15-Maintenance.md (5 docs, operations)

**Implementation**:
```typescript
// apps/mcp-server/src/tools/onboarding/getDocBatchPromptTool.ts

const schema = z.object({
  projectId: z.number().int().positive(),
  batch: z.number().int().min(1).max(4)
});

export const getDocBatchPromptTool: ToolDefinition = {
  name: 'projectpulse_onboarding_getDocBatchPrompt',
  description: 'Get prompts for a batch of 4-5 documents (waterfall generation). Session 2 has 4 batches total. Agent generates each doc with THEIR AI, then calls storeBatch.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number' },
      batch: { type: 'number', description: 'Batch number (1-4): 1=Planning, 2=Architecture, 3=Implementation, 4=Operations' }
    },
    required: ['projectId', 'batch']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const { projectId, batch } = schema.parse(params);
    
    const response = await context.httpClient.get(
      `/api/onboarding/doc-batch?projectId=${projectId}&batch=${batch}`
    );
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

### 2.2 `storeBatch` (Extends `storeDocument`)

**Purpose**: Bulk store documents after agent generation.

**Input Schema**:
```typescript
{
  projectId: number;
  documents: Array<{
    filename: string;     // "01-PRD.md"
    content: string;      // Full markdown content
    category: string;     // "planning" | "architecture" | "implementation" | "operations"
    wordCount: number;    // Calculated by agent
  }>;
}
```

**Output Schema**:
```typescript
{
  success: boolean;
  projectId: number;
  created: number;           // Count of documents created
  batchesComplete: number;   // 1-4
  totalDocuments: number;    // 15
  progress: number;          // 0-100 (based on 15 docs)
  message: string;           // "Batch 1 stored ✅. 4/15 documents complete."
}
```

**Implementation**:
```typescript
// apps/mcp-server/src/tools/onboarding/storeBatchTool.ts

const schema = z.object({
  projectId: z.number().int().positive(),
  documents: z.array(z.object({
    filename: z.string().min(1),
    content: z.string().min(500).max(50000),
    category: z.enum(['planning', 'architecture', 'implementation', 'operations']),
    wordCount: z.number().int().positive()
  })).min(1).max(5)
});

export const storeBatchTool: ToolDefinition = {
  name: 'projectpulse_onboarding_storeBatch',
  description: 'Bulk store documents after agent generation. Stores in Document table linked to OnboardingSession.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number' },
      documents: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            content: { type: 'string' },
            category: { type: 'string' },
            wordCount: { type: 'number' }
          }
        }
      }
    },
    required: ['projectId', 'documents']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    const response = await context.httpClient.post(
      '/api/onboarding/documents/batch',
      validated
    );
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

---

## Session 3 Tools: Bootstrap

### 3.1 `getBootstrapPrompt` (NEW - Replaces `bootstrap`)

**Purpose**: Get prompt with instructions for parsing 13-Project-Plan.md to JSON.

**Input Schema**:
```typescript
{
  projectId: number;
}
```

**Output Schema**:
```typescript
{
  projectId: number;
  systemPrompt: string;         // "You are a System Architect..."
  userPrompt: string;           // Parse instructions + projectPlanMarkdown
  structuredOutputSchema: {     // JSON schema for output
    phases: Array<{
      title: string;
      order: number;
      sprints: Array<{
        name: string;
        weeks: string;
        points: number;
        goals: string[];
        deliverables: string[];
      }>;
    }>;
  };
  fallbackGuidance: string;     // "If parse <90%, call workflow.consultExpert()"
  techStack: string[];          // From projectContextJson (for personas/skills)
  temperature: number;          // 0.3 (structured output)
  maxTokens: number;            // 5000
}
```

**Implementation**:
```typescript
// apps/mcp-server/src/tools/onboarding/getBootstrapPromptTool.ts

const schema = z.object({
  projectId: z.number().int().positive()
});

export const getBootstrapPromptTool: ToolDefinition = {
  name: 'projectpulse_onboarding_getBootstrapPrompt',
  description: 'Get prompt with instructions for parsing 13-Project-Plan.md to JSON hierarchy. Agent parses with THEIR AI, then calls batch create tools.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number' }
    },
    required: ['projectId']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const { projectId } = schema.parse(params);
    
    const response = await context.httpClient.get(
      `/api/onboarding/bootstrap-prompt?projectId=${projectId}`
    );
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

### 3.2 `agentPersona.createBatch` (NEW)

**Purpose**: Bulk create agent personas based on tech stack.

**Input Schema**:
```typescript
{
  projectId: number;
  personas: Array<{
    name: string;                   // "Backend Expert"
    description: string;            // "Specializes in Node.js, PostgreSQL..."
    activationTriggers?: string[];  // ["prisma", "database", "api"]
  }>;
}
```

**Output Schema**:
```typescript
{
  success: boolean;
  projectId: number;
  created: number;          // 3-10
  totalPersonas: number;    // Count
  message: string;          // "Created 7 agent personas ✅"
}
```

**Implementation**: Similar to `storeBatch`, calls `/api/agent-personas/batch`.

### 3.3 `skill.createBatch`, `workflowTemplate.createBatch`, `sop.createBatch` (NEW)

Similar structure to `agentPersona.createBatch`:
- `skill.createBatch`: Create 5-15 skills (framework-specific)
- `workflowTemplate.createBatch`: Create 3 workflow templates (project-scoped)
- `sop.createBatch`: Create 5 SOPs (static)

### 3.4 `repo.writeMinimal` (NEW)

**Purpose**: Optional write `claude.md` and `agents.md` to user's repo.

**Input Schema**:
```typescript
{
  projectId: number;
  repoPath: string;  // Absolute path
}
```

**Output Schema**:
```typescript
{
  success: boolean;
  projectId: number;
  filesWritten: string[];  // ["claude.md", "agents.md"]
  repoPath: string;
  message: string;         // "Optional files written to repo ✅"
}
```

**Implementation**:
```typescript
// apps/mcp-server/src/tools/repo/writeMinimalTool.ts

const schema = z.object({
  projectId: z.number().int().positive(),
  repoPath: z.string().min(1).max(500)
});

export const writeMinimalTool: ToolDefinition = {
  name: 'projectpulse_repo_writeMinimal',
  description: 'Optional write claude.md and agents.md to user repository. Only called if agent/user explicitly requests.',
  schema,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: { type: 'number' },
      repoPath: { type: 'string', description: 'Absolute path to repository' }
    },
    required: ['projectId', 'repoPath']
  },
  
  async execute(params: unknown, context: ToolContext) {
    const validated = schema.parse(params);
    
    const response = await context.httpClient.post(
      '/api/repo/write-minimal',
      validated
    );
    
    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  }
};
```

---

## Cross-Session Tools

### `logStep` (NEW)

**Purpose**: Log progress to AgentAction table for observability.

**Input Schema**:
```typescript
{
  projectId: number;
  step: string;            // "Phase 1 complete", "Batch 1 generated"
  metrics: {
    tokensUsed: number;
    duration: number;      // milliseconds
  };
}
```

### `completeSession` (NEW)

**Purpose**: Mark session complete with validation report.

**Input Schema**:
```typescript
{
  projectId: number;
  session: number;  // 1-3
  validationReport: {
    complete: boolean;
    gaps: string[];
    recommendations: string[];
  };
}
```

**Output Schema**:
```typescript
{
  success: boolean;
  projectId: number;
  session: number;
  status: "complete";
  nextSession: number | null;  // 2, 3, or null
  message: string;
}
```

---

## Tool Registration

**File**: `apps/mcp-server/src/tools/index.ts`

```typescript
import { getPhasedQuestionsTool } from './onboarding/getPhasedQuestionsTool.js';
import { savePhaseTool } from './onboarding/savePhaseTool.js';
import { finalizeSummaryTool } from './onboarding/finalizeSummaryTool.js';
import { checkTokenBudgetTool } from './onboarding/checkTokenBudgetTool.js';
import { getDocBatchPromptTool } from './onboarding/getDocBatchPromptTool.js';
import { storeBatchTool } from './onboarding/storeBatchTool.js';
import { getBootstrapPromptTool } from './onboarding/getBootstrapPromptTool.js';
import { agentPersonaCreateBatchTool } from './agentPersona/createBatchTool.js';
import { skillCreateBatchTool } from './skill/createBatchTool.js';
import { workflowCreateBatchTool } from './workflow/createBatchTool.js';
import { sopCreateBatchTool } from './sop/createBatchTool.js';
import { writeMinimalTool } from './repo/writeMinimalTool.js';
import { logStepTool } from './onboarding/logStepTool.js';
import { completeSessionTool } from './onboarding/completeSessionTool.js';

export const loadTools = (): ToolDefinition[] => [
  // ... existing tools
  
  // Session 1 (refactored)
  getPhasedQuestionsTool,
  savePhaseTool,
  finalizeSummaryTool,
  storeExecutiveSummaryTool, // unchanged
  
  // Session 2 (refactored)
  getDocBatchPromptTool,
  storeBatchTool,
  listDocumentsTool, // unchanged
  
  // Session 3 (refactored)
  getBootstrapPromptTool,
  agentPersonaCreateBatchTool,
  skillCreateBatchTool,
  workflowCreateBatchTool,
  sopCreateBatchTool,
  roadmapCreateHierarchyTool, // unchanged (Sprint 8.5)
  writeMinimalTool,
  
  // Cross-session
  checkTokenBudgetTool,
  logStepTool,
  completeSessionTool,
  
  // ... other tools
];
```

---

## Next Steps

After understanding tool specifications:
1. **Implement Tools** → Follow [Implementation Plan](./04-implementation-plan.md)
2. **Update API Routes** → Match tool input/output schemas
3. **Test Tools** → [Migration & Testing](./05-migration-testing.md)
