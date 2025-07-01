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
      
      const matches: ExpressionMatch[] = [];
      
      for (const node of matchingNodes) {
        if (Node.isExpression(node)) {
          const location = sourceFile.getLineAndColumnAtPos(node.getStart());
          const scope = this.findScopeName(node);
          
          matches.push({
            expression: node.getText(),
            type: node.getKindName(),
            line: location.line,
            column: location.column,
            scope: scope,
            node: node
          });
        }
      }
      
      return {
        query,
        matches
      };
    } catch (error) {
      throw new Error(`Failed to process file ${filePath}: ${error}`);
    }
  }

  private loadSourceFile(filePath: string): SourceFile {
    const absolutePath = path.resolve(filePath);
    if (this.project.getSourceFile(absolutePath)) {
      return this.project.getSourceFile(absolutePath)!;
    }
    return this.project.addSourceFileAtPath(absolutePath);
  }

  private findScopeName(node: Node): string {
    let current = node.getParent();
    
    while (current) {
      if (Node.isFunctionDeclaration(current)) {
        const name = current.getName();
        return `function ${name || '<anonymous>'}`;
      } else if (Node.isMethodDeclaration(current)) {
        const name = current.getName();
        return `method ${name}`;
      } else if (Node.isArrowFunction(current)) {
        return 'arrow function';
      } else if (Node.isConstructorDeclaration(current)) {
        return 'constructor';
      } else if (Node.isSourceFile(current)) {
        return 'file scope';
      }
      current = current.getParent();
    }
    
    return 'unknown scope';
  }
}