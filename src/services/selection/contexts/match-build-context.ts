import { SelectMatch } from '../../../types/selection-types';

interface Position {
  line: number;
  column: number;
}

export class MatchBuildContext {
  constructor(
    public _adjustedStartPos: Position,
    public _endPos: Position,
    public _textToUse: string,
    public _lines: string[]
  ) {}

  buildSelectMatch(): SelectMatch {
    return {
      line: this._adjustedStartPos.line,
      column: this._adjustedStartPos.column,
      endLine: this._endPos.line,
      endColumn: this._endPos.column,
      text: this._textToUse,
      fullLine: this._lines[this._adjustedStartPos.line - 1] || ''
    };
  }
}