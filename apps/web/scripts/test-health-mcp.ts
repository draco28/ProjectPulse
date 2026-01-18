/**
 * Health MCP Tools Integration Test Script
 *
 * Sprint 7 Day 12 - Health MCP Tools (US-120)
 * Created: 2025-11-14
 *
 * Manual integration test script for health MCP tools.
 * Demonstrates how to call all 3 health tools via curl + JSON-RPC 2.0.
 *
 * Prerequisites:
 * - MCP server running (default: http://localhost:3000/api/mcp)
 * - At least one project exists in database (projectId: 4)
 * - Project has source code at /Users/draco/projects/AI_HUB/apps/web
 *
 * Usage:
 * 1. Copy curl commands from output
 * 2. Run in terminal to test MCP server
 * 3. Verify JSON-RPC 2.0 responses
 *
 * Run with: npx tsx scripts/test-health-mcp.ts
 */

import { getConfig } from '@projectpulse/infra-config';
const infraConfig = getConfig();

/**
 * Generate curl command for JSON-RPC 2.0 request
 *
 * @param toolName - MCP tool name (e.g., 'health.runScan')
 * @param args - Tool arguments object
 * @param sessionId - Optional session ID (generates UUID if not provided)
 * @returns Formatted curl command
 */
function generateCurlCommand(
  toolName: string,
  args: Record<string, unknown>,
  sessionId?: string
): string {
  const sid = sessionId || crypto.randomUUID();
  const requestBody = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args,
    },
  });

  return `curl -X POST ${infraConfig.webUrl}/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "Mcp-Session-Id: ${sid}" \\
  -d '${requestBody}'`;
}

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║ Health MCP Tools - Integration Test Commands                     ║');
console.log('║ Sprint 7 Day 12 - US-120                                          ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝');
console.log('');

// ===========================================================================
// Test 1: health.runScan - Execute scanners and calculate health score
// ===========================================================================

console.log('┌───────────────────────────────────────────────────────────────────┐');
console.log('│ TEST 1: health.runScan                                            │');
console.log('│ Execute 2 scanners (SEMGREP + ESLINT) and calculate health score │');
console.log('└───────────────────────────────────────────────────────────────────┘');
console.log('');

const runScanCommand = generateCurlCommand('health.runScan', {
  projectId: 4,
  scannerTypes: ['SEMGREP', 'ESLINT'],
  projectPath: '/Users/draco/projects/AI_HUB/apps/web',
  options: {
    exclude: ['node_modules/**', '.next/**', 'dist/**', '*.test.ts'],
  },
});

console.log(runScanCommand);
console.log('');
console.log('Expected Response:');
console.log(
  JSON.stringify(
    {
      jsonrpc: '2.0',
      id: '<timestamp>',
      result: {
        projectId: 4,
        scannersRun: [
          {
            type: 'SEMGREP',
            totalFindings: 44,
            bySeverity: { critical: 9, high: 14, medium: 21, low: 0 },
          },
          {
            type: 'ESLINT',
            totalFindings: 218,
            bySeverity: { critical: 0, high: 12, medium: 206, low: 0 },
          },
        ],
        healthScore: {
          overallScore: 78.5,
          securityScore: 72.3,
          qualityScore: 81.4,
          performanceScore: 85.0,
          accessibilityScore: 79.2,
          grade: 'C',
        },
        duration: 87500,
      },
    },
    null,
    2
  )
);
console.log('');
console.log('');

// ===========================================================================
// Test 2: health.getScore - Retrieve latest health score
// ===========================================================================

console.log('┌───────────────────────────────────────────────────────────────────┐');
console.log('│ TEST 2: health.getScore (single score)                            │');
console.log('│ Retrieve latest health score for project                         │');
console.log('└───────────────────────────────────────────────────────────────────┘');
console.log('');

const getScoreSingleCommand = generateCurlCommand('health.getScore', {
  projectId: 4,
  limit: 1,
});

console.log(getScoreSingleCommand);
console.log('');
console.log('Expected Response:');
console.log(
  JSON.stringify(
    {
      jsonrpc: '2.0',
      id: '<timestamp>',
      result: {
        projectId: 4,
        scores: [
          {
            id: 1,
            overallScore: 78,
            securityScore: 72,
            qualityScore: 81,
            performanceScore: 85,
            accessibilityScore: 79,
            calculatedAt: '2025-11-14T10:30:00.000Z',
          },
        ],
        // No trend property (single score)
      },
    },
    null,
    2
  )
);
console.log('');
console.log('');

