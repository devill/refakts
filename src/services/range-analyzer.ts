import {SourceFile} from 'ts-morph';
import {SelectResult} from '../types/selection-types';
import {RangeAnalysisRequest} from '../core/services/range-analysis-request';
import {PositionData} from '../core/locators/position-data';
import {LocationRange} from '../core/ast/location-range';
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
    const rangeStart = RangeAnalyzer.findRangeStart(request, startIndex);
    const rangeEnd = this.findRangeEnd(request, startIndex);
    if(!rangeStart || !rangeEnd) return null;

    return {
      range: new LocationRange(request.sourceFile.getFilePath(), rangeStart, rangeEnd),
      content: request.extractContentBetween(startIndex, rangeEnd.line - 1)
    };
  }

  private findRangeEnd(request: RangeAnalysisRequest, startIndex: number) {
    const endResult = request.findEndMatch(startIndex);
    if (!endResult) return null;
    return this.calculateRangeEnd(endResult);
  }

  private static findRangeStart(request: RangeAnalysisRequest, startIndex: number) {
    const startResult = request.findStartMatch(startIndex);
    if (!startResult) return null;
    return new PositionData(startIndex + 1, startResult.match.index + 1);
  }

  private calculateRangeEnd(endResult: { match: RegExpExecArray; index: number }): PositionData {
    return new PositionData(endResult.index + 1, endResult.match.index + (endResult.match)[0].length + 1);
  }

}