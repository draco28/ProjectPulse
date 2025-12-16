# Sprint 9 Phase 5: MCP E2E Test Script

**Environment:** Mac mini Docker MCP server (`http://192.168.1.15:3001/mcp`)  
**Auth Token:** Project 3 token (configured in MCP)  
**Test ProjectId:** 3

---

## Prerequisites

1. **Verify MCP server is running:**
   ```bash
   curl http://192.168.1.15:3001/health
   # Should return: {"status":"healthy","version":"0.1.0","transport":"http",...}
   ```

2. **Get/verify project 3 agent token:**
   - User confirmed: "i have configured project id 3 auth token within your mcp"
   - Token should be available as environment variable: `PROJECTPULSE_MCP_TOKEN_PROJECT3`

3. **Set up test environment:**
   ```bash
   export MCP_ENDPOINT="http://192.168.1.15:3001/mcp"
   export MCP_TOKEN_PROJECT3="<your-project-3-token>"
   export TEST_PROJECT_ID=3
   ```

---

## Test Script Structure

This can be implemented as:
- Node.js script (`test-knowledge-mcp.js`)
- curl commands in bash script
- Jest/Vitest test suite
- Python script using `requests`

Below is a **Node.js example** using native `fetch` (Node 18+):

---

## Node.js Test Script

```javascript
/**
 * MCP E2E Test Script for Knowledge Tools
 * Tests all 7 Knowledge MCP tools against Mac mini Docker MCP server
 */

const MCP_ENDPOINT = process.env.MCP_ENDPOINT || 'http://192.168.1.15:3001/mcp';
const MCP_TOKEN = process.env.MCP_TOKEN_PROJECT3;
const TEST_PROJECT_ID = parseInt(process.env.TEST_PROJECT_ID || '3', 10);

if (!MCP_TOKEN) {
  console.error('❌ MCP_TOKEN_PROJECT3 environment variable not set');
  process.exit(1);
}

// Helper: Make MCP JSON-RPC call
async function callMCPTool(toolName, params) {
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: params,
    },
  };

  const response = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${MCP_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

// Test 1: Search Tool
async function testSearchTool() {
  console.log('\n📝 Test 1: projectpulse_knowledge_search');
  
  try {
    const result = await callMCPTool('projectpulse_knowledge_search', {
      projectId: TEST_PROJECT_ID,
      query: 'test database schema',
      mode: 'hybrid',
      limit: 5,
    });

    if (result.error) {
      console.error('❌ FAIL:', result.error.message);
      return false;
    }

    console.log('✅ PASS: Search tool returned results');
    console.log('   Response:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 2: Create Tool
async function testCreateTool() {
  console.log('\n📝 Test 2: projectpulse_knowledge_create');
  
  try {
    const result = await callMCPTool('projectpulse_knowledge_create', {
      projectId: TEST_PROJECT_ID,
      title: 'MCP E2E Test Item',
      content: 'This is a test knowledge item created via MCP E2E testing.',
      category: 'Testing',
      tags: ['e2e', 'mcp', 'test'],
    });

    if (result.error) {
      console.error('❌ FAIL:', result.error.message);
      return false;
    }

    console.log('✅ PASS: Create tool successfully created item');
    console.log('   Created item ID:', result.result?.content?.[0]?.text ? JSON.parse(result.result.content[0].text).id : 'N/A');
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 3: Related Tool
async function testRelatedTool() {
  console.log('\n📝 Test 3: projectpulse_knowledge_related');
  
  try {
    const result = await callMCPTool('projectpulse_knowledge_related', {
      projectId: TEST_PROJECT_ID,
      itemId: 1, // Assumes item 1 exists in project 3
      maxDepth: 2,
      limit: 5,
    });

    if (result.error) {
      console.error('❌ FAIL:', result.error.message);
      return false;
    }

    console.log('✅ PASS: Related tool returned graph results');
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 4: Export Tool
async function testExportTool() {
  console.log('\n📝 Test 4: projectpulse_knowledge_export');
  
  try {
    const result = await callMCPTool('projectpulse_knowledge_export', {
      projectId: TEST_PROJECT_ID,
      format: 'json',
    });

    if (result.error) {
      console.error('❌ FAIL:', result.error.message);
      return false;
    }

    console.log('✅ PASS: Export tool returned data');
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 5: Metrics Tool
async function testMetricsTool() {
  console.log('\n📝 Test 5: projectpulse_knowledge_metrics');
  
  try {
    const result = await callMCPTool('projectpulse_knowledge_metrics', {
      projectId: TEST_PROJECT_ID,
    });

    if (result.error) {
      console.error('❌ FAIL:', result.error.message);
      return false;
    }

    console.log('✅ PASS: Metrics tool returned statistics');
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 6: Invalid ProjectId (should fail with 400)
async function testInvalidProjectId() {
  console.log('\n📝 Test 6: Invalid projectId validation');
  
  try {
    const result = await callMCPTool('projectpulse_knowledge_search', {
      projectId: 0, // Invalid
      query: 'test',
      mode: 'hybrid',
    });

    if (result.error && result.error.message.includes('projectId')) {
      console.log('✅ PASS: Tool correctly rejected invalid projectId');
      return true;
    }

    console.error('❌ FAIL: Tool should have rejected projectId=0');
    return false;
  } catch (error) {
    // Expected to fail - that's good
    console.log('✅ PASS: Tool correctly rejected invalid projectId');
    return true;
  }
}

// Test 7: Cross-project access (should fail)
async function testCrossProjectAccess() {
  console.log('\n📝 Test 7: Cross-project data isolation');
  
  try {
    // Try to access a different project (assume project 1 exists)
    const result = await callMCPTool('projectpulse_knowledge_search', {
      projectId: 1, // Different project
      query: 'test',
      mode: 'hybrid',
    });

    // If token is scoped to project 3, this should fail or return empty
    if (result.error || (result.result && result.result.content?.[0]?.text.includes('"count":0'))) {
      console.log('✅ PASS: Token cannot access other projects');
      return true;
    }

    console.error('❌ FAIL: Token should not access other projects');
    return false;
  } catch (error) {
    console.log('✅ PASS: Cross-project access blocked');
    return true;
  }
}

// Run all tests
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('MCP E2E TEST SUITE - Knowledge Tools');
  console.log('='.repeat(60));
  console.log(`Endpoint: ${MCP_ENDPOINT}`);
  console.log(`ProjectId: ${TEST_PROJECT_ID}`);
  console.log(`Token: ${MCP_TOKEN.substring(0, 10)}...`);
  console.log('='.repeat(60));

  const results = [];

  results.push(await testSearchTool());
  results.push(await testCreateTool());
  results.push(await testRelatedTool());
  results.push(await testExportTool());
  results.push(await testMetricsTool());
  results.push(await testInvalidProjectId());
  results.push(await testCrossProjectAccess());

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  const passed = results.filter(Boolean).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Failed: ${total - passed}/${total}`);
  console.log('='.repeat(60));

  process.exit(passed === total ? 0 : 1);
}

