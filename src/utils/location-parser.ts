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
    // Character-precise selection: [filename.ts line:column-line:column]
    const charMatch = locationStr.match(this.LOCATION_REGEX);
    if (charMatch) {
      return {
        file: charMatch[1],
        startLine: parseInt(charMatch[2], 10),
        startColumn: parseInt(charMatch[3], 10),
        endLine: parseInt(charMatch[4], 10),
        endColumn: parseInt(charMatch[5], 10)
      };
    }

    // Full line selection: [filename.ts line:-line:]
    const fullLineMatch = locationStr.match(this.FULL_LINE_REGEX);
    if (fullLineMatch) {
      return {
        file: fullLineMatch[1],
        startLine: parseInt(fullLineMatch[2], 10),
        startColumn: 0,
        endLine: parseInt(fullLineMatch[3], 10),
        endColumn: Number.MAX_SAFE_INTEGER
      };
    }

    // From position to end of line: [filename.ts line:column-]
    const toEndMatch = locationStr.match(this.TO_END_OF_LINE_REGEX);
    if (toEndMatch) {
      return {
        file: toEndMatch[1],
        startLine: parseInt(toEndMatch[2], 10),
        startColumn: parseInt(toEndMatch[3], 10),
        endLine: parseInt(toEndMatch[2], 10),
        endColumn: Number.MAX_SAFE_INTEGER
      };
    }

    // From line start to position: [filename.ts line-line:column]
    const fromStartMatch = locationStr.match(this.FROM_LINE_START_REGEX);
    if (fromStartMatch) {
      return {
        file: fromStartMatch[1],
        startLine: parseInt(fromStartMatch[2], 10),
        startColumn: 0,
        endLine: parseInt(fromStartMatch[3], 10),
        endColumn: parseInt(fromStartMatch[4], 10)
      };
    }

    throw new Error(`Invalid location format: ${locationStr}`);
  }

  static isLocationFormat(input: string): boolean {
    return input.startsWith('[') && input.endsWith(']');
  }

  static formatLocation(location: LocationRange): string {
    return `[${location.file} ${location.startLine}:${location.startColumn}-${location.endLine}:${location.endColumn}]`;
  }
}