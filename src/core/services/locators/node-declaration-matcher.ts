import * as ts from 'typescript';
import { Node } from 'ts-morph';
import { NodeContext } from '../../node-context';

export class NodeDeclarationMatcher {
  static findContainingDeclaration(node: Node): Node | undefined {
    let current: Node | undefined = node;
    while (current) {
      if (this.isDeclaration(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

  private static isDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

  static hasMatchingIdentifier(node: Node, variableName: string): boolean {
    const identifier = node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText() === variableName;
  }

  static getDeclarationIdentifier(declaration: Node): Node | undefined {
    return declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
  }

  static isVariableDeclaration(node: Node, variableName: string): boolean {
    const nodeContext = NodeContext.create(node, node.getSourceFile());
    return nodeContext.isVariableDeclaration(variableName);
  }

  static isParameterDeclaration(node: Node, variableName: string): boolean {
    const nodeContext = NodeContext.create(node, node.getSourceFile());
    return nodeContext.isParameterDeclaration(variableName);
  }

  static isMatchingDeclaration(node: Node, variableName: string): boolean {
    const nodeContext = NodeContext.create(node, node.getSourceFile());
    return nodeContext.isMatchingDeclaration(variableName);
  }

  static isUsageNode(node: Node, variableName: string, declarationIdentifier: Node | undefined): boolean {
    return node.getKind() === ts.SyntaxKind.Identifier && 
           node.getText() === variableName && 
           node !== declarationIdentifier;
  }

  static needsParentheses(node: Node): boolean {
    if (!Node.isBinaryExpression(node)) return false;
    
    const binaryExpr = node.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
    return this.isArithmeticExpression(binaryExpr) && this.hasSimpleOperands(binaryExpr);
  }

  static isValidExtractionScope(parent: Node | undefined): parent is Node {
    return parent !== undefined && (Node.isBlock(parent) || Node.isSourceFile(parent));
  }

  static isContainingStatement(current: Node): boolean {
    const parent = current.getParent();
    return this.isValidExtractionScope(parent);
  }

  private static isArithmeticExpression(binaryExpr: Node): boolean {
    if (!Node.isBinaryExpression(binaryExpr)) return false;
    const operator = binaryExpr.getOperatorToken().getKind();
    return operator === ts.SyntaxKind.PlusToken || operator === ts.SyntaxKind.MinusToken;
  }

  private static hasSimpleOperands(binaryExpr: Node): boolean {
    if (!Node.isBinaryExpression(binaryExpr)) return false;
    const left = binaryExpr.getLeft();
    const right = binaryExpr.getRight();
    return (Node.isIdentifier(left) || Node.isNumericLiteral(left)) &&
           (Node.isIdentifier(right) || Node.isNumericLiteral(right));
  }
}