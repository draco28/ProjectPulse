/**
 * Unit tests for text utility functions
 * Tests edge cases: emoji, empty strings, multiple spaces, case handling
 */

import { generateInitials } from '../text';

describe('generateInitials', () => {
  describe('Basic name formatting', () => {
    it('should return first letter for single name', () => {
      expect(generateInitials('John')).toBe('JO');
    });

    it('should return first letters of first two words for full name', () => {
      expect(generateInitials('John Doe')).toBe('JD');
    });

    it('should handle three or more names by using first two', () => {
      expect(generateInitials('John Michael Doe')).toBe('JM');
    });
  });

  describe('Case handling', () => {
    it('should uppercase lowercase names', () => {
      expect(generateInitials('john doe')).toBe('JD');
    });

    it('should handle mixed case names', () => {
      expect(generateInitials('jOhN dOe')).toBe('JD');
    });
  });

  describe('Whitespace handling', () => {
    it('should handle multiple spaces between names', () => {
      expect(generateInitials('John  Doe')).toBe('JD');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(generateInitials('  John Doe  ')).toBe('JD');
    });

    it('should handle tab characters', () => {
      expect(generateInitials('John\tDoe')).toBe('JD');
    });
  });

  describe('Edge cases', () => {
    it('should return "U" for empty string', () => {
      expect(generateInitials('')).toBe('U');
    });

    it('should return "U" for whitespace-only string', () => {
      expect(generateInitials('   ')).toBe('U');
    });

    it('should return "U" for null input', () => {
      expect(generateInitials(null as any)).toBe('U');
    });

    it('should return "U" for undefined input', () => {
      expect(generateInitials(undefined as any)).toBe('U');
    });

    it('should return "U" for non-string input', () => {
      expect(generateInitials(123 as any)).toBe('U');
    });
  });

  describe('Emoji and special character handling', () => {
    it('should strip emoji from name', () => {
      expect(generateInitials('🔥 Fire User')).toBe('FU');
    });

    it('should strip multiple emoji', () => {
      expect(generateInitials('👤🎉 John Doe')).toBe('JD');
    });

    it('should strip symbols and punctuation', () => {
      expect(generateInitials('John-Doe')).toBe('JO');
    });

    it('should return "U" for emoji-only string', () => {
      expect(generateInitials('🔥🎉')).toBe('U');
    });

    it('should handle names with numbers', () => {
      expect(generateInitials('User123')).toBe('US');
    });
  });

  describe('Non-ASCII character handling', () => {
    it('should handle accented characters', () => {
      expect(generateInitials('José García')).toBe('JG');
    });

    it('should handle Cyrillic characters', () => {
      expect(generateInitials('Иван Петров')).toBe('ИП');
    });

    it('should handle Chinese characters', () => {
      expect(generateInitials('李明')).toBe('李明');
    });

    it('should handle Japanese characters', () => {
      // Space-separated Japanese names: first character of each name
      expect(generateInitials('田中 太郎')).toBe('田太');
    });
  });

  describe('Real-world examples', () => {
    it('should handle "Claude Code" correctly', () => {
      expect(generateInitials('Claude Code')).toBe('CC');
    });

    it('should handle "Agent Smith" correctly', () => {
      expect(generateInitials('Agent Smith')).toBe('AS');
    });

    it('should handle single character names', () => {
      expect(generateInitials('X')).toBe('X');
    });

    it('should handle hyphenated last names', () => {
      expect(generateInitials('Mary Jane Watson-Parker')).toBe('MJ');
    });
  });
});
