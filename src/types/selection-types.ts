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

export interface SelectResult {
  location: string;
  content?: string;
  context?: string;
}

export interface DefinitionRange {
  startLine: number;
  endLine: number;
  content: string;
}