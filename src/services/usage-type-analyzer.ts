import { Node, SyntaxKind } from 'ts-morph';
import { UsageType } from '../core/location-range';

export class UsageTypeAnalyzer {
  static determineUsageType(node: Node): UsageType {
    const parent = node.getParent();
    if (!parent) {
      return 'read';
    }

    switch (parent.getKind()) {
      case SyntaxKind.BinaryExpression:
        return this.analyzeBinaryExpression(node, parent);
      
      case SyntaxKind.PostfixUnaryExpression:
      case SyntaxKind.PrefixUnaryExpression:
        return this.analyzeUnaryExpression(parent);
      
      case SyntaxKind.VariableDeclaration:
        return 'write'; // This is the declaration itself
      
      case SyntaxKind.CallExpression:
      case SyntaxKind.PropertyAccessExpression:
      case SyntaxKind.ElementAccessExpression:
        return 'read'; // Reading for function calls or property access
      
      default:
        return 'read';
    }
  }

  private static analyzeBinaryExpression(node: Node, parent: Node): UsageType {
    const binaryExpression = parent.asKindOrThrow(SyntaxKind.BinaryExpression);
    const operatorToken = binaryExpression.getOperatorToken();
    
    // If this identifier is on the left side of an assignment
    if (binaryExpression.getLeft() === node) {
      switch (operatorToken.getKind()) {
        case SyntaxKind.EqualsToken:
        case SyntaxKind.PlusEqualsToken:
        case SyntaxKind.MinusEqualsToken:
        case SyntaxKind.AsteriskEqualsToken:
        case SyntaxKind.SlashEqualsToken:
        case SyntaxKind.PercentEqualsToken:
          return 'write';
        default:
          return 'read';
      }
    }
    
    // If on the right side, it's always a read
    return 'read';
  }

  private static analyzeUnaryExpression(parent: Node): UsageType {
    const postfixUnary = parent.asKind(SyntaxKind.PostfixUnaryExpression);
    const prefixUnary = parent.asKind(SyntaxKind.PrefixUnaryExpression);
    
    if (postfixUnary) {
      const operator = postfixUnary.getOperatorToken();
      if (operator === SyntaxKind.PlusPlusToken || operator === SyntaxKind.MinusMinusToken) {
        return 'write';
      }
    }
    
    if (prefixUnary) {
      const operator = prefixUnary.getOperatorToken();
      if (operator === SyntaxKind.PlusPlusToken || operator === SyntaxKind.MinusMinusToken) {
        return 'write';
      }
    }
    
    return 'read';
  }
}