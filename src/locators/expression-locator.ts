import * as ts from 'typescript';
import { Project, Node, SourceFile, Expression } from 'ts-morph';
import { TSQueryHandler } from '../tsquery-handler';
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

  constructor(project?: Project) {
    this.project = project || new Project();
  }

  async findExpressions(filePath: string, query: string): Promise<ExpressionLocationResult> {
    try {
      const sourceFile = this.loadSourceFile(filePath);
      const matchingNodes = this.tsQueryHandler.findNodesByQuery(sourceFile, query);
      const matches = this.createExpressionMatches(sourceFile, matchingNodes);
      
      return { query, matches };
    } catch (error) {
      throw new Error(`Failed to process file ${filePath}: ${error}`);
    }
  }

  private createExpressionMatches(sourceFile: SourceFile, nodes: Node[]): ExpressionMatch[] {
    const matches: ExpressionMatch[] = [];
    
    for (const node of nodes) {
      if (Node.isExpression(node)) {
        matches.push(this.createExpressionMatch(sourceFile, node));
      }
    }
    
    return matches;
  }

  private createExpressionMatch(sourceFile: SourceFile, node: Expression): ExpressionMatch {
    const location = sourceFile.getLineAndColumnAtPos(node.getStart());
    const scope = this.findScopeName(node);
    
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

  private findScopeName(node: Node): string {
    const scopeName = this.searchParentScopes(node.getParent());
    return scopeName || 'unknown scope';
  }

  private searchParentScopes(current: Node | undefined): string | null {
    while (current) {
      const scopeName = this.getScopeNameForNode(current);
      if (scopeName) {
        return scopeName;
      }
      current = current.getParent();
    }
    return null;
  }

  private getScopeNameForNode(node: Node): string | null {
    if (Node.isFunctionDeclaration(node)) {
      return this.getFunctionScopeName(node);
    }
    if (Node.isMethodDeclaration(node)) {
      return `method ${node.getName()}`;
    }
    return this.getOtherScopeNames(node);
  }

  private getFunctionScopeName(node: any): string {
    const name = node.getName();
    return `function ${name || '<anonymous>'}`;
  }

  private getOtherScopeNames(node: Node): string | null {
    if (Node.isArrowFunction(node)) {
      return 'arrow function';
    }
    if (Node.isConstructorDeclaration(node)) {
      return 'constructor';
    }
    if (Node.isSourceFile(node)) {
      return 'file scope';
    }
    return null;
  }
}