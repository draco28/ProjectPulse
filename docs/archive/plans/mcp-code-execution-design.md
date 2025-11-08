# MCP Code Execution Implementation Design

Status: Planning
Sprint: Sprint 2 (Weeks 5-8)
Last Updated: 2025-11-09

---

## Executive Summary

ProjectPulse will implement the code execution approach for its MCP server to achieve:
- 98.7% token reduction on tool operations
- 25+ tools without context bloat
- Privacy-preserving data processing
- Scalable architecture for future growth

---

## Problem Statement

### Current MCP Limitations

Traditional MCP (used by our current servers):
1. Tool Definition Overload: All 25+ tools loaded upfront = 50K+ tokens
2. Context Window Bloat: Search results (100K+ tokens) pass through model
3. No Local Processing: Filtering/sorting happens in model context
4. Privacy Challenges: Sensitive data exposed to model

### Our Specific Challenges

ProjectPulse requirements:
- 25+ MCP tools across 4 categories (issues, knowledge, projects, agents)
- Knowledge base search returning 100-500 articles
- Agent personas needing different tool subsets
- Issue content potentially sensitive (emails, IPs, customer data)

Token budget constraints:
- 200K token limit per session
- 50K tokens for tool definitions = 25% of budget gone
- Large search results could exceed limits entirely

---

## Solution: Code Execution with MCP

### How It Works

1. Filesystem-Based Tool Organization

```
./servers/projectpulse/
├── issues/
│   ├── create.ts    # Tool: Create issue
│   ├── search.ts    # Tool: Search issues (returns large datasets)
│   └── filter.ts    # Tool: Filter locally
├── knowledge/
│   ├── search.ts    # Tool: Hybrid search
│   └── embed.ts     # Tool: Generate embeddings
└── agents/
    └── personas.ts  # Tool: Load persona prompts
```

2. On-Demand Discovery

```typescript
// Agent explores available tools
const issueTools = await listDirectory('./servers/projectpulse/issues/')
// Returns: ['create.ts', 'search.ts', 'filter.ts']

// Loads only what's needed
import { search } from './servers/projectpulse/issues/search.ts'
```

3. Local Execution

Data processing happens in code execution environment:

```typescript
// Search returns 500 issues locally
const allIssues = await searchIssues('bug')

// Filter locally (not in model context!)
const openBugs = allIssues.filter(i => 
  i.status === 'open' && i.priority === 'high'
)

// Sort locally
const sorted = openBugs.sort((a, b) => 
  b.created_at - a.created_at
)

// Return only top 10 to model
return sorted.slice(0, 10)
```

Model only sees 10 issues, not 500!

---

## Architecture Design

### Component Overview

```
┌─────────────────────────────────────────┐
│ Claude Code (Agent)                     │
│  - Explores ./servers/projectpulse/     │
│  - Writes TypeScript code               │
│  - Receives filtered results            │
└──────────────┬──────────────────────────┘
               │
               │ Code execution
               ▼
┌─────────────────────────────────────────┐
│ Code Execution Environment              │
│  - Runs TypeScript code                 │
│  - Local filtering/processing           │
│  - Auto-tokenization (privacy)          │
│  - Imports tool wrappers                │
└──────────────┬──────────────────────────┘
               │
               │ MCP stdio protocol
               ▼
┌─────────────────────────────────────────┐
│ MCP Server (Node.js)                    │
│  - Exposes tools as filesystem          │
│  - Handles stdio communication          │
│  - Database/API integration             │
└─────────────────────────────────────────┘
```

### Tool Wrapper Pattern

Each tool is a TypeScript module that wraps MCP calls:

```typescript
// ./servers/projectpulse/issues/search.ts
import { mcpClient } from '../client'

export interface SearchOptions {
  query: string
  status?: 'open' | 'closed' | 'all'
  limit?: number
}

export async function searchIssues(options: SearchOptions) {
  // MCP call happens here (abstracted from agent)
  const result = await mcpClient.callTool('search-issues', options)
  return result.issues
}
```

