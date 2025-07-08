import { SelectMatch } from '../../../types/selection-types';

interface Position {
  line: number;
  column: number;
}

export class MatchBuildContext {
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