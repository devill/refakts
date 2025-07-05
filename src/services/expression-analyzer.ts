import { Node, SyntaxKind, BinaryExpression } from 'ts-morph';

export class ExpressionAnalyzer {
  needsParentheses(node: Node): boolean {
    if (!Node.isBinaryExpression(node)) {
      return false;
    }
    
    return this.isSimpleAdditionOrSubtraction(node);
  }

  formatWithParentheses(initializer: Node, _context?: Node): string {
    const initializerText = initializer.getText();
    if (this.needsParentheses(initializer)) {
      return `(${initializerText})`;
    }
    return initializerText;
  }

  private isSimpleAdditionOrSubtraction(node: Node): boolean {
    const binaryExpr = node.asKindOrThrow(SyntaxKind.BinaryExpression);
    
    if (!this.isAdditionOrSubtraction(binaryExpr)) {
      return false;
    }
    
    return this.hasSimpleOperands(binaryExpr);
  }

  private isAdditionOrSubtraction(binaryExpr: BinaryExpression): boolean {
    const operator = binaryExpr.getOperatorToken().getKind();
    return operator === SyntaxKind.PlusToken || operator === SyntaxKind.MinusToken;
  }

  private hasSimpleOperands(binaryExpr: BinaryExpression): boolean {
    const left = binaryExpr.getLeft();
    const right = binaryExpr.getRight();
    return this.areSimpleOperands(left, right);
  }

  private areSimpleOperands(left: Node, right: Node): boolean {
    return (Node.isIdentifier(left) || Node.isNumericLiteral(left)) &&
           (Node.isIdentifier(right) || Node.isNumericLiteral(right));
  }
}