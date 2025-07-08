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
    public _pattern: RegExp,
    public _content: string,
    public _context: MatchContext,
    public _matches: SelectMatch[]
  ) {}

  processAllMatches(): void {
    let match;
    while ((match = this._pattern.exec(this._content)) !== null) {
      const selectMatch = this.createMultilineMatch(match);
      if (selectMatch && !this._context.isMatchInComment(selectMatch)) {
        this._matches.push(selectMatch);
      }
    }
  }

  private createMultilineMatch(match: RegExpExecArray): SelectMatch | null {
    const positions = this.getMatchPositions(match);
    if (!positions) return null;
    
    const { textToUse, adjustedStartPos } = this.extractMultilineMatchDetails(match, positions.startPos);
    const buildContext = new MatchBuildContext(adjustedStartPos, positions.endPos, textToUse, this._context.lines);
    return buildContext.buildSelectMatch();
  }

  private getMatchPositions(match: RegExpExecArray) {
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;
    
    const startPos = this._context.getLineColumnFromIndex(startIndex);
    const endPos = this._context.getLineColumnFromIndex(endIndex);
    
    return startPos && endPos ? { startPos, endPos } : null;
  }

  private extractMultilineMatchDetails(match: RegExpExecArray, startPos: Position): { textToUse: string; adjustedStartPos: Position } {
    const detailsContext = new MatchDetailsContext(match, startPos, this._context);
    return detailsContext.extractDetails();
  }
}

class LineProcessingContext {
  constructor(
    public _line: string,
    public _lineIndex: number,
    public _pattern: RegExp,
    public _matches: SelectMatch[]
  ) {}

  processLine(): void {
    if (this.isCommentLine()) {
      return;
    }
    
    this.extractMatchesFromLine();
  }

  private isCommentLine(): boolean {
    const trimmedLine = this._line.trim();
    return trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*');
  }

  private extractMatchesFromLine(): void {
    let match;
    this._pattern.lastIndex = 0;
    
    while ((match = this._pattern.exec(this._line)) !== null) {
      const selectMatch = this.createSelectMatch(match);
      this._matches.push(selectMatch);
    }
  }

  private createSelectMatch(match: RegExpExecArray): SelectMatch {
    const { textToUse, startIndex } = this.extractMatchDetails(match);
    const matchContext = new SelectMatchContext(textToUse, startIndex, this._lineIndex, this._line);
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
    public _startPos: Position,
    public _context: MatchContext
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
      const adjustedStartPos = this._context.getLineColumnFromIndex(captureStart);
      return adjustedStartPos || this._startPos;
    }
    
    return this._startPos;
  }
}

class SelectMatchContext {
  constructor(
    public _textToUse: string,
    public _startIndex: number,
    public _lineIndex: number,
    public _line: string
  ) {}

  buildSelectMatch(): SelectMatch {
    return {
      line: this._lineIndex + 1,
      column: this._startIndex + 1,
      endLine: this._lineIndex + 1,
      endColumn: this._startIndex + this._textToUse.length + 1,
      text: this._textToUse,
      fullLine: this._line
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


  private findRegexMatches(lines: string[], pattern: RegExp): SelectMatch[] {
    const matches: SelectMatch[] = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineContext = new LineProcessingContext(lines[lineIndex], lineIndex, pattern, matches);
      lineContext.processLine();
    }
    
    return matches;
  }

}