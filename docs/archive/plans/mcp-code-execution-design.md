# MCP Code Execution Implementation Design

Status: Planning
Sprint: Sprint 2 (Weeks 5-8)
Last Updated: 2025-11-09

---

## Executive Summary

ProjectPulse will implement the code execution approach for its MCP server to achieve:
- 98.7% token reduction on tool operations
- 41 tools without context bloat
- Privacy-preserving data processing
- Scalable architecture for future growth

---

## Problem Statement

### Current MCP Limitations

Traditional MCP (used by our current servers):
1. Tool Definition Overload: All 41 tools loaded upfront = 50K+ tokens
2. Context Window Bloat: Search results (100K+ tokens) pass through model
3. No Local Processing: Filtering/sorting happens in model context
4. Privacy Challenges: Sensitive data exposed to model

### Our Specific Challenges

ProjectPulse requirements:
- 41 MCP tools across categories (issues, knowledge, projects, agents)
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

### Privacy Tokenization - Complete Specification

Storage Architecture:

```typescript
// In-memory LRU cache with TTL
import LRU from 'lru-cache';

interface TokenMapping {
  token: string;
  originalValue: string;
  type: 'EMAIL' | 'IP' | 'PHONE' | 'SSN';
  createdAt: Date;
  sessionId: string;
}

class PrivacyService {
  private tokenMap: LRU<string, TokenMapping>;
  private counter: Map<string, number>;

  constructor() {
    this.tokenMap = new LRU({ max: 10000, ttl: 1000 * 60 * 60 }); // 1 hour TTL
    this.counter = new Map();
  }

  async tokenize(data: any): Promise<any> {
    if (typeof data === 'string') return this.tokenizeString(data);
    if (typeof data === 'object') return this.tokenizeObject(data);
    return data;
  }

  private tokenizeString(text: string): string {
    const email = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const ip = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
    const phone = /\b\d{3}-\d{3}-\d{4}\b/g;
    const ssn = /\b\d{3}-\d{2}-\d{4}\b/g;

    return text
      .replace(email, (m) => this.getOrCreateToken(m, 'EMAIL'))
      .replace(ip, (m) => this.getOrCreateToken(m, 'IP'))
      .replace(phone, (m) => this.getOrCreateToken(m, 'PHONE'))
      .replace(ssn, (m) => this.getOrCreateToken(m, 'SSN'));
  }

  private tokenizeObject(obj: any): any {
    const res: any = Array.isArray(obj) ? [] : {};
    for (const k in obj) {
      const v = (obj as any)[k];
      if (typeof v === 'string') res[k] = this.tokenizeString(v);
      else if (typeof v === 'object') res[k] = this.tokenizeObject(v);
      else res[k] = v;
    }
    return res;
  }

  private getOrCreateToken(value: string, type: TokenMapping['type']): string {
    for (const m of this.tokenMap.values()) {
      if (m.originalValue === value && m.type === type) return m.token;
    }
    const n = (this.counter.get(type) || 0) + 1;
    this.counter.set(type, n);
    const token = `<${type}_${n}>`;
    this.tokenMap.set(token, { token, originalValue: value, type, createdAt: new Date(), sessionId: this.getCurrentSessionId() });
    return token;
  }

  async detokenize(data: any, auth: AuthContext): Promise<any> {
    if (!auth.hasPermission('DETOKENIZE')) throw new Error('Unauthorized');
    await this.auditLog({ action: 'DETOKENIZE', user: auth.userId, timestamp: new Date() });
    if (typeof data === 'string') return this.detokenizeString(data);
    if (typeof data === 'object') return this.detokenizeObject(data);
    return data;
  }

  private detokenizeString(text: string): string {
    return text.replace(/<(EMAIL|IP|PHONE|SSN)_\d+>/g, (t) => this.tokenMap.get(t)?.originalValue || t);
  }

  private detokenizeObject(obj: any): any {
    const res: any = Array.isArray(obj) ? [] : {};
    for (const k in obj) {
      const v = (obj as any)[k];
      if (typeof v === 'string') res[k] = this.detokenizeString(v);
      else if (typeof v === 'object') res[k] = this.detokenizeObject(v);
      else res[k] = v;
    }
    return res;
  }

  private getCurrentSessionId(): string { return 'session-id'; }
  private async auditLog(event: any) { console.log('[AUDIT]', JSON.stringify(event)); }
}

interface AuthContext {
  userId: string;
  roles: string[];
  permissions: string[];
  hasPermission(permission: string): boolean;
}
```

