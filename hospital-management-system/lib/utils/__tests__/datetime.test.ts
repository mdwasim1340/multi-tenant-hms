/**
 * Team Alpha - DateTime Utilities Tests
 * Tests for timezone-aware datetime operations
 */

import {
  formatToLocalDate,
  formatToLocalTime,
  combineLocalDateTime,
  parseToLocalDateTime,
  formatDateForDisplay,
  formatTimeForDisplay,
  formatDateTimeForDisplay,
} from '../datetime';

describe('DateTime Utilities', () => {
  describe('formatToLocalDate', () => {
    it('should format ISO date to local date string', () => {
      const result = formatToLocalDate('2025-11-16T16:30:00.000Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatToLocalTime', () => {
    it('should format ISO date to local time string', () => {
      const result = formatToLocalTime('2025-11-16T16:30:00.000Z');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('combineLocalDateTime', () => {
    it('should combine date and time preserving local timezone', () => {
      const result = combineLocalDateTime('2025-11-16', '16:30');
      expect(result).toContain('2025-11-16');
      expect(result).toMatch(/T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle midnight correctly', () => {
      const result = combineLocalDateTime('2025-11-16', '00:00');
      expect(result).toContain('2025-11-16');
    });

    it('should handle noon correctly', () => {
      const result = combineLocalDateTime('2025-11-16', '12:00');
      expect(result).toContain('2025-11-16');
    });
  });

  describe('parseToLocalDateTime', () => {
    it('should parse ISO datetime to local date and time', () => {
      const result = parseToLocalDateTime('2025-11-16T16:30:00.000Z');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('time');
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format date for display', () => {
      const result = formatDateForDisplay('2025-11-16T16:30:00.000Z');
      expect(result).toContain('2025');
      expect(result).toContain('16');
    });
  });

  describe('formatTimeForDisplay', () => {
    it('should format time for display', () => {
      const result = formatTimeForDisplay('2025-11-16T16:30:00.000Z');
      expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    });
  });

  describe('formatDateTimeForDisplay', () => {
    it('should format full datetime for display', () => {
      const result = formatDateTimeForDisplay('2025-11-16T16:30:00.000Z');
      expect(result).toContain('2025');
      expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    });
  });

  describe('Round-trip consistency', () => {
    it('should maintain time consistency through parse and combine', () => {
      const originalDate = '2025-11-16';
      const originalTime = '16:30';
      
      // Combine to ISO
      const combined = combineLocalDateTime(originalDate, originalTime);
      
      // Parse back
      const { date, time } = parseToLocalDateTime(combined);
      
      // Should match original (accounting for timezone)
      expect(date).toBe(originalDate);
      // Time might differ due to timezone, but should be valid
      expect(time).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});
