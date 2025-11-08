Code Execution with MCP - Documentation Update Plan
For GPT to execute - saves Claude Code tokens for implementation
Plan Overview
Update ProjectPulse documentation to integrate code execution with MCP approach, positioning it as a strategic enhancement for Sprint 2 MCP server implementation.
1. Update .agent/tech-context.md
Location: Section "MCP Tools" (current line ~120-150) What to Add:
A. New Subsection: "Code Execution Approach (Future Enhancement)"
### Code Execution with MCP (Planned for Sprint 2)

**Traditional MCP** (current usage):
- All tool definitions loaded upfront in every session
- Results pass through model context window
- Token cost scales with number of tools

**Code Execution MCP** (planned enhancement):
- Tools exposed as code APIs via filesystem structure
- On-demand tool discovery (explore `./servers/`)
- Local data processing before returning to model
- Token savings: up to 98.7% reduction on tool operations

**Benefits for ProjectPulse**:
- Scale to 25+ tools without context bloat
- Efficient search/filter operations (local processing)
- Better privacy (sensitive data tokenization)
- Complex workflows with loops/conditionals

**Implementation Timeline**:
- Sprint 2: Design ProjectPulse MCP server with code execution
- Sprint 3: Implement agent persona tool discovery
- Future: Evaluate wrapping existing MCP servers

