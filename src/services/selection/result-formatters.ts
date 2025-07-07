import { SelectMatch, SelectResult } from '../../types/selection-types';
import { DefinitionRangeDetector } from './definition-range-detector';
import { MatchContext } from './match-context';

export interface SelectResultFormatter {
  format(_matches: SelectMatch[], _fileName: string, _file?: string): SelectResult[];
}

export class BasicFormatter implements SelectResultFormatter {
  format(matches: SelectMatch[], fileName: string): SelectResult[] {
    return matches.map(match => this.formatMatch(match, fileName));
  }

  private formatMatch(match: SelectMatch, fileName: string): SelectResult {
    const location = this.createLocationString(match, fileName);
    
    if (this.isMultilineMatch(match)) {
      return this.formatMultilineMatch(match, location);
    }
    
    return this.formatSingleLineMatch(match, location);
  }

  private createLocationString(match: SelectMatch, fileName: string): string {
    return `[${fileName} ${match.line}:${match.column}-${match.endLine}:${match.endColumn}]`;
  }

  private formatSingleLineMatch(match: SelectMatch, location: string): SelectResult {
    return {
      location,
      content: match.text
    };
  }

  private isMultilineMatch(match: SelectMatch): boolean {
    return match.line !== match.endLine;
  }

  private formatMultilineMatch(match: SelectMatch, location: string): SelectResult {
    return {
      location: `\n${location}`,
      content: `${match.text}\n${location}\n`
    };
  }
}

export class LineFormatter implements SelectResultFormatter {
  format(matches: SelectMatch[], fileName: string): SelectResult[] {
    return matches.map(match => ({
      location: `[${fileName} ${match.line}:-${match.line}:]`,
      content: match.fullLine.trim()
    }));
  }
}

export class PreviewFormatter implements SelectResultFormatter {
  format(matches: SelectMatch[], fileName: string): SelectResult[] {
    return matches.map(match => ({
      location: `[${fileName} ${match.line}:${match.column}-${match.endLine}:${match.endColumn}]`,
      content: match.fullLine.trim()
    }));
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
    return {
      location: `[${fileName} ${definitionRange.startLine}:-${definitionRange.endLine}:]`,
      content: definitionRange.content
    };
  }

  format(matches: SelectMatch[], fileName: string, file: string): SelectResult[] {
    const results: SelectResult[] = [];
    const context = MatchContext.fromContent(file, fileName);
    
    for (const match of matches) {
      this.processMatchForDefinition(match, context, results);
    }
    
    return results;
  }

  private processMatchForDefinition(match: SelectMatch, context: MatchContext, results: SelectResult[]): void {
    const result = this.createDefinitionResult(match, context.fileName, context.content);
    if (result) {
      results.push(result);
    }
  }
}