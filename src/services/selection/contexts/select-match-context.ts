import { SelectMatch } from '../../../core/services/selection/selection-types';

export class SelectMatchContext {
  constructor(
    public _textToUse: string,
    public _startIndex: number,
    public _lineIndex: number,
    public _line: string,
    public _fullMatch?: RegExpExecArray
  ) {}

  buildSelectMatch(): SelectMatch {
    return {
      line: this._lineIndex + 1,
      column: this._startIndex + 1,
      endLine: this._lineIndex + 1,
      endColumn: this._startIndex + this._textToUse.length + 1,
      text: this._textToUse,
      fullLine: this.addSymbolsToFullLine()
    };
  }

  private addSymbolsToFullLine(): string {
    if (!this._fullMatch) {
      return this._line;
    }

    const matchBounds = this.calculateMatchBounds();
    const hasCapture = this._fullMatch.length > 1 && this._fullMatch[1] !== undefined;
    
    return hasCapture ? 
      this.wrapWithCaptureGroupSymbols(matchBounds.start, matchBounds.end) :
      this.wrapWithSelectionSymbols(matchBounds.start, matchBounds.end);
  }

  private calculateMatchBounds(): { start: number; end: number } {
    const start = this._fullMatch?.index ?? 0;
    const end = start + (this._fullMatch?.[0].length ?? 0);
    return { start, end };
  }

  private wrapWithCaptureGroupSymbols(fullMatchStart: number, fullMatchEnd: number): string {
    const before = this._line.substring(0, fullMatchStart);
    const fullMatchText = this._line.substring(fullMatchStart, fullMatchEnd);
    const after = this._line.substring(fullMatchEnd);
    
    const wrappedFullMatch = this.addCaptureGroupMarkers(fullMatchText, fullMatchStart);
    return `${before}${wrappedFullMatch}${after}`;
  }

  private addCaptureGroupMarkers(fullMatchText: string, fullMatchStart: number): string {
    const captureStart = this._startIndex - fullMatchStart;
    const captureEnd = captureStart + this._textToUse.length;
    const beforeCapture = fullMatchText.substring(0, captureStart);
    const captureText = fullMatchText.substring(captureStart, captureEnd);
    const afterCapture = fullMatchText.substring(captureEnd);
    
    return `◆${beforeCapture}≫${captureText}≪${afterCapture}◇`;
  }

  private wrapWithSelectionSymbols(fullMatchStart: number, fullMatchEnd: number): string {
    const before = this._line.substring(0, fullMatchStart);
    const matchText = this._line.substring(fullMatchStart, fullMatchEnd);
    const after = this._line.substring(fullMatchEnd);
    
    return `${before}≫${matchText}≪${after}`;
  }
}