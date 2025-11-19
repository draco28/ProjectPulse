# MCP Tool E2E Tests - ProjectPulse Onboarding

**Purpose**: Test ProjectPulse onboarding feature using MCP tools, simulating real AI agent experience (Claude Code, Cascade, etc.)

**Key Distinction**: These tests use **MCP JSON-RPC protocol**, NOT direct HTTP API calls. They simulate how end user agents will interact with ProjectPulse.

---

## Architecture

### MCP Protocol Flow

```
1. Agent connects to MCP server via SSE transport
   GET http://192.168.1.15:3001/mcp

2. MCP server sends SSE endpoint event with sessionId
   event: endpoint
   data: /mcp?sessionId=abc123

3. Agent sends JSON-RPC requests via POST
   POST /mcp?sessionId=abc123
   {"jsonrpc": "2.0", "method": "tools/call", "params": {...}}

4. MCP server executes tool and returns result
   {"result": {"content": [{"type": "text", "text": "..."}]}}
```

### Test vs Production

| Aspect | These Tests | Internal API Tests |
|--------|-------------|-------------------|
| Protocol | MCP JSON-RPC 2.0 + SSE | HTTP REST + JSON |
| Transport | SSE with session IDs | Stateless HTTP |
| Client | @modelcontextprotocol/sdk | Fetch/Axios |
| Tool Call | `tools/call` with tool name | `POST /api/...` |
| Response | `{content: [{text: JSON.stringify(...)}]}` | JSON directly |
| Experience | **Agent simulation** | Internal testing |

---

## Test Structure

```
apps/mcp-server/tests/e2e/
├── setup/
│   ├── mcp-client.ts              # MCP client wrapper
│   ├── test-helpers.ts            # Shared utilities
│   └── fixtures.ts                # Mock data generators
├── onboarding/
│   ├── session1-strategic-planning.test.ts    # Session 1: 10 phases + summary
│   ├── session2-document-generation.test.ts   # Session 2: 15 documents
│   └── session3-bootstrap.test.ts             # Session 3: Complete workflow
├── tools/
│   └── health-check.test.ts       # Health check tool
└── README.md                       # This file
```

---

## MCP Tools Tested

### Session 1 Tools (Strategic Planning)
- `projectpulse.onboarding.getQuestions` - Get questions for phase 1-10
- `projectpulse.onboarding.saveAnswers` - Save answers for each phase
- `projectpulse.onboarding.getExecutiveSummaryPrompt` - Get prompt template
- `projectpulse.onboarding.storeExecutiveSummary` - Store agent-generated summary

### Session 2 Tools (Document Generation)
- `projectpulse.onboarding.getDocumentPrompts` - Get all 15 document prompts
- `projectpulse.onboarding.storeDocument` - Store each document (call 15x)
- `projectpulse.onboarding.listDocuments` - Verify all documents stored

### Session 3 Tools (Bootstrap)
- `projectpulse.onboarding.bootstrap` - Complete bootstrap (all artifacts)

### Supporting Tools
- `projectpulse.health_check` - Health verification

---

## Prerequisites

### 1. Mac Mini Services Running

```bash
# Check Next.js app
curl http://192.168.1.15:3000/api/health
# Expected: {"status":"healthy","database":"connected"}

# Check MCP server
curl http://192.168.1.15:3001/health
# Expected: {"status":"healthy","transport":"sse","toolCount":35}
```

### 2. Database Seeded

```bash
# From apps/web directory
DATABASE_URL="postgresql://postgres:postgres123@192.168.1.15:5432/projectpulse_dev" \
  npx tsx prisma/seed.ts
```

This creates test project ID 8 ("Moksha DevHub").

### 3. Node.js 20+

```bash
node --version
# Should be v20.x or higher
```

---

## Running Tests

### Run All Tests

```bash
# From project root
node --test apps/mcp-server/tests/e2e/**/*.test.ts
```

### Run Individual Sessions

```bash
# Session 1 only (10 phases + executive summary)
node --test apps/mcp-server/tests/e2e/onboarding/session1-strategic-planning.test.ts

# Session 2 only (15 documents)
node --test apps/mcp-server/tests/e2e/onboarding/session2-document-generation.test.ts

# Session 3 only (bootstrap)
node --test apps/mcp-server/tests/e2e/onboarding/session3-bootstrap.test.ts

# Health check only
node --test apps/mcp-server/tests/e2e/tools/health-check.test.ts
```

