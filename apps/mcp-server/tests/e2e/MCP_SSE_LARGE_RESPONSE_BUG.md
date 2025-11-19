# MCP SSE Large Response Bug

**Date**: 2025-11-19
**Severity**: CRITICAL
**Impact**: Blocks Session 2 E2E test, affects all MCP tools returning >30KB responses

---

## Summary

The MCP server's SSE (Server-Sent Events) transport layer **silently fails** when attempting to send responses larger than ~30KB. The underlying Next.js API is performant (0.19s), but the MCP SSE layer times out after 90+ seconds without sending any response.

---

## Evidence

### HTTP API Performance (Direct Test)
```bash
$ time curl -s "http://192.168.1.15:3000/api/onboarding/document-prompts?projectId=3" > /tmp/response.json
Response size: 30997 bytes
Documents: 15
Time: 0.191 seconds ✅
```

**Result**: HTTP API is FAST and returns all 15 document prompts instantly.

### MCP Tool Call Performance (SSE Transport)
```typescript
const promptsData = await client.callToolJSON(
  'projectpulse_onboarding_getDocumentPrompts',
  { projectId: 3 },
  90000 // 90 second timeout
);
```

**Result**: Request timeout (90000ms) for method: tools/call ❌

---

## Root Cause Analysis

1. **HTTP API Layer**: ✅ Works perfectly (0.19s for 31KB response)
2. **MCP Tool Implementation**: ✅ Receives request correctly
3. **MCP SSE Transport**: ❌ **FAILS SILENTLY** - Cannot send large responses

### What's Happening

1. Test client sends `tools/call` JSON-RPC request via POST /mcp?sessionId=X
2. MCP server receives request (HTTP 202 Accepted returned)
3. MCP tool calls Next.js HTTP API → **API returns data in 0.19s**
4. MCP server attempts to send response via SSE `message` event
5. **SSE layer hangs/fails** - response never arrives at client
6. Client times out after 90 seconds

### MCP Server Logs

```
[No ERROR logs for getDocumentPrompts with projectId=3]
[No WARN logs about large responses]
[No timeout logs]
```

**Conclusion**: The failure is **silent** - MCP server doesn't log the issue.

---

## Affected Tools

Any MCP tool returning responses >30KB:

- `projectpulse_onboarding_getDocumentPrompts` (31KB) ❌
- `projectpulse_onboarding_bootstrap` (likely large) ⚠️
- `projectpulse_wiki_search` (potentially large) ⚠️
- `tools/list` (timeout reported earlier) ⚠️

---

## Impact on E2E Tests

### ✅ **Working Tests**

| Test | Status | Details |
|------|--------|---------|
| Session 1 (10 phases + summary) | ✅ PASS | Response size <10KB per call |
| Session 2 validation tests | ✅ PASS | Small error responses |
| Health check | ✅ PASS | Tiny response (~100 bytes) |

### ❌ **Blocked Tests**

| Test | Status | Blocker |
|------|--------|---------|
| Session 2 main test | ❌ FAIL | Cannot fetch 15 document prompts (31KB) |
| Session 3 bootstrap | ⚠️ UNKNOWN | Likely similar issue with large responses |
| tools/list | ❌ FAIL | Timeout (large tool catalog) |

---

## Proposed Solutions

### Option 1: Fix MCP SSE Transport Layer (Recommended)
**Goal**: Handle large responses correctly in SSE stream

**Implementation**:
- Investigate SSE message size limits
- Add chunking if needed for responses >10KB
- Add timeout/error logging
- Test with 100KB+ responses

**Files to modify**:
- `apps/mcp-server/src/index-http.ts` (SSE handler)
- Add response size logging
- Implement chunking or compression

**Pros**: Fixes root cause, works for all tools
**Cons**: Requires MCP server architecture changes

### Option 2: Implement Response Chunking at API Level
**Goal**: Return large data in multiple smaller calls

**Implementation**:
```typescript
// Instead of one call returning 15 documents:
getDocumentPrompts() → { totalDocuments: 15 }

// Make 15 separate calls:
for (let i = 0; i < 15; i++) {
  getDocumentPrompt(i) → { filename, title, prompts }
}
```

**Pros**: Works with current MCP infrastructure
**Cons**: More API calls, not fixing root issue

### Option 3: Switch to HTTP JSON-RPC Endpoint
**Goal**: Bypass SSE for large responses

**Implementation**:
- Add `POST /mcp/jsonrpc` endpoint (non-SSE)
- Return responses in HTTP body (not SSE events)
- Keep SSE for small/streaming responses

**Pros**: Reliable for large responses
**Cons**: Defeats purpose of MCP SSE protocol

---

## Recommended Action

**Immediate** (Unblock tests):
1. Implement API-level chunking for `getDocumentPrompts`:
   ```typescript
   // Change to paginated approach
   getDocumentPromptsPage(projectId, page, pageSize) → 5 documents max
   ```

2. Update Session 2 test to iterate through pages

**Long-term** (Fix infrastructure):
1. Investigate MCP SSE message size limits
2. Implement proper chunking/streaming in SSE layer
3. Add comprehensive logging for large responses
4. Test with 100KB, 1MB responses

---

## Test Results Summary

**Session 1**: ✅ COMPLETE (2/2 tests passed, 1 skipped validation)
**Session 2**: ⚠️ PARTIAL (2/3 tests passed, main test blocked by SSE bug)
**Session 3**: ⏳ NOT TESTED (likely blocked by same bug)

**Overall MCP E2E Status**: 🟡 INFRASTRUCTURE BUG BLOCKS PRODUCTION USE

---

## Next Steps

1. **Document this bug** in project issues ✅ (this file)
2. **Choose solution approach** (chunking vs fix SSE layer)
3. **Implement fix** based on chosen approach
4. **Re-run Session 2 test** to validate fix
5. **Test Session 3** (bootstrap - likely similar issue)
6. **Load test MCP server** with 100KB+ responses

---

## References

- Session 1 test: `apps/mcp-server/tests/e2e/onboarding/session1-strategic-planning.test.ts` ✅
- Session 2 test: `apps/mcp-server/tests/e2e/onboarding/session2-document-generation.test.ts` ❌
- MCP client: `apps/mcp-server/tests/e2e/setup/mcp-client.ts`
- MCP server: `apps/mcp-server/src/index-http.ts`
- HTTP API: `apps/web/app/api/onboarding/document-prompts/route.ts` ✅
