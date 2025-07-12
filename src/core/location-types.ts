export interface SourceLocation {
  line: number;
  column: number;
}

export class LocationInfo {
  constructor(
    public readonly file: string,
    public readonly start: SourceLocation,
    public readonly end: SourceLocation
  ) {}

  formatLocation(baseDir: string): string {
    const path = require('path');
    const relativePath = this.normalizeTestPath(path.relative(baseDir, this.file));
    return `[${relativePath} ${this.start.line}:${this.start.column}-${this.end.line}:${this.end.column}]`;
  }

  private normalizeTestPath(relativePath: string): string {
    return relativePath.includes('input.received/') 
      ? relativePath.replace(/.*input\.received\//, 'input/')
      : relativePath;
  }

  compareToLocation(other: LocationInfo): number {
    if (this.file !== other.file) {
      return this.file.localeCompare(other.file);
    }
    return this.start.line - other.start.line;
  }

  matchesTarget(targetFile: string, targetLine: number): boolean {
    const path = require('path');
    const normalizedUsagePath = path.resolve(this.file);
    const normalizedTargetPath = path.resolve(targetFile);
    return normalizedUsagePath === normalizedTargetPath && this.start.line === targetLine;
  }
}

export interface UsageLocation {
  location: LocationInfo;
  text: string;
}