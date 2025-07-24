import { MatchContext } from '../../../command-line-parser/output-formatter/match-context';

interface Position {
  line: number;
  column: number;
}

export class MatchDetailsContext {
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