Agent uses it like a normal async function.

### Discovery Mechanism

Agents discover tools via filesystem exploration:

```typescript
// Agent code (written by Claude Code)
const availableCategories = await readDirectory('./servers/projectpulse/')
// Returns: ['issues', 'knowledge', 'agents', 'projects']

const issueTools = await readDirectory('./servers/projectpulse/issues/')
// Returns: ['create.ts', 'search.ts', 'filter.ts', 'update.ts']

// Load specific tool
const { searchIssues } = await import('./servers/projectpulse/issues/search.ts')
```

Benefits:
- Only 1-2K tokens for directory listing
- Load definitions on-demand (not upfront)
- Self-documenting structure

### Privacy Layer: Auto-Tokenization

Sensitive data masked before reaching model:

```typescript
// ./servers/projectpulse/privacy/tokenize.ts
const sensitivePatterns = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g
}

export function tokenizeIssue(issue: { description: string }) {
  let content = issue.description
  content = content.replace(sensitivePatterns.email, '<EMAIL_TOKEN>')
  content = content.replace(sensitivePatterns.ip, '<IP_TOKEN>')
  return { ...issue, description: content }
}
```

Usage in tool:

```typescript
// search.ts
import { tokenizeIssue } from '../privacy/tokenize'

export async function searchIssues(options: SearchOptions) {
  const results = await mcpClient.callTool('search-issues', options)
  // Tokenize before returning to model
  return results.map(tokenizeIssue)
}
```

---

## Implementation Plan

### Phase 1: Foundation (Sprint 2, Week 5)

Goals:
- Set up code execution environment
- Create filesystem structure
- Implement 3 proof-of-concept tools

Tasks:
- Install code execution MCP dependencies
- Create ./servers/projectpulse/ structure
- Implement basic tools: issues/create.ts, issues/search.ts, issues/filter.ts
- Test on-demand loading
- Benchmark token usage

Success Criteria:
- Agent can discover and load tools
- Create + search + filter workflow works
- Token usage < 5K for full operation

### Phase 2: Core Tools (Sprint 2, Weeks 6-7)

Goals:
- Implement issue management suite (10 tools)
- Add local processing capabilities
- Implement basic privacy layer

Tasks:
- Complete issue tools (update, delete, comment, etc.)
- Add filtering/sorting utilities
- Implement auto-tokenization
- Create knowledge base tools (search, retrieve)
- Test complex workflows (loops, error handling)

Success Criteria:
- All CRUD operations work
- Search + filter + sort in single operation
- Sensitive data properly tokenized

### Phase 3: Agent Personas (Sprint 2, Week 8)

Goals:
- Implement persona-based tool discovery
- Create agent-specific tool subsets
- Test with specialized agents

Tasks:
- Create persona definitions
- Map personas to tool subsets
- Implement agents/personas.ts
- Test with architect/fullstack/testing personas

Success Criteria:
- Each persona loads only relevant tools
- Token overhead < 3K per persona activation

### Phase 4: Knowledge Base (Sprint 3, Weeks 9-10)

Goals:
- Implement knowledge base tools
- Add hybrid search (full-text + semantic)
- Optimize for large result sets

Tasks:
- Create knowledge/search.ts with local filtering
- Implement semantic search with embeddings
- Add relevance ranking
- Test with 1000+ article dataset

Success Criteria:
- Search 1000 articles, return top 10
- Token usage < 10K (vs 200K+ traditional)

### Phase 5: Complete Tool Suite (Sprint 3, Weeks 11-12)

Goals:
- Reach 25+ total tools
- Complete privacy layer
- Performance optimization

Tasks:
- Add remaining tools (projects, team, etc.)
- Implement comprehensive tokenization
- Add caching layer for frequent operations
- Performance benchmarking

Success Criteria:
- 25+ tools available
- Average operation < 5K tokens
- Privacy layer covers all sensitive patterns

### Phase 6: Testing & Documentation (Sprint 4)

Goals:
- Comprehensive testing
- Documentation and examples
- Integration with Claude Code

