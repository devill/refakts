import * as ts from 'typescript';
import { Node } from 'ts-morph';

/**
 * Static utility methods for traversing and matching TypeScript nodes.
 */
export class NodeTraversalHelper {
  
  /**
   * Finds a containing declaration for a node
   */
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

  /**
   * Gets the variable name from a declaration node
   */
  static getVariableName(declaration: Node): string | undefined {
    const identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText();
  }

  /**
   * Gets the variable name from a declaration node (throws if not found)
   */
  static getVariableNameRequired(declaration: Node): string {
    const identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    if (!identifier) {
      throw new Error('Declaration node does not contain an identifier');
    }
    return identifier.getText();
  }

  /**
   * Gets the declaration identifier from a declaration node
   */
  static getDeclarationIdentifier(declaration: Node): Node | undefined {
    return declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
  }

  /**
   * Checks if a node is a usage node (identifier that matches variable name but is not the declaration)
   */
  static isUsageNode(node: Node, variableName: string, declarationIdentifier: Node | undefined): boolean {
    return node.getKind() === ts.SyntaxKind.Identifier && 
           node.getText() === variableName && 
           node !== declarationIdentifier;
  }
}