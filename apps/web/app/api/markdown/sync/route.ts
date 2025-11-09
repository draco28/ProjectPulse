import { NextRequest, NextResponse } from 'next/server';
import {
  syncMultipleFiles,
  updateGeneratedFilesRegistry,
  type SyncResult,
} from '@/lib/markdown/sync-service';

// CRITICAL: Import to trigger template and extractor registration
import '@/lib/markdown/templates';
import '@/lib/markdown/extractors';

/**
 * POST /api/markdown/sync
 *
 * Sync markdown files from database to filesystem.
 *
 * Request body:
 * - category?: string - Filter by category ('tracking', 'industry_doc', 'memory_bank')
 * - force?: boolean - Force sync even if content hash matches
 *
 * Response:
 * - syncedCount: number - Number of files successfully synced
 * - skippedCount: number - Number of files skipped (unchanged)
 * - errorCount: number - Number of files that failed
 * - duration: number - Total duration in milliseconds
 * - files: Array<{ slug, path, status, duration }> - Per-file results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, force = false } = body;

    // Default projectId = 1 (single-tenant for now)
    const projectId = 1;

    const startTime = Date.now();

    // Sync files based on filters
    const results: SyncResult[] = await syncMultipleFiles(projectId, {
      category,
      ...(force && { syncStrategy: undefined }), // Force all files if force=true
    });

    // Update generated files registry
    await updateGeneratedFilesRegistry(results);

    // Calculate statistics
    const syncedCount = results.filter((r) => r.status === 'synced').length;
    const skippedCount = results.filter((r) => r.status === 'skipped').length;
    const errorCount = results.filter((r) => r.status === 'error').length;
    const totalDuration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      syncedCount,
      skippedCount,
      errorCount,
      duration: totalDuration,
      files: results.map((r) => ({
        slug: r.slug,
        path: r.path,
        status: r.status,
        message: r.message,
        duration: r.duration,
      })),
    });
  } catch (error) {
    console.error('[API] Markdown sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