Tasks:
- Unit tests for all tools
- Integration tests for workflows
- Create usage examples
- Update MCP server documentation

Success Criteria:
- 90%+ test coverage
- All workflows documented
- Ready for production use

---

## Token Efficiency Analysis

Scenario: Search and Filter Issues

Traditional MCP:
- Load tools:               50,000 tokens
- Search (500 results):    150,000 tokens
- Filter in context:       150,000 tokens
- Return results:            5,000 tokens
- TOTAL:                   355,000 tokens ❌ EXCEEDS LIMIT

Code Execution MCP:
- Explore ./servers/:        1,000 tokens
- Load search.ts:            1,000 tokens
- Execute + filter:          (local, 0 tokens)
- Return 10 results:         2,000 tokens
- TOTAL:                     4,000 tokens ✅ 98.9% reduction

Scenario: Knowledge Base Search

Traditional MCP:
- Load tools:               50,000 tokens
- Hybrid search (1000):    200,000 tokens
- Semantic ranking:        200,000 tokens
- TOTAL:                   450,000 tokens ❌ EXCEEDS LIMIT

Code Execution MCP:
- Explore ./servers/:        1,000 tokens
- Load search.ts:            1,000 tokens
- Hybrid search (local):     (local, 0 tokens)
- Rank locally:              (local, 0 tokens)
- Return top 10:             5,000 tokens
- TOTAL:                     7,000 tokens ✅ 98.4% reduction

Overall Budget Impact

- 200K token budget: Without code execution:
  - Tools: 50K (25%)
  - Operations: 150K+ (often exceeds budget)
  - Usable budget: ~50K
- With code execution:
  - Tools: 0K upfront (loaded on-demand)
  - Operations: 2-10K per operation
  - Usable budget: ~190K
- Result: 3.8x more effective budget

---

## Privacy & Security Benefits

### Auto-Tokenization Patterns

Email addresses:
- Before: "Contact john.doe@company.com for details"
- After:  "Contact <EMAIL_1> for details"

IP addresses:
- Before: "Server 192.168.1.50 is down"
- After:  "Server <IP_1> is down"

Phone numbers:
- Before: "Call 555-123-4567"
- After:  "Call <PHONE_1>"

### Token Mapping

Tokenization maintains referential integrity:

```typescript
const tokenMap = {
  '<EMAIL_1>': 'john.doe@company.com',
  '<EMAIL_2>': 'jane.smith@company.com',
  '<IP_1>': '192.168.1.50'
}

// Model operates on tokenized data
// Original data never exposed
// De-tokenize only when presenting to authorized user
```

### Compliance Benefits

GDPR/PII:
- Personal data not exposed to model
- Audit trail for data access
- Automatic masking reduces risk

Enterprise Security:
- Sensitive IPs/credentials masked
- Internal systems not exposed
- Reduced attack surface

---

## Testing Strategy

### Unit Tests

Each tool must have:

```typescript
describe('searchIssues', () => {
  it('should return filtered results', async () => {
    const results = await searchIssues({ 
      query: 'bug', 
      status: 'open' 
    })
    expect(results.every(i => i.status === 'open')).toBe(true)
  })
  
  it('should tokenize sensitive data', async () => {
    const results = await searchIssues({ query: 'email' })
    const hasRawEmail = results.some(i => 
      i.description.includes('@')
    )
    expect(hasRawEmail).toBe(false)
  })
})
```

### Integration Tests

Test complete workflows:

```typescript
describe('Issue Management Workflow', () => {
  it('should create, search, filter, and update', async () => {
    // Create issue
    const created = await createIssue({ title: 'Test Bug' })
    
    // Search for it
    const found = await searchIssues({ query: 'Test Bug' })
    expect(found).toHaveLength(1)
    
    // Filter by status
    const open = found.filter(i => i.status === 'open')
    expect(open).toHaveLength(1)
    
    // Update status
    await updateIssue(created.id, { status: 'closed' })
    
    // Verify
    const closed = await searchIssues({ 
      query: 'Test Bug', 
      status: 'closed' 
    })
    expect(closed).toHaveLength(1)
  })
})
```

