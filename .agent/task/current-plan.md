# Implementation Plan: US-009 Checkpoint Creation

**Date**: 2025-11-09
**Goal**: Implement checkpoint system to reach Sprint 1 92% completion (48/52 points)
**User Story**: US-009 - "As an agent, I want to create a checkpoint with notes and token usage so that I can resume work after context compaction"
**Story Points**: 3 points (~3-4 hours)

---

## Overview

Implement checkpoint creation functionality to enable agents to save progress snapshots every 15K tokens for context recovery after compaction or session interruption.

**Key Deliverables**:
1. Prisma Checkpoint model with migration
2. POST /api/checkpoints API route
3. sprint.checkpoint.create MCP tool
4. Documentation updates (api-catalog.md, mcp-tools-guide.md)
5. Integration test

---

## Expert Consultation Summary

### Prisma Expert Recommendations

**Report**: `.agent/task/prisma-checkpoint-design-20251109-1430.md`

**Key Decisions**:
- ✅ **Separate Model**: Checkpoint as new model (not Session extension)
- ✅ **Index Strategy**: 3 indexes for <50ms recovery query
  - `@@index([sessionId])`
  - `@@index([createdAt DESC])`
  - `@@index([sessionId, createdAt DESC])` ← Critical for latest checkpoint query
- ✅ **JSONB Storage**: sessionContext as flexible JSON field
- ✅ **Migration**: Non-breaking, no backfill needed

### Next.js Expert Recommendations

**Report**: `.agent/task/nextjs-checkpoints-api-20251109-1400.md`

**Key Decisions**:
- ✅ **API Route** (not Server Action) - MCP tools call via HTTP
- ✅ **Zod Validation**: Strict schema with field-level constraints
- ✅ **Size Limits**: notes max 5000 chars, sessionContext validated structure
- ✅ **No Rate Limiting**: Not needed for MVP (single user, infrequent calls)

---

## Implementation Steps

### Step 1: Prisma Schema Design (30 minutes)

**File**: `apps/web/prisma/schema.prisma`

**Add Checkpoint Model**:
```prisma
model Checkpoint {
  id               String   @id @default(cuid())
  sessionId        String
  notes            String   @db.Text
  tokenUsage       Int
  sessionContext   Json?
  checkpointNumber Int
  createdAt        DateTime @default(now())

  session          Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, checkpointNumber])
  @@index([sessionId])
  @@index([createdAt(sort: Desc)])
  @@index([sessionId, createdAt(sort: Desc)])
  @@map("checkpoints")
}
```

**Update Session Model**:
```prisma
model Session {
  // ... existing fields
  checkpoints Checkpoint[]  // Add relation
}
```

**Create Migration**:
```bash
# On Mac mini (where database runs)
cd /Users/[user]/projects/AI_HUB
npx prisma migrate dev --name add_checkpoint_model
npx prisma generate
```

**Success Criteria**:
- ✅ Migration applies successfully
- ✅ Prisma Client regenerated
- ✅ TypeScript types available

---

### Step 2: Zod Validation Schemas (20 minutes)

**File**: `apps/web/lib/validation/checkpoint.ts` (new file)

**Create Validation Schemas**:
```typescript
import { z } from 'zod';

// SessionContext schema (flexible structure)
export const SessionContextSchema = z.object({
  // Hierarchy context
  taskId: z.string().cuid().optional(),
  taskTitle: z.string().max(200).optional(),
  dayId: z.string().cuid().optional(),
  dayTitle: z.string().max(100).optional(),

  // Progress context
  completionPercentage: z.number().min(0).max(100).optional(),
  checkpointCount: z.number().int().min(0).optional(),

  // Code context
  filesModified: z.array(z.string()).optional(),
  filesCreated: z.array(z.string()).optional(),
  endpointsImplemented: z.array(z.string()).optional(),

  // Recovery context
  uncommittedChanges: z.boolean().optional(),
  currentBranch: z.string().optional(),
  tokenBudgetRemaining: z.number().int().min(0).optional(),
}).strict();  // Reject unknown properties

export type SessionContext = z.infer<typeof SessionContextSchema>;

// Create Checkpoint request schema
export const CreateCheckpointSchema = z.object({
  sessionId: z.string().cuid({ message: 'Invalid session ID format' }),
  notes: z.string()
    .min(1, 'Notes cannot be empty')
    .max(5000, 'Notes must be at most 5000 characters'),
  tokenUsage: z.number()
    .int('Token usage must be an integer')
    .min(0, 'Token usage cannot be negative')
    .max(200000, 'Token usage exceeds maximum (200K)'),
  sessionContext: SessionContextSchema.optional(),
});

export type CreateCheckpointInput = z.infer<typeof CreateCheckpointSchema>;

// Checkpoint response schema
export const CheckpointSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  notes: z.string(),
  tokenUsage: z.number().int(),
  sessionContext: SessionContextSchema.nullable(),
  checkpointNumber: z.number().int(),
  createdAt: z.date(),
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;
```

