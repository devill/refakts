import { SelectMatch } from '../../types/selection-types';

export class MatchContext {
  constructor(
    public readonly content: string,
    public readonly lines: string[],
    public readonly fileName: string,
    public readonly filePath?: string
  ) {}

  static fromContent(content: string, fileName: string, filePath?: string): MatchContext {
    const lines = content.split('\n');
    return new MatchContext(content, lines, fileName, filePath);
  }

  getIndexFromLineColumn(line: number, column: number): number {
    let index = 0;
    
    for (let i = 0; i < line - 1; i++) {
      index += this.lines[i].length + 1;
    }
    
    return index + column - 1;
  }

  getLineColumnFromIndex(index: number): { line: number; column: number } | null {
    const beforeIndex = this.content.substring(0, index);
    const lines = beforeIndex.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return { line, column };
  }

  isMatchInComment(selectMatch: SelectMatch): boolean {
    const beforeMatch = this.content.substring(0, this.getIndexFromLineColumn(selectMatch.line, selectMatch.column));
    const commentStartIndex = beforeMatch.lastIndexOf('/**');
    const commentEndIndex = beforeMatch.lastIndexOf('*/');
    
    return commentStartIndex > commentEndIndex;
  }
}