/**
 * Debug MCP Client - Minimal test to understand SDK API
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function testMCPConnection() {
  console.log('🔍 Testing MCP SDK Connection...\n');

  try {
    // Step 1: Create transport
    console.log('Step 1: Creating SSEClientTransport...');
    const transport = new SSEClientTransport(
      new URL('http://192.168.1.15:3001/mcp')
    );
    console.log('✅ Transport created\n');

    // Step 2: Create client
    console.log('Step 2: Creating MCP Client...');
    const client = new Client(
      {
        name: 'debug-test',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
    console.log('✅ Client created\n');

    // Step 3: Connect
    console.log('Step 3: Connecting to server...');
    await client.connect(transport);
    console.log('✅ Connected to server\n');

    // Step 4: Get session info
    console.log('Step 4: Checking session...');
    const sessionId = (transport as any).sessionId;
    console.log(`Session ID: ${sessionId}\n`);

    // Step 5: List tools
    console.log('Step 5: Listing tools...');
    try {
      const result: any = await client.request(
        {
          method: 'tools/list',
          params: {},
        },
        {}  // Empty options
      );

      console.log(`✅ Tools listed: ${result?.tools?.length || 0} tools\n`);

      if (result?.tools) {
        const onboardingTools = result.tools.filter((t: any) =>
          t.name.startsWith('projectpulse.onboarding')
        );
        console.log(`Onboarding tools found: ${onboardingTools.length}`);
        onboardingTools.forEach((t: any) => {
          console.log(`  - ${t.name}`);
        });
      }
    } catch (error) {
      console.error('❌ Error listing tools:', error);
      console.error('Error details:', (error as any).message);
      console.error('Error stack:', (error as any).stack);
    }

    // Step 6: Try calling a tool
    console.log('\nStep 6: Calling health_check tool...');
    try {
      const healthResult: any = await client.request(
        {
          method: 'tools/call',
          params: {
            name: 'projectpulse.health_check',
            arguments: { verbose: true },
          },
        },
        {}
      );

      console.log('✅ Health check result:', JSON.stringify(healthResult, null, 2));
    } catch (error) {
      console.error('❌ Error calling tool:', error);
      console.error('Error details:', (error as any).message);
    }

    // Cleanup
    console.log('\nStep 7: Disconnecting...');
    await client.close();
    console.log('✅ Disconnected\n');

    console.log('✅ All steps completed successfully!');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    console.error('Error message:', (error as any).message);
    console.error('Error stack:', (error as any).stack);
    process.exit(1);
  }
}

testMCPConnection();
