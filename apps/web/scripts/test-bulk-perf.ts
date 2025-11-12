#!/usr/bin/env tsx
/**
 * Performance Test: Bulk Issue Creation
 * Requirements: Create 15 issues in < 2 seconds
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface BulkIssuePayload {
  projectId: number;
  issues: Array<{
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    module?: string;
    context?: {
      files?: Array<{
        filePath: string;
        lineNumber?: number;
        snippet?: string;
      }>;
    };
  }>;
}

async function testBulkCreation() {
  const payload: BulkIssuePayload = {
    projectId: 5, // Moksha DevHub
    issues: Array.from({ length: 15 }, (_, i) => ({
      title: `Performance Test Issue ${i + 1}`,
      description: `This is a test issue created for performance validation. Issue number: ${i + 1}`,
      priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
      context: {
        files: [
          {
            filePath: `src/components/TestComponent${i + 1}.tsx`,
            lineNumber: 42 + i,
            snippet: `function TestComponent${i + 1}() {\n  return <div>Test</div>;\n}`,
          },
        ],
      },
    })),
  };

  console.log('🚀 Starting bulk creation performance test...');
  console.log(`📦 Creating ${payload.issues.length} issues`);
  console.log(`🎯 Target: < 2000ms\n`);

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}/api/issues/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Request failed:', error);
      process.exit(1);
    }

    const result = await response.json();
    const serverDuration = result.data?.durationMs || duration;

    console.log('✅ Bulk creation completed!');
    console.log(`⏱️  Client-measured time: ${duration}ms`);
    console.log(`⏱️  Server-measured time: ${serverDuration}ms`);
    console.log(`📊 Issues created: ${result.data?.created || 0}`);
    console.log(`❌ Issues failed: ${result.data?.failed || 0}\n`);

    if (serverDuration < 2000) {
      console.log(`✅ PASS: Performance requirement met (${serverDuration}ms < 2000ms)`);
      process.exit(0);
    } else {
      console.log(`❌ FAIL: Performance requirement not met (${serverDuration}ms >= 2000ms)`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

testBulkCreation();
