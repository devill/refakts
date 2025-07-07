import { SourceFile } from 'ts-morph';
import { SelectResult } from '../types/selection-types';
import { RangeAnalysisRequest } from './range-analysis-request';
import { PositionData } from '../core/position-data';
import * as path from 'path';

interface RangeOptions {
  startRegex?: string;
  endRegex?: string;
  'start-regex'?: string;
  'end-regex'?: string;
  [key: string]: unknown;
}

interface RegexOptions {
  start: string;
  end: string;
}


interface RangeData {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  content: string;
  endLineIndex: number;
}

interface RangeResult {
  range: RangeData | null;
  newIndex: number;
}



export class RangeAnalyzer {
  findRangeMatches(sourceFile: SourceFile, options: RangeOptions): SelectResult[] {
    const regexOptions = this.extractRegexOptions(options);
    const fileName = path.basename(sourceFile.getFilePath());
    const ranges = this.findContentRanges(sourceFile, regexOptions.start, regexOptions.end);
    
    return this.formatRangeResults(ranges, fileName);
  }

  private extractRegexOptions(options: RangeOptions): RegexOptions {
    return {
      start: (options.startRegex || options['start-regex']) as string,
      end: (options.endRegex || options['end-regex']) as string
    };
  }

  private formatRangeResults(ranges: RangeData[], fileName: string): SelectResult[] {
    if (ranges.length === 0) return [{ location: 'No Matches' }];
    
    return ranges.map(range => this.formatSingleRange(range, fileName));
  }

  private formatSingleRange(range: RangeData, fileName: string): SelectResult {
    const location = `\n[${fileName} ${range.startLine}:${range.startColumn}-${range.endLine}:${range.endColumn}]`;
    return {
      location,
      content: `${range.content}\n[${fileName} ${range.startLine}:${range.startColumn}-${range.endLine}:${range.endColumn}]`
    };
  }

  private findContentRanges(sourceFile: SourceFile, startRegex: string, endRegex: string): RangeData[] {
    const request = new RangeAnalysisRequest(sourceFile, startRegex, endRegex);
    
    return this.processAllLines(request);
  }

  private processAllLines(request: RangeAnalysisRequest): RangeData[] {
    const ranges: RangeData[] = [];
    
    for (let i = 0; i < request.getTotalLines(); i++) {
      const result = this.processLine(request, i);
      i = this.handleLineResult(result, ranges, i);
    }
    
    return ranges;
  }

  private handleLineResult(result: RangeResult, ranges: RangeData[], currentIndex: number): number {
    if (result.range) {
      ranges.push(result.range);
      return result.newIndex;
    }
    return currentIndex;
  }

  private processLine(request: RangeAnalysisRequest, i: number): RangeResult {
    if (request.shouldSkipLine(i + 1)) {
      return this.createSkipResult(i);
    }
    
    return this.createRangeResult(request, i);
  }

  private createSkipResult(index: number) {
    return { range: null, newIndex: index };
  }

  private createRangeResult(request: RangeAnalysisRequest, i: number): RangeResult {
    const range = this.findRangeFromStartLine(request, i);
    return { 
      range, 
      newIndex: range ? range.endLineIndex : i 
    };
  }



  private findRangeFromStartLine(request: RangeAnalysisRequest, startIndex: number): RangeData | null {
    const startMatch = request.patterns.start.exec(request.getLineByIndex(startIndex) || '');
    if (!startMatch) return null;
    
    const rangeStart = new PositionData(startIndex + 1, startMatch.index + 1);
    const endResult = this.findEndMatch(request, startIndex);
    
    return endResult ? this.createRange(rangeStart, endResult.match, request, startIndex, endResult.index) : null;
  }

  private findEndMatch(request: RangeAnalysisRequest, startIndex: number) {
    for (let j = startIndex; j < request.getTotalLines(); j++) {
      if (request.shouldSkipLine(j + 1)) continue;
      
      const endMatch = request.patterns.end.exec(request.getLineByIndex(j) || '');
      if (endMatch) return { match: endMatch, index: j };
    }
    
    return null;
  }


  private createRange(rangeStart: PositionData, endMatch: RegExpExecArray, request: RangeAnalysisRequest, startIndex: number, endIndex: number): RangeData {
    const rangeEnd = this.calculateRangeEnd(endMatch, endIndex);
    const content = request.extractContentBetween(startIndex, endIndex);
    
    return this.buildRangeObject(rangeStart, rangeEnd, content, endIndex);
  }

  private calculateRangeEnd(endMatch: RegExpExecArray, endIndex: number): PositionData {
    return new PositionData(endIndex + 1, endMatch.index + endMatch[0].length + 1);
  }


  private buildRangeObject(rangeStart: PositionData, rangeEnd: PositionData, content: string, endIndex: number): RangeData {
    return {
      startLine: rangeStart.line,
      startColumn: rangeStart.column,
      endLine: rangeEnd.line,
      endColumn: rangeEnd.column,
      content,
      endLineIndex: endIndex
    };
  }

}