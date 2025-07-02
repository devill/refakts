import * as ts from 'typescript';
import { Project, Node, SourceFile, Expression } from 'ts-morph';
import { TSQueryHandler } from '../tsquery-handler';
import { ExtractionScopeAnalyzer } from '../services/extraction-scope-analyzer';
import * as path from 'path';

export interface ExpressionMatch {
  expression: string;
  type: string;
  line: number;
  column: number;
  scope: string;
  node: Expression;
}

export interface ExpressionLocationResult {
  query: string;
  matches: ExpressionMatch[];
}

export class ExpressionLocator {
  private project: Project;
  private tsQueryHandler = new TSQueryHandler();
  private scopeAnalyzer = new ExtractionScopeAnalyzer();

  constructor(project?: Project) {
    this.project = project || new Project();
  }

  async findExpressions(filePath: string, query: string): Promise<ExpressionLocationResult> {
    try {
      const result = await this.processExpressionQuery(filePath, query);
      return result;
    } catch (error) {
      throw new Error(`Failed to process file ${filePath}: ${error}`);
    }
  }

  private async processExpressionQuery(filePath: string, query: string): Promise<ExpressionLocationResult> {
    const sourceFile = this.loadSourceFile(filePath);
    const matchingNodes = this.tsQueryHandler.findNodesByQuery(sourceFile, query);
    const matches = this.createExpressionMatches(sourceFile, matchingNodes);
    
    return { query, matches };
  }

  private createExpressionMatches(sourceFile: SourceFile, nodes: Node[]): ExpressionMatch[] {
    const matches: ExpressionMatch[] = [];
    
    for (const node of nodes) {
      this.addExpressionMatch(sourceFile, node, matches);
    }
    
    return matches;
  }

  private addExpressionMatch(sourceFile: SourceFile, node: Node, matches: ExpressionMatch[]): void {
    if (Node.isExpression(node)) {
      matches.push(this.createExpressionMatch(sourceFile, node));
    }
  }

  private createExpressionMatch(sourceFile: SourceFile, node: Expression): ExpressionMatch {
    const location = sourceFile.getLineAndColumnAtPos(node.getStart());
    const scope = this.scopeAnalyzer.findScopeName(node);
    
    return this.buildExpressionMatch(node, location, scope);
  }

  private buildExpressionMatch(node: Expression, location: any, scope: string): ExpressionMatch {
    return {
      expression: node.getText(),
      type: node.getKindName(),
      line: location.line,
      column: location.column,
      scope: scope,
      node: node
    };
  }

  private loadSourceFile(filePath: string): SourceFile {
    const absolutePath = path.resolve(filePath);
    if (this.project.getSourceFile(absolutePath)) {
      return this.project.getSourceFile(absolutePath)!;
    }
    return this.project.addSourceFileAtPath(absolutePath);
  }

}