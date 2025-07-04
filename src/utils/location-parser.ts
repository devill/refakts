export interface LocationRange {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export class LocationParser {
  private static readonly LOCATION_REGEX = /^\[([^\]]+)\s+(\d+):(\d+)-(\d+):(\d+)\]$/;
  private static readonly FULL_LINE_REGEX = /^\[([^\]]+)\s+(\d+):-(\d+):\]$/;
  private static readonly TO_END_OF_LINE_REGEX = /^\[([^\]]+)\s+(\d+):(\d+)-\]$/;
  private static readonly FROM_LINE_START_REGEX = /^\[([^\]]+)\s+(\d+)-(\d+):(\d+)\]$/;

  static parseLocation(locationStr: string): LocationRange {
    return this.tryParseCharacterPrecise(locationStr) ||
           this.tryParseFullLine(locationStr) ||
           this.tryParseToEndOfLine(locationStr) ||
           this.tryParseFromLineStart(locationStr) ||
           this.throwInvalidFormat(locationStr);
  }

  private static tryParseCharacterPrecise(locationStr: string): LocationRange | null {
    const match = locationStr.match(this.LOCATION_REGEX);
    return match ? this.createLocationRange(match[1], match[2], match[3], match[4], match[5]) : null;
  }

  private static tryParseFullLine(locationStr: string): LocationRange | null {
    const match = locationStr.match(this.FULL_LINE_REGEX);
    return match ? this.createLocationRange(match[1], match[2], '0', match[3], Number.MAX_SAFE_INTEGER.toString()) : null;
  }

  private static tryParseToEndOfLine(locationStr: string): LocationRange | null {
    const match = locationStr.match(this.TO_END_OF_LINE_REGEX);
    return match ? this.createLocationRange(match[1], match[2], match[3], match[2], Number.MAX_SAFE_INTEGER.toString()) : null;
  }

  private static tryParseFromLineStart(locationStr: string): LocationRange | null {
    const match = locationStr.match(this.FROM_LINE_START_REGEX);
    return match ? this.createLocationRange(match[1], match[2], '0', match[3], match[4]) : null;
  }

  private static createLocationRange(file: string, startLine: string, startColumn: string, endLine: string, endColumn: string): LocationRange {
    return {
      file,
      startLine: parseInt(startLine, 10),
      startColumn: parseInt(startColumn, 10),
      endLine: parseInt(endLine, 10),
      endColumn: parseInt(endColumn, 10)
    };
  }

  private static throwInvalidFormat(locationStr: string): never {
    throw new Error(`Invalid location format: ${locationStr}`);
  }

  static isLocationFormat(input: string): boolean {
    return input.startsWith('[') && input.endsWith(']');
  }

  static formatLocation(location: LocationRange): string {
    return `[${location.file} ${location.startLine}:${location.startColumn}-${location.endLine}:${location.endColumn}]`;
  }
}