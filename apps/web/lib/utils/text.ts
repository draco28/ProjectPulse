/**
 * Text utility functions for ProjectPulse
 * Shared across components for consistent text formatting
 */

/**
 * Generate initials from a full name
 * Handles edge cases: emoji, non-ASCII characters, empty names
 *
 * @param name - Full name to convert to initials
 * @returns 2-character initials (uppercase) or 'U' fallback
 *
 * @example
 * generateInitials('John Doe') // 'JD'
 * generateInitials('Alice') // 'AL'
 * generateInitials('👤 User') // 'US' (strips emoji)
 * generateInitials('') // 'U'
 */
export function generateInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'U'; // Fallback for invalid input
  }

  // Remove emoji and non-letter characters, keep only words
  const cleanName = name
    .replace(/[\p{Emoji}\p{Symbol}]/gu, '') // Remove emoji and symbols
    .replace(/[^\p{L}\s]/gu, '') // Keep only letters and spaces
    .trim();

  if (!cleanName) {
    return 'U'; // Fallback if name becomes empty after cleaning
  }

  const words = cleanName.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) {
    return 'U';
  }

  // Get first letter of first two words, or first two letters of single word
  const firstWord = words[0];
  const secondWord = words[1];

  if (!firstWord) {
    return 'U';
  }

  const initials =
    words.length >= 2 && secondWord
      ? (firstWord[0] ?? '') + (secondWord[0] ?? '')
      : firstWord.substring(0, 2);

  return initials.toUpperCase();
}
