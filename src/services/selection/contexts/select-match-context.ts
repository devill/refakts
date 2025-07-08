import { SelectMatch } from '../../../types/selection-types';

export class SelectMatchContext {
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