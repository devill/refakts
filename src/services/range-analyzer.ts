import { SourceFile, Node, SyntaxKind } from 'ts-morph';
import { SelectResult } from '../commands/select/select-types';
import * as path from 'path';

export class RangeAnalyzer {
  findRangeMatches(sourceFile: SourceFile, options: Record<string, any>): SelectResult[] {
    const regexOptions = this.extractRegexOptions(options);
    const fileName = path.basename(sourceFile.getFilePath());
    const ranges = this.findContentRanges(sourceFile, regexOptions.start, regexOptions.end);
    
    return this.formatRangeResults(ranges, fileName);
  }

  private extractRegexOptions(options: Record<string, any>) {
    return {
      start: options.startRegex || options['start-regex'],
      end: options.endRegex || options['end-regex']
    };
  }

  private formatRangeResults(ranges: any[], fileName: string): SelectResult[] {
    if (ranges.length === 0) return [{ location: 'No Matches' }];
    
    return ranges.map(range => this.formatSingleRange(range, fileName));
  }

  private formatSingleRange(range: any, fileName: string): SelectResult {
    const location = `\n[${fileName} ${range.startLine}:${range.startColumn}-${range.endLine}:${range.endColumn}]`;
    return {
      location,
      content: `${range.content}\n[${fileName} ${range.startLine}:${range.startColumn}-${range.endLine}:${range.endColumn}]`
    };
  }

  private findContentRanges(sourceFile: SourceFile, startRegex: string, endRegex: string): any[] {
    const lines = sourceFile.getFullText().split('\n');
    const patterns = this.createPatterns(startRegex, endRegex);
    
    return this.processAllLines(sourceFile, lines, patterns);
  }

  private processAllLines(sourceFile: SourceFile, lines: string[], patterns: any): any[] {
    const ranges: any[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const result = this.processLine(sourceFile, lines, patterns, i);
      i = this.handleLineResult(result, ranges, i);
    }
    
    return ranges;
  }

  private handleLineResult(result: any, ranges: any[], currentIndex: number): number {
    if (result.range) {
      ranges.push(result.range);
      return result.newIndex;
    }
    return currentIndex;
  }

  private processLine(sourceFile: SourceFile, lines: string[], patterns: any, i: number) {
    if (this.shouldSkipLine(sourceFile, i + 1)) {
      return { range: null, newIndex: i };
    }
    
    const range = this.findRangeFromStartLine(sourceFile, lines, patterns, i);
    return { 
      range, 
      newIndex: range ? range.endLineIndex : i 
    };
  }

  private createPatterns(startRegex: string, endRegex: string) {
    return {
      start: new RegExp(startRegex),
      end: new RegExp(endRegex)
    };
  }

  private shouldSkipLine(sourceFile: SourceFile, lineNumber: number): boolean {
    return this.isCommentLine(sourceFile, lineNumber);
  }

  private findRangeFromStartLine(sourceFile: SourceFile, lines: string[], patterns: any, startIndex: number) {
    const startMatch = patterns.start.exec(lines[startIndex]);
    if (!startMatch) return null;
    
    const rangeStart = { line: startIndex + 1, column: startMatch.index + 1 };
    const endResult = this.findEndMatch(sourceFile, lines, patterns.end, startIndex);
    
    return endResult ? this.createRange(rangeStart, endResult.match, lines, startIndex, endResult.index) : null;
  }

  private findEndMatch(sourceFile: SourceFile, lines: string[], endPattern: RegExp, startIndex: number) {
    for (let j = startIndex; j < lines.length; j++) {
      if (this.shouldSkipLine(sourceFile, j + 1)) continue;
      
      const endMatch = endPattern.exec(lines[j]);
      if (endMatch) return { match: endMatch, index: j };
    }
    
    return null;
  }


  private createRange(rangeStart: any, endMatch: RegExpExecArray, lines: string[], startIndex: number, endIndex: number) {
    const rangeEnd = this.calculateRangeEnd(endMatch, endIndex);
    const content = this.extractRangeContent(lines, startIndex, endIndex);
    
    return this.buildRangeObject(rangeStart, rangeEnd, content, endIndex);
  }

  private calculateRangeEnd(endMatch: RegExpExecArray, endIndex: number) {
    return { line: endIndex + 1, column: endMatch.index + endMatch[0].length + 1 };
  }

  private extractRangeContent(lines: string[], startIndex: number, endIndex: number): string {
    return lines.slice(startIndex, endIndex + 1).join('\n');
  }

  private buildRangeObject(rangeStart: any, rangeEnd: any, content: string, endIndex: number) {
    return {
      startLine: rangeStart.line,
      startColumn: rangeStart.column,
      endLine: rangeEnd.line,
      endColumn: rangeEnd.column,
      content,
      endLineIndex: endIndex
    };
  }

  private isCommentLine(sourceFile: SourceFile, lineNumber: number): boolean {
    const lines = sourceFile.getFullText().split('\n');
    if (this.isInvalidLineNumber(lineNumber, lines.length)) return false;
    
    const line = lines[lineNumber - 1];
    return this.startsWithCommentMarker(line.trim());
  }

  private isInvalidLineNumber(lineNumber: number, totalLines: number): boolean {
    return lineNumber <= 0 || lineNumber > totalLines;
  }

  private startsWithCommentMarker(trimmedLine: string): boolean {
    return trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*');
  }
}