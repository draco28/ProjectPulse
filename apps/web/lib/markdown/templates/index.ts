import { templateEngine } from '../template-engine';
import { statusTemplate } from './status-template';

/**
 * Register all templates at module load
 * This runs once when the app starts (before first request)
 */
templateEngine.register(statusTemplate);

// EPIC-012: Add 13 more templates here
// templateEngine.register(prdTemplate);
// templateEngine.register(srsTemplate);
// templateEngine.register(architectureTemplate);
// ... (10 more)

/**
 * Export for convenience (optional)
 */
export { statusTemplate };
