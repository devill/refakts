import * as ts from 'typescript';
import { Node } from 'ts-morph';

export class NodeTraversalHelper {
  

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


  static getVariableName(declaration: Node): string | undefined {
    const identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText();
  }


  static getVariableNameRequired(declaration: Node): string {
    const identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    if (!identifier) {
      throw new Error('Declaration node does not contain an identifier');
    }
    return identifier.getText();
  }


  static getDeclarationIdentifier(declaration: Node): Node | undefined {
    return declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
  }


  static isUsageNode(node: Node, variableName: string, declarationIdentifier: Node | undefined): boolean {
    return node.getKind() === ts.SyntaxKind.Identifier && 
           node.getText() === variableName && 
           node !== declarationIdentifier;
  }
}