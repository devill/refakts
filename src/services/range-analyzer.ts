import { SourceFile } from 'ts-morph';
import { SelectResult } from '../types/selection-types';
import { RangeAnalysisRequest } from './range-analysis-request';
import { PositionData } from '../core/position-data';
import { LocationRange, SourceLocation } from '../core/location-range';
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


interface RangeWithContent {
  range: LocationRange;
  content: string;
}

interface RangeCreationContext {
  rangeStart: PositionData;
  endMatch: RegExpExecArray;
  request: RangeAnalysisRequest;
  startIndex: number;
  endIndex: number;
}

interface RangeResult {
  range: RangeWithContent | null;
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

  private formatRangeResults(ranges: RangeWithContent[], fileName: string): SelectResult[] {
    if (ranges.length === 0) return [new SelectResult('No Matches')];
    
    return ranges.map(range => this.formatSingleRange(range, fileName));
  }

  private formatSingleRange(rangeWithContent: RangeWithContent, fileName: string): SelectResult {
    const location = `\n${this.formatRangeLocation(rangeWithContent.range, fileName)}`;
    return new SelectResult(
      location,
      `${rangeWithContent.content}\n${this.formatRangeLocation(rangeWithContent.range, fileName)}`
    );
  }

  private formatRangeLocation(range: LocationRange, fileName: string): string {
    return `[${fileName} ${range.start.line}:${range.start.column}-${range.end.line}:${range.end.column}]`;
  }

  private findContentRanges(sourceFile: SourceFile, startRegex: string, endRegex: string): RangeWithContent[] {
    const request = new RangeAnalysisRequest(sourceFile, startRegex, endRegex);
    
    return this.processAllLines(request);
  }

  private processAllLines(request: RangeAnalysisRequest): RangeWithContent[] {
    const ranges: RangeWithContent[] = [];
    
    for (let i = 0; i < request.getTotalLines(); i++) {
      const result = this.processLine(request, i);
      i = this.handleLineResult(result, ranges, i);
    }
    
    return ranges;
  }

  private handleLineResult(result: RangeResult, ranges: RangeWithContent[], currentIndex: number): number {
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
      newIndex: range ? range.range.end.line : i 
    };
  }



  private findRangeFromStartLine(request: RangeAnalysisRequest, startIndex: number): RangeWithContent | null {
    const startResult = request.findStartMatch(startIndex);
    if (!startResult) return null;
    
    const rangeStart = new PositionData(startIndex + 1, startResult.match.index + 1);
    const endResult = request.findEndMatch(startIndex);
    
    if (!endResult) return null;
    
    const context: RangeCreationContext = {
      rangeStart,
      endMatch: endResult.match,
      request,
      startIndex,
      endIndex: endResult.index
    };
    
    return this.createRange(context);
  }



  private createRange(context: RangeCreationContext): RangeWithContent {
    const rangeEnd = this.calculateRangeEnd(context.endMatch, context.endIndex);
    const content = context.request.extractContentBetween(context.startIndex, context.endIndex);
    
    return this.buildRangeObject(context.rangeStart, rangeEnd, content, context.request.sourceFile.getFilePath());
  }

  private calculateRangeEnd(endMatch: RegExpExecArray, endIndex: number): PositionData {
    return new PositionData(endIndex + 1, endMatch.index + endMatch[0].length + 1);
  }


  private buildRangeObject(rangeStart: PositionData, rangeEnd: PositionData, content: string, filePath: string): RangeWithContent {
    const start: SourceLocation = { line: rangeStart.line, column: rangeStart.column };
    const end: SourceLocation = { line: rangeEnd.line, column: rangeEnd.column };
    const range = new LocationRange(filePath, start, end);
    
    return { range, content };
  }

}