// ===========================================================================
// Test 3: health.getScore - Retrieve multiple scores with trend
// ===========================================================================

console.log('┌───────────────────────────────────────────────────────────────────┐');
console.log('│ TEST 3: health.getScore (multiple scores with trend)              │');
console.log('│ Retrieve last 3 scores and calculate trend                       │');
console.log('└───────────────────────────────────────────────────────────────────┘');
console.log('');

const getScoreMultipleCommand = generateCurlCommand('health.getScore', {
  projectId: 4,
  limit: 3,
});

console.log(getScoreMultipleCommand);
console.log('');
console.log('Expected Response:');
console.log(
  JSON.stringify(
    {
      jsonrpc: '2.0',
      id: '<timestamp>',
      result: {
        projectId: 4,
        scores: [
          {
            id: 1,
            overallScore: 75,
            securityScore: 70,
            qualityScore: 78,
            performanceScore: 82,
            accessibilityScore: 76,
            calculatedAt: '2025-11-14T08:00:00.000Z',
          },
          {
            id: 2,
            overallScore: 77,
            securityScore: 72,
            qualityScore: 80,
            performanceScore: 83,
            accessibilityScore: 77,
            calculatedAt: '2025-11-14T09:00:00.000Z',
          },
          {
            id: 3,
            overallScore: 80,
            securityScore: 75,
            qualityScore: 82,
            performanceScore: 85,
            accessibilityScore: 79,
            calculatedAt: '2025-11-14T10:00:00.000Z',
          },
        ],
        trend: {
          direction: 'improving',
          change: 5, // 80 - 75
          period: '3 scores',
        },
      },
    },
    null,
    2
  )
);
console.log('');
console.log('');

// ===========================================================================
// Test 4: health.getHistory - Analyze historical trends
// ===========================================================================

console.log('┌───────────────────────────────────────────────────────────────────┐');
console.log('│ TEST 4: health.getHistory (7-day trend, overall category)         │');
console.log('│ Retrieve 7 days of history with linear regression analysis       │');
console.log('└───────────────────────────────────────────────────────────────────┘');
console.log('');

const getHistoryCommand = generateCurlCommand('health.getHistory', {
  projectId: 4,
  days: 7,
  category: 'overall',
});

console.log(getHistoryCommand);
console.log('');
console.log('Expected Response:');
console.log(
  JSON.stringify(
    {
      jsonrpc: '2.0',
      id: '<timestamp>',
      result: {
        projectId: 4,
        category: 'overall',
        period: {
          days: 7,
          from: '2025-11-07T10:00:00.000Z',
          to: '2025-11-14T10:00:00.000Z',
        },
        history: [
          { date: '2025-11-07T10:00:00.000Z', score: 75 },
          { date: '2025-11-08T10:00:00.000Z', score: 76 },
          { date: '2025-11-09T10:00:00.000Z', score: 77 },
          { date: '2025-11-10T10:00:00.000Z', score: 78 },
          { date: '2025-11-11T10:00:00.000Z', score: 79 },
          { date: '2025-11-12T10:00:00.000Z', score: 79 },
          { date: '2025-11-14T10:00:00.000Z', score: 80 },
        ],
        trend: {
          average: 77.7,
          min: 75,
          max: 80,
          slope: 0.71, // Linear regression slope
          direction: 'improving',
        },
      },
    },
    null,
    2
  )
);
console.log('');
console.log('');

// ===========================================================================
// Test 5: health.getHistory - Category-specific trend (security)
// ===========================================================================

console.log('┌───────────────────────────────────────────────────────────────────┐');
console.log('│ TEST 5: health.getHistory (30-day trend, security category)       │');
console.log('│ Analyze security score trends over last 30 days                  │');
console.log('└───────────────────────────────────────────────────────────────────┘');
console.log('');

const getHistorySecurityCommand = generateCurlCommand('health.getHistory', {
  projectId: 4,
  days: 30,
  category: 'security',
});

