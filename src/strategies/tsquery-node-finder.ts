import { NodeFinder, SearchResult, NodeMatch, ExpressionMatch } from './node-finder';
import { ASTService } from '../services/ast-service';
import { ExpressionLocator } from '../locators/expression-locator';

export class TSQueryNodeFinder extends NodeFinder {
  private astService = new ASTService();
  private expressionLocator: ExpressionLocator;

  constructor() {
    super();
    this.expressionLocator = new ExpressionLocator(this.astService.getProject());
  }

  findNodes(file: string, pattern: string): SearchResult {
    const sourceFile = this.astService.loadSourceFile(file);
    const nodes = this.astService.findNodesByQuery(sourceFile, pattern);
    const matches = this.createNodeMatches(sourceFile, nodes);

    return {
      query: pattern,
      matches
    };
  }

  async findExpressions(file: string, pattern: string): Promise<SearchResult> {
    const result = await this.expressionLocator.findExpressions(file, pattern);
    const serializableMatches = this.createSerializableExpressionMatches(result.matches);

    return {
      query: result.query,
      matches: serializableMatches
    };
  }

  private createNodeMatches(sourceFile: any, nodes: any[]): NodeMatch[] {
    return nodes.map(node => this.createNodeMatch(sourceFile, node));
  }

  private createNodeMatch(sourceFile: any, node: any): NodeMatch {
    const location = sourceFile.getLineAndColumnAtPos(node.getStart());
    return {
      kind: node.getKindName(),
      text: this.truncateText(node.getText()),
      line: location.line,
      column: location.column
    };
  }

  private createSerializableExpressionMatches(matches: any[]): ExpressionMatch[] {
    return matches.map(match => ({
      expression: match.expression,
      type: match.type,
      line: match.line,
      column: match.column,
      scope: match.scope
    }));
  }

  private truncateText(text: string): string {
    const maxLength = 50;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}