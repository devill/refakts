import { SelectMatch } from '../../../types/selection-types';

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

    const hasCapture = this._fullMatch.length > 1 && this._fullMatch[1] !== undefined;
    const fullMatchStart = this._fullMatch.index!;
    const fullMatchEnd = fullMatchStart + this._fullMatch[0].length;
    
    let result = this._line;
    
    if (hasCapture) {
      // For capture groups: wrap full match with ◆◇ and capture group with ≫≪
      const before = result.substring(0, fullMatchStart);
      const fullMatchText = result.substring(fullMatchStart, fullMatchEnd);
      const after = result.substring(fullMatchEnd);
      
      // Add symbols around the capture group within the full match
      const captureStart = this._startIndex - fullMatchStart;
      const captureEnd = captureStart + this._textToUse.length;
      const beforeCapture = fullMatchText.substring(0, captureStart);
      const captureText = fullMatchText.substring(captureStart, captureEnd);
      const afterCapture = fullMatchText.substring(captureEnd);
      
      const wrappedFullMatch = `◆${beforeCapture}≫${captureText}≪${afterCapture}◇`;
      result = `${before}${wrappedFullMatch}${after}`;
    } else {
      // For full matches: wrap with ≫≪ symbols
      const before = result.substring(0, fullMatchStart);
      const matchText = result.substring(fullMatchStart, fullMatchEnd);
      const after = result.substring(fullMatchEnd);
      
      result = `${before}≫${matchText}≪${after}`;
    }
    
    return result;
  }
}