#!/usr/bin/env node

/**
 * Sync Markdown Files Script
 *
 * Triggers markdown sync from command line.
 * Calls the /api/markdown/sync endpoint.
 */

async function syncMarkdown() {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://192.168.1.15:3000';
  const endpoint = `${apiUrl}/api/markdown/sync`;

  console.log('🔄 Syncing markdown files from database...');
  console.log(`   Endpoint: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: undefined, // Sync all categories
        force: false, // Skip unchanged files
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('');
    console.log('✅ Markdown sync complete!');
    console.log(`   Synced: ${result.syncedCount} file(s)`);
    console.log(`   Skipped: ${result.skippedCount} file(s) (unchanged)`);
    console.log(`   Errors: ${result.errorCount} file(s)`);
    console.log(`   Duration: ${result.duration}ms`);

    if (result.files && result.files.length > 0) {
      console.log('');
      console.log('Files updated:');
      result.files.forEach((file) => {
        const icon = file.status === 'synced' ? '✓' : file.status === 'skipped' ? '○' : '✗';
        console.log(`   ${icon} ${file.path} (${file.duration}ms)`);
      });
    }

    process.exit(result.errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('');
    console.error('❌ Markdown sync failed:', error.message);
    process.exit(1);
  }
}

syncMarkdown();
