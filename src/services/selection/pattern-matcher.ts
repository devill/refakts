import { SelectMatch } from '../../types/selection-types';
import { MatchContext } from './match-context';

interface Position {
  line: number;
  column: number;
}

class MatchBuildContext {
  constructor(
    public adjustedStartPos: Position,
    public endPos: Position,
    public textToUse: string,
    public lines: string[]
  ) {}

  buildSelectMatch(): SelectMatch {
    return {
      line: this.adjustedStartPos.line,
      column: this.adjustedStartPos.column,
      endLine: this.endPos.line,
      endColumn: this.endPos.column,
      text: this.textToUse,
      fullLine: this.lines[this.adjustedStartPos.line - 1] || ''
    };
  }
}

class ProcessingContext {
  constructor(
    public pattern: RegExp,
    public content: string,
    public context: MatchContext,
    public matches: SelectMatch[]
  ) {}

  processAllMatches(): void {
    let match;
    while ((match = this.pattern.exec(this.content)) !== null) {
      const selectMatch = this.createMultilineMatch(match);
      if (selectMatch && !this.context.isMatchInComment(selectMatch)) {
        this.matches.push(selectMatch);
      }
    }
  }

  private createMultilineMatch(match: RegExpExecArray): SelectMatch | null {
    const positions = this.getMatchPositions(match);
    if (!positions) return null;
    
    const { textToUse, adjustedStartPos } = this.extractMultilineMatchDetails(match, positions.startPos);
    const buildContext = new MatchBuildContext(adjustedStartPos, positions.endPos, textToUse, this.context.lines);
    return buildContext.buildSelectMatch();
  }

  private getMatchPositions(match: RegExpExecArray) {
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;
    
    const startPos = this.context.getLineColumnFromIndex(startIndex);
    const endPos = this.context.getLineColumnFromIndex(endIndex);
    
    return startPos && endPos ? { startPos, endPos } : null;
  }

  private extractMultilineMatchDetails(match: RegExpExecArray, startPos: Position): { textToUse: string; adjustedStartPos: Position } {
    const detailsContext = new MatchDetailsContext(match, startPos, this.context);
    return detailsContext.extractDetails();
  }
}

class LineProcessingContext {
  constructor(
    public line: string,
    public lineIndex: number,
    public pattern: RegExp,
    public matches: SelectMatch[]
  ) {}

  processLine(): void {
    if (this.isCommentLine()) {
      return;
    }
    
    this.extractMatchesFromLine();
  }

  private isCommentLine(): boolean {
    const trimmedLine = this.line.trim();
    return trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*');
  }

  private extractMatchesFromLine(): void {
    let match;
    this.pattern.lastIndex = 0;
    
    while ((match = this.pattern.exec(this.line)) !== null) {
      const selectMatch = this.createSelectMatch(match);
      this.matches.push(selectMatch);
    }
  }

  private createSelectMatch(match: RegExpExecArray): SelectMatch {
    const { textToUse, startIndex } = this.extractMatchDetails(match);
    const matchContext = new SelectMatchContext(textToUse, startIndex, this.lineIndex, this.line);
    return matchContext.buildSelectMatch();
  }

  private extractMatchDetails(match: RegExpExecArray): { textToUse: string; startIndex: number } {
    const hasCapture = match.length > 1 && match[1] !== undefined;
    const textToUse = hasCapture ? match[1] : match[0];
    const startIndex = hasCapture ? match.index + match[0].indexOf(match[1]) : match.index;
    return { textToUse, startIndex };
  }
}

class MatchDetailsContext {
  public readonly hasCapture: boolean;

  constructor(
    public match: RegExpExecArray,
    public startPos: Position,
    public context: MatchContext
  ) {
    this.hasCapture = match.length > 1 && match[1] !== undefined;
  }

  extractDetails(): { textToUse: string; adjustedStartPos: Position } {
    const textToUse = this.hasCapture ? this.match[1] : this.match[0];
    const adjustedStartPos = this.calculateAdjustedStartPos();
    return { textToUse, adjustedStartPos };
  }

  private calculateAdjustedStartPos(): Position {
    if (this.hasCapture) {
      const captureStart = this.match.index + this.match[0].indexOf(this.match[1]);
      const adjustedStartPos = this.context.getLineColumnFromIndex(captureStart);
      return adjustedStartPos || this.startPos;
    }
    
    return this.startPos;
  }
}

class SelectMatchContext {
  constructor(
    public textToUse: string,
    public startIndex: number,
    public lineIndex: number,
    public line: string
  ) {}

  buildSelectMatch(): SelectMatch {
    return {
      line: this.lineIndex + 1,
      column: this.startIndex + 1,
      endLine: this.lineIndex + 1,
      endColumn: this.startIndex + this.textToUse.length + 1,
      text: this.textToUse,
      fullLine: this.line
    };
  }
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
    
    const processingContext = new ProcessingContext(pattern, content, context, matches);
    processingContext.processAllMatches();
    return matches;
  }

  // Methods moved to ProcessingContext and LineProcessingContext classes

  private findRegexMatches(lines: string[], pattern: RegExp): SelectMatch[] {
    const matches: SelectMatch[] = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineContext = new LineProcessingContext(lines[lineIndex], lineIndex, pattern, matches);
      lineContext.processLine();
    }
    
    return matches;
  }

  // Methods moved to LineProcessingContext class
}