### Performance Tests

Benchmark token usage:

```typescript
describe('Token Efficiency', () => {
  it('should use < 5K tokens for search + filter', async () => {
    const startTokens = getCurrentTokenCount()
    
    await searchIssues({ query: 'bug' })
    // Filter happens locally
    
    const endTokens = getCurrentTokenCount()
    const used = endTokens - startTokens
    
    expect(used).toBeLessThan(5000)
  })
})
```

---

## Migration from Traditional MCP

### Current State

- 9 MCP servers using traditional approach:
  - memory, filesystem, git, gitkraken, postgres, playwright, docker, sequential-thinking

### Keep as-is (no migration needed):
- These work fine for current workflow
- Low tool count per server
- Simple request-response patterns

### ProjectPulse MCP Server
- Start with code execution
- Designed from scratch for code execution
- No migration complexity
- Reference implementation for future servers

### Future Enhancement

Evaluate wrapping existing servers:
- postgres: Could benefit (large query results)
- git: Probably not (simple operations)
- filesystem: Maybe (large file reads)

Hybrid approach possible:
- Keep simple tools in traditional MCP
- Wrap complex operations in code execution layer

---

## Success Metrics

### Token Efficiency
- Target: 95%+ reduction vs traditional MCP
- Measure: Average tokens per operation
- Goal: < 10K tokens per complex workflow

### Tool Scalability
- Target: 25+ tools without context bloat
- Measure: Upfront token cost
- Goal: 0 tokens (on-demand loading)

### Privacy Coverage
- Target: All PII patterns detected
- Measure: % of sensitive data tokenized
- Goal: 100% auto-tokenization

### Developer Experience
- Target: Intuitive tool discovery
- Measure: Time to find and use tool
- Goal: < 30 seconds

### Performance
- Target: Fast execution
- Measure: Tool call latency
- Goal: < 500ms per operation

---

## Risks & Mitigation

1) Learning Curve
- Risk: Agents unfamiliar with filesystem exploration
- Impact: Medium
- Mitigation: Clear documentation and examples; helper utilities; gradual rollout

2) Code Execution Security
- Risk: Arbitrary code execution concerns
- Impact: High
- Mitigation: Sandboxed execution environment; input validation and sanitization; rate limiting and timeouts

3) Debugging Complexity
- Risk: Harder to debug code execution vs direct tool calls
- Impact: Medium
- Mitigation: Comprehensive logging; error messages with stack traces; verbose dev mode

4) Performance Overhead
- Risk: Code execution adds latency
- Impact: Low
- Mitigation: Benchmark early; optimize hot paths; caching for frequent operations

---

## Contingency Planning & Multi-Client Architecture

### Critical Requirement: Client-Agnostic Design

**Problem**: ProjectPulse MCP server will be used by multiple AI agents, not just Claude Code:
- Claude Code (Anthropic agents)
- GPT-based agents (OpenAI)
- Gemini (Google AI)
- Other MCP-compliant tools
- Human developers via CLI

**Requirement**: All clients must have equal functionality regardless of code execution support.

**Solution**: Dual-mode MCP server that adapts to client capabilities.

---

### Dual-Mode Architecture

```
┌─────────────────────────────────────────────┐
│ ProjectPulse MCP Server                     │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Mode 1: Traditional MCP (stdio)         │ │
│ │  - 25+ tools as function calls          │ │
│ │  - Works with: ALL MCP clients          │ │
│ │  - Optimizations: Pagination, streaming │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Mode 2: Code Execution MCP (optional)   │ │
│ │  - Tools as filesystem modules          │ │
│ │  - Works with: Claude Code (if supported)│ │
│ │  - Optimizations: Local processing      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Shared Layer                            │ │
│ │  - Business logic (Prisma, validation)  │ │
│ │  - Database operations                  │ │
│ │  - Privacy tokenization                 │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Design Principle**: Same functionality, different delivery mechanisms.

---

### Client Capability Detection

**MCP Protocol Negotiation**:

```typescript
// Server declares both capabilities
const server = new MCPServer({
  capabilities: {
    tools: true,              // Traditional MCP
    codeExecution: true,      // Code execution (if supported)
  }
});

