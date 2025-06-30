import * as ts from 'typescript';
import { Node, SourceFile } from 'ts-morph';

export class PositionFinder {
  getDeclarationAtPosition(sourceFile: SourceFile, line: number, column: number): Node {
    const position = this.calculatePosition(sourceFile, line, column);
    const node = this.getNodeAtPosition(sourceFile, position, line, column);
    return this.getDeclarationFromNode(node, line, column);
  }

  private getNodeAtPosition(sourceFile: SourceFile, position: number, line: number, column: number): Node {
    const node = sourceFile.getDescendantAtPos(position);
    if (!node) {
      throw new Error(`No node found at line ${line}, column ${column}`);
    }
    return node;
  }

  private getDeclarationFromNode(node: Node, line: number, column: number): Node {
    const declarationNode = this.findContainingDeclaration(node);
    if (!declarationNode) {
      throw new Error(`No variable declaration found at line ${line}, column ${column}`);
    }
    return declarationNode;
  }

  private calculatePosition(sourceFile: SourceFile, line: number, column: number): number {
    return sourceFile.compilerNode.getPositionOfLineAndCharacter(line - 1, column - 1);
  }

  private findContainingDeclaration(node: Node): Node | undefined {
    let current: Node | undefined = node;
    while (current) {
      if (this.isDeclaration(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

  private isDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }
}