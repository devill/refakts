import { Node } from 'ts-morph';

export class NodeTypeClassifier {
  static isIdentifierNode(node: Node): boolean {
    return Node.isIdentifier(node);
  }

  static validateIdentifierNode(node: Node): void {
    if (!Node.isIdentifier(node)) {
      throw new Error(`Expected identifier node, got: ${node.getKindName()}`);
    }
  }
}