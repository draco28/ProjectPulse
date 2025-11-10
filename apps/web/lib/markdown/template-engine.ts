import Handlebars from 'handlebars';
import { z } from 'zod';

/**
 * Template interface
 * Each template must implement this contract
 */
export interface Template<TData = unknown> {
  id: string; // Unique ID (e.g., "status-template")
  name: string; // Display name (e.g., "Project Status")
  description: string; // Purpose description
  schema: z.ZodSchema<TData>; // Zod schema for data validation
  render(data: TData): string; // Render function (Handlebars compilation)
}

/**
 * Template Engine (Singleton)
 * Manages template registration and rendering
 */
export class TemplateEngine {
  private templates = new Map<string, Template>();
  private compiledTemplates = new Map<string, HandlebarsTemplateDelegate>();

  /**
   * Register a template
   * Call at module load (apps/web/lib/markdown/templates/index.ts)
   */
  register<TData>(template: Template<TData>): void {
    if (this.templates.has(template.id)) {
      throw new Error(`Template already registered: ${template.id}`);
    }
    this.templates.set(template.id, template);
  }

  /**
   * Render a template with data
   * Validates data against schema before rendering
   */
  render<TData>(templateId: string, data: TData): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate data against schema
    const validationResult = template.schema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(
        `Invalid data for template ${templateId}: ${validationResult.error.message}`
      );
    }

    // Render template
    return template.render(validationResult.data as TData);
  }

  /**
   * Get all registered template IDs
   * For discovery and debugging
   */
  getTemplateIds(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if template exists
   */
  hasTemplate(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  /**
   * Clear all templates (for testing)
   */
  clear(): void {
    this.templates.clear();
    this.compiledTemplates.clear();
  }
}

// Singleton instance (exported for app-wide use)
export const templateEngine = new TemplateEngine();
