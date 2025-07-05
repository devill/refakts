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
    const match = this.matchLocationString(locationStr);
    return this.buildLocationRange(match.groups!);
  }

  private static matchLocationString(locationStr: string) {
    const match = locationStr.match(this.LOCATION_REGEX);
    if (!match?.groups) {
      throw new Error(`Invalid location format: ${locationStr}`);
    }
    return match;
  }

  private static buildLocationRange(groups: Record<string, string>): LocationRange {
    const { file, startLine, startColumn, endLine, endColumn } = groups;
    
    return {
      file,
      startLine: parseInt(startLine, 10),
      startColumn: this.parseColumnOrDefault(startColumn, 0),
      endLine: this.parseLineOrDefault(endLine, parseInt(startLine, 10)),
      endColumn: this.parseColumnOrDefault(endColumn, Number.MAX_SAFE_INTEGER)
    };
  }

  private static parseColumnOrDefault(value: string | undefined, defaultValue: number): number {
    return !value || value === '' ? defaultValue : parseInt(value, 10);
  }

  private static parseLineOrDefault(value: string | undefined, defaultValue: number): number {
    return !value || value === '' ? defaultValue : parseInt(value, 10);
  }

  static isLocationFormat(input: string): boolean {
    return input.startsWith('[') && input.endsWith(']');
  }

  static formatLocation(location: LocationRange): string {
    return `[${location.file} ${location.startLine}:${location.startColumn}-${location.endLine}:${location.endColumn}]`;
  }
}