# Agent Integration Guide: ProjectPulse Onboarding

**Audience**: AI agents (Claude Code, Cursor, etc.)  
**Purpose**: Complete 3-session onboarding via MCP tools  
**Architecture**: Agent-side AI generation

---

## Architecture Overview

### Agent-Side AI Pattern

**CRITICAL**: ProjectPulse uses **agent-side AI generation**, not server-side.

**How It Works**:
1. Server provides: Prompt templates + user data
2. Agent generates: Content with THEIR AI provider
3. Agent stores: Generated content back to server
4. Server manages: Database state, validation, file writes

**Benefits**:
- Privacy: User data never sent to server's AI
- Zero Cost: No OpenAI API key needed on server
- Context: Agent gets ALL data in one prompt (no token limits)
- Flexibility: Works with any AI provider

---

## Prerequisites

- MCP connection to ProjectPulse server
- Project created (projectId known)
- Agent has access to AI provider

---

## Complete Workflow

### Session 1: Strategic Planning (60-90 min)

**Goal**: Collect 96 answers across 10 phases, generate executive summary

**Workflow**:

```typescript
const projectId = 1;

// Phase 1-10: Complete all phases
for (let phase = 1; phase <= 10; phase++) {
  // Step 1: Get questions for phase
  const questions = await mcp.call('projectpulse.onboarding.getQuestions', {
    projectId,
    phase
  });
  
  console.log(`Phase ${phase}: ${questions.phaseName}`);
  console.log(`Questions: ${questions.totalQuestions}`);
  
  // Step 2: Collect answers (from user or auto-generate)
  const answers = {};
  for (const subsection of questions.subsections) {
    for (const question of subsection.questions) {
      // Option A: Prompt user for answer
      answers[question.id] = await promptUser(question.text);
      
      // Option B: Auto-generate with AI
      // answers[question.id] = await generateAnswer(question);
    }
  }
  
  // Step 3: Save answers
  await mcp.call('projectpulse.onboarding.saveAnswers', {
    projectId,
    phase,
    answers
  });
  
  console.log(`✅ Phase ${phase}/10 complete`);
}

// Step 4: Get executive summary prompt (ALL 96 Q&A pairs)
const promptData = await mcp.call('projectpulse.onboarding.getExecutiveSummaryPrompt', {
  projectId
});

console.log('Prompt metadata:');
console.log(`- Total questions: ${promptData.metadata.totalQuestions}`);
console.log(`- User prompt size: ${promptData.metadata.userPromptCharacters} chars`);
console.log(`- Target word count: ${promptData.wordCountTarget}`);

// Step 5: Generate with YOUR AI provider
const executiveSummary = await myAI.generate({
  system: promptData.systemPrompt,
  user: promptData.userPrompt,
  temperature: promptData.temperature || 0.7,
  max_tokens: 1000 // ~500 words
});

console.log(`Generated: ${executiveSummary.split(/\s+/).length} words`);

// Step 6: Store agent-generated summary
await mcp.call('projectpulse.onboarding.storeExecutiveSummary', {
  projectId,
  executiveSummary,
  wordCount: executiveSummary.split(/\s+/).length
});

console.log('✅ Session 1 complete!');
```

### Session 2: Documentation Generation (30-60 min)

**Goal**: Generate 15 industry-standard documents (~30K words)

**Workflow**:

