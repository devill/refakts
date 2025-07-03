import { NodeFinder, SearchResult, NodeMatch, ExpressionMatch } from './node-finder';
import { ASTService } from '../services/ast-service';
import { ExpressionLocator } from '../locators/expression-locator';
import { Node } from 'ts-morph';

export class RegexNodeFinder extends NodeFinder {
  private astService = new ASTService();
  private expressionLocator: ExpressionLocator;

  constructor() {
    super();
    this.expressionLocator = new ExpressionLocator(this.astService.getProject());
  }

  findNodes(file: string, pattern: string): SearchResult {
    const sourceFile = this.astService.loadSourceFile(file);
    const matchingNodes = this.filterNodesByRegex(sourceFile, pattern);
    const matches = this.createNodeMatches(sourceFile, matchingNodes);

    return {
      query: pattern,
      matches
    };
  }

  async findExpressions(file: string, pattern: string): Promise<SearchResult> {
    const result = await this.expressionLocator.findExpressionsByRegex(file, pattern);
    const serializableMatches = this.createSerializableExpressionMatches(result.matches);

    return {
      query: result.query,
      matches: serializableMatches
    };
  }

  private filterNodesByRegex(sourceFile: any, pattern: string): Node[] {
    const regex = new RegExp(pattern);
    const allNodes = this.getAllNodes(sourceFile);
    return allNodes.filter(node => regex.test(node.getText()));
  }

  private getAllNodes(sourceFile: any): Node[] {
    const nodes: Node[] = [];
    
    sourceFile.forEachDescendant((node: Node) => {
      nodes.push(node);
    });
    
    return nodes;
  }

  private createNodeMatches(sourceFile: any, nodes: Node[]): NodeMatch[] {
    return nodes.map(node => this.createNodeMatch(sourceFile, node));
  }

  private createNodeMatch(sourceFile: any, node: Node): NodeMatch {
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