import { Node, SyntaxKind } from 'ts-morph';
import { UsageType } from '../core/location-range';

interface UsageHandler {
  // eslint-disable-next-line no-unused-vars
  canHandle(parent: Node): boolean;
  // eslint-disable-next-line no-unused-vars
  handle(node: Node, parent: Node): UsageType;
}

class BinaryExpressionHandler implements UsageHandler {
  canHandle(parent: Node): boolean {
    return parent.getKind() === SyntaxKind.BinaryExpression;
  }

  handle(node: Node, parent: Node): UsageType {
    const binaryExpression = parent.asKindOrThrow(SyntaxKind.BinaryExpression);
    
    if (binaryExpression.getLeft() === node) {
      return this.isAssignmentOperator(binaryExpression) ? 'write' : 'read';
    }
    
    return 'read';
  }

  private isAssignmentOperator(binaryExpression: Node): boolean {
    const operatorToken = binaryExpression.asKindOrThrow(SyntaxKind.BinaryExpression).getOperatorToken();
    const assignmentOperators = [
      SyntaxKind.EqualsToken, SyntaxKind.PlusEqualsToken, SyntaxKind.MinusEqualsToken,
      SyntaxKind.AsteriskEqualsToken, SyntaxKind.SlashEqualsToken, SyntaxKind.PercentEqualsToken
    ];
    return assignmentOperators.includes(operatorToken.getKind());
  }
}

class UnaryExpressionHandler implements UsageHandler {
  canHandle(parent: Node): boolean {
    return parent.getKind() === SyntaxKind.PostfixUnaryExpression || 
           parent.getKind() === SyntaxKind.PrefixUnaryExpression;
  }

  handle(node: Node, parent: Node): UsageType {
    const postfixUnary = parent.asKind(SyntaxKind.PostfixUnaryExpression);
    const prefixUnary = parent.asKind(SyntaxKind.PrefixUnaryExpression);
    
    const operatorToken = postfixUnary?.getOperatorToken() || prefixUnary?.getOperatorToken();
    
    return operatorToken && this.isIncrementDecrementOperator(operatorToken) ? 'write' : 'read';
  }

  private isIncrementDecrementOperator(operator: SyntaxKind): boolean {
    return operator === SyntaxKind.PlusPlusToken || operator === SyntaxKind.MinusMinusToken;
  }
}

class VariableDeclarationHandler implements UsageHandler {
  canHandle(parent: Node): boolean {
    return parent.getKind() === SyntaxKind.VariableDeclaration;
  }

  handle(_node: Node, _parent: Node): UsageType {
    return 'write';
  }
}

class ReadOnlyHandler implements UsageHandler {
  canHandle(parent: Node): boolean {
    const readOnlyKinds = [
      SyntaxKind.CallExpression,
      SyntaxKind.PropertyAccessExpression,
      SyntaxKind.ElementAccessExpression
    ];
    return readOnlyKinds.includes(parent.getKind());
  }

  handle(_node: Node, _parent: Node): UsageType {
    return 'read';
  }
}

export class UsageTypeAnalyzer {
  private static handlers: UsageHandler[] = [
    new BinaryExpressionHandler(),
    new UnaryExpressionHandler(),
    new VariableDeclarationHandler(),
    new ReadOnlyHandler()
  ];

  static determineUsageType(node: Node): UsageType {
    const parent = node.getParent();
    if (!parent) {
      return 'read';
    }

    return this.findHandler(parent)?.handle(node, parent) ?? 'read';
  }

  private static findHandler(parent: Node): UsageHandler | undefined {
    return this.handlers.find(handler => handler.canHandle(parent));
  }
}