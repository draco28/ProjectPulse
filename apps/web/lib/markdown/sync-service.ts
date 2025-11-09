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
  category?: string;
  templateId?: string;
  contentHash?: string;
  status: 'synced' | 'skipped' | 'error';
  message?: string;
  duration: number; // milliseconds
}

/**
 * Generated files registry entry
 */
interface GeneratedFileEntry {
  path: string;
  category: string;
  templateId: string;
  contentHash: string;
  lastGenerated: string;
}

/**
 * Generated files registry structure
 */
interface GeneratedFilesRegistry {
  version: string;
  lastUpdated: string;
  description: string;
  generatedFiles: GeneratedFileEntry[];
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
        category: markdownFile.category,
        templateId,
        contentHash,
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
      category: markdownFile.category,
      templateId,
      contentHash,
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

/**
 * Update generated files registry (.agent/generated-files.json)
 *
 * This registry is used by git hooks to prevent manual edits to auto-generated files.
 * It must be updated after every sync operation.
 *
 * @param results - Sync results containing file metadata
 */
export async function updateGeneratedFilesRegistry(
  results: SyncResult[]
): Promise<void> {
  // Filter out errors and include only synced/skipped files
  const validResults = results.filter(
    (r) => r.status !== 'error' && r.category && r.templateId && r.contentHash
  );

  if (validResults.length === 0) {
    return; // Nothing to update
  }

  const registryPath = path.resolve(process.cwd(), '.agent/generated-files.json');

  // Read existing registry (or create default)
  let registry: GeneratedFilesRegistry;
  try {
    const content = await fs.readFile(registryPath, 'utf-8');
    registry = JSON.parse(content);
  } catch (error) {
    // Registry doesn't exist, create default
    registry = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      description: 'Registry of auto-generated markdown files. Git hooks use this to prevent manual edits.',
      generatedFiles: [],
    };
  }

  // Update registry with new sync results
  const existingPaths = new Set(registry.generatedFiles.map((f) => f.path));

  for (const result of validResults) {
    const entry: GeneratedFileEntry = {
      path: result.path,
      category: result.category!,
      templateId: result.templateId!,
      contentHash: result.contentHash!,
      lastGenerated: new Date().toISOString(),
    };

    if (existingPaths.has(result.path)) {
      // Update existing entry
      const index = registry.generatedFiles.findIndex((f) => f.path === result.path);
      registry.generatedFiles[index] = entry;
    } else {
      // Add new entry
      registry.generatedFiles.push(entry);
      existingPaths.add(result.path);
    }
  }

  // Update timestamp
  registry.lastUpdated = new Date().toISOString();

  // Write registry back to disk
  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
}