### Run With Verbose Output

```bash
node --test --test-reporter=spec apps/mcp-server/tests/e2e/**/*.test.ts
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_URL` | `http://192.168.1.15:3001` | MCP server URL |
| `TEST_PROJECT_ID` | `8` | Test project ID from seed |

**Override Example:**

```bash
MCP_URL=http://localhost:3001 TEST_PROJECT_ID=1 node --test apps/mcp-server/tests/e2e/**/*.test.ts
```

---

## Test Scenarios

### Session 1: Strategic Planning

**Duration**: ~10-15 seconds
**MCP Tool Calls**: 23 calls (10 getQuestions + 10 saveAnswers + 1 getPrompt + 1 storeSummary + 1 listTools)

**What It Tests:**
1. Connect to MCP server via SSE
2. List all tools and verify onboarding tools exist
3. Loop through 10 phases:
   - Get questions for phase
   - Generate mock answers (meets min/max length requirements)
   - Save answers via MCP tool
   - Verify progress tracking
4. Get executive summary prompt (with all 96 Q&A pairs)
5. Store agent-generated executive summary (~500 words)
6. Verify Session 1 completion
7. Error scenarios: incomplete phases, invalid input

**Success Criteria:**
- ✅ All 10 phases completed
- ✅ At least 90 questions answered
- ✅ Executive summary stored (100-5000 words)
- ✅ Session 1 marked complete
- ✅ project-context.json generated

### Session 2: Document Generation

**Duration**: ~20-30 seconds
**MCP Tool Calls**: 18 calls (1 getPrompts + 15 storeDocument + 1 listDocuments + 1 listTools)

**What It Tests:**
1. Get all 15 document prompts via MCP tool
2. Verify prompt structure (systemPrompt, userPrompt, wordCountTarget)
3. Loop through 15 documents:
   - Generate mock document content (~2000 words each)
   - Store document via MCP tool
   - Verify progress tracking (X/15 complete)
4. List all stored documents
5. Verify Session 2 completion
6. Verify 13-Project-Plan.md has proper format (required for Session 3)
7. Error scenarios: missing Session 1, invalid input

**Success Criteria:**
- ✅ All 15 documents stored
- ✅ Progress tracking accurate
- ✅ Session 2 marked complete
- ✅ 13-Project-Plan.md verified

### Session 3: Bootstrap

**Duration**: ~5-10 seconds
**MCP Tool Calls**: 2 calls (1 bootstrap + 1 listTools)

**What It Tests:**
1. Call bootstrap MCP tool with repo path
2. Verify all artifacts created:
   - Agent personas (3-10 based on tech stack)
   - Skills library (5-15 skills)
   - Workflow templates (3)
   - SOPs (5)
   - Roadmap materialization (phases → days)
   - CurrentPlan and CurrentTodos
3. Verify CLAUDE.md file written to repo
4. Verify AGENTS.md file written to repo
5. Verify Session 3 completion
6. Error scenarios: missing Session 1/2, invalid parameters

**Success Criteria:**
- ✅ All artifacts created
- ✅ CLAUDE.md exists with correct content
- ✅ AGENTS.md exists with correct content
- ✅ Session 3 marked complete

### Health Check

**Duration**: ~1-2 seconds
**MCP Tool Calls**: 2 calls (1 health_check + 1 listTools)

**What It Tests:**
1. Connect to MCP server
2. Call health_check tool
3. Verify server status
4. List all MCP tools
5. Count tools by category

**Success Criteria:**
- ✅ Server status "healthy"
- ✅ At least 35 total tools
- ✅ At least 8 onboarding tools

---

## Troubleshooting

### Issue: "Failed to connect to MCP server"

**Cause**: MCP server not running or network unreachable.

**Debug:**

```bash
# Check MCP server health
curl http://192.168.1.15:3001/health

# Check Docker container
docker ps --filter "name=projectpulse-mcp-cloud"

# Check container logs
docker logs projectpulse-mcp-cloud --tail 50
```

**Fix:**
- Ensure Mac mini is powered on
- Verify Docker services running: `docker compose -f docker-compose.cloud.yml up -d`
- Check network connectivity: `ping 192.168.1.15`