Access Control and Security:
- Detokenization allowed only server-side with explicit permission
- Audit all detokenization events
- Tokens expire after 1 hour (session lifetime)
- Monotonic counters prevent collisions

---

## Implementation Plan

### Phase 1: Design + Traditional POC (Sprint 2, Week 5)

Goals:
- Deliver traditional MCP server POC with 3 tools (create-issue, search-issues, filter-issues)
- Design capability detection (negotiation attempt + env var) and implement detection stubs (probe)
- Define shared services interfaces; write privacy and sandbox specifications
- Design multi-client test harness; establish token usage baseline (traditional)

Tasks:
- Implement traditional adapter for 3 tools; no code-exec wrappers in Week 5
- Add `PP_MCP_MODE` env var and probe stub; cache mode per session
- Specify IssueService/PrivacyService/ValidationService interfaces
- Author Privacy Tokenization spec and Sandbox Security spec (docs only)
- Build mock traditional client + CLI tool; author parity tests (traditional)
- Add token measurement instrumentation (traditional only)

Success Criteria:
- All 3 clients (Claude, Mock GPT, CLI) use the 3 tools successfully
- Results identical across clients; parity tests pass
- Token savings measured baseline: 50–70% vs unoptimized
- Capability detection stub functional; privacy and sandbox specs complete

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
- Reach 41 tools (current scope)
- Complete privacy layer
- Performance optimization

Tasks:
- Add remaining tools (projects, team, etc.)
- Implement comprehensive tokenization
- Add caching layer for frequent operations
- Performance benchmarking

Success Criteria:
- 41 tools available
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

### Token Savings Measurement Methodology

Baseline (Week 5 traditional mode):

Test Corpus:
- 100 issues seeded; 10 queries; 5 filter combinations

Process:
```typescript
function measureTokens(op: string, input: any, output: any) {
  const inputTokens = countTokens(JSON.stringify(input));
  const outputTokens = countTokens(JSON.stringify(output));
  return { op, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens };
}
```

Benchmark Harness:
- Script: `scripts/benchmark-tokens.ts`
- Library: `tiktoken` (cl100k_base)
- Output: JSON results + summary

Expected Ranges:
- Traditional optimized: 50–70% vs unoptimized
- Code execution (Sprint 3): 90–98% vs unoptimized

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
- Target: 41 tools without context bloat (current scope; expandable)
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

### Code Execution Sandbox - Security Specification (Week 5: Spec Only)

Sandbox Requirements:
- CPU Limit: 500ms timeout per execution
- Memory Limit: 256MB max heap
- Filesystem: Read-only; allowed paths `./servers/projectpulse/`
- Network: Disabled by default
- Process Isolation: No access to parent process/system resources

Candidate Technologies:
- VM2 (mature); isolated-vm (preferred, V8 isolates); Deno sandbox (permissions model)

Security Boundaries:
- Whitelist-only imports
- No access to: `process`, `fs` (except allowed), `child_process`, `net`, `http`
- Input validation; output size limit 10MB

Threat Model:
- Malicious code injection; Resource exhaustion; Data exfiltration; FS traversal; Prototype pollution

---

## Risk Mitigation Strategies

### Risk Mitigation 1: Complexity Overhead

Strategy: Enforce shared services pattern

```typescript
// All adapters MUST use services
// NO direct Prisma calls in adapters/

// ✅ Correct
async function handler(input) {
  return await issueService.create(input);
}

// ❌ Wrong
async function handler(input) {
  return await prisma.issue.create({ data: input });
}
```

