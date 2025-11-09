import { dataExtractorRegistry } from '../data-extractors';
import { statusExtractor } from './status-extractor';

/**
 * Register all extractors at module load
 */
dataExtractorRegistry.register(statusExtractor);

// EPIC-012: Add 13 more extractors
// dataExtractorRegistry.register(prdExtractor);
// dataExtractorRegistry.register(srsExtractor);
// ... (11 more)

export { statusExtractor };
