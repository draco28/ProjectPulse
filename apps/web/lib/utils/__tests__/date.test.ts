/**
 * Unit tests for date utility functions
 * Tests edge cases: future dates, invalid dates, boundary conditions
 */

import { formatRelativeTime, formatShortDate } from '../date';

describe('formatRelativeTime', () => {
  // Save original Date to restore after tests
  const RealDate = Date;

  // Helper to create a mock date
  const mockDate = (isoString: string) => {
    const mockNow = new Date(isoString);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Date constructor mock requires dynamic typing
    global.Date = class extends RealDate {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Date constructor accepts variable args
      constructor(...args: any[]) {
        if (args.length === 0) {
          super();
          return mockNow;
        }
        return new RealDate(...args);
      }
      static now() {
        return mockNow.getTime();
      }
    } as DateConstructor;
  };

  afterEach(() => {
    // Restore real Date after each test
    global.Date = RealDate;
  });

  describe('Past dates - seconds and minutes', () => {
    beforeEach(() => {
      mockDate('2025-11-11T12:00:00Z');
    });

    it('should return "just now" for dates less than 1 minute ago', () => {
      expect(formatRelativeTime('2025-11-11T11:59:30Z')).toBe('just now');
    });

    it('should return "1 minute ago" for exactly 1 minute', () => {
      expect(formatRelativeTime('2025-11-11T11:59:00Z')).toBe('1 minute ago');
    });

    it('should return "2 minutes ago" for 2 minutes', () => {
      expect(formatRelativeTime('2025-11-11T11:58:00Z')).toBe('2 minutes ago');
    });

    it('should return "30 minutes ago" for 30 minutes', () => {
      expect(formatRelativeTime('2025-11-11T11:30:00Z')).toBe('30 minutes ago');
    });

    it('should return "59 minutes ago" for just under an hour', () => {
      expect(formatRelativeTime('2025-11-11T11:01:00Z')).toBe('59 minutes ago');
    });
  });

  describe('Past dates - hours', () => {
    beforeEach(() => {
      mockDate('2025-11-11T12:00:00Z');
    });

    it('should return "1 hour ago" for exactly 1 hour', () => {
      expect(formatRelativeTime('2025-11-11T11:00:00Z')).toBe('1 hour ago');
    });

    it('should return "2 hours ago" for 2 hours', () => {
      expect(formatRelativeTime('2025-11-11T10:00:00Z')).toBe('2 hours ago');
    });

    it('should return "23 hours ago" for just under a day', () => {
      expect(formatRelativeTime('2025-11-10T13:00:00Z')).toBe('23 hours ago');
    });
  });

  describe('Past dates - days', () => {
    beforeEach(() => {
      mockDate('2025-11-11T12:00:00Z');
    });

    it('should return "1 day ago" for exactly 1 day', () => {
      expect(formatRelativeTime('2025-11-10T12:00:00Z')).toBe('1 day ago');
    });

    it('should return "2 days ago" for 2 days', () => {
      expect(formatRelativeTime('2025-11-09T12:00:00Z')).toBe('2 days ago');
    });

    it('should return "6 days ago" for just under a week', () => {
      expect(formatRelativeTime('2025-11-05T12:00:00Z')).toBe('6 days ago');
    });
  });

  describe('Past dates - old dates (more than a week)', () => {
    beforeEach(() => {
      mockDate('2025-11-11T12:00:00Z');
    });

    it('should return formatted date for dates more than a week ago', () => {
      const result = formatRelativeTime('2025-11-01T12:00:00Z');
      expect(result).toBe('Nov 1, 2025');
    });

    it('should return formatted date for dates from last year', () => {
      const result = formatRelativeTime('2024-11-11T12:00:00Z');
      expect(result).toBe('Nov 11, 2024');
    });

    it('should return formatted date for very old dates', () => {
      const result = formatRelativeTime('2020-01-01T00:00:00Z');
      expect(result).toBe('Jan 1, 2020');
    });
  });

  describe('Future dates', () => {
    beforeEach(() => {
      mockDate('2025-11-11T12:00:00Z');
    });

    it('should return "in X minutes" for future dates within an hour', () => {
      expect(formatRelativeTime('2025-11-11T12:30:00Z')).toBe('in 30 minutes');
    });

    it('should return "in 1 minute" for exactly 1 minute in future', () => {
      expect(formatRelativeTime('2025-11-11T12:01:00Z')).toBe('in 1 minute');
    });

    it('should return "in X hours" for future dates within a day', () => {
      expect(formatRelativeTime('2025-11-11T15:00:00Z')).toBe('in 3 hours');
    });

    it('should return "in 1 hour" for exactly 1 hour in future', () => {
      expect(formatRelativeTime('2025-11-11T13:00:00Z')).toBe('in 1 hour');
    });

    it('should return "in X days" for future dates within a week', () => {
      expect(formatRelativeTime('2025-11-13T12:00:00Z')).toBe('in 2 days');
    });

    it('should return "in 1 day" for exactly 1 day in future', () => {
      expect(formatRelativeTime('2025-11-12T12:00:00Z')).toBe('in 1 day');
    });

    it('should return formatted date for future dates more than a week away', () => {
      const result = formatRelativeTime('2025-11-25T12:00:00Z');
      expect(result).toBe('Nov 25, 2025');
    });
  });

  describe('Invalid input handling', () => {
    it('should return "Invalid date" for invalid ISO string', () => {
      expect(formatRelativeTime('invalid-date')).toBe('Invalid date');
    });

    it('should return "Unknown date" for empty string', () => {
      expect(formatRelativeTime('')).toBe('Unknown date');
    });

    it('should return "Unknown date" for null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing runtime safety with invalid input
      expect(formatRelativeTime(null as any)).toBe('Unknown date');
    });

    it('should return "Unknown date" for undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing runtime safety with invalid input
      expect(formatRelativeTime(undefined as any)).toBe('Unknown date');
    });

    it('should return "Unknown date" for non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing runtime safety with invalid input
      expect(formatRelativeTime(123 as any)).toBe('Unknown date');
    });

    it('should return "Invalid date" for malformed ISO string', () => {
      expect(formatRelativeTime('2025-13-45T99:99:99Z')).toBe('Invalid date');
    });
  });

  describe('Singular vs plural handling', () => {
    beforeEach(() => {
      mockDate('2025-11-11T12:00:00Z');
    });

    it('should use singular "minute" for 1 minute', () => {
      expect(formatRelativeTime('2025-11-11T11:59:00Z')).toBe('1 minute ago');
      expect(formatRelativeTime('2025-11-11T12:01:00Z')).toBe('in 1 minute');
    });

    it('should use plural "minutes" for multiple minutes', () => {
      expect(formatRelativeTime('2025-11-11T11:58:00Z')).toBe('2 minutes ago');
      expect(formatRelativeTime('2025-11-11T12:02:00Z')).toBe('in 2 minutes');
    });

    it('should use singular "hour" for 1 hour', () => {
      expect(formatRelativeTime('2025-11-11T11:00:00Z')).toBe('1 hour ago');
      expect(formatRelativeTime('2025-11-11T13:00:00Z')).toBe('in 1 hour');
    });

    it('should use plural "hours" for multiple hours', () => {
      expect(formatRelativeTime('2025-11-11T10:00:00Z')).toBe('2 hours ago');
      expect(formatRelativeTime('2025-11-11T14:00:00Z')).toBe('in 2 hours');
    });

    it('should use singular "day" for 1 day', () => {
      expect(formatRelativeTime('2025-11-10T12:00:00Z')).toBe('1 day ago');
      expect(formatRelativeTime('2025-11-12T12:00:00Z')).toBe('in 1 day');
    });

    it('should use plural "days" for multiple days', () => {
      expect(formatRelativeTime('2025-11-09T12:00:00Z')).toBe('2 days ago');
      expect(formatRelativeTime('2025-11-13T12:00:00Z')).toBe('in 2 days');
    });
  });
});

describe('formatShortDate', () => {
  it('should format Date object correctly', () => {
    const date = new Date('2025-11-11T12:00:00Z');
    const result = formatShortDate(date);
    expect(result).toMatch(/Nov 11, 2025/);
  });

  it('should format ISO string correctly', () => {
    const result = formatShortDate('2025-11-11T12:00:00Z');
    expect(result).toMatch(/Nov 11, 2025/);
  });

  it('should return "Invalid date" for invalid Date object', () => {
    const invalidDate = new Date('invalid');
    expect(formatShortDate(invalidDate)).toBe('Invalid date');
  });

  it('should return "Invalid date" for invalid ISO string', () => {
    expect(formatShortDate('invalid-date')).toBe('Invalid date');
  });

  it('should handle dates from different years', () => {
    const result = formatShortDate('2024-01-15T00:00:00Z');
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it('should handle December dates correctly', () => {
    // Use noon to avoid timezone conversion issues
    const result = formatShortDate('2025-12-31T12:00:00Z');
    expect(result).toMatch(/Dec 31, 2025/);
  });
});
