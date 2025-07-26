import {Node, SourceFile} from "ts-morph";
import {ASTService} from "./ast-service";

import path from "path";

export interface SourceLocation {
  line: number;
  column: number;
}

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

  formatLocation(baseDir: string): string {
    const relativePath = this.normalizeTestPath(path.relative(baseDir, this.file));
    
    if (this.start.column === -1 && this.end.column === -1) {
      return `[${relativePath} ${this.start.line}:-${this.end.line}:]`;
    }
    
    return `[${relativePath} ${this.start.line}:${this.start.column}-${this.end.line}:${this.end.column}]`;
  }

  private normalizeTestPath(relativePath: string): string {
    return relativePath.includes('input.received/') 
      ? relativePath.replace(/.*input\.received\//, 'input/')
      : relativePath;
  }

  compareToLocation(other: LocationRange): number {
    if (this.file !== other.file) {
      return this.file.localeCompare(other.file);
    }
    return this.start.line - other.start.line;
  }

  matchesTarget(targetFile: string, targetLine: number): boolean {
    const normalizedUsagePath = path.resolve(this.file);
    const normalizedTargetPath = path.resolve(targetFile);
    return normalizedUsagePath === normalizedTargetPath && this.start.line === targetLine;
  }

  validateRange(): void {
    if (this.start.line > this.end.line ||
        (this.start.line === this.end.line && this.start.column > this.end.column)) {
      throw new Error(`Invalid range: start position (${this.start.line}:${this.start.column}) is after end position (${this.end.line}:${this.end.column})`);
    }
  }

  validateLocationBounds(sourceFile: SourceFile): void {
    const lines = sourceFile.getFullText().split('\n');
    this.validateLineExists(lines);
    this.validateColumnExists(lines);
  }

  private validateLineExists(lines: string[]): void {
    if (this.start.line > lines.length) {
      throw new Error(`Location out of bounds: line ${this.start.line}, column ${this.start.column}`);
    }
  }

  private validateColumnExists(lines: string[]): void {
    const targetLine = lines[this.start.line - 1];
    if (this.start.column > targetLine.length + 1) {
      throw new Error(`Location out of bounds: line ${this.start.line}, column ${this.start.column}`);
    }
  }

  static from(locationInfo: LocationRange): LocationRange {
    return new LocationRange(locationInfo.file, locationInfo.start, locationInfo.end);
  }

  static createLocationFromNode(sourceFile: SourceFile, node: Node): LocationRange {
    return new LocationRange(
        sourceFile.getFilePath(),
        sourceFile.getLineAndColumnAtPos(node.getStart()),
        sourceFile.getLineAndColumnAtPos(node.getEnd())
    );
  }

  getNodeFromSourceFile(sourceFile: SourceFile): Node {
    const startPos = sourceFile.compilerNode.getPositionOfLineAndCharacter(
      this.start.line - 1,
      this.start.column - 1
    );
    const node = sourceFile.getDescendantAtPos(startPos);
    if (!node) {
      throw new Error(`No symbol found at location ${this.start.line}:${this.start.column}`);
    }
    const symbol = node.getSymbol();
    if (!symbol) {
      throw new Error(`No symbol found at location ${this.start.line}:${this.start.column}`);
    }
    return node;
  }

  getNode(): Node {
    const astService = ASTService.createForFile(this.file);
    const sourceFile = astService.loadSourceFile(this.file);
    
    // Check for compilation errors
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    if (diagnostics.length > 0) {
      throw new Error(`TypeScript compilation error in ${this.file}`);
    }
    
    // Validate location bounds
    this.validateLocationBounds(sourceFile);
    
    return this.getNodeFromSourceFile(sourceFile);
  }
}

export type UsageType = 'read' | 'write';

export interface UsageLocation {
  location: LocationRange;
  text: string;
  usageType: UsageType;
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