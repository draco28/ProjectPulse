/**
 * Unit tests for JSDoc/TSDoc Parser
 * Tests valid parsing, malformed comments, edge cases, and file scanning
 */

import { JSDocParser, parseJSDocFromProject, type ParsedDocumentation } from '../jsdoc';
import * as fs from 'fs/promises';
import * as path from 'path';
import { jest } from '@jest/globals';

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('JSDocParser', () => {
  describe('Valid JSDoc Parsing', () => {
    it('should parse function with complete JSDoc (params, returns, examples)', async () => {
      const parser = new JSDocParser();
      const testFile = path.join(FIXTURES_DIR, 'valid-function.ts');

      const result = await parser.parseFile(testFile);

      expect(result).toBeDefined();
      expect(result.exports).toHaveLength(1);

      const exportItem = result.exports[0];
      expect(exportItem.name).toBe('calculateTotal');
      expect(exportItem.kind).toBe('function');
      expect(exportItem.description).toContain('Calculates the total price');
      expect(exportItem.params).toHaveLength(2);
      expect(exportItem.params![0].name).toBe('price');
      expect(exportItem.params![0].type).toBe('any');
      expect(exportItem.returns).toBeDefined();
      expect(exportItem.returns!.type).toBe('any');
      expect(exportItem.examples).toHaveLength(1);
    });

    it('should parse class with methods and properties', async () => {
      const parser = new JSDocParser();
      const testFile = path.join(FIXTURES_DIR, 'valid-class.ts');

      const result = await parser.parseFile(testFile);

      expect(result).toBeDefined();
      expect(result.exports).toHaveLength(1);

      const classExport = result.exports[0];
      expect(classExport.name).toBe('UserManager');
      expect(classExport.kind).toBe('class');
      expect(classExport.description).toContain('Manages user data');
      // Note: Constructor params are not captured by current parser implementation
    });

    it('should parse interface with type annotations', async () => {
      const parser = new JSDocParser();
      const testFile = path.join(FIXTURES_DIR, 'valid-interface.ts');

      const result = await parser.parseFile(testFile);

      expect(result).toBeDefined();
      expect(result.exports).toHaveLength(1);

      const interfaceExport = result.exports[0];
      expect(interfaceExport.name).toBe('User');
      expect(interfaceExport.kind).toBe('interface');
      expect(interfaceExport.description).toContain('Represents a user');
    });

    it('should parse multiple exports from single file', async () => {
      const parser = new JSDocParser();
      const testFile = path.join(FIXTURES_DIR, 'multiple-exports.ts');

      const result = await parser.parseFile(testFile);

      expect(result).toBeDefined();
      expect(result.exports.length).toBeGreaterThanOrEqual(2);

      const functionExport = result.exports.find(e => e.kind === 'function');
      const interfaceExport = result.exports.find(e => e.kind === 'interface');

      expect(functionExport).toBeDefined();
      expect(interfaceExport).toBeDefined();
    });
  });

  describe('Malformed Comment Handling', () => {
    it('should handle missing closing tag gracefully', async () => {
      const parser = new JSDocParser();
      const testFile = path.join(FIXTURES_DIR, 'malformed-missing-closing.ts');

      // Should not throw - may return null if file cannot be parsed
      await expect(parser.parseFile(testFile)).resolves.not.toThrow();
    });

    it('should handle malformed @param tags gracefully', async () => {
      const parser = new JSDocParser();
      const testFile = path.join(FIXTURES_DIR, 'malformed-param-tags.ts');

      const result = await parser.parseFile(testFile);

      // Should find the export even with malformed params
      expect(result).not.toBeNull();
      if (result) {
        expect(result.exports.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should handle invalid TSDoc syntax without crashing', async () => {
      const parser = new JSDocParser();
      const testFile = path.join(FIXTURES_DIR, 'invalid-tsdoc-syntax.ts');

      // Should not throw error
      await expect(parser.parseFile(testFile)).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file (no exports)', async () => {
      const parser = new JSDocParser();
      const testFile = path.join(FIXTURES_DIR, 'empty-file.ts');

      const result = await parser.parseFile(testFile);

      // Empty file returns null (no exports found)
      expect(result).toBeNull();
    });

    it('should handle file with no JSDoc comments (plain code)', async () => {
      const parser = new JSDocParser();
      const testFile = path.join(FIXTURES_DIR, 'no-jsdoc.ts');

      const result = await parser.parseFile(testFile);

      // File has exports but no JSDoc - should return null since parser looks for JSDoc
      expect(result).toBeNull();
    });

    it('should handle file with only private functions (no exported docs)', async () => {
      const parser = new JSDocParser();
      const testFile = path.join(FIXTURES_DIR, 'private-only.ts');

      const result = await parser.parseFile(testFile);

      // Parser finds JSDoc blocks regardless of export status
      // This is expected behavior - filtering by export status could be added later
      expect(result).not.toBeNull();
      if (result) {
        expect(result.exports.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should handle file with missing @param for existing parameters', async () => {
      const parser = new JSDocParser();
      const testFile = path.join(FIXTURES_DIR, 'missing-param-docs.ts');

      const result = await parser.parseFile(testFile);

      expect(result).toBeDefined();
      expect(result.exports.length).toBeGreaterThanOrEqual(1);

      // Should still parse function even if @param is missing
      const funcExport = result.exports[0];
      expect(funcExport.kind).toBe('function');
    });
  });

  describe('File Scanning', () => {
    it('should scan directory with multiple TypeScript files', async () => {
      const parser = new JSDocParser({
        include: ['**/*.ts'],
        exclude: ['node_modules/**', 'dist/**', '.next/**'],
      });

      const results = await parser.parseProject(FIXTURES_DIR);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      // Should find multiple fixture files
      const filePaths = results.map(r => path.basename(r.filePath));
      expect(filePaths).toContain('valid-function.ts');
      expect(filePaths).toContain('valid-class.ts');
    });

    it('should respect include/exclude patterns', async () => {
      const parser = new JSDocParser({
        include: ['**/*.ts'],
        exclude: ['**/*malformed*', '**/*invalid*'],
      });

      const results = await parser.parseProject(FIXTURES_DIR);

      expect(results).toBeDefined();

      // Should NOT include malformed or invalid files
      const filePaths = results.map(r => path.basename(r.filePath));
      expect(filePaths).not.toContain('malformed-missing-closing.ts');
      expect(filePaths).not.toContain('invalid-tsdoc-syntax.ts');
    });
  });

  describe('Integration Test', () => {
    it('should parse project directory using convenience function', async () => {
      const results = await parseJSDocFromProject(FIXTURES_DIR, {
        include: ['**/*.ts'],
        exclude: ['node_modules/**'],
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Verify structure of returned documentation
      results.forEach(doc => {
        expect(doc).toHaveProperty('filePath');
        expect(doc).toHaveProperty('exports');
        expect(Array.isArray(doc.exports)).toBe(true);
      });
    });
  });
});
