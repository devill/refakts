import { SourceFile } from 'ts-morph';
import { PositionData } from '../locators/position-data';

import path from "path";

interface RangePattern {
  start: RegExp;
  end: RegExp;
}


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
    return path.basename(sourceFile.getFilePath());
  }


  shouldSkipLine(lineNumber: number): boolean {
    return this.isCommentLine(lineNumber);
  }


  getLine(lineNumber: number): string | null {
    const index = lineNumber - 1;
    return index >= 0 && index < this.lines.length ? this.lines[index] : null;
  }


  getLineByIndex(index: number): string | null {
    return index >= 0 && index < this.lines.length ? this.lines[index] : null;
  }


  createPosition(line: number, column: number): PositionData {
    return new PositionData(line, column);
  }


  extractContentBetween(startIndex: number, endIndex: number): string {
    return this.lines.slice(startIndex, endIndex + 1).join('\n');
  }

  findEndMatch(startIndex: number): { match: RegExpExecArray; index: number } | null {
    for (let j = startIndex; j < this.getTotalLines(); j++) {
      if (this.shouldSkipLine(j + 1)) continue;
      
      const endMatch = this.patterns.end.exec(this.getLineByIndex(j) || '');
      if (endMatch) return { match: endMatch, index: j };
    }
    
    return null;
  }

  findStartMatch(startIndex: number): { match: RegExpExecArray; index: number } | null {
    const startMatch = this.patterns.start.exec(this.getLineByIndex(startIndex) || '');
    if (!startMatch) return null;
    
    return { match: startMatch, index: startIndex };
  }


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