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

  format(matches: SelectMatch[], fileName: string, file: string): SelectResult[] {
    const results: SelectResult[] = [];
    
    for (const match of matches) {
      const definitionRange = this.detector.findDefinitionRange(match, file);
      if (definitionRange) {
        results.push({
          location: `[${fileName} ${definitionRange.startLine}:-${definitionRange.endLine}:]`,
          content: definitionRange.content
        });
      }
    }
    
    return results;
  }
}