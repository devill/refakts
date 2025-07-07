import { Node } from 'ts-morph';
import { NodeAnalyzer } from '../locators/node-analyzer';

export class ExpressionAnalyzer {
  needsParentheses(node: Node): boolean {
    return NodeAnalyzer.needsParentheses(node);
  }

  formatWithParentheses(initializer: Node, _context?: Node): string {
    const initializerText = initializer.getText();
    if (NodeAnalyzer.needsParentheses(initializer)) {
      return `(${initializerText})`;
    }
    return initializerText;
  }

}