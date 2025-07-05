export interface LocationRange {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export class LocationParser {
  private static readonly LOCATION_REGEX = /^\[(?<file>[^\]]+)\s+(?<startLine>\d+)(?::(?<startColumn>\d*))?-(?<endLine>\d*):?(?<endColumn>\d*)\]$/;

  static parseLocation(locationStr: string): LocationRange {
    const match = locationStr.match(this.LOCATION_REGEX);
    if (!match?.groups) {
      throw new Error(`Invalid location format: ${locationStr}`);
    }

    const { file, startLine, startColumn, endLine, endColumn } = match.groups;
    
    return {
      file,
      startLine: parseInt(startLine, 10),
      startColumn: !startColumn || startColumn === '' ? 0 : parseInt(startColumn, 10),
      endLine: !endLine || endLine === '' ? parseInt(startLine, 10) : parseInt(endLine, 10),
      endColumn: !endColumn || endColumn === '' ? Number.MAX_SAFE_INTEGER : parseInt(endColumn, 10)
    };
  }

  static isLocationFormat(input: string): boolean {
    return input.startsWith('[') && input.endsWith(']');
  }

  static formatLocation(location: LocationRange): string {
    return `[${location.file} ${location.startLine}:${location.startColumn}-${location.endLine}:${location.endColumn}]`;
  }
}