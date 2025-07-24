export interface SelectMatch {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  text: string;
  fullLine: string;
}

export class SelectMatchSorter {
  private static lineComparator = (a: SelectMatch, b: SelectMatch) => a.line - b.line;
  private static columnComparator = (a: SelectMatch, b: SelectMatch) => a.column - b.column;

  static compareByPosition(a: SelectMatch, b: SelectMatch): number {
    const lineComparison = SelectMatchSorter.lineComparator(a, b);
    if (lineComparison !== 0) {
      return lineComparison;
    }
    return SelectMatchSorter.columnComparator(a, b);
  }

  static sortByPosition(matches: SelectMatch[]): SelectMatch[] {
    return matches.sort(SelectMatchSorter.compareByPosition);
  }
}

export class SelectResult {
  constructor(
    public _location: string,
    public _content?: string,
    public _context?: string
  ) {}

  get location(): string {
    return this._location;
  }

  get content(): string | undefined {
    return this._content;
  }

  get context(): string | undefined {
    return this._context;
  }

  toString(): string {
    if (this.hasPreviewContent()) return this.formatPreviewContent();
    if (this.isMultiLineResult()) return this.formatMultiLineResult();
    if (this._content) return this.formatSingleLineResult();
    return this._location;
  }

  private formatPreviewContent(): string {
    return `${this._location} ${this._context}`;
  }

  private formatMultiLineResult(): string {
    return `${this._location}\n${this._content || ''}\n${this._location}`;
  }

  private formatSingleLineResult(): string {
    return `${this._location} ${this._content}`;
  }

  hasPreviewContent(): boolean {
    return !!(this._content && this._context);
  }

  isMultiLineResult(): boolean {
    if (!this._content || !this._location.includes(':-') || !this._location.includes(':')) {
      return false;
    }
    const hasMultiLineRange = this._location.match(/(\d+):-(\d+):/);
    return hasMultiLineRange ? hasMultiLineRange[1] !== hasMultiLineRange[2] : false;
  }
}

export interface DefinitionRange {
  startLine: number;
  endLine: number;
  content: string;
}