**Reference**: [Code Execution with MCP - Anthropic Blog](https://www.anthropic.com/engineering/code-execution-with-mcp)
Where to Insert: After current MCP tools list, before "Current MCP Servers" section
2. Update .agent/system/mcp-tools-guide.md
Location: End of document (add new section) What to Add:
A. New Section: "Code Execution vs Traditional MCP"
## Code Execution vs Traditional MCP

### Traditional MCP (Current Usage)

**How it works**:
1. All tool definitions sent to model at session start
2. Model calls tools via function calling
3. Results return through context window
4. Repeat for each tool call

**Token costs**:
- Tool definitions: ~500-1000 tokens per tool
- Results: Full content passes through context
- 9 servers × average 10 tools = ~45K-90K tokens upfront

**Best for**:
- Small tool sets (<20 tools)
- Simple request-response patterns
- Immediate tool availability

### Code Execution MCP (Planned)

**How it works**:
1. Tools organized as filesystem structure (e.g., `./servers/projectpulse/`)
2. Agent explores directories to discover tools on-demand
3. Agent writes code that calls tools
4. Code executes locally, processes data, returns filtered results

**Token costs**:
- Tool definitions: Loaded only when needed
- Results: Filtered/processed before returning to model
- Example: 150K tokens → 2K tokens (98.7% reduction)

**Best for**:
- Large tool sets (25+ tools)
- Complex workflows with loops/filtering
- Privacy-sensitive operations
- Large dataset processing

### When to Use Each Approach

| Use Case | Traditional MCP | Code Execution MCP |
|----------|----------------|-------------------|
| Current development workflow | ✅ Current | Future enhancement |
| ProjectPulse MCP server (25+ tools) | ❌ Context bloat | ✅ Planned Sprint 2 |
| Simple CRUD operations | ✅ Fast | ⚠️ Overhead |
| Search/filter large datasets | ❌ Token heavy | ✅ Efficient |
| Agent personas (specialized tools) | ❌ Load all tools | ✅ Load subset |
| Privacy-sensitive data | ⚠️ Manual handling | ✅ Auto-tokenization |

### Implementation Roadmap

**Sprint 1** (Current):
- Continue using traditional MCP (9 servers)
- Focus on ProjectPulse core features

**Sprint 2** (MCP Server Design):
- Design ProjectPulse MCP server with code execution approach
- Organize tools: `./servers/projectpulse/{issues,knowledge,agents}/`
- Plan agent persona tool discovery patterns

**Sprint 3** (MCP Integration):
- Implement code execution environment
- Build on-demand tool loading
- Add local filtering for search operations

**Future Optimization**:
- Evaluate wrapping existing servers (postgres, git, filesystem)
- Implement hybrid approach (traditional for simple, code exec for complex)

### Example: Traditional vs Code Execution

**Scenario**: Search 10,000 issues for keyword, filter by status, return top 10

**Traditional MCP**:
Load all tools (~50K tokens)
Call search-issues → returns 10K issues (200K tokens)
Model processes in context
Call filter-issues → passes 200K tokens again
Returns top 10 Total: ~450K tokens (exceeds context limit!)

**Code Execution MCP**:
Explore ./servers/projectpulse/issues/
Load search.ts and filter.ts (~2K tokens)
Execute code: const results = await search('keyword') const filtered = results.filter(i => i.status === 'open') return filtered.slice(0, 10)
Return 10 issues (2K tokens) Total: ~4K tokens (99% reduction!)

### References

- [Code Execution with MCP - Anthropic Blog](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [MCP Specification](https://modelcontextprotocol.io)
- ProjectPulse MCP Architecture: [docs/03-Architecture.md](../../docs/03-Architecture.md)
3. Update docs/03-Architecture.md
Location: Section "4.3 MCP Server Architecture" (approximately line 250-300) What to Update:
A. Replace/Enhance Current MCP Server Section
Current text (to be enhanced):
The MCP server provides tools, resources, and prompts via stdio...
New text:
### 4.3 MCP Server Architecture

**Implementation Approach**: Code Execution with MCP

The ProjectPulse MCP server uses the **code execution approach** for maximum efficiency with our 25+ tool ecosystem.

#### Traditional vs Code Execution MCP

| Aspect | Traditional MCP | Code Execution MCP (Our Choice) |
|--------|----------------|----------------------------------|
| Tool Loading | All upfront | On-demand discovery |
| Token Cost | ~50K+ for 25 tools | ~2-5K per operation |
| Data Processing | Through context | Local execution |
| Scalability | Limited (~20 tools) | Thousands of tools |
| Privacy | Manual handling | Auto-tokenization |

**Why Code Execution for ProjectPulse**:
1. **25+ tools**: Would consume 50K+ tokens upfront with traditional MCP
2. **Search operations**: Knowledge base search could return 100K+ tokens
3. **Agent personas**: Each persona needs different tool subsets
4. **Privacy**: Issue content may be sensitive

#### Filesystem-Based Tool Organization

Tools organized as importable TypeScript modules:

./servers/projectpulse/ ├── issues/ │ ├── create.ts │ ├── update.ts │ ├── search.ts │ └── filter.ts ├── knowledge/ │ ├── search.ts │ ├── embed.ts │ └── retrieve.ts ├── agents/ │ ├── personas.ts │ └── activate.ts └── projects/ ├── context.ts └── status.ts

**Agent Discovery Pattern**:
```typescript
// Agent explores filesystem
const tools = await listDirectory('./servers/projectpulse/issues/')
// Loads only needed tools
import { search } from './servers/projectpulse/issues/search.ts'
// Executes with local processing
const results = await search(query).filter(i => i.status === 'open')
Tool Categories (25+ planned)
Issue Management (stdio tools):
create-issue, update-issue, delete-issue
search-issues, filter-issues, sort-issues
add-comment, add-attachment
update-status, assign-issue
Knowledge Base (code execution critical):
search-knowledge - Hybrid search (returns large results)
create-article, update-article
semantic-search - pgvector operations
full-text-search - PostgreSQL tsvector
Project Context (resources):
project-context - Current project state
active-issues - Issues in progress
team-members - Team roster
Agent Personas (prompts):
architect-persona - Architecture decisions
fullstack-persona - Implementation
testing-persona - Test creation
Code Execution Benefits
Example: Knowledge base search Traditional approach:
1. Load all tools (50K tokens)
2. Search returns 500 articles (150K tokens)
3. Filter in model context (150K tokens again)
4. Rank and return top 10
Total: ~350K tokens
Code execution approach:
1. Explore ./servers/projectpulse/knowledge/
2. Load search.ts (1K tokens)
3. Execute locally:
   const articles = await searchKnowledge(query)
   const filtered = filterByRelevance(articles, threshold)
   return filtered.slice(0, 10)
4. Return 10 articles (5K tokens)
Total: ~6K tokens (98% reduction)
Privacy & Security
Auto-tokenization:
Issue content preprocessed before model sees it
Sensitive fields (emails, IPs) automatically masked
Model receives tokenized references
Example:
// In code execution environment
const issue = await getIssue(123)
const tokenized = tokenizeSensitiveData(issue)
// Model sees: "User <USER_1> reported <IP_1> timeout"
// Not: "User john@company.com reported 192.168.1.50 timeout"
Implementation Timeline
Sprint 2 (Weeks 5-8):
Design filesystem structure
Implement core tool wrappers
Build on-demand discovery
Test with issue management tools
Sprint 3 (Weeks 9-12):
Add knowledge base tools with local filtering
Implement agent persona tool subsets
Add auto-tokenization for privacy
Performance testing and optimization
Sprint 4 (Weeks 13-16):
Complete tool suite (25+ tools)
Advanced workflows (loops, error handling)
Documentation and examples
Integration testing
MCP Protocol Integration
Under the hood:
Code execution environment wraps MCP stdio calls
Tools appear as TypeScript functions
MCP client handles protocol communication
Seamless integration with Claude Code
// Agent writes standard TypeScript
import { createIssue } from './servers/projectpulse/issues/create.ts'

const issue = await createIssue({
  title: "Bug in search",
  description: "Search fails on special characters",
  priority: "high"
})
// MCP client translates to stdio call automatically
Benefits:
Familiar developer experience (standard code)
MCP protocol abstracted away
Type safety with TypeScript
IDE autocomplete support
References
Code Execution with MCP - Anthropic Blog
MCP Specification
ProjectPulse MCP Tools: .agent/system/mcp-tools-guide.md

---

## 4. Create New Design Document

**File**: `docs/archive/plans/mcp-code-execution-design.md`

**Content**:

```markdown
# MCP Code Execution Implementation Design

**Status**: Planning
**Sprint**: Sprint 2 (Weeks 5-8)
**Last Updated**: 2025-11-09

---

## Executive Summary

ProjectPulse will implement the **code execution approach** for its MCP server to achieve:
- **98.7% token reduction** on tool operations
- **25+ tools** without context bloat
- **Privacy-preserving** data processing
- **Scalable** architecture for future growth

---

## Problem Statement

### Current MCP Limitations

**Traditional MCP** (used by our 9 current servers):
1. **Tool Definition Overload**: All 25+ tools loaded upfront = 50K+ tokens
2. **Context Window Bloat**: Search results (100K+ tokens) pass through model
3. **No Local Processing**: Filtering/sorting happens in model context
4. **Privacy Challenges**: Sensitive data exposed to model

### Our Specific Challenges

**ProjectPulse requirements**:
- 25+ MCP tools across 4 categories (issues, knowledge, projects, agents)
- Knowledge base search returning 100-500 articles
- Agent personas needing different tool subsets
- Issue content potentially sensitive (emails, IPs, customer data)

**Token budget constraints**:
- 200K token limit per session
- 50K tokens for tool definitions = 25% of budget gone
- Large search results could exceed limits entirely

---

## Solution: Code Execution with MCP

### How It Works

**1. Filesystem-Based Tool Organization**

./servers/projectpulse/ ├── issues/ │ ├── create.ts # Tool: Create issue │ ├── search.ts # Tool: Search issues (returns large datasets) │ └── filter.ts # Tool: Filter locally ├── knowledge/ │ ├── search.ts # Tool: Hybrid search │ └── embed.ts # Tool: Generate embeddings └── agents/ └── personas.ts # Tool: Load persona prompts

**2. On-Demand Discovery**

Instead of loading all tools:
```typescript
// Agent explores available tools
const issueTools = await listDirectory('./servers/projectpulse/issues/')
// Returns: ['create.ts', 'search.ts', 'filter.ts']

// Loads only what's needed
import { search } from './servers/projectpulse/issues/search.ts'
3. Local Execution Data processing happens in code execution environment:
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
Model only sees 10 issues, not 500!
Architecture Design
Component Overview
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
Tool Wrapper Pattern
Each tool is a TypeScript module that wraps MCP calls:
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

// Agent uses it like a normal async function
Discovery Mechanism
Agents discover tools via filesystem exploration:
// Agent code (written by Claude Code)
const availableCategories = await readDirectory('./servers/projectpulse/')
// Returns: ['issues', 'knowledge', 'agents', 'projects']

const issueTools = await readDirectory('./servers/projectpulse/issues/')
// Returns: ['create.ts', 'search.ts', 'filter.ts', 'update.ts']

// Load specific tool
const { searchIssues } = await import('./servers/projectpulse/issues/search.ts')
Benefits:
Only 1-2K tokens for directory listing
Load definitions on-demand (not upfront)
Self-documenting structure
Privacy Layer: Auto-Tokenization
Sensitive data masked before reaching model:
// ./servers/projectpulse/privacy/tokenize.ts

const sensitivePatterns = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g
}

export function tokenizeIssue(issue) {
  let content = issue.description
  
  // Replace emails
  content = content.replace(sensitivePatterns.email, '<EMAIL_TOKEN>')
  
  // Replace IPs
  content = content.replace(sensitivePatterns.ip, '<IP_TOKEN>')
  
  return { ...issue, description: content }
}
Usage in tool:
// search.ts
import { tokenizeIssue } from '../privacy/tokenize'

export async function searchIssues(options) {
  const results = await mcpClient.callTool('search-issues', options)
  
  // Tokenize before returning to model
  return results.map(tokenizeIssue)
}
Implementation Plan
Phase 1: Foundation (Sprint 2, Week 5)
Goals:
Set up code execution environment
Create filesystem structure
Implement 3 proof-of-concept tools
Tasks:
Install code execution MCP dependencies
Create ./servers/projectpulse/ structure
Implement basic tools:
issues/create.ts
issues/search.ts
issues/filter.ts
Test on-demand loading
Benchmark token usage
Success Criteria:
Agent can discover and load tools
Create + search + filter workflow works
Token usage < 5K for full operation
Phase 2: Core Tools (Sprint 2, Weeks 6-7)
Goals:
Implement issue management suite (10 tools)
Add local processing capabilities
Implement basic privacy layer
Tasks:
Complete issue tools (update, delete, comment, etc.)
Add filtering/sorting utilities
Implement auto-tokenization
Create knowledge base tools (search, retrieve)
Test complex workflows (loops, error handling)
Success Criteria:
All CRUD operations work
Search + filter + sort in single operation
Sensitive data properly tokenized
Phase 3: Agent Personas (Sprint 2, Week 8)
Goals:
Implement persona-based tool discovery
Create agent-specific tool subsets
Test with specialized agents
Tasks:
Create persona definitions
Map personas to tool subsets
Implement agents/personas.ts
Test with architect/fullstack/testing personas
Success Criteria:
Each persona loads only relevant tools
Token overhead < 3K per persona activation
Phase 4: Knowledge Base (Sprint 3, Weeks 9-10)
Goals:
Implement knowledge base tools
Add hybrid search (full-text + semantic)
Optimize for large result sets
Tasks:
Create knowledge/search.ts with local filtering
Implement semantic search with embeddings
Add relevance ranking
Test with 1000+ article dataset
Success Criteria:
Search 1000 articles, return top 10
Token usage < 10K (vs 200K+ traditional)
Phase 5: Complete Tool Suite (Sprint 3, Weeks 11-12)
Goals:
Reach 25+ total tools
Complete privacy layer
Performance optimization
Tasks:
Add remaining tools (projects, team, etc.)
Implement comprehensive tokenization
Add caching layer for frequent operations
Performance benchmarking
Success Criteria:
25+ tools available
Average operation < 5K tokens
Privacy layer covers all sensitive patterns
Phase 6: Testing & Documentation (Sprint 4)
Goals:
Comprehensive testing
Documentation and examples
Integration with Claude Code
Tasks:
Unit tests for all tools
Integration tests for workflows
Create usage examples
Update MCP server documentation
Success Criteria:
90%+ test coverage
All workflows documented
Ready for production use
Token Efficiency Analysis
Scenario: Search and Filter Issues
Traditional MCP:
Load tools:               50,000 tokens
Search (500 results):    150,000 tokens
Filter in context:       150,000 tokens
Return results:            5,000 tokens
─────────────────────────────────────
TOTAL:                   355,000 tokens ❌ EXCEEDS LIMIT
Code Execution MCP:
Explore ./servers/:        1,000 tokens
Load search.ts:            1,000 tokens
Execute + filter:          (local, 0 tokens)
Return 10 results:         2,000 tokens
─────────────────────────────────────
TOTAL:                     4,000 tokens ✅ 98.9% reduction
Scenario: Knowledge Base Search
Traditional MCP:
Load tools:               50,000 tokens
Hybrid search (1000):    200,000 tokens
Semantic ranking:        200,000 tokens
─────────────────────────────────────
TOTAL:                   450,000 tokens ❌ EXCEEDS LIMIT
Code Execution MCP:
Explore ./servers/:        1,000 tokens
Load search.ts:            1,000 tokens
Hybrid search (local):     (local, 0 tokens)
Rank locally:              (local, 0 tokens)
Return top 10:             5,000 tokens
─────────────────────────────────────
TOTAL:                     7,000 tokens ✅ 98.4% reduction
Overall Budget Impact
200K token budget: Without code execution:
Tools: 50K (25%)
Operations: 150K+ (often exceeds budget)
Usable budget: ~50K
With code execution:
Tools: 0K upfront (loaded on-demand)
Operations: 2-10K per operation
Usable budget: ~190K
Result: 3.8x more effective budget
Privacy & Security Benefits
Auto-Tokenization Patterns
Email addresses:
Before: "Contact john.doe@company.com for details"
After:  "Contact <EMAIL_1> for details"
IP addresses:
Before: "Server 192.168.1.50 is down"
After:  "Server <IP_1> is down"
Phone numbers:
Before: "Call 555-123-4567"
After:  "Call <PHONE_1>"
Token Mapping
Tokenization maintains referential integrity:
const tokenMap = {
  '<EMAIL_1>': 'john.doe@company.com',
  '<EMAIL_2>': 'jane.smith@company.com',
  '<IP_1>': '192.168.1.50'
}

// Model operates on tokenized data
// Original data never exposed
// De-tokenize only when presenting to authorized user
Compliance Benefits
GDPR/PII:
Personal data not exposed to model
Audit trail for data access
Automatic masking reduces risk
Enterprise Security:
Sensitive IPs/credentials masked
Internal systems not exposed
Reduced attack surface
Testing Strategy
Unit Tests
Each tool must have:
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
Integration Tests
Test complete workflows:
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
Performance Tests
Benchmark token usage:
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
Migration from Traditional MCP
Current State
9 MCP servers using traditional approach:
memory, filesystem, git, gitkraken, postgres, playwright, docker, sequential-thinking
Keep as-is (no migration needed):
These work fine for current workflow
Low tool count per server
Simple request-response patterns
ProjectPulse MCP Server
Start with code execution:
Designed from scratch for code execution
No migration complexity
Reference implementation for future servers
Future Enhancement
Evaluate wrapping existing servers:
postgres: Could benefit (large query results)
git: Probably not (simple operations)
filesystem: Maybe (large file reads)
Hybrid approach possible:
Keep simple tools in traditional MCP
Wrap complex operations in code execution layer
Success Metrics
Token Efficiency
Target: 95%+ reduction vs traditional MCP
Measure: Average tokens per operation
Goal: < 10K tokens per complex workflow
Tool Scalability
Target: 25+ tools without context bloat
Measure: Upfront token cost
Goal: 0 tokens (on-demand loading)
Privacy Coverage
Target: All PII patterns detected
Measure: % of sensitive data tokenized
Goal: 100% auto-tokenization
Developer Experience
Target: Intuitive tool discovery
Measure: Time to find and use tool
Goal: < 30 seconds
Performance
Target: Fast execution
Measure: Tool call latency
Goal: < 500ms per operation
Risks & Mitigation
Risk 1: Learning Curve
Risk: Agents unfamiliar with filesystem exploration Impact: Medium Mitigation:
Clear documentation and examples
Helper utilities for common patterns
Gradual rollout (start with simple tools)
Risk 2: Code Execution Security
Risk: Arbitrary code execution concerns Impact: High Mitigation:
Sandboxed execution environment
Input validation and sanitization
Rate limiting and timeout controls
Risk 3: Debugging Complexity
Risk: Harder to debug code execution vs direct tool calls Impact: Medium Mitigation:
Comprehensive logging
Error messages with stack traces
Development mode with verbose output
Risk 4: Performance Overhead
Risk: Code execution adds latency Impact: Low Mitigation:
Benchmark early and often
Optimize hot paths
Caching for frequent operations
References
Code Execution with MCP - Anthropic Blog
MCP Specification
ProjectPulse Architecture: docs/03-Architecture.md
ProjectPulse MCP Tools: .agent/system/mcp-tools-guide.md
Next Steps: Review and approve this design, then proceed with Sprint 2 implementation.

---

## 5. Update Sprint 2 Plan in `docs/13-Project-Plan.md`

**Location**: Sprint 2 section (around line 150-200)

**What to Add**:

Add to Sprint 2 tasks:

```markdown
### Sprint 2: MCP Server Implementation (Weeks 5-8)

**Phase Goal**: Build ProjectPulse MCP server with code execution approach

**New Tasks**:

#### Week 5: Code Execution Foundation
- [ ] Set up code execution environment
- [ ] Create `./servers/projectpulse/` filesystem structure
- [ ] Implement 3 proof-of-concept tools (create, search, filter)
- [ ] Test on-demand tool discovery
- [ ] Benchmark token usage (target: < 5K per operation)

#### Week 6-7: Core Tool Suite
- [ ] Complete issue management tools (10 tools total)
- [ ] Implement local filtering/sorting utilities
- [ ] Add auto-tokenization for privacy
- [ ] Create knowledge base search tools
- [ ] Test complex workflows (loops, error handling)

#### Week 8: Agent Persona Integration
- [ ] Implement persona-based tool discovery
- [ ] Map personas to tool subsets
- [ ] Test with architect/fullstack/testing personas
- [ ] Document code execution patterns

**Success Criteria**:
- ✅ 98%+ token reduction vs traditional MCP
- ✅ 10+ tools working with on-demand loading
- ✅ Sensitive data auto-tokenization working
- ✅ Agent personas loading correct tool subsets

**Reference**: [MCP Code Execution Design](../docs/archive/plans/mcp-code-execution-design.md)
6. Create Implementation Checklist
File: .agent/task/mcp-code-execution-checklist.md Content:
# MCP Code Execution Implementation Checklist

**Sprint**: Sprint 2 (Weeks 5-8)
**Status**: Planning

---

## Pre-Implementation

- [ ] Read [Code Execution with MCP blog](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [ ] Review updated architecture in [docs/03-Architecture.md](../../docs/03-Architecture.md)
- [ ] Study design document: [mcp-code-execution-design.md](../../docs/archive/plans/mcp-code-execution-design.md)
- [ ] Set up development environment

---

## Phase 1: Foundation (Week 5)

### Environment Setup
- [ ] Install code execution MCP dependencies
- [ ] Configure TypeScript for tool modules
- [ ] Set up MCP stdio server boilerplate
- [ ] Create filesystem structure

### Filesystem Structure
- [ ] Create `./servers/projectpulse/` directory
- [ ] Create subdirectories: `issues/`, `knowledge/`, `agents/`, `projects/`
- [ ] Create `client.ts` (MCP client wrapper)
- [ ] Create `types.ts` (TypeScript interfaces)

### Proof-of-Concept Tools (3 tools)
- [ ] Implement `issues/create.ts`
  - [ ] Write tool wrapper
  - [ ] Add TypeScript types
  - [ ] Test MCP stdio call
  - [ ] Document usage
  
- [ ] Implement `issues/search.ts`
  - [ ] Write tool wrapper
  - [ ] Add local filtering capability
  - [ ] Test with 100+ results
  - [ ] Verify token efficiency
  
- [ ] Implement `issues/filter.ts`
  - [ ] Implement filter logic (status, priority, dates)
  - [ ] Add sorting options
  - [ ] Test composability with search
  - [ ] Document filter patterns

### Testing & Validation
- [ ] Test on-demand tool discovery
- [ ] Benchmark token usage (target: < 5K)
- [ ] Compare vs traditional MCP approach
- [ ] Document findings

### Week 5 Deliverables
- [ ] Working code execution environment
- [ ] 3 tools functional
- [ ] Token benchmark report
- [ ] Progress update in session file

---

## Phase 2: Core Tools (Weeks 6-7)

### Issue Management Suite (7 additional tools)
- [ ] `issues/update.ts` - Update issue fields
- [ ] `issues/delete.ts` - Delete issue
- [ ] `issues/get.ts` - Get single issue
- [ ] `issues/list.ts` - List all issues
- [ ] `issues/comment.ts` - Add comment
- [ ] `issues/assign.ts` - Assign to user
- [ ] `issues/status.ts` - Update status

### Utilities
- [ ] Create `utils/filter.ts` - Common filter functions
- [ ] Create `utils/sort.ts` - Common sort functions
- [ ] Create `utils/paginate.ts` - Pagination helpers
- [ ] Create `utils/validate.ts` - Input validation

### Privacy Layer
- [ ] Create `privacy/tokenize.ts`
  - [ ] Email pattern detection
  - [ ] IP address pattern detection
  - [ ] Phone number pattern detection
  - [ ] Custom pattern support
  
- [ ] Create `privacy/detokenize.ts`
  - [ ] Maintain token mapping
  - [ ] Secure storage
  - [ ] Authorized access only

- [ ] Integrate tokenization into all tools
- [ ] Test privacy coverage

### Knowledge Base Tools (4 tools)
- [ ] `knowledge/search.ts` - Hybrid search
- [ ] `knowledge/retrieve.ts` - Get article
- [ ] `knowledge/create.ts` - Create article
- [ ] `knowledge/update.ts` - Update article

### Testing
- [ ] Unit tests for all 14 tools
- [ ] Integration test: Create → Search → Filter → Update workflow
- [ ] Privacy test: Verify tokenization
- [ ] Performance test: Large dataset handling

### Week 6-7 Deliverables
- [ ] 14 tools functional (10 issues + 4 knowledge)
- [ ] Privacy layer working
- [ ] Test suite passing
- [ ] Progress update

---

## Phase 3: Agent Personas (Week 8)

### Persona Definitions
- [ ] Define architect persona tools
- [ ] Define fullstack persona tools
- [ ] Define testing persona tools
- [ ] Create persona configuration file

### Persona Tool Discovery
- [ ] Implement `agents/personas.ts`
  - [ ] Load persona definition
  - [ ] Map persona to tool subset
  - [ ] Return filtered tool list
  
- [ ] Create persona activation workflow
- [ ] Test each persona
- [ ] Benchmark token usage per persona

### Documentation
- [ ] Document persona usage patterns
- [ ] Create examples for each persona
- [ ] Update MCP tools guide
- [ ] Update architecture docs

### Week 8 Deliverables
- [ ] Persona system working
- [ ] All 3 personas tested
- [ ] Documentation complete
- [ ] Sprint 2 complete

---

## Post-Sprint 2

### Documentation
- [ ] Update [.agent/system/mcp-tools-guide.md](../../.agent/system/mcp-tools-guide.md)
- [ ] Update [docs/03-Architecture.md](../../docs/03-Architecture.md)
- [ ] Create usage examples
- [ ] Generate SOP with synthesize-docs

### Knowledge Capture
- [ ] Update Memory MCP with patterns learned
- [ ] Document lessons learned
- [ ] Identify optimization opportunities
- [ ] Plan Sprint 3 enhancements

---

## Success Criteria

- [ ] ✅ 98%+ token reduction achieved
- [ ] ✅ 14+ tools working
- [ ] ✅ On-demand loading functional
- [ ] ✅ Privacy layer covering all PII
- [ ] ✅ Agent personas loading correct subsets
- [ ] ✅ Test coverage > 80%
- [ ] ✅ Documentation complete

---

**Status tracking**: Update this file at each checkpoint per MANDATORY_SESSION_PROTOCOL.md Step 4