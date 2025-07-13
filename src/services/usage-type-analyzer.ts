import { Node, SyntaxKind } from 'ts-morph';
import { UsageType } from '../core/location-range';

export class UsageTypeAnalyzer {
  static determineUsageType(node: Node): UsageType {
    const parent = node.getParent();
    if (!parent) {
      return 'read';
    }

    return this.analyzeParentContext(node, parent);
  }

  private static analyzeParentContext(node: Node, parent: Node): UsageType {
    switch (parent.getKind()) {
      case SyntaxKind.BinaryExpression:
        return this.analyzeBinaryExpression(node, parent);
      
      case SyntaxKind.PostfixUnaryExpression:
      case SyntaxKind.PrefixUnaryExpression:
        return this.analyzeUnaryExpression(parent);
      
      case SyntaxKind.VariableDeclaration:
        return 'write';
      
      case SyntaxKind.CallExpression:
      case SyntaxKind.PropertyAccessExpression:
      case SyntaxKind.ElementAccessExpression:
        return 'read';
      
      default:
        return 'read';
    }
  }

  private static analyzeBinaryExpression(node: Node, parent: Node): UsageType {
    const binaryExpression = parent.asKindOrThrow(SyntaxKind.BinaryExpression);
    
    if (binaryExpression.getLeft() === node) {
      return this.isAssignmentOperator(binaryExpression) ? 'write' : 'read';
    }
    
    return 'read';
  }

  private static isAssignmentOperator(binaryExpression: Node): boolean {
    const operatorToken = binaryExpression.asKindOrThrow(SyntaxKind.BinaryExpression).getOperatorToken();
    const assignmentOperators = [
      SyntaxKind.EqualsToken, SyntaxKind.PlusEqualsToken, SyntaxKind.MinusEqualsToken,
      SyntaxKind.AsteriskEqualsToken, SyntaxKind.SlashEqualsToken, SyntaxKind.PercentEqualsToken
    ];
    return assignmentOperators.includes(operatorToken.getKind());
  }

  private static analyzeUnaryExpression(parent: Node): UsageType {
    const postfixUnary = parent.asKind(SyntaxKind.PostfixUnaryExpression);
    const prefixUnary = parent.asKind(SyntaxKind.PrefixUnaryExpression);
    
    if (postfixUnary && this.isIncrementDecrementOperator(postfixUnary.getOperatorToken())) {
      return 'write';
    }
    
    if (prefixUnary && this.isIncrementDecrementOperator(prefixUnary.getOperatorToken())) {
      return 'write';
    }
    
    return 'read';
  }

  private static isIncrementDecrementOperator(operator: SyntaxKind): boolean {
    return operator === SyntaxKind.PlusPlusToken || operator === SyntaxKind.MinusMinusToken;
  }
}