// Client declares what it supports
client.connect({
  supports: {
    codeExecution: false,  // GPT doesn't support this
  }
});

// Server adapts
if (client.supports.codeExecution) {
  // Use filesystem-based tool exposure
} else {
  // Use traditional function calls
}
```

**Fallback Logic**:
1. Client connects → Server checks capabilities
2. Code execution supported? → Expose filesystem interface
3. Code execution NOT supported? → Use traditional tools
4. No difference in functionality, only in efficiency

---

### Implementation Paths

#### Path A: Code Execution Works (Ideal)

**Trigger**: Week 5 POC succeeds + Claude Code supports it

**Implementation**:
1. Build dual-mode server (Weeks 5-8)
2. Traditional MCP as baseline
3. Code execution as enhancement layer
4. Test with multiple clients (Claude, GPT, Gemini)

**Result**:
- Claude Code: 98% token reduction
- GPT/Gemini: Traditional MCP (still works)
- All clients: Same functionality

---

#### Path B: Code Execution Fails (Fallback)

**Triggers**:
- Week 5 POC shows code execution doesn't work as expected
- Claude Code doesn't support it yet
- Too many technical challenges
- Security concerns can't be resolved

**Implementation**:
1. Traditional MCP only (Weeks 5-8)
2. Optimize traditional approach:
   - Pagination for large datasets
   - Streaming for search results
   - Server-side filtering
   - Response compression
3. Still achieve 50-70% token reduction (vs 98%)

**Result**:
- All clients: Traditional MCP
- Token savings: 50-70% (still significant)
- No client discrimination

---

#### Path C: Hybrid Approach (Pragmatic)

**Trigger**: Code execution works but has limitations

**Implementation**:
1. Simple tools → Traditional MCP
   - create-issue, update-issue, get-issue
   - Fast, low-overhead operations

2. Complex tools → Code execution (Claude Code only)
   - search-knowledge (1000+ results)
   - semantic-search (large embeddings)
   - bulk-operations (batch processing)

**Result**:
- Claude Code: Best experience (both modes)
- GPT/Gemini: Good experience (simple tools work)
- Complex operations: Client-specific optimization

---

### Traditional MCP Optimization Strategy

**If code execution not available**, optimize traditional MCP:

**1. Pagination**
```typescript
// Instead of returning 1000 issues
search_issues(query) → [1000 issues] // 200K tokens ❌

