import { Node, SyntaxKind } from 'ts-morph';

export class ContextAnalyzer {
  isInDestructuringPattern(node: Node): boolean {
    let parent = node.getParent();
    while (parent) {
      if (this.isDestructuringContext(parent)) {
        return true;
      }
      parent = parent.getParent();
    }
    return false;
  }

  isInTypeContext(node: Node): boolean {
    let parent = node.getParent();
    while (parent) {
      if (this.isTypeContext(parent)) {
        return true;
      }
      parent = parent.getParent();
    }
    return false;
  }

  isValidReferenceContext(node: Node): boolean {
    return !this.isInTypeContext(node) && !this.isInDestructuringPattern(node);
  }

  private isDestructuringContext(node: Node): boolean {
    return node.getKind() === SyntaxKind.ObjectBindingPattern ||
           node.getKind() === SyntaxKind.ArrayBindingPattern ||
           node.getKind() === SyntaxKind.BindingElement;
  }

  private isTypeContext(node: Node): boolean {
    return node.getKind() === SyntaxKind.TypeLiteral ||
           node.getKind() === SyntaxKind.PropertySignature ||
           node.getKind() === SyntaxKind.TypeReference;
  }
}