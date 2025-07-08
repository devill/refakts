import * as ts from 'typescript';
import { Node, BinaryExpression } from 'ts-morph';
import { NodeContext } from '../../core/node-context';

export class NodeAssignmentAnalyzer {
  static isAssignmentContext(parent: Node | undefined, node: Node): boolean {
    if (!parent) return false;
    
    return this.isBinaryAssignment(parent, node);
  }

  static isUpdateContext(parent: Node | undefined, node: Node): boolean {
    if (!parent) return false;
    
    return this.isUnaryUpdateExpression(parent) || 
           this.isCompoundAssignment(parent, node);
  }

  static determineUsageType(node: Node): 'read' | 'write' | 'update' {
    const nodeContext = NodeContext.create(node, node.getSourceFile());
    
    if (nodeContext.isAssignmentContext()) return 'write';
    if (nodeContext.isUpdateContext()) return 'update';
    return 'read';
  }

  private static isBinaryAssignment(parent: Node, node: Node): boolean {
    if (parent.getKind() !== ts.SyntaxKind.BinaryExpression) return false;
    
    const binaryExpr = parent.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
    return this.isAssignmentOperator(binaryExpr) && binaryExpr.getLeft() === node;
  }

  private static isAssignmentOperator(binaryExpr: BinaryExpression): boolean {
    return binaryExpr.getOperatorToken().getKind() === ts.SyntaxKind.EqualsToken;
  }

  private static isUnaryUpdateExpression(parent: Node): boolean {
    return parent.getKind() === ts.SyntaxKind.PostfixUnaryExpression ||
           parent.getKind() === ts.SyntaxKind.PrefixUnaryExpression;
  }

  private static isCompoundAssignment(parent: Node, node: Node): boolean {
    if (parent.getKind() !== ts.SyntaxKind.BinaryExpression) {
      return false;
    }
    
    const binaryExpr = parent.asKindOrThrow(ts.SyntaxKind.BinaryExpression);
    return this.isCompoundAssignmentOperator(binaryExpr.getOperatorToken().getKind()) &&
           binaryExpr.getLeft() === node;
  }

  private static isCompoundAssignmentOperator(operator: ts.SyntaxKind): boolean {
    return operator === ts.SyntaxKind.PlusEqualsToken ||
           operator === ts.SyntaxKind.MinusEqualsToken ||
           operator === ts.SyntaxKind.AsteriskEqualsToken ||
           operator === ts.SyntaxKind.SlashEqualsToken;
  }
}