---

### Issue: "Request context disposed"

**Cause**: SSE session was terminated prematurely.

**Debug:**

```bash
# Check for MCP session errors in logs
docker logs projectpulse-mcp-cloud | grep -i "session"
```

**Fix:**
- This is handled by the MCPTestClient wrapper
- Tests automatically disconnect on completion
- If issue persists, restart MCP server

---

### Issue: "Session 1 must be complete before Session 2"

**Cause**: Tests running out of order or prerequisite data missing.

**Fix:**
- Run Session 1 test before Session 2
- Or run complete test suite in order
- Database state accumulates across tests

---

### Issue: "Module not found: @modelcontextprotocol/sdk"

**Cause**: MCP SDK not installed.

**Fix:**

```bash
# From project root
pnpm install

# Or specifically for mcp-server
cd apps/mcp-server
pnpm install
```

---

## Implementation Notes

### MCPTestClient Wrapper

The `MCPTestClient` class wraps the official MCP SDK client and provides:

- **Automatic SSE connection handling**
- **Session ID management**
- **JSON-RPC 2.0 protocol abstraction**
- **Convenience methods** (`callToolJSON` for automatic JSON parsing)
- **Error handling** with descriptive messages
- **Connection state tracking**

**Example Usage:**

```typescript
const client = new MCPTestClient('http://192.168.1.15:3001');
await client.connect();

const result = await client.callToolJSON('projectpulse.health_check', {});
console.log(result.status); // "healthy"

await client.disconnect();
```

### Mock Data Generation

Fixtures provide realistic mock data:

- `generateMockAnswers()` - Creates answers that meet min/max length requirements
- `generateMockExecutiveSummary()` - Generates ~500 word summary with project context
- `generateMockDocument()` - Creates full document with proper markdown structure
- `generateMockProjectPlan()` - Creates 13-Project-Plan.md with proper format for Session 3 parsing

### Test Helpers

Utilities for cleaner tests:

- `logTestStep()` - Pretty console output with emoji indicators
- `assertEqual()` - Deep equality assertions
- `assertContains()` - String containment checks
- `TestTimer` - Measure test duration
- `TestResults` - Track and summarize test outcomes

---

## Expected Output

### Successful Test Run

```
▶️ Connecting to MCP server...
✅ Connected (session: abc123-def456)
✅ Found 8 onboarding tools
▶️ Phase 1: Fetching questions...
✅ Phase 1: Product Manager - Foundation (10 questions)
▶️ Phase 1: Saving 10 answers...
✅ Phase 1: Answers saved (1/10 complete)
...
✅ Phase 10: Answers saved (10/10 complete)
✅ All 10 phases complete!
Total questions answered: 96
▶️ Fetching executive summary prompt...
✅ Executive summary prompt fetched (96 Q&A pairs included)
▶️ Generating and storing executive summary...
✅ Executive summary stored (503 words)

✅ Session 1 Complete! (12.5s)
```

### Test Summary

```
=== Test Results ===

✅ Session 1: Complete 10-phase Q&A workflow + Executive Summary (12.5s)
✅ Session 2: Generate and store all 15 documents (23.8s)
✅ Session 3: Complete bootstrap workflow (8.2s)
✅ Health Check: Should connect and verify server health (1.3s)

=== Summary ===
Total: 4
Passed: 4
Failed: 0
Skipped: 0
Duration: 45.8s
```

---

## Next Steps

1. **Run complete test suite** to validate all MCP tools
2. **Add more error scenario tests** (rate limiting, timeout handling)
3. **Performance benchmarks** (measure tool call latency)
4. **CI/CD integration** (GitHub Actions workflow)
5. **Load testing** (concurrent agent sessions)

---

## Related Documentation

- [MCP Multi-Agent Setup Guide](../../../docs/features/mcp-multi-agent-setup.md)
- [MCP Tools Guide](../../../docs/features/mcp-tools-guide.md)
- [Sprint 8.6 Completion](../.agent/task/post-sprint-8.6-progress.md)
- [Onboarding API Reference](../../../docs/features/api-reference.md)

---

**Last Updated**: 2025-11-19
**Test Suite Version**: 1.0.0
**MCP Server Version**: 0.1.0 (SSE transport)