// Return paginated
search_issues(query, page=1, limit=20) → [20 issues] // 5K tokens ✅
```

**2. Server-Side Filtering**
```typescript
// Server does the filtering
search_issues({
  query: 'bug',
  status: 'open',
  priority: 'high',
  limit: 10
}) → [10 filtered issues] // 2K tokens ✅
```

**3. Response Compression**
```typescript
// Return summaries instead of full objects
search_issues_summary({
  query: 'bug'
}) → [
  { id: 1, title: '...', priority: 'high' },
  // No description, comments, attachments
] // 1K tokens vs 50K ✅
```

**4. Streaming**
```typescript
// Stream results as they're found
for await (const issue of searchIssues('bug')) {
  // Client processes incrementally
  // Can stop early if enough results
}
```

**Token Savings with Traditional Optimization**: 50-70% (vs 98% with code execution)

---

### Week 5 Checkpoint: Go/No-Go Decision

**Evaluation Criteria**:

| Criterion | Go (Code Execution) | No-Go (Traditional) |
|-----------|---------------------|---------------------|
| Claude Code Support | ✅ Verified working | ❌ Not supported yet |
| Token Reduction | ✅ >90% on POC | ❌ <70% |
| Debugging Difficulty | ✅ Manageable | ❌ Too complex |
| Multi-Client Support | ✅ Dual-mode works | ❌ Claude-only |
| Security | ✅ Sandboxed safely | ❌ Unresolved concerns |
| Performance | ✅ <500ms latency | ❌ >1s latency |

**Decision Matrix**:

- **All ✅**: Proceed with dual-mode (Path A)
- **Mixed ✅❌**: Hybrid approach (Path C)
- **Mostly ❌**: Traditional MCP only (Path B)

**Deliverable**: Week 5 POC Report documenting:
1. 3 tools implemented (create, search, filter)
2. Token benchmarks (actual vs expected)
3. Client compatibility test results
4. Recommendation: Path A, B, or C

---

### Multi-Client Testing Strategy

**Week 5 POC Must Test**:

1. **Claude Code** (primary)
   - Code execution interface
   - Token usage measurement
   - Debugging experience

2. **Mock GPT Client** (secondary)
   - Traditional MCP interface
   - Same functionality verification
   - Performance comparison

3. **CLI Tool** (tertiary)
   - Developer experience
   - Direct tool invocation
   - Response validation

**Success Criteria**: All three clients can create, search, and filter issues with same results.

---

### Implementation Timeline Adjustments

**Original Timeline** (4 weeks):
- Week 5: POC + 3 tools
- Weeks 6-7: 11 tools + privacy
- Week 8: Personas

**Adjusted Timeline if Path B** (Traditional MCP):
- Week 5: POC + 3 tools (traditional)
- Weeks 6-7: 11 tools + optimization (pagination, filtering)
- Week 8: Testing + multi-client validation

**Adjusted Timeline if Path C** (Hybrid):
- Week 5: POC + dual-mode infrastructure
- Weeks 6-7: Simple tools (traditional) + Complex tools (code exec)
- Week 8: Client detection + fallback logic

---

### Success Metrics (Revised)

**Non-Negotiable**:
- ✅ All MCP clients can use all 25+ tools
- ✅ Functionality identical across clients
- ✅ No vendor lock-in (Claude-only features)

**Path-Dependent**:
- Path A: 90-98% token reduction (Claude Code)
- Path B: 50-70% token reduction (all clients)
- Path C: 50-98% token reduction (client-dependent)

**Quality Gates**:
- Response time <500ms (all paths)
- Test coverage >80% (all paths)
- Privacy tokenization 100% (all paths)

---

### Risk Updates

**New Risk #5: Client Discrimination**

- **Risk**: Code execution only works with Claude Code, creating two-tier system
- **Impact**: HIGH (violates multi-client requirement)
- **Mitigation**: Dual-mode architecture ensures all clients get full functionality
- **Fallback**: Traditional MCP baseline guarantees equality

**Updated Risk #1: Learning Curve**

- **Original**: Agents unfamiliar with filesystem exploration
- **Updated**: Non-Anthropic agents may not support code execution at all
- **Mitigation**: Traditional MCP ensures all agents can use the server

---

### Recommended Approach

**Sprint 2 Implementation Plan**:

1. **Week 5**: Build dual-mode infrastructure
   - Implement 3 tools in BOTH modes
   - Test with multiple clients
   - Measure token efficiency for each mode
   - Go/No-Go decision at week end

2. **Weeks 6-7**: Based on Week 5 decision
   - Path A: Scale dual-mode to 14 tools
   - Path B: Traditional only, optimize aggressively
   - Path C: Split tools by complexity

3. **Week 8**: Multi-client validation
   - Test all clients (Claude, GPT, Gemini)
   - Verify functionality parity
   - Document client-specific optimizations

**Outcome**: Regardless of path, all clients have equal access to ProjectPulse functionality.

---

## References

- Code Execution with MCP - Anthropic Blog: https://www.anthropic.com/engineering/code-execution-with-mcp
- MCP Specification: https://modelcontextprotocol.io
- ProjectPulse Architecture: ../../03-Architecture.md
- ProjectPulse MCP Tools Guide: ../../../.agent/system/mcp-tools-guide.md

Next Steps: Review and approve this design, then proceed with Sprint 2 implementation.
