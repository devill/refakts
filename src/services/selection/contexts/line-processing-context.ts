import { SelectMatch } from '../../../types/selection-types';
import { SelectMatchContext } from './select-match-context';

export class LineProcessingContext {
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
    const matchContext = new SelectMatchContext(textToUse, startIndex, this._lineIndex, this._line, match);
    return matchContext.buildSelectMatch();
  }

  private extractMatchDetails(match: RegExpExecArray): { textToUse: string; startIndex: number } {
    const hasCapture = match.length > 1 && match[1] !== undefined;
    const textToUse = hasCapture ? match[1] : match[0];
    const startIndex = hasCapture ? match.index + match[0].indexOf(match[1]) : match.index;
    return { textToUse, startIndex };
  }
}