console.log(getHistorySecurityCommand);
console.log('');
console.log('Expected Response:');
console.log(
  JSON.stringify(
    {
      jsonrpc: '2.0',
      id: '<timestamp>',
      result: {
        projectId: 4,
        category: 'security',
        period: {
          days: 30,
          from: '2025-10-15T10:00:00.000Z',
          to: '2025-11-14T10:00:00.000Z',
        },
        history: [
          { date: '2025-10-15T10:00:00.000Z', score: 65 },
          { date: '2025-10-20T10:00:00.000Z', score: 68 },
          { date: '2025-10-25T10:00:00.000Z', score: 70 },
          { date: '2025-11-01T10:00:00.000Z', score: 72 },
          { date: '2025-11-07T10:00:00.000Z', score: 73 },
          { date: '2025-11-14T10:00:00.000Z', score: 75 },
        ],
        trend: {
          average: 70.5,
          min: 65,
          max: 75,
          slope: 2.0, // Steady improvement
          direction: 'improving',
        },
      },
    },
    null,
    2
  )
);
console.log('');
console.log('');

// ===========================================================================
// Test 6: Error Cases
// ===========================================================================

console.log('┌───────────────────────────────────────────────────────────────────┐');
console.log('│ TEST 6: Error Cases                                               │');
console.log('│ Test validation and error handling                               │');
console.log('└───────────────────────────────────────────────────────────────────┘');
console.log('');

console.log('Error Case 1: Invalid projectId (nonexistent)');
const errorInvalidProjectCommand = generateCurlCommand('health.getScore', {
  projectId: 999999,
  limit: 1,
});
console.log(errorInvalidProjectCommand);
console.log('');
console.log('Expected Error Response:');
console.log(
  JSON.stringify(
    {
      jsonrpc: '2.0',
      id: '<timestamp>',
      error: {
        code: -32602, // INVALID_PARAMS
        message: 'Project not found: 999999',
      },
    },
    null,
    2
  )
);
console.log('');
console.log('');

console.log('Error Case 2: Invalid scanner type');
const errorInvalidScannerCommand = generateCurlCommand('health.runScan', {
  projectId: 4,
  scannerTypes: ['INVALID_SCANNER'],
  projectPath: '/path/to/project',
});
console.log(errorInvalidScannerCommand);
console.log('');
console.log('Expected Error Response:');
console.log(
  JSON.stringify(
    {
      jsonrpc: '2.0',
      id: '<timestamp>',
      error: {
        code: -32602, // INVALID_PARAMS
        message:
          'Invalid scanner type: INVALID_SCANNER. Valid types: SEMGREP, ESLINT, AXECORE, LIGHTHOUSE',
      },
    },
    null,
    2
  )
);
console.log('');
console.log('');

console.log('Error Case 3: Invalid days range (out of bounds)');
const errorInvalidDaysCommand = generateCurlCommand('health.getHistory', {
  projectId: 4,
  days: 100, // Max is 90
  category: 'overall',
});
console.log(errorInvalidDaysCommand);
console.log('');
console.log('Expected Error Response:');
console.log(
  JSON.stringify(
    {
      jsonrpc: '2.0',
      id: '<timestamp>',
      error: {
        code: -32602, // INVALID_PARAMS
        message: 'Invalid days: must be an integer between 1 and 90',
      },
    },
    null,
    2
  )
);
console.log('');
console.log('');

// ===========================================================================
// Summary
// ===========================================================================

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║ Test Summary                                                      ║');
console.log('╠═══════════════════════════════════════════════════════════════════╣');
console.log('║ Total Tests: 6                                                    ║');
console.log('║ - health.runScan: 1 test                                          ║');
console.log('║ - health.getScore: 2 tests (single + multiple)                   ║');
console.log('║ - health.getHistory: 2 tests (overall + security)                ║');
console.log('║ - Error cases: 3 tests (invalid project, scanner, days)          ║');
console.log('╠═══════════════════════════════════════════════════════════════════╣');
console.log('║ Next Steps:                                                       ║');
console.log('║ 1. Ensure Mac mini MCP server is running                         ║');
console.log('║ 2. Copy-paste curl commands above into terminal                  ║');
console.log('║ 3. Verify JSON-RPC 2.0 responses match expected format           ║');
console.log('║ 4. Check database for stored findings and health scores          ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝');
console.log('');
