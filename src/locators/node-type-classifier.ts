import * as ts from 'typescript';
import { Node } from 'ts-morph';

export class NodeTypeClassifier {
  static isDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

  static isAnyDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

  static isScopeNode(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.FunctionDeclaration ||
           node.getKind() === ts.SyntaxKind.FunctionExpression ||
           node.getKind() === ts.SyntaxKind.ArrowFunction ||
           node.getKind() === ts.SyntaxKind.Block ||
           node.getKind() === ts.SyntaxKind.SourceFile;
  }

  static isIdentifierNode(node: Node): boolean {
    return Node.isIdentifier(node);
  }

  static validateIdentifierNode(node: Node): void {
    if (!Node.isIdentifier(node)) {
      throw new Error(`Expected identifier node, got: ${node.getKindName()}`);
    }
  }
}