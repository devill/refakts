/**
 * Groups pattern matching parameters that are repeatedly passed together
 * across selection services. Provides a single context object to simplify
 * method signatures and ensure consistent parameter passing.
 */
export class MatchContext {
  private _lines: string[] | null = null;

  constructor(
    public readonly sourceFile: string,
    public readonly content: string,
    public readonly pattern: RegExp,
    public readonly fileName: string = sourceFile
  ) {}

  /**
   * Get content split into lines (cached for performance)
   */
  get lines(): string[] {
    if (this._lines === null) {
      this._lines = this.content.split('\n');
    }
    return this._lines;
  }

  /**
   * Create a copy with a new pattern, reusing other context data
   */
  withPattern(pattern: RegExp): MatchContext {
    return new MatchContext(this.sourceFile, this.content, pattern, this.fileName);
  }

  /**
   * Create a copy with a new fileName, reusing other context data
   */
  withFileName(fileName: string): MatchContext {
    return new MatchContext(this.sourceFile, this.content, this.pattern, fileName);
  }

  /**
   * Check if the pattern is likely to match across multiple lines
   */
  isMultilinePattern(): boolean {
    return this.pattern.source.includes('\\s') || this.pattern.source.includes('\\S');
  }

  /**
   * Get the index position from line and column numbers
   */
  getIndexFromLineColumn(line: number, column: number): number {
    let index = 0;
    
    for (let i = 0; i < line - 1; i++) {
      index += this.lines[i].length + 1; // +1 for newline character
    }
    
    return index + column - 1;
  }

  /**
   * Get line and column position from string index
   */
  getLineColumnFromIndex(index: number): { line: number; column: number } | null {
    if (index < 0 || index >= this.content.length) {
      return null;
    }

    const beforeIndex = this.content.substring(0, index);
    const lines = beforeIndex.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    
    return { line, column };
  }
}