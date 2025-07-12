import {LocationInfo, SourceLocation} from "./location-types";

export class LocationRange {
  public readonly file: string;
  public readonly start: SourceLocation;
  public readonly end: SourceLocation;

  constructor(file: string, start: SourceLocation, end: SourceLocation) {
    this.file = file;
    this.start = start;
    this.end = end;
  }

  toString(): string {
    return `[${this.file} ${this.start.line}:${this.start.column}-${this.end.line}:${this.end.column}]`;
  }

  validateRange(): void {
    if (this.start.line > this.end.line ||
        (this.start.line === this.end.line && this.start.column > this.end.column)) {
      throw new Error(`Invalid range: start position (${this.start.line}:${this.start.column}) is after end position (${this.end.line}:${this.end.column})`);
    }
  }

  static from(locationInfo: LocationInfo) {
    return new LocationRange(locationInfo.file, locationInfo.start, locationInfo.end);
  }
}

export class LocationParser {
  private static readonly LOCATION_REGEX = /^\[(?<file>[^\]]+)\s+(?<startLine>\d+)(?::(?<startColumn>\d*))?-(?<endLine>\d*):?(?<endColumn>\d*)\]$/;

  static parseLocation(locationStr: string): LocationRange {
    const match = this.matchLocationString(locationStr);
    return this.buildLocationRange(match.groups);
  }

  private static matchLocationString(locationStr: string): RegExpMatchArray & { groups: Record<string, string> } {
    const match = locationStr.match(this.LOCATION_REGEX);
    if (!match?.groups) {
      throw new Error(`Invalid location format: ${locationStr}`);
    }
    return match as RegExpMatchArray & { groups: Record<string, string> };
  }

  private static buildLocationRange(groups: Record<string, string>): LocationRange {
    const startLine = parseInt(groups.startLine, 10);
    return new LocationRange(groups.file, {
      line: startLine,
      column: this.parseColumnOrDefault(groups.startColumn, 0)
    }, {
      line: this.parseLineOrDefault(groups.endLine, startLine),
      column: this.parseColumnOrDefault(groups.endColumn, Number.MAX_SAFE_INTEGER)
    });
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
    return location.toString();
  }

  static getZeroBasedStartPosition(location: LocationRange): { line: number; column: number } {
    return { line: location.start.line - 1, column: location.start.column - 1 };
  }

  static processTarget(target: string, options: Record<string, unknown>): Record<string, unknown> {
    if (this.isLocationFormat(target)) {
      const location = this.parseLocation(target);
      return { ...options, location };
    }
    
    return { ...options, target };
  }
}