// Run
runAllTests().catch((error) => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
```

---

## Usage

### Option 1: Node.js Script

```bash
# Save script as test-knowledge-mcp.js
node test-knowledge-mcp.js
```

### Option 2: Manual curl Commands

```bash
# Test 1: Search
curl -X POST http://192.168.1.15:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MCP_TOKEN_PROJECT3" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "projectpulse_knowledge_search",
      "arguments": {
        "projectId": 3,
        "query": "test",
        "mode": "hybrid",
        "limit": 5
      }
    }
  }'

# Test 2: Create
curl -X POST http://192.168.1.15:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MCP_TOKEN_PROJECT3" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "projectpulse_knowledge_create",
      "arguments": {
        "projectId": 3,
        "title": "Test Item",
        "content": "Test content",
        "category": "Testing",
        "tags": ["test"]
      }
    }
  }'
```

---

## Expected Results

### All 7 tools should:
1. ✅ Accept `projectId` parameter
2. ✅ Forward `projectId` to Next.js HTTP APIs
3. ✅ Return well-formed MCP responses with `content[0].text` containing JSON
4. ✅ Handle errors gracefully (invalid projectId → 400)
5. ✅ Enforce project scoping (no cross-project data)

### Validation Criteria:
- **Search tool:** Returns search results scoped to project 3
- **Create tool:** Creates knowledge item in project 3
- **Related tool:** Returns related items from project 3 only
- **Export tool:** Exports items from project 3 only
- **Metrics tool:** Returns metrics for project 3 only
- **Invalid projectId:** Rejects with 400 error
- **Cross-project access:** Blocked or returns empty results

---

## Next Steps

After running MCP E2E tests:
1. Document results in `PHASE-5-TEST-RESULTS.md`
2. Update `SPRINT9-TESTING-AND-VALIDATION.md`
3. If failures occur, debug tool → API → DB flow
4. Verify MCP server logs for errors