```typescript
// Step 1: Get all 15 document prompts
const prompts = await mcp.call('projectpulse.onboarding.getDocumentPrompts', {
  projectId
});

console.log(`Received ${prompts.totalDocuments} document prompts`);
console.log(`Estimated words: ${prompts.estimatedTotalWords}`);

// Step 2: Generate each document with YOUR AI
for (const prompt of prompts.documentPrompts) {
  console.log(`Generating ${prompt.filename}...`);
  console.log(`Category: ${prompt.category}, Target: ${prompt.wordCountTarget} words`);
  
  const document = await myAI.generate({
    system: prompt.systemPrompt,
    user: prompt.userPrompt,
    temperature: 0.7,
    max_tokens: prompt.wordCountTarget * 2 // ~1.5 tokens per word
  });
  
  const wordCount = document.split(/\s+/).length;
  console.log(`✅ Generated: ${wordCount} words`);
  
  // Step 3: Store document
  await mcp.call('projectpulse.onboarding.storeDocument', {
    projectId,
    filename: prompt.filename,
    content: document,
    category: prompt.category,
    wordCount
  });
}

// Step 4: Verify all documents stored
const storedDocs = await mcp.call('projectpulse.onboarding.listDocuments', {
  projectId
});

console.log(`✅ Session 2 complete! ${storedDocs.totalDocuments}/15 documents stored`);
```

### Session 3: AI Workflow Bootstrap (15-30 sec)

**Goal**: Create agent personas, skills, workflows, SOPs, roadmap

**Workflow**:

```typescript
// Step 1: Bootstrap (NO AI generation - template-based)
const result = await mcp.call('projectpulse.onboarding.bootstrap', {
  projectId,
  repoPath: '/path/to/user/repository'
});

console.log('✅ Bootstrap complete!');
console.log(JSON.stringify(result.created, null, 2));

// Result includes:
// {
//   agentPersonas: 4,
//   skills: 8,
//   workflows: 3,
//   sops: 5,
//   roadmap: { phases: 3, sprints: 6 },  // Sprint 15: 2-level hierarchy
//   currentPlan: true,
//   currentTodos: true,
//   files: { claudeMd: true, agentsMd: true }
// }
```

---

## MCP Tools Reference

### Session 1 Tools

#### `projectpulse.onboarding.getQuestions`

Get questions for specific phase (1-10)

**Input**:
```typescript
{
  projectId: number;
  phase: number; // 1-10
}
```

**Output**:
```typescript
{
  phase: number;
  phaseName: string;
  subsections: Array<{
    id: string;
    name: string;
    questions: Array<{
      id: string;
      questionNumber: number;
      text: string;
      placeholder: string;
      isRequired: boolean;
    }>;
  }>;
  totalQuestions: number;
}
```

#### `projectpulse.onboarding.saveAnswers`

Save answers for specific phase

**Input**:
```typescript
{
  projectId: number;
  phase: number;
  answers: {
    [questionId: string]: string;
  };
}
```

**Output**:
```typescript
{
  success: boolean;
  completedPhases: number[];
  phase: number;
  nextPhase: number | null;
  readyForExecutiveSummary: boolean;
}
```

#### `projectpulse.onboarding.getExecutiveSummaryPrompt`

Get prompt template with ALL 96 Q&A pairs

**Input**:
```typescript
{
  projectId: number;
}
```

**Output**:
```typescript
{
  systemPrompt: string;  // Role instructions
  userPrompt: string;    // ALL 96 Q&A pairs formatted
  temperature: number;   // 0.7
  wordCountTarget: number; // 500
  metadata: {
    totalQuestions: number;      // 96
    completedPhases: number;     // 10
    userPromptCharacters: number; // ~15,000
  };
  requiredSections: string[];
}
```

#### `projectpulse.onboarding.storeExecutiveSummary`

Store agent-generated summary

**Input**:
```typescript
{
  projectId: number;
  executiveSummary: string;
  wordCount?: number; // Optional, auto-calculated
}
```

**Output**:
```typescript
{
  success: boolean;
  stored: boolean;
  wordCount: number;
  projectContextJson: object;
}
```

### Session 2 Tools

#### `projectpulse.onboarding.getDocumentPrompts`

Get all 15 document prompts

**Input**:
```typescript
{
  projectId: number;
}
```

**Output**:
```typescript
{
  totalDocuments: number; // 15
  estimatedTotalWords: number; // ~30,000
  documentPrompts: Array<{
    filename: string;
    title: string;
    category: 'planning' | 'architecture' | 'implementation' | 'operations';
    wordCountTarget: number;
    systemPrompt: string;
    userPrompt: string;
  }>;
}
```

