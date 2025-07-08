import { SelectMatch } from '../../types/selection-types';
import { MatchContext } from './match-context';

interface Position {
  line: number;
  column: number;
}

interface MatchBuildContext {
  adjustedStartPos: Position;
  endPos: Position;
  textToUse: string;
  lines: string[];
}

interface ProcessingContext {
  pattern: RegExp;
  content: string;
  context: MatchContext;
  matches: SelectMatch[];
}

interface LineProcessingContext {
  line: string;
  lineIndex: number;
  pattern: RegExp;
  matches: SelectMatch[];
}

interface MatchDetailsContext {
  match: RegExpExecArray;
  hasCapture: boolean;
  startPos: Position;
  context: MatchContext;
}

interface SelectMatchContext {
  textToUse: string;
  startIndex: number;
  lineIndex: number;
  line: string;
}

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
    
    this.processAllMatches({ pattern, content, context, matches });
    return matches;
  }

  private processAllMatches(processingContext: ProcessingContext): void {
    let match;
    while ((match = processingContext.pattern.exec(processingContext.content)) !== null) {
      this.processMultilineMatch(match, processingContext.context, processingContext.matches);
    }
  }

  private processMultilineMatch(match: RegExpExecArray, context: MatchContext, matches: SelectMatch[]): void {
    const selectMatch = this.createMultilineMatch(match, context);
    if (selectMatch && !context.isMatchInComment(selectMatch)) {
      matches.push(selectMatch);
    }
  }



  private createMultilineMatch(match: RegExpExecArray, context: MatchContext): SelectMatch | null {
    const positions = this.getMatchPositions(match, context);
    if (!positions) return null;
    
    const { textToUse, adjustedStartPos } = this.extractMultilineMatchDetails(match, positions.startPos, context);
    return this.buildMatchFromContext({ adjustedStartPos, endPos: positions.endPos, textToUse, lines: context.lines });
  }

  private buildMatchFromContext(buildContext: MatchBuildContext): SelectMatch {
    return this.buildMultilineSelectMatch(buildContext);
  }

  private getMatchPositions(match: RegExpExecArray, context: MatchContext) {
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;
    
    const startPos = context.getLineColumnFromIndex(startIndex);
    const endPos = context.getLineColumnFromIndex(endIndex);
    
    return startPos && endPos ? { startPos, endPos } : null;
  }

  private buildMultilineSelectMatch(context: MatchBuildContext): SelectMatch {
    return {
      line: context.adjustedStartPos.line,
      column: context.adjustedStartPos.column,
      endLine: context.endPos.line,
      endColumn: context.endPos.column,
      text: context.textToUse,
      fullLine: context.lines[context.adjustedStartPos.line - 1] || ''
    };
  }


  private extractMultilineMatchDetails(match: RegExpExecArray, startPos: { line: number; column: number }, context: MatchContext): { textToUse: string; adjustedStartPos: { line: number; column: number } } {
    const hasCapture = match.length > 1 && match[1] !== undefined;
    const textToUse = hasCapture ? match[1] : match[0];
    
    const adjustedStartPos = this.calculateAdjustedStartPos({ match, hasCapture, startPos, context });
    
    return { textToUse, adjustedStartPos };
  }

  private calculateAdjustedStartPos(detailsContext: MatchDetailsContext): Position {
    if (detailsContext.hasCapture) {
      const captureStart = detailsContext.match.index + detailsContext.match[0].indexOf(detailsContext.match[1]);
      const adjustedStartPos = detailsContext.context.getLineColumnFromIndex(captureStart);
      return adjustedStartPos || detailsContext.startPos;
    }
    
    return detailsContext.startPos;
  }

  private findRegexMatches(lines: string[], pattern: RegExp): SelectMatch[] {
    const matches: SelectMatch[] = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      this.processLineForMatches({ line: lines[lineIndex], lineIndex, pattern, matches });
    }
    
    return matches;
  }

  private processLineForMatches(lineContext: LineProcessingContext): void {
    if (this.isCommentLine(lineContext.line)) {
      return;
    }
    
    this.extractMatchesFromLine(lineContext);
  }

  private isCommentLine(line: string): boolean {
    const trimmedLine = line.trim();
    return trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*');
  }

  private extractMatchesFromLine(lineContext: LineProcessingContext): void {
    let match;
    lineContext.pattern.lastIndex = 0;
    
    while ((match = lineContext.pattern.exec(lineContext.line)) !== null) {
      lineContext.matches.push(this.createSelectMatch(match, lineContext.lineIndex, lineContext.line));
    }
  }

  private createSelectMatch(match: RegExpExecArray, lineIndex: number, line: string): SelectMatch {
    const { textToUse, startIndex } = this.extractMatchDetails(match);
    return this.buildSelectMatch({ textToUse, startIndex, lineIndex, line });
  }

  private extractMatchDetails(match: RegExpExecArray): { textToUse: string; startIndex: number } {
    const hasCapture = match.length > 1 && match[1] !== undefined;
    const textToUse = hasCapture ? match[1] : match[0];
    const startIndex = hasCapture ? match.index + match[0].indexOf(match[1]) : match.index;
    return { textToUse, startIndex };
  }

  private buildSelectMatch(matchContext: SelectMatchContext): SelectMatch {
    return {
      line: matchContext.lineIndex + 1,
      column: matchContext.startIndex + 1,
      endLine: matchContext.lineIndex + 1,
      endColumn: matchContext.startIndex + matchContext.textToUse.length + 1,
      text: matchContext.textToUse,
      fullLine: matchContext.line
    };
  }
}