Automation:
- ESLint rule: Forbid imports of `@prisma/client` in `src/server/adapters/**`
- CI check: Verify all adapters import from `services/`
- Code review checklist: "Uses shared services?"

### Risk Mitigation 2: Code Divergence

Strategy: Automated parity testing

```typescript
// CI pipeline runs parity tests
describe('Parity Tests', () => {
  const tools = ['create-issue', 'search-issues', 'filter-issues'];
  test.each(tools)('%s parity', async (tool) => {
    const input = generateTestInput(tool);
    const trad = await traditionalAdapter.call(tool, input);
    const exec = await codeExecAdapter.call(tool, input); // Sprint 3
    expect(exec).toEqual(trad);
  });
});
```

CI Integration (example):

```yaml
# .github/workflows/parity.yml
name: Parity Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: corepack enable && pnpm i
      - run: pnpm test:parity
```

### Risk Mitigation 3: Security Surface

Strategy: Separate security audits per mode

- Traditional Mode: Input validation (Zod), SQL injection prevention (Prisma), privacy tokenization, rate limiting
- Code Execution Mode: Sandbox escape attempts, resource exhaustion tests, FS isolation verification, import whitelist enforcement

Schedule: Quarterly security reviews

### Risk Mitigation 4: Performance Variance

Strategy: SLA per mode with adaptive fallback

```typescript
const SLA = {
  traditional: { p95: 200, p99: 500 },
  codeExec: { p95: 300, p99: 800 },
};

// Monitor and auto-fallback
if (codeExecP95 > SLA.codeExec.p95 * 1.5) {
  console.warn('Code exec performance degraded, switching to traditional');
  forceModeForNewSessions('traditional');
}
```

Monitoring: Prometheus + Grafana dashboards

---

## Token Measurement Instrumentation

### TokenCounter Utility

```typescript
// src/server/instrumentation/TokenCounter.ts
import { encode } from 'tiktoken/node';

export interface TokenMeasurement {
  operation: string;
  mode: 'traditional' | 'code-exec';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  timestamp: number;
}

export class TokenCounter {
  private encoder: any;
  private measurements: TokenMeasurement[] = [];

  constructor() {
    this.encoder = encode('cl100k_base');
  }

  countTokens(text: string): number {
    const tokens = this.encoder(text);
    return tokens.length;
  }

  measure(operation: string, mode: 'traditional' | 'code-exec', input: any, output: any): TokenMeasurement {
    const inputStr = JSON.stringify(input);
    const outputStr = JSON.stringify(output);
    const m: TokenMeasurement = {
      operation,
      mode,
      inputTokens: this.countTokens(inputStr),
      outputTokens: this.countTokens(outputStr),
      totalTokens: 0,
      timestamp: Date.now(),
    };
    m.totalTokens = m.inputTokens + m.outputTokens;
    this.measurements.push(m);
    return m;
  }

  exportToFile(path: string) {
    const fs = require('fs');
    fs.writeFileSync(path, JSON.stringify({
      measurements: this.measurements,
      timestamp: new Date().toISOString(),
    }, null, 2));
  }
}
```

### Adapter Integration (Traditional)

```typescript
// src/server/adapters/traditional/tools/search-issues.ts
import { TokenCounter } from '../../instrumentation/TokenCounter';
const counter = new TokenCounter();

export function createSearchIssuesTool(issueService: IssueService) {
  return {
    name: 'search-issues',
    async handler(input: any) {
      const result = await issueService.search(input);
      counter.measure('search-issues', 'traditional', input, result);
      return result;
    },
  };
}
```

### Benchmark Script

```typescript
// scripts/benchmark-tokens.ts
import { TokenCounter } from '../src/server/instrumentation/TokenCounter';

async function main() {
  const counter = new TokenCounter();
  // run test suite invoking tools ...
  counter.exportToFile('./benchmarks/results-' + Date.now() + '.json');
}

main().catch(console.error);
```

---

## Multi-Client Test Harness Design

### Mock Traditional Client (Node.js)

