import { SelectMatch, SelectResult } from '../../core/services/selection/selection-types';
import { DefinitionRangeDetector } from '../../core/services/selection/definition-range-detector';
import { MatchContext } from './match-context';
import { LocationRange, SourceLocation } from '../../core/ast/location-range';

export interface SelectResultFormatter {
  format(_matches: SelectMatch[], _fileName: string, _file?: string): SelectResult[];
}

export class BasicFormatter implements SelectResultFormatter {
  format(matches: SelectMatch[], fileName: string): SelectResult[] {
    return matches.map(match => this.formatMatch(match, fileName));
  }

  private formatMatch(match: SelectMatch, fileName: string): SelectResult {
    const locationRange = this.createLocationRange(match, fileName);
    
    if (this.isMultilineMatch(match)) {
      return this.formatMultilineMatch(match, locationRange);
    }
    
    return this.formatSingleLineMatch(match, locationRange);
  }

  private createLocationRange(match: SelectMatch, fileName: string): LocationRange {
    const start: SourceLocation = { line: match.line, column: match.column };
    const end: SourceLocation = { line: match.endLine, column: match.endColumn };
    return new LocationRange(fileName, start, end);
  }

  private formatSingleLineMatch(match: SelectMatch, locationRange: LocationRange): SelectResult {
    return new SelectResult(locationRange.formatLocation('.'), match.text);
  }

  private isMultilineMatch(match: SelectMatch): boolean {
    return match.line !== match.endLine;
  }

  private formatMultilineMatch(match: SelectMatch, locationRange: LocationRange): SelectResult {
    const location = locationRange.formatLocation('.');
    return new SelectResult(`\n${location}`, `${match.text}\n${location}\n`);
  }
}

export class LineFormatter implements SelectResultFormatter {
  format(matches: SelectMatch[], fileName: string): SelectResult[] {
    return matches.map(match => {
      const location = this.formatLineLocation(match, fileName);
      return new SelectResult(
        location,
        match.fullLine.trim()
      );
    });
  }

  private formatLineLocation(match: SelectMatch, fileName: string): string {
    return `[${fileName} ${match.line}:-${match.line}:]`;
  }
}

export class PreviewFormatter implements SelectResultFormatter {
  format(matches: SelectMatch[], fileName: string): SelectResult[] {
    return matches.map(match => {
      const locationRange = this.createLocationRange(match, fileName);
      return new SelectResult(
        locationRange.formatLocation('.'),
        match.fullLine.trim()
      );
    });
  }

  private createLocationRange(match: SelectMatch, fileName: string): LocationRange {
    const start: SourceLocation = { line: match.line, column: match.column };
    const end: SourceLocation = { line: match.endLine, column: match.endColumn };
    return new LocationRange(fileName, start, end);
  }
}

export class DefinitionFormatter implements SelectResultFormatter {
  private detector = new DefinitionRangeDetector();

  private createDefinitionResult(match: SelectMatch, fileName: string, file: string): SelectResult | null {
    const definitionRange = this.detector.findDefinitionRange(match, file);
    if (!definitionRange) {
      return null;
    }
    
    return this.buildDefinitionResult(definitionRange, fileName);
  }

  private buildDefinitionResult(definitionRange: {startLine: number, endLine: number, content: string}, fileName: string): SelectResult {
    const location = this.formatDefinitionLocation(definitionRange, fileName);
    return new SelectResult(
      location,
      definitionRange.content
    );
  }

  private formatDefinitionLocation(definitionRange: {startLine: number, endLine: number, content: string}, fileName: string): string {
    return `[${fileName} ${definitionRange.startLine}:-${definitionRange.endLine}:]`;
  }

  format(matches: SelectMatch[], fileName: string, file: string): SelectResult[] {
    return this.createDefinitionResults(matches, MatchContext.fromContent(file, fileName));
  }

  private createDefinitionResults(matches: SelectMatch[], context: MatchContext) {
    const results: SelectResult[] = [];
    for (const match of matches) {
      const result = this.createDefinitionResult(match, context.fileName, context.content);
      if (result) {
        results.push(result);
      }
    }
    return results;
  }
}