**Success Criteria**:
- ✅ All schemas defined with proper validation
- ✅ TypeScript types inferred correctly
- ✅ No compilation errors

---

### Step 3: API Route Implementation (45 minutes)

**File**: `apps/web/app/api/checkpoints/route.ts` (new file)

**Implement POST Handler**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { CreateCheckpointSchema } from '@/lib/validation/checkpoint';
import { ApiResponse } from '@/lib/types/api';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validationResult = CreateCheckpointSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid checkpoint data',
          details: validationResult.error.errors,
        },
      }, { status: 400 });
    }

    const { sessionId, notes, tokenUsage, sessionContext } = validationResult.data;

    // 2. Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Session with ID ${sessionId} not found`,
        },
      }, { status: 404 });
    }

    // 3. Get next checkpoint number for this session
    const lastCheckpoint = await prisma.checkpoint.findFirst({
      where: { sessionId },
      orderBy: { checkpointNumber: 'desc' },
      select: { checkpointNumber: true },
    });

    const checkpointNumber = (lastCheckpoint?.checkpointNumber ?? 0) + 1;

    // 4. Create checkpoint
    const checkpoint = await prisma.checkpoint.create({
      data: {
        sessionId,
        notes,
        tokenUsage,
        sessionContext: sessionContext ?? null,
        checkpointNumber,
      },
    });

    // 5. Return success response
    return NextResponse.json<ApiResponse<typeof checkpoint>>({
      data: checkpoint,
      error: null,
    }, { status: 201 });

  } catch (error) {
    console.error('[POST /api/checkpoints] Error:', error);

    return NextResponse.json<ApiResponse<null>>({
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create checkpoint',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}
```

**Success Criteria**:
- ✅ Validation errors return 400 with details
- ✅ Session not found returns 404
- ✅ Successful creation returns 201 with checkpoint data
- ✅ Server errors return 500 with message
- ✅ Checkpoint numbers increment correctly per session

---

### Step 4: MCP Tool Implementation (30 minutes)

**File**: `apps/mcp-server/src/tools/checkpoint.ts` (new file)

**Implement MCP Tool**:
```typescript
import { z } from 'zod';
import { ToolDefinition } from './types.js';
import { httpClient } from '../httpClient.js';
import { logger } from '../logger.js';

// Zod schema for MCP tool input (matches API but with optional context)
const CreateCheckpointInputSchema = z.object({
  sessionId: z.string().describe('Session ID to attach checkpoint to'),
  notes: z.string().describe('Checkpoint notes (max 5000 chars)'),
  tokenUsage: z.number().int().describe('Current token usage (0-200000)'),
  sessionContext: z.object({
    taskId: z.string().optional(),
    taskTitle: z.string().optional(),
    completionPercentage: z.number().optional(),
    filesModified: z.array(z.string()).optional(),
    // ... other context fields
  }).optional().describe('Optional session context snapshot'),
});

export const checkpointTool: ToolDefinition = {
  definition: {
    name: 'sprint.checkpoint.create',
    description: 'Create a checkpoint to save agent progress (every 15K tokens)',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Session ID to attach checkpoint to',
        },
        notes: {
          type: 'string',
          description: 'Checkpoint notes describing current progress',
        },
        tokenUsage: {
          type: 'number',
          description: 'Current token usage (0-200000)',
        },
        sessionContext: {
          type: 'object',
          description: 'Optional session context snapshot',
          properties: {
            taskId: { type: 'string' },
            taskTitle: { type: 'string' },
            completionPercentage: { type: 'number' },
            filesModified: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
      required: ['sessionId', 'notes', 'tokenUsage'],
    },
  },

  handler: async (args: unknown) => {
    // Validate input
    const validationResult = CreateCheckpointInputSchema.safeParse(args);
    if (!validationResult.success) {
      throw new Error(`Invalid input: ${validationResult.error.message}`);
    }

    const input = validationResult.data;

    logger.info('[checkpoint.create] Creating checkpoint', {
      sessionId: input.sessionId,
      tokenUsage: input.tokenUsage,
    });

    // Call API
    const response = await httpClient.post('/api/checkpoints', input);

    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to create checkpoint');
    }

    const checkpoint = response.data;

    logger.info('[checkpoint.create] Checkpoint created', {
      checkpointId: checkpoint.id,
      checkpointNumber: checkpoint.checkpointNumber,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            checkpoint: {
              id: checkpoint.id,
              checkpointNumber: checkpoint.checkpointNumber,
              sessionId: checkpoint.sessionId,
              tokenUsage: checkpoint.tokenUsage,
              createdAt: checkpoint.createdAt,
            },
            message: `Checkpoint #${checkpoint.checkpointNumber} created successfully`,
          }, null, 2),
        },
      ],
    };
  },
};
```

**Register Tool** in `apps/mcp-server/src/tools/index.ts`:
```typescript
import { checkpointTool } from './checkpoint.js';