#### `projectpulse.onboarding.storeDocument`

Store agent-generated document

**Input**:
```typescript
{
  projectId: number;
  filename: string;
  content: string;
  category: string;
  wordCount: number;
}
```

**Output**:
```typescript
{
  success: boolean;
  stored: boolean;
  filename: string;
  progress: { stored: number; total: number };
  session2Complete: boolean;
}
```

#### `projectpulse.onboarding.listDocuments`

List all stored documents

**Input**:
```typescript
{
  projectId: number;
}
```

**Output**:
```typescript
{
  totalDocuments: number;
  documents: Array<{
    id: number;
    filename: string;
    wordCount: number;
    category: string;
    generatedAt: string;
  }>;
  session2Complete: boolean;
}
```

### Session 3 Tools

#### `projectpulse.onboarding.bootstrap`

Bootstrap complete workflow (template-based)

**Input**:
```typescript
{
  projectId: number;
  repoPath: string; // Absolute path
}
```

**Output**:
```typescript
{
  success: boolean;
  session3Complete: boolean;
  created: {
    agentPersonas: number;
    skills: number;
    workflows: number;
    sops: number;
    roadmap: {
      id: string;
      phases: number;
      weeks: number;
    };
    currentPlan: boolean;
    currentTodos: boolean;
    files: {
      claudeMd: boolean;
      agentsMd: boolean;
    };
  };
}
```

> **Note (Sprint 11 – EPIC-013: Client Agent Integration APIs & Templates):**
> Session 3 bootstraps agent personas, skills, workflows, SOPs, and writes `CLAUDE.md` / `AGENTS.md` into the user's repository. A dedicated post-MVP epic will add client-facing MCP/HTTP read APIs for personas, skills, and SOPs, and will refine these repo templates so external client agents can consume the AI workflows without relying on `.agent/` or `.claude/` folders.

---

## Post-Onboarding: Kanban Workflow

After Session 3 completes, use the Kanban-based workflow for development:

### 1. Validate Traceability & Populate Backlog

```typescript
await mcp.call('projectpulse.traceability.validateDocuments', { projectId });
// Parses 12-Backlog.md → stores BacklogItem records
```

### 2. Create Roadmap (2-Level Hierarchy)

```typescript
await mcp.call('projectpulse.roadmap.create', {
  projectId,
  title: "Project Roadmap",
  startDate: "2025-01-01T00:00:00.000Z",
  materialize: true,
  phases: [
    {
      title: "Phase 1: Foundation",
      sprints: [
        { name: "Sprint 1", duration: "2 weeks" },
        { name: "Sprint 2", duration: "2 weeks" }
      ]
    }
  ]
});
// Creates Phase → Sprint records (no Week/Day)
```

### 3. Get Sprint Backlog & Create Tickets

```typescript
// Get backlog items for Sprint 1
const backlog = await mcp.call('projectpulse.backlog.getBySprint', {
  projectId,
  sprintNumber: 1
});

// Create tickets with traceability
for (const item of backlog.items) {
  await mcp.call('projectpulse.ticket.create', {
    title: item.title,
    kind: 'feature',
    source: 'agent',
    sprintNumber: 1,
    backlogRefs: item.frTraces,
    epicRef: item.epicRef
  });
}
```

### 4. Work via Kanban Board

**Navigate UI:**
- `/roadmap` - Phase Timeline
- `/roadmap/sprint/1` - Sprint 1 Kanban

**Move tickets via MCP:**

```typescript
// Start working on ticket
await mcp.call('projectpulse.kanban.moveTicket', {
  ticketId: 123,
  status: 'in-progress',
  displayOrder: 0
});

// Complete ticket (auto-cascades progress)
await mcp.call('projectpulse.kanban.moveTicket', {
  ticketId: 123,
  status: 'done',
  displayOrder: 0
});
```

**5-Status Columns:**

