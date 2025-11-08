# Dual-Mode Tool Developer Guide

Audience: Developers adding new tools to ProjectPulse MCP server

Last Updated: 2025-11-09

---

## Overview

ProjectPulse MCP server supports dual-mode operation:
- Traditional MCP: Direct stdio tool calls (all clients)
- Code Execution MCP: Filesystem-based wrappers (Claude Code)

Key Principle: Write business logic ONCE, expose via TWO adapters.

---

## Adding a New Tool (Step-by-Step)

### Step 1: Define Service Interface

```typescript
// src/services/CommentService.ts
export interface CommentService {
  create(issueId: string, text: string): Promise<Comment>;
  list(issueId: string, options: PaginationOptions): Promise<PaginatedResult<Comment>>;
  delete(commentId: string): Promise<void>;
}

export class CommentServiceImpl implements CommentService {
  constructor(
    private repo: CommentRepository,
    private privacy: PrivacyService
  ) {}
  
  async create(issueId: string, text: string): Promise<Comment> {
    // Business logic here
    const validated = this.validateText(text);
    const tokenized = await this.privacy.tokenize(validated);
    
    const comment = await this.repo.create({
      issueId,
      text: tokenized,
    });
    
    return comment;
  }
  
  // ... other methods
}
```

### Step 2: Create Traditional Adapter

```typescript
// src/adapters/traditional/tools/create-comment.ts
import { CommentService } from '../../../services/CommentService';

export function createCommentTool(commentService: CommentService) {
  return {
    name: 'create-comment',
    description: 'Add a comment to an issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: { type: 'string' },
        text: { type: 'string' },
      },
      required: ['issueId', 'text'],
    },
    
    async handler(input: { issueId: string; text: string }) {
      // Route to shared service
      const comment = await commentService.create(input.issueId, input.text);
      
      return {
        success: true,
        data: comment,
      };
    },
  };
}
```

### Step 3: Create Code Execution Wrapper (Sprint 3)

```typescript
// servers/projectpulse/comments/create.ts
import { mcpClient } from '../client';

export interface CreateCommentInput {
  issueId: string;
  text: string;
}

export async function createComment(input: CreateCommentInput): Promise<Comment> {
  // This runs client-side, calls MCP server
  const result = await mcpClient.callTool('create-comment', input);
  return result.data;
}
```

### Step 4: Register Tool

```typescript
// src/server/index.ts
import { createCommentTool } from './adapters/traditional/tools/create-comment';

const commentService = new CommentServiceImpl(commentRepo, privacyService);
const commentTool = createCommentTool(commentService);

server.registerTool(commentTool);
```

### Step 5: Test Both Modes

```typescript
// test/multi-client/comment.test.ts
describe('create-comment parity', () => {
  test('traditional mode', async () => {
    const result = await traditionalClient.callTool('create-comment', {
      issueId: 'issue-1',
      text: 'Test comment',
    });
    
    expect(result.data.text).toBe('Test comment');
  });
  
  test('code execution mode (Sprint 3)', async () => {
    // Same test with code execution client
    // Results must match traditional mode
  });
});
```

---

## Best Practices

1) Shared Logic

```typescript
// ✅ DO: Put all logic in services
class IssueService {
  async search(options) {
    // ALL search logic here
    // Both adapters call this
  }
}

// ❌ DON'T: Duplicate logic in adapters
// Traditional adapter
async function handler(input) {
  // ❌ Don't put search logic here
}

// Code exec wrapper
async function search(input) {
  // ❌ Don't put search logic here
}
```

2) Privacy Tokenization

```typescript
class IssueService {
  async create(data) {
    const validated = this.validate(data);
    const tokenized = await this.privacy.tokenize(data);  // ✅
    return await this.repo.create(tokenized);
  }
}
```

3) Pagination

```typescript
async function search(options: SearchOptions) {
  const page = options.page || 1;
  const limit = Math.min(options.limit || 20, 100);
  
  // Always return pagination metadata
  return {
    items: [/* results */],
    total: 1234,
    page,
    pages: 62,
    hasMore: true,
  };
}
```

4) Error Handling

```typescript
try {
  const result = await service.operation();
  return { success: true, data: result };
} catch (error: any) {
  return {
    success: false,
    error: error.code || 'UNKNOWN_ERROR',
    message: error.message,
    suggestion: 'Check input and try again',
  };
}
```

---

## Testing Checklist

For each new tool:
- Service interface defined
- Service implementation with tests
- Traditional adapter created
- Code execution wrapper (Sprint 3)
- Registered with server
- Input validation (Zod schema)
- Privacy tokenization applied
- Pagination implemented (if list operation)
- Error handling added
- Parity test added (both modes return same results)
- Token usage measured
- Documentation updated

---

## Common Pitfalls

Pitfall 1: Logic in Adapter

```typescript
// ❌ Wrong:
async function handler(input) {
  // Doing business logic in adapter
  const result = await prisma.issue.findMany({
    where: { status: input.status },
  });
  return result;
}

// ✅ Right:
async function handler(input) {
  // Route to service
  return await issueService.search(input);
}
```

Pitfall 2: Forgetting Tokenization

```typescript
// ❌ Wrong:
async function create(data) {
  return await this.repo.create(data);  // Raw data!
}

// ✅ Right:
async function create(data) {
  const tokenized = await this.privacy.tokenize(data);
  return await this.repo.create(tokenized);
}
```

Pitfall 3: Inconsistent Pagination

- ❌ Wrong: Some tools paginate, some don't
- ✅ Right: All list operations paginate consistently

---

## Need Help?

- See existing tools in src/adapters/traditional/tools/
- Check service examples in src/services/
- Review parity tests in test/multi-client/
- Ask in #projectpulse-dev channel

Document Version: 1.0 (Week 5)
Next Update: Sprint 3 (add code execution examples)
