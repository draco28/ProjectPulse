/**
 * JSDoc/TSDoc Parser for Wiki Auto-Generation
 *
 * This module scans TypeScript and JavaScript files for JSDoc/TSDoc comments
 * and extracts structured documentation data that can be converted to markdown
 * wiki pages.
 *
 * Uses @microsoft/tsdoc for parsing JSDoc blocks.
 *
 * @module lib/wiki/parsers/jsdoc
 */

import { TSDocParser, DocComment, type ParserContext } from '@microsoft/tsdoc';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Represents a parameter in a function or method
 */
export interface ParsedParameter {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
  defaultValue?: string;
}

/**
 * Represents a return type documentation
 */
export interface ParsedReturn {
  type: string;
  description: string;
}

/**
 * Represents a code example from JSDoc
 */
export interface ParsedExample {
  code: string;
  caption?: string;
}

/**
 * Represents a parsed export from a source file
 */
export interface ParsedExport {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'const' | 'enum';
  description: string;
  params?: ParsedParameter[];
  returns?: ParsedReturn;
  examples?: ParsedExample[];
  deprecated?: string;
  see?: string[];
  since?: string;
  remarks?: string;
  typeParameters?: string[];
}

/**
 * Represents parsed documentation from a single file
 */
export interface ParsedDocumentation {
  fileName: string;
  filePath: string;
  exports: ParsedExport[];
  fileDescription?: string;
  lastModified: Date;
}

/**
 * Configuration options for the JSDoc parser
 */
export interface JSDocParserOptions {
  /** Base directory to scan (default: current working directory) */
  basePath?: string;
  /** File patterns to include (default: TypeScript and JavaScript files) */
  include?: string[];
  /** File patterns to exclude (default: node_modules, dist, build) */
  exclude?: string[];
  /** Whether to include private exports (default: false) */
  includePrivate?: boolean;
}

/**
 * JSDoc Parser Class
 *
 * Scans source files and extracts JSDoc documentation using @microsoft/tsdoc parser.
 *
 * @example
 * ```typescript
 * const parser = new JSDocParser();
 * const docs = await parser.parseProject('/path/to/project');
 * console.log(`Found ${docs.length} documented files`);
 * ```
 */
export class JSDocParser {
  private tsdocParser: TSDocParser;
  private options: Required<JSDocParserOptions>;