| Status | Description |
|--------|-------------|
| `backlog` | Not yet scheduled |
| `todo` | Ready to start |
| `in-progress` | Being worked on |
| `in-review` | Awaiting review |
| `done` | Completed |

---

## Error Handling

### Common Errors

**Session 1**:
```typescript
// Error: Not all phases complete
{
  error: "All 10 phases must be complete",
  completedPhases: 7,
  missingPhases: [8, 9, 10]
}
```

**Session 2**:
```typescript
// Error: Session 1 not complete
{
  error: "Session 1 must be complete before Session 2"
}
```

**Session 3**:
```typescript
// Error: Sessions 1 or 2 not complete
{
  error: "Session 1 must be complete before starting Session 3"
}

// Error: Invalid repo path
{
  error: "Repository path does not exist or is not writable",
  repoPath: "/invalid/path"
}
```

### Error Recovery

```typescript
try {
  await mcp.call('projectpulse.onboarding.saveAnswers', { ... });
} catch (error) {
  if (error.message.includes('must be complete')) {
    // Prerequisites not met - complete earlier sessions first
  } else if (error.message.includes('validation')) {
    // Invalid input - check required fields
  } else {
    // Retry or log error
  }
}
```

---

## Best Practices

### For Agents

1. **Save progress frequently**: Store answers after each phase
2. **Validate responses**: Check API responses for errors before proceeding
3. **Monitor progress**: Track completion counts
4. **Handle errors gracefully**: Retry failed operations
5. **Log actions**: Track what was created/stored for debugging

### Performance Tips

1. **Session 1**: User interaction required (60-90 min)
2. **Session 2**: Can parallelize document generation (5-10 min total)
3. **Session 3**: Fastest session (~30 seconds, no AI)

### Token Management

- Session 1 prompt: ~15K chars (~5K tokens)
- Session 2 prompts: 15 × ~3K chars each (~1.5K tokens each)
- Total AI cost: ~25-30K tokens for all 3 sessions

---

## Example: Complete Automation Script

```typescript
async function automateOnboarding(projectId: number, repoPath: string) {
  console.log('🚀 Starting automated onboarding...\n');
  
  // ========== SESSION 1 ==========
  console.log('📋 Session 1: Strategic Planning');
  
  for (let phase = 1; phase <= 10; phase++) {
    const questions = await getQuestions(projectId, phase);
    const answers = await collectAnswers(questions);
    await saveAnswers(projectId, phase, answers);
    console.log(`✅ Phase ${phase}/10`);
  }
  
  const prompt = await getExecutiveSummaryPrompt(projectId);
  const summary = await myAI.generate(prompt);
  await storeExecutiveSummary(projectId, summary);
  console.log('✅ Session 1 complete!\n');
  
  // ========== SESSION 2 ==========
  console.log('📋 Session 2: Documentation');
  
  const prompts = await getDocumentPrompts(projectId);
  
  for (const prompt of prompts.documentPrompts) {
    console.log(`Generating ${prompt.filename}...`);
    const document = await myAI.generate(prompt);
    await storeDocument(projectId, prompt.filename, document, prompt.category);
    console.log(`✅ ${prompt.filename}`);
  }
  console.log('✅ Session 2 complete!\n');
  
  // ========== SESSION 3 ==========
  console.log('📋 Session 3: Bootstrap');
  
  const result = await bootstrap(projectId, repoPath);
  console.log(`✅ Created ${result.created.agentPersonas} personas`);
  console.log(`✅ Created ${result.created.skills} skills`);
  console.log(`✅ Created ${result.created.workflows} workflows`);
  console.log(`✅ Created ${result.created.sops} SOPs`);
  console.log(`✅ Materialized ${result.created.roadmap.phases} phase roadmap`);
  console.log('✅ Session 3 complete!\n');
  
  console.log('🎉 Onboarding complete! Project fully configured.');
}
```

---

## Testing

See `apps/web/tests/e2e/onboarding-session-*.spec.ts` for complete E2E test examples.

---

**Questions?** See User Onboarding Guide or API Reference.