export const tools: ToolDefinition[] = [
  healthCheckTool,
  phaseCreateTool,
  getCurrentTaskTool,
  updateProgressTool,
  taskCreateTool,
  sessionCreateTool,
  checkpointTool,  // Add here
];
```

**Success Criteria**:
- ✅ Tool registered in MCP server
- ✅ Input validation working
- ✅ API call successful
- ✅ Response formatted correctly
- ✅ Errors handled gracefully

---

### Step 5: Documentation Updates (20 minutes)

Update both documentation files with checkpoint endpoint and tool details.

**Success Criteria**:
- ✅ API endpoint documented with examples
- ✅ MCP tool documented with workflow
- ✅ Both files updated and committed

---

### Step 6: Integration Testing (30 minutes)

**Test Scenarios**:
1. Successful checkpoint creation
2. Validation error (invalid tokenUsage)
3. Session not found
4. MCP tool test
5. Sequential checkpoints (verify numbering)

**Success Criteria**:
- ✅ All 5 test scenarios pass
- ✅ Checkpoint numbers increment correctly
- ✅ TypeScript builds successfully (0 errors)
- ✅ Response formats match ApiResponse<> pattern

---

## Success Criteria

**Functional Requirements**:
- ✅ Can create checkpoint via POST /api/checkpoints
- ✅ Can create checkpoint via sprint.checkpoint.create MCP tool
- ✅ Checkpoint numbers increment sequentially per session
- ✅ Session context stored as JSONB (flexible structure)
- ✅ All validation rules enforced (notes max 5K, tokenUsage 0-200K)

**Performance Requirements**:
- ✅ Checkpoint creation <100ms
- ✅ Latest checkpoint query <50ms (via composite index)

**Quality Requirements**:
- ✅ TypeScript builds successfully (0 errors)
- ✅ All test scenarios pass
- ✅ API responses follow ApiResponse<> pattern
- ✅ Documentation complete and accurate

**Sprint 1 Impact**:
- ✅ Reaches 92% completion (48/52 points)
- ✅ Checkpoint system operational (exit criteria met)
- ✅ Ready for Sprint 2 (Markdown Sync + Workflow)

---

## Estimated Time

**Total**: 3-4 hours (~3 story points)

**Breakdown**:
- Prisma schema + migration: 30 minutes
- Zod validation: 20 minutes
- API route: 45 minutes
- MCP tool: 30 minutes
- Documentation: 20 minutes
- Testing: 30 minutes
- **Buffer**: 15-45 minutes

---

**Plan created: 2025-11-09**
**Ready to implement: YES**