  constructor(options: JSDocParserOptions = {}) {
    this.tsdocParser = new TSDocParser();
    this.options = {
      basePath: options.basePath || process.cwd(),
      include: options.include || ['**/*.{ts,tsx,js,jsx}'],
      exclude: options.exclude || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
      ],
      includePrivate: options.includePrivate ?? false,
    };
  }

  /**
   * Parse all source files in the project
   *
   * @param projectPath - Path to the project directory to scan
   * @returns Array of parsed documentation for each file
   *
   * @example
   * ```typescript
   * const parser = new JSDocParser();
   * const docs = await parser.parseProject('./src');
   * ```
   */
  async parseProject(projectPath: string): Promise<ParsedDocumentation[]> {
    const resolvedPath = path.resolve(this.options.basePath, projectPath);

    // Find all matching source files
    const files = await this.findSourceFiles(resolvedPath);

    // Parse each file
    const results: ParsedDocumentation[] = [];
    for (const filePath of files) {
      try {
        const doc = await this.parseFile(filePath);
        if (doc && doc.exports.length > 0) {
          results.push(doc);
        }
      } catch (error) {
        console.warn(`Failed to parse ${filePath}:`, error);
        // Continue parsing other files
      }
    }

    return results;
  }

  /**
   * Parse a single source file
   *
   * @param filePath - Path to the source file
   * @returns Parsed documentation or null if file has no exports
   */
  async parseFile(filePath: string): Promise<ParsedDocumentation | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);

    const exports = this.extractExports(content, filePath);

    if (exports.length === 0) {
      return null;
    }

    return {
      fileName: path.basename(filePath),
      filePath: filePath,
      exports,
      lastModified: stats.mtime,
    };
  }

  /**
   * Extract JSDoc documentation from source code
   *
   * @param content - Source code content
   * @param filePath - Path to the file (for error messages)
   * @returns Array of parsed exports
   */
  private extractExports(content: string, filePath: string): ParsedExport[] {
    const exports: ParsedExport[] = [];

    // Regex to match JSDoc blocks followed by export declarations
    const jsdocBlockRegex =
      /\/\*\*[\s\S]*?\*\/\s*(?:export\s+)?(?:const|function|class|interface|type|enum)\s+(\w+)/g;

    let match;
    while ((match = jsdocBlockRegex.exec(content)) !== null) {
      const fullMatch = match[0]!;
      const exportName = match[1]!;

      // Extract the JSDoc comment block
      const jsdocMatch = fullMatch.match(/\/\*\*([\s\S]*?)\*\//);
      if (!jsdocMatch) continue;

      const jsdocText = `/**${jsdocMatch[1]}*/`;

      try {
        const parsedExport = this.parseJSDocBlock(jsdocText, exportName, fullMatch);
        if (parsedExport) {
          exports.push(parsedExport);
        }
      } catch (error) {
        console.warn(`Failed to parse JSDoc for ${exportName} in ${filePath}:`, error);
      }
    }

    return exports;
  }

  /**
   * Parse a single JSDoc block using @microsoft/tsdoc
   *
   * @param jsdocText - JSDoc comment text
   * @param exportName - Name of the export
   * @param fullDeclaration - Full declaration text (for determining kind)
   * @returns Parsed export or null if parsing fails
   */
  private parseJSDocBlock(
    jsdocText: string,
    exportName: string,
    fullDeclaration: string
  ): ParsedExport | null {
    // Parse with TSDoc
    const parserContext: ParserContext = this.tsdocParser.parseString(jsdocText);
    const docComment: DocComment = parserContext.docComment;

    // Determine export kind
    const kind = this.determineExportKind(fullDeclaration);

    // Extract description (summary section)
    const description = this.extractSummary(docComment);

    // Extract parameters (for functions)
    const params = this.extractParameters(docComment);

    // Extract return type (for functions)
    const returns = this.extractReturns(docComment);

    // Extract examples
    const examples = this.extractExamples(docComment);

    // Extract other tags
    const deprecated = this.extractDeprecated(docComment);
    const see = this.extractSeeReferences(docComment);
    const since = this.extractSince(docComment);
    const remarks = this.extractRemarks(docComment);

    return {
      name: exportName,
      kind,
      description: description || `${exportName} (no description available)`,
      params: params.length > 0 ? params : undefined,
      returns: returns || undefined,
      examples: examples.length > 0 ? examples : undefined,
      deprecated: deprecated || undefined,
      see: see.length > 0 ? see : undefined,
      since: since || undefined,
      remarks: remarks || undefined,
    };
  }

  /**
   * Determine the kind of export from the declaration
   */
  private determineExportKind(declaration: string): ParsedExport['kind'] {
    if (declaration.includes('function')) return 'function';
    if (declaration.includes('class')) return 'class';
    if (declaration.includes('interface')) return 'interface';
    if (declaration.includes('type')) return 'type';
    if (declaration.includes('enum')) return 'enum';
    return 'const';
  }

  /**
   * Helper method to extract plain text from TSDoc nodes
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TSDoc library nodes are dynamically typed
  private extractTextFromNodes(nodes: readonly any[]): string {
    return nodes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TSDoc node types vary by kind
      .map((node: any) => {
        if (node.kind === 'Paragraph') {
          return this.extractTextFromNodes(node.getChildNodes());
        } else if (node.kind === 'PlainText') {
          return node.text || '';
        } else if (node.kind === 'CodeSpan') {
          return `\`${node.code || ''}\``;
        } else if (node.kind === 'SoftBreak') {
          return ' ';
        } else if (node.getChildNodes) {
          return this.extractTextFromNodes(node.getChildNodes());
        }
        return '';
      })
      .join('')
      .trim();
  }

  /**
   * Extract summary description from DocComment
   */
  private extractSummary(docComment: DocComment): string {
    if (!docComment.summarySection) return '';

    return this.extractTextFromNodes(docComment.summarySection.getChildNodes());
  }

  /**
   * Extract parameters from @param tags
   */
  private extractParameters(docComment: DocComment): ParsedParameter[] {
    const params: ParsedParameter[] = [];

    for (const paramBlock of docComment.params.blocks) {
      const paramName = paramBlock.parameterName;
      const description = this.extractTextFromNodes(paramBlock.content.getChildNodes());

      params.push({
        name: paramName,
        type: 'any', // Type extraction requires TypeScript compiler API
        description: description || '(no description)',
        optional: paramName.endsWith('?'),
      });
    }

    return params;
  }

  /**
   * Extract return type from @returns tag
   */
  private extractReturns(docComment: DocComment): ParsedReturn | null {
    if (!docComment.returnsBlock) return null;

    const description = this.extractTextFromNodes(docComment.returnsBlock.content.getChildNodes());

    return {
      type: 'any', // Type extraction requires TypeScript compiler API
      description: description || '(no description)',
    };
  }

  /**
   * Extract code examples from @example tags
   */
  private extractExamples(docComment: DocComment): ParsedExample[] {
    const examples: ParsedExample[] = [];

    for (const customBlock of docComment.customBlocks) {
      if (customBlock.blockTag.tagName === '@example') {
        const code = this.extractTextFromNodes(customBlock.content.getChildNodes());

        examples.push({ code });
      }
    }

    return examples;
  }

  /**
   * Extract @deprecated tag content
   */
  private extractDeprecated(docComment: DocComment): string | null {
    if (!docComment.deprecatedBlock) return null;

    return this.extractTextFromNodes(docComment.deprecatedBlock.content.getChildNodes());
  }

  /**
   * Extract @see references
   */
  private extractSeeReferences(docComment: DocComment): string[] {
    const refs: string[] = [];

    for (const customBlock of docComment.customBlocks) {
      if (customBlock.blockTag.tagName === '@see') {
        const ref = this.extractTextFromNodes(customBlock.content.getChildNodes());
        if (ref) refs.push(ref);
      }
    }

    return refs;
  }

  /**
   * Extract @since tag content
   */
  private extractSince(docComment: DocComment): string | null {
    for (const customBlock of docComment.customBlocks) {
      if (customBlock.blockTag.tagName === '@since') {
        return this.extractTextFromNodes(customBlock.content.getChildNodes());
      }
    }
    return null;
  }

  /**
   * Extract remarks section
   */
  private extractRemarks(docComment: DocComment): string | null {
    if (!docComment.remarksBlock) return null;

    return this.extractTextFromNodes(docComment.remarksBlock.content.getChildNodes());
  }

  /**
   * Find all source files matching the configured patterns
   */
  private async findSourceFiles(basePath: string): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of this.options.include) {
      const matches = await glob(pattern, {
        cwd: basePath,
        ignore: this.options.exclude,
        absolute: true,
      });
      files.push(...matches);
    }

    return Array.from(new Set(files)); // Deduplicate
  }
}

/**
 * Convenience function to parse a project directory
 *
 * @param projectPath - Path to the project directory
 * @param options - Parser options
 * @returns Array of parsed documentation
 *
 * @example
 * ```typescript
 * const docs = await parseJSDocFromProject('./src');
 * console.log(`Found ${docs.length} documented files`);
 * ```
 */
export async function parseJSDocFromProject(
  projectPath: string,
  options?: JSDocParserOptions
): Promise<ParsedDocumentation[]> {
  const parser = new JSDocParser(options);
  return parser.parseProject(projectPath);
}
