import { SelectMatch } from '../../core/services/selection/selection-types';
import { MatchContext } from '../../command-line-parser/output-formatter/match-context';
import { ProcessingContext } from './contexts/processing-context';
import { LineProcessingContext } from './contexts/line-processing-context';

export class SelectPatternMatcher {
  findMatches(content: string, pattern: RegExp): SelectMatch[] {
    const lines = content.split('\n');
    
    if (this.isMultilinePattern(pattern)) {
      return this.findMultilineMatches(content, pattern, lines);
    }
    
    return this.findRegexMatches(lines, pattern);
  }

  private isMultilinePattern(pattern: RegExp): boolean {
    return pattern.source.includes('\\s') || pattern.source.includes('\\S');
  }

  private findMultilineMatches(content: string, pattern: RegExp, lines: string[]): SelectMatch[] {
    const matches: SelectMatch[] = [];
    const context = new MatchContext(content, lines, '');
    
    const processingContext = new ProcessingContext(pattern, content, context, matches);
    processingContext.processAllMatches();
    return matches;
  }


  private findRegexMatches(lines: string[], pattern: RegExp): SelectMatch[] {
    const matches: SelectMatch[] = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineContext = new LineProcessingContext(lines[lineIndex], lineIndex, pattern, matches);
      lineContext.processLine();
    }
    
    return matches;
  }

}