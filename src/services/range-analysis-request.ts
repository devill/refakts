import { SourceFile } from 'ts-morph';
import { PositionData } from '../core/position-data';

interface RangePattern {
  start: RegExp;
  end: RegExp;
}


/**
 * Encapsulates all parameters needed for range analysis operations.
 * This eliminates the need to pass multiple parameters to each method.
 */
export class RangeAnalysisRequest {
  public readonly sourceFile: SourceFile;
  public readonly lines: string[];
  public readonly patterns: RangePattern;
  public readonly fileName: string;

  constructor(sourceFile: SourceFile, startRegex: string, endRegex: string) {
    this.sourceFile = sourceFile;
    this.lines = sourceFile.getFullText().split('\n');
    this.patterns = this.createPatterns(startRegex, endRegex);
    this.fileName = this.extractFileName(sourceFile);
  }

  private createPatterns(startRegex: string, endRegex: string): RangePattern {
    return {
      start: new RegExp(startRegex),
      end: new RegExp(endRegex)
    };
  }

  private extractFileName(sourceFile: SourceFile): string {
    const path = require('path');
    return path.basename(sourceFile.getFilePath());
  }

  /**
   * Checks if a line should be skipped during analysis (e.g., comment lines).
   */
  shouldSkipLine(lineNumber: number): boolean {
    return this.isCommentLine(lineNumber);
  }

  /**
   * Gets the content of a specific line (1-based indexing).
   */
  getLine(lineNumber: number): string | null {
    const index = lineNumber - 1;
    return index >= 0 && index < this.lines.length ? this.lines[index] : null;
  }

  /**
   * Gets the content of a line by array index (0-based indexing).
   */
  getLineByIndex(index: number): string | null {
    return index >= 0 && index < this.lines.length ? this.lines[index] : null;
  }

  /**
   * Creates a position object from line number and column.
   */
  createPosition(line: number, column: number): PositionData {
    return new PositionData(line, column);
  }

  /**
   * Extracts content between two line indices (inclusive).
   */
  extractContentBetween(startIndex: number, endIndex: number): string {
    return this.lines.slice(startIndex, endIndex + 1).join('\n');
  }

  /**
   * Gets the total number of lines in the source file.
   */
  getTotalLines(): number {
    return this.lines.length;
  }

  private isCommentLine(lineNumber: number): boolean {
    if (this.isInvalidLineNumber(lineNumber)) return false;
    
    const line = this.lines[lineNumber - 1];
    return this.startsWithCommentMarker(line.trim());
  }

  private isInvalidLineNumber(lineNumber: number): boolean {
    return lineNumber <= 0 || lineNumber > this.lines.length;
  }

  private startsWithCommentMarker(trimmedLine: string): boolean {
    return trimmedLine.startsWith('//') || 
           trimmedLine.startsWith('*') || 
           trimmedLine.startsWith('/*');
  }
}