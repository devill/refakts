import * as ts from 'typescript';
import { Node } from 'ts-morph';

export class UsageTypeDetector {
  determineUsageType(node: Node): 'read' | 'write' | 'update' {
    const parent = node.getParent();
    return this.classifyUsageByParent(parent, node);
  }

  private classifyUsageByParent(parent: Node | undefined, node: Node): 'read' | 'write' | 'update' {
    if (this.isWriteContext(parent, node)) {
      return 'write';
    }
    
    if (this.isUpdateContext(parent, node)) {
      return 'update';
    }
    
    return 'read';
  }

  private isWriteContext(parent: Node | undefined, node: Node): boolean {
    if (!parent) return false;
    
    if (parent.getKind() === ts.SyntaxKind.BinaryExpression) {
      const binaryExpr = parent as any;
      return this.isAssignmentOperator(binaryExpr) &&
             binaryExpr.getLeft() === node;
    }
    
    return false;
  }

  private isUpdateContext(parent: Node | undefined, node: Node): boolean {
    if (!parent) return false;
    
    return this.isUnaryUpdateExpression(parent) || this.isCompoundAssignment(parent, node);
  }

  private isAssignmentOperator(binaryExpr: any): boolean {
    return binaryExpr.getOperatorToken().getKind() === ts.SyntaxKind.EqualsToken;
  }

  private isUnaryUpdateExpression(parent: Node): boolean {
    return parent.getKind() === ts.SyntaxKind.PostfixUnaryExpression ||
           parent.getKind() === ts.SyntaxKind.PrefixUnaryExpression;
  }

  private isCompoundAssignment(parent: Node, node: Node): boolean {
    if (parent.getKind() !== ts.SyntaxKind.BinaryExpression) {
      return false;
    }
    
    const binaryExpr = parent as any;
    const operator = binaryExpr.getOperatorToken().getKind();
    const isCompoundOperator = this.isCompoundAssignmentOperator(operator);
    const isLeftSide = binaryExpr.getLeft() === node;
    
    return isCompoundOperator && isLeftSide;
  }

  private isCompoundAssignmentOperator(operator: ts.SyntaxKind): boolean {
    return operator === ts.SyntaxKind.PlusEqualsToken ||
           operator === ts.SyntaxKind.MinusEqualsToken ||
           operator === ts.SyntaxKind.AsteriskEqualsToken ||
           operator === ts.SyntaxKind.SlashEqualsToken;
  }
}