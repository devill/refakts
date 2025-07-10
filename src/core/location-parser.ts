export class LocationRange {
  /* eslint-disable no-unused-vars */
  constructor(
    public readonly file: string,
    public readonly startLine: number,
    public readonly startColumn: number,
    public readonly endLine: number,
    public readonly endColumn: number
  ) {}
  /* eslint-enable no-unused-vars */

  toString(): string {
    return `[${this.file} ${this.startLine}:${this.startColumn}-${this.endLine}:${this.endColumn}]`;
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
    return new LocationRange(
      groups.file,
      parseInt(groups.startLine, 10),
      this.parseColumnOrDefault(groups.startColumn, 0),
      this.parseLineOrDefault(groups.endLine, parseInt(groups.startLine, 10)),
      this.parseColumnOrDefault(groups.endColumn, Number.MAX_SAFE_INTEGER)
    );
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
    return { line: location.startLine - 1, column: location.startColumn - 1 };
  }
}