```typescript
// test/mock-client/traditional-client.ts
import { spawn } from 'child_process';
import { createInterface } from 'readline';

export class MockMCPClient {
  private process: any;
  private requestId = 0;
  private handlers = new Map<number, (r: any) => void>();

  async connect(serverPath: string, mode: 'traditional' | 'code-exec' = 'traditional') {
    const env = { ...process.env, PP_MCP_MODE: mode };
    this.process = spawn('node', [serverPath], { env });
    const rl = createInterface({ input: this.process.stdout });
    rl.on('line', (line) => {
      const msg = JSON.parse(line);
      const h = this.handlers.get(msg.id);
      if (h) { h(msg.result); this.handlers.delete(msg.id); }
    });
  }

  private waitFor(id: number) {
    return new Promise((resolve) => { this.handlers.set(id, resolve as any); });
  }

  async callTool(name: string, args: any) {
    const id = this.requestId++;
    this.process.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }) + '\n');
    return this.waitFor(id);
  }

  async listTools() {
    const id = this.requestId++;
    this.process.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/list' }) + '\n');
    return this.waitFor(id);
  }

  disconnect() { this.process.kill(); }
}
```

### Parity Test (Traditional baseline; code-exec in Sprint 3)

```typescript
// test/multi-client/parity.test.ts
import { MockMCPClient } from '../mock-client/traditional-client';

describe('Multi-Client Parity Tests', () => {
  let client: MockMCPClient;
  beforeAll(async () => {
    client = new MockMCPClient();
    await client.connect('./dist/server.js', 'traditional');
  });

  test('create-issue returns expected fields', async () => {
    const result = await client.callTool('create-issue', { title: 'Test', priority: 'high' });
    expect(result).toMatchObject({ id: expect.any(String), title: 'Test', priority: 'high' });
  });

  test('search-issues pagination', async () => {
    const result = await client.callTool('search-issues', { query: 'bug', page: 1, limit: 20 });
    expect(result.items).toHaveLength(20);
    expect(result.total).toBeGreaterThan(0);
  });

  afterAll(() => client.disconnect());
});
```

### CLI Test Tool

```bash
# test/cli/mcp-test.sh
#!/bin/bash
MODE=$1
TOOL=$2
ARGS=$3
export PP_MCP_MODE=$MODE
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"'$TOOL'","arguments":'$ARGS'}}' \
  | node ./dist/server.js \
  | jq '.result'
```

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

### Functional Parity Guarantee

All MCP clients receive identical functionality:
- Same 41 tools available
- Same business logic and results
- Same privacy protections (tokenization)
- Same data access (Prisma operations)

Efficiency varies by client capability:
- Traditional mode (ALL clients): 50–70% token reduction
- Code execution mode (Claude Code if supported): 90–98% token reduction

Parity Matrix (Week 5 POC – 3 tools):

| Tool | Traditional Mode | Code Execution Mode | Result Parity |
|------|------------------|---------------------|---------------|
| create-issue | Direct stdio call | Wrapper imports service | ✅ Identical |
| search-issues | Server-side filter (20/page) | Local filter (all → 10) | ✅ Identical IDs |
| filter-issues | Server-side logic | Client-side logic | ✅ Identical |

**Solution**: Dual-mode MCP server that adapts to client capabilities.

---

### Dual-Mode Architecture

