import { SelectMatch, SelectResult } from './select-types';
import { DefinitionRangeDetector } from './definition-range-detector';

export interface SelectResultFormatter {
  format(matches: SelectMatch[], fileName: string, file?: string): SelectResult[];
}

export class BasicFormatter implements SelectResultFormatter {
  format(matches: SelectMatch[], fileName: string): SelectResult[] {
    return matches.map(match => ({
      location: `[${fileName} ${match.line}:${match.column}-${match.endLine}:${match.endColumn}]`,
      content: match.text
    }));
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

  private buildDefinitionResult(definitionRange: any, fileName: string): SelectResult {
    return {
      location: `[${fileName} ${definitionRange.startLine}:-${definitionRange.endLine}:]`,
      content: definitionRange.content
    };
  }

  format(matches: SelectMatch[], fileName: string, file: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    for (const match of matches) {
      this.processMatchForDefinition(match, fileName, file, results);
    }
    
    return results;
  }

  private processMatchForDefinition(match: SelectMatch, fileName: string, file: string, results: SelectResult[]): void {
    const result = this.createDefinitionResult(match, fileName, file);
    if (result) {
      results.push(result);
    }
  }
}