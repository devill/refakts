import { LocationParser, LocationRange } from '../../../src/core/location-range';

describe('LocationParser', () => {
  describe('parseLocation', () => {
    it('should parse character-precise location', () => {
      const result = LocationParser.parseLocation('[src/test.ts 5:8-5:18]');
      expect(result.file).toBe('src/test.ts');
      expect(result.start).toEqual({ line: 5, column: 8 });
      expect(result.end).toEqual({ line: 5, column: 18 });
    });

    it('should parse full line location', () => {
      const result = LocationParser.parseLocation('[src/test.ts 5:-5:]');
      expect(result).toEqual({
        file: 'src/test.ts',
        start: { line: 5, column: 0 },
        end: { line: 5, column: Number.MAX_SAFE_INTEGER }
      });
    });

    it('should parse to end of line location', () => {
      const result = LocationParser.parseLocation('[src/test.ts 5:8-]');
      expect(result).toEqual({
        file: 'src/test.ts',
        start: { line: 5, column: 8, },
        end: { line: 5, column: Number.MAX_SAFE_INTEGER }
      });
    });

    it('should parse from line start location', () => {
      const result = LocationParser.parseLocation('[src/test.ts 5-7:18]');
      expect(result).toEqual({
        file: 'src/test.ts',
        start: { line: 5, column: 0, },
        end: { line: 7, column: 18 }
      });
    });

    it('should parse multi-line location', () => {
      const result = LocationParser.parseLocation('[src/test.ts 5:8-10:18]');
      expect(result).toEqual({
        file: 'src/test.ts',
        start: { line: 5, column: 8, },
        end: { line: 10, column: 18 }
      });
    });

    it('should handle file paths with spaces', () => {
      const result = LocationParser.parseLocation('[src/path with spaces/test.ts 5:8-5:18]');
      expect(result).toEqual({
        file: 'src/path with spaces/test.ts',
        start: { line: 5, column: 8, },
        end: { line: 5, column: 18 }
      });
    });

    it('should handle absolute file paths', () => {
      const result = LocationParser.parseLocation('[/absolute/path/test.ts 5:8-5:18]');
      expect(result).toEqual({
        file: '/absolute/path/test.ts',
        start: { line: 5, column: 8, },
        end: { line: 5, column: 18 }
      });
    });

    it('should throw error for invalid format - missing brackets', () => {
      expect(() => LocationParser.parseLocation('src/test.ts 5:8-5:18')).toThrow('Invalid location format: src/test.ts 5:8-5:18');
    });

    it('should throw error for invalid format - malformed coordinates', () => {
      expect(() => LocationParser.parseLocation('[src/test.ts abc:8-5:18]')).toThrow('Invalid location format: [src/test.ts abc:8-5:18]');
    });

    it('should throw error for invalid format - missing file', () => {
      expect(() => LocationParser.parseLocation('[ 5:8-5:18]')).toThrow('Invalid location format: [ 5:8-5:18]');
    });

    it('should throw error for invalid format - wrong bracket type', () => {
      expect(() => LocationParser.parseLocation('(src/test.ts 5:8-5:18)')).toThrow('Invalid location format: (src/test.ts 5:8-5:18)');
    });

    it('should throw error for invalid format - extra content', () => {
      expect(() => LocationParser.parseLocation('[src/test.ts 5:8-5:18] extra')).toThrow('Invalid location format: [src/test.ts 5:8-5:18] extra');
    });

    it('should throw error for empty string', () => {
      expect(() => LocationParser.parseLocation('')).toThrow('Invalid location format: ');
    });

    it('should throw error for just brackets', () => {
      expect(() => LocationParser.parseLocation('[]')).toThrow('Invalid location format: []');
    });
  });

  describe('isLocationFormat', () => {
    it('should return true for valid location format strings', () => {
      expect(LocationParser.isLocationFormat('[src/test.ts 5:8-5:18]')).toBe(true);
      expect(LocationParser.isLocationFormat('[file.ts 1:1-1:1]')).toBe(true);
    });

    it('should return false for invalid format strings', () => {
      expect(LocationParser.isLocationFormat('src/test.ts 5:8-5:18')).toBe(false);
      expect(LocationParser.isLocationFormat('(src/test.ts 5:8-5:18)')).toBe(false);
      expect(LocationParser.isLocationFormat('[src/test.ts 5:8-5:18')).toBe(false);
      expect(LocationParser.isLocationFormat('src/test.ts 5:8-5:18]')).toBe(false);
      expect(LocationParser.isLocationFormat('')).toBe(false);
      expect(LocationParser.isLocationFormat('regular string')).toBe(false);
    });
  });

  describe('formatLocation', () => {
    it('should format location correctly', () => {
      const location = new LocationRange('src/test.ts', { line: 5, column: 8 }, { line: 5, column: 18 });
      expect(LocationParser.formatLocation(location)).toBe('[src/test.ts 5:8-5:18]');
    });

    it('should format multi-line location correctly', () => {
      const location = new LocationRange('src/test.ts', { line: 5, column: 8 }, { line: 10, column: 18 });
      expect(LocationParser.formatLocation(location)).toBe('[src/test.ts 5:8-10:18]');
    });

    it('should format location with special values correctly', () => {
      const location = new LocationRange('src/test.ts', { line: 5, column: 0 }, { line: 5, column: Number.MAX_SAFE_INTEGER });
      expect(LocationParser.formatLocation(location)).toBe(`[src/test.ts 5:0-5:${Number.MAX_SAFE_INTEGER}]`);
    });
  });
});