```
┌─────────────────────────────────────────────┐
│ ProjectPulse MCP Server                     │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Mode 1: Traditional MCP (stdio)         │ │
│ │  - 41 tools as function calls           │ │
│ │  - Works with: ALL MCP clients          │ │
│ │  - Optimizations: Pagination            │ │
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

### Client Capability Detection – Hybrid Strategy

Strategy: Try negotiation, fallback to env var, verify with probe; default to traditional.

Step 1: Attempt MCP negotiation (if spec/client supports):

```typescript
const server = new MCPServer({ capabilities: { tools: true, codeExecution: true } });
client.connect({ supports: { codeExecution: false } });
```

Step 2: Environment variable fallback:

```typescript
// PP_MCP_MODE=traditional | code-exec | auto
const mode = process.env.PP_MCP_MODE ?? 'auto';
```

Step 3: Probe verification and session cache:

```typescript
async function detectClientCapability(client: MCPClient) {
  if ((client as any).declaredCapabilities?.codeExecution === true) {
    try { await client.execute('return 2 + 2'); return 'code-exec'; } catch { return 'traditional'; }
  }
  if (process.env.PP_MCP_MODE === 'traditional') return 'traditional';
  if (process.env.PP_MCP_MODE === 'code-exec') { await client.execute('return 2 + 2'); return 'code-exec'; }
  try { await client.execute('return 2 + 2'); return 'code-exec'; } catch { return 'traditional'; }
}
```

### Partial Capability Support (Degraded Modes)

Capability Matrix:

| Feature | Traditional | Discovery Only | Code Exec Full |
|---------|-------------|----------------|----------------|
| Call tools | ✅ | ✅ | ✅ |
| List tools | ✅ | ✅ | ✅ |
| Filesystem discovery | ❌ | ✅ | ✅ |
| Local execution | ❌ | ❌ | ✅ |
| Tool definitions upfront | ✅ All | ✅ All | ❌ On-demand |

Selection Logic:

```typescript
interface ClientCapabilities {
  tools: boolean;              // Basic MCP (required)
  discovery?: boolean;         // Filesystem exploration
  codeExecution?: boolean;     // Local execution
}

function selectOperationMode(c: ClientCapabilities) {
  if (c.codeExecution) return { mode: 'code-exec', features: ['tools', 'discovery', 'local-execution'] };
  if (c.discovery) return { mode: 'discovery-only', features: ['tools', 'discovery'] };
  return { mode: 'traditional', features: ['tools'] };
}
```

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

**4. Large Dataset Handling – Pagination First**
```typescript
// Paginated search (default)
search_issues({ query: 'bug', page: 1, limit: 20 })
// → { items: [...20], total, page, pages, hasMore }
```

Backpressure & Timeouts:
- Server timeout 30s; chunk/page limit 100; max total 10,000
- Clients stop when satisfied; optional abort parameter for cancellation

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

**Week 5 POC Must Test (Traditional Only + Detection Stubs)**:

1. **Mock Traditional Client**
   - Traditional MCP interface
   - Parity and performance baseline

2. **CLI Tool**
   - Developer experience
   - Direct tool invocation and validation

3. **Claude Code (Optional)**
   - Traditional mode usage
   - Detection stubs (env var + probe) do not break functionality

**Success Criteria**: All clients can create, search, and filter issues with identical results.

---

### Implementation Timeline Adjustments

**Week 5 (Sprint 2):** Design + Traditional POC (3 tools), detection stubs, specs, test harness design, token baseline

**Weeks 6-7 (Sprint 2):** Refine specs; optimize traditional mode (pagination, compression, timeouts); document dual-mode patterns; prepare Sprint 3 plan

**Sprint 3 (Weeks 9-12):** Full dual-mode implementation; code execution wrappers; sandbox; capability detection; personas; multi-client validation

---

### Success Metrics (Revised)

**Non-Negotiable**:
- ✅ All MCP clients can use all 41 tools
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

**Sprint 2 Plan**:

1. **Week 5**: Design + Traditional POC (no code-exec wrappers). Deliver detection stubs, specs, test harness, token baseline.
2. **Weeks 6-7**: Refine specs and optimize traditional mode; finalize dual-mode design; plan Sprint 3.
3. **Week 8**: Documentation polish and readiness for Sprint 3.

**Sprint 3 Plan**:
- Implement full dual-mode infrastructure, wrappers for all tools, sandbox, and multi-client validation.

**Outcome**: All clients get identical functionality; efficiency varies by mode.

---

## References

- Code Execution with MCP - Anthropic Blog: https://www.anthropic.com/engineering/code-execution-with-mcp
- MCP Specification: https://modelcontextprotocol.io
- ProjectPulse Architecture: ../../03-Architecture.md
- ProjectPulse MCP Tools Guide: ../../../.agent/system/mcp-tools-guide.md

Next Steps: Review and approve this design, then proceed with Sprint 2 implementation.
