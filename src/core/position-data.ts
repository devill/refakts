import { SourceFile } from 'ts-morph';
import { LocationRange } from './location-parser';
import { SelectMatch } from '../types/selection-types';

/**
 * Encapsulates position/location information and provides conversion methods
 * to common formats used throughout the codebase
 */
export class PositionData {
  public readonly line: number;
  public readonly column: number;
  public readonly offset?: number;
  public readonly length?: number;

  constructor(_line: number, _column: number, _offset?: number, _length?: number) {
    this.line = _line;
    this.column = _column;
    this.offset = _offset;
    this.length = _length;
  }

  /**
   * Creates PositionData from a LocationRange
   */
  static fromLocation(location: LocationRange): PositionData {
    return new PositionData(
      location.startLine,
      location.startColumn,
      undefined,
      undefined
    );
  }

  /**
   * Creates PositionData from a LocationRange with end position
   */
  static fromRange(location: LocationRange): PositionData {
    const { startOffset, length } = this.calculateRangeOffsets(location);
    
    return new PositionData(
      location.startLine,
      location.startColumn,
      startOffset,
      length
    );
  }

  private static calculateRangeOffsets(location: LocationRange): { startOffset: number; length: number } {
    const startOffset = this.calculateOffset(location.startLine, location.startColumn);
    const endOffset = this.calculateOffset(location.endLine, location.endColumn);
    return { startOffset, length: endOffset - startOffset };
  }

  /**
   * Creates PositionData from a SelectMatch
   */
  static fromSelectMatch(match: SelectMatch): PositionData {
    return new PositionData(
      match.line,
      match.column,
      undefined,
      undefined
    );
  }

  /**
   * Creates PositionData from ts-morph node position
   */
  static fromNodePosition(sourceFile: SourceFile, offset: number): PositionData {
    const { line, column } = sourceFile.getLineAndColumnAtPos(offset);
    return new PositionData(line, column, offset);
  }

  /**
   * Converts to zero-based line and column for ts-morph operations
   */
  toZeroBased(): { line: number; column: number } {
    return {
      line: this.line - 1,
      column: this.column - 1
    };
  }

  /**
   * Converts to one-based line and column for display
   */
  toOneBased(): { line: number; column: number } {
    return {
      line: this.line,
      column: this.column
    };
  }

  /**
   * Converts to LocationRange format (requires file path)
   */
  toLocationRange(file: string, endLine?: number, endColumn?: number): LocationRange {
    return {
      file,
      startLine: this.line,
      startColumn: this.column,
      endLine: endLine ?? this.line,
      endColumn: endColumn ?? this.column
    };
  }

  /**
   * Converts to SelectMatch format (requires text content)
   */
  toSelectMatch(text: string, fullLine: string): SelectMatch {
    return {
      line: this.line,
      column: this.column,
      endLine: this.line,
      endColumn: this.column,
      text,
      fullLine
    };
  }

  /**
   * Converts to position object used by VariableLocation
   */
  toVariablePosition(): { line: number; column: number } {
    return {
      line: this.line,
      column: this.column
    };
  }

  /**
   * Converts to ts-morph offset using source file
   */
  toOffset(sourceFile: SourceFile): number {
    return this.offset ?? this.calculateOffsetFromPosition(sourceFile);
  }

  private calculateOffsetFromPosition(sourceFile: SourceFile): number {
    const zeroBased = this.toZeroBased();
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(
      zeroBased.line,
      zeroBased.column
    );
  }

  /**
   * Formats as location string for display
   */
  formatLocation(fileName: string, endLine?: number, endColumn?: number): string {
    const end = endLine && endColumn ? `-${endLine}:${endColumn}` : '';
    return `[${fileName} ${this.line}:${this.column}${end}]`;
  }

  /**
   * Creates a copy with updated position
   */
  withPosition(line: number, column: number): PositionData {
    return new PositionData(line, column, this.offset, this.length);
  }

  /**
   * Creates a copy with updated offset and length
   */
  withOffset(offset: number, length?: number): PositionData {
    return new PositionData(this.line, this.column, offset, length);
  }

  /**
   * Checks if this position is before another position
   */
  isBefore(other: PositionData): boolean {
    return this.line < other.line || 
           (this.line === other.line && this.column < other.column);
  }

  /**
   * Checks if this position is after another position
   */
  isAfter(other: PositionData): boolean {
    return this.line > other.line || 
           (this.line === other.line && this.column > other.column);
  }

  /**
   * Checks if this position equals another position
   */
  equals(other: PositionData): boolean {
    return this.line === other.line && this.column === other.column;
  }

  private static calculateOffset(line: number, column: number): number {
    return (line - 1) * 80 + (column - 1); // Assuming 80 chars per line average
  }
}