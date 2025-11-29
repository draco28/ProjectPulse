/**
 * Markdown Generator for Wiki Auto-Generation
 *
 * Converts parsed JSDoc documentation into markdown format suitable for wiki pages
 *
 * @module lib/wiki/generators/markdown
 */

import type { ParsedDocumentation, ParsedExport, ParsedParameter, ParsedReturn } from '../parsers/jsdoc';

/**
 * Options for markdown generation
 */
export interface MarkdownGeneratorOptions {
  /** Include table of contents (default: true) */
  includeToc?: boolean;
  /** Include source file path (default: true) */
  includeFilePath?: boolean;
  /** Maximum heading level (default: 2) */
  maxHeadingLevel?: number;
}

/**
 * Generates markdown documentation from parsed JSDoc
 *
 * @param docs - Parsed documentation from JSDoc parser
 * @param options - Markdown generation options
 * @returns Markdown string
 *
 * @example
 * ```typescript
 * const docs = await parseJSDocFromProject('./src');
 * const markdown = generateMarkdown(docs[0]);
 * ```
 */
export function generateMarkdown(
  doc: ParsedDocumentation,
  options: MarkdownGeneratorOptions = {}
): string {
  const {
    includeToc = true,
    includeFilePath = true,
    maxHeadingLevel = 2,
  } = options;

  const sections: string[] = [];

  // Title (use filename as title)
  const title = doc.fileName.replace(/\.(ts|tsx|js|jsx)$/, '');
  sections.push(`# ${title}\n`);

  // File path
  if (includeFilePath) {
    sections.push(`**Source**: \`${doc.filePath}\`\n`);
  }

  // Last modified
  sections.push(`**Last Modified**: ${doc.lastModified.toLocaleDateString()}\n`);

  // File description (if available)
  if (doc.fileDescription) {
    sections.push(`${doc.fileDescription}\n`);
  }

  // Table of contents
  if (includeToc && doc.exports.length > 1) {
    sections.push(generateTableOfContents(doc.exports));
  }

  // Generate section for each export
  for (const exportItem of doc.exports) {
    sections.push(generateExportSection(exportItem, maxHeadingLevel));
  }

  return sections.join('\n');
}

/**
 * Generates a table of contents from exports
 */
function generateTableOfContents(exports: ParsedExport[]): string {
  const lines: string[] = ['## Table of Contents\n'];

  for (const exp of exports) {
    const anchor = exp.name.toLowerCase().replace(/\s+/g, '-');
    const icon = getExportIcon(exp.kind);
    lines.push(`- ${icon} [${exp.name}](#${anchor})`);
  }

  lines.push(''); // Empty line after TOC
  return lines.join('\n');
}

/**
 * Gets an emoji icon for the export kind
 */
function getExportIcon(kind: ParsedExport['kind']): string {
  const icons: Record<ParsedExport['kind'], string> = {
    function: '🔧',
    class: '📦',
    interface: '📋',
    type: '🏷️',
    const: '📌',
    enum: '🔢',
  };
  return icons[kind] || '📄';
}

/**
 * Generates markdown section for a single export
 */
function generateExportSection(exp: ParsedExport, headingLevel: number): string {
  const sections: string[] = [];
  const heading = '#'.repeat(headingLevel);

  // Export header with kind badge
  const kindBadge = `\`${exp.kind}\``;
  sections.push(`${heading} ${exp.name} ${kindBadge}\n`);

  // Deprecation notice
  if (exp.deprecated) {
    sections.push(`> ⚠️ **Deprecated**: ${exp.deprecated}\n`);
  }

  // Description
  if (exp.description) {
    sections.push(`${exp.description}\n`);
  }

  // Since version
  if (exp.since) {
    sections.push(`**Since**: ${exp.since}\n`);
  }

  // Parameters table
  if (exp.params && exp.params.length > 0) {
    sections.push(generateParametersTable(exp.params));
  }

  // Returns section
  if (exp.returns) {
    sections.push(generateReturnsSection(exp.returns));
  }

  // Examples
  if (exp.examples && exp.examples.length > 0) {
    sections.push(generateExamplesSection(exp.examples));
  }

  // Remarks
  if (exp.remarks) {
    sections.push(`### Remarks\n\n${exp.remarks}\n`);
  }

  // See also
  if (exp.see && exp.see.length > 0) {
    sections.push(generateSeeAlsoSection(exp.see));
  }

  return sections.join('\n');
}

/**
 * Generates a parameters table
 */
function generateParametersTable(params: ParsedParameter[]): string {
  const lines: string[] = [
    '### Parameters\n',
    '| Name | Type | Description | Required |',
    '|------|------|-------------|----------|',
  ];

  for (const param of params) {
    const required = param.optional ? 'No' : 'Yes';
    const description = param.description || '(no description)';
    const defaultVal = param.defaultValue ? ` (default: \`${param.defaultValue}\`)` : '';

    lines.push(`| \`${param.name}\` | \`${param.type}\` | ${description}${defaultVal} | ${required} |`);
  }

  lines.push(''); // Empty line after table
  return lines.join('\n');
}

/**
 * Generates returns section
 */
function generateReturnsSection(returns: ParsedReturn): string {
  return `### Returns\n\n**Type**: \`${returns.type}\`\n\n${returns.description}\n`;
}

/**
 * Generates examples section
 */
function generateExamplesSection(examples: { code: string; caption?: string }[]): string {
  const lines: string[] = ['### Examples\n'];

  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    if (!example) continue;

    if (example.caption) {
      lines.push(`**${example.caption}**\n`);
    } else if (examples.length > 1) {
      lines.push(`**Example ${i + 1}**\n`);
    }

    // Check if code already has markdown code fence
    if (example.code.startsWith('```')) {
      lines.push(example.code);
    } else {
      lines.push('```typescript');
      lines.push(example.code);
      lines.push('```');
    }

    lines.push(''); // Empty line between examples
  }

  return lines.join('\n');
}

/**
 * Generates see also section
 */
function generateSeeAlsoSection(seeRefs: string[]): string {
  const lines: string[] = ['### See Also\n'];

  for (const ref of seeRefs) {
    lines.push(`- ${ref}`);
  }

  lines.push(''); // Empty line after list
  return lines.join('\n');
}

/**
 * Generates a complete wiki page slug from file path
 *
 * @param filePath - Source file path
 * @returns URL-friendly slug
 *
 * @example
 * ```typescript
 * generateSlug('/src/utils/text.ts') // returns 'utils-text'
 * ```
 */
export function generateSlug(filePath: string): string {
  // Extract filename without extension
  const filename = filePath.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || 'untitled';

  // Get directory path (last segment)
  const pathParts = filePath.split('/');
  const dirName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '';

  // Combine directory and filename
  const combined = dirName ? `${dirName}-${filename}` : filename;

  // Convert to slug format
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates an excerpt from markdown content
 *
 * @param markdown - Markdown content
 * @param maxLength - Maximum excerpt length (default: 200)
 * @returns Plain text excerpt
 */
export function generateExcerpt(markdown: string, maxLength: number = 200): string {
  // Remove markdown formatting
  let plain = markdown
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/>\s+/g, '') // Remove blockquotes
    .trim();

  // Get first paragraph
  const firstPara = plain.split('\n\n')[0] ?? '';

  // Truncate to maxLength
  if (firstPara.length > maxLength) {
    return firstPara.substring(0, maxLength).trim() + '...';
  }

  return firstPara;
}
