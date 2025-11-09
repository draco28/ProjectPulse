import { z } from 'zod';

/**
 * Data Extractor interface
 * Each extractor must implement this contract
 */
export interface DataExtractor<TOutput = unknown> {
  id: string; // Matches templateId (e.g., "status-template")
  name: string; // Display name
  description: string; // Purpose description
  outputSchema: z.ZodSchema<TOutput>; // Zod schema for output validation
  extract(projectId: number): Promise<TOutput>; // Async extraction (Prisma queries)
}

/**
 * Data Extractor Registry (Singleton)
 * Manages extractor registration and execution
 */
export class DataExtractorRegistry {
  private extractors = new Map<string, DataExtractor>();

  /**
   * Register an extractor
   * Call at module load (apps/web/lib/markdown/extractors/index.ts)
   */
  register<TOutput>(extractor: DataExtractor<TOutput>): void {
    if (this.extractors.has(extractor.id)) {
      throw new Error(`Extractor already registered: ${extractor.id}`);
    }
    this.extractors.set(extractor.id, extractor);
  }

  /**
   * Extract data for a template
   * Validates output against schema before returning
   */
  async extract<TOutput>(extractorId: string, projectId: number): Promise<TOutput> {
    const extractor = this.extractors.get(extractorId);
    if (!extractor) {
      throw new Error(`Extractor not found: ${extractorId}`);
    }

    // Extract data (async Prisma queries)
    const data = await extractor.extract(projectId);

    // Validate output against schema
    const validationResult = extractor.outputSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(
        `Invalid output from extractor ${extractorId}: ${validationResult.error.message}`
      );
    }

    return validationResult.data as TOutput;
  }

  /**
   * Get all registered extractor IDs
   */
  getExtractorIds(): string[] {
    return Array.from(this.extractors.keys());
  }

  /**
   * Check if extractor exists
   */
  hasExtractor(extractorId: string): boolean {
    return this.extractors.has(extractorId);
  }

  /**
   * Clear all extractors (for testing)
   */
  clear(): void {
    this.extractors.clear();
  }
}

// Singleton instance
export const dataExtractorRegistry = new DataExtractorRegistry();
