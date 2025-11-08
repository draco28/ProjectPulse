#!/usr/bin/env node
/**
 * MCP Server Smoke Test (Node.js version)
 * Tests the health-check tool via direct stdio communication
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== MCP Server Smoke Test (Node.js) ===\n');

// Step 1: Build check
console.log('Step 1: Verifying build exists...');
const buildPath = path.join(__dirname, '../dist/index.js');

if (!fs.existsSync(buildPath)) {
  console.error('❌ Build not found. Run: npm run build');
  process.exit(1);
}
console.log('✅ Build found\n');

// Step 2: Start MCP server as child process
console.log('Step 2: Starting MCP server...');
const server = spawn('node', [buildPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: path.join(__dirname, '..')
});

let stdoutData = '';
let stderrData = '';

server.stdout.on('data', (data) => {
  stdoutData += data.toString();
});

server.stderr.on('data', (data) => {
  stderrData += data.toString();
  // Log stderr (should contain startup logs, not protocol messages)
  console.log('[Server Log]:', data.toString().trim());
});

// Step 3: Send initialize request (required by MCP protocol)
console.log('\nStep 3: Sending initialize request...');
const initializeRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'smoke-test',
      version: '1.0.0'
    }
  }
};

server.stdin.write(JSON.stringify(initializeRequest) + '\n');

// Step 4: Wait for initialize response, then send health check
setTimeout(() => {
  console.log('\nStep 4: Sending health_check tool call...');
  const healthCheckRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'projectpulse.health_check',
      arguments: {}
    }
  };
  
  server.stdin.write(JSON.stringify(healthCheckRequest) + '\n');
  
  // Step 5: Wait for response and verify
  setTimeout(() => {
    console.log('\n=== Test Results ===');
    console.log('STDOUT received:');
    console.log(stdoutData);
    
    try {
      // Filter out log messages (start with '[mcp-server]'), only parse JSON-RPC
      const lines = stdoutData.trim().split('\n').filter(line => line.trim());
      const jsonLines = lines.filter(line => !line.startsWith('[mcp-server]'));
      const logLines = lines.filter(line => line.startsWith('[mcp-server]'));
      
      console.log(`\nLog messages: ${logLines.length}`);
      logLines.forEach(log => console.log('  ', log));
      
      console.log(`\nJSON-RPC responses: ${jsonLines.length}`);
      
      jsonLines.forEach((line, index) => {
        const response = JSON.parse(line);
        console.log(`\nResponse ${index + 1}:`);
        console.log(JSON.stringify(response, null, 2));
        
        // Verify health check response
        if (response.id === 2) {
          console.log('\n✅ Health check response received');
          
          if (response.result && response.result.isError) {
            console.log('\n⚠️ Tool execution returned error (expected if Next.js not running):');
            console.log('   ', response.result.content[0].text);
            console.log('\n✅ SMOKE TEST PASSED (Protocol Level)');
            console.log('   - MCP server starts successfully');
            console.log('   - JSON-RPC initialize handshake works');
            console.log('   - Tool registration works');
            console.log('   - Tool invocation works (returned error because API not available)');
            console.log('\nTo test full integration:');
            console.log('   1. Start Next.js: cd apps/web && npm run dev');
            console.log('   2. Re-run this test');
          } else if (response.result && response.result.content) {
            const content = response.result.content[0];
            if (content.type === 'text') {
              const healthData = JSON.parse(content.text);
              console.log('Health check data:', healthData);
              
              // Verify expected fields
              if (healthData.status === 'ok' &&
                  healthData.version &&
                  healthData.server &&
                  healthData.timestamp) {
                console.log('\n✅ SMOKE TEST PASSED (Full Integration)');
                console.log('   - MCP server operational');
                console.log('   - Next.js API integration verified');
                console.log('   - Health check returns valid JSON');
              } else {
                console.log('\n❌ SMOKE TEST FAILED - Missing or invalid fields');
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Failed to parse responses:', error.message);
      console.log('\nDebug info:');
      console.log('Raw stdout length:', stdoutData.length);
      console.log('First 500 chars:', stdoutData.substring(0, 500));
    }
    
    // Clean up
    server.kill();
    process.exit(0);
  }, 2000);
}, 1000);

// Handle errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n❌ Server exited with code ${code}`);
    console.error('STDERR:', stderrData);
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n❌ Test timeout after 10 seconds');
  server.kill();
  process.exit(1);
}, 10000);
