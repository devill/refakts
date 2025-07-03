export interface NodeMatch {
  kind: string;
  text: string;
  line: number;
  column: number;
}

export interface ExpressionMatch {
  expression: string;
  type: string;
  line: number;
  column: number;
  scope: string;
}

export interface SearchResult {
  query: string;
  matches: NodeMatch[] | ExpressionMatch[];
}

export abstract class NodeFinder {
  abstract findNodes(file: string, pattern: string): SearchResult;
  abstract findExpressions(file: string, pattern: string): Promise<SearchResult>;
}