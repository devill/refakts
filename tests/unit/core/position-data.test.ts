import { PositionData } from '../../../src/core/position-data';
import { LocationRange } from '../../../src/core/location-parser';
import { SelectMatch } from '../../../src/types/selection-types';

describe('PositionData', () => {
  describe('constructor', () => {
    it('should create position data with line and column', () => {
      const position = new PositionData(5, 10);
      
      expect(position.line).toBe(5);
      expect(position.column).toBe(10);
      expect(position.offset).toBeUndefined();
      expect(position.length).toBeUndefined();
    });

    it('should create position data with offset and length', () => {
      const position = new PositionData(5, 10, 100, 20);
      
      expect(position.line).toBe(5);
      expect(position.column).toBe(10);
      expect(position.offset).toBe(100);
      expect(position.length).toBe(20);
    });
  });

  describe('fromLocation', () => {
    it('should create position data from LocationRange', () => {
      const location = new LocationRange('test.ts', { line: 3, column: 8 }, { line: 3, column: 15 });

      const position = PositionData.fromLocation(location);
      
      expect(position.line).toBe(3);
      expect(position.column).toBe(8);
    });
  });

  describe('fromSelectMatch', () => {
    it('should create position data from SelectMatch', () => {
      const match: SelectMatch = {
        line: 7,
        column: 12,
        endLine: 7,
        endColumn: 20,
        text: 'variable',
        fullLine: 'const variable = 42;'
      };

      const position = PositionData.fromSelectMatch(match);
      
      expect(position.line).toBe(7);
      expect(position.column).toBe(12);
    });
  });

  describe('toZeroBased', () => {
    it('should convert to zero-based coordinates', () => {
      const position = new PositionData(5, 10);
      const zeroBased = position.toZeroBased();
      
      expect(zeroBased.line).toBe(4);
      expect(zeroBased.column).toBe(9);
    });
  });

  describe('toOneBased', () => {
    it('should return one-based coordinates', () => {
      const position = new PositionData(5, 10);
      const oneBased = position.toOneBased();
      
      expect(oneBased.line).toBe(5);
      expect(oneBased.column).toBe(10);
    });
  });

  describe('toLocationRange', () => {
    it('should convert to LocationRange format', () => {
      const position = new PositionData(5, 10);
      const locationRange = position.toLocationRange('test.ts', 6, 15);
      
      expect(locationRange).toEqual({
        file: 'test.ts',
        start: { line: 5, column: 10 },
        end: { line: 6, column: 15 }
      });
    });

    it('should use same position for end when not specified', () => {
      const position = new PositionData(5, 10);
      const locationRange = position.toLocationRange('test.ts');
      
      expect(locationRange).toEqual({
        file: 'test.ts',
        start: { line: 5, column: 10 },
        end: { line: 5, column: 10 }
      });
    });
  });

  describe('formatLocation', () => {
    it('should format location string with end position', () => {
      const position = new PositionData(5, 10);
      const formatted = position.formatLocation('test.ts', 6, 15);
      
      expect(formatted).toBe('[test.ts 5:10-6:15]');
    });

    it('should format location string without end position', () => {
      const position = new PositionData(5, 10);
      const formatted = position.formatLocation('test.ts');
      
      expect(formatted).toBe('[test.ts 5:10]');
    });
  });

  describe('position comparisons', () => {
    it('should correctly identify before relationship', () => {
      const pos1 = new PositionData(5, 10);
      const pos2 = new PositionData(5, 15);
      const pos3 = new PositionData(6, 5);
      
      expect(pos1.isBefore(pos2)).toBe(true);
      expect(pos1.isBefore(pos3)).toBe(true);
      expect(pos2.isBefore(pos1)).toBe(false);
    });

    it('should correctly identify after relationship', () => {
      const pos1 = new PositionData(5, 10);
      const pos2 = new PositionData(5, 15);
      const pos3 = new PositionData(6, 5);
      
      expect(pos2.isAfter(pos1)).toBe(true);
      expect(pos3.isAfter(pos1)).toBe(true);
      expect(pos1.isAfter(pos2)).toBe(false);
    });

    it('should correctly identify equal positions', () => {
      const pos1 = new PositionData(5, 10);
      const pos2 = new PositionData(5, 10);
      const pos3 = new PositionData(5, 11);
      
      expect(pos1.equals(pos2)).toBe(true);
      expect(pos1.equals(pos3)).toBe(false);
    });
  });

  describe('withPosition', () => {
    it('should create copy with updated position', () => {
      const original = new PositionData(5, 10, 100, 20);
      const updated = original.withPosition(7, 15);
      
      expect(updated.line).toBe(7);
      expect(updated.column).toBe(15);
      expect(updated.offset).toBe(100);
      expect(updated.length).toBe(20);
      expect(original.line).toBe(5); // Original unchanged
    });
  });

  describe('withOffset', () => {
    it('should create copy with updated offset', () => {
      const original = new PositionData(5, 10, 100, 20);
      const updated = original.withOffset(200, 30);
      
      expect(updated.line).toBe(5);
      expect(updated.column).toBe(10);
      expect(updated.offset).toBe(200);
      expect(updated.length).toBe(30);
      expect(original.offset).toBe(100); // Original unchanged
    });
  });
});