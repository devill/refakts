export interface SelectMatch {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  text: string;
  fullLine: string;
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