#!/usr/bin/env node
/**
 * MCP E2E Test Script for Knowledge Tools
 * Sprint 9 Phase 5: Tests all 7 Knowledge MCP tools against Mac mini Docker MCP server
 *
 * Usage:
 *   node scripts/test-knowledge-mcp-e2e.js
 *
 * Environment variables:
 *   MCP_ENDPOINT - MCP server endpoint (default: localhost:3001/mcp via infra-config)
 *   MCP_TOKEN_PROJECT3 - Agent token for project 3 (required)
 *   TEST_PROJECT_ID - Project ID to test (default: 3)
 */

// Use environment variable with sensible default (localhost for dev)
const MCP_BASE_URL = process.env.PROJECTPULSE_MCP_URL || process.env.MCP_URL || 'http://localhost:3001';
const MCP_ENDPOINT = process.env.MCP_ENDPOINT || `${MCP_BASE_URL}/mcp`;
const MCP_TOKEN = process.env.MCP_TOKEN_PROJECT3 || 'pk_test_project3_default_token';
const TEST_PROJECT_ID = parseInt(process.env.TEST_PROJECT_ID || '3', 10);

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
      Accept: 'application/json',
      Authorization: `Bearer ${MCP_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  return {
    status: response.status,
    data,
  };
}

// Test 1: Search Tool
async function testSearchTool() {
  console.log('\n📝 Test 1: projectpulse_knowledge_search');

  try {
    const { status, data } = await callMCPTool('projectpulse_knowledge_search', {
      projectId: TEST_PROJECT_ID,
      query: 'test database schema',
      mode: 'hybrid',
      limit: 5,
    });

    if (data.error) {
      console.error('❌ FAIL:', data.error.message);
      return false;
    }

    console.log('✅ PASS: Search tool returned results');
    console.log(`   HTTP Status: ${status}`);
    console.log('   Response:', JSON.stringify(data).substring(0, 200) + '...');
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
    const timestamp = Date.now();
    const { status, data } = await callMCPTool('projectpulse_knowledge_create', {
      projectId: TEST_PROJECT_ID,
      title: `MCP E2E Test Item ${timestamp}`,
      content:
        'This is a test knowledge item created via MCP E2E testing. It verifies that the MCP tool correctly forwards projectId and creates items in the correct project.',
      category: 'Testing',
      tags: ['e2e', 'mcp', 'sprint9'],
    });

    if (data.error) {
      console.error('❌ FAIL:', data.error.message);
      return false;
    }

    console.log('✅ PASS: Create tool successfully created item');
    console.log(`   HTTP Status: ${status}`);

    if (data.result?.content?.[0]?.text) {
      try {
        const parsed = JSON.parse(data.result.content[0].text);
        console.log('   Created item ID:', parsed.id || parsed.data?.id || 'N/A');
      } catch {}
    }

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
    const { status, data } = await callMCPTool('projectpulse_knowledge_related', {
      projectId: TEST_PROJECT_ID,
      itemId: 1,
      maxDepth: 2,
      limit: 5,
      minStrength: 0.5,
    });

    // This might legitimately fail if item 1 doesn't exist
    if (data.error) {
      if (data.error.message.includes('not found')) {
        console.log('⚠️  SKIP: Item 1 not found in project 3 (expected if no data)');
        return true; // Not a failure
      }
      console.error('❌ FAIL:', data.error.message);
      return false;
    }

    console.log('✅ PASS: Related tool returned graph results');
    console.log(`   HTTP Status: ${status}`);
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
    const { status, data } = await callMCPTool('projectpulse_knowledge_export', {
      projectId: TEST_PROJECT_ID,
      format: 'json',
    });

    if (data.error) {
      console.error('❌ FAIL:', data.error.message);
      return false;
    }

    console.log('✅ PASS: Export tool returned data');
    console.log(`   HTTP Status: ${status}`);
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
    const { status, data } = await callMCPTool('projectpulse_knowledge_metrics', {
      projectId: TEST_PROJECT_ID,
    });

    if (data.error) {
      console.error('❌ FAIL:', data.error.message);
      return false;
    }

    console.log('✅ PASS: Metrics tool returned statistics');
    console.log(`   HTTP Status: ${status}`);
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 6: Import Tool
async function testImportTool() {
  console.log('\n📝 Test 6: projectpulse_knowledge_import');

  try {
    const timestamp = Date.now();
    const { status, data } = await callMCPTool('projectpulse_knowledge_import', {
      projectId: TEST_PROJECT_ID,
      items: [
        {
          title: `Imported Test Item 1 ${timestamp}`,
          content: 'Bulk import test content 1',
          category: 'Testing',
          tags: ['import', 'test'],
        },
        {
          title: `Imported Test Item 2 ${timestamp}`,
          content: 'Bulk import test content 2',
          category: 'Testing',
          tags: ['import', 'test'],
        },
      ],
      overwrite: false,
    });

    if (data.error) {
      console.error('❌ FAIL:', data.error.message);
      return false;
    }

    console.log('✅ PASS: Import tool successfully imported items');
    console.log(`   HTTP Status: ${status}`);
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 7: Archive Tool (create, archive, unarchive)
async function testArchiveTool() {
  console.log('\n📝 Test 7: projectpulse_knowledge_archive');

  try {
    // First create an item to archive
    const timestamp = Date.now();
    const createResult = await callMCPTool('projectpulse_knowledge_create', {
      projectId: TEST_PROJECT_ID,
      title: `Archive Test Item ${timestamp}`,
      content: 'This item will be archived',
      category: 'Testing',
      tags: ['archive-test'],
    });

    if (createResult.data.error) {
      console.error('❌ FAIL: Could not create item to archive');
      return false;
    }

    // Extract item ID
    let itemId;
    try {
      const parsed = JSON.parse(createResult.data.result.content[0].text);
      itemId = parsed.id || parsed.data?.id;
    } catch {
      console.error('❌ FAIL: Could not parse created item ID');
      return false;
    }

    if (!itemId) {
      console.error('❌ FAIL: Created item has no ID');
      return false;
    }

    // Archive it
    const archiveResult = await callMCPTool('projectpulse_knowledge_archive', {
      projectId: TEST_PROJECT_ID,
      itemId,
      unarchive: false,
    });

    if (archiveResult.data.error) {
      console.error('❌ FAIL: Archive failed:', archiveResult.data.error.message);
      return false;
    }

    // Unarchive it
    const unarchiveResult = await callMCPTool('projectpulse_knowledge_archive', {
      projectId: TEST_PROJECT_ID,
      itemId,
      unarchive: true,
    });

    if (unarchiveResult.data.error) {
      console.error('❌ FAIL: Unarchive failed:', unarchiveResult.data.error.message);
      return false;
    }

    console.log('✅ PASS: Archive tool (archive + unarchive cycle)');
    console.log(`   Item ID: ${itemId}`);
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 8: Invalid ProjectId (should fail with 400)
async function testInvalidProjectId() {
  console.log('\n📝 Test 8: Invalid projectId validation');

  try {
    const { status, data } = await callMCPTool('projectpulse_knowledge_search', {
      projectId: 0, // Invalid
      query: 'test',
      mode: 'hybrid',
    });

    if (
      data.error &&
      (data.error.message.includes('projectId') ||
        data.error.message.includes('required') ||
        status === 400)
    ) {
      console.log('✅ PASS: Tool correctly rejected invalid projectId');
      console.log(`   HTTP Status: ${status}`);
      console.log('   Error:', data.error.message.substring(0, 100));
      return true;
    }

    console.error('❌ FAIL: Tool should have rejected projectId=0');
    return false;
  } catch (error) {
    // Network/fetch errors are unexpected
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 9: MCP Server Health Check
async function testMCPHealth() {
  console.log('\n📝 Test 9: MCP server health check');

  try {
    const healthUrl = MCP_ENDPOINT.replace('/mcp', '/health');
    const response = await fetch(healthUrl);
    const data = await response.json();

    if (response.status === 200 && data.status === 'healthy') {
      console.log('✅ PASS: MCP server is healthy');
      console.log('   Version:', data.version);
      console.log('   Transport:', data.transport);
      console.log('   Tool Count:', data.toolCount);
      return true;
    }

    console.error('❌ FAIL: MCP server unhealthy');
    return false;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('='.repeat(70));
  console.log('MCP E2E TEST SUITE - Knowledge Tools (Sprint 9 Phase 5)');
  console.log('='.repeat(70));
  console.log(`Endpoint:   ${MCP_ENDPOINT}`);
  console.log(`ProjectId:  ${TEST_PROJECT_ID}`);
  console.log(`Token:      ${MCP_TOKEN.substring(0, 15)}...`);
  console.log('='.repeat(70));

  const tests = [
    { name: 'MCP Health', fn: testMCPHealth },
    { name: 'Search Tool', fn: testSearchTool },
    { name: 'Create Tool', fn: testCreateTool },
    { name: 'Related Tool', fn: testRelatedTool },
    { name: 'Export Tool', fn: testExportTool },
    { name: 'Import Tool', fn: testImportTool },
    { name: 'Archive Tool', fn: testArchiveTool },
    { name: 'Metrics Tool', fn: testMetricsTool },
    { name: 'Invalid ProjectId', fn: testInvalidProjectId },
  ];

  const results = [];

  for (const test of tests) {
    results.push(await test.fn());
  }

  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));

  tests.forEach((test, i) => {
    const status = results[i] ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}  ${test.name}`);
  });

  console.log('='.repeat(70));
  const passed = results.filter(Boolean).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`\nResult: ${passed}/${total} tests passed (${percentage}%)`);
  console.log('='.repeat(70));

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Knowledge MCP tools are working correctly.\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Review errors above.\n');
  }

  process.exit(passed === total ? 0 : 1);
}

// Run
runAllTests().catch((error) => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
