import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { templateEngine } from './template-engine';
import { dataExtractorRegistry } from './data-extractors';

/**
 * Sync result interface
 */
export interface SyncResult {
  slug: string;
  path: string;
  status: 'synced' | 'skipped' | 'error';
  message?: string;
  duration: number; // milliseconds
}

/**
 * Sync markdown file (path-agnostic)
 *
 * 1. Extract data from database
 * 2. Render template
 * 3. Calculate content hash
 * 4. Check if content changed
 * 5. Write file (if changed)
 * 6. Update database
 *
 * @param projectId - Project ID (for multi-tenant support)
 * @param slug - Document slug (e.g., "status", "prd")
 * @param options - Optional overrides (templateId, filePath)
 * @returns Sync result
 */
export async function syncMarkdownFile(
  projectId: number,
  slug: string,
  options?: {
    templateId?: string;
    filePath?: string;
  }
): Promise<SyncResult> {
  const startTime = Date.now();

  try {
    // 1. Get markdown file record (or create if doesn't exist)
    let markdownFile = await prisma.markdownFile.findUnique({
      where: { projectId_slug: { projectId, slug } },
    });

    if (!markdownFile) {
      throw new Error(`Markdown file not found: ${slug}`);
    }

    const templateId = options?.templateId ?? markdownFile.templateId;
    const filePath = options?.filePath ?? markdownFile.path;

    // 2. Extract data
    const data = await dataExtractorRegistry.extract(templateId, projectId);

    // 3. Render template
    const content = templateEngine.render(templateId, data);

    // 4. Calculate content hash
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    // 5. Check if content changed
    if (markdownFile.contentHash === contentHash) {
      // Content unchanged, skip write
      return {
        slug,
        path: filePath,
        status: 'skipped',
        message: 'Content unchanged',
        duration: Date.now() - startTime,
      };
    }

    // 6. Write file (path-agnostic, supports any directory)
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    await fs.writeFile(absolutePath, content, 'utf-8');

    // 7. Update database
    await prisma.markdownFile.update({
      where: { projectId_slug: { projectId, slug } },
      data: {
        contentHash,
        lastSyncedAt: new Date(),
      },
    });

    return {
      slug,
      path: filePath,
      status: 'synced',
      message: 'File synced successfully',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      slug,
      path: '',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Sync multiple markdown files
 *
 * @param projectId - Project ID
 * @param filters - Optional filters (category, syncStrategy, slugs)
 * @returns Array of sync results
 */
export async function syncMultipleFiles(
  projectId: number,
  filters?: {
    category?: string;
    syncStrategy?: string;
    slugs?: string[];
  }
): Promise<SyncResult[]> {
  // 1. Query files to sync
  const files = await prisma.markdownFile.findMany({
    where: {
      projectId,
      status: 'active',
      ...(filters?.category && { category: filters.category }),
      ...(filters?.syncStrategy && { syncStrategy: filters.syncStrategy }),
      ...(filters?.slugs && { slug: { in: filters.slugs } }),
    },
  });

  // 2. Sync files in parallel (Promise.all for performance)
  const results = await Promise.all(
    files.map((file) => syncMarkdownFile(projectId, file.slug))
  );

  return results;
}

/**
 * Sync all auto-sync files (triggered by database changes)
 *
 * @param projectId - Project ID
 * @returns Sync results
 */
export async function syncAutoFiles(projectId: number): Promise<SyncResult[]> {
  return syncMultipleFiles(projectId, { syncStrategy: 'auto' });
}
